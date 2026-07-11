export type ClauselyModelBackend =
  | "minicpm5_local"
  | "gemma4_e2b_local"
  | "gemma4_e4b_local"
  | "api_provider";

export type ClauselySurface =
  | "home"
  | "matters"
  | "drafting_studio"
  | "registry_simulator"
  | "strategist"
  | "vault"
  | "playbooks"
  | "templates"
  | "research"
  | "calendar"
  | "billing";

export type ClauselyTaskType =
  | "chat"
  | "draft_document"
  | "edit_document"
  | "review_document"
  | "format_document"
  | "run_strategy"
  | "create_playbook"
  | "export_document";

export interface ClauselyAgentContext {
  jurisdiction?: string;
  documentType?: string;
  documentText?: string;
  firmId?: string;
  matterId?: string;
  documentId?: string;
  versionId?: string;
}

export interface ClauselyAgentRunRequest {
  input: string;
  surface: ClauselySurface;
  task?: ClauselyTaskType;
  context?: ClauselyAgentContext;
  modelPreference?: ClauselyModelBackend;
  privacyMode?: "local_only" | "redacted_api" | "full_api";
  autonomy?: "suggest" | "execute_safe" | "execute_with_confirmations";
}

export interface ClauselyArtifact {
  id: string;
  type: "document" | "chat_response" | "plan" | "export";
  title: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface ClauselyPlanStep {
  id: string;
  description: string;
  tool: string;
  input: Record<string, unknown>;
  dependencies: string[];
  modelPreference: ClauselyModelBackend;
  validators: HarnessValidationRule[];
  riskLevel: "safe" | "review" | "confirm" | "restricted";
}

export interface AgentPlan {
  id: string;
  goal: string;
  createdByModel: ClauselyModelBackend;
  baseContext: {
    matterId?: string;
    documentId?: string;
    versionId?: string;
    surface: ClauselySurface;
  };
  steps: ClauselyPlanStep[];
}

export type HarnessTaskStatus =
  | "planned"
  | "ready"
  | "running"
  | "validating"
  | "retrying"
  | "committed"
  | "escalated"
  | "failed"
  | "blocked";

export interface HarnessTask {
  id: string;
  planId: string;
  stepId: string;
  tool: string;
  input: Record<string, unknown>;
  modelPreference: ClauselyModelBackend;
  validators: HarnessValidationRule[];
  maxRetries: number;
  attempt: number;
  riskLevel: "safe" | "review" | "confirm" | "restricted";
  baseVersionId?: string;
  status: HarnessTaskStatus;
}

export type HarnessValidatorName =
  | "required_fields"
  | "word_count"
  | "plain_text_only"
  | "no_preface"
  | "legal_section_present"
  | "content_preserved";

export interface HarnessValidationRule {
  name: HarnessValidatorName;
  config?: Record<string, unknown>;
  onFail: "retry" | "repair" | "escalate" | "ask_user" | "fail";
}

export interface HarnessValidationResult {
  ok: boolean;
  validator: HarnessValidatorName;
  message?: string;
  repairedOutput?: string;
}

export interface HarnessTaskRecord {
  taskId: string;
  stepId: string;
  tool: string;
  modelBackend: ClauselyModelBackend;
  status: HarnessTaskStatus;
  attempt: number;
  output?: string;
  validation: HarnessValidationResult[];
  error?: string;
}

export interface HarnessFailure {
  taskId: string;
  message: string;
}

export interface HarnessRunResult {
  response: string;
  plan: AgentPlan;
  tasks: HarnessTaskRecord[];
  committedArtifacts: ClauselyArtifact[];
  openedSurface?: ClauselySurface;
  needsUserConfirmation: boolean;
  failures: HarnessFailure[];
}

export type ModelGenerateRequest = {
  prompt: string;
  task: ClauselyTaskType;
  backend: ClauselyModelBackend;
  context?: ClauselyAgentContext;
};

export type ModelGenerateResult = {
  text: string;
  backend: ClauselyModelBackend;
};
