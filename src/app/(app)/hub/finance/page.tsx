"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import NetworkEarningsPage from '../earnings/page';
import PayoutsPage from '../payouts/page';
import NetworkPaymentsPage from '../payments/page';
import BoostInvoicesPage from '../../billing/boost-invoices/page';

function FinanceTabs() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'earnings';

    const tabs = [
        { id: 'earnings', label: 'Hak Ediş & Karlılık' },
        { id: 'payouts', label: 'Mali Çıkış (Payout)' },
        { id: 'invoices', label: 'B2B Finansal Matbuular' },
        { id: 'payments', label: 'Platform İçi Transferler' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'earnings': return <NetworkEarningsPage />;
            case 'payouts': return <PayoutsPage />;
            case 'invoices': return <BoostInvoicesPage />;
            case 'payments': return <NetworkPaymentsPage />;
            default: return <NetworkEarningsPage />;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] w-full font-sans">
            <div className="max-w-[1600px] mx-auto pt-8">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8 px-4 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-1">
                            B2B Finansal Operasyon Merkezi (Finance Gateway)
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Pazaryeri tahsilatları, escrow hakediş blokajları, komisyon faturaları ve nakit (payout) çıkış talepleri paneli.
                        </p>
                    </div>

                    <div className="flex bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-1 shrink-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => router.push(`?tab=${tab.id}`)}
                                className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default function UnifiedFinancePage() {
    return (
        <Suspense fallback={
            <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] flex items-center justify-center p-12">
                <div className="bg-white dark:bg-[#0f172a] p-12 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-center items-center">
                    <div className="w-8 h-8 border-4 border-slate-200 dark:border-white/5 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">Finans Modülleri Başlatılıyor...</span>
                </div>
            </div>
        }>
            <FinanceTabs />
        </Suspense>
    );
}
