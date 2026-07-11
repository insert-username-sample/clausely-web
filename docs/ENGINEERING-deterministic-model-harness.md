# Engineering Spec: Deterministic Model Harness

## Purpose

The deterministic harness is the execution engine between the Clausely Agent Runtime and the model adapters. It makes small local models useful by forcing every model action into a small, typed, validated task.

The harness must support this workflow:

```txt
User intent
  -> planner creates schema-valid plan
  -> harness expands plan into executable tasks
  -> model generates one small output
  -> validators check output
  -> tool registry executes safe tool calls
  -> result is committed to document/version state
  -> reviewer checks final result
```

This avoids relying on MiniCPM5 to obey a huge prompt or manage a long context window.

## Target Module Layout

```txt
src/agent/
  clauselyAgent.ts
  modelRouter.ts
  toolRegistry.ts
  types.ts

src/agent/harness/
  harnessRunner.ts
  planSchema.ts
  taskQueue.ts
  taskCompiler.ts
  validators.ts
  retryPolicy.ts
  escalationPolicy.ts
  promptFactory.ts
  outputParser.ts
  executionLog.ts
  contextBuilder.ts
  resultCommitter.ts

src/agent/models/
  minicpm5LocalAdapter.ts
  gemma4E2BLocalAdapter.ts
  gemma4E4BLocalAdapter.ts
  apiProviderAdapter.ts

src/agent/tools/
  navigationTools.ts
  documentTools.ts
  formattingTools.ts
  strategyTools.ts
  registryTools.ts
  exportTools.ts
  playbookTools.ts
```

## Core Interfaces

### Model Backend

```ts
export type ClauselyModelBackend =
  | "minicpm5_local"
  | "gemma4_e2b_local"
  | "gemma4_e4b_local"
  | "api_provider";
```

### Harness Run Request

```ts
export interface HarnessRunRequest {
  userInput: string;
  surface: ClauselySurface;
  context: ClauselyAgentContext;
  autonomy: "suggest" | "execute_safe" | "execute_with_confirmations";
  modelPreference?: ClauselyModelBackend;
  privacyMode: "local_only" | "redacted_api" | "full_api";
}
```

### Harness Run Result

```ts
export interface HarnessRunResult {
  response: string;
  plan: AgentPlan;
  tasks: HarnessTaskRecord[];
  committedArtifacts: ClauselyArtifact[];
  openedSurface?: ClauselySurface;
  needsUserConfirmation: boolean;
  failures: HarnessFailure[];
}
```

### Agent Plan

```ts
export interface AgentPlan {
  id: string;
  goal: string;
  baseContext: {
    matterId?: string;
    documentId?: string;
    versionId?: string;
    surface: ClauselySurface;
  };
  createdByModel: ClauselyModelBackend;
  steps: AgentPlanStep[];
}

export interface AgentPlanStep {
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

### Harness Task

```ts
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
```

### Validation

```ts
export type HarnessValidatorName =
  | "json_schema"
  | "tool_name_allowed"
  | "required_fields"
  | "word_count"
  | "plain_text_only"
  | "no_preface"
  | "citation_format"
  | "legal_section_present"
  | "style_match"
  | "document_version_current"
  | "risk_policy"
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
  repairedOutput?: unknown;
}
```

## Execution Algorithm

```ts
export async function runHarness(request: HarnessRunRequest): Promise<HarnessRunResult> {
  const context = await buildContext(request);
  const plan = await createOrRepairPlan(request, context);
  const tasks = compilePlanToTasks(plan);
  const queue = createTaskQueue(tasks);
  const records: HarnessTaskRecord[] = [];

  while (queue.hasRunnableTasks()) {
    const task = queue.next();

    if (task.riskLevel === "confirm" || task.riskLevel === "restricted") {
      return pauseForConfirmation(plan, records, task);
    }

    const latestContext = await refreshContextForTask(task, context);
    const record = await executeTaskWithRetries(task, latestContext);
    records.push(record);

    if (record.status === "failed" || record.status === "blocked") {
      return buildFailedResult(plan, records, record);
    }

    queue.markComplete(task.id, record.output);
  }

  const review = await reviewFinalResult(plan, records);
  return buildSuccessResult(plan, records, review);
}
```

## Planner Selection

Planner selection should be deterministic:

```ts
function selectPlanner(request: HarnessRunRequest): ClauselyModelBackend {
  if (request.privacyMode === "local_only") {
    return "gemma4_e4b_local";
  }

  if (request.modelPreference === "api_provider") {
    return "api_provider";
  }

  if (isComplexWorkflow(request.userInput)) {
    return "gemma4_e4b_local";
  }

  return "gemma4_e2b_local";
}
```

MiniCPM5 should not be the planner for multi-step workflows. It can classify intent or execute tiny tasks.

## Task Model Selection

```ts
function selectTaskModel(task: HarnessTask): ClauselyModelBackend {
  if (task.modelPreference) return task.modelPreference;

  if (isTinyTextGeneration(task)) return "minicpm5_local";
  if (isMediumDrafting(task)) return "gemma4_e2b_local";
  if (isLegalReview(task)) return "gemma4_e4b_local";

  return "api_provider";
}
```

MiniCPM5 preferred task envelope:

```txt
1 paragraph default
2 paragraphs allowed
10 paragraphs maximum for low-risk generation
no full-document context
no complex multi-tool planning
```

## Prompt Factory

MiniCPM5 prompts must be narrow and repetitive.

```txt
You are executing one Clausely drafting task.

Task:
Generate only clause 2.1.

Constraints:
- 80 to 120 words.
- Plain text only.
- No markdown.
- No preface.
- Use formal legal style.
- Mention the petitioner, respondent, and impugned order.

Context:
{smallContext}

Return:
Only the clause text.
```

Tool-call prompts must require JSON only:

```txt
Return only valid JSON matching this schema:
{schema}

No markdown.
No explanation.
No extra keys.
```

## Output Parsing

`outputParser.ts` should support:

- Strict JSON parse.
- Tolerant JSON repair for trailing prose or fenced blocks.
- Plain-text extraction.
- Markdown stripping.
- Word-count calculation.
- Tool-call object normalization.

The parser may repair shape, but it must not invent legal content.

## Retry Policy

```ts
export interface RetryDecision {
  action: "retry" | "repair" | "escalate" | "ask_user" | "fail";
  nextModel?: ClauselyModelBackend;
  reason: string;
}
```

Default policy:

1. First failure: retry with stricter prompt.
2. Second failure: repair if deterministic.
3. Third failure: escalate to Gemma4 E2B or Gemma4 E4B.
4. Fourth failure: use API provider if privacy mode allows.
5. Final failure: stop and surface the issue.

Local-only mode cannot escalate to API provider.

## Escalation Matrix

| Current model | Escalate to | Condition |
| --- | --- | --- |
| `minicpm5_local` | `gemma4_e2b_local` | Bad format, weak instruction following |
| `gemma4_e2b_local` | `gemma4_e4b_local` | Legal reasoning or consistency failure |
| `gemma4_e4b_local` | `api_provider` | Long context or repeated failure |
| `api_provider` | stop | Provider failure or schema failure after retry |

## Tool Execution Gate

Before executing a tool:

```ts
function authorizeToolCall(call: ProposedToolCall, context: ClauselyToolContext): ToolGateResult {
  assertToolExists(call.name);
  assertInputMatchesSchema(call.name, call.input);
  assertRiskAllowed(call.name, context.autonomy);
  assertDocumentVersionCurrent(call.input);
  assertPermission(context.user, call.name, call.input);
  return { ok: true };
}
```

Risk behavior:

- `safe`: execute automatically in `execute_safe`.
- `review`: execute if reversible or checkpointed.
- `confirm`: pause for user confirmation.
- `restricted`: never execute from model output alone.

## Persistence Tables

### `agent_runs`

```sql
create table agent_runs (
  id uuid primary key,
  firm_id uuid not null,
  user_id uuid not null,
  surface text not null,
  user_input text not null,
  plan jsonb,
  status text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

### `agent_tasks`

```sql
create table agent_tasks (
  id uuid primary key,
  run_id uuid not null references agent_runs(id),
  step_id text not null,
  tool text not null,
  input jsonb not null,
  output jsonb,
  model_backend text not null,
  status text not null,
  attempt int not null default 0,
  base_version_id uuid,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

### `agent_validation_events`

```sql
create table agent_validation_events (
  id uuid primary key,
  task_id uuid not null references agent_tasks(id),
  validator text not null,
  ok boolean not null,
  message text,
  created_at timestamptz not null default now()
);
```

### `agent_tool_calls`

```sql
create table agent_tool_calls (
  id uuid primary key,
  task_id uuid not null references agent_tasks(id),
  tool text not null,
  input jsonb not null,
  output jsonb,
  risk_level text not null,
  status text not null,
  created_at timestamptz not null default now()
);
```

## Document Version Safety

Every document-writing task must include `baseVersionId`.

Before commit:

```ts
const latest = await documentStore.getLatestVersion(documentId);
if (latest.id !== task.baseVersionId) {
  throw new VersionConflictError(task.baseVersionId, latest.id);
}
```

On conflict:

1. Re-read latest document.
2. Rebuild context for the target node.
3. Re-run the task if safe.
4. Show a diff if the conflict is non-trivial.

## Large Document Context Builder

For large documents:

```ts
interface TaskContextBundle {
  targetNode: LegalDocumentNode;
  parentSummary?: string;
  siblingSummaries?: string[];
  styleGuide: string;
  jurisdictionRules?: string;
  relevantFacts?: string[];
  prohibitedChanges?: string[];
}
```

MiniCPM5 receives only this context bundle, not the whole document.

## Example: Generate Clause Task

Task:

```json
{
  "tool": "document.generate_node",
  "input": {
    "documentId": "doc_123",
    "nodeId": "clause-2.1",
    "targetWords": 100,
    "topic": "violation of natural justice"
  },
  "modelPreference": "minicpm5_local",
  "validators": [
    { "name": "word_count", "config": { "min": 80, "max": 120 }, "onFail": "retry" },
    { "name": "plain_text_only", "onFail": "repair" },
    { "name": "no_preface", "onFail": "repair" },
    { "name": "document_version_current", "onFail": "retry" }
  ]
}
```

Execution:

1. Build small context bundle.
2. Ask MiniCPM5 for one clause.
3. Strip preface if any.
4. Validate word count.
5. Confirm latest version.
6. Replace node.
7. Create document version.
8. Log task as committed.

## Example: Full Document Workflow

```txt
User: Generate a Bombay HC writ petition and review it.

Planner:
1. document.create
2. document.generate_node cause_title
3. document.generate_node synopsis
4. document.generate_node facts.1
5. document.generate_node facts.2
6. document.generate_node grounds.1
7. document.generate_node grounds.2
8. document.generate_node prayer
9. document.format.apply_court_rules
10. document.review
11. document.open_in_onlyoffice
```

MiniCPM5 can execute steps 2 to 8 in small chunks. Gemma4 E2B/E4B or API should handle planning and final review.

## Test Plan

### Unit Tests

- Plan schema rejects unknown tools.
- Task compiler respects dependencies.
- Validators catch bad JSON.
- Validators catch wrong word counts.
- Retry policy escalates after repeated failures.
- Tool gate blocks restricted tools.
- Version conflict blocks stale writes.

### Integration Tests

- Generate a document section with MiniCPM5.
- Retry on invalid MiniCPM5 output.
- Escalate to Gemma when MiniCPM5 fails.
- Commit valid chunk to document store.
- Re-read latest version after human edit.
- Run full document generation workflow.

### Fixture Tests

Use canned bad outputs:

- Markdown-wrapped JSON.
- JSON with extra keys.
- Plain text with preface.
- Overlong paragraph.
- Wrong tool name.
- Stale document version.

## First Implementation Slice

Build this first:

```txt
src/agent/harness/validators.ts
src/agent/harness/retryPolicy.ts
src/agent/harness/outputParser.ts
src/agent/harness/harnessRunner.ts
src/agent/harness/planSchema.ts
```

With two tools:

```txt
document.generate_node
document.replace_node
```

And one demo workflow:

```txt
Generate four short sections of a legal note using MiniCPM5-style chunking.
Validate each section.
Commit only valid sections.
Escalate failures to API provider if enabled.
```

## Completion Criteria

- The harness can run without direct UI coupling.
- Every model output is validated before commit.
- Every tool call is schema-checked before execution.
- MiniCPM5 is used only on bounded tasks.
- Failures produce deterministic retry/escalation behavior.
- Agent logs show plan, task, model, validator, tool call, and commit status.
