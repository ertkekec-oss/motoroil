'use client';

import React from 'react';

export function PriceHeatMap() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col p-4 animate-pulse">
            <h3 className="font-semibold text-gray-900 mb-2">Pricing Intelligence Heatmap</h3>
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                [Pricing Heatmap Visualization]
            </div>
            <div className="flex justify-between mt-3 text-xs text-gray-500">
                <span>Low: 850 TRY</span>
                <span>Median: 1,000 TRY</span>
                <span>High: 1,150 TRY</span>
            </div>
        </div>
    );
}
