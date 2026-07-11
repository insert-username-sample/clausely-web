"use client";

import React, { useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  AlertCircle, 
  TrendingUp, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function DashboardMatters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const kpis = [
    { label: "Active Matters", value: "24", subtext: "+12% this month", trend: "up" },
    { label: "Due This Week", value: "7", subtext: "+3 from last week", trend: "up" },
    { label: "At Risk", value: "5", subtext: "Requires attention", trend: "alert" },
    { label: "Won Matters", value: "18", subtext: "+20% this month", trend: "up" },
  ];

  const initialMatters = [
    { id: 1, name: "ABC Corp vs State of Maharashtra", sub: "Civil Writ Petition", type: "Litigation", jurisdiction: "Bombay HC", status: "In Progress", updated: "2h ago", owner: "MK" },
    { id: 2, name: "Sharma Family Partition Dispute", sub: "Civil Suit", type: "Litigation", jurisdiction: "Delhi District Court", status: "Review", updated: "5h ago", owner: "AM" },
    { id: 3, name: "TechNova vs InnovateX", sub: "Commercial Suit", type: "Commercial", jurisdiction: "Karnataka HC", status: "In Progress", updated: "1d ago", owner: "VS" },
    { id: 4, name: "R.K. Builders vs MCD", sub: "Arbitration", type: "Arbitration", jurisdiction: "ICC", status: "In Progress", updated: "2d ago", owner: "AM" },
    { id: 5, name: "Neha Verma Employment Matter", sub: "Labour Dispute", type: "Labour", jurisdiction: "Labour Court", status: "Review", updated: "3d ago", owner: "MK" },
    { id: 6, name: "State Bank vs Ramesh Traders", sub: "Recovery Suit", type: "Litigation", jurisdiction: "Rajasthan HC", status: "Drafting", updated: "4d ago", owner: "VS" },
    { id: 7, name: "GlobalTech India Compliance", sub: "Regulatory Advisory", type: "Advisory", jurisdiction: "SEBI", status: "In Progress", updated: "5d ago", owner: "AM" },
    { id: 8, name: "Verma & Co. Tax Assessment", sub: "Tax Litigation", type: "Tax", jurisdiction: "ITAT Delhi", status: "In Progress", updated: "1w ago", owner: "MK" }
  ];

  const filteredMatters = initialMatters.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-[#070709] select-none transition-colors duration-300 text-slate-800 dark:text-slate-100">
      {/* Left Main Table Column */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight font-outfit">Matters</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Organize, track, and win more cases with AI-powered insights.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text"
              placeholder="Search matters by name, type, or jurisdiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors shadow-sm"
            />
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-sm cursor-pointer">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-sm cursor-pointer">
              <span>Sort by: Recently Updated</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#1e202a]">
          {["all", "my", "shared", "archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3.5 text-xs font-semibold border-b-2 capitalize transition-all cursor-pointer ${
                activeTab === tab 
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 font-bold" 
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab === "all" ? "All Matters" : tab === "my" ? "My Matters" : tab}
            </button>
          ))}
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a] flex flex-col justify-between hover:border-slate-300 dark:hover:border-[#1e202a]/80 shadow-sm transition-all">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className="flex items-baseline gap-2 mt-2.5">
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{kpi.value}</span>
                {kpi.trend === "alert" ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                    {kpi.subtext}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                    {kpi.subtext}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Matters Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#1e202a] bg-white dark:bg-[#0f1015] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1e202a] text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                <th className="px-6 py-4">Matter Name</th>
                <th className="px-6 py-4">Matter Type</th>
                <th className="px-6 py-4">Jurisdiction</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e202a]/60 text-xs text-slate-700 dark:text-slate-300">
              {filteredMatters.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-850 dark:text-slate-200">{item.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.sub}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold border ${
                      item.type === "Litigation" ? "bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400" :
                      item.type === "Arbitration" ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                      item.type === "Commercial" ? "bg-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400" :
                      item.type === "Labour" ? "bg-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400" :
                      "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">{item.jurisdiction}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold border ${
                      item.status === "In Progress" ? "bg-blue-600/10 border-blue-600/20 text-blue-600 dark:text-blue-400" :
                      item.status === "Review" ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                      "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        item.status === "In Progress" ? "bg-blue-500" :
                        item.status === "Review" ? "bg-amber-500" :
                        "bg-purple-500"
                      }`} />
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium">{item.updated}</td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      {item.owner}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMatters.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matters matching search query.
            </div>
          )}
        </div>

        {/* Table Footer Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Showing 1 to {filteredMatters.length} of 24 matters</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-md border border-slate-200 dark:border-[#1e202a] hover:bg-slate-100 dark:hover:bg-slate-805 disabled:opacity-50 cursor-pointer" disabled>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-slate-300">1</span>
            <span className="px-1 cursor-pointer">2</span>
            <span className="px-1 cursor-pointer">3</span>
            <button className="p-1 rounded-md border border-slate-200 dark:border-[#1e202a] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Matter Insights Column */}
      <div className="w-80 border-l border-slate-200 dark:border-[#1e202a] bg-slate-100/30 dark:bg-[#090a0f] p-6 space-y-8 overflow-y-auto shrink-0 transition-colors duration-300">
        {/* Insights Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-outfit">Matter insights</h3>
          <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">View all</button>
        </div>

        {/* Circular Gauge Status Representation */}
        <div className="flex items-center justify-center py-4 relative">
          <svg className="w-36 h-36 transform -rotate-90">
            {/* Base Circle */}
            <circle cx="72" cy="72" r="54" stroke="var(--border)" strokeWidth="12" fill="transparent" />
            {/* Segment 1: In Progress 50% (Length: 339 * 0.50 = 169.5) */}
            <circle cx="72" cy="72" r="54" stroke="#3b82f6" strokeWidth="12" fill="transparent" strokeDasharray="339" strokeDashoffset="169.5" />
            {/* Segment 2: Review 21% (Length: 339 * 0.21 = 71.19) */}
            <circle cx="72" cy="72" r="54" stroke="#f59e0b" strokeWidth="12" fill="transparent" strokeDasharray="339" strokeDashoffset="240.69" />
            {/* Segment 3: Drafting 13% (Length: 339 * 0.13 = 44.07) */}
            <circle cx="72" cy="72" r="54" stroke="#a855f7" strokeWidth="12" fill="transparent" strokeDasharray="339" strokeDashoffset="284.76" />
            {/* Segment 4: At Risk 16% (Length: 339 * 0.16 = 54.24) */}
            <circle cx="72" cy="72" r="54" stroke="#ef4444" strokeWidth="12" fill="transparent" strokeDasharray="339" strokeDashoffset="339" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">24</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Total</span>
          </div>
        </div>

        {/* Donut Legend */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>In Progress: 12 (50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Review: 5 (21%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            <span>Drafting: 3 (13%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>At Risk: 4 (16%)</span>
          </div>
        </div>

        {/* Top Practice Areas Progress Rows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-outfit">Top practice areas</h3>
            <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">View all</button>
          </div>
          
          <div className="space-y-3">
            {[
              { name: "Litigation", count: 14, percent: 70 },
              { name: "Commercial", count: 4, percent: 40 },
              { name: "Arbitration", count: 3, percent: 30 },
              { name: "Labour", count: 2, percent: 20 },
              { name: "Tax", count: 1, percent: 10 }
            ].map((area, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{area.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">{area.count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${area.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Mini List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-outfit">Recent activity</h3>
            <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer">View all</button>
          </div>
          
          <div className="space-y-3 text-xs leading-normal">
            {[
              { title: "ABC Corp vs State of Maharashtra", action: "Document 'Written_Arguments.pdf' uploaded", time: "2h ago" },
              { title: "Sharma Family Partition Dispute", action: "Hearing date updated to 24 May 2025", time: "5h ago" },
              { title: "TechNova vs InnovateX", action: "New strategic analysis generated", time: "1d ago" },
              { title: "R.K. Builders vs MCD", action: "Playbook 'Arbitration Strategy' added", time: "2d ago" },
              { title: "Neha Verma Employment Matter", action: "Research note created", time: "3d ago" }
            ].map((activity, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-[#0f1015] border border-slate-200 dark:border-[#1e202a]/60 rounded-xl space-y-1 shadow-sm">
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate">{activity.title}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{activity.action}</p>
                <span className="text-[9px] text-slate-450 dark:text-slate-500 font-mono block">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
