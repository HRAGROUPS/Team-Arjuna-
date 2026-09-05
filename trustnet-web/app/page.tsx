"use client";

import { useState, useEffect } from "react";
import fpPromise from "@fingerprintjs/fingerprintjs";
import axios from "axios";
import { Shield, Lock, User, ArrowRight, Activity } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export default function RealLogin() {
  const [username, setUsername] = useState("alice");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: string; text: string } | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingDuration, setTypingDuration] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Generate real-world device fingerprint on mount
    const initFingerprint = async () => {
      const fp = await fpPromise.load();
      const result = await fp.get();
      setFingerprint(result.visitorId);
    };
    initFingerprint();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Extract basic browser info
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
        // Notice: We are NOT sending IP or Location here anymore!
        // The backend will extract the real IP securely from the HTTP connection
        // and do a live Geolocation lookup.
      };

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await axios.post(`${BASE_URL}/api/v1/auth/login`, payload, {
        headers: { "Bypass-Tunnel-Reminder": "true" }
      });
      const data = res.data;

      if (data.action === "allow") {
        setStatusMsg({ type: "success", text: "Login Successful! Redirecting..." });
        setTimeout(() => {
            router.push("/admin");
        }, 1500);
      } else if (data.action === "challenge") {
        setStatusMsg({ type: "warning", text: `Challenge Triggered (Score: ${data.risk_score}). Additional verification required.` });
      } else {
        setStatusMsg({ type: "error", text: `Blocked (Score: ${data.risk_score}). Access Denied.` });
      }

    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Invalid credentials or network error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Secure Login</h1>
          <p className="text-sm text-gray-400 text-center">
            Zero-Trust identity verification powered by continuous risk evaluation.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                className="w-full bg-[#0B0E14] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {statusMsg && (
            <div className={clsx(
              "p-4 rounded-xl text-sm border flex items-start gap-2",
              statusMsg.type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              statusMsg.type === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-400",
              statusMsg.type === "error" && "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              <Activity className="w-5 h-5 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !fingerprint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Activity className="w-5 h-5 animate-spin" /> Verifying Identity...</span>
            ) : (
              <span className="flex items-center gap-2">Sign In <ArrowRight className="w-5 h-5" /></span>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--color-border)] pt-6">
           <div className="bg-[#0B0E14] border border-[var(--color-border)] rounded-lg p-3 text-xs text-gray-500 font-mono">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Live Security Context
              </div>
              <div>Device Hash: {fingerprint ? fingerprint.substring(0, 16) + "..." : "Scanning Hardware..."}</div>
              <div className="text-gray-600 mt-1">IP & Geolocation will be securely extracted server-side via Zero-Trust architecture.</div>
           </div>
        </div>
      </div>
    </div>
  );
}
