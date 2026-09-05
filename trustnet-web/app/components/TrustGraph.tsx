"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import dynamic from "next/dynamic";

// Force graph needs to be loaded dynamically without SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const API_URL = "http://localhost:8000/api/v1/graph/alice";

export default function TrustGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const response = await axios.get(API_URL);
        setGraphData(response.data);
      } catch (error) {
        console.error("Failed to fetch graph data", error);
      }
    };
    
    fetchGraph();
    const interval = setInterval(fetchGraph, 5000); // Poll for updates

    if (containerRef.current) {
        setDimensions({
            width: containerRef.current.offsetWidth,
            height: 400
        });
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-[#0B0E14] border border-[var(--color-border)] rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-2">Network Graph Legend</h3>
        <div className="flex flex-col gap-2 text-xs text-gray-300">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> User Entity</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Trusted Device</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Unverified Device</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Suspicious Device</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> IP Address</div>
        </div>
      </div>
      
      {graphData.nodes.length > 0 && typeof window !== "undefined" && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeRelSize={6}
          linkColor="color"
          linkWidth={2}
          backgroundColor="#0B0E14"
          // @ts-ignore
          d3Force="charge"
        />
      )}
    </div>
  );
}
