"use client";

import { History } from "lucide-react";

export default function HistoryCampaigns() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-2xl flex items-center justify-center mb-4">
                <History className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Geçmiş Kampanyalar</h3>
            <p className="text-slate-500 max-w-md mt-2">
                Süresi dolmuş veya kaldırılmış olan kurgular, analiz için burada muhafaza edilmektedir.
            </p>
        </div>
    );
}
