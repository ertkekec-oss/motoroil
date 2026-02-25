"use client";

import { useTransition } from "react";
import { updateCompanyStatusAction, updateCompanyTypeAction } from "@/actions/adminGovernanceActions";
import { CompanyStatus, CompanyType } from "@prisma/client";

export default function CompanyAdminClient({ companyId, currentStatus, currentType }: { companyId: string; currentStatus: CompanyStatus; currentType: CompanyType }) {
    const [isPending, startTransition] = useTransition();

    const toggleStatus = () => {
        const nextStatus = currentStatus === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE;
        if (!confirm(`Change status to ${nextStatus}?`)) return;
        startTransition(async () => {
            await updateCompanyStatusAction(companyId, nextStatus);
        });
    };

    const changeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextType = e.target.value as CompanyType;
        startTransition(async () => {
            await updateCompanyTypeAction(companyId, nextType);
        });
    };

    return (
        <div className="flex justify-end items-center gap-3">
            <select
                value={currentType}
                onChange={changeType}
                disabled={isPending}
                className="text-xs p-1 border rounded bg-white outline-none focus:ring-1 focus:ring-slate-400"
            >
                <option value={CompanyType.BUYER}>BUYER</option>
                <option value={CompanyType.SELLER}>SELLER</option>
                <option value={CompanyType.BOTH}>BOTH</option>
            </select>
            <button
                onClick={toggleStatus}
                disabled={isPending}
                className={`px-3 py-1 rounded text-xs font-bold transition-transform shadow-sm active:scale-95 ${currentStatus === CompanyStatus.ACTIVE ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
            >
                {isPending ? "..." : (currentStatus === CompanyStatus.ACTIVE ? "Suspend" : "Activate")}
            </button>
        </div>
    );
}
