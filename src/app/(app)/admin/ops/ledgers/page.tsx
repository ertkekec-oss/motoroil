import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ForceReleaseLedgerButton from "./ForceReleaseLedgerButton";
import { Search, Filter, HardDrive, ReceiptText, Banknote, ShieldAlert, BadgeInfo } from 'lucide-react';

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

export default async function LedgersAuditPage({
    searchParams,
}: {
    searchParams?: Promise<{ st?: string, pr?: string, ps?: string, q?: string }>;
}) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin")) {
        redirect("/403");
    }

    const sp = await searchParams || {};
    const { st, pr, ps, q } = sp;

    // Filters to Prisma WHERE
    const whereRules: any = {};
    if (st && st !== 'ALL') whereRules.status = st;
    if (q) {
        whereRules.OR = [
            { id: { contains: q, mode: 'insensitive' } },
            { buyerCompanyId: { contains: q, mode: 'insensitive' } },
            { sellerCompanyId: { contains: q, mode: 'insensitive' } },
        ];
    }

    // Payments filtering
    const paymentFilters: any = {};
    if (pr && pr !== 'ALL') paymentFilters.provider = pr;
    if (ps && ps !== 'ALL') paymentFilters.payoutStatus = ps;

    // Core Audit Query - Orders with Payments & Ledgers Embedded
    const ordersWithLedgers = await prisma.networkOrder.findMany({
        where: whereRules,
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
            id: true,
            buyerCompanyId: true,
            sellerCompanyId: true,
            status: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
            confirmedAt: true,
            payments: {
                where: Object.keys(paymentFilters).length > 0 ? paymentFilters : undefined,
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    id: true,
                    provider: true,
                    mode: true,
                    status: true,
                    amount: true,
                    payoutStatus: true,
                    paidAt: true,
                    releasedAt: true,
                    payoutEvents: {
                        orderBy: { receivedAt: 'desc' },
                        take: 1,
                        select: { status: true, errorMessage: true }
                    }
                }
            },
            sellerLedgers: {
                select: { id: true, type: true }
            },
            commissionLedgers: {
                select: { id: true }
            }
        }
    });

    const companyIds = Array.from(new Set(ordersWithLedgers.flatMap(o => [o.buyerCompanyId, o.sellerCompanyId])));
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    // Strip out orders that don't match the payment filter (if active)
    const displayOrders = Object.keys(paymentFilters).length > 0
        ? ordersWithLedgers.filter(o => o.payments.length > 0)
        : ordersWithLedgers;

    // Fast KPIs with aggregates
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const paidOrders24h = await prisma.networkPayment.count({
        where: { status: 'PAID', paidAt: { gte: last24h } }
    });

    const escrowReleased24hAgg = await prisma.networkPayment.aggregate({
        _sum: { amount: true },
        where: { payoutStatus: 'RELEASED', releasedAt: { gte: last24h } }
    });

    const pendingReleasesAgg = await prisma.networkPayment.aggregate({
        _sum: { amount: true },
        where: { mode: 'ESCROW', status: 'PAID', payoutStatus: { in: ['INITIATED', 'PENDING'] } }
    });

    const failedPayoutEvents = await prisma.payoutEventInbox.count({
        where: { status: 'FAILED' }
    });

    const commission7dAgg = await prisma.platformCommissionLedger.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: last7d } }
    });

    const sellerCredits7dAgg = await prisma.sellerBalanceLedger.aggregate({
        _sum: { amount: true },
        where: { type: 'CREDIT', createdAt: { gte: last7d } }
    });

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-[#1F3A5F] p-4 font-sans focus:outline-none">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1F3A5F] flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-slate-500" />
                        Finance Audit Console
                    </h1>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5 ml-7">Ledger, Commission & Escrow Payout Matrix</p>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Paid Orders (24h)</span>
                        <span className="text-lg font-bold text-[#1F3A5F] font-mono">{paidOrders24h}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Escrow Released (24h)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{formatMoney(escrowReleased24hAgg._sum.amount, "TRY")}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Pending Escrow</span>
                        <span className="text-lg font-bold text-[#1F3A5F] font-mono">{formatMoney(pendingReleasesAgg._sum.amount, "TRY")}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Failed Payout Flags</span>
                        <span className={`text-lg font-bold font-mono py-0.5 px-2 rounded ${failedPayoutEvents > 0 ? 'bg-rose-100 text-rose-700' : 'text-[#1F3A5F]'}`}>
                            {failedPayoutEvents} events
                        </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Commission Sum (7D)</span>
                        <span className="text-lg font-bold text-[#1F3A5F] font-mono">{formatMoney(commission7dAgg._sum.amount, "TRY")}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Seller Credits (7D)</span>
                        <span className="text-lg font-bold text-[#1F3A5F] font-mono">{formatMoney(sellerCredits7dAgg._sum.amount, "TRY")}</span>
                    </div>
                </div>

                {/* Filter Bar (Slim / Server-side) */}
                <form className="bg-white border border-slate-200 rounded-md p-2 flex flex-col md:flex-row gap-2 items-center text-xs">
                    <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input type="text" name="q" placeholder="Identifier Search..." defaultValue={q} className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1F3A5F]" />
                    </div>

                    <select name="st" defaultValue={st || 'ALL'} className="w-full md:w-40 py-1.5 px-2 border border-slate-300 rounded text-slate-700 focus:outline-none uppercase font-semibold text-[10px] tracking-wider">
                        <option value="ALL">ALL STATUSES</option>
                        <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                        <option value="PAID">PAID</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <select name="pr" defaultValue={pr || 'ALL'} className="w-full md:w-36 py-1.5 px-2 border border-slate-300 rounded text-slate-700 focus:outline-none uppercase font-semibold text-[10px] tracking-wider">
                        <option value="ALL">ALL PROVIDERS</option>
                        <option value="IYZICO">IYZICO</option>
                        <option value="ODEL">ODEL</option>
                        <option value="MOCK">MOCK</option>
                    </select>

                    <select name="ps" defaultValue={ps || 'ALL'} className="w-full md:w-36 py-1.5 px-2 border border-slate-300 rounded text-slate-700 focus:outline-none uppercase font-semibold text-[10px] tracking-wider">
                        <option value="ALL">ALL PAYOUTS</option>
                        <option value="INITIATED">INITIATED</option>
                        <option value="RELEASED">RELEASED</option>
                        <option value="FAILED">FAILED</option>
                    </select>

                    <button type="submit" className="h-[28px] px-3 bg-[#1F3A5F] text-white font-semibold rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 w-full md:w-28 text-[11px] tracking-wide shadow-sm">
                        <Filter className="w-3.5 h-3.5" />
                        APPLY
                    </button>
                </form>

                {/* Main Audit Table */}
                <div className="bg-white border border-slate-200 rounded-md overflow-hidden h-[calc(100vh-280px)] flex flex-col">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] text-slate-500 sticky top-0 z-10 border-b border-slate-300 shadow-sm">
                                <tr>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 w-24">Order ID</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 w-40 truncate">Buyer / Seller</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 text-center w-28">O. Status</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 text-right w-24">Order Total</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 w-32 truncate">Payment Trace</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 text-center w-24">P. Status</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 text-center w-24">Payout</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 text-center w-36">Dates (Paid/Rel)</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 text-center w-24">Ledgers Hit</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] border-r border-slate-200 w-32 truncate">Inbox Status</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] w-28 text-center bg-[#F6F7F9]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayOrders.length === 0 ? (
                                    <tr><td colSpan={11} className="text-center py-6 text-slate-500 font-medium text-xs">No records found matching current matrices.</td></tr>
                                ) : (
                                    displayOrders.map(order => {
                                        const payment = order.payments?.[0]; // Safe array 0 index check
                                        const inbox = payment?.payoutEvents?.[0];

                                        const hasSellerCredit = order.sellerLedgers.some(l => l.type === 'CREDIT');
                                        const hasCommission = order.commissionLedgers.length > 0;

                                        // Badge Class Definitions according to specs
                                        const mapOrderStatus: Record<string, string> = {
                                            PENDING_PAYMENT: 'border-slate-300 text-slate-600 bg-slate-50',
                                            PAID: 'border-blue-300 text-blue-700 bg-blue-50',
                                            DELIVERED: 'border-emerald-300 text-emerald-700 bg-emerald-50',
                                            COMPLETED: 'border-emerald-300 text-emerald-700 bg-emerald-50',
                                            CANCELLED: 'border-rose-300 text-rose-700 bg-rose-50',
                                        };
                                        const oColor = mapOrderStatus[order.status] || 'border-slate-300 text-slate-600 bg-slate-50';

                                        const pStatus = payment?.payoutStatus || 'N/A';
                                        const mapPayout: Record<string, string> = {
                                            INITIATED: 'border-amber-300 text-amber-700 bg-amber-50',
                                            RELEASED: 'border-emerald-300 text-emerald-700 bg-emerald-50',
                                            FAILED: 'border-rose-300 text-rose-700 bg-rose-50'
                                        };
                                        const poColor = mapPayout[pStatus] || 'border-slate-300 text-slate-600 bg-slate-50';

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 border-r border-slate-100 font-mono text-[11px] text-[#1F3A5F] font-bold truncate">
                                                    {order.id.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100">
                                                    <div className="font-semibold text-slate-800 text-[11px] truncate uppercase" title={companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}>{companyMap.get(order.buyerCompanyId) || order.buyerCompanyId} <span className="text-slate-400 font-normal ml-1 lowercase">(buy)</span></div>
                                                    <div className="font-semibold text-[#1F3A5F] text-[11px] truncate uppercase mt-0.5" title={companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}>{companyMap.get(order.sellerCompanyId) || order.sellerCompanyId} <span className="text-slate-400 font-normal ml-1 lowercase">(sell)</span></div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase shadow-sm ${oColor}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 font-mono font-bold text-slate-900 text-right text-xs">
                                                    {formatMoney(order.totalAmount, order.currency)}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-[10px] text-slate-600 font-medium">
                                                    {payment ? (
                                                        <>
                                                            <div className="flex items-center gap-1 font-bold text-[#1F3A5F] uppercase tracking-wider">{payment.provider}</div>
                                                            <div className="font-mono text-slate-500 mt-0.5">M: {payment.mode}</div>
                                                        </>
                                                    ) : <span className="text-slate-400">—</span>}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center text-xs font-semibold text-slate-700">
                                                    {payment?.status || '-'}
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border tracking-wider uppercase shadow-sm ${poColor}`}>
                                                        {pStatus}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 font-mono text-slate-600 text-[10px] text-center">
                                                    <div className={payment?.paidAt ? 'text-slate-800 font-bold' : ''}>P: {formatDateTR(payment?.paidAt)}</div>
                                                    <div className={payment?.releasedAt ? 'text-emerald-700 font-bold mt-0.5' : 'mt-0.5'}>R: {formatDateTR(payment?.releasedAt)}</div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-center flex flex-col items-center justify-center gap-1">
                                                    <div className="flex gap-2">
                                                        <span title="Seller Credit Exists" className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${hasSellerCredit ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'}`}>
                                                            {hasSellerCredit && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                                        </span>
                                                        <span title="Platform Commission Exists" className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${hasCommission ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'}`}>
                                                            {hasCommission && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 border-r border-slate-100 text-[10px] text-slate-600 truncate max-w-[150px]">
                                                    {inbox ? (
                                                        <div className="flex flex-col">
                                                            <span className={`font-bold uppercase tracking-wider ${inbox.status === 'FAILED' ? 'text-rose-600' : 'text-emerald-600'}`}>{inbox.status}</span>
                                                            {inbox.errorMessage && <span className="truncate" title={inbox.errorMessage}>{inbox.errorMessage}</span>}
                                                        </div>
                                                    ) : <span className="text-slate-400 italic font-medium">No inbox data</span>}
                                                </td>
                                                <td className="px-3 py-2 text-center align-middle">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={`/admin/ops/orders/${order.id}`}
                                                            className="flex items-center justify-center p-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                                                            title="View Context"
                                                        >
                                                            <ReceiptText className="w-3.5 h-3.5" />
                                                        </Link>

                                                        {payment?.status === 'PAID' && payment?.payoutStatus !== 'RELEASED' && order.confirmedAt !== null && (
                                                            <ForceReleaseLedgerButton paymentId={payment.id} />
                                                        )}
                                                    </div>
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

// Temporary inline Check icon to prevent import errors if lucide gets confused above
function Check(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
