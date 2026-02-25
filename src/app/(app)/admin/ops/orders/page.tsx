import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Search, Filter, Download, ArrowUpRight, PackageOpen, RotateCw, Wallet } from 'lucide-react';

function formatDateTR(d: Date | null | undefined) {
    if (!d) return "-";
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "Europe/Istanbul",
        }).format(d);
    } catch {
        return d.toISOString() ?? "-";
    }
}

function formatMoney(amount: any, currency: string) {
    const n = typeof amount === "number" ? amount : Number(amount?.toString?.() ?? 0);
    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency || "TRY",
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `${n.toFixed(2)} ${currency || "TRY"}`;
    }
}

export default async function AdminOrdersMonitorPage({
    searchParams,
}: {
    searchParams?: Promise<{ status?: string, q?: string }>;
}) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin")) {
        redirect("/403");
    }

    const sp = await searchParams || {};
    const statusFilter = sp.status;
    const qStr = sp.q;

    // Build where clause
    const where: any = {};
    if (statusFilter) where.status = statusFilter;
    if (qStr) {
        where.OR = [
            { id: { contains: qStr, mode: 'insensitive' } },
            { buyerCompanyId: { contains: qStr, mode: 'insensitive' } },
            { sellerCompanyId: { contains: qStr, mode: 'insensitive' } }
        ];
    }

    // Fetch Global Orders for Operators (ERP Dense Style)
    const orders = await prisma.networkOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit for dense view
        include: {
            payments: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            shipments: {
                select: { status: true, sequence: true },
                orderBy: { sequence: 'asc' }
            }
        }
    });

    const companyIds = Array.from(new Set(orders.flatMap(o => [o.buyerCompanyId, o.sellerCompanyId])));
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-[#1F3A5F] p-4 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-4">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#1F3A5F]">Orders Monitor</h1>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Global B2B & Escrow Transactions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="h-8 px-3 bg-white border border-slate-300 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 shadow-sm">
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filter Bar (Dense ERP Style) */}
                <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm flex flex-col md:flex-row gap-3 items-end">
                    <div className="w-full md:w-64">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Identifier</label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1.5" />
                            <input
                                type="text"
                                placeholder="Order ID or Company..."
                                defaultValue={qStr}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3A5F] focus:border-[#1F3A5F]"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-48">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Global Status</label>
                        <select
                            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3A5F] focus:border-[#1F3A5F]"
                            defaultValue={statusFilter || ''}
                        >
                            <option value="">All Orders</option>
                            <option value="PENDING_PAYMENT">Pending Payment</option>
                            <option value="PAID">Paid (Awaiting Ship)</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    <div className="w-full md:w-32">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Range</label>
                        <input type="date" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3A5F] focus:border-[#1F3A5F]" />
                    </div>

                    <div className="flex-1"></div>

                    <button className="h-8 px-4 bg-[#1F3A5F] border border-[#1F3A5F] text-white text-xs font-semibold rounded hover:bg-slate-800 shadow-sm flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        Apply Filter
                    </button>
                </div>

                {/* Main Data Table */}
                <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[calc(100vh-210px)]">

                    {/* Fixed Header Tabular Layout perfectly compatible with TanStack/ReactTable mental model */}
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] text-[#1F3A5F] sticky top-0 z-10 box-border border-b border-slate-300 shadow-sm">
                                <tr>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 w-24">Order ID</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 w-36">Created At</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 w-48 truncate">Buyer Company</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 w-48 truncate">Seller Company</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 text-right w-28">Total Amount</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 text-center w-28">P. Status</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 text-center w-36">Shipment</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider border-r border-slate-200 text-center w-32">Escrow</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-center w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {orders.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-8 text-slate-500 font-medium">No records found matching filters.</td></tr>
                                ) : (
                                    orders.map(order => {
                                        const pay = order.payments[0];
                                        const shpCount = order.shipments.length;
                                        const delivCount = order.shipments.filter(s => s.status === 'DELIVERED').length;

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-3 py-2 border-r border-slate-100 font-mono text-slate-600 truncate">
                                                    <Link href={`/admin/ops/orders/${order.id}`} className="hover:underline hover:text-blue-600">
                                                        #{order.id.slice(-6).toUpperCase()}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 font-mono text-slate-500">
                                                    {formatDateTR(order.createdAt)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 font-medium text-slate-800 truncate" title={companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}>
                                                    {companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 font-medium text-slate-800 truncate" title={companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}>
                                                    {companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 font-mono font-bold text-slate-900 text-right">
                                                    {formatMoney(order.totalAmount, order.currency)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border 
                                                    ${pay?.status === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                                        {pay ? pay.status : order.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border 
                                                        ${delivCount > 0 && delivCount === shpCount ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                                shpCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                            {shpCount === 0 ? 'UNSHIPPED' : `${delivCount}/${shpCount} DELIV.`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center">
                                                    {pay?.mode === 'ESCROW' ? (
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border 
                                                        ${pay.payoutStatus === 'RELEASED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                                pay.payoutStatus === 'FAILED' ? 'bg-[#F5A524]/10 border-[#F5A524]/30 text-[#F5A524]' :
                                                                    'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                            {pay.payoutStatus}
                                                        </span>
                                                    ) : <span className="text-slate-400 font-mono text-[10px]">DIRECT</span>}
                                                </td>
                                                <td className="px-3 py-2 text-center text-slate-400 flex items-center justify-center gap-2">
                                                    <button title="View Order" className="hover:text-[#1F3A5F] transition-colors"><ArrowUpRight className="w-4 h-4" /></button>
                                                    <button title="Force Shipment Sync" className="hover:text-indigo-600 transition-colors"><RotateCw className="w-4 h-4" /></button>
                                                    <button title="Open Payout Panel" className="hover:text-emerald-600 transition-colors"><Wallet className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-[#F6F7F9] border-t border-slate-300 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-mono">
                        <span>Viewing {orders.length} records</span>
                        <div className="flex items-center gap-1">
                            <button className="px-2 py-0.5 border border-slate-300 bg-white rounded cursor-not-allowed opacity-50">Prev</button>
                            <button className="px-2 py-0.5 border border-slate-300 bg-white rounded opacity-50 cursor-not-allowed">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
