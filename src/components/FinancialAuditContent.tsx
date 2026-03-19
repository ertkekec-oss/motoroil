"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Info, XOctagon, Loader2, ArrowRight, Shield, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FinancialAuditContent() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ISSUES_PER_PAGE = 10;

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await fetch('/api/financials/audit');
                const data = await res.json();
                if (data.success) {
                    setIssues(data.issues);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical': return <XOctagon className="w-6 h-6 text-rose-500" />;
            case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
            case 'info': return <Info className="w-6 h-6 text-blue-500" />;
            default: return <Activity className="w-6 h-6 text-slate-500" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'critical': return 'border-l-[4px] border-l-rose-500 bg-rose-50 dark:bg-rose-500/5';
            case 'warning': return 'border-l-[4px] border-l-amber-500 bg-amber-50 dark:bg-amber-500/5';
            case 'info': return 'border-l-[4px] border-l-blue-500 bg-blue-50 dark:bg-blue-500/5';
            default: return 'border-l-[4px] border-l-slate-400 bg-slate-50 dark:bg-white/5';
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            Akıllı Denetçi (Audit)
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                            Yapay zeka destekli kural motoru ile muhasebe kayıtlarındaki olası hataları ve riskleri tarar.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    <p className="text-[13px] font-semibold text-slate-400 animate-pulse">Kayıtlarınız derinlemesine denetleniyor...</p>
                </div>
            ) : issues.length === 0 ? (
                <div className="bg-white dark:bg-[#1e293b] border border-emerald-200 dark:border-emerald-500/30 rounded-3xl shadow-sm p-12 text-center text-emerald-600 dark:text-emerald-400 animate-in zoom-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <Shield className="w-16 h-16 mx-auto mb-6 text-emerald-500" />
                    <h3 className="text-2xl font-black tracking-tight">Harika! Hiçbir Sorun Bulunamadı.</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium max-w-lg mx-auto">Tüm finansal kayıtlarınız yasal mevzuata, vergi kanunlarına ve genel kabul görmüş muhasebe standartlarına tamamen uygun görünüyor.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {issues.slice((currentPage - 1) * ISSUES_PER_PAGE, currentPage * ISSUES_PER_PAGE).map((issue, idx) => (
                            <div key={idx} className={`p-6 rounded-[20px] flex flex-col justify-between ${getColor(issue.type)} border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group min-h-[220px] relative overflow-hidden bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl`}>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-0.5">{getIcon(issue.type)}</div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-[16px] leading-tight line-clamp-2">{issue.title}</h4>
                                                <div className="text-[11px] font-bold uppercase tracking-wider mt-2 flex flex-wrap gap-2 text-slate-500 dark:text-slate-400">
                                                    <span>{new Date(issue.date).toLocaleDateString()}</span>
                                                    <span>&bull;</span>
                                                    <span>FİŞ: {issue.fisNo}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-[13px] font-medium leading-relaxed line-clamp-3 mb-6">
                                        {issue.description}
                                    </p>
                                </div>
                                <div className="mt-auto flex flex-col xl:flex-row justify-between xl:items-center gap-4 pt-4 border-t border-slate-200/50 dark:border-white/5">
                                    <div className="flex gap-2 items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0f172a] px-2.5 py-1 rounded shadow-sm border border-slate-200 dark:border-white/5">{issue.category}</span>
                                        {issue.account !== '-' && (
                                            <span className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded shadow-sm border border-indigo-100 dark:border-indigo-500/20">{issue.account}</span>
                                        )}
                                    </div>
                                    <button className="px-5 h-10 w-full xl:w-auto rounded-xl font-bold text-[12px] text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 flex justify-center items-center gap-2 transition-all shadow-sm">
                                        İncele <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {issues.length > ISSUES_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                            <span className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                                Toplam <span className="text-slate-900 dark:text-white">{issues.length}</span> bulgudan <span className="text-slate-900 dark:text-white">{(currentPage - 1) * ISSUES_PER_PAGE + 1}-{Math.min(currentPage * ISSUES_PER_PAGE, issues.length)}</span> arası gösteriliyor
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex items-center justify-center px-4 font-black font-mono text-[14px] text-slate-900 dark:text-white">
                                    {currentPage} / {Math.ceil(issues.length / ISSUES_PER_PAGE)}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(issues.length / ISSUES_PER_PAGE)))}
                                    disabled={currentPage === Math.ceil(issues.length / ISSUES_PER_PAGE)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
