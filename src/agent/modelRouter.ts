import type { ModelGenerateRequest, ModelGenerateResult } from "./types";

export async function generateWithModel(
  request: ModelGenerateRequest,
): Promise<ModelGenerateResult> {
  const text = await tryApiProvider(request.prompt);
  if (text) {
    return { text, backend: "api_provider" };
  }

  return {
    text: deterministicLocalGenerate(request),
    backend: request.backend,
  };
}

async function tryApiProvider(prompt: string) {
  try {
    const { generateClientSideText } = await import("../utils/webLlmClient");
    return await generateClientSideText(prompt, "gemini-3.5-flash");
  } catch (error) {
    console.warn("API provider unavailable, using deterministic local harness fallback.", error);
    return "";
  }
}

function deterministicLocalGenerate(request: ModelGenerateRequest) {
  const prompt = request.prompt;
  const title = matchLine(prompt, /^Task:\s*Generate only\s*(.+?)\.$/im) ?? "Legal Section";
  const targetWords = Number(matchLine(prompt, /^Target words:\s*(\d+)/im) ?? 120);
  const userInstruction = matchLine(prompt, /^User instruction:\s*(.+)$/im) ?? "Prepare a legal draft.";
  const jurisdiction = matchLine(prompt, /^Jurisdiction:\s*(.+?)\.$/im) ?? "General";
  const documentType = matchLine(prompt, /^Document type:\s*(.+?)\.$/im) ?? "Legal Document";

  if (request.task === "chat") {
    // If user prompt is about drafting or creating a document
    if (/\b(?:create|draft|generate|prepare|write|make|nda|contract|agreement|petition)\b/i.test(prompt)) {
      // If it contains the case setup details already (meaning it's the second confirm step)
      if (/Case\/Matter:/i.test(prompt)) {
        return JSON.stringify({
          thought: "I have received the matter context and party names. I will now compile the full draft based on the specified parties.",
          reply: "I have successfully drafted the Non-Disclosure Agreement for you. You can review the details on the canvas.",
          action: null
        });
      }

      // First step: model reasons it needs the matter setup!
      const isNda = /\bnda\b/i.test(prompt);
      const isPetition = /\b(?:petition|writ)\b/i.test(prompt);
      const suggestedName = isNda ? "NDA Drafting Workspace" : isPetition ? "Writ Petition Workspace" : "Clausely Drafting Project";
      const docType = isNda ? "Agreement" : isPetition ? "Writ Petition" : "Agreement";

      return JSON.stringify({
        thought: `The user wants to draft a document: "${prompt}". I need to know which matter/project this document belongs to, and what the names of the two parties (Party A and Party B) are. I will call the 'request_matter_setup' action to collect this information from the user before generating.`,
        reply: `To generate a precise ${isNda ? "Non-Disclosure Agreement" : "legal document"}, I need to set up the case context. Let's configure the matter and party details.`,
        action: {
          tool: "request_matter_setup",
          parameters: {
            suggestedMatterName: suggestedName,
            docType: docType
          }
        }
      });
    }

    // Default chat
    return JSON.stringify({
      thought: "This is a general greeting or query. I will answer directly.",
      reply: "I can help with that from the current document context. For safe execution, Clausely will break the work into small verified tasks, apply formatting rules, and keep the latest document version as the source of truth.",
      action: null
    });
  }

  if (/cause title/i.test(title)) {
    return fitWords(
      [
        `IN THE APPROPRIATE COURT FOR ${jurisdiction.toUpperCase()}`,
        `${documentType.toUpperCase()}`,
        "In the matter of the applicant or petitioner described in the instructions, and the opposing party or authority named by the user.",
        `This draft is prepared on the basis of the instruction: ${userInstruction}`,
      ].join("\n\n"),
      targetWords,
    );
  }

  if (/material facts/i.test(title)) {
    return fitWords(
      `The material facts are that the concerned party has approached this forum seeking appropriate relief in connection with the dispute described by the user. The record should identify the parties, the relevant transaction or order, the date of cause of action, and the prejudice caused. The pleading should preserve every fact necessary for maintainability while avoiding argumentative excess. The facts should be arranged chronologically so that the court can understand jurisdiction, limitation, notice, correspondence, and the immediate reason for seeking relief.`,
      targetWords,
    );
  }

  if (/grounds/i.test(title)) {
    return fitWords(
      `The grounds are that the impugned action is arbitrary, contrary to settled principles of law, and liable to be interfered with by the competent court. The applicant may rely on breach of natural justice, absence of proper reasons, failure to consider relevant material, and disproportionate prejudice. Each ground should be pleaded separately, supported by the factual record, and connected to the final relief sought. No ground should assume facts that are not present in the matter record.`,
      targetWords,
    );
  }

  if (/prayer/i.test(title)) {
    return fitWords(
      `The applicant therefore prays that this court be pleased to issue appropriate orders, directions, or reliefs in accordance with law, including setting aside or modifying the impugned action where applicable. The applicant also seeks interim and consequential reliefs necessary to protect the subject matter of the proceeding. The pleading may conclude with verification, place, date, signature, and advocate details after final review by counsel.`,
      targetWords,
    );
  }

  return fitWords(
    `This section addresses ${title} for the ${documentType} under ${jurisdiction}. It follows the user's instruction, preserves the relevant factual basis, and is written in formal legal style for later review and formatting.`,
    targetWords,
  );
}

function matchLine(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim();
}

function fitWords(text: string, targetWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const min = Math.max(20, Math.floor(targetWords * 0.55));
  if (words.length >= min) return text.trim();

  const filler = "This averment is subject to verification against the case record, applicable procedural rules, and final legal review by counsel before filing.";
  const expanded = [...words];
  while (expanded.length < min) {
    expanded.push(...filler.split(/\s+/));
  }
  return expanded.slice(0, Math.ceil(targetWords * 1.2)).join(" ");
}
