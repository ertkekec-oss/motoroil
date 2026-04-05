import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TasksFilter from "./TasksFilter";

export default async function TaskListPage({ searchParams }: { searchParams: Promise<{ status?: string, priority?: string, type?: string }> }) {
    const session: any = await getSession();
    if (!session || !session.tenantId) return notFound();

    try {
        const { status, priority, type } = await searchParams;

        const where: any = { tenantId: session.tenantId };
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (type) where.type = type;

        const tasks = await prisma.workflowTask.findMany({
            where,
            orderBy: { createdAt: "desc" }
        });

        const statusColors: any = {
            OPEN: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
            IN_PROGRESS: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
            COMPLETED: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30',
            CANCELLED: 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
        };

        const priorityIcons: any = {
            LOW: '🔽',
            MEDIUM: '▶️',
            HIGH: '🔼',
            CRITICAL: '🚨'
        };

        return (
            <div className="flex flex-col flex-1 p-8 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#0f172a] min-h-screen">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">İş Akışı Görevleri</h1>
                        <p className="text-sm text-slate-500 mt-1">Sistem olaylarından otomatik oluşturulan görevleri buradan takip edebilirsiniz.</p>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-8">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-[#0f172a]">
                            <TasksFilter initialStatus={status} initialPriority={priority} initialType={type} />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Görev Başlığı</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tür / Öncelik</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Durum</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Atanan</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tarih</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {tasks.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Görev bulunamadı.</td></tr>
                                    ) : tasks.map((task: any) => (
                                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold">{task.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-sm">{task.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">{task.type}</div>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <span>{priorityIcons[task.priority]}</span>
                                                    <span>{task.priority}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${statusColors[task.status]}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {!task.assigneeId ? (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-bold uppercase tracking-widest">Boşta</span>
                                                ) : task.assigneeId === (session.user?.id || session.id) ? (
                                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-bold uppercase tracking-widest">Bana Atalı</span>
                                                ) : (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold uppercase tracking-widest" title={task.assigneeId}>Yetkili</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(task.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/tasks/${task.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">İncele →</Link>
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
    } catch (error: any) {
        return (
            <div className="p-8 text-red-500">
                <h1 className="text-2xl font-bold mb-4">Görevler Yüklenemedi</h1>
                <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm border border-red-200 dark:border-red-800 break-words whitespace-pre-wrap">
                    {error.message || String(error)}
                </pre>
            </div>
        );
    }
}
