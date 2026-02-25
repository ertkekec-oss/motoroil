import { prisma } from "@/lib/prisma";
import { CompanyStatus, CompanyType } from "@prisma/client";
import CompanyAdminClient from "./CompanyAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-6 bg-[#F6F7F9] min-h-screen text-slate-800 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F3A5F]">Company Management</h1>
                        <p className="text-sm text-slate-500">Govern platform actors, roles, and access states.</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Company</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">VKN / Tax</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Role / Type</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-center">Status</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {companies.map(comp => (
                                <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-[#1F3A5F]">{comp.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{comp.id}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-xs">
                                        {comp.vkn || "N/A"}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${comp.type === CompanyType.BUYER ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                comp.type === CompanyType.SELLER ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                    "bg-indigo-50 text-indigo-700 border-indigo-100"
                                            }`}>
                                            {comp.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${comp.status === CompanyStatus.ACTIVE ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                            {comp.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <CompanyAdminClient companyId={comp.id} currentStatus={comp.status} currentType={comp.type} />
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
