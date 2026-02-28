import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type SearchParams = { status?: string; cursor?: string };

function formatDateTR(d: Date | null | undefined) {
    if (!d) return "-";
    try {
        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Istanbul",
        }).format(d);
    } catch {
        return d?.toISOString?.() ?? "-";
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

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PENDING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        PAID: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
        SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
        DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        DISPUTED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
        CANCELLED: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        RETURNED: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    };

    const cls = map[status] ?? "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
            {status}
        </span>
    );
}

export default async function SellerOrdersPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const sp = (await searchParams) ?? {};
    const status = sp.status?.trim();
    const cursor = sp.cursor?.trim();

    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    const perms: string[] = user.permissions || [];
    // Allow if user has sales_archive perm (as mentioned in Sidebar) or has admin privileges
    if (!perms.includes("sales_archive") && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    const pageSize = 20;

    const where: any = {};
    if (status) where.status = status;

    // Explicitly restrict to sellerCompanyId for this company (if isolated context present)
    const companyId = user.companyId || session?.companyId;
    if (companyId) {
        where.sellerCompanyId = companyId;
    }

    const orders = await prisma.networkOrder.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: pageSize + 1,
        ...(cursor
            ? {
                cursor: { id: cursor },
                skip: 1,
            }
            : {}),
        select: {
            id: true,
            status: true,
            currency: true,
            totalAmount: true,
            createdAt: true,
            paidAt: true,
            confirmedAt: true,
            buyerCompanyId: true,
        },
    });

    const companyIds = Array.from(new Set(orders.map(o => o.buyerCompanyId)));
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    const hasNext = orders.length > pageSize;
    const data = hasNext ? orders.slice(0, pageSize) : orders;
    const nextCursor = hasNext ? data[data.length - 1]?.id : null;

    return (
    return (
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 xl:p-12 relative font-sans" style={{ scrollbarWidth: 'none' }}>
            <div className="max-w-[1400px] mx-auto space-y-8 pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                        <h1 className="text-[32px] sm:text-[40px] font-[700] tracking-tight text-[#0F172A] dark:text-white leading-tight mb-1">
                            Alınan Siparişler
                        </h1>
                        <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full">
                            B2B Pazaryeri üzerinden firmanıza gelen tüm siparişler.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <Link
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${!status ? "bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A] border-transparent shadow-sm" : "bg-white dark:bg-[#080911] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                }`}
                            href="/network/seller/orders"
                        >
                            Tümü
                        </Link>
                        <Link
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${status === "PAID" ? "bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A] border-transparent shadow-sm" : "bg-white dark:bg-[#080911] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                }`}
                            href="/network/seller/orders?status=PAID"
                        >
                            Ödendi
                        </Link>
                        <Link
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${status === "DELIVERED" ? "bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A] border-transparent shadow-sm" : "bg-white dark:bg-[#080911] text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                                }`}
                            href="/network/seller/orders?status=DELIVERED"
                        >
                            Teslim Edildi
                        </Link>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#080911] border border-slate-200/60 dark:border-white/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.2)] overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <p className="text-[15px] font-bold text-[#0F172A] dark:text-white">Sipariş Listesi</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{data.length} kayıt</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-white/5">
                                <tr>
                                    <th className="text-left px-6 py-4 font-bold">Sipariş</th>
                                    <th className="text-left px-6 py-4 font-bold">Alıcı</th>
                                    <th className="text-left px-6 py-4 font-bold">Durum</th>
                                    <th className="text-right px-6 py-4 font-bold">Tutar</th>
                                    <th className="text-left px-6 py-4 font-bold">Oluşturma</th>
                                    <th className="text-left px-6 py-4 font-bold">Ödeme</th>
                                    <th className="text-left px-6 py-4 font-bold">Onay</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {data.length === 0 ? (
                                    <tr>
                                        <td className="px-6 py-12 text-center text-slate-500 dark:text-slate-400" colSpan={7}>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="text-slate-300 dark:text-slate-600 mb-2">
                                                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                </div>
                                                <span className="font-semibold text-sm">Henüz sipariş yok.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/network/seller/orders/${o.id}`}
                                                    className="font-bold text-[#0F172A] dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-block"
                                                >
                                                    #{o.id.slice(-8).toUpperCase()}
                                                </Link>
                                                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">{o.id}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-bold text-[#0F172A] dark:text-slate-200">{(companyMap.get(o.buyerCompanyId) as string) ?? "-"}</div>
                                                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">{o.id}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={o.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-[#0F172A] dark:text-white text-[15px]">
                                                {formatMoney(o.totalAmount, o.currency)}
                                            </td>

                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{formatDateTR(o.createdAt)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{formatDateTR((o as any).paidAt)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{formatDateTR((o as any).confirmedAt)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {status ? (
                                <>
                                    Filtre: <span className="font-bold text-[#0F172A] dark:text-white bg-white dark:bg-[#080911] px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-white/10 ml-2">{status}</span>
                                </>
                            ) : (
                                "Filtre yok"
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {cursor ? (
                                <Link
                                    href={status ? `/network/seller/orders?status=${status}` : "/network/seller/orders"}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#080911] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                                >
                                    Baştan
                                </Link>
                            ) : (
                                <span className="px-4 py-2 text-sm font-semibold text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-white/5 rounded-xl cursor-not-allowed opacity-70">
                                    Baştan
                                </span>
                            )}

                            {hasNext && nextCursor ? (
                                <Link
                                    href={
                                        status
                                            ? `/network/seller/orders?status=${status}&cursor=${nextCursor}`
                                            : `/network/seller/orders?cursor=${nextCursor}`
                                    }
                                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#080911] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                                >
                                    Sonraki
                                </Link>
                            ) : (
                                <span className="px-4 py-2 text-sm font-semibold text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-white/5 rounded-xl cursor-not-allowed opacity-70">
                                    Sonraki
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
