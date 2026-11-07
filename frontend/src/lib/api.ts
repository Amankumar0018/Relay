/**
 * Centralized API configuration for Relay frontend.
 * Prepares the application for current and future FastAPI backend endpoints.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  root: `${API_BASE_URL}/`,
  health: `${API_BASE_URL}/health`,
  documents: `${API_BASE_URL}/api/v1/documents`,
  intelligence: `${API_BASE_URL}/api/v1/intelligence`,
  conflicts: `${API_BASE_URL}/api/v1/intelligence/conflicts`,
  gaps: `${API_BASE_URL}/api/v1/gaps`,
  continuity: `${API_BASE_URL}/api/v1/continuity/overview`,
  responsibilities: `${API_BASE_URL}/api/v1/responsibilities`,
  handovers: `${API_BASE_URL}/api/v1/handovers`,
  qa: `${API_BASE_URL}/api/v1/qa`,
  agents: `${API_BASE_URL}/api/v1/agents/ask`,
} as const;

export interface HealthCheckData {
  status: string;
  database: string;
  environment: string;
  version: string;
}

export interface IngestedDocument {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_extension: string;
  content_type: string;
  file_size: number;
  sha256_hash: string;
  character_count?: number;
  word_count?: number;
  extraction_status: "pending" | "completed" | "failed";
  extraction_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestedDocumentDetail extends IngestedDocument {
  storage_path: string;
  extracted_text?: string | null;
}

export interface DocumentTextData {
  id: string;
  original_filename: string;
  extraction_status: string;
  character_count: number;
  word_count: number;
  extracted_text?: string | null;
  extraction_error?: string | null;
}

export interface DocumentListResult {
  items: IngestedDocument[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentUploadResult {
  success: boolean;
  message: string;
  document: IngestedDocument;
}

// =============================================================================
// Knowledge & Extraction Types
// =============================================================================

export interface FactCitationDetail {
  id: string;
  fact_id: string;
  document_segment_id: string;
  verbatim_quote: string;
  source_location: string;
  char_start?: number | null;
  char_end?: number | null;
  verification_status: string;
  document_filename?: string | null;
}

export interface ExtractedFactDetail {
  id: string;
  document_id: string;
  primary_entity_id?: string | null;
  category: string;
  statement: string;
  verification_status: string;
  confidence_score: number;
  deadline?: string | null;
  financial_value?: number | null;
  financial_currency?: string | null;
  citations?: FactCitationDetail[];
  document_filename?: string | null;
}

export interface ExtractedEntityDetail {
  id: string;
  name: string;
  canonical_name: string;
  category: string;
}

export interface EntityRelationshipDetail {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  confidence_score?: number;
}

export interface DocumentKnowledge {
  document_id: string;
  original_filename: string;
  extraction_status: string;
  facts: ExtractedFactDetail[];
  entities: ExtractedEntityDetail[];
  relationships: EntityRelationshipDetail[];
  total_facts: number;
  total_entities: number;
  total_relationships: number;
}

export interface ExtractionRunData {
  id: string;
  document_id: string;
  provider_name: string;
  model_name: string;
  status: string;
  facts_extracted: number;
  entities_extracted: number;
  relationships_extracted: number;
  citations_created: number;
  citations_rejected: number;
  execution_duration_ms: number;
  created_at: string;
}

export interface DocumentExtractionResult {
  success: boolean;
  message: string;
  run_id: string;
  document_id: string;
  facts_extracted: number;
  entities_extracted: number;
  relationships_extracted: number;
  citations_created: number;
  citations_rejected: number;
  execution_duration_ms: number;
}

// =============================================================================
// Conflict & Organizational Intelligence Types
// =============================================================================

export interface KnowledgeConflict {
  id: string;
  conflict_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved" | "dismissed";
  title: string;
  description: string;
  fact_a_id?: string | null;
  fact_b_id?: string | null;
  entity_id?: string | null;
  document_id?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
  updated_at: string;
  fact_a?: ExtractedFactDetail | null;
  fact_b?: ExtractedFactDetail | null;
  entity_name?: string | null;
  document_filename?: string | null;
}

export interface ConflictListResult {
  items: KnowledgeConflict[];
  total: number;
  open_count: number;
  critical_count: number;
}

// =============================================================================
// Continuity Assessment Types
// =============================================================================

export interface OwnedProject {
  entity_id: string;
  name: string;
  category: string;
  description?: string | null;
  risk_level: string;
  dependencies_count: number;
}

export interface ReportingRelationship {
  source_entity_id: string;
  source_entity_name: string;
  target_entity_id: string;
  target_entity_name: string;
  relation_type: string;
}

export interface CriticalBlocker {
  fact_id: string;
  statement: string;
  severity: string;
  category: string;
  deadline?: string | null;
  citations_count: number;
  document_filename?: string | null;
}

export interface ContinuityOverview {
  continuity_score: number;
  readiness_status: "ON_TRACK" | "ATTENTION_REQUIRED" | "CRITICAL_RISK";
  total_documents_deposited: number;
  total_facts_extracted: number;
  total_entities_indexed: number;
  active_conflicts_count: number;
  critical_blockers_count: number;
  outgoing_leader?: string | null;
  incoming_successor?: string | null;
  owned_projects: OwnedProject[];
  reporting_lines: ReportingRelationship[];
  critical_blockers: CriticalBlocker[];
  open_risks: ExtractedFactDetail[];
  knowledge_gaps: KnowledgeConflict[];
}

// =============================================================================
// Handover Dossier Types
// =============================================================================

export interface DossierChapter {
  chapter_id: string;
  title: string;
  summary: string;
  facts: ExtractedFactDetail[];
  citations: FactCitationDetail[];
  action_items: string[];
  metadata?: Record<string, any>;
}

export interface HandoverDossierContent {
  executive_summary: string;
  mandate_overview: string;
  chapters: DossierChapter[];
  recommended_day_1_to_30_actions: string[];
}

export interface HandoverDossier {
  id: string;
  title: string;
  target_role?: string | null;
  outgoing_leader?: { id: string; name: string; canonical_name?: string; category?: string } | null;
  incoming_leader?: { id: string; name: string; canonical_name?: string; category?: string } | null;
  status: string;
  version: number;
  content: HandoverDossierContent;
  created_at: string;
  updated_at: string;
}

export interface HandoverDossierListResult {
  items: HandoverDossier[];
  total: number;
}

// =============================================================================
// Q&A Types
// =============================================================================

export interface QACitation {
  document_id?: string | null;
  document_filename: string;
  source_location: string;
  verbatim_quote: string;
  char_start?: number | null;
  char_end?: number | null;
  fact_id?: string | null;
  fact_statement?: string | null;
}

export interface QAResponse {
  question: string;
  answer: string;
  has_sufficient_evidence: boolean;
  confidence_score: number;
  citations: QACitation[];
  supporting_facts_count: number;
  conflicts_detected: string[];
  created_at: string;
}

export interface QAHistoryResult {
  items: QAResponse[];
  total: number;
}

// =============================================================================
// API Client Functions
// =============================================================================

export async function fetchBackendHealth(): Promise<HealthCheckData | null> {
  try {
    const res = await fetch(API_ENDPOINTS.health, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthCheckData;
  } catch (error) {
    console.warn("Backend connection check failed:", error);
    return null;
  }
}

export async function uploadDocumentFile(file: File): Promise<DocumentUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_ENDPOINTS.documents, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || `Upload failed with status ${res.status}`);
  }

  return (await res.json()) as DocumentUploadResult;
}

export async function fetchDocuments(
  offset: number = 0,
  limit: number = 50,
  status?: string,
  extension?: string
): Promise<DocumentListResult> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  if (status) params.append("status", status);
  if (extension) params.append("extension", extension);

  const res = await fetch(`${API_ENDPOINTS.documents}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }

  return (await res.json()) as DocumentListResult;
}

export async function fetchDocumentById(id: string): Promise<IngestedDocumentDetail> {
  const res = await fetch(`${API_ENDPOINTS.documents}/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch document ${id}: ${res.statusText}`);
  }

  return (await res.json()) as IngestedDocumentDetail;
}

export async function fetchDocumentText(id: string): Promise<DocumentTextData> {
  const res = await fetch(`${API_ENDPOINTS.documents}/${id}/text`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch text for document ${id}: ${res.statusText}`);
  }

  return (await res.json()) as DocumentTextData;
}

export async function deleteDocumentRecord(id: string): Promise<boolean> {
  const res = await fetch(`${API_ENDPOINTS.documents}/${id}`, {
    method: "DELETE",
  });
  return res.status === 204;
}

// Extraction API
export async function extractDocument(documentId: string): Promise<DocumentExtractionResult> {
  const res = await fetch(`${API_ENDPOINTS.documents}/${documentId}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Extraction failed with status ${res.status}`);
  }

  return (await res.json()) as DocumentExtractionResult;
}

export async function fetchDocumentKnowledge(documentId: string): Promise<DocumentKnowledge> {
  const res = await fetch(`${API_ENDPOINTS.documents}/${documentId}/knowledge`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch knowledge for document ${documentId}: ${res.statusText}`);
  }

  return (await res.json()) as DocumentKnowledge;
}

// Organizational Intelligence & Conflicts API
export async function fetchConflicts(
  status?: string,
  severity?: string
): Promise<ConflictListResult> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (severity) params.append("severity", severity);

  const url = `${API_ENDPOINTS.conflicts}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch conflicts: ${res.statusText}`);
  }

  return (await res.json()) as ConflictListResult;
}

export async function triggerIntelligenceAnalysis(): Promise<KnowledgeConflict[]> {
  const res = await fetch(`${API_ENDPOINTS.intelligence}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to run intelligence analysis: ${res.statusText}`);
  }

  return (await res.json()) as KnowledgeConflict[];
}

export async function resolveConflict(
  conflictId: string,
  notes: string,
  status: string = "resolved",
  resolvedBy: string = "Switch Administrator"
): Promise<KnowledgeConflict> {
  const res = await fetch(`${API_ENDPOINTS.conflicts}/${conflictId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      resolution_notes: notes,
      resolved_by: resolvedBy,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to resolve conflict: ${res.statusText}`);
  }

  return (await res.json()) as KnowledgeConflict;
}

export async function fetchPendingApprovalRequests(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/intelligence/approval-requests/pending`);
  if (!res.ok) return [];
  return res.json();
}

export async function adjudicateApprovalRequest(
  conflictId: string,
  requestId: string,
  decision: "approved" | "rejected",
  sessionToken?: string,
  operatorSecret?: string,
  decisionNotes?: string
): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (sessionToken) headers["X-Mattermost-Token"] = sessionToken;
  if (operatorSecret) headers["X-Operator-Secret"] = operatorSecret;

  const res = await fetch(`${API_BASE_URL}/api/v1/intelligence/conflicts/${conflictId}/adjudicate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      request_id: requestId,
      decision,
      session_token: sessionToken,
      decision_notes: decisionNotes,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Adjudication failed: ${res.statusText}`);
  }
  return res.json();
}

// Continuity Assessment API
export async function fetchContinuityOverview(leaderId?: string): Promise<ContinuityOverview> {
  const params = new URLSearchParams();
  if (leaderId) params.append("leader_id", leaderId);

  const url = `${API_ENDPOINTS.continuity}${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch continuity overview: ${res.statusText}`);
  }

  return (await res.json()) as ContinuityOverview;
}

// Handover Dossier API
export async function generateHandoverDossier(payload?: {
  title?: string;
  target_role?: string;
  outgoing_leader_name?: string;
  incoming_leader_name?: string;
}): Promise<HandoverDossier> {
  const res = await fetch(`${API_ENDPOINTS.handovers}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to generate handover dossier: ${res.statusText}`);
  }

  return (await res.json()) as HandoverDossier;
}

export async function fetchHandoverDossiers(): Promise<HandoverDossierListResult> {
  const res = await fetch(API_ENDPOINTS.handovers, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch handover dossiers: ${res.statusText}`);
  }

  return (await res.json()) as HandoverDossierListResult;
}

export async function fetchHandoverDossierById(id: string): Promise<HandoverDossier> {
  const res = await fetch(`${API_ENDPOINTS.handovers}/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch dossier ${id}: ${res.statusText}`);
  }

  return (await res.json()) as HandoverDossier;
}

// Natural-Language Question Answering API
export async function askQuestion(question: string): Promise<QAResponse> {
  const res = await fetch(`${API_ENDPOINTS.qa}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to answer question: ${res.statusText}`);
  }

  return (await res.json()) as QAResponse;
}

export async function fetchQAHistory(): Promise<QAHistoryResult> {
  const res = await fetch(`${API_ENDPOINTS.qa}/history`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Q&A history: ${res.statusText}`);
  }

  return (await res.json()) as QAHistoryResult;
}
