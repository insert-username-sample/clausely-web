import type { ClauselyModelBackend, HarnessTask } from "../types";

export interface RetryDecision {
  action: "retry" | "repair" | "escalate" | "fail";
  nextModel?: ClauselyModelBackend;
  reason: string;
}

export function decideRetry(task: HarnessTask, hasRepair: boolean): RetryDecision {
  if (hasRepair) {
    return {
      action: "repair",
      reason: "A deterministic repair is available.",
    };
  }

  if (task.attempt === 0) {
    return {
      action: "retry",
      reason: "First validation failure; retry with stricter prompt.",
    };
  }

  if (task.modelPreference === "minicpm5_local") {
    return {
      action: "escalate",
      nextModel: "gemma4_e2b_local",
      reason: "MiniCPM5 failed a bounded task; escalate to Gemma4 E2B.",
    };
  }

  if (task.modelPreference === "gemma4_e2b_local") {
    return {
      action: "escalate",
      nextModel: "gemma4_e4b_local",
      reason: "Gemma4 E2B failed; escalate to Gemma4 E4B.",
    };
  }

  return {
    action: "fail",
    reason: "Validation failed after retry/escalation budget.",
  };
}
