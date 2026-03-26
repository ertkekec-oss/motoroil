"use client";
import React, { useEffect, useState } from "react";

export default function NetworkRadar() {
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    // Generate 8 random nodes around the center
    const newNodes = Array.from({ length: 9 }).map((_, i) => {
      // Keep x between 15% and 85%, y between 20% and 80% to avoid edges
      const x = 15 + Math.random() * 70;
      const y = 20 + Math.random() * 60;

      const counts = [
        "128k Talep",
        "45k Talep",
        "310k İşlem",
        "12k Talep",
        "8.1k Teklif",
        "8k Talep",
        "3.5k Talep",
        "1.2k İşlem",
        "6.4k Talep",
      ];
      const colors = [
        "bg-blue-500",
        "bg-indigo-500",
        "bg-blue-400",
        "bg-teal-500",
        "bg-slate-400",
        "bg-indigo-400",
      ];

      return {
        x: `${x}%`,
        y: `${y}%`,
        color: colors[Math.floor(Math.random() * colors.length)],
        shadow: "shadow-[0_0_15px_rgba(59,130,246,0.8)]",
        delay: `${(Math.random() * 2).toFixed(1)}s`,
        count: counts[i],
      };
    });
    setNodes(newNodes);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-hidden">
      {/* Futuristic Animated Turkey Map Overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none bg-center bg-no-repeat bg-contain"
        style={{
          backgroundImage:
            "url('https://upload.wikimedia.org/wikipedia/commons/b/bc/BlankMap-Turkey.svg')",
          backgroundPosition: "center",
          backgroundSize: "85% auto",
          filter: "grayscale(1) contrast(1.2)",
        }}
      ></div>

      {/* Central "P" Node (Periodya Octopus Center) */}
      <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center group/center pointer-events-auto">
        {/* Outer Tech Rings */}
        <div className="absolute w-[400px] h-[400px] rounded-full border border-blue-500/10 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute w-[250px] h-[250px] rounded-full border border-blue-400/20 animate-[pulse_2s_ease-in-out_infinite]"></div>

        {/* Rotating Radar Rings */}
        <div
          className="absolute w-[180px] h-[180px] rounded-full border-t-2 border-r-2 border-blue-500/30 animate-[spin_8s_linear_infinite]"
          style={{ borderStyle: "dashed" }}
        ></div>
        <div className="absolute w-[130px] h-[130px] rounded-full border-b-4 border-indigo-400/40 animate-[spin_3s_linear_infinite_reverse]"></div>

        {/* The Core P */}
        <div className="relative w-24 h-24 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.7)] border-[3px] border-blue-300/50 z-10 hover:scale-110 transition-transform cursor-pointer overflow-hidden group-hover/center:shadow-[0_0_80px_rgba(59,130,246,1)]">
          <div className="absolute inset-0 bg-blue-400/20 animate-pulse mix-blend-overlay"></div>
          <span className="text-white text-[56px] font-black italic drop-shadow-[0_2px_15px_rgba(255,255,255,0.8)] pr-1.5 leading-none">
            P
          </span>

          {/* Core Status Label */}
          <div className="absolute -top-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold px-5 py-2 rounded-full whitespace-nowrap shadow-[0_10px_25px_rgba(0,30,100,0.3)] opacity-0 group-hover/center:opacity-100 group-hover/center:-translate-y-2 transition-all pointer-events-none flex items-center gap-2 border border-blue-400/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
            HUB MERKEZİ AKTİF
          </div>
        </div>
      </div>

      {/* Logistics Network Lines (Ahtapot Kolları) */}
      <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-60">
        <defs>
          <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
          <style>
            {`
              @keyframes dashFlow {
                from { stroke-dashoffset: 24; }
                to { stroke-dashoffset: 0; }
              }
              .animate-flow {
                animation: dashFlow 1.2s linear infinite;
              }
            `}
          </style>
        </defs>
        {nodes.map((p, i) => (
          <g key={i}>
            <line
              x1="50%"
              y1="50%"
              x2={p.x}
              y2={p.y}
              stroke="url(#netGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 8"
              className="animate-flow"
            />
            {/* Target Pulse Dots */}
            <circle
              cx={p.x}
              cy={p.y}
              r="2"
              fill="#60a5fa"
              className="animate-ping"
              style={{ animationDuration: "1s" }}
            />
          </g>
        ))}
      </svg>

      {/* Glowing Signals on Map (HUD Tags) */}
      <div className="absolute w-full h-full inset-0 mx-auto pointer-events-none z-30">
        {nodes.map((pos, idx) => (
          <div
            key={idx}
            className="absolute flex items-center group pointer-events-auto mix-blend-multiply"
            style={{
              top: pos.y,
              left: pos.x,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Yanıp Sönen Nokta Wrapper */}
            <div
              className={`w-10 h-10 rounded-full border border-white/50 backdrop-blur-[1px] group-hover:scale-125 transition-transform animate-[pulse_2s_ease-in-out_infinite] flex items-center justify-center bg-blue-100/30`}
              style={{ animationDelay: pos.delay }}
            >
              <div
                className={`w-3 h-3 rounded-full ${pos.color} ${pos.shadow}`}
              ></div>
            </div>

            {/* HUD Badge */}
            <div className="absolute left-[70%] whitespace-nowrap ml-2 bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-slate-200/80 shadow-[0_5px_25px_-5px_rgba(0,0,0,0.15)] flex items-center z-20 group-hover:scale-110 transition-all cursor-pointer">
              <div
                className={`w-2 h-2 rounded-full mr-2 animate-pulse ${pos.color}`}
              ></div>
              <span className="text-[10px] font-black font-mono tracking-wider text-slate-800">
                {pos.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
