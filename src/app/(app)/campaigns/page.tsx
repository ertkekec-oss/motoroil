"use client";

import { useEffect, useState } from "react";
import { Gift, Activity, TrendingUp, Users } from "lucide-react";

export default function CampaignsDashboard() {
    const [stats, setStats] = useState({
        activeCount: 0,
        revenue: 0,
        discountGiven: 0,
        scheduledCount: 0
    });

    useEffect(() => {
        // Fetch stats later from API
        // setStats(...)
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Aktif Kurgular</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">0</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <Gift className="w-6 h-6 text-indigo-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Kampanya Geliri</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">₺0.00</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Verilen İndirim</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">₺0.00</h3>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                        <Activity className="w-6 h-6 text-rose-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Kullanım Sayısı</p>
                        <h3 className="text-3xl font-bold mt-2 text-slate-800 dark:text-white">0</h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                        <Users className="w-6 h-6 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Future charts / quick actions */}
            <div className="col-span-full bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 min-h-[300px] flex items-center justify-center text-slate-400">
                Analitik Grafikleri Hazırlanıyor...
            </div>
        </div>
    );
}
