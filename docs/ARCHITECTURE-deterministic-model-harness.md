# Architecture: Deterministic Model Harness

## Decision

Clausely will not depend on small models perfectly following long instructions in one shot.

Instead, Clausely will use a deterministic harness:

1. A stronger planner creates a structured plan.
2. The harness decomposes the plan into small tool-call tasks.
3. MiniCPM5 or another local small model executes one small task at a time.
4. Validators check each result.
5. Failed tasks are retried with narrower instructions or escalated to Gemma/API.

This makes small local models useful even when they are weak at long-context instruction following.

## Supported Models

```ts
type ClauselyModelBackend =
  | "minicpm5_local"
  | "gemma4_e2b_local"
  | "gemma4_e4b_local"
  | "api_provider";
```

## Model Roles

### MiniCPM5 Local

Use for:

- One paragraph at a time.
- One clause at a time.
- Short summaries.
- Simple classification.
- Intent labels.
- Formatting labels.
- Small rewrite tasks.
- Extracting names, dates, parties, and facts from short chunks.

Avoid using for:

- Whole document planning.
- 400-page reasoning.
- Complex multi-tool plans.
- Long instruction chains.
- High-risk legal conclusions without review.

### Gemma4 E2B Local

Use for:

- Medium planning.
- Drafting section outlines.
- Reviewing MiniCPM5 output.
- Chunk summarization.
- Normal legal text generation.
- Tool call repair.

### Gemma4 E4B Local

Use for:

- Stronger local planning.
- Strategy reasoning.
- Cross-section consistency checks.
- Legal argument review.
- Complex rewrite tasks.

### API Provider

Use for:

- Best quality planning.
- Long-context synthesis.
- Complex strategy.
- High-stakes legal review.
- Fallback when local models fail.

## Planner-Executor Pattern

```txt
User request
  -> Planner model creates structured plan
  -> Harness validates plan schema
  -> Harness expands plan into small executable tasks
  -> Small model executes one task
  -> Validator checks output
  -> Harness commits valid output
  -> Repeat until complete
  -> Reviewer model checks final result
```

## Example

User:

```txt
Generate a 200-word document and review it.
```

Planner output:

```json
{
  "goal": "Generate and review a 200-word legal document",
  "steps": [
    {
      "id": "s1",
      "tool": "document.create",
      "input": {
        "documentType": "legal_note",
        "targetWords": 200
      }
    },
    {
      "id": "s2",
      "tool": "document.generate_node",
      "input": {
        "nodeId": "intro",
        "targetWords": 50
      }
    },
    {
      "id": "s3",
      "tool": "document.generate_node",
      "input": {
        "nodeId": "facts",
        "targetWords": 60
      }
    },
    {
      "id": "s4",
      "tool": "document.generate_node",
      "input": {
        "nodeId": "analysis",
        "targetWords": 60
      }
    },
    {
      "id": "s5",
      "tool": "document.generate_node",
      "input": {
        "nodeId": "conclusion",
        "targetWords": 30
      }
    },
    {
      "id": "s6",
      "tool": "document.review",
      "input": {
        "checks": ["word_count", "clarity", "formatting", "legal_consistency"]
      }
    }
  ]
}
```

MiniCPM5 should only see one narrow task at a time:

```txt
Generate clause 2.1 only.
Use 80 to 100 words.
Mention party A, party B, and payment default.
Return only the paragraph text.
```

Then the harness validates the result.

## Harness State Machine

```ts
type HarnessTaskStatus =
  | "planned"
  | "ready"
  | "running"
  | "validating"
  | "retrying"
  | "committed"
  | "escalated"
  | "failed";
```

```ts
interface HarnessTask {
  id: string;
  parentPlanId: string;
  tool: string;
  input: Record<string, unknown>;
  modelPreference: ClauselyModelBackend;
  maxRetries: number;
  status: HarnessTaskStatus;
  baseVersionId?: string;
}
```

## Validators

Each task must declare validators.

```ts
type ValidatorName =
  | "json_schema"
  | "tool_name_allowed"
  | "required_fields"
  | "word_count"
  | "no_markdown_when_plain_text"
  | "no_extra_preface"
  | "citation_format"
  | "legal_section_present"
  | "style_match"
  | "document_version_current"
  | "no_unapproved_external_action";
```

Example:

```ts
interface HarnessValidationRule {
  name: ValidatorName;
  config?: Record<string, unknown>;
  onFail: "retry" | "repair" | "escalate" | "ask_user";
}
```

## Retry and Repair Policy

### First Failure

Retry with a stricter prompt.

```txt
Your previous answer did not match the required format.
Return only JSON matching this schema.
Do not include explanation.
```

### Second Failure

Use a deterministic repair function if possible.

Examples:

- Strip markdown preface.
- Parse malformed JSON with tolerant parser.
- Trim overlong output.
- Ask model to regenerate only missing field.

### Third Failure

Escalate to Gemma4 E2B, Gemma4 E4B, or API provider.

### Persistent Failure

Stop and show user what failed.

## Tool Call Gating

Models do not execute tools directly. They propose tool calls.

The harness checks:

- Is this tool allowed?
- Does the input match schema?
- Is the document version current?
- Is user confirmation needed?
- Is this action safe?

Only then does the tool handler execute.

## Chunking Strategy for Large Documents

For 400-page documents, never send the whole document to a small model.

Build:

```txt
Document
  -> sections
  -> clauses
  -> paragraphs
  -> summaries
  -> embeddings
  -> changed ranges
```

MiniCPM5 should receive:

- One node.
- Neighboring context if needed.
- A compact style guide.
- The exact requested output format.

Maximum MiniCPM5 task size:

- 1 to 2 paragraphs by default.
- Up to 10 paragraphs only for low-risk generation.
- Never a full 400-page document.

## Plan Format

```ts
interface AgentPlan {
  id: string;
  goal: string;
  createdByModel: ClauselyModelBackend;
  baseContext: {
    matterId?: string;
    documentId?: string;
    versionId?: string;
    surface: string;
  };
  steps: AgentPlanStep[];
}

interface AgentPlanStep {
  id: string;
  description: string;
  tool: string;
  input: Record<string, unknown>;
  dependencies: string[];
  modelPreference: ClauselyModelBackend;
  validators: HarnessValidationRule[];
  riskLevel: "safe" | "review" | "confirm" | "restricted";
}
```

## Document Generation Pattern

For a pleading:

```txt
1. Generate skeleton.
2. Generate cause title.
3. Generate party block.
4. Generate jurisdiction paragraph.
5. Generate facts section one paragraph at a time.
6. Generate grounds one clause at a time.
7. Generate prayers one item at a time.
8. Generate verification.
9. Apply court formatting.
10. Validate.
11. Review.
12. Export.
```

The harness commits after each valid node so progress is never lost.

## Review Pattern

Review is also chunked:

```txt
Review section 1
Review section 2
Review clause 2.1
Review clause 2.2
Check consistency across summaries
Run final high-level review with stronger model
```

Small models can review local chunks. Stronger models review global consistency.

## Preference Learning

Clausely should learn from user corrections, but not silently train external models.

Allowed by default:

- Store formatting preferences.
- Store firm style preferences.
- Store repeated corrections.
- Store accepted/rejected suggestions.
- Store matter-specific memory.

Requires explicit opt-in:

- Fine-tuning.
- Sending private documents to external training systems.
- Cross-firm learning.

Example memory:

```ts
preference.learn({
  scope: "firm",
  signal: "For Bombay HC writ petitions, user prefers 3cm left margin, 2.5cm right margin, double spacing, and footer with advocate name."
});
```

## Acceptance Criteria

- MiniCPM5 can generate a full document through many small verified tasks.
- Failed MiniCPM5 outputs are retried or escalated automatically.
- Tool calls are schema-checked before execution.
- Large documents are chunked and indexed.
- Agent commits valid chunks incrementally.
- Stronger models create or review plans.
- Small models never need to hold the whole case in context.
- Human edits force the harness to re-read latest document versions.
- The system can generate, review, format, validate, and export a document end to end.
