import { generateWithModel } from "../modelRouter";
import type {
  ClauselyAgentRunRequest,
  ClauselyArtifact,
  HarnessRunResult,
  HarnessTask,
  HarnessTaskRecord,
} from "../types";
import { buildTaskPrompt } from "./promptFactory";
import { decideRetry } from "./retryPolicy";
import { compilePlanToTasks, createPlan } from "./taskCompiler";
import { applyRepairs, validateHarnessOutput } from "./validators";

export async function runHarness(
  request: ClauselyAgentRunRequest,
): Promise<HarnessRunResult> {
  const plan = createPlan(request);
  const tasks = compilePlanToTasks(plan);
  const records: HarnessTaskRecord[] = [];
  const chunks: string[] = [];

  for (const task of tasks) {
    const record = await executeTaskWithRetries(task, request);
    records.push(record);

    if (record.status === "failed" || record.status === "blocked") {
      return {
        response: `I could not complete "${plan.goal}" because ${record.error ?? "a harness task failed"}.`,
        plan,
        tasks: records,
        committedArtifacts: [],
        needsUserConfirmation: false,
        failures: [{ taskId: record.taskId, message: record.error ?? "Task failed" }],
      };
    }

    if (record.output) chunks.push(record.output);
  }

  const documentText = chunks.join("\n\n");
  const artifact: ClauselyArtifact = {
    id: `artifact_${Date.now()}`,
    type: plan.steps[0]?.tool === "chat.respond" ? "chat_response" : "document",
    title: plan.steps[0]?.tool === "chat.respond" ? "Copilot Response" : request.context?.documentType ?? "Generated Document",
    text: documentText,
    metadata: {
      harness: true,
      modelBackends: [...new Set(records.map((record) => record.modelBackend))],
      stepCount: records.length,
    },
  };

  return {
    response: summarizeRun(request, records),
    plan,
    tasks: records,
    committedArtifacts: [artifact],
    openedSurface: request.surface,
    needsUserConfirmation: false,
    failures: [],
  };
}

async function executeTaskWithRetries(
  task: HarnessTask,
  request: ClauselyAgentRunRequest,
): Promise<HarnessTaskRecord> {
  let currentTask = { ...task };
  let lastError = "";

  for (let attempt = 0; attempt <= currentTask.maxRetries + 2; attempt += 1) {
    currentTask = { ...currentTask, attempt, status: "running" };
    const prompt = buildTaskPrompt(currentTask, request.context ?? {});
    const result = await generateWithModel({
      prompt,
      task: request.task ?? "draft_document",
      backend: currentTask.modelPreference,
      context: request.context,
    });

    const validation = validateHarnessOutput(result.text, currentTask.validators);
    const repaired = applyRepairs(result.text, validation);
    const validationAfterRepair =
      repaired === result.text ? validation : validateHarnessOutput(repaired, currentTask.validators);

    if (validationAfterRepair.every((item) => item.ok)) {
      return {
        taskId: currentTask.id,
        stepId: currentTask.stepId,
        tool: currentTask.tool,
        modelBackend: result.backend,
        status: "committed",
        attempt,
        output: repaired,
        validation: validationAfterRepair,
      };
    }

    const hasRepair = validation.some((item) => Boolean(item.repairedOutput));
    const decision = decideRetry(currentTask, hasRepair);
    lastError = validationAfterRepair.find((item) => !item.ok)?.message ?? decision.reason;

    if (decision.action === "repair" && repaired !== result.text) {
      continue;
    }

    if (decision.action === "escalate" && decision.nextModel) {
      currentTask = {
        ...currentTask,
        modelPreference: decision.nextModel,
        status: "escalated",
      };
      continue;
    }

    if (decision.action === "fail") break;
  }

  return {
    taskId: currentTask.id,
    stepId: currentTask.stepId,
    tool: currentTask.tool,
    modelBackend: currentTask.modelPreference,
    status: "failed",
    attempt: currentTask.attempt,
    validation: [],
    error: lastError || "Validation failed.",
  };
}

function summarizeRun(
  request: ClauselyAgentRunRequest,
  records: HarnessTaskRecord[],
) {
  if ((request.task ?? "draft_document") === "chat") {
    return "Answered through the Clausely deterministic harness.";
  }

  const models = [...new Set(records.map((record) => record.modelBackend))].join(", ");
  return `Generated ${records.length} verified document sections through the Clausely harness. Models used: ${models}.`;
}
