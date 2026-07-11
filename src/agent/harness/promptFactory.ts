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

  if (task.tool === "chat.respond") {
    return [
      "You are the Clausely Legal OS autonomous assistant.",
      "The user wants to navigate the ecosystem or draft documents.",
      "",
      existingText,
      `Current document type: ${context.documentType ?? "none"}`,
      `Current jurisdiction: ${context.jurisdiction ?? "none"}`,
      "",
      "Tool Calling Rules:",
      "1. If the user wants to draft or create a new document (e.g. 'draft an NDA', 'create a petition', etc.) and you do not have the names of the parties or the case/matter title yet, you MUST output a JSON response requesting the matter setup.",
      "Format the response exactly as a JSON object:",
      "{",
      '  "thought": "reasoning for setup",',
      '  "reply": "Conversational message explaining that we need to set up the case/matter details.",',
      '  "action": {',
      '    "tool": "request_matter_setup",',
      '    "parameters": {',
      '      "suggestedMatterName": "Suggested Name based on prompt",',
      '      "docType": "Agreement | Writ Petition | Written Statement"',
      '    }',
      '  }',
      "}",
      "",
      "2. If you already have the case context/parties, or if the user is asking a general question or follow-up, respond directly in the 'reply' field and leave 'action' as null.",
      "",
      `User request: ${String(toolInput.userInput ?? "")}`,
      "",
      "Provide your response as a valid JSON object only. Do not wrap in markdown blocks, do not include preface.",
    ].join("\n");
  }

  return String(toolInput.userInput ?? "");
}
