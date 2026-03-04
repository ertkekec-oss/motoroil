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
        >
            <EnterpriseCard noPadding>
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center bg-slate-50 dark:bg-slate-900 rounded-t-xl">
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

                <EnterpriseTable headers={headers}>
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-sm text-slate-500 font-medium">Yükleniyor...</td>
                        </tr>
                    ) : orders.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-sm text-slate-500 font-medium">Bu kriterlere uygun sipariş bulunamadı.</td>
                        </tr>
                    ) : (
                        orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 align-middle">
                                    <div className="font-semibold text-slate-900 dark:text-white text-xs">{order.orderNumber}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.id.slice(-8)}</div>
                                </td>
                                <td className="p-4 align-middle">
                                    <div className="font-medium text-slate-700 dark:text-slate-200 text-sm">{order.supplier?.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">ID: {order.supplier?.id}</div>
                                </td>
                                <td className="p-4 align-middle">
                                    <div className="font-medium text-slate-700 dark:text-slate-200 text-sm">{order.customerName}</div>
                                    {order.isLimitExceeded && (
                                        <div className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> LİMİT AŞIMI</div>
                                    )}
                                </td>
                                <td className="p-4 align-middle text-sm text-slate-600 dark:text-slate-300">
                                    {format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: order.currency }).format(order.totalAmount)}
                                    </div>
                                </td>
                                <td className="p-4 align-middle">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <EnterpriseButton variant="secondary" onClick={() => openAuditDrawer(order.id)}>
                                        <History className="w-4 h-4" />
                                        İncele
                                    </EnterpriseButton>
                                </td>
                            </tr>
                        ))
                    )}
                </EnterpriseTable>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 tracking-wide font-medium">
                    Toplam Eşleşme: {totalVisible} sipariş
                </div>
            </EnterpriseCard>

            {/* Audit Drawer Overlay */}
            {selectedOrderId && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />

                    <div className="relative w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
                        {drawerLoading ? (
                            <div className="flex-1 flex items-center justify-center text-sm font-semibold text-slate-500">
                                Kayıtlar Çekiliyor...
                            </div>
                        ) : drawerData?.order ? (
                            <>
                                {/* Drawer Header */}
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                                            Sipariş Audit Detayı
                                        </h2>
                                        <div className="text-xs font-mono text-slate-500">{drawerData.order.orderNumber}</div>
                                    </div>
                                    <button onClick={closeDrawer} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                {/* Drawer Body */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tedarikçi</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{drawerData.order.supplier?.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri (Bayi)</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{drawerData.order.customerName}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sipariş Tutarı</div>
                                                <div className="font-bold text-slate-900 dark:text-white text-base">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: drawerData.order.currency }).format(drawerData.order.totalAmount)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Güncel Durum</div>
                                                <StatusBadge status={drawerData.order.status} />
                                            </div>
                                            {drawerData.order.isLimitExceeded && (
                                                <div className="col-span-2 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-3 mt-2">
                                                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                                                    <div>
                                                        <div className="text-xs font-bold text-rose-800 uppercase">Limit Aşımı Tespit Edildi</div>
                                                        <div className="text-[11px] text-rose-600 mt-0.5">
                                                            Aşılan Tutar: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(drawerData.order.creditExceededAmount || 0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Sistem Timeline Logs
                                        </h3>

                                        <div className="space-y-4">
                                            {drawerData.audit?.length > 0 ? (
                                                drawerData.audit.map((log: any, idx: number) => (
                                                    <div key={log.id} className="flex gap-4 group">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-900 dark:group-hover:bg-slate-100 transition-colors mt-1.5" />
                                                            {idx !== drawerData.audit.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-slate-800 my-1" />}
                                                        </div>
                                                        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="font-bold text-[13px] text-slate-900 dark:text-white">{log.action}</div>
                                                                <div className="text-[11px] text-slate-400 whitespace-nowrap ml-4">
                                                                    {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")}
                                                                </div>
                                                            </div>
                                                            {log.details && <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">{log.details}</div>}
                                                            <div className="text-[10px] text-slate-400 bg-white dark:bg-slate-950 px-2.5 py-1 rounded inline-block border border-slate-200 dark:border-slate-800">
                                                                Actor: {log.userName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-sm text-slate-500 text-center py-6">Audit log bulunamadı.</div>
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
