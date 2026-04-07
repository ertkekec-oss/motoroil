import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {  Check, Info  } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import ManualSyncButton from "./ManualSyncButton";

function formatDateTR(d: Date | null | undefined) {
    if (!d) return "-";
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Istanbul",
        }).format(d);
    } catch {
        return d.toISOString() ?? "-";
    }
}

export default async function ShipmentsMonitorPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER")) {
        redirect("/403");
    }

    // Main Shipment Query Dense Profile
    const shipments = await prisma.shipment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            order: {
                select: {
                    id: true,
                    buyerCompanyId: true,
                    sellerCompanyId: true,
                }
            },
            events: {
                orderBy: { occurredAt: 'desc' },
                take: 1
            },
            _count: {
                select: { events: true } // Acts as inbox count
            }
        }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Summary Analytics
    const activeCount = await prisma.shipment.count({
        where: { status: { in: ['LABEL_CREATED', 'IN_TRANSIT'] } }
    });

    const deliveredTodayCount = await prisma.shipment.count({
        where: {
            status: 'DELIVERED',
            updatedAt: { gte: startOfToday }
        }
    });

    const failedCount = await prisma.shipment.count({
        where: { status: 'EXCEPTION' }
    });

    // An approximation for Awaiting Sync; e.g. active but last event was very old. Or simple inbox comparison. We will keep it simple.
    const awaitingSyncCount = activeCount; // Technically all active are awaiting the next sync

    return (
        <EnterprisePageShell
            title="Yönetim"
            description="Sistem detaylarını yapılandırın"
        >
            <div className="animate-in fade-in duration-300">
                <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <span className="p-2 bg-indigo-100 dark:bg-emerald-500/10 rounded-lg">📦</span>
                            Kargo Operasyonları Merkezi (Ops)
                        </h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 ml-14">Lojistik Çekirdek, Inbox Analitiği ve Teslimat Notları</p>
                    </div>
                </div>

                {/* Top Summary Bar - KPI Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Aktif Kargolar</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{activeCount}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all"></div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2 relative z-10">Bugün Teslim Edilen</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono relative z-10">{deliveredTodayCount}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Hatalı İşlemler</span>
                        <span className={`text-2xl font-black font-mono flex items-center self-start ${failedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{failedCount}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Senkronizasyon Bekleyen</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{awaitingSyncCount}</span>
                    </div>
                </div>

                {/* Main Table Wrapper */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-sm h-[calc(100vh-250px)]">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                                <tr>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-28">Kargo ID</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-28">Sipariş ID</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-20">Sıra</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-32">Kargo Firması</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-48">Takip No</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-36">Durum</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-56 truncate">Son Olay</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-24">Inbox Sayısı</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-36">Teslimat Notu</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-40">Oluşturulma</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] w-48 text-center text-slate-500 dark:text-slate-400">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {shipments.length === 0 ? (
                                    <tr><td colSpan={11} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest">Kayıt Bulunamadı.</td></tr>
                                ) : (
                                    shipments?.map(shp => {
                                        const latestEventObj = shp.events[0];
                                        const inboxCount = shp._count.events;

                                        const statusColor =
                                            shp.status === 'DELIVERED' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                shp.status === 'IN_TRANSIT' ? 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400' :
                                                    shp.status === 'EXCEPTION' ? 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400' :
                                                        'border-slate-300 text-slate-700 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

                                        return (
                                            <tr key={shp.id} className="hover:bg-slate-50 border-b border-transparent hover:border-slate-200 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-slate-600 dark:text-slate-400 truncate text-[11px] font-bold">
                                                    #{shp.id.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-slate-600 dark:text-slate-400 truncate text-[11px] font-bold">
                                                    <Link href={`/admin/ops/orders/${shp.networkOrderId}`} className="hover:underline hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors">
                                                        #{shp.networkOrderId.slice(-8).toUpperCase()}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white text-center text-[13px]">
                                                    {shp.sequence}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-bold text-slate-800 dark:text-slate-200 text-xs truncate uppercase tracking-tight">
                                                    {shp.carrierCode}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-[13px] font-black text-slate-900 dark:text-white">
                                                    {shp.trackingNumber || 'BEKLİYOR'}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black border tracking-widest uppercase shadow-sm ${statusColor}`}>
                                                        {shp.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={latestEventObj?.status || 'No events'}>
                                                    {latestEventObj ? <span className="font-bold">{latestEventObj.status} - <span className="font-medium opacity-80">{latestEventObj.description || 'N/A'}</span></span> : <span className="text-slate-400 dark:text-slate-500 font-medium italic">Henüz olay yok</span>}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center font-mono font-black text-slate-900 dark:text-white text-[13px]">
                                                    {inboxCount}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    {shp.deliveryNoteUuid ? (
                                                        <span className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                                            {shp.deliveryNoteUuid.substring(0, 6)}... <Check className="w-3.5 h-3.5" />
                                                        </span>
                                                    ) : <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                                                    {formatDateTR(shp.createdAt)}
                                                </td>
                                                <td className="px-5 py-4 text-center align-middle flex gap-2.5 justify-center">
                                                    <ManualSyncButton shipmentId={shp.id} disabled={shp.status === 'DELIVERED'} />
                                                    <Link
                                                        href={`/admin/ops/shipments/${shp.id}`}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black tracking-widest rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors uppercase shadow-sm bg-white dark:bg-transparent"
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                        ZAMANTÜNELİ
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}