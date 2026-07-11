"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
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

  const sendCopilotMessage = async (message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || isChatSending) return;

    const outgoing = { sender: "user", text: cleanMessage };
    const history = chatMessages;
    setChatMessages(prev => [...prev, outgoing]);
    setActiveSidebarTab("copilot");
    setIsChatSending(true);

    try {
      const response = await fetch("http://localhost:8080/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          history,
          context: {
            surface: "drafting-studio",
            jurisdiction,
            document_type: documentType,
            document_text: getDocumentText(),
            current_document: getDocumentText(),
            firm_id: "firm_123",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Copilot endpoint returned an error");
      }

      const data = await response.json();
      const generatedText = typeof data.document_text === "string" && data.document_text.trim()
        ? `${data.response || "Generated draft."}\n\n${data.document_text.replaceAll("---PAGE_BREAK---", "\n\n")}`
        : data.response || "Done. I routed that through the Clausely backend.";
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: generatedText,
        },
      ]);
    } catch (error) {
      console.warn("FastAPI backend offline, falling back to client-side Gemini API: ", error);
      try {
        const { generateClientSideText } = await import("../utils/webLlmClient");
        
        // Construct prompt with chat history context
        const historyText = history.map(m => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`).join("\n");
        const fullPrompt = `Document content:
${getDocumentText()}

Chat history:
${historyText}

User message: ${cleanMessage}

As Clausely AI, respond to the user message in the context of the document. If they ask to add, edit, or modify the document, write the updated document text or new clauses clearly.`;

        const replyText = await generateClientSideText(fullPrompt, "gemini-3.5-flash");
        
        setChatMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: replyText || "No response generated by client-side Gemini.",
          },
        ]);
      } catch (geminiError: any) {
        console.error("Gemini fallback error: ", geminiError);
        setChatMessages(prev => [
          ...prev,
          {
            sender: "ai",
            text: `Failed to fetch: Local backend (8080) is offline, and Gemini client fallback failed: ${geminiError.message || geminiError}`,
          },
        ]);
      }
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
      // 1. Check if this is a general greeting or conversational prompt (instead of document generation)
      const isGreeting = /^(?:hi|hello|hey|greetings|howdy|sup)\b/i.test(userPrompt.trim());
      const isCopilotAction = /\b(?:matter|playbook|strategy|strategist|registry|sfe|validate|scrutiny)\b/i.test(userPrompt);
      if (isGreeting || isCopilotAction) {
        await sendCopilotMessage(userPrompt);
        setIsDrafting(false);
        return;
      }

      // 2. Check if this is a request to start a new document
      const isNewDocRequest = /new\s+(?:doc|petition|agreement|contract|pleading|affidavit|statement)|start\s+fresh|create\s+new/i.test(userPrompt);
      if (isNewDocRequest) {
        const currentDocText = pageRefs.current
          .filter(Boolean)
          .map(el => el!.innerText)
          .join("\n\n---PAGE_BREAK---\n\n");
          
        try {
          await fetch("http://localhost:8080/api/v1/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              document_text: currentDocText,
              document_title: documentType.replace(/\s+/g, "_")
            })
          });
          setChatMessages(prev => [
            ...prev,
            { sender: "ai", text: "Backup saved. Starting a fresh document now." }
          ]);
          setActiveSidebarTab("copilot");
        } catch (backupError) {
          console.warn("Failed to backup document: ", backupError);
        }
      }

      // 3. Native MiniCPM generation for ordinary draft/text requests.
      const generationRes = await fetch("http://localhost:8080/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          document_type: documentType,
          jurisdiction,
          review_with_gemma: false,
          context: {
            surface: "drafting-studio",
            document_type: documentType,
            jurisdiction,
            document_text: getDocumentText(),
            current_document: getDocumentText(),
          },
        })
      });

      if (!generationRes.ok) {
        throw new Error("Native MiniCPM generation endpoint returned error");
      }

      const data = await generationRes.json();
      if (data.document_text) {
        // Split text by page break tokens or divide logically
        const parts = data.document_text.split("---PAGE_BREAK---");
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
            text: `${data.response || "Generated draft."} Model: ${data.model || "MiniCPM 5"}.`,
          }
        ]);
      }
    } catch (error) {
      console.warn("Native MiniCPM generation error, trying client-side Gemini fallback: ", error);
      try {
        const { generateClientSideText } = await import("../utils/webLlmClient");
        const fullPrompt = `You are Clausely In-Browser Drafting Core. Generate a court-ready document draft of category "${documentType}" for jurisdiction "${jurisdiction}". User prompt: ${userPrompt}. Return only the document text. Use '---PAGE_BREAK---' for page splits.`;
        
        const clientText = await generateClientSideText(fullPrompt, "gemini-3.5-flash");
        if (clientText && clientText.trim()) {
          const parts = clientText.split("---PAGE_BREAK---");
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
              text: `Generated draft using client-side Gemini fallback.`,
            }
          ]);
          return;
        }
      } catch (geminiError) {
        console.error("Gemini draft fallback failed: ", geminiError);
      }

      // Fallback local template generation
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

  const handleExport = async (format: "pdf" | "docx") => {
    setShowExportDropdown(false);
    
    // Read text from all page elements dynamically
    const docText = pageRefs.current
      .filter(Boolean)
      .map(el => el!.innerText)
      .join("\n\n---PAGE_BREAK---\n\n");

    try {
      const response = await fetch("http://localhost:8080/api/v1/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: docText,
          jurisdiction: jurisdiction,
          format: format,
          metadata: {
            title: "Service_Agreement",
            document_type: documentType
          }
        })
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Service_Agreement.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Failed to export document. Please ensure the backend server is running on port 8080.");
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

          {/* Document Editor Placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-black/10 p-12 text-center overflow-y-auto">
            <div className="max-w-xl w-full p-8 bg-white dark:bg-[#11121a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Clausely Document Viewer</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm">
                Workspace is ready. Use the AI Copilot sidebar on the right to query, draft, or refine your legal documents.
              </p>
              {getDocumentText() && (
                <div className="w-full text-left p-5 bg-slate-50 dark:bg-[#090a0f] border border-slate-200 dark:border-slate-800/80 rounded-2xl max-h-[360px] overflow-y-auto font-mono text-[11px] text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text shadow-inner">
                  {getDocumentText()}
                </div>
              )}
            </div>
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
