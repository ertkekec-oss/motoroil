"use client";

import { BarChart2 } from "lucide-react";

export default function AnalyticsCampaigns() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <BarChart2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Performans ve ROI</h3>
            <p className="text-slate-500 max-w-md mt-2">
                Hangi kanalların ve kampanyaların ne kadar gelir getirdiğini, ciro ciro ölçebileceğiniz analiz raporları yakında.
            </p>
        </div>
    );
}
