"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import DashboardHome from "@/components/dashboard-home";
import DashboardMatters from "@/components/dashboard-matters";
import DraftingStudio from "@/components/drafting-studio";
import RegistrySimulator from "@/components/registry-simulator";
import StrategistSwarm from "@/components/strategist-swarm";
import { Terminal } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isDark, setIsDark] = useState(true); // Default to dark theme matching layout.tsx
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync theme class to html element
  useEffect(() => {
    const htmlClassList = document.documentElement.classList;
    if (isDark) {
      htmlClassList.add("dark");
      htmlClassList.add("dark-theme");
    } else {
      htmlClassList.remove("dark");
      htmlClassList.remove("dark-theme");
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <DashboardHome onNavigate={setActiveTab} />;
      case "matters":
        return <DashboardMatters />;
      case "drafting":
      case "drafting-studio":
        return <DraftingStudio />;
      case "registry":
      case "registry-simulator":
        return <RegistrySimulator />;
      case "strategist":
        return <StrategistSwarm />;
      default:
        // Premium Coming Soon fallback view
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 select-none bg-slate-50 dark:bg-[#070709] transition-colors duration-300">
            <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#0f1015] dark:to-[#16171f] border border-slate-200 dark:border-[#1e202a] text-center space-y-6 relative overflow-hidden shadow-xl dark:shadow-2xl">
              <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
              
              <div className="mx-auto h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
                <Terminal className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Module Offline
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-outfit capitalize">
                  {activeTab} Workspace
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This workspace module is currently under development. Deep reasoning pipelines and statutory validation frameworks are being compiled.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("home")}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  const handleNewMatter = () => {
    setActiveTab("matters");
  };

  return (
    <div 
      className="shell-container"
      style={{ 
        gridTemplateColumns: isCollapsed ? "80px 1fr" : "280px 1fr",
        transition: "grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isCollapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      
      {/* Main viewport */}
      <main className="main-viewport">
        {/* Search Header */}
        <header className="main-header">
          <div className="search-bar">
            <svg className="search-bar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search matters, documents, clauses, playbooks..." id="globalSearchInput" />
            <span className="search-key-shortcut">Ctrl K</span>
          </div>

          <div className="header-action-controls">
            <button className="ctrl-btn" id="themeToggleBtn" title="Toggle Theme" onClick={handleToggleTheme}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </button>
            <button className="ctrl-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button className="ctrl-btn" title="Help Desk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>
            <button className="btn-new-matter" id="newMatterBtn" onClick={handleNewMatter}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>New Matter</span>
            </button>
          </div>
        </header>

        {/* Dynamic scrollable main viewport content */}
        {renderContent()}
      </main>
    </div>
  );
}
