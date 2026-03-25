"use client";

import React from "react";

export function DiscoveryExplorer() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden">
      <h3 className="font-semibold text-gray-900 mb-2">Network Discovery</h3>
      <div className="h-64 bg-gray-50 flex items-center justify-center rounded border border-dashed border-gray-200 text-gray-400">
        [Trust & Capability Cluster Graph]
      </div>
      <div className="mt-4 flex gap-2">
        <button className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors">
          Find New Suppliers
        </button>
        <button className="text-xs bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded transition-colors">
          Find Regional Buyers
        </button>
      </div>
    </div>
  );
}
