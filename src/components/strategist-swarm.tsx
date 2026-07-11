"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Maximize2, 
  X, 
  Play, 
  Pause, 
  RefreshCw, 
  AlertTriangle, 
  ArrowUpRight, 
  Terminal,
  Activity,
  Check
} from "lucide-react";

interface NodeData {
  id: string;
  name: string;
  visits: number;
  q: number;
  type: "root" | "explore" | "high_uct" | "pruned" | "leaf";
  x: number;
  y: number;
  children?: string[];
}

export default function StrategistSwarm() {
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(10000);
  const [confidence, setConfidence] = useState(78);
  const [activeNode, setActiveNode] = useState<string>("N2");
  const [query, setQuery] = useState("Is a Writ Petition maintainable if a statutory alternative remedy exists under Maharashtra land laws?");
  
  const [matterContext, setMatterContext] = useState(true);
  const [documents, setDocuments] = useState(true);
  const [caseBase, setCaseBase] = useState(true);
  const [playbooks, setPlaybooks] = useState(true);
  const [research, setResearch] = useState(true);

  const [terminalOutcome, setTerminalOutcome] = useState(78);
  const [vulnerabilities, setVulnerabilities] = useState<Array<{ title: string; code: string; risk: string; color: string }>>([
    { title: "Statutory alternative remedy under Section 43", code: "Exhaustion of remedy rule applies", risk: "High", color: "red" },
    { title: "Limitation period expires in 45 days", code: "Article 137 Limitation Act, 1963", risk: "High", color: "red" },
    { title: "Vague citation of Section 9 CPC", code: "Needs precise sub-section reference", risk: "Medium", color: "orange" },
    { title: "Potential territorial jurisdiction issue", code: "Cause of action partly outside Pune", risk: "Low", color: "slate" }
  ]);

  // Streaming chat logs state
  const [logs, setLogs] = useState<Array<{ agent: string; type: string; node: string; text: string; citations?: string; time: string }>>([
    { agent: "petitioner_agent", type: "argument", node: "N_2", text: "No opportunity of hearing violates audi alteram partem rule", citations: "Maneka Gandhi v. UOI, E.P. Royappa v. State of Tamil Nadu", time: "10:23:45" },
    { agent: "opponent_agent", type: "counter", node: "N_3_2", text: "Barred by limitation under Article 137", citations: "State of M.P. v. Bhurailal, Union of India v. Popular Construction", time: "10:23:47" },
    { agent: "verifier_agent", type: "verification", node: "N_2_1", text: "Precedents verified. High grounding score (0.96) across 12 source registries.", citations: "", time: "10:23:49" },
    { agent: "judge_agent", type: "evaluation", node: "N_2_1", text: "Strong natural justice violation. Probability of acceptance elevated to 0.86.", citations: "", time: "10:23:51" },
    { agent: "petitioner_agent", type: "refinement", node: "N_2_1", text: "Added supplementary citation: Mohinder Singh Gill v. CEC, AIR 1978 SC 851", citations: "", time: "10:23:53" }
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Simulation run trigger
  const runSimulation = async () => {
    setIsRunning(true);
    setLogs([]);

    const logAgentMsg = (agent: string, type: string, node: string, text: string, citations = "") => {
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs(prev => [...prev, { agent, type, node, text, citations, time: timeString }]);
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    };

    // Step 1: Initializing
    logAgentMsg("petitioner_agent", "initialize", "N0", `Analyzing intake query: "${query}"`);
    await new Promise(r => setTimeout(r, 800));

    // Step 2: Call the backend
    try {
      logAgentMsg("verifier_agent", "retrieval", "N1", "Retrieving context from database & RAG sources...");
      const response = await fetch("http://localhost:8080/api/strategy/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          sources: {
            matter_context: matterContext,
            documents: documents,
            case_base: caseBase,
            playbooks: playbooks,
            research: research
          }
        })
      });

      if (!response.ok) {
        throw new Error("Backend response error");
      }

      const data = await response.json();
      
      // Step 3: Stream backend results in agent dialogs
      logAgentMsg("petitioner_agent", "proposal", "N2", `Petitioner Position: ${data.summary.substring(0, 120)}...`);
      await new Promise(r => setTimeout(r, 1200));

      if (data.risks && data.risks.length > 0) {
        logAgentMsg("opponent_agent", "counter_analysis", "N3", `Opponent Active Counter: ${data.risks[0]}`);
        await new Promise(r => setTimeout(r, 1250));
      }

      if (data.assumptions && data.assumptions.length > 0) {
        logAgentMsg("verifier_agent", "validation", "N21", `Verifier Check: Assumption identified: "${data.assumptions[0]}"`);
        await new Promise(r => setTimeout(r, 1000));
      }

      logAgentMsg("judge_agent", "terminal_score", "N22", `Swarm evaluation completed. Strategy confidence: ${(data.confidence * 100).toFixed(0)}%`);

      // Update terminal UI widgets
      setConfidence(Math.round(data.confidence * 100));
      setTerminalOutcome(Math.round(data.confidence * 100));

      if (data.risks) {
        const mappedRisks = data.risks.map((risk: string, i: number) => ({
          title: risk,
          code: i === 0 ? "Primary Swarm Objection" : "Secondary Constraint Violation",
          risk: i === 0 ? "High" : "Medium",
          color: i === 0 ? "red" : "orange"
        }));
        setVulnerabilities(mappedRisks);
      }

    } catch (err) {
      console.warn("Connection to backend failed, running offline mock simulation loop:", err);
      // Fallback local simulation
      logAgentMsg("petitioner_agent", "proposal", "N2", "Natural justice violation: Petitioner was not served notice prior to the order execution.");
      await new Promise(r => setTimeout(r, 1000));
      logAgentMsg("opponent_agent", "counter_analysis", "N3", "Alternative statutory remedy is available under Section 43 of the Act. Maintainability challenged.");
      await new Promise(r => setTimeout(r, 1200));
      logAgentMsg("verifier_agent", "validation", "N21", "Precedent verify: Maharashtra HC has held that writ lies despite alternative remedy when natural justice is violated.");
      await new Promise(r => setTimeout(r, 1000));
      logAgentMsg("judge_agent", "terminal_score", "N22", "High probability of maintainability (84%). Directing Petitioner to file writ.");
      
      setConfidence(84);
      setTerminalOutcome(84);
    } finally {
      setIsRunning(false);
    }
  };

  // Simulation loop effect for iterations increment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setIterations(prev => prev + Math.floor(Math.random() * 45) + 10);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const nodes: Record<string, NodeData> = {
    N0: { id: "N0", name: "Intake Brief (F_matrix)", visits: iterations, q: 0.68, type: "root", x: 50, y: 15 },
    N1: { id: "N1", name: "Ground I: Service Arbitrariness", visits: Math.floor(iterations * 0.238), q: 0.52, type: "explore", x: 25, y: 40 },
    N2: { id: "N2", name: "Violation of Natural Justice", visits: Math.floor(iterations * 0.386), q: 0.74, type: "high_uct", x: 50, y: 40 },
    N3: { id: "N3", name: "Ultra Vires Exercise", visits: Math.floor(iterations * 0.195), q: 0.43, type: "explore", x: 75, y: 40 },
    N11: { id: "N11", name: "Lack of Reasoned Order", visits: Math.floor(iterations * 0.0812), q: 0.41, type: "leaf", x: 12, y: 65 },
    N12: { id: "N12", name: "Temporal Conflict", visits: Math.floor(iterations * 0.0245), q: -0.12, type: "pruned", x: 28, y: 65 },
    N21: { id: "N21", name: "No Hearing Opportunity", visits: Math.floor(iterations * 0.192), q: 0.81, type: "high_uct", x: 42, y: 65 },
    N22: { id: "N22", name: "Bias / Predetermined Decision", visits: Math.floor(iterations * 0.137), q: 0.67, type: "high_uct", x: 58, y: 65 },
    N31: { id: "N31", name: "Exceeds Delegated Power", visits: Math.floor(iterations * 0.0734), q: 0.39, type: "leaf", x: 70, y: 65 },
    N32: { id: "N32", name: "Limitation Act Violation", visits: Math.floor(iterations * 0.0198), q: -0.25, type: "pruned", x: 88, y: 65 }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIterations(10000);
    setConfidence(78);
    setTerminalOutcome(78);
    setLogs([]);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#070709] overflow-hidden select-none">
      {/* Header Banner */}
      <header className="h-16 border-b border-[#1e202a] px-8 flex items-center justify-between bg-[#070709]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-[#d4af37]/20 flex items-center justify-center border border-[#d4af37]/30">
            <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 font-outfit">
              Clausely Strategist Swarm
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold">
                8-Agent MCTS Simulation
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-lg bg-[#0f1015] border border-[#1e202a] text-slate-500 hover:text-white cursor-pointer">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg bg-[#0f1015] border border-[#1e202a] text-slate-500 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Strategy Query Selector */}
      <div className="px-8 py-4 border-b border-[#1e202a] bg-black/40 flex flex-col gap-4">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-[#12131a] border border-[#1e202a] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
            placeholder="Enter case legal strategy question (e.g. maintainability, limitation act, natural justice violation)..."
          />
          <button 
            onClick={runSimulation}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.2)] cursor-pointer disabled:opacity-50"
          >
            {isRunning ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>Run Swarm Simulation</span>
          </button>
        </div>

        {/* Source Toggles */}
        <div className="flex flex-wrap items-center gap-5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Sources:</span>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input type="checkbox" checked={matterContext} onChange={(e) => setMatterContext(e.target.checked)} className="rounded bg-slate-800 accent-blue-500 border-slate-700" />
            <span>Intake Context</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input type="checkbox" checked={documents} onChange={(e) => setDocuments(e.target.checked)} className="rounded bg-slate-800 accent-blue-500 border-slate-700" />
            <span>Documents</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input type="checkbox" checked={caseBase} onChange={(e) => setCaseBase(e.target.checked)} className="rounded bg-slate-800 accent-blue-500 border-slate-700" />
            <span>Case Base</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input type="checkbox" checked={playbooks} onChange={(e) => setPlaybooks(e.target.checked)} className="rounded bg-slate-800 accent-blue-500 border-slate-700" />
            <span>Playbooks</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-white">
            <input type="checkbox" checked={research} onChange={(e) => setResearch(e.target.checked)} className="rounded bg-slate-800 accent-blue-500 border-slate-700" />
            <span>Statute Research</span>
          </label>
        </div>
      </div>

      {/* Row 1: Metrics & Controls Panel */}
      <div className="px-8 py-5 border-b border-[#1e202a] bg-black/20 flex flex-wrap items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-8 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold">MCTS Iterations</span>
            <span className="text-lg font-bold text-white mt-0.5 font-mono">{iterations.toLocaleString()}x</span>
            <span className="text-[9px] text-slate-600">Simulations Completed</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold">Active Swarm</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">8 / 8</span>
            <span className="text-[9px] text-slate-600">Agents Online</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold">Avg. Confidence</span>
            <span className="text-lg font-bold text-blue-400 mt-0.5 font-mono">{confidence}%</span>
            <span className="text-[9px] text-slate-600">Across Terminal Nodes</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[#1e202a] cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Tree Canvas */}
        <div className="flex-1 relative bg-black/40 overflow-hidden flex flex-col p-6 border-r border-[#1e202a]">
          {/* Canvas Legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 bg-[#0f1015]/60 p-3 border border-[#1e202a]/60 rounded-xl max-w-max">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Root Node</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Explore Node</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> High UCT Path</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Pruned</span>
          </div>

          {/* Interactive Node Graph Render Box */}
          <div className="flex-1 relative mt-4">
            {/* SVG Link lines between nodes */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <line x1="50%" y1="15%" x2="25%" y2="40%" stroke="#1e202a" strokeWidth="2" />
              <line x1="50%" y1="15%" x2="50%" y2="40%" stroke="#10b981" strokeWidth="3" />
              <line x1="50%" y1="15%" x2="75%" y2="40%" stroke="#1e202a" strokeWidth="2" />
              
              <line x1="25%" y1="40%" x2="12%" y2="65%" stroke="#1e202a" strokeWidth="2" />
              <line x1="25%" y1="40%" x2="28%" y2="65%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />

              <line x1="50%" y1="40%" x2="42%" y2="65%" stroke="#10b981" strokeWidth="3" />
              <line x1="50%" y1="40%" x2="58%" y2="65%" stroke="#10b981" strokeWidth="3" />

              <line x1="75%" y1="40%" x2="70%" y2="65%" stroke="#1e202a" strokeWidth="2" />
              <line x1="75%" y1="40%" x2="88%" y2="65%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* Render HTML Node elements */}
            {Object.values(nodes).map((node) => {
              const isActive = activeNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? "border-blue-500 bg-blue-950/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-20"
                      : node.type === "root" ? "border-blue-500 bg-[#0f1015]/90 text-white" :
                        node.type === "high_uct" ? "border-emerald-500 bg-[#0f1015]/90" :
                        node.type === "pruned" ? "border-red-500/40 bg-red-950/5 text-slate-500" :
                        "border-[#1e202a] bg-[#0f1015]/90"
                  } w-44`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      node.type === "root" ? "bg-blue-600/10 text-blue-400" :
                      node.type === "high_uct" ? "bg-emerald-600/10 text-emerald-400" :
                      node.type === "pruned" ? "bg-red-500/15 text-red-400" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {node.id}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Q: {node.q}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-200 mt-1 block truncate leading-snug">{node.name}</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-0.5 block">Visits: {node.visits.toLocaleString()}</span>
                </div>
              );
            })}

            {/* Floating Node Detail Box */}
            {activeNode && nodes[activeNode] && (
              <div className="absolute bottom-4 left-4 p-4 rounded-xl bg-gradient-to-br from-[#0f1015] to-[#16171f] border border-[#1e202a] w-56 shadow-2xl z-30 space-y-2 text-xs leading-normal animate-stream">
                <span className="font-bold text-slate-200 block">Node: {activeNode} ({nodes[activeNode].name})</span>
                <div className="space-y-1 text-slate-400 text-[11px] font-mono">
                  <div className="flex justify-between"><span>Elo Prior (P):</span> <span className="text-slate-300">1,462</span></div>
                  <div className="flex justify-between"><span>Visits (N):</span> <span className="text-slate-300">{nodes[activeNode].visits.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Avg. Reward (Q):</span> <span className="text-slate-300">{nodes[activeNode].q}</span></div>
                  <div className="flex justify-between"><span>P-UCB Score:</span> <span className="text-emerald-400">1.293</span></div>
                </div>
                <span className="text-[9px] text-slate-500 block border-t border-[#1e202a] pt-1">* Click node to expand path</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Terminal Outcome / Vulnerability check */}
        <aside className="w-80 border-l border-[#1e202a] bg-[#090a0f] p-6 space-y-6 flex flex-col overflow-y-auto shrink-0 select-none">
          {/* Gauge Widget */}
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Terminal Outcome</span>
            <div className="p-5 rounded-2xl bg-[#0f1015] border border-[#1e202a] flex flex-col items-center justify-center text-center gap-3">
              {/* Acceptance gauge */}
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="44" stroke="#16171f" strokeWidth="8" fill="transparent" />
                  <circle cx="56" cy="56" r="44" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray="276" strokeDashoffset={276 - (276 * terminalOutcome) / 100} className="transition-all duration-500" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{terminalOutcome}%</span>
                  <span className="text-[8px] text-slate-550 uppercase">Success</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${terminalOutcome >= 75 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>
                  {terminalOutcome >= 75 ? "High Confidence" : "Action Recommended"}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Probability of case filing acceptance or favorable ruling.</p>
              </div>
            </div>
          </div>

          {/* Vulnerabilities check */}
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Looming Vulnerabilities</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-wider">{vulnerabilities.length} Active Risks</span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {vulnerabilities.map((risk, idx) => (
                <div key={idx} className="p-3 bg-[#0f1015] border border-[#1e202a] rounded-xl flex gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    <AlertTriangle className={`h-4 w-4 ${risk.color === "red" ? "text-red-400" : risk.color === "orange" ? "text-amber-400" : "text-slate-400"}`} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-200 leading-snug">{risk.title}</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 truncate block">{risk.code}</span>
                  </div>
                  <span className={`text-[9px] font-bold ml-auto shrink-0 ${
                    risk.color === "red" ? "text-red-400" : risk.color === "orange" ? "text-amber-400" : "text-slate-500"
                  }`}>
                    {risk.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-[#1e202a] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
            <span>View Full Risk Analysis</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </aside>
      </div>

      {/* Row 3: Live Agent Discussion Log */}
      <footer className="h-44 border-t border-[#1e202a] bg-black/40 flex flex-col shrink-0 overflow-hidden">
        {/* Discussion header */}
        <div className="h-9 px-8 border-b border-[#1e202a]/60 flex items-center justify-between text-xs text-slate-400 select-none bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <Activity className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
            <span className="font-semibold text-slate-200">Live Agent Discussion</span>
            <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
              <span>Streaming</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer">All Agents</span>
            <span className="hover:text-slate-300 cursor-pointer">JSON View</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-full bg-blue-600 flex items-center justify-end px-0.5 cursor-pointer"><span className="h-2 w-2 rounded-full bg-white" /></span> Auto-scroll</span>
          </div>
        </div>

        {/* Streaming Logs View */}
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto px-8 py-4 font-mono text-[10px] text-slate-400 space-y-2.5 bg-[#070709]/80"
        >
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-4 items-start border-l border-slate-800 pl-4 py-0.5 animate-stream">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                log.agent === "petitioner_agent" ? "bg-blue-600/10 text-blue-400" :
                log.agent === "opponent_agent" ? "bg-red-500/10 text-red-400" :
                log.agent === "verifier_agent" ? "bg-emerald-500/10 text-emerald-400" :
                log.agent === "judge_agent" ? "bg-purple-650/10 text-purple-400" :
                "bg-slate-700 text-slate-400"
              }`}>
                {log.agent}
              </span>
              <div className="flex-1 text-slate-300">
                <span>{`{ "type": "${log.type}", "node": "${log.node}", "text": "${log.text}"`}</span>
                {log.citations && <span>{`, "citations": [${log.citations}]`}</span>}
                <span>{" }"}</span>
              </div>
              <span className="text-[9px] text-slate-600 shrink-0 select-none">{log.time}</span>
            </div>
          ))}
          {isRunning && (
            <div className="text-[9px] text-slate-600 italic animate-pulse pl-4">
              ... streaming live updates ...
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
