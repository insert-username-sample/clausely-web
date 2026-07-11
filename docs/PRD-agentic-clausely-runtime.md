# PRD: Agentic Clausely Runtime

## Summary

Clausely needs one autonomous agent runtime that can control every product surface: matters, documents, drafting, registry simulation, strategy, vault, playbooks, templates, research, calendar, billing, exports, and desktop integrations.

The current app already has the right product direction, but AI calls are scattered across UI components and some features call `http://localhost:8080` directly. This PRD defines the migration to a typed, tool-driven runtime where the AI can plan, execute, inspect results, revise, and recover across the whole Clausely ecosystem.

## Primary Goal

A user should be able to type or speak:

- "Create a new writ petition for ABC Corp against the State of Maharashtra."
- "Create a new playbook for eviction defense."
- "Run a strategy on maintainability and open the strategy tab."
- "Format this document for Bombay High Court with correct margins, header, footer, and page numbering."
- "Export this as DOCX and PDF."

Clausely should complete the task end to end by calling internal tools, changing app state, creating the requested entities, opening the correct workspace, and showing the result.

## Non-Negotiable Architecture Decisions

1. Frontend components must not call `localhost:8080` for AI generation, chat, strategy, validation, backup, or export.
2. All AI behavior must go through a single Clausely Agent Runtime.
3. Supported model backends are:
   - `minicpm5_local`
   - `gemma4_e2b_local`
   - `gemma4_e4b_local`
   - `api_provider`
4. Browser local models may only use browser-compatible runtimes such as WebGPU, WASM, ONNX Runtime Web, or MLC/WebLLM.
5. Desktop local models may use native CPU, RAM, GPU, or bundled runtimes.
6. API providers are allowed, but must be routed through a provider adapter with privacy controls.
7. Agent tools must be typed, auditable, permission-aware, and reusable by web, desktop, MCP, ChatGPT Desktop, Claude Code, Codex, and future connectors.

## Product Scope

### In Scope

- Autonomous intent routing.
- Full tool catalog for Clausely features.
- Browser and desktop model routing.
- Local model support for MiniCPM5, Gemma4 E2B, and Gemma4 E4B where runtime-compatible.
- API provider fallback.
- Agent-friendly DOCX editor and formatter.
- Strategy runner automation.
- Matter, playbook, template, vault, research, registry, calendar, billing, and export tools.
- MCP server for Clausely Desktop.
- Connector-ready HTTP API for web/cloud integrations.
- Audit trail for every agent action.

### Out of Scope for First Implementation

- Fully replacing the editor with a mature word processor in one sprint.
- Guaranteeing browser-native local inference if a model is not available in a WebGPU/WASM/ONNX-compatible format.
- Letting the model perform irreversible legal or billing actions without confirmation.

## Current State

Relevant files:

- `src/components/drafting-studio.tsx`
- `src/components/dashboard-home.tsx`
- `src/components/registry-simulator.tsx`
- `src/components/strategist-swarm.tsx`
- `src/utils/webLlmClient.ts`

Current issues:

- AI calls are embedded inside React components.
- Drafting, chat, backup, export, validation, and strategy call `localhost:8080`.
- Gemini fallback is client-side and hardcoded.
- The AI currently returns text, but cannot reliably perform app actions.
- The document editor stores pages as editable HTML text, making precise DOCX semantics difficult.
- Strategy and registry flows are UI-specific instead of tool-call-driven.

## Target Experience

The AI should behave like a legal-ops version of Codex or Claude Code:

1. Understand the user request.
2. Inspect current app state.
3. Decide which tools are needed.
4. Execute tools in order.
5. Verify the result.
6. Open the relevant UI surface.
7. Explain what it did.
8. Ask for confirmation only when required by risk policy.

Example:

User: "Create a new doc for a Bombay HC writ petition and run strategy."

Agent plan:

1. `matter.search_or_create`
2. `document.create`
3. `document.generate`
4. `document.apply_court_rules`
5. `document.validate_format`
6. `strategy.run`
7. `navigation.open_tab`
8. `ui.show_result`

## Model Runtime Policy

### Model Backends

```ts
export type ClauselyModelBackend =
  | "minicpm5_local"
  | "gemma4_e2b_local"
  | "gemma4_e4b_local"
  | "api_provider";
```

### Execution Targets

```ts
export type ClauselyExecutionTarget =
  | "browser_webgpu"
  | "browser_wasm"
  | "browser_onnx"
  | "desktop_native"
  | "cloud_api";
```

### Model Capabilities

```ts
export interface ClauselyModelCapability {
  backend: ClauselyModelBackend;
  executionTargets: ClauselyExecutionTarget[];
  supportsTools: boolean;
  supportsJsonMode: boolean;
  supportsLongContext: boolean;
  maxContextTokens: number;
  recommendedTasks: ClauselyTaskType[];
}
```

### Default Routing

- Use `minicpm5_local` for quick intent detection, command routing, small edits, summaries, and formatting classification.
- Use `gemma4_e2b_local` for everyday drafting, clause generation, playbook generation, registry explanations, and document edits.
- Use `gemma4_e4b_local` for deeper drafting, strategy analysis, multi-step reasoning, document restructuring, and review.
- Use `api_provider` for long context, complex legal drafting, complex DOCX generation, fallback, and premium quality.

### Browser Feasibility

The browser cannot run arbitrary native Python or llama.cpp processes directly. Browser-native local inference is achievable only when the model is available in a browser-compatible runtime and quantization.

Acceptable browser runtimes:

- WebGPU through WebLLM/MLC.
- ONNX Runtime Web.
- WASM with threads and SIMD.
- Transformers.js-compatible models.

If MiniCPM5, Gemma4 E2B, or Gemma4 E4B cannot run in one of those formats, the browser must choose `api_provider` or ask the user to use Clausely Desktop.

### Desktop Feasibility

Clausely Desktop can run local models more directly because it can bundle or launch native runtimes. Desktop should support:

- Native CPU/RAM inference.
- GPU acceleration when available.
- Local model discovery.
- MCP server exposure.
- Direct filesystem-safe document export.
- Local-only privacy mode.

## Agent Runtime

### Public Interface

```ts
export interface ClauselyAgentRunRequest {
  input: string;
  surface: ClauselySurface;
  context?: ClauselyAgentContext;
  modelPreference?: ClauselyModelBackend;
  privacyMode?: "local_only" | "redacted_api" | "full_api";
  autonomy?: "suggest" | "execute_safe" | "execute_with_confirmations";
}

export interface ClauselyAgentRunResult {
  response: string;
  plan: ClauselyPlanStep[];
  toolCalls: ClauselyToolCallRecord[];
  openedSurface?: ClauselySurface;
  artifacts?: ClauselyArtifact[];
  needsUserConfirmation?: boolean;
}
```

### Runtime Responsibilities

- Normalize user intent.
- Gather app state.
- Select model backend.
- Produce a tool plan.
- Execute typed tools.
- Validate output.
- Update UI state.
- Persist artifacts.
- Log every action.
- Recover from failed tools.

### Surfaces

```ts
export type ClauselySurface =
  | "home"
  | "matters"
  | "drafting_studio"
  | "registry_simulator"
  | "strategist"
  | "vault"
  | "playbooks"
  | "templates"
  | "research"
  | "calendar"
  | "billing"
  | "settings"
  | "desktop_bridge"
  | "mcp";
```

## Tool Catalog

### Navigation Tools

```ts
navigation.open_tab({ tab: ClauselySurface })
navigation.focus_entity({ entityType, entityId })
navigation.open_document({ documentId })
navigation.open_matter({ matterId })
navigation.show_panel({ panel: "rules" | "copilot" | "outline" | "export" })
navigation.get_current_surface()
```

### Matter Tools

```ts
matter.create({ title, clientName, jurisdiction, matterType, tags })
matter.update({ matterId, patch })
matter.search({ query, filters })
matter.get({ matterId })
matter.list({ filters, limit })
matter.add_note({ matterId, note })
matter.link_document({ matterId, documentId })
matter.link_playbook({ matterId, playbookId })
matter.set_status({ matterId, status })
matter.timeline.add_event({ matterId, event })
```

### Document Tools

```ts
document.create({ title, documentType, jurisdiction, matterId })
document.generate({ documentId, prompt, documentType, jurisdiction, facts })
document.get({ documentId })
document.get_text({ documentId })
document.replace_text({ documentId, text })
document.insert_text({ documentId, location, text })
document.edit_range({ documentId, range, replacement })
document.add_page({ documentId, afterPageId })
document.delete_page({ documentId, pageId })
document.set_title({ documentId, title })
document.set_metadata({ documentId, metadata })
document.backup({ documentId })
document.compare_versions({ documentId, leftVersionId, rightVersionId })
document.restore_version({ documentId, versionId })
```

### Document Formatting Tools

```ts
document.format.apply_rules({ documentId, jurisdiction, documentType })
document.format.set_margins({ documentId, top, right, bottom, left, unit })
document.format.set_line_spacing({ documentId, spacing })
document.format.set_font({ documentId, family, sizePt })
document.format.set_header({ documentId, text, alignment })
document.format.set_footer({ documentId, text, alignment, includePageNumber })
document.format.set_page_size({ documentId, size })
document.format.set_numbering({ documentId, scheme })
document.format.normalize_spacing({ documentId })
document.format.validate({ documentId, jurisdiction, documentType })
```

### DOCX Tools

```ts
docx.import({ file })
docx.export({ documentId, format: "docx" | "pdf" | "html" | "txt" })
docx.render_preview({ documentId })
docx.inspect_layout({ documentId })
docx.apply_template({ documentId, templateId })
docx.set_section_properties({ documentId, sectionId, properties })
docx.set_paragraph_style({ documentId, range, style })
docx.set_table_style({ documentId, tableId, style })
docx.repaginate({ documentId })
docx.validate_print_layout({ documentId })
```

### Registry Simulator Tools

```ts
registry.validate_document({ documentId, jurisdiction, registry })
registry.run_scrutiny({ documentId, checklistId })
registry.list_defects({ validationId })
registry.fix_defect({ documentId, defectId })
registry.generate_compliance_report({ documentId, validationId })
```

### Strategy Tools

```ts
strategy.run({ query, matterId, documentIds, sources })
strategy.stop({ runId })
strategy.get_run({ runId })
strategy.list_risks({ runId })
strategy.generate_counterarguments({ runId })
strategy.generate_filing_plan({ runId })
strategy.save_to_matter({ runId, matterId })
strategy.export_report({ runId, format: "pdf" | "docx" | "markdown" })
```

### Playbook Tools

```ts
playbook.create({ title, practiceArea, jurisdiction, goal })
playbook.generate({ playbookId, prompt, sourceMatterIds, sourceDocumentIds })
playbook.get({ playbookId })
playbook.update_step({ playbookId, stepId, patch })
playbook.add_step({ playbookId, step })
playbook.remove_step({ playbookId, stepId })
playbook.run({ playbookId, matterId })
playbook.link_template({ playbookId, templateId })
playbook.export({ playbookId, format })
```

### Template Tools

```ts
template.create({ title, documentType, jurisdiction })
template.generate({ templateId, prompt })
template.apply({ templateId, documentId, variables })
template.extract_variables({ templateId })
template.validate({ templateId })
template.publish({ templateId })
```

### Vault Tools

```ts
vault.upload({ file, matterId, tags })
vault.search({ query, filters })
vault.get({ artifactId })
vault.summarize({ artifactId })
vault.extract_facts({ artifactId })
vault.link_to_matter({ artifactId, matterId })
vault.link_to_document({ artifactId, documentId })
```

### Research Tools

```ts
research.search_cases({ query, jurisdiction, court, dateRange })
research.search_statutes({ query, jurisdiction })
research.verify_citation({ citation })
research.summarize_authority({ authorityId })
research.insert_citation({ documentId, citation, location })
research.create_research_memo({ query, authorities })
```

### Calendar Tools

```ts
calendar.create_event({ title, startsAt, endsAt, matterId })
calendar.create_deadline({ title, dueAt, matterId, rule })
calendar.list({ filters })
calendar.update_event({ eventId, patch })
calendar.link_document({ eventId, documentId })
```

### Billing Tools

```ts
billing.create_time_entry({ matterId, description, durationMinutes, date })
billing.create_expense({ matterId, description, amount, currency })
billing.generate_invoice({ matterId, dateRange })
billing.list_entries({ matterId })
```

### Search Tools

```ts
search.global({ query, scopes })
search.suggest({ query })
search.open_result({ resultId })
```

### Export and Sharing Tools

```ts
export.artifact({ artifactType, artifactId, format })
share.create_link({ artifactType, artifactId, permissions })
share.copy_text({ text })
share.email_draft({ to, subject, body, attachments })
```

### UI and State Tools

```ts
ui.toast({ message, tone })
ui.confirm({ title, body, confirmLabel })
ui.show_diff({ before, after })
ui.show_agent_plan({ steps })
state.get_snapshot()
state.patch({ patch })
```

## Agent-Friendly DOCX Editor Requirements

The editor must stop treating legal documents as plain text only. It needs a structured document model that can round-trip to DOCX.

### Internal Document Model

```ts
export interface ClauselyDocument {
  id: string;
  title: string;
  jurisdiction: string;
  documentType: string;
  sections: ClauselySection[];
  styles: ClauselyStyleSheet;
  page: ClauselyPageSettings;
  header?: ClauselyHeaderFooter;
  footer?: ClauselyHeaderFooter;
  metadata: Record<string, unknown>;
}
```

### Required Editor Capabilities

- Preserve paragraphs, headings, tables, lists, captions, citations, headers, footers, margins, page size, and page numbers.
- Allow the agent to inspect and mutate individual sections.
- Allow deterministic formatting changes.
- Support legal templates with variables.
- Support DOCX import/export.
- Support PDF export.
- Support preview validation.
- Keep a version history.
- Provide a diff view before major rewrites.

### Recommended Libraries to Evaluate

- `docx` for generating DOCX.
- `mammoth` for DOCX import to semantic HTML/text.
- `html-to-docx` for simple export paths.
- `prosemirror` or `tiptap` for structured editing.
- ONLYOFFICE for full editor embedding when the deployment can support its document server requirements.

## Tool Calling Protocol

Every tool must use a JSON schema.

```ts
export interface ClauselyToolDefinition<Input, Output> {
  name: string;
  description: string;
  inputSchema: unknown;
  outputSchema: unknown;
  riskLevel: "safe" | "review" | "confirm" | "restricted";
  handler: (input: Input, context: ClauselyToolContext) => Promise<Output>;
}
```

Risk policy:

- `safe`: navigation, search, read-only inspection, draft generation.
- `review`: document edits, playbook edits, formatting changes.
- `confirm`: send/share/export externally, billing invoice generation, deadline changes.
- `restricted`: destructive deletion, privileged admin actions, external filing.

## External Agent Integration

### Clausely Desktop MCP Server

Clausely Desktop should expose an MCP server with the same tool catalog.

Initial MCP tools:

- `clausely.get_state`
- `clausely.open_surface`
- `clausely.create_matter`
- `clausely.create_document`
- `clausely.generate_document`
- `clausely.format_document`
- `clausely.export_document`
- `clausely.create_playbook`
- `clausely.run_strategy`
- `clausely.validate_registry`
- `clausely.search`

This allows ChatGPT Desktop, Codex, Claude Code, and other MCP clients to drive Clausely directly.

### Web Connector API

The web/cloud version should expose connector-safe HTTP endpoints:

```txt
POST /api/agent/run
POST /api/tools/:toolName
GET  /api/state
GET  /api/artifacts/:artifactId
```

All endpoints must enforce auth, firm isolation, permissions, and audit logging.

## Migration Plan

### Phase 1: Runtime Skeleton

- Create `src/agent/` module.
- Define model backend types.
- Define tool types.
- Add `clauselyAgent.run`.
- Add local app state adapter.
- Add stub tools for navigation, document, strategy, registry, and playbooks.
- Replace component-level intent branching with agent calls.

### Phase 2: Remove Direct `8080` Calls

Replace these direct calls:

- `src/components/drafting-studio.tsx`
- `src/components/dashboard-home.tsx`
- `src/components/registry-simulator.tsx`
- `src/components/strategist-swarm.tsx`

With:

```ts
await clauselyAgent.run({
  input,
  surface,
  context,
  modelPreference,
});
```

### Phase 3: Model Router

- Add `modelRouter.generate`.
- Add adapters:
  - `minicpm5LocalAdapter`
  - `gemma4E2BLocalAdapter`
  - `gemma4E4BLocalAdapter`
  - `apiProviderAdapter`
- Add capability detection for WebGPU/WASM/ONNX.
- Add privacy mode handling.
- Remove hardcoded API keys from frontend code.

### Phase 4: Structured Document Model

- Introduce structured document store.
- Add DOCX export using a deterministic library.
- Add formatting tools.
- Add court-rule presets.
- Add validation output.

### Phase 5: Autonomous Workflows

- Implement compound workflows:
  - Create matter and document.
  - Generate pleading.
  - Format for jurisdiction.
  - Validate registry defects.
  - Run strategy.
  - Generate playbook.
  - Export final artifacts.

### Phase 6: Desktop and MCP

- Build Clausely Desktop bridge.
- Bundle local native model runtime.
- Expose MCP tools.
- Support local-only mode.
- Support external agent clients.

## Acceptance Criteria

### Agent Runtime

- User can ask for a new document and Clausely creates it without manual tab switching.
- User can ask for a playbook and Clausely creates a playbook artifact.
- User can ask to run strategy and Clausely opens the strategy tab and starts a run.
- User can ask for registry validation and Clausely validates the active document.
- Every action is represented as a tool call record.
- No component calls `localhost:8080` directly.

### Models

- User can choose MiniCPM5, Gemma4 E2B, Gemma4 E4B, or API provider.
- Browser detects whether local inference is available.
- Desktop can use native local inference.
- API provider fallback works.
- Local-only mode never calls external APIs.

### DOCX

- Agent can set margins, line spacing, font, header, footer, page size, and page numbers.
- Agent can export DOCX.
- Agent can export PDF.
- Agent can validate document formatting against jurisdiction rules.
- Formatting changes are deterministic and visible in preview.

### External Agents

- ChatGPT Desktop, Codex, Claude Code, or another MCP client can call Clausely Desktop tools.
- External agent can create a document, run strategy, and export output without UI scraping.
- Every external call is permissioned and audited.

## Open Questions

1. Which exact MiniCPM5 build is available for browser or desktop inference?
2. What are the exact Gemma4 E2B and E4B model package names and supported runtimes?
3. Should browser local inference be required for launch, or can it be desktop-first?
4. Which DOCX editor path should be primary: custom structured editor, Tiptap/ProseMirror, ONLYOFFICE, or hybrid?
5. Which API providers should be supported first?
6. What actions require explicit lawyer confirmation?

## Implementation Notes

- The frontend currently exposes an API key in `src/utils/webLlmClient.ts`. This must move to a server-side or desktop-secure secret store before production.
- If using API providers from the browser during development, use temporary local env configuration and never commit real keys.
- Model output should be treated as proposals. Tool handlers perform actual state changes.
- Document export should be deterministic code, not model-generated raw DOCX markup.
- The agent should generate structured JSON tool calls first, then use natural language only for user-facing summaries.
