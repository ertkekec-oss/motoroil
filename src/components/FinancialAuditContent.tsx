"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Info, XOctagon, Loader2, ArrowRight, Shield, Activity } from 'lucide-react';

export default function FinancialAuditContent() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                <div className="space-y-4">
                    {issues?.map((issue, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 ${getColor(issue.type)} border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:shadow-md group`}>
                            <div className="mt-1 md:mt-0 shrink-0">{getIcon(issue.type)}</div>
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                    <h4 className="font-black text-slate-900 dark:text-white text-[15px]">{issue.title}</h4>
                                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-black/30 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 uppercase tracking-widest shrink-0">
                                        {new Date(issue.date).toLocaleDateString()} &middot; Fiş: {issue.fisNo}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-[13px] font-medium mt-1 leading-relaxed max-w-4xl">{issue.description}</p>
                                <div className="mt-3 flex gap-2 items-center text-[11px] font-bold uppercase tracking-wider">
                                    <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">{issue.category}</span>
                                    {issue.account !== '-' && (
                                        <span className="text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">{issue.account}</span>
                                    )}
                                </div>
                            </div>
                            <button className="px-4 h-11 w-full md:w-auto rounded-xl font-bold text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-all group-hover:border-slate-300 dark:group-hover:border-white/20">
                                İncele <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
