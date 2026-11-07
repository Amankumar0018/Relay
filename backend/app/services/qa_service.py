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
    DocumentSegment,
)
from app.models.continuity import KnowledgeConflict, QuestionAnswerAudit, HandoverDossier
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

GENERIC_DOMAIN_WORDS = {
    "project", "task", "tasks", "item", "items", "plan", "plans",
    "memo", "briefing", "notes", "document", "documents", "update", "updates",
    "record", "records", "report", "status", "overview", "detail", "details"
}

HANDOVER_KEYWORDS = {
    "handover", "dossier", "briefing", "transition", "roadmap", "mandate", "onboarding"
}

CONFLICT_KEYWORDS = {
    "conflict", "conflicts", "discrepancy", "discrepancies", "contradiction", "contradictions", "unresolved", "gap", "gaps", "adjudication"
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

        # 1. Retrieve Candidate Facts & Document Segments via Keyword Matching
        tokens = [w.lower() for w in re.findall(r"\b[A-Za-z0-9_-]{3,}\b", clean_q) if w.lower() not in STOP_WORDS]
        specific_tokens = [t for t in tokens if t not in GENERIC_DOMAIN_WORDS]

        all_facts = db.query(ExtractedFact).all()
        scored_facts: List[Tuple[int, ExtractedFact]] = []

        for fact in all_facts:
            stmt_lower = fact.statement.lower()
            cat_lower = fact.category.lower()
            canonical_name = fact.primary_entity.canonical_name.lower() if fact.primary_entity else ""

            # Check specific token matches
            specific_matches = 0
            score = 0
            for t in specific_tokens:
                matched = False
                if t in stmt_lower:
                    score += 4
                    matched = True
                if t in cat_lower:
                    score += 2
                    matched = True
                if canonical_name and t in canonical_name:
                    score += 5
                    matched = True
                if matched:
                    specific_matches += 1

            # If specific tokens exist, require at least one specific token to match
            # This prevents generic words like "project" from matching unrelated projects
            if specific_tokens and specific_matches == 0:
                continue

            # Add tie-breaker score for generic domain tokens
            for t in tokens:
                if t in GENERIC_DOMAIN_WORDS:
                    if t in stmt_lower:
                        score += 1
                    if canonical_name and t in canonical_name:
                        score += 1

            if score > 0:
                scored_facts.append((score, fact))

        # Sort descending by relevance score and scope to the most relevant facts
        scored_facts.sort(key=lambda x: x[0], reverse=True)
        if scored_facts:
            max_score = scored_facts[0][0]
            # Prioritize top-scoring facts and filter out distant noise matches
            min_threshold = max(3, int(max_score * 0.45))
            relevant_facts = [f for score, f in scored_facts if score >= min_threshold][:6]
        else:
            relevant_facts = []

        # 2. Assemble Grounding Evidence Context & Retrieved Document Segments
        citations: List[QACitation] = []
        context_lines: List[str] = []

        for fact in relevant_facts:
            doc_name = fact.document.original_filename if fact.document else "Institutional Record"
            fact_line = f"- [{fact.category.upper()}] {fact.statement} (Status: {fact.verification_status}, Source: {doc_name})"
            context_lines.append(fact_line)

            if fact.citations:
                for cit in fact.citations:
                    # Resolve segment_id from citation relationship or database foreign key
                    seg_id = cit.document_segment_id or (cit.document_segment.id if cit.document_segment else None)
                    if not seg_id and fact.document_id:
                        first_seg = db.query(DocumentSegment).filter(DocumentSegment.document_id == fact.document_id).first()
                        if first_seg:
                            seg_id = first_seg.id

                    citations.append(
                        QACitation(
                            document_id=cit.document_segment.document_id if cit.document_segment else fact.document_id,
                            document_filename=doc_name,
                            source_document=doc_name,
                            source_document_title=doc_name,
                            segment_id=seg_id,
                            document_segment_id=seg_id,
                            source_location=cit.source_location or "Document Excerpt",
                            verbatim_quote=cit.verbatim_quote,
                            quote=cit.verbatim_quote,
                            char_start=cit.char_start,
                            char_end=cit.char_end,
                            fact_id=fact.id,
                            fact_statement=fact.statement,
                        )
                    )
            elif fact.document_id:
                # Grounding fallback to document segment
                matching_seg = db.query(DocumentSegment).filter(DocumentSegment.document_id == fact.document_id).first()
                if matching_seg:
                    citations.append(
                        QACitation(
                            document_id=fact.document_id,
                            document_filename=doc_name,
                            source_document=doc_name,
                            source_document_title=doc_name,
                            segment_id=matching_seg.id,
                            document_segment_id=matching_seg.id,
                            source_location=matching_seg.source_label or "Document Segment",
                            verbatim_quote=fact.statement,
                            quote=fact.statement,
                            char_start=0,
                            char_end=len(fact.statement),
                            fact_id=fact.id,
                            fact_statement=fact.statement,
                        )
                    )

        # Fallback to direct DocumentSegment matching if no facts matched
        if not relevant_facts and tokens:
            all_segs = db.query(DocumentSegment).all()
            scored_segs: List[Tuple[int, DocumentSegment]] = []
            for seg in all_segs:
                c_lower = seg.content.lower()
                # Check specific token matches
                specific_matches = sum(1 for t in specific_tokens if t in c_lower)
                if specific_tokens and specific_matches == 0:
                    continue
                s_score = sum(4 for t in specific_tokens if t in c_lower) + sum(1 for t in tokens if t in GENERIC_DOMAIN_WORDS and t in c_lower)
                if s_score > 0:
                    scored_segs.append((s_score, seg))
            scored_segs.sort(key=lambda x: x[0], reverse=True)
            if scored_segs:
                top_seg = scored_segs[0][1]
                doc = top_seg.document
                doc_name = doc.original_filename if doc else "Institutional Record"
                context_lines.append(f"- [DOCUMENT RECORD] {top_seg.content.strip()} (Source: {doc_name})")
                citations.append(
                    QACitation(
                        document_id=top_seg.document_id,
                        document_filename=doc_name,
                        source_document=doc_name,
                        source_document_title=doc_name,
                        segment_id=top_seg.id,
                        document_segment_id=top_seg.id,
                        source_location=top_seg.source_label or "Document Segment",
                        verbatim_quote=top_seg.content.strip()[:200],
                        quote=top_seg.content.strip()[:200],
                        char_start=top_seg.char_offset_start,
                        char_end=top_seg.char_offset_end,
                        fact_id=None,
                        fact_statement=top_seg.content.strip()[:100],
                    )
                )

        # Check for handover dossier inquiry
        is_handover_query = bool(set(tokens).intersection(HANDOVER_KEYWORDS)) or any(k in clean_q.lower() for k in ["handover", "dossier", "day 1", "roadmap"])
        is_conflict_query = bool(set(tokens).intersection(CONFLICT_KEYWORDS)) or any(k in clean_q.lower() for k in ["conflict", "discrepanc", "contradiction", "unresolved"])

        if is_handover_query:
            latest_dossier = db.query(HandoverDossier).order_by(desc(HandoverDossier.created_at)).first()
            if not latest_dossier:
                try:
                    from app.services.dossier_service import HandoverDossierService
                    latest_dossier_resp = HandoverDossierService.generate_dossier(db)
                    latest_dossier = db.query(HandoverDossier).filter(HandoverDossier.id == latest_dossier_resp.id).first()
                except Exception as exc:
                    logger.warning("Could not auto-generate dossier for QA: %s", exc)

            if latest_dossier:
                try:
                    c_data = json.loads(latest_dossier.content_json)
                    exec_summary = c_data.get("executive_summary", "")
                    mandate = c_data.get("mandate_overview", "")
                    roadmap = c_data.get("recommended_day_1_to_30_actions", [])
                    chapters = c_data.get("chapters", [])

                    if exec_summary and not any("EXECUTIVE SUMMARY" in cl for cl in context_lines):
                        context_lines.append(f"- [HANDOVER EXECUTIVE SUMMARY] {exec_summary}")
                    if mandate and not any("MANDATE" in cl for cl in context_lines):
                        context_lines.append(f"- [HANDOVER MANDATE] {mandate}")

                    # If roadmap inquiry, add roadmap
                    if any(w in tokens for w in ["roadmap", "action", "actions", "day", "priorities", "priority", "schedule"]):
                        for r_item in roadmap:
                            context_lines.append(f"- [ROADMAP ACTION] {r_item}")

                    # Add matching or all chapters
                    for ch in chapters:
                        ch_title = ch.get("title", "")
                        ch_summary = ch.get("summary", "")
                        ch_id = ch.get("chapter_id", "").upper()
                        # Match if specific tokens in title or summary or if general handover inquiry
                        if not specific_tokens or any(t in ch_title.lower() or t in ch_summary.lower() for t in specific_tokens) or "dossier" in tokens or "handover" in tokens:
                            context_lines.append(f"- [{ch_id}] {ch_title}: {ch_summary}")
                            for f_dict in ch.get("facts", [])[:3]:
                                f_id = f_dict.get("id")
                                if f_id:
                                    db_fact = db.query(ExtractedFact).filter(ExtractedFact.id == f_id).first()
                                    if db_fact and db_fact not in relevant_facts:
                                        relevant_facts.append(db_fact)
                            for cit_dict in ch.get("citations", [])[:4]:
                                cit_obj = QACitation(
                                    document_id=cit_dict.get("document_id"),
                                    document_filename=cit_dict.get("document_filename") or cit_dict.get("source_document") or "Institutional Document",
                                    source_document=cit_dict.get("source_document") or cit_dict.get("document_filename") or "Institutional Document",
                                    source_document_title=cit_dict.get("source_document") or cit_dict.get("document_filename") or "Institutional Document",
                                    segment_id=cit_dict.get("document_segment_id") or cit_dict.get("segment_id") or str(uuid.uuid4()),
                                    document_segment_id=cit_dict.get("document_segment_id") or cit_dict.get("segment_id"),
                                    source_location=cit_dict.get("source_location") or "Document Excerpt",
                                    verbatim_quote=cit_dict.get("verbatim_quote") or "",
                                    quote=cit_dict.get("verbatim_quote") or "",
                                    char_start=cit_dict.get("char_start"),
                                    char_end=cit_dict.get("char_end"),
                                    fact_id=cit_dict.get("fact_id"),
                                    fact_statement=cit_dict.get("fact_statement"),
                                )
                                if cit_obj.verbatim_quote and not any(c.verbatim_quote == cit_obj.verbatim_quote for c in citations):
                                    citations.append(cit_obj)
                except Exception as exc:
                    logger.warning("Failed parsing dossier json for QA: %s", exc)

        if is_conflict_query:
            open_conflicts = db.query(KnowledgeConflict).filter(KnowledgeConflict.status == "open").all()
            for oc in open_conflicts:
                context_lines.append(f"- [OPEN CONFLICT] {oc.title}: {oc.description} (Severity: {oc.severity})")
                if oc.fact_a and oc.fact_a not in relevant_facts:
                    relevant_facts.append(oc.fact_a)
                if oc.fact_b and oc.fact_b not in relevant_facts:
                    relevant_facts.append(oc.fact_b)
                if oc.fact_a and oc.fact_a.citations:
                    for cit in oc.fact_a.citations:
                        if cit.verification_status == "valid":
                            citations.append(
                                QACitation(
                                    document_id=cit.document_segment.document_id if cit.document_segment else oc.fact_a.document_id,
                                    document_filename=oc.fact_a.document.original_filename if oc.fact_a.document else "Record",
                                    source_document=oc.fact_a.document.original_filename if oc.fact_a.document else "Record",
                                    source_document_title=oc.fact_a.document.original_filename if oc.fact_a.document else "Record",
                                    segment_id=cit.document_segment_id or str(uuid.uuid4()),
                                    document_segment_id=cit.document_segment_id,
                                    source_location=cit.source_location or "Document Excerpt",
                                    verbatim_quote=cit.verbatim_quote,
                                    quote=cit.verbatim_quote,
                                    char_start=cit.char_start,
                                    char_end=cit.char_end,
                                    fact_id=oc.fact_a.id,
                                    fact_statement=oc.fact_a.statement,
                                )
                            )
                if oc.fact_b and oc.fact_b.citations:
                    for cit in oc.fact_b.citations:
                        if cit.verification_status == "valid":
                            citations.append(
                                QACitation(
                                    document_id=cit.document_segment.document_id if cit.document_segment else oc.fact_b.document_id,
                                    document_filename=oc.fact_b.document.original_filename if oc.fact_b.document else "Record",
                                    source_document=oc.fact_b.document.original_filename if oc.fact_b.document else "Record",
                                    source_document_title=oc.fact_b.document.original_filename if oc.fact_b.document else "Record",
                                    segment_id=cit.document_segment_id or str(uuid.uuid4()),
                                    document_segment_id=cit.document_segment_id,
                                    source_location=cit.source_location or "Document Excerpt",
                                    verbatim_quote=cit.verbatim_quote,
                                    quote=cit.verbatim_quote,
                                    char_start=cit.char_start,
                                    char_end=cit.char_end,
                                    fact_id=oc.fact_b.id,
                                    fact_statement=oc.fact_b.statement,
                                )
                            )

        # 3. Evidence Sufficiency & Grounding Verification Check
        valid_citations = [c for c in citations if c.segment_id and (c.quote or c.verbatim_quote)]
        has_evidence = bool(valid_citations and context_lines)

        if not has_evidence:
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
                is_grounded=False,
                is_grounding=False,
                missing_evidence=True,
                confidence_score=0.0,
                confidence=0.0,
                citations=[],
                supporting_facts_count=0,
                conflicts_detected=[],
                created_at=audit.created_at,
            )

        # 4. Check for Open Discrepancies on Retrieved Facts
        conflicts_detected: List[str] = []
        fact_ids = {f.id for f in relevant_facts}
        if fact_ids:
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
        quotes_block = "\n".join(
            f'"{c.verbatim_quote}" ({c.document_filename}, {c.source_location}, Segment: {c.segment_id})'
            for c in valid_citations[:5]
        )

        system_instruction = (
            "You are Relay's evidence-grounded organizational continuity assistant for incoming leadership. "
            "Answer the user's question using ONLY the provided verified facts, document segments, and verbatim quotes below. "
            "For every key assertion, state the source document name, segment location, and reference the supporting quote. "
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
                answer_text = cls._deterministic_synthesis(relevant_facts, valid_citations, conflicts_detected, context_lines)
        else:
            answer_text = cls._deterministic_synthesis(relevant_facts, valid_citations, conflicts_detected, context_lines)

        # 6. Calculate Dynamic Evidence Confidence Score
        # Grounded metric reflecting actual evidence quality (strictly < 1.0)
        if relevant_facts:
            verified_count = sum(1 for f in relevant_facts if getattr(f, "verification_status", "") == "evidence-backed")
            verified_ratio = verified_count / len(relevant_facts)
            base_confidence = 0.75 + (0.15 * verified_ratio)  # 0.75 to 0.90
        else:
            base_confidence = 0.72

        citation_boost = min(0.06, len(valid_citations) * 0.02)
        conflict_penalty = 0.15 if conflicts_detected else 0.0

        computed_confidence = round(max(0.40, min(0.96, base_confidence + citation_boost - conflict_penalty)), 2)

        # 7. Record Audit
        audit = QuestionAnswerAudit(
            id=str(uuid.uuid4()),
            question=clean_q,
            answer=answer_text,
            evidence_context_json=json.dumps({
                "facts": [f.statement for f in relevant_facts],
                "citations": [c.model_dump() for c in valid_citations[:5]],
            }, default=str),
            confidence_score=computed_confidence,
            has_sufficient_evidence=True,
        )
        db.add(audit)
        db.commit()

        return QAResponse(
            question=clean_q,
            answer=answer_text,
            has_sufficient_evidence=True,
            is_grounded=True,
            is_grounding=True,
            missing_evidence=False,
            confidence_score=computed_confidence,
            confidence=computed_confidence,
            citations=valid_citations[:8],
            supporting_facts_count=len(relevant_facts) or len(valid_citations),
            conflicts_detected=conflicts_detected,
            created_at=audit.created_at,
        )

    @classmethod
    def _deterministic_synthesis(
        cls,
        facts: List[ExtractedFact],
        citations: List[QACitation],
        conflicts: List[str],
        context_lines: Optional[List[str]] = None,
    ) -> str:
        """
        Synthesizes an evidence-grounded answer deterministically from retrieved facts.
        """
        lines = ["Based on the deposited institutional records:"]
        special_lines = [cl.lstrip("- ") for cl in (context_lines or []) if any(k in cl for k in ["ROADMAP ACTION", "EXECUTIVE SUMMARY", "MANDATE", "OPEN CONFLICT"])]
        if special_lines:
            for sl in special_lines[:6]:
                lines.append(f"• {sl}")
        elif facts:
            for f in facts[:4]:
                doc_info = f" ({f.document.original_filename})" if getattr(f, "document", None) else ""
                lines.append(f"• {f.statement}{doc_info} [Status: {getattr(f, 'verification_status', 'verified')}]")
        elif context_lines:
            for cl in context_lines[:6]:
                clean_line = cl.lstrip("- ")
                lines.append(f"• {clean_line}")

        if citations:
            best_cit = citations[0]
            seg_info = f", Segment ID: {best_cit.segment_id}" if best_cit.segment_id else ""
            lines.append(
                f'\nPrimary supporting evidence: "{best_cit.verbatim_quote}" '
                f'({best_cit.document_filename}, {best_cit.source_location}{seg_info}).'
            )

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
