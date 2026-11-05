import hashlib
from typing import List, Dict, Any, Optional

EXTRACTION_PROMPT_VERSION = "relay-extraction-v1"

EXTRACTION_SYSTEM_INSTRUCTION = """You are an expert organizational continuity analyst for Relay.
Your mission is to extract structured, evidence-grounded institutional knowledge from the supplied document segments.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. Grounding Invariant: Extract ONLY information explicitly and directly supported by the supplied document segments.
2. Exact Quotations: For every fact and relationship citation, you MUST provide the exact verbatim quote and the matching segment_id.
   Never fabricate or paraphrase a quote. Never invent segment IDs.
3. Decisions vs. Proposals: Distinguish finalized decisions from open proposals, debates, or ideas. Only classify confirmed conclusions as decisions.
4. Responsibilities vs. Suggestions: Distinguish formally assigned duties and role handovers from informal suggestions or ideas.
5. Commitments vs. Intentions: Distinguish binding obligations and contractual/agreed milestones from general statements of goodwill or aspiration.
6. Deadlines: Preserve deadline statements exactly as expressed in the source text (e.g., 'EOQ Q3', 'November 15, 2026', 'by close of business Friday') before any normalization.
7. Risks vs. Incidents: Distinguish potential risks, threats, or vulnerabilities from events or incidents that have already occurred.
8. Entity Precision:
   - Identify canonical entities across categories: person, role, organization, project, initiative, vendor, committee, asset.
   - Do NOT invent entities or extrapolate unstated entities.
   - Preserve original names and surface forms in entity mentions.
9. Relationships:
   - Identify directed relationships connecting extracted entities:
     * TRANSFERS_TO: Responsibility or asset transfer from source to target.
     * REPORTS_TO: Direct hierarchical reporting line.
     * OWNS: Direct stewardship, leadership, or ownership of a project/asset.
     * BLOCKS: Dependency where source prevents or impedes progress on target.
     * CONTRADICTS: Direct factual contradiction between statements or commitments.
10. Inferences: If a claim is an explicit logical deduction rather than a direct verbatim statement, you MUST set is_inference=true.
11. No Manufactured Content: If a category has no supported findings in the text, return an empty array [].
12. Status Neutrality: Do NOT assign or predict database verification statuses. Relay's automated evidence engine verifies all citations independently."""

EXTRACTION_USER_PROMPT_TEMPLATE = """Analyze the following document segments and extract candidate institutional knowledge.

Document: {document_title}

Document Segments:
{segments_block}

Extract all explicitly supported facts, entities, and relationships according to the system instructions.
Return the result adhering strictly to the JSON schema."""


def compute_prompt_hash(
    system_instruction: Optional[str] = None,
    user_prompt_template: Optional[str] = None,
) -> str:
    """
    Computes a deterministic SHA-256 hash over the static prompt template definition.
    Crucial: Computes hash over template structures, NOT dynamic document data,
    ensuring confidentiality and reproducible telemetry across extraction runs.
    """
    sys_text = (system_instruction or EXTRACTION_SYSTEM_INSTRUCTION).strip()
    user_text = (user_prompt_template or EXTRACTION_USER_PROMPT_TEMPLATE).strip()
    canonical_repr = f"SYS:\n{sys_text}\n---\nUSER_TEMPLATE:\n{user_text}"
    return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()


# Precomputed static hash for the canonical prompt version
EXTRACTION_PROMPT_HASH = compute_prompt_hash()


def format_extraction_prompt(
    document_title: str,
    segments: List[Dict[str, Any]],
) -> str:
    """
    Renders the extraction prompt with document segments formatted with their segment IDs.
    """
    formatted_segments = []
    for seg in segments:
        seg_id = seg.get("id") or seg.get("segment_id", "unknown")
        label = seg.get("source_label") or f"Sequence {seg.get('sequence_number', '')}"
        content = seg.get("content", "").strip()
        formatted_segments.append(f"--- Segment ID: {seg_id} ({label}) ---\n{content}\n")

    segments_block = "\n".join(formatted_segments)
    return EXTRACTION_USER_PROMPT_TEMPLATE.format(
        document_title=document_title or "Untitled Document",
        segments_block=segments_block,
    )
