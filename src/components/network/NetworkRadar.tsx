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
      {/* CUSTOM TURKEY DATA MAP (User Provided) 
          Invert(1) turns the black background to white so it blends seamlessly into the light UI.
          Hue-rotate(180deg) brings the inverted cyan color back to its original stunning copper/red!
          Mix-blend-multiply ensures the pure white (#fff) background becomes totally transparent.
      */}
      <div className="absolute inset-0 z-0 opacity-[0.85] mix-blend-multiply pointer-events-none transition-all duration-1000 flex items-center justify-center pointer-events-none">
        <div
          className="w-[105%] md:w-[85%] h-full bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: "url('/custom-turkey-map.jpg')",
            filter:
              "invert(1) hue-rotate(180deg) contrast(1.1) brightness(1.2)",
          }}
        ></div>
      </div>

      {/* Central "P" Node (Periodya Octopus Center) */}
      <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center group/center pointer-events-auto">
        {/* Core Radar Scanner (Sweeping Effect) */}
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.2)_360deg)] animate-[spin_6s_linear_infinite] mix-blend-multiply opacity-50 z-0"></div>

        {/* Outer Tech Rings */}
        <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-600/10 animate-[ping_5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute w-[350px] h-[350px] rounded-full border border-blue-500/15 animate-[pulse_3s_ease-in-out_infinite] bg-blue-500/5"></div>
        <div
          className="absolute w-[240px] h-[240px] rounded-full border-[1px] border-indigo-500/30 animate-[spin_12s_linear_infinite_reverse]"
          style={{ borderStyle: "dotted", borderWidth: "4px" }}
        ></div>

        {/* Rotating Radar Rings */}
        <div className="absolute w-[180px] h-[180px] rounded-full border-[3px] border-l-transparent border-blue-500/70 animate-[spin_4s_linear_infinite]"></div>
        <div className="absolute w-[140px] h-[140px] rounded-full border-[2px] border-r-transparent border-indigo-500/60 animate-[spin_2s_linear_infinite_reverse]"></div>

        {/* The Core P */}
        <div className="relative w-28 h-28 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600 via-indigo-800 to-slate-900 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(37,99,235,0.7)] border-[4px] border-blue-300/60 z-10 hover:scale-110 transition-transform cursor-pointer overflow-hidden group-hover/center:shadow-[0_0_120px_rgba(59,130,246,1)] ring-8 ring-blue-500/20 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-blue-400/30 animate-[pulse_1.5s_ease-in-out_infinite] mix-blend-overlay"></div>

          {/* Scanline overlay inside P */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.08)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

          <span
            className="text-white text-[70px] font-black italic pr-1.5 leading-none z-10 relative"
            style={{ textShadow: "0 0 10px #60a5fa, 0 0 30px #3b82f6" }}
          >
            P
          </span>

          {/* Core Status Label */}
          <div className="absolute -top-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[11px] font-black px-5 py-2 rounded-full whitespace-nowrap shadow-[0_15px_30px_rgba(0,30,120,0.4)] opacity-0 group-hover/center:opacity-100 group-hover/center:-translate-y-2 transition-all pointer-events-none flex items-center gap-3 border border-blue-300/40 tracking-widest z-50">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
            NETWORK CORE ONLINE
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
