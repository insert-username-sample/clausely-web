# Roadmap: Agentic Clausely Implementation

## Planning Package

Read these files together:

1. `PRD-agentic-clausely-runtime.md`
2. `ARCHITECTURE-onlyoffice-tiptap-agentic-editor.md`
3. `ARCHITECTURE-deterministic-model-harness.md`
4. `ENGINEERING-deterministic-model-harness.md`

The PRD defines what Clausely must become. The editor architecture defines how human and agent edits stay safe. The deterministic harness architecture defines how MiniCPM5, Gemma4 E2B, Gemma4 E4B, and API models work together. The engineering spec defines the modules, interfaces, execution loop, validators, persistence tables, and first implementation slice.

## Final Architecture

```txt
User speech/text
  -> Clausely Agent Runtime
  -> Planner model
  -> Deterministic harness
  -> Typed Clausely tools
  -> Tiptap draft model and/or canonical DOCX
  -> ONLYOFFICE final editor
  -> Autosave/versioning
  -> Export DOCX/PDF/TXT/HTML/Google Drive
```

## Key Decisions

- No frontend component should call `localhost:8080` directly.
- Every AI action must go through the Clausely Agent Runtime.
- MiniCPM5 should execute small verified tasks, not full long-context workflows.
- Gemma4 E2B, Gemma4 E4B, or API providers should plan or review complex workflows.
- Tiptap is the programmable draft editor.
- ONLYOFFICE is the final DOCX fidelity editor.
- Canonical DOCX is the source of truth after final Word mode begins.
- Every human and agent edit creates a version.
- Agent edits must re-read the latest version before applying changes.
- Google Docs editable export is allowed, but final legal fidelity should remain DOCX/PDF.

## Phase 0: Clean Current AI Calls

Goal: centralize AI calls.

Tasks:

- Create `src/agent/`.
- Create `src/agent/clauselyAgent.ts`.
- Create `src/agent/modelRouter.ts`.
- Create `src/agent/toolRegistry.ts`.
- Move current Gemini call out of `src/utils/webLlmClient.ts`.
- Replace direct `localhost:8080` calls in components with `clauselyAgent.run`.

Acceptance:

- Components submit user intent to one runtime.
- No component owns model selection.
- No component hardcodes backend AI URLs.

## Phase 1: Tool Registry

Goal: make Clausely tool-callable.

Initial tools:

- `navigation.open_tab`
- `matter.create`
- `document.create`
- `document.generate_node`
- `document.replace_node`
- `document.format.apply_court_rules`
- `document.force_save`
- `registry.validate_document`
- `strategy.run`
- `playbook.create`
- `docx.export`
- `pdf.export`

Acceptance:

- The agent can create a document and open Drafting Studio.
- The agent can open Strategist and run a strategy simulation.
- The agent can create a playbook artifact.

## Phase 2: Deterministic Harness

Goal: make local small models reliable.

Tasks:

- Add plan schema.
- Add task schema.
- Add validators.
- Add retry/repair/escalation logic.
- Add per-task model routing.
- Add execution log.

Acceptance:

- MiniCPM5 can generate one section through small tasks.
- Failed JSON/tool output is retried.
- Bad output escalates to Gemma/API.
- The harness commits only validated chunks.

## Phase 3: Tiptap Draft Mode

Goal: make the editor agent-friendly.

Tasks:

- Add Tiptap editor.
- Store Tiptap JSON.
- Add stable node IDs.
- Add autosave.
- Add section tree.
- Add section summaries.
- Add diff/checkpoint UI.

Acceptance:

- Agent can generate and edit clause-level content.
- Human edits autosave.
- Agent can target a specific section or paragraph.

## Phase 4: ONLYOFFICE Final Mode

Goal: preserve Word formatting.

Tasks:

- Deploy ONLYOFFICE Document Server.
- Configure editor embed.
- Add callback handler.
- Add force-save.
- Store DOCX versions.
- Extract text/structure from saved DOCX.
- Refresh agent index after save.

Acceptance:

- Human edits inside ONLYOFFICE autosave into Clausely.
- Agent sees latest human edits before acting.
- DOCX remains canonical after final mode begins.

## Phase 5: Export Pipeline

Goal: reliable outputs.

Tasks:

- DOCX export.
- PDF conversion from DOCX.
- TXT/HTML/Markdown export.
- Google Drive DOCX upload.
- Optional editable Google Docs conversion.
- Export validation.

Acceptance:

- DOCX preserves margins, headers, footers, line spacing, page numbers, fonts, and tables.
- PDF is generated from the saved DOCX.
- Text extraction confirms content was not lost.
- Google Docs mode warns about possible reflow.

## Phase 6: Large Case Handling

Goal: handle 400-page matters.

Tasks:

- Chunk documents into sections/paragraphs.
- Create embeddings.
- Create summaries.
- Track dirty ranges.
- Build case memory.
- Add strategy context builder.

Acceptance:

- Agent can answer and edit using targeted chunks.
- Strategy runner can use matter summaries and selected source chunks.
- MiniCPM5 never needs the full 400-page context.

## Phase 7: Desktop and MCP

Goal: let external agents control Clausely.

Tasks:

- Create Clausely Desktop bridge.
- Expose MCP server.
- Add local model runtime support.
- Add secure tool permissions.
- Add audit logs for external calls.

Acceptance:

- ChatGPT Desktop, Codex, Claude Code, and other MCP clients can create documents, run strategy, and export files through Clausely tools.

## Production Hosting Recommendation

Use Supabase for:

- Auth.
- Postgres metadata.
- Realtime autosave.
- RLS permissions.
- Preferences.
- Matter/document/playbook records.

Use GCP for:

- ONLYOFFICE Document Server.
- Cloud Storage for large files.
- Conversion workers.
- Long-running agent jobs.
- Native model workers if needed.

## First Build Milestone

The first real milestone should be:

```txt
User says: "Create a Bombay HC writ petition, format it, review it, and open it in Word mode."

Clausely:
1. Creates a matter if needed.
2. Creates a document.
3. Plans sections using Gemma/API.
4. Generates each section with MiniCPM5 small tasks.
5. Validates each section.
6. Applies court formatting.
7. Opens in ONLYOFFICE.
8. Autosaves human edits.
9. Exports DOCX/PDF.
```

This proves the whole architecture from zero to final output.
