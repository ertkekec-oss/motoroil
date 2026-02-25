import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ForceReleaseButton from "./ForceReleaseButton";

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

export default async function PaymentsMonitorPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin")) {
        redirect("/403");
    }

    // Data Source
    const payments = await prisma.networkPayment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
            order: true
        }
    });

    const companyIds = Array.from(new Set(payments.map(p => p.order).flatMap(o => o ? [o.buyerCompanyId, o.sellerCompanyId] : [])));
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // KPIs
    const totalPendingAgg = await prisma.networkPayment.aggregate({
        _sum: { amount: true },
        where: {
            mode: 'ESCROW',
            status: 'PAID',
            payoutStatus: { not: 'RELEASED' }
        }
    });
    const totalPendingEscrow = Number(totalPendingAgg._sum.amount || 0);

    const failedCount = await prisma.networkPayment.count({
        where: { payoutStatus: 'FAILED' }
    });

    const releasedTodayAgg = await prisma.networkPayment.aggregate({
        _sum: { amount: true },
        where: {
            payoutStatus: 'RELEASED',
            releasedAt: { gte: startOfToday }
        }
    });
    const releasedToday = Number(releasedTodayAgg._sum.amount || 0);

    const commissionTodayAgg = await prisma.platformCommissionLedger.aggregate({
        _sum: { amount: true },
        where: {
            createdAt: { gte: startOfToday }
        }
    });
    const commissionToday = Number(commissionTodayAgg._sum.amount || 0);

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-800 p-4 font-sans focus:outline-none">
            <div className="max-w-[1600px] mx-auto space-y-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Payments & Escrow Control Desk</h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Finance Audit, Ledger Reconciliation & Force Actions</p>
                </div>

                {/* Top Summary Bar - KPI Blocks (No Shadows, Strict Borders) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Total Pending Escrow</span>
                        <span className="text-xl font-bold text-slate-900 font-mono">{formatMoney(totalPendingEscrow, "TRY")}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Failed Payout Count</span>
                        <span className={`text-xl font-bold font-mono ${failedCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{failedCount}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Released Today</span>
                        <span className="text-xl font-bold text-emerald-600 font-mono">{formatMoney(releasedToday, "TRY")}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide mb-1">Platform Comm. Today</span>
                        <span className="text-xl font-bold text-slate-900 font-mono">{formatMoney(commissionToday, "TRY")}</span>
                    </div>
                </div>

                {/* Main Table Wrapper */}
                <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] text-slate-600 sticky top-0 z-10 border-b border-slate-300">
                                <tr>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-24">Order ID</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-40 truncate">Buyer Company</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-40 truncate">Seller Company</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-right w-28">Total Amount</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-24">Provider</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-28">P. Status</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-center w-28">Escrow Status</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 w-36">Released At</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-right w-28">Seller Earned</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] border-r border-slate-200 text-right w-28">Platform Comm.</th>
                                    <th className="px-3 py-2.5 font-bold uppercase tracking-wide text-[10px] w-28 text-center bg-[#F6F7F9]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {payments.length === 0 ? (
                                    <tr><td colSpan={11} className="px-3 py-8 text-center text-slate-400 font-medium">No payment records found.</td></tr>
                                ) : (
                                    payments.map(payment => {
                                        const order = payment.order;
                                        const sellerEarned = Number(order.subtotalAmount) - Number(order.commissionAmount);

                                        const paymentStatusColor =
                                            payment.status === 'PAID' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                payment.status === 'FAILED' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                    'border-slate-200 text-slate-700 bg-slate-50';

                                        const escrowStatusColor =
                                            payment.payoutStatus === 'RELEASED' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                                payment.payoutStatus === 'FAILED' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                    'border-slate-200 text-slate-700 bg-slate-50';

                                        return (
                                            <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono text-slate-600 truncate text-[11px] font-semibold">
                                                    #{payment.networkOrderId.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-medium text-slate-800 truncate" title={companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}>
                                                    {companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-medium text-slate-800 truncate" title={companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}>
                                                    {companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono font-bold text-slate-900 text-right">
                                                    {formatMoney(order.totalAmount, order.currency)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center text-slate-600 text-xs">
                                                    {payment.provider} <span className="text-[10px] text-slate-400">({payment.mode})</span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${paymentStatusColor}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${escrowStatusColor}`}>
                                                        {payment.payoutStatus || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono text-slate-500 text-[11px]">
                                                    {formatDateTR(payment.releasedAt)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono font-semibold text-emerald-700 text-right">
                                                    {formatMoney(sellerEarned, order.currency)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-200 font-mono font-semibold text-slate-900 text-right">
                                                    {formatMoney(order.commissionAmount, order.currency)}
                                                </td>
                                                <td className="px-3 py-2 text-center align-middle">
                                                    {payment.payoutStatus === 'FAILED' ? (
                                                        <ForceReleaseButton orderId={payment.networkOrderId} />
                                                    ) : payment.payoutStatus === 'RELEASED' ? (
                                                        <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider">-</span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[10px] uppercase font-semibold">PENDING</span>
                                                    )}
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
