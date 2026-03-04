"use client";

import React, { useState, useEffect } from "react";
import EnterpriseCard from "@/components/enterprise/EnterpriseCard";
import EnterpriseTable from "@/components/enterprise/EnterpriseTable";

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

    const columns = [
        { key: "dealerName", label: "Bayi Adı" },
        { key: "taxNumber", label: "Vergi No" },
        { key: "status", label: "Durum" },
        { key: "creditLimit", label: "Kredi Limiti" },
    ];

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Bayiler</h1>
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                    Bayi Davet Et
                </button>
            </div>
            <EnterpriseCard>
                <EnterpriseTable
                    columns={columns}
                    data={dealers}
                    emptyMessage="Henüz bayi bulunmuyor."
                />
            </EnterpriseCard>
        </div>
    );
}
