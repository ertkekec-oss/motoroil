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

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER")) {
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
    const companyMap = new Map(companies?.map(c => [c.id, c.name]));

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
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-4 font-sans focus:outline-none w-full pb-16">
            <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-white/10 pb-6">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <HardDrive className="w-7 h-7 text-indigo-500 dark:text-emerald-500" />
                        Finans & Ledger Denetimi (Ops)
                    </h1>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 ml-10">Ledger, Komisyon ve Escrow Payout Matrisi</p>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Ödenen Siparişler (24S)</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{paidOrders24h}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all"></div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2 relative z-10">Escrow Çıkış (24S)</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono relative z-10">{formatMoney(escrowReleased24hAgg._sum.amount, "TRY")}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Bekleyen Escrow</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatMoney(pendingReleasesAgg._sum.amount, "TRY")}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Hatalı Payout Deneme</span>
                        <span className={`text-xl font-black font-mono py-1 px-3 rounded-lg flex items-center self-start ${failedPayoutEvents > 0 ? 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'}`}>
                            {failedPayoutEvents} Olay
                        </span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Komisyonlar (7G)</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatMoney(commission7dAgg._sum.amount, "TRY")}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest mb-2">Satıcı Alacakları (7G)</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatMoney(sellerCredits7dAgg._sum.amount, "TRY")}</span>
                    </div>
                </div>

                {/* Filter Bar (Slim / Server-side) */}
                <form className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row gap-3 items-center text-xs">
                    <div className="relative w-full md:w-64">
                        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                        <input type="text" name="q" placeholder="Kimlik (ID) Ara..." defaultValue={q} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                    </div>

                    <select name="st" defaultValue={st || 'ALL'} className="w-full md:w-48 py-2 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none uppercase font-bold text-[10px] tracking-widest cursor-pointer">
                        <option value="ALL">TÜM DURUMLAR</option>
                        <option value="PENDING_PAYMENT">BEKLİYOR (ÖDEME)</option>
                        <option value="PAID">ÖDENDİ</option>
                        <option value="SHIPPED">KARGOLANDI</option>
                        <option value="DELIVERED">TESLİM EDİLDİ</option>
                        <option value="COMPLETED">TAMAMLANDI</option>
                        <option value="CANCELLED">İPTAL</option>
                    </select>

                    <select name="pr" defaultValue={pr || 'ALL'} className="w-full md:w-40 py-2 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none uppercase font-bold text-[10px] tracking-widest cursor-pointer">
                        <option value="ALL">TÜM SAĞLAYICILAR</option>
                        <option value="IYZICO">IYZICO</option>
                        <option value="ODEL">ODEL</option>
                        <option value="MOCK">MOCK (TEST)</option>
                    </select>

                    <select name="ps" defaultValue={ps || 'ALL'} className="w-full md:w-40 py-2 px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none uppercase font-bold text-[10px] tracking-widest cursor-pointer">
                        <option value="ALL">TÜM TRANSFERLER</option>
                        <option value="INITIATED">BAŞLATILDI</option>
                        <option value="RELEASED">SERBEST (RELEASED)</option>
                        <option value="FAILED">HATALI</option>
                    </select>

                    <button type="submit" className="h-[36px] px-5 bg-indigo-600 dark:bg-emerald-600 hover:bg-indigo-700 dark:hover:bg-emerald-500 text-white font-black rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto text-[11px] uppercase tracking-widest shadow-sm ml-auto">
                        <Filter className="w-4 h-4" />
                        UYGULA
                    </button>
                </form>

                {/* Main Audit Table */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden h-[calc(100vh-280px)] flex flex-col shadow-sm">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                                <tr>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-24">Sipariş ID</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-48 truncate">Alıcı / Satıcı</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-28">S. Durumu</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-right w-32">Tutar</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-40 truncate">Ödeme İzi</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-28">Ö. Durumu</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-28">Çıkış (Payout)</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-40">Tarihler</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-28">Ledger Etkileri</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-40 truncate">Banka (Inbox) Durumu</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] w-28 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {displayOrders.length === 0 ? (
                                    <tr><td colSpan={11} className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest">Arama Kriterlerine Uygun Kayıt Bulunamadı.</td></tr>
                                ) : (
                                    displayOrders?.map(order => {
                                        const payment = order.payments?.[0]; // Safe array 0 index check
                                        const inbox = payment?.payoutEvents?.[0];

                                        const hasSellerCredit = order.sellerLedgers.some(l => l.type === 'CREDIT');
                                        const hasCommission = order.commissionLedgers.length > 0;

                                        // Badge Class Definitions according to specs
                                        const mapOrderStatus: Record<string, string> = {
                                            PENDING_PAYMENT: 'border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                                            PAID: 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400',
                                            DELIVERED: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
                                            COMPLETED: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
                                            CANCELLED: 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400',
                                        };
                                        const oColor = mapOrderStatus[order.status] || 'border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

                                        const pStatus = payment?.payoutStatus || 'N/A';
                                        const mapPayout: Record<string, string> = {
                                            INITIATED: 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
                                            RELEASED: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
                                            FAILED: 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
                                        };
                                        const poColor = mapPayout[pStatus] || 'border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 border-b border-transparent hover:border-slate-200 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-[11px] text-[#1F3A5F] dark:text-indigo-300 font-bold truncate">
                                                    {order.id.slice(-8).toUpperCase()}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate uppercase tracking-tight" title={companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}>{companyMap.get(order.buyerCompanyId) || order.buyerCompanyId} <span className="text-slate-400 font-medium ml-1 lowercase">(alıcı)</span></div>
                                                    <div className="font-bold text-indigo-600 dark:text-indigo-400 text-xs truncate uppercase tracking-tight mt-1" title={companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}>{companyMap.get(order.sellerCompanyId) || order.sellerCompanyId} <span className="text-slate-400 font-medium ml-1 lowercase">(satıcı)</span></div>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black border tracking-widest uppercase shadow-sm ${oColor}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white text-right text-[13px]">
                                                    {formatMoney(order.totalAmount, order.currency)}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                                    {payment ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5 font-bold text-[#1F3A5F] dark:text-indigo-300 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5 text-slate-400"/> {payment.provider}</div>
                                                            <div className="font-mono text-slate-500 mt-1 pl-5">MOD: {payment.mode}</div>
                                                        </>
                                                    ) : <span className="text-slate-400 opacity-50">—</span>}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center text-[10px] uppercase font-bold tracking-widest text-slate-700 dark:text-slate-300">
                                                    {payment?.status || '-'}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black border tracking-widest uppercase shadow-sm ${poColor}`}>
                                                        {pStatus}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-slate-600 dark:text-slate-400 text-[10px] text-center">
                                                    <div className={payment?.paidAt ? 'text-slate-800 dark:text-slate-200 font-bold' : ''}><span className="text-slate-400">G:</span> {formatDateTR(payment?.paidAt)}</div>
                                                    <div className={payment?.releasedAt ? 'text-emerald-600 dark:text-emerald-400 font-bold mt-1' : 'mt-1'}><span className="text-slate-400">Ç:</span> {formatDateTR(payment?.releasedAt)}</div>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center flex flex-col items-center justify-center gap-1 h-[72px]">
                                                    <div className="flex gap-2.5">
                                                        <span title="Satıcı Alacağı Oluştu" className={`w-4 h-4 rounded-full flex items-center justify-center border shadow-sm ${hasSellerCredit ? 'bg-emerald-500 border-emerald-600 dark:border-emerald-400' : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                            {hasSellerCredit && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                                        </span>
                                                        <span title="Platform Komisyonu Kesildi" className={`w-4 h-4 rounded-full flex items-center justify-center border shadow-sm ${hasCommission ? 'bg-indigo-500 border-indigo-600 dark:border-indigo-400' : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                            {hasCommission && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                                                    {inbox ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`font-black uppercase tracking-widest ${inbox.status === 'FAILED' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{inbox.status}</span>
                                                            {inbox.errorMessage && <span className="truncate" title={inbox.errorMessage}>{inbox.errorMessage}</span>}
                                                        </div>
                                                    ) : <span className="text-slate-400 dark:text-slate-600 italic font-medium">Ağ Verisi Yok</span>}
                                                </td>
                                                <td className="px-5 py-4 text-center align-middle relative">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={`/admin/ops/orders/${order.id}`}
                                                            className="flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm bg-white dark:bg-transparent"
                                                            title="Sipariş Detayına Git"
                                                        >
                                                            <ReceiptText className="w-4 h-4" />
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
