"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

export function ClientSideAIButton() {
    return (
        <button
            onClick={() => {
                // Look for the main AI button rendered by AIAssistantPanel
                const aiBtn = document.querySelector('button.fixed.bottom-6') as HTMLButtonElement;
                if (aiBtn) aiBtn.click();
            }}
            className="w-full py-3 px-4 bg-white text-slate-900 hover:bg-blue-50 active:scale-[0.98] focus:ring-4 focus:ring-white/20 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
        >
            <Sparkles className="w-4 h-4" /> Asistanı Başlat
        </button>
    );
}
