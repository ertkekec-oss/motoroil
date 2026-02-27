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
        { id: 'earnings', label: 'Earnings (Kazançlar)' },
        { id: 'payouts', label: 'Payouts (Para Çekme)' },
        { id: 'invoices', label: 'Invoices (Boost/Hub)' },
        { id: 'payments', label: 'Transactions (Ödemeler)' }
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
        <div className="max-w-7xl mx-auto w-full pb-10">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6 px-6 pt-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Ağ Finansı & Faturalar</h1>
                    <p className="text-slate-500 mt-1 text-sm">Escrow, hakedişler, faturalar ve tahsilat durumları.</p>
                </div>

                <div className="flex gap-1 bg-slate-100 p-1.5 rounded-lg border border-slate-200 shadow-sm w-fit overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => router.push(`?tab=${tab.id}`)}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="px-6">
                {/* 
                  Instead of double padding from the inner pages, we just render them 
                  directly. The inner pages have their own max-w-7xl and p-6 wrapper.
                  We can let them render naturally.
                */}
                <div className="-mx-6 -mt-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default function UnifiedFinancePage() {
    return (
        <Suspense fallback={<div className="p-10 text-center font-bold text-slate-400">Finans verileri yükleniyor...</div>}>
            <FinanceTabs />
        </Suspense>
    );
}
