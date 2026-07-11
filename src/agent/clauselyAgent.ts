import { runHarness } from "./harness/harnessRunner";
import type { ClauselyAgentRunRequest, HarnessRunResult } from "./types";

export async function runClauselyAgent(
  request: ClauselyAgentRunRequest,
): Promise<HarnessRunResult> {
  return runHarness({
    privacyMode: "local_only",
    autonomy: "execute_safe",
    ...request,
  });
}

export type { ClauselyAgentRunRequest, HarnessRunResult };
