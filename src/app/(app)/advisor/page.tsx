"use client";

import { useState } from 'react';
import { Ticket, Activity, ListTree, Scale, BarChart3, Calculator, Handshake, ShieldCheck, Import, FileText, DownloadCloud } from 'lucide-react';
import CheckModule from '@/components/CheckModule';
import AccountPlanContent from '@/components/AccountPlanContent';
import TrialBalanceContent from '@/components/TrialBalanceContent';
import IncomeStatementContent from '@/components/IncomeStatementContent';
import VatSimulationContent from '@/components/VatSimulationContent';
import BaBsReconciliationContent from '@/components/BaBsReconciliationContent';
import FinancialHealthContent from '@/components/FinancialHealthContent';
import FinancialAuditContent from '@/components/FinancialAuditContent';
import AdvisorExportModule from '@/components/AdvisorExportModule';

export default function AdvisorPage() {
    const [activeTab, setActiveTab] = useState<'plan' | 'mizan' | 'income' | 'vat' | 'babs' | 'health' | 'audit' | 'checks' | 'export'>('checks');

    return (
        <div className="p-6 md:p-10 animate-in fade-in duration-500 font-sans min-h-screen bg-[#F6F8FB] dark:bg-[#0F172A] text-slate-900 dark:text-white">
            {/* Header Redesign: Strategic Zone */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-[6px] border border-indigo-100 dark:border-indigo-500/20">PERİODYA FİNANS</span>
                    </div>
                    <h1 className="text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                        Mali Müşavir & Finans Merkezi
                    </h1>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">
                        Resmi muhasebe kayıtları, hesap planı, vergi simülasyonları ve finansal yönetişim paneli.
                    </p>
                </div>
                {/* Contextual Action Bar */}
                <div className="flex items-center gap-3">
                    <button className="h-[44px] px-6 rounded-xl border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
                         <FileText className="w-4 h-4 text-slate-400" />
                        Geçmiş Dönem
                    </button>
                    <button className="h-[44px] px-6 rounded-xl bg-indigo-600 text-white text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2">
                        <DownloadCloud className="w-4 h-4" />
                        Aylık Rapor İndir
                    </button>
                </div>
            </header>

            {/* Navigation Zone v2: Enterprise Tabs */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-1.5 mb-8 shadow-sm border border-slate-200 dark:border-white/5 w-full overflow-hidden">
                <div className="flex items-center justify-between gap-0.5 md:gap-1 w-full">
                    {[
                        { id: 'checks', label: 'Çek & Senet', icon: <Ticket className="w-4 h-4 shrink-0" /> },
                        { id: 'health', label: 'Finans', icon: <Activity className="w-4 h-4 shrink-0" /> },
                        { id: 'plan', label: 'Hesap Planı', icon: <ListTree className="w-4 h-4 shrink-0" /> },
                        { id: 'mizan', label: 'Mizan', icon: <Scale className="w-4 h-4 shrink-0" /> },
                        { id: 'income', label: 'Gelir Tablosu', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
                        { id: 'vat', label: 'KDV Simülasyonu', icon: <Calculator className="w-4 h-4 shrink-0" /> },
                        { id: 'babs', label: 'BA/BS', icon: <Handshake className="w-4 h-4 shrink-0" /> },
                        { id: 'audit', label: 'Denetim', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
                        { id: 'export', label: 'Veri Aktarımı', icon: <Import className="w-4 h-4 shrink-0" /> },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex flex-1 items-center justify-center gap-1.5 md:gap-2 h-10 lg:h-11 px-1 lg:px-4 rounded-xl text-[11px] lg:text-[13px] font-bold transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="gap-y-8 flex flex-col pt-4">
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
                
                {activeTab === 'export' && (
                    <div className="animate-in zoom-in-95 fade-in duration-300">
                        <AdvisorExportModule />
                    </div>
                )}
            </div>
        </div>
    );
}
