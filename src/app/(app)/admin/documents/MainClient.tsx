'use client';

import { useState } from 'react';
import PlatformDocumentsClient from './PlatformDocumentsClient';
import PlatformKycClient from './PlatformKycClient';

export default function MainClient() {
    const [tab, setTab] = useState<'kyc' | 'legacy'>('kyc');

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit mb-6">
                <button 
                    onClick={() => setTab('kyc')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'kyc' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    🛡️ Gatekeeper (KYC & Kurallar)
                </button>
                <button 
                    onClick={() => setTab('legacy')} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'legacy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    📑 Tüm Platform Sözleşmeleri
                </button>
            </div>

            {tab === 'kyc' && <PlatformKycClient />}
            {tab === 'legacy' && <PlatformDocumentsClient />}
        </div>
    );
}
