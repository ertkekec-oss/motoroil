"use client";

import { useState } from 'react';
import CheckModule from '@/components/CheckModule';
import AccountPlanContent from '@/components/AccountPlanContent';
import TrialBalanceContent from '@/components/TrialBalanceContent';
import IncomeStatementContent from '@/components/IncomeStatementContent';
import VatSimulationContent from '@/components/VatSimulationContent';
import BaBsReconciliationContent from '@/components/BaBsReconciliationContent';
import FinancialHealthContent from '@/components/FinancialHealthContent';
import FinancialAuditContent from '@/components/FinancialAuditContent';

export default function AdvisorPage() {
    const [activeTab, setActiveTab] = useState<'plan' | 'mizan' | 'income' | 'vat' | 'babs' | 'health' | 'audit' | 'checks'>('checks');

    return (
        <div className="p-6 md:p-8 animate-in fade-in zoom-in-95 font-sans text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
                        👨‍💼 Mali Müşavir Paneli
                    </h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">
                        Resmi muhasebe kayıtları, hesap planı ve finansal araçlar.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('checks')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'checks'
                                ? 'bg-amber-500 text-white shadow-amber-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        🎫 Çek & Senet
                    </button>
                    <div className="w-px bg-white/10 mx-1"></div>
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'plan'
                                ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        📑 Hesap Planı
                    </button>
                    <button
                        onClick={() => setActiveTab('mizan')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'mizan'
                                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        ⚖️ Genel Mizan
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'income'
                                ? 'bg-orange-600 text-white shadow-orange-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        📊 Gelir Tablosu
                    </button>
                    <button
                        onClick={() => setActiveTab('vat')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'vat'
                                ? 'bg-rose-600 text-white shadow-rose-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        🧾 KDV Simülasyonu
                    </button>
                    <button
                        onClick={() => setActiveTab('babs')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'babs'
                                ? 'bg-purple-600 text-white shadow-purple-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        🤝 BA/BS
                    </button>
                    <button
                        onClick={() => setActiveTab('health')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'health'
                                ? 'bg-teal-600 text-white shadow-teal-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        🩺 Finans
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                            ${activeTab === 'audit'
                                ? 'bg-red-600 text-white shadow-red-500/20 shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        🕵️‍♂️ Denetim
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {activeTab === 'checks' && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                        <CheckModule />
                    </div>
                )}

                {activeTab === 'plan' && (
                    <div className="animate-in slide-in-from-left-4 fade-in duration-300">
                        <AccountPlanContent />
                    </div>
                )}

                {activeTab === 'mizan' && (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                        <TrialBalanceContent />
                    </div>
                )}

                {activeTab === 'income' && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <IncomeStatementContent />
                    </div>
                )}

                {activeTab === 'vat' && (
                    <div className="animate-in zoom-in-95 fade-in duration-300">
                        <VatSimulationContent />
                    </div>
                )}

                {activeTab === 'babs' && (
                    <div className="animate-in zoom-in-95 fade-in duration-300">
                        <BaBsReconciliationContent />
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="animate-in zoom-in-95 fade-in duration-300">
                        <FinancialHealthContent />
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="animate-in zoom-in-95 fade-in duration-300">
                        <FinancialAuditContent />
                    </div>
                )}
            </div>
        </div>
    );
}
