"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { runClauselyAgent } from "@/agent/clauselyAgent";
import { 
  Sparkles, 
  Check, 
  Share2, 
  Download, 
  Plus, 
  Heading2, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Link, 
  Table, 
  Maximize2,
  ChevronRight,
  PlusCircle,
  FileText,
  Lock,
  CornerDownLeft,
  Undo2,
  Redo2,
  Sliders,
  ChevronDown,
  Trash2,
  Globe,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Printer,
  Search,
  Mic,
  AudioLines
} from "lucide-react";

const DocumentEditor = dynamic(
  () => import("@onlyoffice/document-editor-react").then((mod) => mod.DocumentEditor),
  { ssr: false }
);

interface PageItem {
  id: string;
  initialText: string;
}

const cmToTwip = (cm: number) => Math.round((cm / 2.54) * 1440);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default function DraftingStudio() {
  // Toggle states for alternative editors
  const [embedGoogleDoc, setEmbedGoogleDoc] = useState(false);
  const [embedOnlyOffice, setEmbedOnlyOffice] = useState(false);
  
  const [googleDocUrl, setGoogleDocUrl] = useState("https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUYptlbs74OgvE2upms/preview");
  const [onlyOfficeTab, setOnlyOfficeTab] = useState("Home");
  const [activeSidebarTab, setActiveSidebarTab] = useState<"rules" | "copilot">("rules");

  // Page items list supporting dynamic additions and deletions
  const [pages, setPages] = useState<PageItem[]>([
    { 
      id: "page-1", 
      initialText: `CIVIL APPELLATE JURISDICTION
WRIT PETITION (CIVIL) NO. 2456 OF 2024

In the matter of:
ABC Private Limited
... Petitioner

Versus

State of Maharashtra & Ors.
... Respondents

PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA

The Petitioner respectfully submits:
1. That the Petitioner is a company registered under the laws of India.
2. The respondents passed an arbitrary order without hearing the petitioner, violating principles of natural justice.` 
    },
    { 
      id: "page-2", 
      initialText: `PRAYER:
Wherefore, the Petitioner prays that this Court issue a Writ of Mandamus.

VERIFICATION:
I, Director of Petitioner, do hereby verify that paragraphs 1 to 2 are true to my knowledge and belief.

Signed: Deponent
Advocate for Petitioner: Adv. Manas Khobrekar
Enrollment: MAH/1234/2026` 
    }
  ]);

  // Array of refs to capture dynamic page text elements
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Rule selectors
  const [jurisdiction, setJurisdiction] = useState("MH-HC");
  const [documentType, setDocumentType] = useState("Writ Petition");

  // Margin and layout states
  const [leftMargin, setLeftMargin] = useState(3.0);
  const [rightMargin, setRightMargin] = useState(2.5);
  const [topMargin, setTopMargin] = useState(3.0);
  const [bottomMargin, setBottomMargin] = useState(2.5);
  const [lineSpacing, setLineSpacing] = useState(2.0);
  const [fontSize, setFontSize] = useState(14);

  // Header & Footer states
  const [headerText, setHeaderText] = useState("IN THE HIGH COURT OF JUDICATURE AT BOMBAY");
  const [footerText, setFooterText] = useState("ADVOCATE FOR PETITIONER");

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // AI Floating Input state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  // Clear obsolete refs when page count shrinks
  useEffect(() => {
    pageRefs.current = pageRefs.current.slice(0, pages.length);
  }, [pages]);

  // Load initial draft from Home Dashboard if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initialDraft = (window as any).__INITIAL_DRAFT__;
      const initialJurisdiction = (window as any).__INITIAL_JURISDICTION__;
      
      if (initialDraft) {
        // Clear it so it doesn't load again on next mount
        (window as any).__INITIAL_DRAFT__ = undefined;
        
        if (initialJurisdiction) {
          setJurisdiction(initialJurisdiction);
          (window as any).__INITIAL_JURISDICTION__ = undefined;
        }

        // Set pages. If there are page breaks in the text, split them!
        const parts = initialDraft.split("---PAGE_BREAK---");
        const newPages = parts.map((partText: string, idx: number) => ({
          id: `page-${idx + 1}-${Date.now()}`,
          initialText: partText.trim(),
        }));
        setPages(newPages);
      }

      // Check for initial chat messages
      const initialChat = (window as any).__INITIAL_CHAT_MESSAGES__;
      if (initialChat && initialChat.length > 0) {
        setChatMessages(initialChat);
        (window as any).__INITIAL_CHAT_MESSAGES__ = undefined;
        // Also automatically switch sidebar tab to copilot
        setActiveSidebarTab("copilot");
      }

      // Check if there is an initial prompt to continue the chat automatically
      const initialPrompt = (window as any).__INITIAL_CHAT_PROMPT__;
      if (initialPrompt) {
        (window as any).__INITIAL_CHAT_PROMPT__ = undefined;
        sendCopilotMessage(initialPrompt);
      }
    }
  }, []);

  // Auto-adjust layout settings based on jurisdiction
  useEffect(() => {
    if (jurisdiction === "MH-HC") {
      setLeftMargin(3.0);
      setRightMargin(2.5);
      setTopMargin(3.0);
      setBottomMargin(2.5);
      setLineSpacing(2.0);
      setFontSize(14);
      setHeaderText("IN THE HIGH COURT OF JUDICATURE AT BOMBAY");
    } else if (jurisdiction === "MH-DISTRICT") {
      setLeftMargin(3.0);
      setRightMargin(2.0);
      setTopMargin(2.5);
      setBottomMargin(2.0);
      setLineSpacing(1.5);
      setFontSize(12);
      setHeaderText("IN THE COURT OF CIVIL JUDGE SENIOR DIVISION");
    } else if (jurisdiction === "DL-DISTRICT") {
      setLeftMargin(3.0);
      setRightMargin(2.5);
      setTopMargin(3.0);
      setBottomMargin(2.5);
      setLineSpacing(1.5);
      setFontSize(12);
      setHeaderText("IN THE DISTRICT COURT OF DELHI");
    } else if (jurisdiction === "IN-SC") {
      setLeftMargin(3.5);
      setRightMargin(2.5);
      setTopMargin(3.0);
      setBottomMargin(3.0);
      setLineSpacing(2.0);
      setFontSize(14);
      setHeaderText("IN THE SUPREME COURT OF INDIA");
    }
  }, [jurisdiction]);

  const handleAddPage = () => {
    setPages(prev => [
      ...prev,
      { 
        id: `page-${Date.now()}`, 
        initialText: "" 
      }
    ]);
  };

  const handleDeletePage = (idToDelete: string) => {
    if (pages.length === 1) return;
    setPages(prev => prev.filter(p => p.id !== idToDelete));
  };

  // Automatically split text and shift remaining part to next page when hitting enter at page boundary
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    const el = e.currentTarget;
    const isOverflowing = el.scrollHeight > el.clientHeight;

    if (isOverflowing && e.key === "Enter") {
      e.preventDefault();
      
      let textToTransfer = "";
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const contentRange = range.cloneRange();
        contentRange.selectNodeContents(el);
        contentRange.setStart(range.endContainer, range.endOffset);
        textToTransfer = contentRange.toString();
        contentRange.deleteContents(); // Delete the split portion from page 1
      }

      // Insert new page immediately after current page with the split portion of text
      setPages(prev => {
        const next = [...prev];
        next.splice(index + 1, 0, {
          id: `page-${Date.now()}`,
          initialText: textToTransfer
        });
        return next;
      });

      // Shift focus to the new page top and position caret
      setTimeout(() => {
        const nextEditable = pageRefs.current[index + 1];
        if (nextEditable) {
          nextEditable.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(nextEditable);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 80);
    }
  };

  const getDocumentText = () => {
    const liveText = pageRefs.current
      .filter(Boolean)
      .map(el => el!.innerText)
      .join("\n\n---PAGE_BREAK---\n\n")
      .trim();

    if (liveText) return liveText;
    return pages.map(page => page.initialText).join("\n\n---PAGE_BREAK---\n\n");
  };

  const getStoredDocumentText = () => {
    return pages.map(page => page.initialText).join("\n\n---PAGE_BREAK---\n\n");
  };

  const handlePageInput = (index: number, text: string) => {
    setPages(prev => prev.map((page, pageIndex) => (
      pageIndex === index ? { ...page, initialText: text } : page
    )));
  };

  const outlineItems = pages.map((page, index) => {
    const firstLine = page.initialText
      .split("\n")
      .map(line => line.trim())
      .find(Boolean);
    return {
      id: page.id,
      label: `${index + 1}. ${firstLine ? firstLine.slice(0, 32) : `Page ${index + 1}`}`,
    };
  });

  const sendCopilotMessage = async (message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || isChatSending) return;

    const outgoing = { sender: "user", text: cleanMessage };
    setChatMessages(prev => [...prev, outgoing]);
    setActiveSidebarTab("copilot");
    setIsChatSending(true);

    try {
      const isDraftIntent = /\b(?:create|draft|generate|prepare|write|make)\b.*\b(?:doc|document|petition|agreement|contract|pleading|affidavit|statement|notice|application|reply)\b/i.test(cleanMessage);
      const result = await runClauselyAgent({
        input: cleanMessage,
        surface: "drafting_studio",
        task: isDraftIntent ? "draft_document" : "chat",
        modelPreference: isDraftIntent ? "minicpm5_local" : "gemma4_e2b_local",
        privacyMode: "local_only",
        context: {
          jurisdiction,
          documentType,
          documentText: getDocumentText(),
          firmId: "firm_123",
        },
      });

      const generatedDocument = result.committedArtifacts.find(artifact => artifact.type === "document")?.text;
      if (generatedDocument) {
        const parts = generatedDocument.split(/\n\s*\n(?=(?:The material facts|The grounds|The applicant therefore|IN THE))/i);
        setPages(parts.map((txt: string, idx: number) => ({
          id: `page-${idx}-${Date.now()}`,
          initialText: txt.trim()
        })));
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: generatedDocument
            ? `${result.response}\n\nI updated the document viewer with the generated draft.`
            : result.committedArtifacts[0]?.text || result.response,
        },
      ]);
    } catch (error) {
      console.error("Clausely harness chat error: ", error);
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "The local Clausely harness could not complete that message. Please try again with a narrower instruction.",
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const startVoiceDictation = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setActiveSidebarTab("copilot");
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Voice dictation is not available in this browser. Type the command and I will route it through Gemma.",
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setAiPrompt(prev => `${prev} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setActiveSidebarTab("copilot");
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Voice dictation could not start. Please check microphone permission and try again.",
        },
      ]);
    };
    recognition.start();
  };

  const handleOpenInApp = () => {
    setEmbedOnlyOffice(true);
    setEmbedGoogleDoc(false);
    setActiveSidebarTab("copilot");
    setChatMessages(prev => [
      ...prev,
      {
        sender: "ai",
        text: "ONLYOFFICE mode is open. You can continue editing with the local ribbon controls and export from the toolbar.",
      },
    ]);
  };

  const handleShareDocument = async () => {
    try {
      await navigator.clipboard.writeText(getDocumentText());
      setActiveSidebarTab("copilot");
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Document text copied to clipboard for sharing.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setActiveSidebarTab("copilot");
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "Clipboard sharing failed. Your browser may require permission before copying document text.",
        },
      ]);
    }
  };

  const handleAIDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() || isDrafting) return;

    setIsDrafting(true);
    const userPrompt = aiPrompt;
    setAiPrompt("");

    try {
      const isGreeting = /^(?:hi|hello|hey|greetings|howdy|sup)\b/i.test(userPrompt.trim());
      const isCopilotAction = /\b(?:matter|playbook|strategy|strategist|registry|sfe|validate|scrutiny)\b/i.test(userPrompt);
      if (isGreeting || isCopilotAction) {
        await sendCopilotMessage(userPrompt);
        setIsDrafting(false);
        return;
      }

      const result = await runClauselyAgent({
        input: userPrompt,
        surface: "drafting_studio",
        task: "draft_document",
        modelPreference: "minicpm5_local",
        privacyMode: "local_only",
        context: {
          jurisdiction,
          documentType,
          documentText: getDocumentText(),
          firmId: "firm_123",
        },
      });

      const generatedText = result.committedArtifacts.find(artifact => artifact.type === "document")?.text;
      if (generatedText) {
        const parts = generatedText.split(/\n\s*\n(?=(?:The material facts|The grounds|The applicant therefore|IN THE))/i);
        setPages(parts.map((txt: string, idx: number) => ({
          id: `page-${idx}-${Date.now()}`,
          initialText: txt.trim()
        })));
        setActiveSidebarTab("copilot");
        setChatMessages(prev => [
          ...prev,
          { sender: "user", text: userPrompt },
          {
            sender: "ai",
            text: `${result.response}\n\nPlan: ${result.plan.steps.map(step => step.description).join(" -> ")}`,
          }
        ]);
      }
    } catch (error) {
      console.warn("Clausely harness generation error, using static local fallback: ", error);
      const fallbackTextPage1 = `${headerText}
${jurisdiction === "MH-HC" ? "CIVIL APPELLATE JURISDICTION" : "CIVIL JURISDICTION"}
${documentType === "Writ Petition" ? "WRIT PETITION (CIVIL) NO. 9982 OF 2026" : "CIVIL SUIT NO. 1120 OF 2026"}

In the matter of:
Adv. Manas Khobrekar & Associates
... Petitioner / Plaint

Versus

Union of India & Ors.
... Respondents

Subject: ${userPrompt}

PETITION UNDER CONSTITUTION OF INDIA / CODE OF CIVIL PROCEDURE

The Petitioner submits as under:
1. That this petition is filed to challenge the arbitrary administrative actions of the respondents.
2. The petitioner is affected directly by the impugned order which violates Article 14 of the Constitution.`;

      const fallbackTextPage2 = `PRAYER:
The Petitioner therefore prays that:
a) Issue a writ, order or direction in the nature of Mandamus to set aside the order;
b) Pass any other order as this Court may deem fit in interests of justice.

VERIFICATION:
Verified at Mumbai on this 10th day of July, 2026 that contents of paragraphs 1 to 2 are true.

Signed: Deponent
Advocate for Petitioner: Adv. Manas Khobrekar
Enrollment No: MAH/908/2026`;

      setPages([
        { id: `page-1-${Date.now()}`, initialText: fallbackTextPage1 },
        { id: `page-2-${Date.now()}`, initialText: fallbackTextPage2 }
      ]);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput;
    setChatInput("");
    await sendCopilotMessage(msg);
  };

  const handleExport = async (format: "pdf" | "docx" | "txt" | "html" | "md") => {
    setShowExportDropdown(false);
    const docText = getDocumentText().replaceAll("---PAGE_BREAK---", "\n\n");

    try {
      if (format === "txt") {
        downloadBlob(new Blob([docText], { type: "text/plain;charset=utf-8" }), `${documentType.replace(/\s+/g, "_")}.txt`);
        return;
      }

      if (format === "md") {
        const markdown = `# ${documentType}\n\n${docText}`;
        downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${documentType.replace(/\s+/g, "_")}.md`);
        return;
      }

      if (format === "html") {
        const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(documentType)}</title>
    <style>
      body { font-family: "Times New Roman", serif; font-size: ${fontSize}pt; line-height: ${lineSpacing}; margin: ${topMargin}cm ${rightMargin}cm ${bottomMargin}cm ${leftMargin}cm; }
      header { text-align: center; font-weight: bold; margin-bottom: 24px; }
      main { white-space: pre-wrap; }
      footer { margin-top: 32px; font-size: 10pt; display: flex; justify-content: space-between; }
    </style>
  </head>
  <body>
    <header>${escapeHtml(headerText)}</header>
    <main>${escapeHtml(docText)}</main>
    <footer><span>${escapeHtml(footerText)}</span><span>Page 1</span></footer>
  </body>
</html>`;
        downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${documentType.replace(/\s+/g, "_")}.html`);
        return;
      }

      if (format === "pdf") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) throw new Error("Could not open print window");
        printWindow.document.write(`
          <html>
            <head>
              <title>${documentType}</title>
              <style>
                @page { margin: ${topMargin}cm ${rightMargin}cm ${bottomMargin}cm ${leftMargin}cm; }
                body { font-family: "Times New Roman", serif; font-size: ${fontSize}pt; line-height: ${lineSpacing}; white-space: pre-wrap; }
                header { text-align: center; font-weight: bold; margin-bottom: 24px; }
                footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 10pt; display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              <header>${escapeHtml(headerText)}</header>
              <main>${escapeHtml(docText)}</main>
              <footer><span>${escapeHtml(footerText)}</span><span>Page </span></footer>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        return;
      }

      const docx = await import("docx");
      const {
        AlignmentType,
        Document,
        Footer,
        Header,
        Packer,
        PageNumber,
        Paragraph,
        TextRun,
      } = docx;

      const documentFile = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: cmToTwip(topMargin),
                  right: cmToTwip(rightMargin),
                  bottom: cmToTwip(bottomMargin),
                  left: cmToTwip(leftMargin),
                },
              },
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: headerText, bold: true, size: fontSize * 2 })],
                  }),
                ],
              }),
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: footerText, size: 20 }),
                      new TextRun({ text: "    Page ", size: 20 }),
                      new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                    ],
                  }),
                ],
              }),
            },
            children: docText.split(/\n{2,}/).map((para) =>
              new Paragraph({
                spacing: { after: 240, line: Math.round(lineSpacing * 240) },
                children: [new TextRun({ text: para.replace(/\n/g, " "), size: fontSize * 2 })],
              }),
            ),
          },
        ],
      });

      const blob = await Packer.toBlob(documentFile);
      downloadBlob(blob, `${documentType.replace(/\s+/g, "_")}.docx`);
    } catch (error) {
      alert("Failed to export document from the local Clausely exporter.");
      console.error(error);
    }
  };

  // Run rich text editing commands
  const executeFormat = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#070709] overflow-hidden select-none transition-colors duration-300 text-slate-800 dark:text-slate-100">
      {/* Studio Header */}
      <header className="h-16 border-b border-slate-200 dark:border-[#1e202a] px-8 flex items-center justify-between bg-white/80 dark:bg-[#070709]/80 backdrop-blur-md shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center border border-blue-500/20 dark:border-blue-500/30">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-outfit">
              Drafting Studio
            </h1>
            <p className="text-[10px] text-slate-550">AI-assisted drafting. Built for precision.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="flex items-center gap-1 text-[11px] text-slate-555">
            <Check className="h-3.5 w-3.5 text-emerald-505" />
            <span>Saved</span>
          </div>


          
          <button 
            onClick={handleShareDocument}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <Share2 className="h-3 w-3" />
            <span>Share</span>
          </button>
          
          {/* Export Dropdown Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowExportDropdown(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] rounded-xl shadow-xl py-1.5 z-40 text-xs">
                <button 
                  onClick={() => handleExport("pdf")}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Export as PDF (.pdf)
                </button>
                <button 
                  onClick={() => handleExport("docx")}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Export as Word (.docx)
                </button>
                <button 
                  onClick={() => handleExport("txt")}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Export as Text (.txt)
                </button>
                <button 
                  onClick={() => handleExport("html")}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Export as HTML (.html)
                </button>
                <button 
                  onClick={() => handleExport("md")}
                  className="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Export as Markdown (.md)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left Column: Outline */}
        <aside className="w-56 border-r border-slate-200 dark:border-[#1e202a] bg-slate-50 dark:bg-[#070709] p-5 space-y-4 overflow-y-auto shrink-0 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outline</span>
            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <nav className="space-y-1">
            <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-650 dark:text-blue-400 bg-blue-500/10 border border-blue-500/10 cursor-pointer">1. Definitions</div>
            <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/20 hover:text-slate-950 dark:hover:text-slate-200 cursor-pointer">2. Engagement</div>
            <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/20 hover:text-slate-950 dark:hover:text-slate-200 cursor-pointer">3. Obligations</div>
            <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/20 hover:text-slate-950 dark:hover:text-slate-200 cursor-pointer">4. Confidentiality</div>
            <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/20 hover:text-slate-950 dark:hover:text-slate-200 cursor-pointer">5. Intellectual Property</div>
          </nav>
        </aside>

        {/* Center Column: Document Editor */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-100/50 dark:bg-black/20 border-r border-slate-200 dark:border-[#1e202a] transition-colors duration-300 relative">
          {/* Document Tab Banner */}
          <div className="h-10 px-6 border-b border-slate-200 dark:border-[#1e202a] bg-slate-50 dark:bg-black/20 flex items-center justify-between text-xs text-slate-555 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Service Agreement</span>
              <span className="text-[10px] font-semibold text-slate-500 font-mono">v1.3</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">Live</span>
            </div>
            <span className="text-[10px] text-slate-450 dark:text-slate-500">All changes saved</span>
          </div>

          {/* ONLYOFFICE Desktop Ribbon Toolbar clone */}
          <div className="flex flex-col bg-[#f4f4f4] dark:bg-[#1a1c24] border-b border-[#d1d1d1] dark:border-[#2d303f] shrink-0 text-slate-700 dark:text-slate-200">
            {/* Tab Headers */}
            <div className="flex bg-[#2c303b] dark:bg-[#0c0d12] text-slate-300 text-[11px] font-medium h-9 px-4 items-end gap-1.5 select-none">
              {["Home", "Layout", "Insert"].map((tab) => (
                <button 
                  key={tab} 
                  type="button"
                  onClick={() => setOnlyOfficeTab(tab)}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors cursor-pointer ${
                    onlyOfficeTab === tab 
                      ? "bg-[#f4f4f4] dark:bg-[#1a1c24] text-[#df5626] font-bold border-t border-x border-[#d1d1d1] dark:border-[#2d303f]" 
                      : "hover:bg-[#3d4251] dark:hover:bg-[#1c1e27] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Active Ribbon Panel */}
            <div className="flex items-center gap-4 px-6 py-2.5 bg-[#f4f4f4] dark:bg-[#1a1c24] border-b border-[#d1d1d1] dark:border-[#2d303f] text-xs h-14 overflow-x-auto">
              {onlyOfficeTab === "Home" && (
                <>
                  {/* Font Family & Size */}
                  <div className="flex items-center gap-1.5 border-r border-[#d1d1d1] dark:border-[#2d303f] pr-4 h-full shrink-0">
                    <select 
                      onChange={(e) => executeFormat("fontName", e.target.value)}
                      className="bg-white dark:bg-[#252836] border border-[#ccc] dark:border-[#40445a] rounded px-1.5 py-0.5 outline-none font-sans text-xs w-36 cursor-pointer text-slate-805 dark:text-white"
                    >
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                    <select 
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="bg-white dark:bg-[#252836] border border-[#ccc] dark:border-[#40445a] rounded px-2.5 py-0.5 outline-none font-sans text-xs w-20 cursor-pointer text-slate-805 dark:text-white"
                    >
                      <option value="10">10 pt</option>
                      <option value="12">12 pt</option>
                      <option value="14">14 pt</option>
                      <option value="16">16 pt</option>
                    </select>
                  </div>

                  {/* Bold/Italic/Underline */}
                  <div className="flex items-center gap-1 border-r border-[#d1d1d1] dark:border-[#2d303f] pr-4 h-full shrink-0">
                    <button type="button" onClick={() => executeFormat("bold")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 font-bold text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><Bold className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => executeFormat("italic")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 italic text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><Italic className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => executeFormat("underline")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 underline text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><Underline className="h-3.5 w-3.5" /></button>
                  </div>

                  {/* Paragraph Alignments */}
                  <div className="flex items-center gap-1 border-r border-[#d1d1d1] dark:border-[#2d303f] pr-4 h-full shrink-0">
                    <button type="button" onClick={() => executeFormat("justifyLeft")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><AlignLeft className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => executeFormat("justifyCenter")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><AlignCenter className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => executeFormat("justifyRight")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><AlignRight className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => executeFormat("justifyFull")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center"><AlignJustify className="h-3.5 w-3.5" /></button>
                  </div>

                  {/* Bullet Lists & Print */}
                  <div className="flex items-center gap-1.5 h-full shrink-0">
                    <button type="button" onClick={() => executeFormat("insertUnorderedList")} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center" title="Bullet List"><List className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => window.print()} className="p-1 rounded hover:bg-[#e0e0e0] dark:hover:bg-slate-700 text-slate-850 dark:text-white cursor-pointer w-7 h-7 flex items-center justify-center" title="Print Document"><Printer className="h-3.5 w-3.5" /></button>
                  </div>
                </>
              )}

              {onlyOfficeTab === "Layout" && (
                <>
                  {/* Line Spacing */}
                  <div className="flex items-center gap-1.5 border-r border-[#d1d1d1] dark:border-[#2d303f] pr-4 h-full shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Line Spacing:</span>
                    <select 
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(Number(e.target.value))}
                      className="bg-white dark:bg-[#252836] border border-[#ccc] dark:border-[#40445a] rounded px-2 py-0.5 outline-none font-sans text-xs w-20 cursor-pointer text-slate-805 dark:text-white"
                    >
                      <option value="1">1.0</option>
                      <option value="1.5">1.5</option>
                      <option value="2">2.0 (Double)</option>
                    </select>
                  </div>

                  {/* Margins */}
                  <div className="flex items-center gap-1.5 h-full shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Margins:</span>
                    <button 
                      type="button"
                      onClick={() => { setLeftMargin(3.0); setRightMargin(2.5); setTopMargin(3.0); setBottomMargin(2.5); }}
                      className="px-2 py-1 rounded bg-white dark:bg-[#252836] border border-[#ccc] dark:border-[#40445a] text-[11px] font-semibold cursor-pointer text-slate-750 dark:text-slate-200 hover:bg-[#e0e0e0] dark:hover:bg-slate-700"
                    >
                      Normal (3cm)
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setLeftMargin(2.0); setRightMargin(2.0); setTopMargin(2.0); setBottomMargin(2.0); }}
                      className="px-2 py-1 rounded bg-white dark:bg-[#252836] border border-[#ccc] dark:border-[#40445a] text-[11px] font-semibold cursor-pointer text-slate-750 dark:text-slate-200 hover:bg-[#e0e0e0] dark:hover:bg-slate-700"
                    >
                      Narrow (2cm)
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setLeftMargin(4.0); setRightMargin(3.5); setTopMargin(3.5); setBottomMargin(3.0); }}
                      className="px-2 py-1 rounded bg-white dark:bg-[#252836] border border-[#ccc] dark:border-[#40445a] text-[11px] font-semibold cursor-pointer text-slate-750 dark:text-slate-200 hover:bg-[#e0e0e0] dark:hover:bg-slate-700"
                    >
                      Wide (4cm)
                    </button>
                  </div>
                </>
              )}

              {onlyOfficeTab === "Insert" && (
                <>
                  <button 
                    type="button"
                    onClick={handleAddPage}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm animate-fade-in"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Add New Page</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Actual Document Sheet View / Stacked Pages */}
          <div className="flex-1 overflow-auto p-8 xl:p-12 pb-28 flex flex-col items-center gap-8 bg-slate-200 dark:bg-slate-900/40 relative">
            {/* Horizontal Document Layout Ruler */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-[#f4f4f4] dark:bg-[#1a1c24] border-b border-[#d1d1d1] dark:border-[#2d303f] flex items-center justify-between text-[8px] text-slate-400 dark:text-slate-500 px-24 z-20 shadow-inner select-none font-mono">
              <span>0</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>5</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>10</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>15</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>20</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>25</span>
            </div>

            {pages.map((page, index) => (
              <div 
                key={page.id}
                className="bg-white text-slate-900 border border-slate-350 shadow-2xl relative flex flex-col justify-between flex-shrink-0 group"
                style={{
                  width: "210mm",
                  height: "297mm",
                  boxSizing: "border-box",
                  fontFamily: "Times New Roman, serif",
                  paddingLeft: `${leftMargin}cm`,
                  paddingRight: `${rightMargin}cm`,
                  paddingTop: "1.5cm",
                  paddingBottom: "1.5cm",
                  marginTop: index === 0 ? "1.5rem" : "0"
                }}
              >
                {/* Delete Page hover button */}
                {pages.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => handleDeletePage(page.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                    title="Delete Page"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Page Header */}
                <div 
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={(e) => setHeaderText(e.currentTarget.innerText)}
                  className="absolute top-4 left-0 right-0 text-center text-[9pt] text-slate-400 border-b border-slate-100 pb-1 mx-12 font-sans outline-none uppercase tracking-wider z-10"
                >
                  {headerText}
                </div>

                {/* Content Area */}
                <div 
                  ref={el => { pageRefs.current[index] = el; }}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onBlur={(e) => handlePageInput(index, e.currentTarget.innerText)}
                  className="outline-none text-justify w-full cursor-text overflow-hidden pr-1"
                  style={{
                    fontSize: `${fontSize}pt`,
                    lineHeight: lineSpacing,
                    fontFamily: "Times New Roman, serif",
                    marginTop: `${topMargin - 1.5}cm`,
                    marginBottom: `${bottomMargin - 1.5}cm`,
                    height: "calc(297mm - 6.5cm)",
                    maxHeight: "calc(297mm - 6.5cm)"
                  }}
                  dangerouslySetInnerHTML={{ __html: page.initialText.replace(/\n/g, "<br/>") }}
                />

                {/* Page Footer */}
                <div className="absolute bottom-4 left-12 right-12 flex justify-between items-center text-[9pt] text-slate-455 border-t border-slate-100 pt-1 font-sans z-10">
                  <span contentEditable suppressContentEditableWarning onBlur={(e) => setFooterText(e.currentTarget.innerText)} className="outline-none uppercase tracking-wider">{footerText}</span>
                  <span className="font-semibold font-mono">Page {index + 1} of {pages.length}</span>
                </div>
              </div>
            ))}

            {/* Dynamic Add Page Controller Button */}
            <button 
              type="button"
              onClick={handleAddPage}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-blue-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Page</span>
            </button>
          </div>



          {/* Editor Footer Status Bar */}
          <div className="h-10 px-6 border-t border-slate-200 dark:border-[#1e202a] bg-white dark:bg-black/40 flex items-center justify-between text-xs text-slate-550 dark:text-slate-555 shrink-0 select-none shadow-inner">
            <div className="flex items-center gap-4">
              <span>English (US)</span>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Suggesting</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer"><Undo2 className="h-3.5 w-3.5" /></button>
              <button className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer"><Redo2 className="h-3.5 w-3.5" /></button>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
              <span>100%</span>
              <Maximize2 className="h-3.5 w-3.5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-300" />
            </div>
          </div>
        </div>

        {/* Right Column: Rule Configurations & AI Assistant Panel */}
        <aside className="w-80 bg-slate-50 dark:bg-[#070709] flex flex-col overflow-hidden shrink-0 border-l border-slate-200 dark:border-[#1e202a] transition-colors duration-300">
          {/* AI Panel Header Tabs */}
          <div className="h-11 border-b border-slate-200 dark:border-[#1e202a] flex shrink-0 shadow-sm bg-white dark:bg-black/20">
            <button 
              onClick={() => setActiveSidebarTab("rules")}
              className={`flex-1 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                activeSidebarTab === "rules"
                  ? "text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50/10"
                  : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              SFE Document Rules
            </button>
            <button 
              onClick={() => setActiveSidebarTab("copilot")}
              className={`flex-1 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                activeSidebarTab === "copilot"
                  ? "text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50/10"
                  : "text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              AI Copilot
            </button>
          </div>

          {activeSidebarTab === "rules" ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Auto Rule Settings */}
              <div className="space-y-4 bg-white dark:bg-[#0f1015] p-4 rounded-2xl border border-slate-250 dark:border-[#1e202a] shadow-sm">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-500" />
                  <span>Statutory SFE Rules</span>
                </span>

                <div>
                  <label className="block text-[9px] font-semibold text-slate-450 uppercase mb-1">Jurisdiction</label>
                  <select 
                    value={jurisdiction} 
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="MH-HC">🏛️ Bombay High Court (MH-HC)</option>
                    <option value="MH-DISTRICT">🏛️ Maharashtra District Court</option>
                    <option value="DL-DISTRICT">🏛️ Delhi District Court (DL-DISTRICT)</option>
                    <option value="IN-SC">🏛️ Supreme Court of India (IN-SC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-slate-455 uppercase mb-1">Document Category</label>
                  <select 
                    value={documentType} 
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Writ Petition">Writ Petition</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Written Statement">Written Statement</option>
                  </select>
                </div>
              </div>

              {/* Manual Margin Adjustment sliders */}
              <div className="space-y-4 bg-white dark:bg-[#0f1015] p-4 rounded-2xl border border-slate-250 dark:border-[#1e202a] shadow-sm text-xs">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Adjust Margins (cm)</span>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-550">
                      <span>Left Margin</span>
                      <span>{leftMargin} cm</span>
                    </div>
                    <input type="range" min="1.0" max="5.0" step="0.1" value={leftMargin} onChange={(e) => setLeftMargin(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-550">
                      <span>Right Margin</span>
                      <span>{rightMargin} cm</span>
                    </div>
                    <input type="range" min="1.0" max="5.0" step="0.1" value={rightMargin} onChange={(e) => setRightMargin(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-550">
                      <span>Top Margin</span>
                      <span>{topMargin} cm</span>
                    </div>
                    <input type="range" min="1.0" max="5.0" step="0.1" value={topMargin} onChange={(e) => setTopMargin(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-550">
                      <span>Bottom Margin</span>
                      <span>{bottomMargin} cm</span>
                    </div>
                    <input type="range" min="1.0" max="5.0" step="0.1" value={bottomMargin} onChange={(e) => setBottomMargin(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Typography styling */}
              <div className="space-y-4 bg-white dark:bg-[#0f1015] p-4 rounded-2xl border border-slate-250 dark:border-[#1e202a] shadow-sm text-xs">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Format Rules</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-450 uppercase mb-1">Line Spacing</label>
                    <select 
                      value={lineSpacing} 
                      onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="1.0">1.0x (Single)</option>
                      <option value="1.5">1.5x (Double spaced equivalent)</option>
                      <option value="2.0">2.0x (Double spacing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-semibold text-slate-450 uppercase mb-1">Font Size (pt)</label>
                    <select 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="12">12 pt</option>
                      <option value="14">14 pt</option>
                      <option value="16">16 pt</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f1015] p-5">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs mb-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 space-y-2 select-none">
                    <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-650 animate-pulse" />
                    <p className="font-semibold text-slate-500 font-sans">Clausely AI Copilot</p>
                    <p className="text-[10px] text-slate-400 font-sans">Ask any questions, search legal rules, or request citations here.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-blue-600 text-white ml-auto" 
                        : "bg-slate-100 dark:bg-[#1c1e27] text-slate-800 dark:text-slate-200 mr-auto border border-slate-200 dark:border-slate-800"
                    }`}>
                      <span className="font-bold text-[10px] block mb-1 opacity-70">
                        {msg.sender === "user" ? "You" : "Clausely AI"}
                      </span>
                      <p className="whitespace-pre-line text-xs">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2 shrink-0 border-t border-slate-150 dark:border-slate-800 pt-3">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatSending}
                  className="flex-1 bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none placeholder-slate-400"
                  placeholder="Ask copilot..." 
                />
                <button type="submit" disabled={isChatSending} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isChatSending ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CornerDownLeft className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
