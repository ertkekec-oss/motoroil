"use client";

import React, { useState, useEffect } from "react";
import {
    EnterpriseCard,
    EnterpriseTable,
    EnterprisePageShell,
    EnterpriseSectionHeader,
    EnterpriseButton,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseSwitch
} from "@/components/ui/enterprise";
import { Search, Filter, X, Server, Activity, ArrowRight, ShieldAlert, History } from "lucide-react";
import { format } from "date-fns";

export default function AdminB2BOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [totalVisible, setTotalVisible] = useState(0);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [tenantIdFilter, setTenantIdFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLargeOrderOnly, setIsLargeOrderOnly] = useState(false);
    const [isAnomalyOnly, setIsAnomalyOnly] = useState(false);

    // Drawer State
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [drawerData, setDrawerData] = useState<any>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (statusFilter !== "ALL") params.append("status", statusFilter);
                if (tenantIdFilter) params.append("tenantId", tenantIdFilter);
                if (searchQuery) params.append("q", searchQuery);
                if (isLargeOrderOnly) params.append("minTotal", "50000");
                if (isAnomalyOnly) params.append("anomalyOnly", "true");

                const res = await fetch(`/api/admin/b2b/dealer-orders?${params.toString()}`);
                const data = await res.json();

                if (data.items) {
                    setOrders(data.items);
                    setTotalVisible(data.stats?.totalVisible || 0);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchOrders, 400); // debounce
        return () => clearTimeout(timer);
    }, [statusFilter, tenantIdFilter, searchQuery, isLargeOrderOnly, isAnomalyOnly]);

    const openAuditDrawer = async (orderId: string) => {
        setSelectedOrderId(orderId);
        setDrawerLoading(true);
        try {
            const res = await fetch(`/api/admin/b2b/dealer-orders/${orderId}`);
            const data = await res.json();
            if (data.order) {
                setDrawerData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDrawerLoading(false);
        }
    };

    const closeDrawer = () => {
        setSelectedOrderId(null);
        setDrawerData(null);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'PENDING_APPROVAL':
            case 'PAID_PENDING_APPROVAL':
            case 'PENDING':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-widest">{status}</span>;
            case 'APPROVED':
            case 'COMPLETED':
            case 'SHIPPED':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-widest">{status}</span>;
            case 'ESCROW':
            case 'ESCROW_DISPUTE':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-100 text-red-700 border border-red-200 animate-pulse uppercase tracking-widest">{status}</span>;
            case 'NOT_AVAILABLE_IN_DEALER_NETWORK':
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-widest">N/A</span>;
            default:
                return <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-gray-100 text-gray-700 uppercase tracking-widest">{status}</span>;
        }
    };

    const headers = [
        "Sipariş ID",
        "Tedarikçi (Tenant)",
        "Bayi (Müşteri)",
        "Tarih",
        { label: "Tutar", alignRight: true },
        "Durum",
        { label: "Aksiyon", alignRight: true }
    ];

    const actions = (
        <div className="flex items-center gap-3">
            <EnterpriseInput
                placeholder="Sipariş No / Bayi Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
            />
        </div>
    );

    return (
        <EnterprisePageShell
            title="B2B Network Governance"
            description="Tüm tenantların dealer network sipariş rezervasyonları ve limit riskleri (Read-Only Audit)"
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
        >
            <EnterpriseCard noPadding className="border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] shadow-sm">
                <div className="p-5 border-b border-slate-200 dark:border-white/5 flex flex-wrap gap-4 items-center bg-slate-50 dark:bg-slate-800/30 rounded-t-xl">
                    <div className="w-64">
                        <EnterpriseInput
                            label="Tenant ID (Tedarikçi Filtresi)"
                            placeholder="Global View (Tüm Tenantlar)"
                            value={tenantIdFilter}
                            onChange={(e) => setTenantIdFilter(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <EnterpriseSelect
                            label="Sipariş Durumu"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tümü (ALL)</option>
                            <option value="PENDING">PENDING (Onay Bekleyen)</option>
                            <option value="ESCROW">ESCROW (Uyuşmazlık)</option>
                            <option value="APPROVED">APPROVED (Onaylı)</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="REFUND_REQUESTED">REFUND_REQUESTED</option>
                        </EnterpriseSelect>
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-4 items-end pb-1">
                        <EnterpriseSwitch
                            checked={isLargeOrderOnly}
                            onChange={() => setIsLargeOrderOnly(!isLargeOrderOnly)}
                            label="Büyük Siparişler (>50K)"
                        />
                        <EnterpriseSwitch
                            checked={isAnomalyOnly}
                            onChange={() => setIsAnomalyOnly(!isAnomalyOnly)}
                            label="Anomaliler (Audit Sinyali)"
                        />
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
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Bu kriterlere uygun sipariş bulunamadı.</td>
                                </tr>
                            ) : (
                                orders?.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{order.orderNumber}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-1 font-bold">{order.id.slice(-8)}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-200 break-all">{order.supplier?.name}</div>
                                            <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">ID: {order.supplier?.id}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-200 break-all">{order.customerName}</div>
                                            {order.isLimitExceeded && (
                                                <div className="text-[9px] text-rose-500 font-extrabold mt-1.5 flex items-center gap-1 uppercase tracking-widest"><ShieldAlert className="w-3 h-3" /> LİMİT AŞIMI</div>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-300">
                                            {format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="font-black text-[12px] tracking-wide text-slate-900 dark:text-white">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: order.currency }).format(order.totalAmount)}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <EnterpriseButton variant="secondary" onClick={() => openAuditDrawer(order.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <History className="w-4 h-4 mr-1.5" />
                                                İncele
                                            </EnterpriseButton>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest flex justify-between bg-slate-50/50 dark:bg-slate-800/10 rounded-b-xl">
                    <span>Toplam Eşleşme: {totalVisible} SİPARİŞ</span>
                </div>
            </EnterpriseCard>

            {/* Audit Drawer Overlay */}
            {selectedOrderId && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />

                    <div className="relative w-full max-w-xl h-full bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
                        {drawerLoading ? (
                            <div className="flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                                Kayıtlar Çekiliyor...
                            </div>
                        ) : drawerData?.order ? (
                            <>
                                {/* Drawer Header */}
                                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex items-start justify-between">
                                    <div>
                                        <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                                            Sipariş Audit Detayı
                                        </h2>
                                        <div className="text-[10px] font-mono font-bold text-slate-500">{drawerData.order.orderNumber}</div>
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
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Tedarikçi</div>
                                                <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white break-all">{drawerData.order.supplier?.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Müşteri (Bayi)</div>
                                                <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white break-all">{drawerData.order.customerName}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Sipariş Tutarı</div>
                                                <div className="font-black text-slate-900 dark:text-white text-lg tracking-wider">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: drawerData.order.currency }).format(drawerData.order.totalAmount)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Güncel Durum</div>
                                                <StatusBadge status={drawerData.order.status} />
                                            </div>
                                            {drawerData.order.isLimitExceeded && (
                                                <div className="col-span-2 bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl flex items-start gap-4 mt-2">
                                                    <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                                                    <div>
                                                        <div className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-1">Limit Aşımı Tespit Edildi</div>
                                                        <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                                                            Aşılan Tutar: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(drawerData.order.creditExceededAmount || 0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2">
                                            <Activity className="w-4 h-4" /> Sistem Timeline Logs
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
                                                                <div className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{log.action}</div>
                                                                <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase whitespace-nowrap ml-4">
                                                                    {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")}
                                                                </div>
                                                            </div>
                                                            {log.details && <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-3">{log.details}</div>}
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded inline-flex font-mono items-center gap-1 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b]">
                                                                Actor: {log.userName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-[11px] font-black text-slate-500 text-center py-6 uppercase tracking-widest">Audit log bulunamadı.</div>
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
