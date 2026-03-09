"use client";

import { CalendarClock } from "lucide-react";

export default function ScheduledCampaigns() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
                <CalendarClock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Planlı Kurgular Yakında</h3>
            <p className="text-slate-500 max-w-md mt-2">
                İleri tarihli kampanyalarınız bu ekranda listelenecek. Başlama tarihi geldiğinde otomatik olarak aktif statüye geçecektir.
            </p>
        </div>
    );
}
