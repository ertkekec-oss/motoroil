import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkflowTaskStatus, WorkflowTaskType, WorkflowTaskPriority } from "@prisma/client";
import Link from "next/link";

export default async function AdminTasksPage({ searchParams }: { searchParams: Promise<{ tenantId?: string, type?: string, status?: string }> }) {
    const session: any = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "PLATFORM_ADMIN")) return notFound();

    const { tenantId, type, status } = await searchParams;

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (type) where.type = type;
    if (status) where.status = status;

    const tasks = await prisma.workflowTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100
    });

    return (
        <div className="flex flex-col flex-1 p-8 text-slate-900 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Sistem Görev Merkezi (Global)</h1>
                    <p className="text-sm text-slate-500 mt-1">Tenant'larda oluşan kritik hata ve operasyon görevlerini (OTP, Mail vb.) buradan izleyebilirsiniz.</p>
                </div>

                <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50">
                        <form method="GET" className="flex gap-4 items-center">
                            <input name="tenantId" defaultValue={tenantId || ''} placeholder="Tenant ID (Opsiyonel)" className="h-9 px-3 rounded-lg border border-slate-200 bg-white" />
                            <select name="type" defaultValue={type || ''} className="h-9 px-3 rounded-lg border border-slate-200 bg-white">
                                <option value="">Tüm Tipler</option>
                                {Object.values(WorkflowTaskType).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <select name="status" defaultValue={status || ''} className="h-9 px-3 rounded-lg border border-slate-200 bg-white">
                                <option value="">Tüm Durumlar</option>
                                <option value="OPEN">Açık</option>
                                <option value="IN_PROGRESS">Devam Ediyor</option>
                                <option value="COMPLETED">Tamamlandı</option>
                                <option value="CANCELLED">İptal</option>
                            </select>
                            <button className="h-9 px-5 bg-slate-900 text-white font-bold rounded-lg shadow-sm">Filtrele</button>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tenant & Tarih</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tür / Öncelik</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Başlık & Detay</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tasks.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Görev bulunamadı.</td></tr>
                                ) : tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs font-bold text-blue-600 mb-1">{task.tenantId}</div>
                                            <div className="text-xs text-slate-500">{new Date(task.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded inline-block mb-1">{task.type}</div>
                                            <div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{task.title}</div>
                                            <div className="text-xs text-slate-600 mt-1 max-w-lg truncate">{task.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                task.status === 'OPEN' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
