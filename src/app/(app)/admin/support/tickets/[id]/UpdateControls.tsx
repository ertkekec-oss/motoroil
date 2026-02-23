"use client";

import { useRouter } from 'next/navigation';

export default function UpdateControls({
    ticketId,
    assignedToUserId,
    priority,
    agents,
    STATUS_COLORS,
    STATUS_LABELS,
    currentStatus
}: {
    ticketId: string,
    assignedToUserId: string | null,
    priority: string,
    agents: any[],
    STATUS_COLORS: Record<string, string>,
    STATUS_LABELS: Record<string, string>,
    currentStatus: string
}) {
    const router = useRouter();

    const handleUpdate = async (data: any) => {
        try {
            await fetch(`/api/admin/tickets/${ticketId}/update`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            router.refresh();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-widest">Talep Durumu</span>
                <span className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border inline-block ${STATUS_COLORS[currentStatus]}`}>
                    {STATUS_LABELS[currentStatus]}
                </span>
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-widest">Atanan Temsilci</span>
                <select
                    defaultValue={assignedToUserId || ''}
                    className="w-full bg-slate-50 border border-slate-200 p-3 text-sm text-slate-900 rounded-xl outline-none focus:border-orange-500/50 font-medium transition-colors"
                    onChange={(e) => handleUpdate({ assignedToUserId: e.target.value || null })}
                >
                    <option value="">Atanmamış</option>
                    {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name || a.email}</option>
                    ))}
                </select>
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-widest">Öncelik</span>
                <select
                    defaultValue={priority}
                    className="w-full bg-slate-50 border border-slate-200 p-3 text-sm text-slate-900 rounded-xl outline-none focus:border-orange-500/50 font-medium transition-colors"
                    onChange={(e) => handleUpdate({ priority: e.target.value })}
                >
                    <option value="P1_URGENT">P1 - Acil</option>
                    <option value="P2_HIGH">P2 - Yüksek</option>
                    <option value="P3_NORMAL">P3 - Normal</option>
                    <option value="P4_LOW">P4 - Düşük</option>
                </select>
            </div>
        </div>
    );
}
