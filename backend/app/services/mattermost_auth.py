"""
Mattermost Session Authentication Service.

Validates session tokens, Personal Access Tokens, and account credentials
against the live Mattermost APIv4 server (/api/v4/users/me and /api/v4/users/login)
to derive genuine, cryptographically verified human identities for conflict adjudication.
"""

import logging
from typing import Optional, Dict, Any, List
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class MattermostAuthError(Exception):
    """Base exception for Mattermost authentication errors."""
    pass


class InvalidCredentialsError(MattermostAuthError):
    """Raised when user credentials or session tokens are invalid, expired, or unrecognized."""
    pass


class InvalidSessionTokenError(InvalidCredentialsError):
    """Raised when the session token is expired, invalid, or unrecognized."""
    pass


class MattermostServiceUnavailableError(MattermostAuthError):
    """Raised when the Mattermost server is unreachable or offline."""
    pass


class MattermostAuthService:
    """
    Connects to Mattermost API to verify session tokens and extract authenticated user profile.
    Guarantees that approver identity is derived from a verified session,
    never from unverified caller-supplied input.
    """

    @classmethod
    def _get_candidate_urls(cls, base_url: str) -> List[str]:
        """Resolves candidate URLs to seamlessly support Docker containers and host environments."""
        clean = base_url.rstrip("/")
        candidates = [clean]
        if "127.0.0.1" in clean:
            candidates.append(clean.replace("127.0.0.1", "host.docker.internal"))
        elif "localhost" in clean:
            candidates.append(clean.replace("localhost", "host.docker.internal"))
        elif "host.docker.internal" in clean:
            candidates.append(clean.replace("host.docker.internal", "127.0.0.1"))
        return candidates

    @classmethod
    def verify_session_token(
        cls,
        token: str,
        mattermost_api_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Validates a token against Mattermost GET /api/v4/users/me.

        Args:
            token: Mattermost session token or Personal Access Token (PAT).
            mattermost_api_url: Override base URL (e.g. for testing).
            timeout: Request timeout in seconds.

        Returns:
            Dict containing verified user profile ('id', 'username', 'email', 'roles').

        Raises:
            InvalidSessionTokenError: If token is rejected by Mattermost.
        """
        if not token or not token.strip():
            raise InvalidSessionTokenError("Mattermost session token is required.")

        clean_token = token.strip()
        configured_url = (mattermost_api_url or settings.MATTERMOST_API_URL).rstrip("/")
        req_timeout = timeout or settings.MATTERMOST_TIMEOUT_SECONDS

        headers = {
            "Authorization": f"Bearer {clean_token}",
            "User-Agent": "Relay-Backend-Auth/1.0",
        }

        candidates = cls._get_candidate_urls(configured_url)
        last_error = None

        for base_url in candidates:
            try:
                with httpx.Client(timeout=req_timeout) as client:
                    res = client.get(f"{base_url}/users/me", headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        username = data.get("username")
                        email = data.get("email")
                        user_id = data.get("id")
                        roles = data.get("roles", "")

                        if not username:
                            raise InvalidSessionTokenError("Mattermost user object missing username.")

                        logger.info("Successfully verified Mattermost human session for user: %s (%s)", username, user_id)
                        return {
                            "id": user_id,
                            "username": username,
                            "email": email,
                            "roles": roles,
                            "verified_approver_id": f"{username} ({email})" if email else username,
                            "session_token": clean_token,
                        }
                    elif res.status_code == 401:
                        logger.warning("Mattermost rejected session token (HTTP 401).")
                        raise InvalidSessionTokenError("Invalid or expired Mattermost session token.")
                    else:
                        logger.error("Mattermost API error %s: %s", res.status_code, res.text)
                        raise InvalidSessionTokenError(f"Mattermost authentication failed (HTTP {res.status_code}).")
            except httpx.ConnectError as exc:
                last_error = exc
                logger.debug("Cannot connect to candidate %s, trying next candidate...", base_url)
                continue
            except InvalidSessionTokenError:
                raise
            except Exception as exc:
                logger.error("Unexpected error validating Mattermost token: %s", exc)
                raise InvalidSessionTokenError(f"Authentication verification error: {str(exc)}")

        logger.error("Cannot connect to Mattermost API across candidates %s: %s", candidates, last_error)
        raise MattermostServiceUnavailableError("Mattermost authentication service unavailable.")

    @classmethod
    def login_with_credentials(
        cls,
        login_id: str,
        password: str,
        mattermost_api_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Authenticates a user via Mattermost POST /api/v4/users/login server-side.

        Args:
            login_id: Mattermost username or email.
            password: User password.
            mattermost_api_url: Override base URL.
            timeout: Request timeout in seconds.

        Returns:
            Dict containing verified user profile and active session token.

        Raises:
            InvalidSessionTokenError: If authentication fails.
        """
        if not login_id or not login_id.strip():
            raise InvalidSessionTokenError("Mattermost login ID (username or email) is required.")
        if not password:
            raise InvalidSessionTokenError("Mattermost password is required.")

        configured_url = (mattermost_api_url or settings.MATTERMOST_API_URL).rstrip("/")
        req_timeout = timeout or settings.MATTERMOST_TIMEOUT_SECONDS

        payload = {
            "login_id": login_id.strip(),
            "password": password,
        }

        candidates = cls._get_candidate_urls(configured_url)
        last_error = None

        for base_url in candidates:
            try:
                with httpx.Client(timeout=req_timeout) as client:
                    res = client.post(f"{base_url}/users/login", json=payload)
                    if res.status_code == 200:
                        token = res.headers.get("Token")
                        if not token:
                            # Also check Set-Cookie for MMAUTHTOKEN
                            token = res.cookies.get("MMAUTHTOKEN")
                        if not token:
                            raise InvalidSessionTokenError("Mattermost login did not return a session token.")

                        data = res.json()
                        username = data.get("username")
                        email = data.get("email")
                        user_id = data.get("id")
                        roles = data.get("roles", "")

                        logger.info("Successfully authenticated Mattermost user via credentials: %s", username)
                        return {
                            "id": user_id,
                            "username": username,
                            "email": email,
                            "roles": roles,
                            "verified_approver_id": f"{username} ({email})" if email else username,
                            "session_token": token,
                        }
                    elif res.status_code in (401, 400):
                        logger.warning("Mattermost login failed for %s (HTTP %s).", login_id, res.status_code)
                        raise InvalidCredentialsError("Invalid Mattermost username/email or password.")
                    else:
                        logger.error("Mattermost login error %s: %s", res.status_code, res.text)
                        raise InvalidCredentialsError(f"Mattermost login failed (HTTP {res.status_code}).")
            except httpx.ConnectError as exc:
                last_error = exc
                logger.debug("Cannot connect to login candidate %s, trying next candidate...", base_url)
                continue
            except (InvalidCredentialsError, InvalidSessionTokenError):
                raise
            except Exception as exc:
                logger.error("Unexpected error logging into Mattermost: %s", exc)
                raise InvalidCredentialsError(f"Authentication verification error: {str(exc)}")

        logger.error("Cannot connect to Mattermost login across candidates %s: %s", candidates, last_error)
        raise MattermostServiceUnavailableError("Mattermost authentication service unavailable.")


