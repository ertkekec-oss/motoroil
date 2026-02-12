"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    RefreshCw,
    Unlock,
    Activity,
    BarChart3
} from "lucide-react";
import { toast } from "sonner";

export function MarketplaceOpsPanel() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin/marketplace/ops");
            const json = await res.json();
            setData(json);
        } catch (err) {
            toast.error("Ops verileri yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (auditId: string, action: "RETRY" | "UNLOCK") => {
        setProcessingId(auditId);
        try {
            const res = await fetch("/api/admin/marketplace/ops", {
                method: "POST",
                body: JSON.stringify({ auditId, action })
            });
            const resData = await res.json();
            if (resData.success) {
                toast.success(resData.message);
                fetchData();
            } else {
                throw new Error(resData.error);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && !data) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="text-indigo-600" /> Pazaryeri Operasyon Paneli
                </h2>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Yenile
                </Button>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="text-sm text-amber-800">
                    <p className="font-bold">⚠️ Sistem Operasyon Paneli</p>
                    <p>Bu ekran son kullanıcılar için değildir. Sadece kuyruk (backlog) izleme, tıkalı (stuck) işlemleri kurtarma ve hata analizi içindir. Kullanıcılar aksiyonlarını doğrudan Sipariş Listesi üzerinden gerçekleştirmelidir.</p>
                </div>
            </div>

            {/* Queue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Bekleyen (Waiting)", value: data?.stats?.waiting, color: "text-blue-600" },
                    { label: "Aktif (Active)", value: data?.stats?.active, color: "text-amber-600" },
                    { label: "Hatalı (Failed)", value: data?.stats?.failed, color: "text-red-600" },
                    { label: "Tamamlanan (Done)", value: data?.stats?.completed, color: "text-green-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                        <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Audits Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-700">Son İşlemler (Audit Trail)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="p-4">Zaman</th>
                                <th className="p-4">Firma</th>
                                <th className="p-4">İşlem</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4">Hata / Detay</th>
                                <th className="p-4 text-right">Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.audits?.map((audit: any) => (
                                <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-500 whitespace-nowrap">
                                        {new Date(audit.createdAt).toLocaleString("tr-TR")}
                                    </td>
                                    <td className="p-4 font-medium text-slate-700">{audit.companyId.substring(0, 8)}...</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                                            {audit.actionKey}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {audit.status === "SUCCESS" && (
                                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                                <CheckCircle2 className="h-4 w-4" /> Başarılı
                                            </span>
                                        )}
                                        {audit.status === "PENDING" && (
                                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                                                <Clock className="h-4 w-4 animate-pulse" /> Hazırlanıyor
                                            </span>
                                        )}
                                        {audit.status === "FAILED" && (
                                            <span className="flex items-center gap-1 text-red-600 font-medium">
                                                <AlertTriangle className="h-4 w-4" /> Hatalı
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-500 max-w-xs truncate">
                                        {audit.errorMessage || "-"}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {audit.status === "FAILED" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAction(audit.id, "RETRY")}
                                                disabled={processingId === audit.id}
                                            >
                                                {processingId === audit.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />} Tekrar Dene
                                            </Button>
                                        )}
                                        {audit.status === "PENDING" && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleAction(audit.id, "UNLOCK")}
                                                disabled={processingId === audit.id}
                                            >
                                                <Unlock className="h-3 w-3 mr-1" /> Kilidi Kaldır
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
