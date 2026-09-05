"use client";

import { useEffect, useState, useMemo } from "react";
import { Shield, Search, AlertCircle, Activity, User, Monitor, MapPin, ExternalLink, RefreshCw, ShieldAlert, CheckCircle, AlertTriangle, BarChart2 } from "lucide-react";
import axios from "axios";
import clsx from "clsx";
import { format } from "date-fns";
import TrustGraph from "../components/TrustGraph";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/api/v1/admin/alerts`;

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("alice");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | "block" | "challenge" | "allow">("all");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setAlerts(response.data);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute Summary Analytics Metrics
  const stats = useMemo(() => {
    const total = alerts.length;
    const blocks = alerts.filter(a => a.action_taken === "block").length;
    const challenges = alerts.filter(a => a.action_taken === "challenge").length;
    const allows = alerts.filter(a => a.action_taken === "allow").length;
    const allowRate = total > 0 ? ((allows / total) * 100).toFixed(1) : "100.0";
    return { total, blocks, challenges, allows, allowRate };
  }, [alerts]);

  // Filter alerts by search query and action type
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchesSearch = 
        a.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(a.id).includes(searchQuery);
      
      const matchesFilter = actionFilter === "all" || a.action_taken === actionFilter;
      return matchesSearch && matchesFilter;
    });
  }, [alerts, searchQuery, actionFilter]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col p-4 sm:p-6 lg:p-8">
      
      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Title & Refresh Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A3441] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-blue-400" /> Security Operations Center Console
            </h1>
            <p className="text-xs text-gray-400 mt-1">Real-Time Continuous Trust Monitoring & Explainable AI Telemetry</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#151A23] hover:bg-[#1F2633] border border-[#2A3441] text-xs font-semibold text-gray-300 hover:text-white rounded-xl transition-all"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin text-blue-400")} />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluated</span>
              <BarChart2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.total}</div>
            <div className="text-[11px] text-gray-400 mt-1">Continuous Risk Events</div>
          </div>

          <div className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Allow Rate</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">{stats.allowRate}%</div>
            <div className="text-[11px] text-gray-400 mt-1">{stats.allows} Low-Risk Logins</div>
          </div>

          <div className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Step-Up MFA</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">{stats.challenges}</div>
            <div className="text-[11px] text-gray-400 mt-1">Moderate Risk Challenges</div>
          </div>

          <div className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Enforced Blocks</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-400 font-mono">{stats.blocks}</div>
            <div className="text-[11px] text-gray-400 mt-1">High Severity Interceptions</div>
          </div>
        </div>

        {/* Trust Graph Section */}
        <section className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-5 shadow-xl">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Identity Graph ({selectedUser})
              </h2>
              <p className="text-xs text-gray-400">Interactive node network visualizing user entities, device hardware, and IP bindings</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-gray-400 font-medium">Select Entity:</span>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-[#0B0E14] border border-[#2A3441] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
              >
                <option value="alice">Alice (Standard User)</option>
                <option value="bob">Bob (Bypassed User)</option>
                <option value="admin">Admin (System Overseer)</option>
              </select>
            </div>
          </div>
          <TrustGraph username={selectedUser} />
        </section>

        {/* Real-Time Risk Intel Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Risk Intelligence Feed</h2>
              <p className="text-xs text-gray-400">Live telemetry stream with automated decisions and Explainable AI (xAI) drivers</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Action Filter Pills */}
              <div className="flex items-center bg-[#151A23] border border-[#2A3441] p-1 rounded-xl text-xs">
                {(["all", "block", "challenge", "allow"] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActionFilter(filter)}
                    className={clsx(
                      "px-3 py-1 rounded-lg font-semibold capitalize transition-all",
                      actionFilter === filter ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-gray-400 hover:text-white"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, IP, or event..." 
                  className="pl-9 pr-4 py-2 bg-[#151A23] border border-[#2A3441] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-52 sm:w-64 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400 border border-dashed border-[#2A3441] rounded-2xl bg-[#151A23]">
                No security alerts match your current query or filter.
              </div>
            )}

            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-5 hover:border-blue-500/40 transition-all shadow-xl group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: Event Summary */}
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      "p-2.5 rounded-2xl border shrink-0 mt-0.5",
                      alert.action_taken === "block" && "bg-red-500/10 border-red-500/30 text-red-400",
                      alert.action_taken === "challenge" && "bg-amber-500/10 border-amber-500/30 text-amber-400",
                      alert.action_taken === "allow" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    )}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-bold text-base capitalize">{alert.action_type} Event</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                          <Activity className="w-3.5 h-3.5 text-blue-400" /> {format(new Date(alert.timestamp), "MMM dd, HH:mm:ss")}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 font-medium">
                        <span className="flex items-center gap-1.5 bg-[#0B0E14] border border-[#2A3441] px-2.5 py-1 rounded-lg">
                          <User className="w-3.5 h-3.5 text-blue-400" /> User: <strong className="text-white">{alert.user}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#0B0E14] border border-[#2A3441] px-2.5 py-1 rounded-lg">
                          <Monitor className="w-3.5 h-3.5 text-purple-400" /> Device Binding Auth
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#0B0E14] border border-[#2A3441] px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Live Geolocation
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Action Badge */}
                  <div className="flex items-center gap-5 justify-between md:justify-end border-t md:border-t-0 border-[#2A3441] pt-3 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Risk Score</p>
                      <span className={clsx(
                        "text-3xl font-extrabold font-mono",
                        alert.risk_score < 30 ? "text-emerald-400" : (alert.risk_score < 70 ? "text-amber-400" : "text-red-400")
                      )}>
                        {alert.risk_score.toFixed(0)}
                      </span>
                    </div>
                    
                    <div className={clsx(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-md",
                      alert.action_taken === "block" && "bg-red-500/20 border-red-500/40 text-red-300 shadow-red-500/10",
                      alert.action_taken === "challenge" && "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/10",
                      alert.action_taken === "allow" && "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
                    )}>
                      {alert.action_taken}
                    </div>
                  </div>
                </div>

                {/* Explainable AI Break Down */}
                <div className="mt-4 pt-3.5 border-t border-[#2A3441]">
                  <p className="text-[11px] text-gray-400 mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>Explainable AI Drivers (xAI)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alert.explanations?.map((exp: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#0B0E14] border border-[#2A3441] rounded-xl px-3 py-1.5 text-xs">
                        <span className="text-gray-200 font-medium">{exp.signal}</span>
                        <span className={clsx(
                          "font-mono font-extrabold px-1.5 py-0.5 rounded text-[11px]",
                          exp.weight.startsWith("+") ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                        )}>{exp.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
