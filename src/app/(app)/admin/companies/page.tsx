import { prisma } from "@/lib/prisma";
import { CompanyStatus, CompanyType } from "@prisma/client";
import CompanyAdminClient from "./CompanyAdminClient";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="w-full">
            <EnterprisePageShell
            title="Firma Yönetimi"
            description="Platform aktörlerini, rollerini ve erişim durumlarını yönetin."
        >
            <div className="space-y-6">
                

                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                                <tr>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-64">Firma</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-40">VKN / Vergi</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-48">Rol / Tip</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-36">Durum</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] text-center w-40 text-slate-500 dark:text-slate-400">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {companies?.map(comp => (
                                    <tr key={comp.id} className="hover:bg-slate-50 border-b border-transparent hover:border-slate-200 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5">
                                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[250px]">{comp.name}</div>
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 font-bold">#{comp.id.slice(-8).toUpperCase()}</div>
                                        </td>
                                        <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 font-mono font-bold text-[13px]">
                                            {comp.vkn || "BİLİNMİYOR"}
                                        </td>
                                        <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm border ${comp.type === CompanyType.BUYER ? "bg-blue-50 border-blue-200 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400" :
                                                    comp.type === CompanyType.SELLER ? "bg-amber-50 border-amber-200 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400" :
                                                        "bg-indigo-50 border-indigo-200 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
                                                }`}>
                                                {comp.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                            <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded border shadow-sm ${comp.status === CompanyStatus.ACTIVE ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 border-rose-300 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                                                {comp.status === CompanyStatus.ACTIVE ? "AKTİF" : comp.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <CompanyAdminClient companyId={comp.id} currentStatus={comp.status} currentType={comp.type} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </EnterprisePageShell>
        </div>
    );
}
