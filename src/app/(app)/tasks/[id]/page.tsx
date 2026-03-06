import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { updateWorkflowTaskStatus, assignWorkflowTask } from "@/services/workflow/tasks";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session: any = await getSession();
    if (!session || !session.tenantId) return notFound();

    const { id } = await params;
    const task = await prisma.workflowTask.findUnique({
        where: { id, tenantId: session.tenantId }
    });

    if (!task) return notFound();

    // Server Actions
    const handleStatusUpdate = async (formData: FormData) => {
        "use server";
        const newStatus = formData.get("status") as any;
        await updateWorkflowTaskStatus(task.id, newStatus);
        redirect(`/tasks/${task.id}`);
    };

    const handleAssignToMe = async () => {
        "use server";
        await assignWorkflowTask(task.id, session.user.id || session.id);
        redirect(`/tasks/${task.id}`);
    };

    const statusColors: any = {
        OPEN: 'text-amber-700 bg-amber-100',
        IN_PROGRESS: 'text-blue-700 bg-blue-100',
        COMPLETED: 'text-emerald-700 bg-emerald-100',
        CANCELLED: 'text-slate-700 bg-slate-100'
    };

    return (
        <div className="flex flex-col flex-1 p-8 text-slate-900 dark:text-white bg-slate-50 dark:bg-[#0f172a] min-h-screen">
            <div className="max-w-4xl mx-auto w-full">
                <Link href="/tasks" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-6 inline-flex items-center gap-2">
                    ← Görev Listesine Dön
                </Link>

                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-[#0f172a]">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-black text-slate-500 tracking-widest uppercase">
                                    {task.type}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusColors[task.status]}`}>
                                    {task.status}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold">
                                    {task.priority} ÖNCELİK
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
                                {task.title}
                            </h1>
                            <div className="text-sm text-slate-500 mt-2">
                                Oluşturulma: {new Date(task.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                                <form action={handleStatusUpdate}>
                                    <input type="hidden" name="status" value="COMPLETED" />
                                    <button className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                                        ✓ Tamamla
                                    </button>
                                </form>
                            )}
                            {task.status === 'OPEN' && (
                                <form action={handleStatusUpdate}>
                                    <input type="hidden" name="status" value="IN_PROGRESS" />
                                    <button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                                        ▶️ Çalışmaya Başla
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                Görev Açıklaması
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {task.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    Atama Bilgileri
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <span className="text-sm text-slate-500 font-medium">Atanan Kişi</span>
                                        {task.assigneeId ? (
                                            <div className="flex items-center gap-2">
                                                {task.assigneeId === (session.user?.id || session.id) ? (
                                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded font-bold uppercase tracking-widest">BANA ATALI</span>
                                                ) : (
                                                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 px-2 py-1 rounded font-bold uppercase tracking-widest" title={task.assigneeId}>YETKİLİ ({task.assigneeId.substring(0, 6)}...)</span>
                                                )}
                                            </div>
                                        ) : (
                                            <form action={handleAssignToMe}>
                                                <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Üstlen (Bana Ata)</button>
                                            </form>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <span className="text-sm text-slate-500 font-medium">Bitiş Tarihi</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {task.relatedEntityType && task.relatedEntityId && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                        İlgili Kayıt
                                    </h3>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{task.relatedEntityType}</div>
                                        <div className="text-sm font-medium font-mono text-slate-700 dark:text-slate-300 break-all mb-3">{task.relatedEntityId}</div>

                                        {task.relatedEntityType === 'Reconciliation' && (
                                            <Link href={`/reconciliation/${task.relatedEntityId}`} className="text-sm font-bold text-blue-600 hover:underline">
                                                Mutabakata Git →
                                            </Link>
                                        )}
                                        {task.relatedEntityType.includes('Signature') && (
                                            <Link href={`/signatures/envelopes/${task.relatedEntityId}`} className="text-sm font-bold text-blue-600 hover:underline">
                                                Zarfa Git →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
