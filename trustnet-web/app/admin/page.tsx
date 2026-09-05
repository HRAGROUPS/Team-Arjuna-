"use client";

import { useEffect, useState } from "react";
import { Shield, Search, AlertCircle, Activity, User, Monitor, MapPin, ExternalLink, RefreshCw } from "lucide-react";
import axios from "axios";
import clsx from "clsx";
import { format } from "date-fns";
import TrustGraph from "../components/TrustGraph";

const API_URL = "http://localhost:8000/api/v1/admin/alerts";

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    // Poll every 5 seconds for the demo
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">TrustNet Console</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Security Operations Center</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchAlerts}
            className="p-2 text-gray-400 hover:text-white hover:bg-[var(--color-surface-hover)] rounded-md transition-colors"
          >
            <RefreshCw className={clsx("w-5 h-5", loading && "animate-spin")} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-full">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Trust Graph Section */}
        <section>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Identity Graph (Alice)
            </h2>
            <TrustGraph />
        </section>

        {/* Real-Time Alerts Section */}
        <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Real-Time Risk Intel</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search user, IP, or event ID..." 
                  className="pl-9 pr-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 w-64 transition-all"
                />
              </div>
            </div>

        <div className="grid grid-cols-1 gap-4">
          {alerts.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 border border-dashed border-[var(--color-border)] rounded-xl">
              No alerts found.
            </div>
          )}

          {alerts.map((alert) => (
            <div key={alert.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-blue-500/30 transition-all group">
              <div className="flex items-start justify-between">
                
                {/* Left: Summary */}
                <div className="flex gap-4">
                  <div className={clsx(
                    "mt-1 p-2 rounded-full",
                    alert.action_taken === "block" && "bg-red-500/20 text-red-400",
                    alert.action_taken === "challenge" && "bg-amber-500/20 text-amber-400",
                    alert.action_taken === "allow" && "bg-emerald-500/20 text-emerald-400"
                  )}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium capitalize">{alert.action_type} Event</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {format(new Date(alert.timestamp), "MMM dd, HH:mm:ss")}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {alert.user}</span>
                      <span className="flex items-center gap-1.5"><Monitor className="w-4 h-4" /> Device ID Auth</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Geolocation</span>
                    </div>
                  </div>
                </div>

                {/* Right: Score & Action */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Risk Score</p>
                    <span className={clsx(
                      "text-2xl font-bold font-mono",
                      alert.risk_score < 30 ? "text-emerald-400" : (alert.risk_score < 70 ? "text-amber-400" : "text-red-500")
                    )}>
                      {alert.risk_score.toFixed(0)}
                    </span>
                  </div>
                  
                  <div className={clsx(
                    "px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider border",
                    alert.action_taken === "block" && "bg-red-500/10 border-red-500/20 text-red-500",
                    alert.action_taken === "challenge" && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                    alert.action_taken === "allow" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  )}>
                    {alert.action_taken}
                  </div>
                  
                  <button className="p-2 text-gray-500 hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Explainable AI Break Down */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Explainable AI Drivers</p>
                <div className="flex flex-wrap gap-2">
                  {alert.explanations?.map((exp: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#0B0E14] border border-[var(--color-border)] rounded-md px-3 py-1 text-sm">
                      <span className="text-gray-300">{exp.signal}</span>
                      <span className={clsx(
                        "font-mono font-semibold",
                        exp.weight.startsWith("+") ? "text-red-400" : "text-emerald-400"
                      )}>{exp.weight}</span>
                    </div>
                  ))}
                  {(!alert.explanations || alert.explanations.length === 0) && (
                    <span className="text-sm text-gray-500 italic">No significant drivers identified.</span>
                  )}
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
