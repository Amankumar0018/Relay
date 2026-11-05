from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session

from app.models.knowledge import DocumentSegment
from app.schemas.knowledge import FactVerificationStatus
from app.schemas.extraction import (
    RawCitationReference,
    RawFactExtraction,
    DocumentExtractionPayload,
)
from app.schemas.grounding import (
    GroundingStatus,
    GroundingResult,
    FactGroundingResult,
    GroundedExtractionPayload,
)


class EvidenceGroundingService:
    """
    Deterministic Evidence Grounding Engine for Relay.
    Validates candidate LLM citations against actual source document segments,
    computes exact segment-relative character offsets, handles whitespace
    normalization with coordinate mapping, and rejects ambiguous or ungrounded claims.
    """

    @staticmethod
    def build_normalized_map(orig: str) -> Tuple[str, List[int], List[int]]:
        """
        Builds a whitespace-normalized version of `orig` along with bidirectional
        character offset mappings back to the original string.

        Collapses any sequence of whitespace characters (spaces, tabs, newlines, etc.)
        into a single space ' ' and strips leading and trailing whitespace.

        Returns:
            norm_str: Normalized string
            norm_to_orig_start: For each char in norm_str, original start offset in `orig`
            norm_to_orig_end: For each char in norm_str, original exclusive end offset in `orig`
        """
        norm_chars: List[str] = []
        starts: List[int] = []
        ends: List[int] = []

        i = 0
        n = len(orig)
        in_ws = False
        ws_start = 0

        while i < n:
            c = orig[i]
            if c.isspace():
                if not in_ws:
                    in_ws = True
                    ws_start = i
                i += 1
            else:
                if in_ws:
                    if norm_chars:
                        norm_chars.append(" ")
                        starts.append(ws_start)
                        ends.append(i)
                    in_ws = False
                norm_chars.append(c)
                starts.append(i)
                ends.append(i + 1)
                i += 1

        norm_str = "".join(norm_chars)
        return norm_str, starts, ends

    @staticmethod
    def _find_all(haystack: str, needle: str) -> List[int]:
        """
        Finds all start indices of `needle` in `haystack`.
        """
        if not needle or not haystack:
            return []
        matches: List[int] = []
        start = 0
        while True:
            idx = haystack.find(needle, start)
            if idx == -1:
                break
            matches.append(idx)
            start = idx + 1
        return matches

    def _disambiguate_exact(
        self,
        content: str,
        quote: str,
        matches: List[int],
        context: Optional[str],
    ) -> Optional[int]:
        """
        Disambiguates multiple exact quote matches in content using surrounding context.
        Returns the unique match start index if resolved, or None if ambiguous.
        """
        if not context or not context.strip():
            return None

        ctx_cleaned = context.strip()

        # Try exact search for context in content
        ctx_matches = self._find_all(content, ctx_cleaned)
        if len(ctx_matches) == 1:
            c_start = ctx_matches[0]
            c_end = c_start + len(ctx_cleaned)
            contained = [m for m in matches if m >= c_start and m + len(quote) <= c_end]
            if len(contained) == 1:
                return contained[0]

        # If exact context search failed or matched multiple times, try normalized context search
        norm_content, starts, ends = self.build_normalized_map(content)
        norm_ctx, _, _ = self.build_normalized_map(ctx_cleaned)
        if not norm_ctx:
            return None

        norm_ctx_matches = self._find_all(norm_content, norm_ctx)
        if len(norm_ctx_matches) == 1:
            idx = norm_ctx_matches[0]
            c_orig_start = starts[idx]
            c_orig_end = ends[idx + len(norm_ctx) - 1]
            contained = [m for m in matches if m >= c_orig_start and m + len(quote) <= c_orig_end]
            if len(contained) == 1:
                return contained[0]

        return None

    def _disambiguate_normalized(
        self,
        norm_content: str,
        norm_quote: str,
        norm_matches: List[int],
        context: Optional[str],
    ) -> Optional[int]:
        """
        Disambiguates multiple normalized quote matches in norm_content using surrounding context.
        Returns the unique match index in norm_content if resolved, or None if ambiguous.
        """
        if not context or not context.strip():
            return None

        norm_ctx, _, _ = self.build_normalized_map(context.strip())
        if not norm_ctx:
            return None

        norm_ctx_matches = self._find_all(norm_content, norm_ctx)
        if len(norm_ctx_matches) == 1:
            c_start = norm_ctx_matches[0]
            c_end = c_start + len(norm_ctx)
            contained = [m for m in norm_matches if m >= c_start and m + len(norm_quote) <= c_end]
            if len(contained) == 1:
                return contained[0]

        return None

    def match_quote_in_content(
        self,
        content: str,
        quote: str,
        source_context: Optional[str] = None,
    ) -> GroundingResult:
        """
        Matches a candidate quote against source text content using a two-tier strategy:
          Tier 1: Exact substring search with deterministic context disambiguation.
          Tier 2: Normalized-to-original index mapping for whitespace differences.

        Ensures:
          If is_valid is True, content[char_start:char_end] == verbatim_quote.
        """
        if not quote or not quote.strip():
            return GroundingResult(
                is_valid=False,
                status=GroundingStatus.REJECTED_EMPTY_QUOTE,
                rejection_reason="Proposed quotation is empty or whitespace-only",
            )

        target_quote = quote.strip()

        # -------------------------------------------------------------
        # Tier 1: Exact Substring Matching
        # -------------------------------------------------------------
        exact_matches = self._find_all(content, target_quote)

        if len(exact_matches) == 1:
            start = exact_matches[0]
            end = start + len(target_quote)
            verbatim_slice = content[start:end]
            return GroundingResult(
                is_valid=True,
                status=GroundingStatus.VALID_EXACT,
                char_start=start,
                char_end=end,
                verbatim_quote=verbatim_slice,
            )

        if len(exact_matches) > 1:
            resolved_start = self._disambiguate_exact(
                content=content,
                quote=target_quote,
                matches=exact_matches,
                context=source_context,
            )
            if resolved_start is not None:
                start = resolved_start
                end = start + len(target_quote)
                verbatim_slice = content[start:end]
                return GroundingResult(
                    is_valid=True,
                    status=GroundingStatus.VALID_EXACT,
                    char_start=start,
                    char_end=end,
                    verbatim_quote=verbatim_slice,
                )
            else:
                reason = (
                    f"Quote occurs {len(exact_matches)} times in segment and could not be uniquely disambiguated"
                )
                if not source_context or not source_context.strip():
                    reason += " (no source_context provided)"
                else:
                    reason += " using provided source_context"
                return GroundingResult(
                    is_valid=False,
                    status=GroundingStatus.REJECTED_AMBIGUOUS_MATCH,
                    rejection_reason=reason,
                )

        # -------------------------------------------------------------
        # Tier 2: Normalized-to-Original Index Mapping
        # -------------------------------------------------------------
        norm_content, starts, ends = self.build_normalized_map(content)
        norm_quote, _, _ = self.build_normalized_map(target_quote)

        if not norm_quote:
            return GroundingResult(
                is_valid=False,
                status=GroundingStatus.REJECTED_EMPTY_QUOTE,
                rejection_reason="Normalized quote is empty",
            )

        norm_matches = self._find_all(norm_content, norm_quote)

        if len(norm_matches) == 1:
            idx = norm_matches[0]
            start = starts[idx]
            end = ends[idx + len(norm_quote) - 1]
            verbatim_slice = content[start:end]

            # Invariant check: normalized slice must match normalized quote
            norm_slice, _, _ = self.build_normalized_map(verbatim_slice)
            if norm_slice != norm_quote:
                return GroundingResult(
                    is_valid=False,
                    status=GroundingStatus.REJECTED_QUOTE_NOT_FOUND,
                    rejection_reason="Normalized source slice does not match normalized quote",
                )

            return GroundingResult(
                is_valid=True,
                status=GroundingStatus.VALID_NORMALIZED,
                char_start=start,
                char_end=end,
                verbatim_quote=verbatim_slice,
            )

        if len(norm_matches) > 1:
            resolved_idx = self._disambiguate_normalized(
                norm_content=norm_content,
                norm_quote=norm_quote,
                norm_matches=norm_matches,
                context=source_context,
            )
            if resolved_idx is not None:
                start = starts[resolved_idx]
                end = ends[resolved_idx + len(norm_quote) - 1]
                verbatim_slice = content[start:end]
                return GroundingResult(
                    is_valid=True,
                    status=GroundingStatus.VALID_NORMALIZED,
                    char_start=start,
                    char_end=end,
                    verbatim_quote=verbatim_slice,
                )
            else:
                reason = (
                    f"Quote matches {len(norm_matches)} times after whitespace normalization and could not be uniquely disambiguated"
                )
                if not source_context or not source_context.strip():
                    reason += " (no source_context provided)"
                else:
                    reason += " using provided source_context"
                return GroundingResult(
                    is_valid=False,
                    status=GroundingStatus.REJECTED_AMBIGUOUS_MATCH,
                    rejection_reason=reason,
                )

        # len(norm_matches) == 0
        return GroundingResult(
            is_valid=False,
            status=GroundingStatus.REJECTED_QUOTE_NOT_FOUND,
            rejection_reason="Quote not found in segment content",
        )

    def ground_citation(
        self,
        document_id: str,
        proposed_citation: RawCitationReference,
        db: Session,
        segment_cache: Optional[Dict[str, DocumentSegment]] = None,
    ) -> GroundingResult:
        """
        Validates citation ownership, fetches the target DocumentSegment,
        and executes quote matching against original segment content.
        """
        # 1. Fetch segment from cache or database
        segment: Optional[DocumentSegment] = None
        if segment_cache is not None and proposed_citation.segment_id in segment_cache:
            segment = segment_cache[proposed_citation.segment_id]
        else:
            segment = (
                db.query(DocumentSegment)
                .filter(DocumentSegment.id == proposed_citation.segment_id)
                .first()
            )
            if segment and segment_cache is not None:
                segment_cache[segment.id] = segment

        # 2. Confirm segment exists
        if segment is None:
            return GroundingResult(
                is_valid=False,
                status=GroundingStatus.REJECTED_SEGMENT_NOT_FOUND,
                segment_id=proposed_citation.segment_id,
                rejection_reason=f"DocumentSegment '{proposed_citation.segment_id}' does not exist",
            )

        # 3. Confirm segment belongs to the target document
        if segment.document_id != document_id:
            return GroundingResult(
                is_valid=False,
                status=GroundingStatus.REJECTED_FOREIGN_DOCUMENT,
                segment_id=proposed_citation.segment_id,
                rejection_reason=(
                    f"Segment '{proposed_citation.segment_id}' belongs to document "
                    f"'{segment.document_id}', not target document '{document_id}'"
                ),
            )

        # 4. Perform quote matching
        match_res = self.match_quote_in_content(
            content=segment.content,
            quote=proposed_citation.quote,
            source_context=proposed_citation.source_context,
        )

        # 5. Determine source location label
        loc_label = segment.source_label
        if not loc_label:
            if segment.page_number and segment.section_title:
                loc_label = f"Page {segment.page_number}, {segment.section_title}"
            elif segment.page_number:
                loc_label = f"Page {segment.page_number}"
            elif segment.section_title:
                loc_label = segment.section_title
            else:
                loc_label = f"Segment {segment.sequence_number}"

        # 6. Construct complete GroundingResult
        if match_res.is_valid:
            # Slicing invariant assertion
            assert segment.content[match_res.char_start:match_res.char_end] == match_res.verbatim_quote
            return GroundingResult(
                is_valid=True,
                status=match_res.status,
                segment_id=segment.id,
                char_start=match_res.char_start,
                char_end=match_res.char_end,
                verbatim_quote=match_res.verbatim_quote,
                source_location=loc_label,
            )
        else:
            return GroundingResult(
                is_valid=False,
                status=match_res.status,
                segment_id=segment.id,
                rejection_reason=match_res.rejection_reason,
                source_location=loc_label,
            )

    def ground_citation_in_segment(
        self,
        segment: DocumentSegment,
        proposed_citation: RawCitationReference,
        document_id: Optional[str] = None,
    ) -> GroundingResult:
        """
        Direct in-memory grounding against an already loaded DocumentSegment.
        Validates segment ID match, optional document ownership, and runs quote verification.
        """
        if segment.id != proposed_citation.segment_id:
            return GroundingResult(
                is_valid=False,
                status=GroundingStatus.REJECTED_SEGMENT_NOT_FOUND,
                segment_id=proposed_citation.segment_id,
                rejection_reason=(
                    f"Segment ID mismatch: citation references '{proposed_citation.segment_id}', "
                    f"provided segment has id '{segment.id}'"
                ),
            )

        if document_id is not None and segment.document_id != document_id:
            return GroundingResult(
                is_valid=False,
                status=GroundingStatus.REJECTED_FOREIGN_DOCUMENT,
                segment_id=proposed_citation.segment_id,
                rejection_reason=(
                    f"Segment '{segment.id}' belongs to document "
                    f"'{segment.document_id}', not target document '{document_id}'"
                ),
            )

        match_res = self.match_quote_in_content(
            content=segment.content,
            quote=proposed_citation.quote,
            source_context=proposed_citation.source_context,
        )

        loc_label = segment.source_label or (
            f"Page {segment.page_number}" if segment.page_number else f"Segment {segment.sequence_number}"
        )

        if match_res.is_valid:
            assert segment.content[match_res.char_start:match_res.char_end] == match_res.verbatim_quote
            return GroundingResult(
                is_valid=True,
                status=match_res.status,
                segment_id=segment.id,
                char_start=match_res.char_start,
                char_end=match_res.char_end,
                verbatim_quote=match_res.verbatim_quote,
                source_location=loc_label,
            )
        else:
            return GroundingResult(
                is_valid=False,
                status=match_res.status,
                segment_id=segment.id,
                rejection_reason=match_res.rejection_reason,
                source_location=loc_label,
            )

    def ground_fact(
        self,
        document_id: str,
        proposed_fact: RawFactExtraction,
        db: Session,
        segment_cache: Optional[Dict[str, DocumentSegment]] = None,
    ) -> FactGroundingResult:
        """
        Grounds all candidate citations for a fact assertion and evaluates
        its disposition policy (evidence-backed vs. inferred vs. rejected).
        Ensures inferred facts can never receive evidence-backed status.
        """
        citation_results: List[GroundingResult] = []
        for cit in proposed_fact.citations:
            res = self.ground_citation(
                document_id=document_id,
                proposed_citation=cit,
                db=db,
                segment_cache=segment_cache,
            )
            citation_results.append(res)

        valid_count = sum(1 for r in citation_results if r.is_valid)
        rejected_count = sum(1 for r in citation_results if not r.is_valid)

        # Evaluate disposition policy per Architecture Specification Section 2.3
        if proposed_fact.is_inference:
            # An explicit inference can NEVER be marked evidence-backed
            is_supported = False
            verification_status = FactVerificationStatus.INFERRED
            if valid_count > 0:
                disposition_notes = (
                    f"Fact is an explicit inference ({valid_count} citation(s) grounded, "
                    f"{rejected_count} rejected). Preserved as inferred, not established fact."
                )
            else:
                disposition_notes = (
                    "Fact marked as inference; no citations verified or provided."
                )
        elif valid_count > 0 and rejected_count == 0:
            is_supported = True
            verification_status = FactVerificationStatus.EVIDENCE_BACKED
            disposition_notes = f"All {valid_count} citation(s) verified with exact segment grounding."
        elif valid_count > 0 and rejected_count > 0:
            is_supported = True
            verification_status = FactVerificationStatus.EVIDENCE_BACKED
            disposition_notes = (
                f"Partially supported: {valid_count} citation(s) verified, "
                f"{rejected_count} citation(s) rejected."
            )
        else:
            # 0 valid citations and not an inference
            is_supported = False
            verification_status = FactVerificationStatus.REJECTED
            disposition_notes = (
                "Fact rejected from established knowledge: 0 valid supporting citations."
            )

        cat_val = (
            proposed_fact.category.value
            if hasattr(proposed_fact.category, "value")
            else str(proposed_fact.category)
        )

        return FactGroundingResult(
            statement=proposed_fact.statement,
            category=cat_val,
            is_supported=is_supported,
            verification_status=verification_status,
            citations=citation_results,
            valid_citation_count=valid_count,
            rejected_citation_count=rejected_count,
            is_inference=proposed_fact.is_inference,
            disposition_notes=disposition_notes,
        )

    def ground_payload(
        self,
        document_id: str,
        payload: DocumentExtractionPayload,
        db: Session,
    ) -> GroundedExtractionPayload:
        """
        Grounds an entire DocumentExtractionPayload against target document segments.
        Preloads segments into cache to minimize database roundtrips.
        """
        segments = (
            db.query(DocumentSegment)
            .filter(DocumentSegment.document_id == document_id)
            .all()
        )
        segment_cache = {s.id: s for s in segments}

        grounded_facts: List[FactGroundingResult] = []
        total_verified = 0
        total_rejected = 0

        for fact in payload.facts:
            res = self.ground_fact(
                document_id=document_id,
                proposed_fact=fact,
                db=db,
                segment_cache=segment_cache,
            )
            grounded_facts.append(res)
            total_verified += res.valid_citation_count
            total_rejected += res.rejected_citation_count

        supported_count = sum(1 for f in grounded_facts if f.is_supported)
        inferred_count = sum(1 for f in grounded_facts if f.verification_status == FactVerificationStatus.INFERRED)
        rejected_count = sum(1 for f in grounded_facts if f.verification_status == FactVerificationStatus.REJECTED)

        return GroundedExtractionPayload(
            document_id=document_id,
            facts=grounded_facts,
            total_facts=len(grounded_facts),
            supported_facts=supported_count,
            inferred_facts=inferred_count,
            rejected_facts=rejected_count,
            total_citations_verified=total_verified,
            total_citations_rejected=total_rejected,
        )
