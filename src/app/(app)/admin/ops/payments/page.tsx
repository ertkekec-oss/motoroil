"use client";

import React, { useState, useEffect } from 'react';
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function PaymentsMonitoringPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/payments');
            const data = await res.json();
            if (data.success) {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnterprisePageShell
            title="Ödeme & İşlem İzleme"
            description="Tüm platformdaki anlık ödeme hareketleri, satın almalar ve webhook statüleri."
        >
            <EnterpriseCard className="p-0 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/10">
                                <tr>
                                    <th className="p-4">Tenant (Müşteri)</th>
                                    <th className="p-4">Ürün Tipi / Gateway</th>
                                    <th className="p-4">Tutar</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4">Sipariş No (Ref)</th>
                                    <th className="p-4 text-right">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {transactions.length > 0 ? transactions.map(trx => (
                                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4 align-middle">
                                            <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate max-w-[200px]">
                                                {trx.tenant?.name || 'Bilinmeyen'}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                                                {trx.tenant?.ownerEmail || trx.tenantId}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                    {trx.productType}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    {trx.gatewayProvider}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="font-black text-[14px]">
                                                {parseFloat(trx.amount).toLocaleString('tr-TR', { style: 'currency', currency: trx.currency })}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className={`inline-flex px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wider border
                                                ${trx.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    trx.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'}
                                            `}>
                                                {trx.status}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <code className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono truncate max-w-[120px] block" title={trx.externalReference}>
                                                {trx.externalReference || '-'}
                                            </code>
                                        </td>
                                        <td className="p-4 text-right align-middle text-[12px] font-medium text-slate-500">
                                            {new Date(trx.createdAt).toLocaleString('tr-TR')}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500 text-[14px]">
                                            Sistemde henüz işlem bulunmamaktadır.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
