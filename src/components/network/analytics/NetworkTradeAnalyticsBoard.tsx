"use client";

import React from "react";

export function NetworkTradeAnalyticsBoard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 w-full">
      <h3 className="font-semibold text-gray-900 mb-4">
        Network Trade Flow Metrics
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
          <span className="block text-xl font-bold text-indigo-800">120K</span>
          <span className="text-xs text-indigo-600 block mt-1">
            24h Engine Volume
          </span>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
          <span className="block text-xl font-bold text-purple-800">4,200</span>
          <span className="text-xs text-purple-600 block mt-1">
            Avg Deal Size
          </span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
          <span className="block text-xl font-bold text-emerald-800">82%</span>
          <span className="text-xs text-emerald-600 block mt-1">
            Active Liquidity
          </span>
        </div>
      </div>
      <div className="h-32 mt-4 bg-gray-50 flex items-center justify-center rounded text-gray-400 text-sm">
        [Trade Volume Timeline Snapshot]
      </div>
    </div>
  );
}
