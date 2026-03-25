"use client";

import React from "react";

export function NetworkHealthBoard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 w-full">
      <h3 className="font-semibold text-gray-900 mb-4">
        Trade Observability Panel
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center">
          <span className="block text-2xl font-bold text-gray-800">98.5%</span>
          <span className="text-xs text-gray-500 block mt-1">
            Network Health
          </span>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col items-center">
          <span className="block text-2xl font-bold text-indigo-800">
            3,450
          </span>
          <span className="text-xs text-indigo-600 block mt-1">
            Active Liquidity
          </span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col items-center">
          <span className="block text-2xl font-bold text-emerald-800">
            12M+
          </span>
          <span className="text-xs text-emerald-600 block mt-1">
            Trade Volume
          </span>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex flex-col items-center">
          <span className="block text-2xl font-bold text-red-800">1.2%</span>
          <span className="text-xs text-red-600 block mt-1">Dispute Rate</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-bold text-blue-800">94%</span>
          <span className="text-xs text-blue-600">
            Global Shipping Reliability
          </span>
        </div>
        <button className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
          View Drilldown
        </button>
      </div>
    </div>
  );
}
