import type { ClauselyAgentContext, HarnessTask } from "../types";

export function buildTaskPrompt(task: HarnessTask, context: ClauselyAgentContext) {
  const toolInput = task.input;
  const existingText = context.documentText?.trim()
    ? `Current document excerpt:\n${context.documentText.trim().slice(0, 1800)}`
    : "Current document excerpt: none";

  if (task.tool === "document.generate_node") {
    return [
      "You are executing one Clausely drafting task.",
      "",
      `Task: Generate only ${String(toolInput.nodeTitle ?? toolInput.nodeId ?? "the requested section")}.`,
      `Document type: ${context.documentType ?? "Legal Document"}.`,
      `Jurisdiction: ${context.jurisdiction ?? "General"}.`,
      `Target words: ${String(toolInput.targetWords ?? 120)}.`,
      "",
      "Constraints:",
      "- Plain text only.",
      "- No markdown.",
      "- No preface.",
      "- Use formal legal drafting style.",
      "- Do not include any section outside this task.",
      "",
      existingText,
      "",
      `User instruction: ${String(toolInput.userInput ?? "")}`,
      "",
      "Return only the section text.",
    ].join("\n");
  }

  if (task.tool === "document.review") {
    return [
      "Review the current legal document briefly.",
      "Return concise findings only.",
      "",
      existingText,
    ].join("\n");
  }

  return String(toolInput.userInput ?? "");
}
