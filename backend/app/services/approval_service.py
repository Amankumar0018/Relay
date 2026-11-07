import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.continuity import (
    KnowledgeConflict,
    ConflictApprovalToken,
    ConflictResolutionAudit,
)
from app.schemas.continuity import ConflictStatus

logger = logging.getLogger(__name__)


class ConflictApprovalError(Exception):
    """Base exception for conflict approval workflow errors."""
    pass


class ConflictNotFoundError(ConflictApprovalError):
    pass


class ApprovalRequestNotFoundError(ConflictApprovalError):
    pass


class UnauthorizedApproverError(ConflictApprovalError):
    pass


class InvalidTokenError(ConflictApprovalError):
    pass


class TokenExpiredError(ConflictApprovalError):
    pass


class TokenAlreadyConsumedError(ConflictApprovalError):
    pass


class TokenBindingMismatchError(ConflictApprovalError):
    pass


class TokenRejectedError(ConflictApprovalError):
    pass


class ConflictApprovalService:
    """
    Manages the two-phase human approval workflow for organizational conflict resolution.
    Enforces cryptographic single-use tokens, token hashing, expiration, binding,
    and immutable audit logging.
    """

    @classmethod
    def hash_token(cls, raw_token: str) -> str:
        """Computes SHA-256 secure hash of a one-time approval token."""
        return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()

    @classmethod
    def create_approval_request(
        cls,
        db: Session,
        conflict_id: str,
        resolution_notes: str,
        proposed_status: str = "resolved",
        requesting_agent: str = "relay-knowledge-extractor",
        expires_in_minutes: Optional[int] = None,
    ) -> Tuple[ConflictApprovalToken, str]:
        """
        Creates a pending resolution approval request bound to a specific conflict.
        Generates a cryptographically random one-time token and stores ONLY its secure hash.

        Returns:
            Tuple of (database_record, raw_one_time_token)
        """
        conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict_id).first()
        if not conflict:
            raise ConflictNotFoundError(f"Conflict with ID '{conflict_id}' does not exist.")

        if conflict.status != ConflictStatus.OPEN.value:
            raise ConflictApprovalError(f"Conflict '{conflict_id}' is already {conflict.status}.")

        expiry_min = expires_in_minutes or settings.APPROVAL_TOKEN_EXPIRE_MINUTES
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_min)

        # Generate cryptographically secure one-time raw token
        raw_token = secrets.token_urlsafe(32)
        token_hash = cls.hash_token(raw_token)

        record = ConflictApprovalToken(
            id=str(uuid.uuid4()),
            conflict_id=conflict_id,
            requesting_agent=requesting_agent,
            proposed_status=proposed_status if proposed_status in ("resolved", "dismissed") else "resolved",
            resolution_notes=resolution_notes.strip(),
            token_hash=token_hash,
            status="pending",
            expires_at=expires_at,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        logger.info(
            "Created approval request %s for conflict %s (agent: %s, expires: %s)",
            record.id, conflict_id, requesting_agent, expires_at.isoformat(),
        )
        return record, raw_token

    @classmethod
    def get_pending_request(cls, db: Session, request_id: str) -> Optional[ConflictApprovalToken]:
        """Retrieves an active approval request by UUID."""
        return db.query(ConflictApprovalToken).filter(ConflictApprovalToken.id == request_id).first()

    @classmethod
    def list_pending_requests(
        cls, db: Session, conflict_id: Optional[str] = None
    ) -> List[ConflictApprovalToken]:
        """Lists pending approval requests awaiting human review."""
        query = db.query(ConflictApprovalToken).filter(ConflictApprovalToken.status == "pending")
        if conflict_id:
            query = query.filter(ConflictApprovalToken.conflict_id == conflict_id)
        return query.order_by(ConflictApprovalToken.created_at.desc()).all()

    @classmethod
    def human_adjudicate_request(
        cls,
        db: Session,
        request_id: str,
        decision: str,
        approver_id: Optional[str] = None,
        approver_auth_type: Optional[str] = None,
        operator_secret: Optional[str] = None,
        mattermost_token: Optional[str] = None,
        login_id: Optional[str] = None,
        password: Optional[str] = None,
        decision_notes: Optional[str] = None,
    ) -> Tuple[ConflictApprovalToken, Optional[KnowledgeConflict]]:
        """
        Adjudicates a pending approval request with verified human reviewer identity.

        Authentication Enforcement:
        1. If mattermost_token is provided:
           Validates session via Mattermost API (/api/v4/users/me).
           Derives approver_id directly from the verified Mattermost user profile.
           Sets approver_auth_type = "mattermost_session".
        2. If login_id and password are provided:
           Authenticates credentials via Mattermost API (/api/v4/users/login).
           Derives approver_id directly from verified user profile.
           Sets approver_auth_type = "mattermost_credentials".
        3. If operator_secret is provided:
           Validates against settings.SWITCH_OPERATOR_SECRET.
           Requires settings.SWITCH_OPERATOR_SECRET to be configured.
           Sets approver_auth_type = "switch_operator_secret".
        4. If neither or invalid:
           Rejects with UnauthorizedApproverError.
        """
        verified_approver: str
        verified_auth_type: str

        if mattermost_token and mattermost_token.strip():
            from app.services.mattermost_auth import MattermostAuthService, InvalidSessionTokenError
            try:
                profile = MattermostAuthService.verify_session_token(mattermost_token)
                verified_approver = profile["verified_approver_id"]
                verified_auth_type = "mattermost_session"
            except InvalidSessionTokenError as exc:
                logger.warning("Mattermost token adjudication rejected: %s", exc)
                raise UnauthorizedApproverError(str(exc))
        elif login_id and login_id.strip() and password:
            from app.services.mattermost_auth import (
                MattermostAuthService,
                InvalidCredentialsError,
                InvalidSessionTokenError,
                MattermostServiceUnavailableError,
            )
            try:
                profile = MattermostAuthService.login_with_credentials(login_id.strip(), password)
                verified_approver = profile["verified_approver_id"]
                verified_auth_type = "mattermost_credentials"
            except (InvalidCredentialsError, InvalidSessionTokenError) as exc:
                logger.warning("Mattermost credential adjudication rejected.")
                raise UnauthorizedApproverError("Invalid Mattermost username/email or password.")
            except MattermostServiceUnavailableError as exc:
                logger.error("Mattermost service unavailable during adjudication: %s", exc)
                raise UnauthorizedApproverError("Mattermost authentication service is unavailable.")
        elif operator_secret and operator_secret.strip():
            expected = settings.SWITCH_OPERATOR_SECRET
            if not expected or operator_secret != expected:
                logger.warning("Operator secret adjudication rejected (mismatch or unconfigured).")
                raise UnauthorizedApproverError("Invalid or missing human operator credentials.")
            verified_approver = approver_id.strip() if approver_id and approver_id.strip() else "switch_operator"
            verified_auth_type = "switch_operator_secret"
        else:
            raise UnauthorizedApproverError(
                "Authentication required: Must supply a valid Mattermost session token, account credentials, or Operator Secret."
            )

        record = db.query(ConflictApprovalToken).filter(ConflictApprovalToken.id == request_id).first()
        if not record:
            raise ApprovalRequestNotFoundError(f"Approval request '{request_id}' not found.")

        now = datetime.now(timezone.utc)
        exp = record.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if exp < now:
            record.status = "expired"
            db.commit()
            raise TokenExpiredError("Approval request has expired.")

        if record.status == "consumed":
            raise TokenAlreadyConsumedError("Approval token has already been consumed.")

        if record.status == "rejected":
            raise TokenRejectedError("Approval request was already rejected.")

        conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == record.conflict_id).first()
        if not conflict:
            raise ConflictNotFoundError(f"Underlying conflict '{record.conflict_id}' no longer exists.")

        dec_clean = decision.strip().lower()
        if dec_clean not in ("approved", "rejected"):
            raise ConflictApprovalError("Decision must be either 'approved' or 'rejected'.")

        audit_notes = decision_notes or record.resolution_notes

        if dec_clean == "rejected":
            record.status = "rejected"
            audit = ConflictResolutionAudit(
                id=str(uuid.uuid4()),
                conflict_id=record.conflict_id,
                approval_token_id=record.id,
                decision="rejected",
                approver_id=verified_approver,
                approver_auth_type=verified_auth_type,
                resolution_notes=f"[REJECTED by {verified_approver}] {audit_notes}",
                token_hash=record.token_hash,
            )
            db.add(audit)
            db.commit()
            logger.info("Conflict resolution request %s REJECTED by human %s", record.id, verified_approver)
            return record, None

        # Approved: Atomically consume token and resolve conflict
        record.status = "consumed"
        record.consumed_at = now

        conflict.status = record.proposed_status
        conflict.resolved_by = verified_approver
        conflict.resolution_notes = f"[Human Approved by {verified_approver}] {audit_notes}"
        conflict.resolved_at = now

        audit = ConflictResolutionAudit(
            id=str(uuid.uuid4()),
            conflict_id=record.conflict_id,
            approval_token_id=record.id,
            decision="approved",
            approver_id=verified_approver,
            approver_auth_type=verified_auth_type,
            resolution_notes=conflict.resolution_notes,
            token_hash=record.token_hash,
        )
        db.add(audit)
        db.commit()
        db.refresh(conflict)
        db.refresh(record)

        logger.info(
            "Conflict %s successfully RESOLVED by verified human %s (token %s consumed)",
            conflict.id, verified_approver, record.id,
        )
        return record, conflict

    @classmethod
    def verify_and_consume_token(
        cls,
        db: Session,
        conflict_id: str,
        raw_token: str,
        approver_id: str,
        approver_auth_type: str = "one_time_approval_token",
        resolution_notes: Optional[str] = None,
    ) -> KnowledgeConflict:
        """
        Validates a raw one-time approval token, checks its binding to conflict_id,
        verifies expiry and single-use status, and atomically resolves the conflict.
        """
        if not raw_token or not raw_token.strip():
            raise InvalidTokenError("One-time approval token is required.")

        token_hash = cls.hash_token(raw_token)
        record = db.query(ConflictApprovalToken).filter(
            ConflictApprovalToken.token_hash == token_hash
        ).first()

        if not record:
            raise InvalidTokenError("Approval token is invalid or unrecognized.")

        if record.conflict_id != conflict_id:
            logger.warning(
                "Token binding mismatch: token %s bound to %s, attempted on %s",
                record.id, record.conflict_id, conflict_id,
            )
            raise TokenBindingMismatchError(
                f"Approval token is bound to conflict '{record.conflict_id}', not '{conflict_id}'."
            )

        now = datetime.now(timezone.utc)
        exp = record.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if exp < now:
            record.status = "expired"
            db.commit()
            raise TokenExpiredError("Approval token has expired.")

        if record.status == "consumed":
            raise TokenAlreadyConsumedError("Approval token has already been used.")

        if record.status == "rejected":
            raise TokenRejectedError("Approval request associated with this token was rejected by the reviewer.")

        conflict = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict_id).first()
        if not conflict:
            raise ConflictNotFoundError(f"Conflict '{conflict_id}' not found.")

        # Atomic token consumption
        record.status = "consumed"
        record.consumed_at = now

        final_notes = resolution_notes or record.resolution_notes
        conflict.status = record.proposed_status
        conflict.resolved_by = approver_id.strip()
        conflict.resolution_notes = f"[Human Verified: {approver_id}] {final_notes}"
        conflict.resolved_at = now

        audit = ConflictResolutionAudit(
            id=str(uuid.uuid4()),
            conflict_id=conflict_id,
            approval_token_id=record.id,
            decision="approved",
            approver_id=approver_id.strip(),
            approver_auth_type=approver_auth_type,
            resolution_notes=conflict.resolution_notes,
            token_hash=token_hash,
        )
        db.add(audit)
        db.commit()
        db.refresh(conflict)

        logger.info(
            "Conflict %s atomically resolved with token %s by %s",
            conflict_id, record.id, approver_id,
        )
        return conflict

    @classmethod
    def get_audit_trail(cls, db: Session, conflict_id: str) -> List[ConflictResolutionAudit]:
        """Returns the chronological audit trail of human decisions for a conflict."""
        return db.query(ConflictResolutionAudit).filter(
            ConflictResolutionAudit.conflict_id == conflict_id
        ).order_by(ConflictResolutionAudit.timestamp.desc()).all()

