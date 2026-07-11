import type {
  AgentPlan,
  ClauselyAgentRunRequest,
  ClauselyModelBackend,
  ClauselyPlanStep,
  HarnessTask,
} from "../types";

export function createPlan(request: ClauselyAgentRunRequest): AgentPlan {
  const task = request.task ?? inferTask(request.input);
  const planner: ClauselyModelBackend =
    request.privacyMode === "local_only" ? "gemma4_e4b_local" : "gemma4_e2b_local";

  if (task === "chat") {
    return {
      id: createId("plan"),
      goal: request.input,
      createdByModel: planner,
      baseContext: {
        surface: request.surface,
        matterId: request.context?.matterId,
        documentId: request.context?.documentId,
        versionId: request.context?.versionId,
      },
      steps: [
        {
          id: "chat-response",
          description: "Answer the user in document context.",
          tool: "chat.respond",
          input: { userInput: request.input },
          dependencies: [],
          modelPreference: request.modelPreference ?? "gemma4_e2b_local",
          validators: [
            { name: "plain_text_only", onFail: "repair" },
            { name: "no_preface", onFail: "repair" },
          ],
          riskLevel: "safe",
        },
      ],
    };
  }

  const steps = createDraftSteps(request);
  return {
    id: createId("plan"),
    goal: request.input,
    createdByModel: planner,
    baseContext: {
      surface: request.surface,
      matterId: request.context?.matterId,
      documentId: request.context?.documentId,
      versionId: request.context?.versionId,
    },
    steps,
  };
}

export function compilePlanToTasks(plan: AgentPlan): HarnessTask[] {
  return plan.steps.map((step) => ({
    id: createId("task"),
    planId: plan.id,
    stepId: step.id,
    tool: step.tool,
    input: step.input,
    modelPreference: step.modelPreference,
    validators: step.validators,
    maxRetries: 2,
    attempt: 0,
    riskLevel: step.riskLevel,
    baseVersionId: plan.baseContext.versionId,
    status: "ready",
  }));
}

function createDraftSteps(request: ClauselyAgentRunRequest): ClauselyPlanStep[] {
  const documentType = request.context?.documentType ?? "Legal Document";
  const jurisdiction = request.context?.jurisdiction ?? "General";
  const targetWords = extractTargetWords(request.input);
  const sectionBudgets = splitBudget(targetWords);
  const sections = [
    ["cause-title", "Cause Title and Parties"],
    ["facts", "Material Facts"],
    ["grounds", "Grounds and Legal Basis"],
    ["prayer", "Prayer and Verification"],
  ] as const;

  return sections.map(([nodeId, nodeTitle], index) => ({
    id: `generate-${nodeId}`,
    description: `Generate ${nodeTitle}.`,
    tool: "document.generate_node",
    input: {
      nodeId,
      nodeTitle,
      documentType,
      jurisdiction,
      targetWords: sectionBudgets[index],
      userInput: request.input,
    },
    dependencies: index === 0 ? [] : [`generate-${sections[index - 1][0]}`],
    modelPreference: "minicpm5_local",
    validators: [
      {
        name: "word_count",
        config: {
          min: Math.max(20, Math.floor(sectionBudgets[index] * 0.55)),
          max: Math.ceil(sectionBudgets[index] * 1.65),
        },
        onFail: "retry",
      },
      { name: "plain_text_only", onFail: "repair" },
      { name: "no_preface", onFail: "repair" },
    ],
    riskLevel: "safe",
  }));
}

function inferTask(input: string) {
  if (/\b(?:hi|hello|hey|thanks|thank you)\b/i.test(input.trim())) return "chat";
  if (/\b(?:review|check|analy[sz]e)\b/i.test(input)) return "review_document";
  return "draft_document";
}

function extractTargetWords(input: string) {
  const match = input.match(/(\d{2,5})\s*(?:words?|word)/i);
  if (!match) return 520;
  return Math.min(2500, Math.max(120, Number(match[1])));
}

function splitBudget(total: number) {
  return [
    Math.round(total * 0.22),
    Math.round(total * 0.34),
    Math.round(total * 0.30),
    Math.max(40, total - Math.round(total * 0.86)),
  ];
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
