"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import NetworkEarningsPage from '../earnings/page';
import PayoutsPage from '../payouts/page';
import NetworkPaymentsPage from '../payments/page';
import BoostInvoicesPage from '../../billing/boost-invoices/page';

import HubFinanceTabs from "@/components/network/HubFinanceTabs";

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
        <div className="bg-slate-50 min-h-screen  w-full font-sans">
            <div className="max-w-[1600px] mx-auto pt-8">
                <div className="px-4 sm:px-6 lg:px-8">
                    <HubFinanceTabs />
                </div>
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-600 " />
                            B2B Finansal Operasyon Merkezi (Finance Gateway)
                        </h1>
                        <p className="text-[13px] text-slate-500  mt-1.5 max-w-4xl">
                            Pazaryeri tahsilatları, escrow hakediş blokajları, komisyon faturaları ve nakit (payout) çıkış talepleri paneli.
                        </p>
                    </div>

                    <div className="flex bg-white  rounded-lg border border-slate-200  shadow-sm overflow-hidden p-1 shrink-0">
                        {tabs?.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => router.push(`?tab=${tab.id}`)}
                                className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-slate-900  text-white  shadow-sm' : 'bg-transparent text-slate-700  hover:text-slate-900 :text-white hover:bg-slate-50 :bg-slate-800'}`}
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
            <div className="bg-slate-50 min-h-screen  flex items-center justify-center p-12">
                <div className="bg-white  p-12 rounded-2xl border border-slate-200  shadow-sm flex flex-col justify-center items-center">
                    <div className="w-8 h-8 border-4 border-slate-200  border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <span className="text-sm font-medium text-slate-500  uppercase tracking-widest">Finans Modülleri Başlatılıyor...</span>
                </div>
            </div>
        }>
            <FinanceTabs />
        </Suspense>
    );
}
