# Architecture: ONLYOFFICE + Tiptap Agentic Editor

## Decision

Clausely will use a two-editor architecture:

1. Tiptap powers agentic draft mode.
2. ONLYOFFICE powers final Word-like editing mode.

The system must allow both humans and agents to edit the same legal document without losing formatting, overwriting work, or breaking DOCX/PDF export.

## Why Two Editors

Tiptap is best for programmatic, section-level agent control. It gives Clausely a structured document tree the agent can inspect, edit, diff, chunk, summarize, and validate.

ONLYOFFICE is best for high-fidelity DOCX editing. It handles the Word-like surface: margins, headers, footers, page layout, page numbering, tables, styles, and final human review.

The LLM should never drive ONLYOFFICE by clicking toolbar buttons. It should call typed Clausely tools. Those tools update the structured draft model or the canonical DOCX, and ONLYOFFICE displays the current saved file.

## Source of Truth Rules

### Draft Mode

When a document is still being drafted, the source of truth is:

```txt
Tiptap JSON + structured Clausely document model
```

Store:

- Tiptap JSON.
- Plain text snapshot.
- Section tree.
- Paragraph IDs.
- Clause IDs.
- Summaries.
- Embeddings.
- Formatting intent.

### Final Word Mode

When the document enters final review or Word mode, the source of truth becomes:

```txt
Canonical DOCX binary
```

Store:

- DOCX binary.
- Extracted text.
- Extracted structure.
- Layout metadata.
- Version checksum.
- Preview artifacts.
- Export artifacts.

### Hybrid Mode

Clausely may keep both representations, but every edit must declare its base version and target representation.

```ts
type DocumentSourceOfTruth = "tiptap_draft" | "canonical_docx" | "hybrid";
```

If the latest human edit came from ONLYOFFICE, the agent must re-read the latest DOCX-derived structure before editing.

## Human Edit Flow in ONLYOFFICE

```txt
Human edits inside ONLYOFFICE
  -> ONLYOFFICE autosave or force-save
  -> ONLYOFFICE callbackUrl fires
  -> Clausely downloads the updated DOCX
  -> Clausely stores a new document version
  -> Clausely extracts text and structure
  -> Clausely refreshes summaries and embeddings for changed sections
  -> Agent context points to the new latest version
```

The agent must never assume its previous draft is still current.

## Agent Edit Flow

```txt
User gives instruction
  -> Agent reads latest document version
  -> Agent creates plan
  -> Agent selects tool calls
  -> Tool layer applies changes to Tiptap model or DOCX model
  -> Clausely creates a checkpoint
  -> ONLYOFFICE reloads or refreshes current file view
  -> User sees diff or final result
```

For large edits, the agent must generate a preview diff before replacing final DOCX content.

## Autosave Requirements

### Tiptap Autosave

Autosave every few seconds after debounce.

Store:

- JSON document.
- Text snapshot.
- Current selection if available.
- Dirty section IDs.
- Version number.

### ONLYOFFICE Autosave

Use ONLYOFFICE callback handling and force-save before critical operations:

- Before export.
- Before strategy run.
- Before registry validation.
- Before agent rewrite.
- Before closing the editor.

### Version Model

```ts
interface DocumentVersion {
  id: string;
  documentId: string;
  source: "agent" | "human_tiptap" | "human_onlyoffice" | "import" | "export";
  representation: "tiptap_json" | "docx" | "pdf" | "txt" | "html";
  filePath?: string;
  textSnapshot: string;
  structureSnapshot?: unknown;
  baseVersionId?: string;
  checksum: string;
  createdBy: string;
  createdAt: string;
}
```

## Conflict Policy

Before an agent edit:

1. Load latest version.
2. Compare latest version ID with planned base version ID.
3. If they differ, re-plan using the newest document.
4. If the conflict is small, merge.
5. If the conflict is risky, show a diff and ask the user.

The agent cannot silently overwrite a newer human version.

## Export Pipeline

```txt
Latest canonical document
  -> normalize document model
  -> generate DOCX
  -> validate DOCX
  -> convert DOCX to PDF
  -> extract text from DOCX/PDF
  -> compare extracted text with source
  -> create export artifact
```

Supported export targets:

- DOCX.
- PDF.
- TXT.
- HTML.
- Markdown.
- Google Drive DOCX upload.
- Google Docs editable copy.

## Google Docs Export Policy

There are two modes:

```ts
type GoogleDocsExportMode = "upload_docx_as_file" | "convert_to_editable_google_doc";
```

Use `upload_docx_as_file` when fidelity matters. This keeps the DOCX as a file in Drive.

Use `convert_to_editable_google_doc` only when the user wants collaboration inside Google Docs and accepts possible layout reflow.

Google Docs conversion may change page breaks, font rendering, spacing, headers, footers, or tables. Final legal output should remain DOCX/PDF.

## Agent-Friendly Document Model

Every generated legal document should have stable IDs:

```ts
interface LegalDocumentNode {
  id: string;
  type:
    | "cover"
    | "cause_title"
    | "appearance"
    | "section"
    | "heading"
    | "paragraph"
    | "clause"
    | "prayer"
    | "verification"
    | "signature"
    | "table"
    | "citation"
    | "exhibit";
  text?: string;
  children?: LegalDocumentNode[];
  styleId?: string;
  pageHint?: number;
  metadata?: Record<string, unknown>;
}
```

This lets the agent call tools like:

```ts
document.generate_node({ documentId, nodeId: "clause-2.1" })
document.rewrite_node({ documentId, nodeId: "prayer-a" })
document.validate_node({ documentId, nodeId: "cause-title" })
```

## Required Tools

```ts
document.open_in_tiptap({ documentId })
document.open_in_onlyoffice({ documentId })
document.force_save({ documentId })
document.get_latest_version({ documentId })
document.get_structure({ documentId })
document.get_node({ documentId, nodeId })
document.replace_node({ documentId, nodeId, content })
document.insert_node_after({ documentId, afterNodeId, node })
document.create_checkpoint({ documentId, reason })
document.show_diff({ documentId, fromVersionId, toVersionId })
```

Formatting tools:

```ts
document.format.set_margins(...)
document.format.set_header(...)
document.format.set_footer(...)
document.format.set_font(...)
document.format.set_line_spacing(...)
document.format.apply_court_rules(...)
document.format.validate(...)
```

Export tools:

```ts
docx.export(...)
pdf.export(...)
text.export(...)
google_docs.export(...)
export.validate(...)
```

## Storage Recommendation

Supabase can be used for:

- Auth.
- User/firm/matter metadata.
- Document metadata.
- Version metadata.
- Realtime draft autosave.
- Small development files.
- Preferences and memory.

GCP should be used for:

- ONLYOFFICE Document Server.
- Large DOCX/PDF storage.
- Conversion workers.
- Long-running agent jobs.
- Native model workers if needed.

Recommended production split:

```txt
Supabase Postgres/Auth/Realtime
GCP Compute Engine or GKE for ONLYOFFICE
GCP Cloud Storage for final files
GCP Cloud Run or VM workers for conversion/agent jobs
```

## Implementation Phases

### Phase 1

- Add document version tables.
- Add Tiptap draft model.
- Add autosave endpoint.
- Add latest-version resolution.

### Phase 2

- Configure ONLYOFFICE Document Server.
- Add callback handler.
- Add force-save before export/agent actions.
- Store DOCX versions.

### Phase 3

- Add DOCX text/structure extraction.
- Add diff/checkpoint UI.
- Add agent tools for node-level edits.

### Phase 4

- Add export pipeline.
- Add PDF conversion.
- Add Google Drive upload.
- Add export validation.

### Phase 5

- Add large-document indexing.
- Add changed-section summaries.
- Add matter memory and preference learning.

## Acceptance Criteria

- User edits inside ONLYOFFICE autosave into Clausely.
- User edits inside Tiptap autosave into Clausely.
- Agent always reads the latest saved version before editing.
- Agent cannot overwrite newer human changes without conflict handling.
- DOCX export preserves headers, footers, margins, fonts, sections, and page numbering.
- PDF export is generated from the saved DOCX.
- Google Docs export offers both DOCX-as-file and editable-copy modes.
- 400-page documents can be indexed and edited section by section.
- Every edit creates an auditable version.
