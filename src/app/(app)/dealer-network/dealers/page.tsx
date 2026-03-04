"use client";

import React, { useState, useEffect } from "react";
import { EnterpriseCard, EnterpriseTable } from "@/components/ui/enterprise";

export default function DealersPage() {
    const [dealers, setDealers] = useState([]);

    useEffect(() => {
        // Fetch dealers
        fetch("/api/dealer-network/dealers")
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setDealers(data.data);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const headers = ["Bayi Adı", "Vergi No", "Durum", "Kredi Limiti"];

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Bayiler</h1>
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                    Bayi Davet Et
                </button>
            </div>
            <EnterpriseCard>
                <div className="p-5 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Kayıtlı Bayiler</h3>
                </div>
                <EnterpriseTable headers={headers}>
                    {dealers.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-4 text-center text-sm text-slate-500">
                                Henüz bayi bulunmuyor.
                            </td>
                        </tr>
                    ) : (
                        dealers.map((dealer: any, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <td className="p-4 text-sm font-medium text-slate-900">{dealer.dealerName}</td>
                                <td className="p-4 text-sm text-slate-600">{dealer.taxNumber}</td>
                                <td className="p-4 text-sm text-slate-600">{dealer.status}</td>
                                <td className="p-4 text-sm font-medium text-slate-900">{dealer.creditLimit}</td>
                            </tr>
                        ))
                    )}
                </EnterpriseTable>
            </EnterpriseCard>
        </div>
    );
}
