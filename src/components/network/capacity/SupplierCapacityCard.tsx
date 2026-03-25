"use client";

import React from "react";

export function SupplierCapacityCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-2">My Supply Capacity</h3>
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-green-50 p-2 rounded-lg border border-green-100 text-center">
          <span className="block text-2xl font-bold text-green-700">45</span>
          <span className="text-xs text-green-600 block">Est. Daily Units</span>
        </div>
        <div className="flex-1 bg-blue-50 p-2 rounded-lg border border-blue-100 text-center">
          <span className="block text-2xl font-bold text-blue-700">92%</span>
          <span className="text-xs text-blue-600 block">
            Fulfillment Success
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Auto-calculated based on 30-day shipment throughput tracking.
      </p>
    </div>
  );
}
