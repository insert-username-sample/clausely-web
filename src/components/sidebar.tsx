"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const menuItems = [
    {
      id: "home",
      label: "Home",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      id: "matters",
      label: "Matters",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      id: "drafting-studio",
      label: "Drafting Studio",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      )
    },
    {
      id: "registry-simulator",
      label: "Registry Simulator",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="15" y2="17"></line>
        </svg>
      )
    },
    {
      id: "strategist",
      label: "Strategist",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      )
    },
    {
      id: "vault",
      label: "Vault",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    {
      id: "playbooks",
      label: "Playbooks",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      )
    },
    {
      id: "templates",
      label: "Templates",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      id: "research",
      label: "Research",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      id: "calendar",
      label: "Calendar",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    {
      id: "billing",
      label: "Billing",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      )
    }
  ];

  return (
    <aside className="sidebar-panel relative flex flex-col justify-between" style={{ padding: isCollapsed ? "16px 8px" : "24px" }}>
      {/* Brand Logo & Toggle Header */}
      <div>
        <div className="logo-section flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2 overflow-hidden">
            <img src="/clausely_pinwheel.png" className="logo-pinwheel shrink-0" style={{ width: "36px", height: "36px" }} alt="Clausely Logo" />
            {!isCollapsed && <div className="brand-name font-bold text-lg text-slate-800 dark:text-white">clausely<span className="text-blue-500">.ai</span></div>}
          </div>
          <button 
            onClick={onToggleCollapse} 
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="navigation-links space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === "drafting-studio" && activeTab === "drafting");
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive 
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold" 
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/30"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.svg}</span>
                {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Items */}
      <div className="space-y-4">
        {/* Upgrade Widget */}
        {!isCollapsed && (
          <div className="upgrade-widget p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-xs">
            <div className="upgrade-header flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Plan</span>
            </div>
            <p className="upgrade-text text-slate-500 mb-2 leading-relaxed">Unlock unlimited generations, advanced agents, and premium tools.</p>
            <button className="upgrade-cta-btn w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors cursor-pointer">Upgrade Now</button>
          </div>
        )}

        {/* User Info Profile footer */}
        <div className="profile-section flex items-center gap-3 border-t border-slate-100 dark:border-[#1e202a]/60 pt-4">
          <div className="avatar-placeholder h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">MK</div>
          {!isCollapsed && (
            <div className="profile-details flex flex-col min-w-0 flex-1">
              <span className="user-fullname text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Adv. Manas Khobrekar</span>
              <span className="user-email text-[10px] text-slate-500 truncate">manas@clausely.ai</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
