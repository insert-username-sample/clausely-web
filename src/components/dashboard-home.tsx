"use client";

import React, { useState } from "react";
import { runClauselyAgent } from "@/agent/clauselyAgent";
import { Activity, BookOpen, FileText, FolderPlus, Loader2, Send, Sparkles, X, MapPin, Globe, ChevronDown, Mic, AudioLines, ShieldCheck, Landmark, MessageSquare, ChevronRight } from "lucide-react";

interface DashboardHomeProps {
  onNavigate: (tab: string) => void;
}

type HomeChatMessage = {
  sender: "user" | "ai";
  text: string;
};

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [homeAiInput, setHomeAiInput] = useState("");
  const [isHomeAiRunning, setIsHomeAiRunning] = useState(false);
  
  const [showJuriDropdown, setShowJuriDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedJuri, setSelectedJuri] = useState("MH-HC");
  const [selectedLang, setSelectedLang] = useState("en");

  const [useWebGpu, setUseWebGpu] = useState(false);
  const [webGpuProgressText, setWebGpuProgressText] = useState("");
  const [webGpuProgressVal, setWebGpuProgressVal] = useState(0);

  const startVoiceInput = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setWebGpuProgressText("Listening... Speak now.");
    setWebGpuProgressVal(0.5);

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setHomeAiInput(prev => `${prev} ${transcript}`.trim());
      setWebGpuProgressText("");
      setWebGpuProgressVal(0);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setWebGpuProgressText("Voice dictation error. Try again.");
      setTimeout(() => {
        setWebGpuProgressText("");
        setWebGpuProgressVal(0);
      }, 3000);
    };

    recognition.start();
  };

  const startLiveTalk = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Live Talk requires Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setWebGpuProgressText("Live Talk active: Speak your request...");
    setWebGpuProgressVal(0.3);

    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (!transcript.trim()) {
        setWebGpuProgressText("");
        setWebGpuProgressVal(0);
        return;
      }

      setWebGpuProgressText(`Heard: "${transcript}". Running Clausely harness...`);
      setWebGpuProgressVal(0.6);

      try {
        const result = await runClauselyAgent({
          input: transcript,
          surface: "home",
          task: "draft_document",
          modelPreference: "minicpm5_local",
          privacyMode: "local_only",
          context: {
            jurisdiction: selectedJuri,
            documentType: "Writ Petition",
            firmId: "firm_123",
          },
        });
        const reply = result.committedArtifacts.find(artifact => artifact.type === "document")?.text || result.response;

        setWebGpuProgressText("Speaking response...");
        setWebGpuProgressVal(0.9);

        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(reply);
          utterance.lang = "en-US";
          window.speechSynthesis.speak(utterance);
        }

        if (typeof window !== "undefined") {
          (window as any).__INITIAL_DRAFT__ = reply;
          (window as any).__INITIAL_JURISDICTION__ = selectedJuri;
          (window as any).__INITIAL_CHAT_MESSAGES__ = [
            { sender: "user", text: transcript },
            { sender: "ai", text: reply }
          ];
        }

        setWebGpuProgressText("");
        setWebGpuProgressVal(0);
        onNavigate("drafting");
      } catch (err: any) {
        console.error(err);
        setWebGpuProgressText(`Live Talk Error: ${err.message || err}`);
        setTimeout(() => {
          setWebGpuProgressText("");
          setWebGpuProgressVal(0);
        }, 5000);
      }
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setWebGpuProgressText("Live Talk voice error.");
      setTimeout(() => {
        setWebGpuProgressText("");
        setWebGpuProgressVal(0);
      }, 3000);
    };

    recognition.start();
  };

  const juriLabels: Record<string, string> = {
    "MH-HC": "Maharashtra",
    "MH-DISTRICT": "Maharashtra District",
    "DL-DISTRICT": "Delhi",
    "IN-SC": "Supreme Court",
  };

  const langLabels: Record<string, string> = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
  };

  const handleStrategicIntakeClick = () => {
    onNavigate("strategist");
  };

  const handleWatchDemoClick = () => {
    setShowDemoVideo(true);
  };

  const submitHomeAi = async (overrideMessage?: string) => {
    const command = (overrideMessage ?? homeAiInput).trim();
    if (!command || isHomeAiRunning) return;

    setHomeAiInput("");

    // If the prompt contains "create" or "draft", automatically route and continue the chat!
    const isCreateOrDraft = /\b(create|draft)\b/i.test(command);
    if (isCreateOrDraft) {
      if (typeof window !== "undefined") {
        (window as any).__INITIAL_CHAT_PROMPT__ = command;
        (window as any).__INITIAL_JURISDICTION__ = selectedJuri;
      }
      onNavigate("drafting");
      return;
    }

    setIsHomeAiRunning(true);

    try {
      setWebGpuProgressText("Running Clausely local harness...");
      setWebGpuProgressVal(0.35);

      const result = await runClauselyAgent({
        input: command,
        surface: "home",
        task: /\b(?:review|check|analy[sz]e)\b/i.test(command) ? "review_document" : "draft_document",
        modelPreference: "minicpm5_local",
        privacyMode: "local_only",
        context: {
          jurisdiction: selectedJuri,
          documentType: "Writ Petition",
          firmId: "firm_123",
        },
      });
      const draftText = result.committedArtifacts.find(artifact => artifact.type === "document")?.text || "";
      
      // Store initial state for Drafting Studio to consume
      if (typeof window !== "undefined") {
        (window as any).__INITIAL_DRAFT__ = draftText;
        (window as any).__INITIAL_JURISDICTION__ = selectedJuri;
        (window as any).__INITIAL_CHAT_MESSAGES__ = [
          { sender: "user", text: command },
          { sender: "ai", text: result.response || "Draft compiled through the Clausely local harness." }
        ];
      }

      setWebGpuProgressText("");
      setWebGpuProgressVal(0);
      // Navigate to drafting studio
      onNavigate("drafting");
    } catch (error) {
      console.error(error);
      if (typeof window !== "undefined") {
        (window as any).__INITIAL_CHAT_MESSAGES__ = [
          { sender: "user", text: command },
          { sender: "ai", text: "The Clausely local harness could not complete that command. Try a narrower drafting instruction." }
        ];
      }
      setWebGpuProgressText("");
      setWebGpuProgressVal(0);
      onNavigate("drafting");
    } finally {
      setIsHomeAiRunning(false);
    }
  };

  return (
    <div className="dashboard-scrollable-content">
      {/* Welcome Hero Banner */}
      <div className="welcome-hero-banner">
        <div className="hero-left">
          <span className="hero-greeting">WELCOME BACK, MANAS 👋</span>
          <h1 className="hero-headline">AI for lawyers.<br />Built to think deeper.</h1>
          <p className="hero-body-text">Multi-agent reasoning, verified by evidence. Challenge assumptions. Reduce risk. Win cases.</p>
          <div className="hero-actions-row">
            <button className="btn-primary" id="btnStrategicIntake" onClick={handleStrategicIntakeClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>New Strategic Intake</span>
            </button>
            <button className="btn-secondary" id="btnWatchDemo" onClick={handleWatchDemoClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" style={{ marginRight: "6px" }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8" fill="#2563eb"></polygon>
              </svg>
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Network swarm graphic visualizer */}
        <div className="hero-right">
          <div className="agent-network-graphics">
            {/* SVG Background with dotted connection paths & orbitals */}
            <svg className="agent-network-svg" width="100%" height="100%">
              <defs>
                <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(37, 99, 235, 0.15)" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                </linearGradient>
              </defs>
              {/* Concentric orbital paths */}
              <ellipse cx="50%" cy="50%" rx="160" ry="80" fill="none" stroke="url(#orbitGrad)" strokeWidth="1" strokeDasharray="4 6" />
              <ellipse cx="50%" cy="50%" rx="100" ry="50" fill="none" stroke="url(#orbitGrad)" strokeWidth="1" strokeDasharray="3 5" />
              
              {/* Dotted connection lines to floating agent nodes */}
              <line x1="50%" y1="50%" x2="28%" y2="24%" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="1.5" strokeDasharray="3 4" />
              <line x1="50%" y1="50%" x2="28%" y2="76%" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="1.5" strokeDasharray="3 4" />
              <line x1="50%" y1="50%" x2="72%" y2="24%" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="1.5" strokeDasharray="3 4" />
              <line x1="50%" y1="50%" x2="72%" y2="76%" stroke="rgba(37, 99, 235, 0.2)" strokeWidth="1.5" strokeDasharray="3 4" />

              {/* Moving pulse dots along paths */}
              <circle cx="28%" cy="24%" r="3" fill="#2563eb" className="pulse-dot-1" />
              <circle cx="28%" cy="76%" r="3" fill="#10b981" className="pulse-dot-2" />
              <circle cx="72%" cy="24%" r="3" fill="#a78bfa" className="pulse-dot-3" />
              <circle cx="72%" cy="76%" r="3" fill="#f59e0b" className="pulse-dot-4" />
            </svg>

            {/* Central Isometric Platform Base */}
            <div className="hub-platform-base"></div>

            {/* Central card with logo */}
            <div className="hub-card-container">
              <div className="hub-logo-card">
                <img src="/clausely_pinwheel.png" className="central-pinwheel-symbol" alt="Central Pinwheel" />
              </div>
              <div className="hub-pulsating-glow"></div>
            </div>
            
            {/* Floating Agent Cards */}
            <div className="agent-node research-node">
              <div className="agent-node-badge color-research">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div className="agent-node-info">
                <div className="agent-node-name">Research Agent</div>
                <div className="agent-node-summary">Finds relevant laws, cases & precedents</div>
              </div>
            </div>
            <div className="agent-node verifier-node">
              <div className="agent-node-badge color-verifier">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 11 11 13 15 9"></polyline>
                </svg>
              </div>
              <div className="agent-node-info">
                <div className="agent-node-name">Verifier Agent</div>
                <div className="agent-node-summary">Verifies facts & checks reliability</div>
              </div>
            </div>
            <div className="agent-node analyst-node">
              <div className="agent-node-badge color-analyst">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div className="agent-node-info">
                <div className="agent-node-name">Analyst Agent</div>
                <div className="agent-node-summary">Breaks issues into key dimensions</div>
              </div>
            </div>
            <div className="agent-node strategist-node">
              <div className="agent-node-badge color-strategist">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <div className="agent-node-info">
                <div className="agent-node-name">Strategist Agent</div>
                <div className="agent-node-summary">Generates strategies & recommendations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Dashboard Chat Split Section */}
      <div className="home-chat-split-container">
        
        {/* Left: Chat Pill Input Area */}
        <div className="home-chat-left-area">
          <div className="home-chat-header">
            <h2 className="home-chat-greeting">Good morning, Manas 👋</h2>
            <p className="home-chat-subtitle">What are you drafting today?</p>
          </div>

          <form
            className="home-chat-pill-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitHomeAi();
            }}
          >
            <input
              type="text"
              className="home-chat-input"
              placeholder="Describe what you need to draft..."
              value={homeAiInput}
              onChange={(event) => setHomeAiInput(event.target.value)}
              disabled={isHomeAiRunning}
            />
            
            <div className="home-chat-controls">
              <button 
                type="button" 
                className="chat-pill-icon-btn" 
                title="Voice Input"
                onClick={startVoiceInput}
              >
                <Mic className="h-5 w-5" />
              </button>
              <button 
                type="button" 
                className="chat-pill-icon-btn" 
                title="Audio Scrutiny"
                onClick={startLiveTalk}
              >
                <AudioLines className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="chat-pill-send-btn"
                disabled={isHomeAiRunning || !homeAiInput.trim()}
                title="Send Command"
              >
                {isHomeAiRunning ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img src="/clausely_pinwheel.png" className="send-pinwheel-logo" alt="Send" />
                )}
              </button>
            </div>
          </form>

          {webGpuProgressText && (
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center space-y-2 select-none shadow-md">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
                Initializing In-Browser Gemini Model
              </span>
              <p className="text-xs text-slate-400 leading-relaxed font-mono truncate max-w-full">
                {webGpuProgressText}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1.5 transition-all duration-300" 
                  style={{ width: `${Math.round(webGpuProgressVal * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="home-chat-dropdowns">
            {/* Jurisdiction Dropdown */}
            <div className="relative">
              <button 
                type="button" 
                className="chat-dropdown-btn"
                onClick={() => {
                  setShowJuriDropdown(!showJuriDropdown);
                  setShowLangDropdown(false);
                }}
              >
                <MapPin className="h-4 w-4" />
                <span>Jurisdiction: <strong>{juriLabels[selectedJuri]}</strong></span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showJuriDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#0e1424] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                  {Object.entries(juriLabels).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-blue-600 transition-colors"
                      onClick={() => {
                        setSelectedJuri(key);
                        setShowJuriDropdown(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="relative">
              <button 
                type="button" 
                className="chat-dropdown-btn"
                onClick={() => {
                  setShowLangDropdown(!showLangDropdown);
                  setShowJuriDropdown(false);
                }}
              >
                <Globe className="h-4 w-4" />
                <span>Language: <strong>{langLabels[selectedLang]}</strong></span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showLangDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#0e1424] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1">
                  {Object.entries(langLabels).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-blue-600 transition-colors"
                      onClick={() => {
                        setSelectedLang(key);
                        setShowLangDropdown(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Runtime Status */}
            <button 
              type="button" 
              className="chat-dropdown-btn border-blue-500 bg-blue-500/10 text-blue-400 font-bold"
            >
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
              <span>Runtime: <strong>Local Harness</strong></span>
            </button>
          </div>
        </div>

        {/* Right: 2x2 Grid of 4 Action Tiles */}
        <div className="home-chat-right-area">
          <div className="action-card-tile blue" onClick={() => onNavigate("drafting")}>
            <div>
              <div className="action-card-icon-wrapper">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="action-card-title">Draft Document</h4>
              <p className="action-card-desc">Generate court-ready documents from intent</p>
            </div>
            <ChevronRight className="action-card-arrow h-4 w-4" />
          </div>

          <div className="action-card-tile green" onClick={() => {
            if (typeof window !== "undefined") {
              (window as any).__INITIAL_CHAT_MESSAGES__ = [
                { sender: "ai", text: "Ready to review your document. Please paste or write details." }
              ];
            }
            onNavigate("drafting");
          }}>
            <div>
              <div className="action-card-icon-wrapper">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="action-card-title">Review Document</h4>
              <p className="action-card-desc">AI review for risks, gaps & improvements</p>
            </div>
            <ChevronRight className="action-card-arrow h-4 w-4" />
          </div>

          <div className="action-card-tile purple" onClick={() => onNavigate("registry")}>
            <div>
              <div className="action-card-icon-wrapper">
                <Landmark className="h-5 w-5" />
              </div>
              <h4 className="action-card-title">Registry Check</h4>
              <p className="action-card-desc">Pre-file scrutiny & defect prediction</p>
            </div>
            <ChevronRight className="action-card-arrow h-4 w-4" />
          </div>

          <div className="action-card-tile amber" onClick={() => {
            if (typeof window !== "undefined") {
              (window as any).__INITIAL_CHAT_MESSAGES__ = [
                { sender: "ai", text: "How can I help you with Indian legal questions today?" }
              ];
            }
            onNavigate("drafting");
          }}>
            <div>
              <div className="action-card-icon-wrapper">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="action-card-title">Ask Legal AI</h4>
              <p className="action-card-desc">Get instant answers to legal queries</p>
            </div>
            <ChevronRight className="action-card-arrow h-4 w-4" />
          </div>
        </div>

      </div>

      {/* Main Dashboard Split Layout */}
      <div className="dashboard-split-layout">
        
        {/* Left Main Column */}
        <div className="dashboard-main-col">
          {/* Stats Grid Cards */}
          <div className="content-panel-card">
            <h3 className="panel-card-title">At a glance</h3>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-icon color-blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="stat-metrics">
                  <span className="stat-metric-number">24</span>
                  <span className="stat-metric-label">Active Matters</span>
                  <span className="stat-metric-delta positive">+12% this month</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon color-green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="stat-metrics">
                  <span className="stat-metric-number">156</span>
                  <span className="stat-metric-label">Documents</span>
                  <span className="stat-metric-delta positive">+8% this month</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon color-purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                  </svg>
                </div>
                <div className="stat-metrics">
                  <span className="stat-metric-number">18</span>
                  <span className="stat-metric-label">Analyses</span>
                  <span className="stat-metric-delta positive">+25% this month</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon color-amber">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <div className="stat-metrics">
                  <span className="stat-metric-number">47</span>
                  <span className="stat-metric-label">Playbook Uses</span>
                  <span className="stat-metric-delta positive">+15% this month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Activity Feed side-by-side Row */}
          <div className="actions-feed-row-grid">
            
            {/* Quick Actions */}
            <div className="content-panel-card">
              <h3 className="panel-card-title">Quick Actions</h3>
              <div className="actions-grid-tiles">
                <button className="action-grid-tile" id="qaNewIntake" onClick={handleStrategicIntakeClick}>
                  <div className="tile-icon icon-blue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    </svg>
                  </div>
                  <span>New Strategic Intake</span>
                </button>
                <button className="action-grid-tile" id="qaUploadDoc" onClick={() => onNavigate("registry")}>
                  <div className="tile-icon icon-green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <span>Upload Document</span>
                </button>
                <button className="action-grid-tile" id="qaAskResearch" onClick={() => onNavigate("research")}>
                  <div className="tile-icon icon-purple">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <span>Ask Research</span>
                </button>
                <button className="action-grid-tile" id="qaDraftStudio" onClick={() => onNavigate("drafting")}>
                  <div className="tile-icon icon-red">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <span>Draft in Studio</span>
                </button>
                <button className="action-grid-tile" id="qaSimRegistry" onClick={() => onNavigate("registry")}>
                  <div className="tile-icon icon-amber">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="9" x2="15" y2="9"></line>
                    </svg>
                  </div>
                  <span>Simulate Registry</span>
                </button>
                <button className="action-grid-tile" id="qaBrowsePlaybooks" onClick={() => onNavigate("playbooks")}>
                  <div className="tile-icon icon-pink">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    </svg>
                  </div>
                  <span>Browse Playbooks</span>
                </button>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="content-panel-card">
              <div className="panel-card-header-row">
                <h3 className="panel-card-title">Activity Feed</h3>
                <button className="btn-card-action">View all</button>
              </div>
              <div className="activity-timeline">
                <div className="timeline-row">
                  <div className="timeline-bullet bullet-blue"></div>
                  <div className="timeline-content">
                    <p className="timeline-body-text">Strategic analysis completed for <strong>ABC Corp vs State of Maharashtra</strong></p>
                    <span className="timeline-timestamp">2h ago</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-bullet bullet-green"></div>
                  <div className="timeline-content">
                    <p className="timeline-body-text">Document <strong>"Lease_Agreement_2023.pdf"</strong> uploaded to vault</p>
                    <span className="timeline-timestamp">5h ago</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-bullet bullet-purple"></div>
                  <div className="timeline-content">
                    <p className="timeline-body-text">New playbook <strong>"Eviction Defense Strategy"</strong> added to vault</p>
                    <span className="timeline-timestamp">1d ago</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-bullet bullet-amber"></div>
                  <div className="timeline-content">
                    <p className="timeline-body-text">Research note created on <strong>"Maintainability of Writ Petition"</strong></p>
                    <span className="timeline-timestamp">1d ago</span>
                  </div>
                </div>
                <div className="timeline-row">
                  <div className="timeline-bullet bullet-red"></div>
                  <div className="timeline-content">
                    <p className="timeline-body-text">Registry simulation completed for <strong>Delhi District Court</strong></p>
                    <span className="timeline-timestamp">2d ago</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Strategist CTA ribbon */}
          <div className="bottom-cta-banner">
            <div className="banner-details">
              <div className="banner-icon-container">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <div className="banner-texts">
                <span className="banner-headline">Clausely Strategist</span>
                <span className="banner-description">Run multi-angle analysis with our AI strategist swarm.</span>
              </div>
            </div>
            
            <div className="banner-features">
              <div className="banner-feature-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
                <span>Multi-angle Analysis</span>
              </div>
              <div className="banner-feature-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Risk & Opp Mapping</span>
              </div>
              <div className="banner-feature-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span>Fallback Strategies</span>
              </div>
              <div className="banner-feature-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                </svg>
                <span>Insights</span>
              </div>
            </div>

            <button className="banner-cta-btn" id="btnStartAnalysis" onClick={() => onNavigate("strategist")}>
              Start Analysis
            </button>
          </div>

        </div>

        {/* Right Side Column (Recent Matters) */}
        <div className="dashboard-side-col">
          <div className="content-panel-card full-panel-height">
            <div className="panel-card-header-row">
              <h3 className="panel-card-title">Recent Matters</h3>
              <button className="btn-card-action" id="viewAllMattersBtn" onClick={() => onNavigate("matters")}>
                View all
              </button>
            </div>
            
            <div className="recent-matters-container">
              <div className="matter-item-row animate-stream" style={{ animationDelay: "0.1s" }}>
                <div className="matter-item-icon bg-blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  </svg>
                </div>
                <div className="matter-item-text">
                  <div className="matter-item-title">ABC Corp vs State of Maharashtra</div>
                  <div className="matter-item-desc">Civil Writ Petition • Bombay HC</div>
                </div>
                <span className="matter-item-time">Updated 2h ago</span>
                <button className="matter-row-options-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>

              <div className="matter-item-row animate-stream" style={{ animationDelay: "0.2s" }}>
                <div className="matter-item-icon bg-green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  </svg>
                </div>
                <div className="matter-item-text">
                  <div className="matter-item-title">Sharma Family Partition Dispute</div>
                  <div className="matter-item-desc">Civil Suit • Delhi District Court</div>
                </div>
                <span className="matter-item-time">Updated 5h ago</span>
                <button className="matter-row-options-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>

              <div className="matter-item-row animate-stream" style={{ animationDelay: "0.3s" }}>
                <div className="matter-item-icon bg-amber">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  </svg>
                </div>
                <div className="matter-item-text">
                  <div className="matter-item-title">TechNova vs InnovateX</div>
                  <div className="matter-item-desc">Commercial Suit • NCLT Bengaluru</div>
                </div>
                <span className="matter-item-time">Updated 1d ago</span>
                <button className="matter-row-options-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>

              <div className="matter-item-row animate-stream" style={{ animationDelay: "0.4s" }}>
                <div className="matter-item-icon bg-red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  </svg>
                </div>
                <div className="matter-item-text">
                  <div className="matter-item-title">R.K. Builders vs MCD</div>
                  <div className="matter-item-desc">Arbitration • ICC</div>
                </div>
                <span className="matter-item-time">Updated 2d ago</span>
                <button className="matter-row-options-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>

              <div className="matter-item-row animate-stream" style={{ animationDelay: "0.5s" }}>
                <div className="matter-item-icon bg-purple">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  </svg>
                </div>
                <div className="matter-item-text">
                  <div className="matter-item-title">Neha Verma Employment Matter</div>
                  <div className="matter-item-desc">Labour Dispute • Labour Court</div>
                </div>
                <span className="matter-item-time">Updated 3d ago</span>
                <button className="matter-row-options-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showDemoVideo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full relative shadow-2xl">
            <button 
              onClick={() => setShowDemoVideo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Clausely Platform Demo</h3>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
              <video src="/clausely_demo.mp4" controls autoPlay className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
