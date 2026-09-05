"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Activity, Lock, BarChart3, Sliders, ExternalLink } from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Login Portal", href: "/", icon: Lock },
    { name: "SOC Console", href: "/admin", icon: BarChart3 },
    { name: "Scenario Simulator", href: "/simulator", icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2A3441] bg-[#151A23]/80 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 group-hover:border-blue-400 transition-all shadow-lg shadow-blue-500/10">
          <Shield className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white bg-gradient-to-r from-white via-gray-200 to-blue-300 bg-clip-text text-transparent">
              TrustNet
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Continuous Digital Trust Engine</p>
        </div>
      </Link>

      {/* Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-[#0B0E14] border border-[#2A3441] p-1 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-gray-400 hover:text-white hover:bg-[#1F2633]"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-white" : "text-gray-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status & Right Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0E14] border border-[#2A3441] rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Engine Online</span>
        </div>

        <a
          href="https://github.com/HRAGROUPS/Team-Arjuna-"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-[#1F2633] border border-[#2A3441] hover:border-gray-500 rounded-lg transition-all"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      </div>
    </header>
  );
}
