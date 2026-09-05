"use client";

import { useState } from "react";
import { Shield, Smartphone, Globe, Clock, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import axios from "axios";
import clsx from "clsx";

const API_URL = "http://localhost:8000/api/v1/auth/login";

type Scenario = "baseline" | "anomaly" | "attack";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("baseline");
  const [result, setResult] = useState<any>(null);

  const handleLogin = async () => {
    setLoading(true);
    setResult(null);

    // Prepare payload based on scenario
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
      // Alice logging in at 3 AM (highly unusual time for her)
      const date = new Date();
      date.setHours(3, 15, 0, 0); // 3:15 AM
      
      payload.timestamp = date.toISOString();
    } else if (scenario === "attack") {
      // Hacker trying to log in as Alice with a totally unrecognized device and IP
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
        setResult({ action: "error", message: "Network Error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-[var(--color-background)]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Login Simulator */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">TrustNet Simulator</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-muted)]">Select Demo Scenario</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setScenario("baseline")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all",
                    scenario === "baseline" ? "border-emerald-500/50 bg-emerald-500/10" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className={clsx("w-4 h-4", scenario === "baseline" ? "text-emerald-400" : "text-gray-400")} />
                    <span className="font-semibold text-white">Scenario 1: Baseline</span>
                  </div>
                  <p className="text-xs text-gray-400">Alice logging in from known Mac & IP.</p>
                </button>
                
                <button
                  onClick={() => setScenario("anomaly")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all",
                    scenario === "anomaly" ? "border-amber-500/50 bg-amber-500/10" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={clsx("w-4 h-4", scenario === "anomaly" ? "text-amber-400" : "text-gray-400")} />
                    <span className="font-semibold text-white">Scenario 2: Anomaly (ML Demo)</span>
                  </div>
                  <p className="text-xs text-gray-400">Alice logging in at 3 AM (Unusual Time).</p>
                </button>

                <button
                  onClick={() => setScenario("attack")}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all",
                    scenario === "attack" ? "border-red-500/50 bg-red-500/10" : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className={clsx("w-4 h-4", scenario === "attack" ? "text-red-400" : "text-gray-400")} />
                    <span className="font-semibold text-white">Scenario 3: Attack (ATO)</span>
                  </div>
                  <p className="text-xs text-gray-400">Hacker using unknown device from Russia.</p>
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Simulate Login Event"
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Results & Intelligence */}
        <div className="bg-[#0F131C] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
              <Globe className="w-5 h-5" /> Live Engine Output
            </h2>
          </div>

          {!result ? (
            <div className="h-64 flex items-center justify-center flex-col gap-3 text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
              <Clock className="w-8 h-8 opacity-50" />
              <p>Awaiting event ingestion...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex items-center justify-between p-6 rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)]">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Decision</p>
                  <h3 className={clsx(
                    "text-2xl font-bold uppercase tracking-wider",
                    result.action === "allow" && "text-emerald-400",
                    result.action === "challenge" && "text-amber-400",
                    result.action === "block" && "text-red-500"
                  )}>
                    {result.action}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className={clsx(
                      "text-4xl font-bold",
                      result.risk_score < 30 && "text-emerald-400",
                      result.risk_score >= 30 && result.risk_score < 70 && "text-amber-400",
                      result.risk_score >= 70 && "text-red-500",
                    )}>
                      {result.risk_score ?? "--"}
                    </span>
                    <span className="text-gray-500">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">{result.message || result.detail}</p>
              </div>

            </div>
          )}
        </div>

      </div>
    </main>
  );
}
