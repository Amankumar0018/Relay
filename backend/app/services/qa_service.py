import json
import uuid
import re
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.models.document import Document
from app.models.knowledge import (
    ExtractedFact,
    ExtractedEntity,
    FactCitation,
    EntityRelationship,
)
from app.models.continuity import KnowledgeConflict, QuestionAnswerAudit
from app.schemas.continuity import (
    QARequest,
    QAResponse,
    QACitation,
    QAHistoryResponse,
)
from app.integrations.llm.base import BaseLLMProvider
from app.integrations.llm.gemini_provider import GeminiProvider

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "shall", "should", "will", "would",
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with",
    "about", "against", "between", "into", "through", "during", "before",
    "after", "above", "below", "from", "up", "down", "in", "out", "of", "off",
    "over", "under", "again", "further", "then", "once", "here", "there",
    "all", "any", "both", "each", "few", "more", "most", "other", "some",
    "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
    "very", "s", "t", "can", "will", "just", "don", "should", "now"
}


class QuestionAnsweringService:
    """
    Evidence-grounded conversational question answering for incoming leaders.
    Retrieves stored facts, citations, and verified excerpts from Relay's knowledge database,
    strictly enforces evidence sufficiency, and surfaces document citations.
    """

    @classmethod
    def answer_question(
        cls,
        db: Session,
        question: str,
        llm_provider: Optional[BaseLLMProvider] = None,
    ) -> QAResponse:
        """
        Processes a natural language inquiry against stored institutional knowledge.
        """
        clean_q = question.strip()

        # 1. Retrieve Candidate Facts & Entities via Keyword Matching
        tokens = [w.lower() for w in re.findall(r"\b[A-Za-z0-9_-]{3,}\b", clean_q) if w.lower() not in STOP_WORDS]

        all_facts = db.query(ExtractedFact).all()
        scored_facts: List[Tuple[int, ExtractedFact]] = []

        for fact in all_facts:
            score = 0
            stmt_lower = fact.statement.lower()
            cat_lower = fact.category.lower()

            for t in tokens:
                if t in stmt_lower:
                    score += 3
                if t in cat_lower:
                    score += 1
                if fact.primary_entity and t in fact.primary_entity.canonical_name:
                    score += 4

            if score > 0:
                scored_facts.append((score, fact))

        # Sort descending by relevance score
        scored_facts.sort(key=lambda x: x[0], reverse=True)
        relevant_facts = [f for score, f in scored_facts[:8]]

        # 2. Evidence Sufficiency Check
        if not relevant_facts or (len(tokens) > 0 and not scored_facts):
            no_evidence_msg = (
                f"Insufficient evidence in the deposited records to substantiate an answer to this inquiry. "
                f"No grounded citations, decisions, or verified facts matching '{clean_q}' were found in the institutional archive."
            )
            audit = QuestionAnswerAudit(
                id=str(uuid.uuid4()),
                question=clean_q,
                answer=no_evidence_msg,
                evidence_context_json=json.dumps({"retrieved_facts_count": 0, "tokens": tokens}),
                confidence_score=0.0,
                has_sufficient_evidence=False,
            )
            db.add(audit)
            db.commit()

            return QAResponse(
                question=clean_q,
                answer=no_evidence_msg,
                has_sufficient_evidence=False,
                confidence_score=0.0,
                citations=[],
                supporting_facts_count=0,
                conflicts_detected=[],
                created_at=audit.created_at,
            )

        # 3. Assemble Grounding Evidence Context
        citations: List[QACitation] = []
        context_lines: List[str] = []

        for fact in relevant_facts:
            doc_name = fact.document.original_filename if fact.document else "Institutional Record"
            fact_line = f"- [{fact.category.upper()}] {fact.statement} (Status: {fact.verification_status}, Source: {doc_name})"
            context_lines.append(fact_line)

            for cit in fact.citations:
                citations.append(
                    QACitation(
                        document_id=cit.document_segment.document_id if cit.document_segment else fact.document_id,
                        document_filename=doc_name,
                        source_location=cit.source_location or "Document Excerpt",
                        verbatim_quote=cit.verbatim_quote,
                        char_start=cit.char_start,
                        char_end=cit.char_end,
                        fact_id=fact.id,
                        fact_statement=fact.statement,
                    )
                )

        # 4. Check for Open Discrepancies on Retrieved Facts
        conflicts_detected: List[str] = []
        fact_ids = {f.id for f in relevant_facts}
        matching_conflicts = (
            db.query(KnowledgeConflict)
            .filter(
                KnowledgeConflict.status == "open",
                or_(
                    KnowledgeConflict.fact_a_id.in_(fact_ids),
                    KnowledgeConflict.fact_b_id.in_(fact_ids),
                ),
            )
            .all()
        )
        for c in matching_conflicts:
            conflicts_detected.append(f"{c.title}: {c.description}")

        # 5. Generate Grounded Answer
        evidence_block = "\n".join(context_lines)
        quotes_block = "\n".join(f'"{c.verbatim_quote}" ({c.document_filename}, {c.source_location})' for c in citations[:5])

        system_instruction = (
            "You are Relay's evidence-grounded organizational continuity assistant for incoming leadership. "
            "Answer the user's question using ONLY the provided verified facts and verbatim quotes below. "
            "For every key assertion, state the source document name and reference the supporting quote. "
            "If any facts are marked as contradictory or superseded, explicitly point that out. "
            "Do NOT extrapolate, hallucinate, or assume facts not present in the evidence."
        )

        prompt = f"""Question: {clean_q}

Retrieved Organizational Evidence:
{evidence_block}

Supporting Verbatim Quotations:
{quotes_block}

Provide a concise, direct, evidence-grounded answer:"""

        answer_text = ""
        llm = llm_provider
        if llm is None:
            try:
                llm = GeminiProvider()
            except Exception:
                llm = None

        if llm:
            try:
                response = llm.generate_text(
                    prompt=prompt,
                    system_instruction=system_instruction,
                    temperature=0.0,
                )
                answer_text = response.content.strip()
            except Exception as exc:
                logger.warning("LLM generation failed for Q&A, falling back to deterministic synthesis: %s", exc)
                answer_text = cls._deterministic_synthesis(relevant_facts, citations, conflicts_detected)
        else:
            answer_text = cls._deterministic_synthesis(relevant_facts, citations, conflicts_detected)

        # 6. Record Audit
        audit = QuestionAnswerAudit(
            id=str(uuid.uuid4()),
            question=clean_q,
            answer=answer_text,
            evidence_context_json=json.dumps({
                "facts": [f.statement for f in relevant_facts],
                "citations": [c.model_dump() for c in citations[:5]],
            }, default=str),
            confidence_score=0.95 if citations else 0.75,
            has_sufficient_evidence=True,
        )
        db.add(audit)
        db.commit()

        return QAResponse(
            question=clean_q,
            answer=answer_text,
            has_sufficient_evidence=True,
            confidence_score=audit.confidence_score,
            citations=citations[:8],
            supporting_facts_count=len(relevant_facts),
            conflicts_detected=conflicts_detected,
            created_at=audit.created_at,
        )

    @classmethod
    def _deterministic_synthesis(
        cls,
        facts: List[ExtractedFact],
        citations: List[QACitation],
        conflicts: List[str],
    ) -> str:
        """
        Synthesizes an evidence-grounded answer deterministically from retrieved facts.
        """
        lines = ["Based on the deposited institutional records:"]
        for f in facts[:4]:
            doc_info = f" ({f.document.original_filename})" if f.document else ""
            lines.append(f"• {f.statement}{doc_info} [Status: {f.verification_status}]")

        if citations:
            best_cit = citations[0]
            lines.append(f'\nPrimary supporting evidence: "{best_cit.verbatim_quote}" ({best_cit.document_filename}, {best_cit.source_location}).')

        if conflicts:
            lines.append("\n⚠️ Relevant matter under review:")
            for c in conflicts[:2]:
                lines.append(f"- {c}")

        return "\n".join(lines)

    @classmethod
    def get_history(cls, db: Session, limit: int = 20) -> QAHistoryResponse:
        """Retrieves recent question answering inquiries from the audit log."""
        audits = db.query(QuestionAnswerAudit).order_by(desc(QuestionAnswerAudit.created_at)).limit(limit).all()
        items = []
        for a in audits:
            try:
                ctx = json.loads(a.evidence_context_json)
                raw_cits = ctx.get("citations", [])
                cits = [QACitation.model_validate(c) for c in raw_cits]
            except Exception:
                cits = []

            items.append(
                QAResponse(
                    question=a.question,
                    answer=a.answer,
                    has_sufficient_evidence=a.has_sufficient_evidence,
                    confidence_score=a.confidence_score,
                    citations=cits,
                    supporting_facts_count=len(cits),
                    conflicts_detected=[],
                    created_at=a.created_at,
                )
            )
        return QAHistoryResponse(items=items, total=len(items))
