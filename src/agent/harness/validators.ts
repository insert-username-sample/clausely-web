import type {
  HarnessValidationResult,
  HarnessValidationRule,
} from "../types";

const prefacePatterns = [
  /^here(?:'s| is)\b/i,
  /^certainly\b/i,
  /^of course\b/i,
  /^below is\b/i,
  /^draft(?:ed)?\b/i,
];

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateHarnessOutput(
  output: string,
  rules: HarnessValidationRule[],
): HarnessValidationResult[] {
  return rules.map((rule) => validateRule(output, rule));
}

function validateRule(
  output: string,
  rule: HarnessValidationRule,
): HarnessValidationResult {
  if (rule.name === "required_fields") {
    const required = Array.isArray(rule.config?.fields) ? rule.config.fields : [];
    const missing = required.filter((field) => !output.includes(String(field)));
    return {
      ok: missing.length === 0,
      validator: rule.name,
      message: missing.length ? `Missing required field markers: ${missing.join(", ")}` : undefined,
    };
  }

  if (rule.name === "word_count") {
    const min = Number(rule.config?.min ?? 1);
    const max = Number(rule.config?.max ?? 9999);
    const count = wordCount(output);
    return {
      ok: count >= min && count <= max,
      validator: rule.name,
      message: count < min || count > max ? `Expected ${min}-${max} words, got ${count}.` : undefined,
    };
  }

  if (rule.name === "plain_text_only") {
    const repaired = output
      .replace(/^```(?:\w+)?/gm, "")
      .replace(/```$/gm, "")
      .replace(/\*\*/g, "")
      .trim();
    return {
      ok: repaired === output.trim(),
      validator: rule.name,
      repairedOutput: repaired,
      message: repaired === output.trim() ? undefined : "Removed markdown wrappers/formatting.",
    };
  }

  if (rule.name === "no_preface") {
    const firstLine = output.trim().split("\n")[0] ?? "";
    const hasPreface = prefacePatterns.some((pattern) => pattern.test(firstLine));
    const repaired = hasPreface
      ? output.trim().split("\n").slice(1).join("\n").trim()
      : output.trim();
    return {
      ok: !hasPreface,
      validator: rule.name,
      repairedOutput: repaired,
      message: hasPreface ? "Removed conversational preface." : undefined,
    };
  }

  if (rule.name === "legal_section_present") {
    const terms = Array.isArray(rule.config?.terms) ? rule.config.terms.map(String) : [];
    const lower = output.toLowerCase();
    const missing = terms.filter((term) => !lower.includes(term.toLowerCase()));
    return {
      ok: missing.length === 0,
      validator: rule.name,
      message: missing.length ? `Missing legal section terms: ${missing.join(", ")}` : undefined,
    };
  }

  if (rule.name === "content_preserved") {
    const source = String(rule.config?.source ?? "").trim();
    const requiredTerms = source
      .split(/\s+/)
      .filter((term) => term.length > 5)
      .slice(0, 12);
    const lower = output.toLowerCase();
    const preserved = requiredTerms.filter((term) => lower.includes(term.toLowerCase()));
    return {
      ok: requiredTerms.length === 0 || preserved.length >= Math.ceil(requiredTerms.length / 3),
      validator: rule.name,
      message: "Output appears to omit too much source content.",
    };
  }

  return {
    ok: true,
    validator: rule.name,
  };
}

export function applyRepairs(
  output: string,
  results: HarnessValidationResult[],
) {
  return results.reduce((current, result) => {
    if (!result.ok && result.repairedOutput) return result.repairedOutput;
    return current;
  }, output);
}
