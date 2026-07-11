"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  ArrowLeft, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Wrench,
  Copy,
  ChevronDown,
  FileCheck
} from "lucide-react";

export default function RegistrySimulator() {
  const [progress, setProgress] = useState(100);
  const [fixed, setFixed] = useState(false);
  const [score, setScore] = useState(85);
  
  const [jurisdiction, setJurisdiction] = useState("MH-HC");
  const [documentType, setDocumentType] = useState("Writ Petition");
  
  const [documentText, setDocumentText] = useState(`IN THE HIGH COURT OF JUDICATURE AT BOMBAY
CIVIL APPELLATE JURISDICTION
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
2. The respondents passed an arbitrary order without hearing the petitioner.

PRAYER:
Wherefore, the Petitioner prays that this Court issue a Writ of Mandamus.

VERIFICATION:
I, Director of Petitioner, do hereby verify that paragraphs 1 to 2 are true.

Signed: Deponent
Advocate for Petitioner: Adv. Manas Khobrekar
Enrollment: MAH/1234/2026`);

  const [fatalDefects, setFatalDefects] = useState<string[]>([
    "Missing Court Fee stamp verification reference",
    "Left Margin is 2.5cm (minimum 3.0cm required for Maharashtra High Court)",
    "Missing certification index summary page"
  ]);
  const [curableDefects, setCurableDefects] = useState<string[]>([
    "Double spacing recommended (currently 1.5x)",
    "Filing advocate contact details incomplete"
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = async () => {
    setIsLoading(true);
    setProgress(0);
    
    // Simulate SFE progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(Math.min(currentProgress, 100));
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 80);

    try {
      const response = await fetch("http://localhost:8080/api/v1/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_text: documentText,
          jurisdiction: jurisdiction,
          document_type: documentType.toLowerCase().replace(/\s+/g, "_")
        })
      });

      if (!response.ok) {
        throw new Error("Backend response error");
      }

      const data = await response.json();
      setScore(data.acceptance_score !== undefined ? Math.round(data.acceptance_score * 10) / 10 : 85);
      
      // Map API checks to UI defects list
      const fatal: string[] = [];
      const curable: string[] = [];

      // Check SFE parser checks
      if (data.checks) {
        if (!data.checks.cause_title_present) fatal.push("Missing cause title - document will be rejected at registry counter");
        if (!data.checks.parties_identified) fatal.push("Parties not properly identified (petitioner/respondent missing)");
        if (!data.checks.verification_clause_present) fatal.push("Missing verification clause - mandatory under Order VI Rule 15 CPC");
        if (!data.checks.prayer_clause_present) fatal.push("Missing prayer/relief clause - court cannot grant relief without a prayer");
        if (!data.checks.signature_block_present) fatal.push("Missing signature block - unsigned document will be rejected");
        
        if (!data.checks.advocate_details_present) curable.push("Advocate details not found - required if filing through counsel");
        if (!data.checks.jurisdiction_clause_present) curable.push("Jurisdiction clause not explicitly stated");
        if (!data.checks.date_present) curable.push("Date of execution not found in document");
        if (data.checks.stamp_paper_referenced === false) curable.push("Stamp paper reference not found - stamp paper required");
      }

      if (fatal.length === 0 && curable.length === 0) {
        // Fallback placeholder checks if the text parsed successfully but checked empty
        if (!documentText.includes("3.0cm") && !fixed) {
          fatal.push("Left Margin is 2.5cm (minimum 3.0cm required for Maharashtra High Court)");
        }
        if (fixed) {
          setScore(98);
        }
      }

      setFatalDefects(fatal);
      setCurableDefects(curable);

    } catch (error) {
      console.error("Connection to backend failed, running offline validation:", error);
      // Offline fallback rules
      const fatal: string[] = [];
      const curable: string[] = [];
      
      if (!documentText.toLowerCase().includes("in the court of") && !documentText.toLowerCase().includes("in the high court")) {
        fatal.push("Missing cause title - document will be rejected at registry counter");
      }
      if (!documentText.toLowerCase().includes("petitioner") && !documentText.toLowerCase().includes("applicant")) {
        fatal.push("Parties not properly identified (petitioner/respondent missing)");
      }
      if (!documentText.toLowerCase().includes("verify") && !documentText.toLowerCase().includes("verification") && !documentText.toLowerCase().includes("solemnly affirm")) {
        fatal.push("Missing verification clause - mandatory under Order VI Rule 15 CPC");
      }
      if (!documentText.toLowerCase().includes("prayer") && !documentText.toLowerCase().includes("prayed that") && !documentText.toLowerCase().includes("relief")) {
        fatal.push("Missing prayer/relief clause - court cannot grant relief without a prayer");
      }
      if (!documentText.toLowerCase().includes("deponent") && !documentText.toLowerCase().includes("signature") && !documentText.toLowerCase().includes("signed")) {
        fatal.push("Missing signature block - unsigned document will be rejected");
      }
      if (!documentText.toLowerCase().includes("advocate") && !documentText.toLowerCase().includes("counsel")) {
        curable.push("Advocate details not found - required if filing through counsel");
      }

      if (!fixed) {
        fatal.push("Left Margin is 2.5cm (minimum 3.0cm required for Maharashtra High Court)");
      }

      setFatalDefects(fatal);
      setCurableDefects(curable);
      setScore(Math.max(0, 100 - (fatal.length * 15) - (curable.length * 5)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleValidate();
  }, [jurisdiction, documentType, fixed]);

  const handleAutoFix = () => {
    setFixed(true);
    setDocumentText(prev => prev.replace("marginLeft\": \"2.5cm", "marginLeft\": \"3.0cm")
                             .replace("2.5cm margin", "3.0cm margin"));
  };

  const handleCopyAST = () => {
    navigator.clipboard.writeText(JSON.stringify({
      type: "petition",
      jurisdiction: jurisdiction,
      documentType: documentType,
      text: documentText,
      style: {
        font: "Times New Roman",
        size: 14,
        alignment: "justify",
        marginLeft: fixed ? "3.0cm" : "2.5cm",
        lineSpacing: jurisdiction === "MH-HC" ? 2.0 : 1.5
      }
    }, null, 2));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#070709] p-8 space-y-8 select-none transition-colors duration-300 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight font-outfit">Registry Simulator</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">Pre-flight statutory and formatting verification engine.</p>
        </div>
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white cursor-pointer" />
          <button className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-[#1e202a] text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Editor</span>
          </button>
        </div>
      </header>

      {/* Selectors and Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#0f1015] p-5 rounded-2xl border border-slate-200 dark:border-[#1e202a] shadow-sm">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Court Jurisdiction</label>
          <select 
            value={jurisdiction} 
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="MH-HC">🏛️ Bombay High Court (MH-HC)</option>
            <option value="MH-DISTRICT">🏛️ Maharashtra District Court (MH-DISTRICT)</option>
            <option value="DL-DISTRICT">🏛️ Delhi District Court (DL-DISTRICT)</option>
            <option value="IN-SC">🏛️ Supreme Court of India (IN-SC)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Document Category</label>
          <select 
            value={documentType} 
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2d303f] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="Writ Petition">Writ Petition</option>
            <option value="Affidavit">Affidavit</option>
            <option value="Written Statement">Written Statement</option>
            <option value="Application">Application</option>
          </select>
        </div>

        <div className="flex items-end">
          <button 
            onClick={handleValidate} 
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Re-verify Document</span>
          </button>
        </div>
      </div>

      {/* Row 1: Upload, Processing & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Editor Textarea */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Document Text Editor (Pre-flight draft)</span>
            <span className="text-[9px] text-blue-500 font-mono">Live SFE Parsing</span>
          </div>
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            className="w-full min-h-[220px] p-4 bg-slate-50 dark:bg-[#070709] border border-slate-200 dark:border-[#1e202a] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed"
            placeholder="Type or paste legal document here to run pre-flight rule-checks..."
          />
        </div>

        {/* Live Processing and Acceptance Gauge */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Acceptance Score</span>
          
          <div className="relative flex items-center justify-center my-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="48" stroke="var(--border)" strokeWidth="10" fill="transparent" className="stroke-slate-200 dark:stroke-slate-800" />
              <circle cx="64" cy="64" r="48" stroke={score >= 80 ? "#10b981" : "#f59e0b"} strokeWidth="10" fill="transparent" strokeDasharray="301" strokeDashoffset={301 - (301 * score) / 100} className="transition-all duration-500" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{score}</span>
              <span className="text-[9px] text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="space-y-1 text-center">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${score >= 80 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
              {score >= 80 ? "High Acceptance Likely" : "Action Recommended"}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Acceptance probability in the registry.</p>
          </div>
        </div>
      </div>

      {/* Row 2: Defects Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fatal Defects */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fatal Defects ({fatalDefects.length})</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 uppercase tracking-wider">Blocks Filing</span>
            </div>
            
            <div className="space-y-3 text-xs leading-normal max-h-[220px] overflow-y-auto">
              {fatalDefects.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No fatal defects found!</span>
                </div>
              ) : (
                fatalDefects.map((defect, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-red-500/10 dark:border-red-500/15 bg-red-50/50 dark:bg-red-950/5 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{defect}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">SFE Scrutiny Flag</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button className="text-[10px] text-red-650 dark:text-red-400 font-bold hover:underline mt-4 text-left flex items-center gap-1 cursor-pointer">
            <span>View all fatal defects</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Curable Defects */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Curable Defects ({curableDefects.length})</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase tracking-wider">Can Proceed</span>
            </div>
            
            <div className="space-y-3 text-xs leading-normal max-h-[220px] overflow-y-auto">
              {curableDefects.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No curable defects found!</span>
                </div>
              ) : (
                curableDefects.map((defect, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-[#1e202a]/60 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{defect}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">SFE Curable Advisory</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline mt-4 text-left flex items-center gap-1 cursor-pointer">
            <span>View all curable defects</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Quick Fix & Editor Integration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quick Fix & Editor Integration</span>
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1.5 animate-stream">
              <span className="text-xs font-semibold text-red-650 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Left Margin is 2.5cm</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">Page 3 • Paragraph 2</span>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Suggested Fix</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-black/40 p-3 rounded-lg border border-slate-200 dark:border-[#1e202a]">
                Increase left margin to 3.0cm as per Bombay High Court SFE Guidelines Rule 3.1(a).
              </p>
            </div>
          </div>

          <button
            onClick={handleAutoFix}
            disabled={fixed}
            className={`w-full mt-6 py-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              fixed 
                ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25" 
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>{fixed ? "Formatting Fixed!" : "Auto-Fix Formatting"}</span>
          </button>
        </div>
      </div>

      {/* Row 3: Visualizer and AST Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Preview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Visual Court Margin Guidelines</span>
            
            <div className="border border-slate-200 dark:border-[#1e202a] bg-white rounded-xl p-5 text-black min-h-[160px] flex flex-col justify-between relative overflow-hidden font-serif">
              <div className={`absolute top-0 bottom-0 left-0 bg-red-500/10 border-r-2 border-dashed ${fixed ? "border-emerald-500 bg-emerald-500/10 w-[30%]" : "border-red-500 w-[20%]"} transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${fixed ? "text-emerald-600" : "text-red-650"}`}>
                <span>{fixed ? "3.0cm" : "2.5cm"}</span>
              </div>

              <div className="text-center text-[9px] font-bold uppercase tracking-tight">
                IN THE HIGH COURT OF JUDICATURE AT BOMBAY
                <div className="text-[7px] font-semibold tracking-wider mt-0.5">CIVIL APPELLATE JURISDICTION</div>
              </div>

              <div className="grid grid-cols-2 text-[8px] my-2 pl-[32%]">
                <div>Between: <br /><b>ABC Private Limited</b></div>
                <div className="text-right">...Petitioner</div>
              </div>

              <p className="text-[7px] leading-relaxed pl-[32%] text-slate-800">
                1. That the present Writ Petition is filed under <span className="bg-blue-100 px-0.5 text-blue-800 font-semibold rounded">Article 226</span> of the Constitution of India for issuance of an appropriate writ, order or direction.
              </p>
            </div>
          </div>
        </div>

        {/* AST Preview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AST Source (JSON)</span>
              <button 
                onClick={handleCopyAST}
                className="text-[9px] font-semibold text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="h-3 w-3" />
                <span>Copy AST</span>
              </button>
            </div>
            
            <div className="border border-slate-200 dark:border-[#1e202a] bg-slate-50 dark:bg-[#070709] rounded-xl p-4 font-mono text-[10px] text-slate-650 dark:text-slate-400 overflow-x-auto min-h-[160px] max-h-[180px] overflow-y-auto leading-normal">
              <pre>{JSON.stringify({
                type: "petition",
                jurisdiction: jurisdiction,
                documentType: documentType,
                style: {
                  font: "Times New Roman",
                  size: 14,
                  alignment: "justify",
                  marginLeft: fixed ? "3.0cm" : "2.5cm",
                  lineSpacing: jurisdiction === "MH-HC" ? 2.0 : 1.5
                }
              }, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
