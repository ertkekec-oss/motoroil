"use client";

import React, { useState, useEffect } from "react";
import {
    EnterpriseCard,
    EnterpriseTable,
    EnterprisePageShell,
    EnterpriseButton,
    EnterpriseInput,
    EnterpriseSelect
} from "@/components/ui/enterprise";
import { Search, X, Activity, History, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function AdminB2BRefundsPage() {
    const [refunds, setRefunds] = useState<any[]>([]);
    const [totalVisible, setTotalVisible] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [tenantIdFilter, setTenantIdFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Drawer State
    const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
    const [drawerData, setDrawerData] = useState<any>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    useEffect(() => {
        const fetchRefunds = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (statusFilter !== "ALL") params.append("status", statusFilter);
                if (tenantIdFilter) params.append("tenantId", tenantIdFilter);
                if (searchQuery) params.append("q", searchQuery);

                const res = await fetch(`/api/admin/b2b/refunds?${params.toString()}`);
                const data = await res.json();

                if (data.items) {
                    setRefunds(data.items);
                    setTotalVisible(data.stats?.totalVisible || 0);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchRefunds, 400); // debounce
        return () => clearTimeout(timer);
    }, [statusFilter, tenantIdFilter, searchQuery]);

    const openAuditDrawer = async (refundId: string) => {
        setSelectedRefundId(refundId);
        setDrawerLoading(true);
        try {
            const res = await fetch(`/api/admin/b2b/refunds/${refundId}`);
            const data = await res.json();
            if (data.refund) {
                setDrawerData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDrawerLoading(false);
        }
    };

    const closeDrawer = () => {
        setSelectedRefundId(null);
        setDrawerData(null);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-widest">{status}</span>;
            case 'SUCCEEDED':
            case 'COMPLETED':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-widest">{status}</span>;
            case 'FAILED':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-100 text-red-700 border border-red-200 uppercase tracking-widest">{status}</span>;
            default:
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-gray-100 text-gray-700 uppercase tracking-widest">{status}</span>;
        }
    };

    const headers = [
        "Refund ID",
        "Sipariş No / Bayi",
        "Tedarikçi",
        "Tarih/İşlem No",
        { label: "İade Tutar", alignRight: true },
        "Durum",
        { label: "Aksiyon", alignRight: true }
    ];

    const actions = (
        <div className="flex items-center gap-3">
            <EnterpriseInput
                placeholder="Refund ID / Order / Key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
            />
        </div>
    );

    return (
        <EnterprisePageShell
            title="B2B İade ve Uyuşmazlıklar (Refund Governance)"
            description="Tüm platform üzerinden B2B siparişlerine bağlı para iade ve gateway transaction durumlarını mercek altına alın."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
        >
            <EnterpriseCard noPadding className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                <div className="p-5 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-4 items-center bg-slate-50 dark:bg-slate-800/30 rounded-t-xl">
                    <div className="w-64">
                        <EnterpriseInput
                            label="Tenant ID (Tedarikçi)"
                            placeholder="Global View"
                            value={tenantIdFilter}
                            onChange={(e) => setTenantIdFilter(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <EnterpriseSelect
                            label="İade Statüsü"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tümü (ALL)</option>
                            <option value="PENDING">Bekleyen (PENDING)</option>
                            <option value="SUCCEEDED">Başarılı (SUCCEEDED)</option>
                            <option value="FAILED">Hatalı (FAILED)</option>
                        </EnterpriseSelect>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-white/5">
                                {headers.map((h: any, i) => (
                                    <th key={i} className={`px-4 py-3 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 ${h.alignRight ? 'text-right' : ''}`}>
                                        {typeof h === 'string' ? h : h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Yükleniyor...</td>
                                </tr>
                            ) : refunds.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Bu kriterlere uygun iade kaydı bulunamadı.</td>
                                </tr>
                            ) : (
                                refunds?.map((refund) => (
                                    <tr key={refund.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{refund.id.slice(0, 8)}...</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-1 font-bold">{refund.provider}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-200">{refund.order?.orderNumber}</div>
                                            <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{refund.order?.customerName}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-200 flex items-center gap-1.5 break-all">
                                                {refund.supplier?.name}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1">{refund.supplier?.id}</div>
                                        </td>
                                        <td className="p-4 align-middle text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-300">
                                            <div>{format(new Date(refund.createdAt), "dd MMM HH:mm")}</div>
                                            {refund.providerRefundId && (
                                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-1 font-bold">Ref: {refund.providerRefundId}</div>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="font-black text-[12px] tracking-wide text-slate-900 dark:text-white">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: refund.currency }).format(refund.amount)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <StatusBadge status={refund.status} />
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <EnterpriseButton variant="secondary" onClick={() => openAuditDrawer(refund.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <History className="w-4 h-4 mr-1.5" />
                                                Detay
                                            </EnterpriseButton>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest flex justify-between bg-slate-50/50 dark:bg-slate-800/10 rounded-b-xl">
                    <span>Toplam Eşleşme: {totalVisible} İADE</span>
                </div>
            </EnterpriseCard>

            {/* Audit Drawer Overlay */}
            {selectedRefundId && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />

                    <div className="relative w-full max-w-xl h-full bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
                        {drawerLoading ? (
                            <div className="flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                                İade Kayıtları Çekiliyor...
                            </div>
                        ) : drawerData?.refund ? (
                            <>
                                {/* Drawer Header */}
                                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex items-start justify-between">
                                    <div>
                                        <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                                            İade / Refund Audit
                                            {drawerData.refund.status === 'FAILED' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                                        </h2>
                                        <div className="text-[10px] font-mono font-bold text-slate-500">Refund ID: {drawerData.refund.id}</div>
                                    </div>
                                    <button onClick={closeDrawer} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                {/* Drawer Body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                        <div className="grid grid-cols-2 gap-y-6 text-sm">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Gateway Provider</div>
                                                <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{drawerData.refund.provider}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Provider Refund ID</div>
                                                <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white font-mono break-all">{drawerData.refund.providerRefundId || '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Sipariş ID</div>
                                                <div className="text-[11px] font-black text-slate-900 dark:text-white break-all">{drawerData.refund.order?.id}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Bayi / Ciro Eden</div>
                                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{drawerData.refund.order?.customerName}</div>
                                            </div>
                                            <div className="col-span-2 border-t border-slate-100 dark:border-white/5 pt-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">İade Tutarı</div>
                                                        <div className="font-black text-slate-900 dark:text-white text-lg tracking-wider">
                                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: drawerData.refund.currency }).format(drawerData.refund.amount)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">İade Durumu</div>
                                                        <StatusBadge status={drawerData.refund.status} />
                                                    </div>
                                                </div>
                                            </div>

                                            {drawerData.refund.reason && (
                                                <div className="col-span-2 bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl flex flex-col gap-1.5 mt-2">
                                                    <div className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">Reason / Dispute Mesajı</div>
                                                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">{drawerData.refund.reason}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
                                            <Activity className="w-4 h-4" /> Refund Gateway Logs
                                        </h3>

                                        <div className="space-y-4">
                                            {drawerData.audit?.length > 0 ? (
                                                drawerData.audit?.map((log: any, idx: number) => (
                                                    <div key={log.id} className="flex gap-4 group">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-500 bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors mt-2" />
                                                            {idx !== drawerData.audit.length - 1 && <div className="w-px h-full bg-slate-200 dark:border-r dark:border-white/10 my-1" />}
                                                        </div>
                                                        <div className="flex-1 bg-slate-50 dark:bg-[#1e293b]/50 rounded-xl p-4 border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{log.action || log.type}</div>
                                                                <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase whitespace-nowrap ml-4">
                                                                    {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")}
                                                                </div>
                                                            </div>
                                                            {log.details && (
                                                                <pre className="text-[10px] text-slate-600 dark:text-slate-300 mb-3 whitespace-pre-wrap font-mono bg-white dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-white/5 max-h-32 overflow-y-auto w-full break-all shadow-inner">
                                                                    {log.details}
                                                                </pre>
                                                            )}
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded inline-flex font-mono items-center gap-1 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                                                                By: {log.userName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 text-center py-6">Audit log bulunamadı. Gateway logları işlenmemiş olabilir.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </EnterprisePageShell>
    );
}
