"use client";

import { useState } from "react";
import { Shield, Globe, Clock, AlertTriangle, CheckCircle, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import axios from "axios";
import clsx from "clsx";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${BASE_URL}/api/v1/auth/login`;

type Scenario = "baseline" | "anomaly" | "attack";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("baseline");
  const [result, setResult] = useState<any>(null);

  const handleLogin = async () => {
    setLoading(true);
    setResult(null);

    let payload = {
      username: "alice",
      password: "password123",
      device_fingerprint: "fp_alice_macbook_pro_2023",
      os: "macOS",
      browser: "Chrome",
      ip_address: "192.168.1.100",
      location: "New York, USA",
      timestamp: undefined as string | undefined
    };

    if (scenario === "anomaly") {
      // Alice logging in at 3 AM (unusual time for ML model)
      const date = new Date();
      date.setHours(3, 15, 0, 0);
      payload.timestamp = date.toISOString();
    } else if (scenario === "attack") {
      // Hacker trying to log in as Alice with unrecognized device & IP
      payload.device_fingerprint = "fp_hacker_kali_001";
      payload.os = "Linux";
      payload.browser = "Firefox";
      payload.ip_address = "45.22.12.99";
      payload.location = "St. Petersburg, Russia";
    }

    try {
      const response = await axios.post(API_URL, payload);
      setResult(response.data);
    } catch (error: any) {
      if (error.response) {
        setResult(error.response.data);
      } else {
        setResult({ action: "error", message: "Network Error: Could not connect to backend engine." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#0B0E14] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Left Side: Scenario Controls */}
        <div className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">TrustNet Scenario Simulator</h1>
                <p className="text-xs text-gray-400">Interactive Security Intelligence Sandbox</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Select Test Scenario</label>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setScenario("baseline")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all cursor-pointer",
                    scenario === "baseline" ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10" : "border-[#2A3441] bg-[#0B0E14] hover:border-gray-500"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className={clsx("w-4 h-4", scenario === "baseline" ? "text-emerald-400" : "text-gray-400")} />
                    <span className="font-bold text-white text-sm">Scenario 1: Baseline Authentication</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed ml-6">Alice logging in from her registered MacBook Pro & known IP address.</p>
                </button>

                <button
                  onClick={() => setScenario("anomaly")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all cursor-pointer",
                    scenario === "anomaly" ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10" : "border-[#2A3441] bg-[#0B0E14] hover:border-gray-500"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={clsx("w-4 h-4", scenario === "anomaly" ? "text-amber-400" : "text-gray-400")} />
                    <span className="font-bold text-white text-sm">Scenario 2: Temporal Anomaly (ML Model)</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed ml-6">Alice attempting login at 3:15 AM (Unusual temporal deviation for Isolation Forest).</p>
                </button>

                <button
                  onClick={() => setScenario("attack")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all cursor-pointer",
                    scenario === "attack" ? "border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/10" : "border-[#2A3441] bg-[#0B0E14] hover:border-gray-500"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className={clsx("w-4 h-4", scenario === "attack" ? "text-red-400" : "text-gray-400")} />
                    <span className="font-bold text-white text-sm">Scenario 3: Account Takeover (ATO Attack)</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed ml-6">External adversary using unrecognized Linux Kali device & Russian IP node.</p>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-6 cursor-pointer shadow-lg shadow-blue-600/25 text-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Risk Engine Telemetry...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Simulate Authentication Event
              </span>
            )}
          </button>
        </div>

        {/* Right Side: Results & Intelligence Output */}
        <div className="bg-[#151A23] border border-[#2A3441] rounded-2xl p-6 sm:p-8 shadow-2xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2A3441]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" /> Live Risk Telemetry Output
              </h2>
              <span className="text-xs font-mono text-gray-400">Status: {result ? "Evaluated" : "Idle"}</span>
            </div>

            {!result ? (
              <div className="h-64 flex items-center justify-center flex-col gap-3 text-gray-400 border-2 border-dashed border-[#2A3441] rounded-2xl bg-[#0B0E14]">
                <Clock className="w-8 h-8 text-gray-500 opacity-60" />
                <p className="text-xs font-medium">Awaiting event execution...</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                
                {/* Decision Card */}
                <div className="flex items-center justify-between p-5 rounded-xl border bg-[#0B0E14] border-[#2A3441]">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Automated Action</p>
                    <h3 className={clsx(
                      "text-2xl font-black uppercase tracking-wider font-mono",
                      result.action === "allow" && "text-emerald-400",
                      result.action === "challenge" && "text-amber-400",
                      result.action === "block" && "text-red-400"
                    )}>
                      {result.action}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Calculated Risk Score</p>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={clsx(
                        "text-3xl font-black font-mono",
                        result.risk_score < 30 && "text-emerald-400",
                        result.risk_score >= 30 && result.risk_score < 70 && "text-amber-400",
                        result.risk_score >= 70 && "text-red-400",
                      )}>
                        {result.risk_score ?? "--"}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Response Message */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 leading-relaxed font-medium">
                  {result.message || result.detail}
                </div>

              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#2A3441] text-[11px] text-gray-400">
            Events evaluated by TrustNet Isolation Forest & Real-Time Signal Evaluator.
          </div>
        </div>

      </div>
    </main>
  );
}
