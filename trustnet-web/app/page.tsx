"use client";

import { useState, useEffect } from "react";
import fpPromise from "@fingerprintjs/fingerprintjs";
import axios from "axios";
import { Shield, Lock, User, ArrowRight, Activity, AlertTriangle, CheckCircle, KeyRound, X } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export default function RealLogin() {
  const [username, setUsername] = useState("alice");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: string; text: string; score?: number } | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingDuration, setTypingDuration] = useState<number>(0);
  
  // Step-Up MFA Modal state
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");

  const router = useRouter();

  useEffect(() => {
    // Generate real-world device fingerprint on mount
    const initFingerprint = async () => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (e) {
        setFingerprint("fp_demo_browser_client");
      }
    };
    initFingerprint();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const os = navigator.platform;
    const browser = navigator.userAgent;

    try {
      const payload = {
        username,
        password,
        device_fingerprint: fingerprint,
        os,
        browser,
        typing_duration_ms: typingDuration,
      };

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, payload, {
        headers: { "Bypass-Tunnel-Reminder": "true" }
      });
      const data = res.data;

      if (data.action === "allow") {
        setStatusMsg({ type: "success", text: "Login Successful! Redirecting to SOC Console..." });
        setTimeout(() => {
          router.push("/admin");
        }, 1200);
      } else if (data.action === "challenge") {
        setStatusMsg({ 
          type: "warning", 
          text: `Moderate Risk Detected (Score: ${data.risk_score}). Step-Up MFA Challenge Triggered!`,
          score: data.risk_score
        });
        setShowMfaModal(true);
      } else {
        setStatusMsg({ 
          type: "error", 
          text: `Access Blocked (Score: ${data.risk_score}). High Risk / Anomaly Enforced.`,
          score: data.risk_score
        });
      }

    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Invalid credentials or backend network error." });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError("");

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await axios.post(`${BASE_URL}/api/v1/auth/verify-mfa`, {
        username,
        code: mfaCode,
        device_fingerprint: fingerprint
      });

      if (res.data.action === "allow") {
        setShowMfaModal(false);
        setStatusMsg({ type: "success", text: "MFA Verified! Device trusted. Redirecting..." });
        setTimeout(() => {
          router.push("/admin");
        }, 1200);
      }
    } catch (err: any) {
      setMfaError(err.response?.data?.detail || "Invalid verification code. Enter a 6-digit code.");
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#0B0E14] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#151A23] border border-[#2A3441] rounded-2xl p-6 sm:p-8 relative z-10 shadow-2xl backdrop-blur-xl">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Secure Authentication</h1>
          <p className="text-xs text-gray-400 text-center mt-1">
            Zero-Trust Continuous Identity Evaluation Engine
          </p>
        </div>

        {/* Quick fill demo preset badges */}
        <div className="mb-6 bg-[#0B0E14] border border-[#2A3441] rounded-xl p-3">
          <div className="text-[11px] text-gray-400 font-semibold mb-2 uppercase tracking-wider">Quick Demo Presets:</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setUsername("alice"); setPassword("password123"); }}
              className={clsx(
                "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all",
                username === "alice" ? "bg-blue-600 text-white border-blue-500" : "bg-[#1F2633] text-gray-300 border-[#2A3441] hover:border-gray-500"
              )}
            >
              Alice (User)
            </button>
            <button
              type="button"
              onClick={() => { setUsername("bob"); setPassword("password123"); }}
              className={clsx(
                "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all",
                username === "bob" ? "bg-emerald-600 text-white border-emerald-500" : "bg-[#1F2633] text-gray-300 border-[#2A3441] hover:border-gray-500"
              )}
            >
              Bob (Bypassed)
            </button>
            <button
              type="button"
              onClick={() => { setUsername("admin"); setPassword("admin123"); }}
              className={clsx(
                "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all",
                username === "admin" ? "bg-purple-600 text-white border-purple-500" : "bg-[#1F2633] text-gray-300 border-[#2A3441] hover:border-gray-500"
              )}
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 ml-1">Username / Identity ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#0B0E14] border border-[#2A3441] rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={() => {
                  if (!typingStartTime) setTypingStartTime(Date.now());
                }}
                onKeyUp={() => {
                  if (typingStartTime) {
                    setTypingDuration(Date.now() - typingStartTime);
                  }
                }}
                placeholder="Enter password"
                className="w-full bg-[#0B0E14] border border-[#2A3441] rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {statusMsg && (
            <div className={clsx(
              "p-3.5 rounded-xl text-xs font-medium border flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200",
              statusMsg.type === "success" && "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
              statusMsg.type === "warning" && "bg-amber-500/10 border-amber-500/30 text-amber-300",
              statusMsg.type === "error" && "bg-red-500/10 border-red-500/30 text-red-300"
            )}>
              <Activity className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{statusMsg.text}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !fingerprint}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 animate-spin" /> Evaluating Digital Trust...</span>
            ) : (
              <span className="flex items-center gap-2">Sign In Securely <ArrowRight className="w-4 h-4" /></span>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-[#2A3441] pt-4">
           <div className="bg-[#0B0E14] border border-[#2A3441] rounded-xl p-3 text-[11px] text-gray-400 font-mono">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white font-semibold">Live Telemetry Context</span>
              </div>
              <div className="text-gray-300">Device Hash: <span className="text-blue-400">{fingerprint ? fingerprint.substring(0, 16) + "..." : "Scanning Hardware..."}</span></div>
              <div className="text-gray-500 mt-1">Keystroke Dynamics: {typingDuration > 0 ? `${typingDuration}ms` : "Monitoring..."}</div>
           </div>
        </div>

      </div>

      {/* Step-Up MFA Challenge Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#151A23] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
            
            <button
              onClick={() => setShowMfaModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">MFA Verification</h3>
                <p className="text-xs text-amber-300">Step-Up Challenge Required</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              Anomalous login behavior was detected. Please enter your 6-digit TOTP authenticator code to verify ownership of <strong className="text-white">{username}</strong>.
            </p>

            <div className="p-2.5 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 font-mono">
              💡 <strong>Demo Code:</strong> Enter <span className="underline font-bold">123456</span> to complete verification.
            </div>

            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-[#0B0E14] border border-[#2A3441] rounded-xl py-3 text-center text-xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
                required
              />

              {mfaError && (
                <p className="text-xs text-red-400 text-center font-medium">{mfaError}</p>
              )}

              <button
                type="submit"
                disabled={mfaLoading || mfaCode.length < 6}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {mfaLoading ? "Verifying Token..." : "Confirm & Trust Device"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
