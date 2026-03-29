const fs = require('fs');

const pageCode = `import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnvelopeDetailClient from "./EnvelopeDetailClient";

export default async function EnvelopeDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const { id } = await params;

    const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id },
        include: {
            recipients: {
                orderBy: { orderIndex: 'asc' }
            },
            auditEvents: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!envelope || envelope.tenantId !== tenantId) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 animate-in fade-in duration-500">
                <EnvelopeDetailClient envelope={envelope} currentUserEmail={session.user?.email || ''} />
            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/app/(app)/signatures/envelopes/[id]/page.tsx', pageCode);

const clientCode = `"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useModal } from "@/contexts/ModalContext";
import { ChevronLeft, FileText, CheckCircle2, History, AlertCircle, Users, Download, Eye, XCircle, PenTool, Activity, ShieldAlert, Navigation } from "lucide-react";

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={\`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col \${className}\`}>
        {title && (
            <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest px-6 py-4 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 flex items-center gap-2 relative">
                {icon && <span className="opacity-70 text-slate-400">{icon}</span>}
                {title}
            </div>
        )}
        <div className="flex-1 w-full relative">
            {children}
        </div>
    </div>
);

export default function EnvelopeDetailClient({ envelope, currentUserEmail }: { envelope: any, currentUserEmail?: string }) {
    const { showConfirm, showSuccess, showError } = useModal();
    const [docUrl, setDocUrl] = useState('');
    const [loadingDoc, setLoadingDoc] = useState(false);
    const [signing, setSigning] = useState(false);

    const isMyTurn = envelope.recipients?.find((r: any) => r.email === currentUserEmail && ['PENDING', 'VIEWED'].includes(r.status));

    const handleSign = async () => {
        showConfirm(
            "Belgeyi İmzala",
            "Bu belgeyi (sözleşmeyi) dijital olarak imzalamayı onaylıyor musunuz? Bu işlem hukuki bağlayıcılık taşıyabilir.",
            async () => {
                setSigning(true);
                try {
                    const res = await fetch(\`/api/signatures/envelopes/\${envelope.id}/sign\`, { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess("Bilgi", 'Belge başarıyla imzalandı!');
                        window.location.reload();
                    } else {
                        showError("Uyarı", data.error || 'İmzalama başarısız oldu.');
                    }
                } catch (e) {
                    showError("Uyarı", 'Bağlantı hatası.');
                } finally {
                    setSigning(false);
                }
            }
        );
    };

    const handleViewDocument = async () => {
        if (docUrl) return;
        setLoadingDoc(true);
        try {
            const res = await fetch(\`/api/signatures/envelopes/\${envelope.id}/document\`);
            const data = await res.json();
            if (data.success && data.url) {
                setDocUrl(data.url);
            } else {
                showError("Uyarı", data.error || 'Belge yüklenemedi.');
            }
        } catch (e) {
            showError("Uyarı", 'Belge yüklenirken bağlantı hatası oluştu.');
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleViewFinalDocument = async () => {
        setLoadingDoc(true);
        try {
            const res = await fetch(\`/api/signatures/envelopes/\${envelope.id}/document?final=true\`);
            const data = await res.json();
            if (data.success && data.url) {
                window.open(data.url, '_blank');
            } else {
                showError("Uyarı", data.error || 'Final belge yüklenemedi.');
            }
        } catch (e) {
            showError("Uyarı", 'Belge yüklenirken bağlantı hatası oluştu.');
        } finally {
            setLoadingDoc(false);
        }
    };

    const handleCancel = async () => {
        showConfirm(
            "Zarfı İptal Et",
            "Bu zarfı iptal etmek (geri çekmek) istediğinize emin misiniz? İmzacıların onayı da iptal edilecektir.",
            async () => {
                try {
                    const res = await fetch(\`/api/signatures/envelopes/\${envelope.id}/cancel\`, { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                        showSuccess("Bilgi", 'Zarf başarıyla iptal edildi.');
                        window.location.reload();
                    } else {
                        showError("Uyarı", data.error || 'İptal işlemi başarısız.');
                    }
                } catch (e) {
                    showError("Uyarı", 'Ağ hatası oluştu, işlem yapılamadı.');
                }
            }
        );
    };
    
    const statusConfig = {
        'COMPLETED': { label: 'TÜMÜ TAMAMLANDI', bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500', fill: 'bg-emerald-500', icon: <CheckCircle2 className="w-5 h-5"/> },
        'REJECTED': { label: 'REDDEDİLDİ', bg: 'bg-red-50 dark:bg-red-500/10', color: 'text-red-500', fill: 'bg-red-500', icon: <XCircle className="w-5 h-5"/> },
        'REVISION_REQUESTED': { label: 'REVİZE TALEBİ', bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500', fill: 'bg-orange-500', icon: <AlertCircle className="w-5 h-5"/> },
        'PENDING': { label: 'BEKLEYEN İMZA', bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500', fill: 'bg-blue-500', icon: <Activity className="w-5 h-5" /> },
        'DRAFT': { label: 'TASLAK', bg: 'bg-slate-100 dark:bg-slate-800/80', color: 'text-slate-500', fill: 'bg-slate-500', icon: <FileText className="w-5 h-5"/> },
    };
    const currentStatus = (statusConfig as any)[envelope.status] || statusConfig['PENDING'];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/signatures/envelopes" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all shadow-sm shrink-0">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-loose mb-1 flex items-center gap-3">
                            Zarf Özeti
<span className="px-2.5 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono rounded-lg border border-slate-200 dark:border-slate-700">#{envelope.id.substring(envelope.id.length - 8).toUpperCase()}</span>
                        </h1>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5"/> {envelope.title}</span>
                            <span className="flex items-center gap-2"><History className="w-3.5 h-3.5"/> Başlangıç: {new Date(envelope.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto mt-4 md:mt-0">
                    <div className={\`flex items-center gap-3 px-5 py-2.5 rounded-xl border border-dashed shadow-sm \${currentStatus.bg} \${currentStatus.color} \${currentStatus.bg.replace('bg-','border-').replace('/10','/30')}\`}>
                       {currentStatus.icon}
                       <span className="text-[11px] font-black tracking-widest leading-none">{currentStatus.label}</span>
                    </div>

                    {['DRAFT', 'PENDING', 'IN_PROGRESS'].includes(envelope.status) && (
                        <button onClick={handleCancel} className="px-5 py-3 h-[42px] flex items-center bg-white dark:bg-[#0f172a] hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 border border-slate-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                            İPTAL EDİN
                        </button>
                    )}
                    {isMyTurn && (
                        <button disabled={signing} onClick={handleSign} className="px-6 py-3 h-[42px] flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 dark:border-blue-500/50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/20 disabled:opacity-50">
                            <PenTool className="w-4 h-4"/> {signing ? 'OS İŞLİYOR...' : 'BELGEYİ İMZALA (ONAYLA)'}
                        </button>
                    )}
                    {envelope.status === 'REVISION_REQUESTED' && (
                        <button disabled={signing} onClick={async () => {
                            setSigning(true);
                            await fetch(\`/api/signatures/envelopes/\${envelope.id}/reject-revision\`, { method: 'POST' });
                            window.location.reload();
                        }} className="px-5 py-3 h-[42px] flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 border border-orange-200 dark:border-orange-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            <ShieldAlert className="w-4 h-4"/> REVİZEYİ REDDET & ZORLA
                        </button>
                    )}
                    {envelope.status === 'COMPLETED' && envelope.signedDocumentKey && (
                        <button disabled={loadingDoc} onClick={handleViewFinalDocument} className="px-6 py-3 h-[42px] flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50">
                            <Download className="w-4 h-4"/> {loadingDoc ? 'BEKLEYİN...' : 'İMZALI DOSYAYI AL'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Takes 2/3 space usually */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
                    
                    {envelope.auditEvents.filter((a: any) => a.action === 'RECIPIENT_REVISION_REQUESTED').length > 0 && (
                        <SoftContainer title="REVİZYON TALEPLERİ" icon={<AlertCircle className="w-4 h-4"/>} className="border-orange-200 dark:border-orange-500/30 shadow-[0_4px_24px_-10px_rgba(249,115,22,0.2)]">
                            <div className="p-6 bg-orange-50/50 dark:bg-orange-500/5 space-y-4">
                                {envelope.auditEvents.filter((a: any) => a.action === 'RECIPIENT_REVISION_REQUESTED').map((a: any) => (
                                    <div key={a.id} className="p-5 bg-white dark:bg-[#0f172a] rounded-xl border border-orange-100 dark:border-orange-500/20 shadow-sm flex flex-col gap-2">
                                        <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="w-3.5 h-3.5"/> {new Date(a.createdAt).toLocaleString()}
                                        </div>
                                        <div className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                            {a.metaJson?.revisionMessage || 'Belirtilmemiş bir revize veya değişiklik talebi bulunuyor.'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SoftContainer>
                    )}

                    <SoftContainer title="İmzacı Durumları & Sıralı Liste" icon={<Users className="w-4 h-4"/>}>
                        <div className="flex flex-col p-6 gap-4">
                            {envelope.recipients.map((r: any) => (
                                <div key={r.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 bg-[#f8fafc] dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-2xl transition-shadow hover:shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[13px] font-black text-slate-600 dark:text-slate-400 shrink-0">
                                            {r.orderIndex}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-wider">{r.name}</div>
                                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-1">
                                                {r.email} <span className="mx-2 opacity-50">•</span> Rol: {r.role}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-1.5 ml-14 sm:ml-0">
                                        <span className={\`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest \${
                                            r.status === 'SIGNED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                            r.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' :
                                            r.status === 'REVISION_REQUESTED' ? 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400' :
                                            'bg-white dark:bg-[#0f172a] text-slate-500 border border-slate-200 dark:border-slate-700'
                                        }\`}>
                                            <div className={\`w-1 h-1 rounded-full mr-2 \${
                                                r.status === 'SIGNED' ? 'bg-emerald-500' :
                                                r.status === 'REJECTED' ? 'bg-red-500' : 
                                                r.status === 'REVISION_REQUESTED' ? 'bg-orange-500' : 'bg-slate-400'
                                            }\`}></div>
                                            {r.status}
                                        </span>
                                        {r.signedAt && <div className="text-[9px] font-bold text-emerald-600/60 dark:text-emerald-400/60 font-mono tracking-widest uppercase items-center flex gap-1"><CheckCircle2 className="w-3 h-3"/> {new Date(r.signedAt).toLocaleString()}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SoftContainer>

                    <SoftContainer title="Belge Önizlemesi" icon={<Eye className="w-4 h-4"/>}>
                        <div className="p-6">
                           {!docUrl && !loadingDoc && (
                                <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-[#0f172a]">
                                    <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4"/>
                                    <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">GİZLİLİK ONYMA VE ERİŞİM KONTROLÜ</h4>
                                    <p className="text-[11px] font-medium text-slate-500 text-center max-w-sm mt-3 leading-relaxed">
                                        Tam güvenlik için belge önizlemesini kendiniz tetiklemeniz gerekmektedir. İlgili belge içeriği loglanacaktır.
                                    </p>
                                    <button onClick={handleViewDocument} className="mt-6 px-6 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                        BELGEYİ YÜKLE
                                    </button>
                                </div>
                           )}
                           {loadingDoc && (
                               <div className="py-20 flex flex-col justify-center items-center text-slate-400 animate-pulse">
                                   <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                   <span className="text-[10px] font-black tracking-widest uppercase">Güvenli PDF Getiriliyor...</span>
                               </div>
                           )}
                           {docUrl && (
                               <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                                   <iframe src={\`\${docUrl}#toolbar=0\`} className="w-full h-[600px] bg-white border-none" />
                                   <div className="p-2 text-center text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10">
                                       <a href={docUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 hover:underline">Orijinalini görüntülemek ve yerel kaydetmek için buraya tıklayın.</a>
                                   </div>
                               </div>
                           )}
                        </div>
                    </SoftContainer>

                </div>

                {/* Right Column - Audit Trail */}
                <div className="col-span-1 flex flex-col">
                    <SoftContainer title="Log: Sistem İz Haritası" icon={<Navigation className="w-4 h-4"/>} className="h-full min-h-[500px]">
                        {envelope.auditEvents.length === 0 ? (
                            <div className="py-20 text-center text-[10px] font-black text-slate-400 tracking-widest">
                                KAYIT BULUNMUYOR.
                            </div>
                        ) : (
                            <div className="p-6 relative">
                                <div className="absolute top-10 bottom-10 left-[41px] w-[2px] bg-slate-100 dark:bg-white/5 rounded-full z-0"></div>
                                <div className="flex flex-col gap-6 relative z-10 w-full">
                                    {envelope.auditEvents.map((a: any, i: number) => {
                                        const isSystem = a.action.includes('ENVELOPE');
                                        const isGood = a.action.includes('SIGNED') || a.action.includes('COMPLETED') || a.action.includes('VERIFIED');
                                        const isBad = a.action.includes('REJECTED') || a.action.includes('FAILED');
                                        return (
                                            <div key={a.id} className="flex gap-4">
                                                <div className={\`w-8 h-8 rounded-full border-2 border-white dark:border-[#0f172a] flex items-center justify-center shrink-0 shadow-sm \${
                                                    isGood ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' :
                                                    isBad ? 'bg-red-100 dark:bg-red-500/20 text-red-500' :
                                                    isSystem ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }\`}>
                                                    {a.action.includes('VIEWED') ? <Eye className="w-3.5 h-3.5" /> : 
                                                     a.action.includes('SIGNED') ? <PenTool className="w-3.5 h-3.5" /> : 
                                                     a.action.includes('REJECTED') ? <XCircle className="w-3.5 h-3.5" /> : 
                                                     a.action.includes('COMPLETED') ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                                                     <Activity className="w-3.5 h-3.5" />}
                                                </div>
                                                <div className="flex flex-col flex-1 pt-1">
                                                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 leading-tight">
                                                        {a.action.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3"/> {new Date(a.createdAt).toLocaleString()}
                                                    </div>
                                                    {a.metaJson && a.metaJson.ip && (
                                                        <div className="mt-2 text-[9px] text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-white/5 break-all">
                                                            Ağ: {a.metaJson.ip} <br/> {a.metaJson.userAgent?.substring(0, 45)}...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </SoftContainer>
                </div>

            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/app/(app)/signatures/envelopes/[id]/EnvelopeDetailClient.tsx', clientCode);
console.log('done rewriting envelope detail');
