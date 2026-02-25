import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, Info } from 'lucide-react';
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

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin")) {
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
        <div className="min-h-screen bg-[#F6F7F9] text-slate-800 p-4 font-sans focus:outline-none">
            <div className="max-w-[1600px] mx-auto space-y-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Shipment Operations Monitor</h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Logistics Core, Inbox Analytics & Delivery Notes</p>
                </div>

                {/* Top Summary Bar - KPI Blocks (Flat bordered blocks) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Active Shipments</span>
                        <span className="text-xl font-bold text-slate-900 font-mono">{activeCount}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Delivered Today</span>
                        <span className="text-xl font-bold text-emerald-600 font-mono">{deliveredTodayCount}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Failed Transport</span>
                        <span className={`text-xl font-bold font-mono ${failedCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{failedCount}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Awaiting Sync Loop</span>
                        <span className="text-xl font-bold text-slate-900 font-mono">{awaitingSyncCount}</span>
                    </div>
                </div>

                {/* Main Table Wrapper */}
                <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] text-slate-600 sticky top-0 z-10 border-b border-slate-300">
                                <tr>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-24">Shipment ID</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-24">Order ID</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-20">Seq</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-28">Carrier</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-40">Tracking No</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-28">Status</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-48 truncate">Last Event</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-24">Inbox Cnt</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-32">Delivery Note</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-36">Created At</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] w-48 text-center bg-[#F6F7F9]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {shipments.length === 0 ? (
                                    <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-400 font-medium">No shipment records found.</td></tr>
                                ) : (
                                    shipments.map(shp => {
                                        const latestEventObj = shp.events[0];
                                        const inboxCount = shp._count.events;

                                        const statusColor =
                                            shp.status === 'DELIVERED' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                shp.status === 'IN_TRANSIT' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                                    shp.status === 'EXCEPTION' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                        'border-slate-200 text-slate-700 bg-slate-50';

                                        return (
                                            <tr key={shp.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono text-slate-600 truncate text-[11px] font-semibold">
                                                    #{shp.id.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono text-slate-600 truncate text-[11px]">
                                                    <Link href={`/admin/ops/orders/${shp.networkOrderId}`} className="hover:underline hover:text-blue-600">
                                                        #{shp.networkOrderId.slice(-8).toUpperCase()}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono font-bold text-slate-900 text-center">
                                                    {shp.sequence}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-slate-700 font-medium truncate">
                                                    {shp.carrierCode}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono text-sm font-semibold text-slate-800">
                                                    {shp.trackingNumber || 'PENDING'}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase shadow-sm ${statusColor}`}>
                                                        {shp.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-[11px] text-slate-600 truncate max-w-[200px]" title={latestEventObj?.status || 'No events'}>
                                                    {latestEventObj ? `${latestEventObj.status} - ${latestEventObj.description || 'N/A'}` : <span className="text-slate-400 italic">No events yet</span>}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-semibold text-slate-700">
                                                    {inboxCount}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center">
                                                    {shp.deliveryNoteUuid ? (
                                                        <span className="flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-bold">
                                                            {shp.deliveryNoteUuid.substring(0, 6)}... <Check className="w-3 h-3" />
                                                        </span>
                                                    ) : <span className="text-slate-300 font-mono">—</span>}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono text-slate-500 text-[11px]">
                                                    {formatDateTR(shp.createdAt)}
                                                </td>
                                                <td className="px-3 py-2 text-center align-middle flex gap-2 justify-center">
                                                    <ManualSyncButton shipmentId={shp.id} disabled={shp.status === 'DELIVERED'} />
                                                    <Link
                                                        href={`/admin/ops/shipments/${shp.id}`}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors uppercase"
                                                    >
                                                        <Info className="w-3 h-3" />
                                                        Timeline
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
        </div>
    );
}
