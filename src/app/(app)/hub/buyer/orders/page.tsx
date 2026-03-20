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

// B2B 9-10 Level Premium Semantic Color System Status Badge
function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { label: string, colorClass: string }> = {
        PENDING_PAYMENT: { label: "Ödeme Bekleniyor", colorClass: "bg-amber-100 text-amber-700" },
        PAID: { label: "Ödendi (İşleniyor)", colorClass: "bg-emerald-100 text-emerald-700" },
        SHIPPED: { label: "Kargoda", colorClass: "bg-blue-100 text-blue-700" },
        DELIVERED: { label: "Teslim Edildi", colorClass: "bg-emerald-100 text-emerald-700" },
        COMPLETED: { label: "Tamamlandı", colorClass: "bg-emerald-100 text-emerald-700" },
        DISPUTED: { label: "İhtilaflı", colorClass: "bg-red-100 text-red-700" },
        CANCELLED: { label: "İptal Edildi", colorClass: "bg-slate-100 dark:bg-white/5 dark:bg-white dark:bg-[#0f172a]/5 text-slate-600 dark:text-slate-300 dark:text-slate-300" },
        RETURNED: { label: "İade", colorClass: "bg-slate-100 dark:bg-white/5 dark:bg-white dark:bg-[#0f172a]/5 text-slate-600 dark:text-slate-300 dark:text-slate-300" },
    };

    const s = statusMap[status] || { label: status, colorClass: "bg-slate-100 dark:bg-white/5 dark:bg-white dark:bg-[#0f172a]/5 text-slate-600 dark:text-slate-300 dark:text-slate-300" };

    return (
        <span className={`inline-flex px-2 py-1 text-[11px] font-bold uppercase tracking-widest rounded ${s.colorClass}`}>
            {s.label}
        </span>
    );
}

export default async function BuyerOrdersPage({
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
    if (!perms.includes("network_buy") && user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER") {
        redirect("/403");
    }

    const pageSize = 20;

    const where: any = {};
    if (status) where.status = status;

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
            sellerCompanyId: true,
        },
    });

    const companyIds = Array.from(new Set(orders?.map(o => o.sellerCompanyId)));
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
    const companyMap = new Map(companies?.map(c => [c.id, c.name]));

    const hasNext = orders.length > pageSize;
    const data = hasNext ? orders.slice(0, pageSize) : orders;
    const nextCursor = hasNext ? data[data.length - 1]?.id : null;

    return (
        <div className="bg-slate-50 dark:bg-[#0f172a] dark:bg-[#0f172a] min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white dark:text-white tracking-tight mb-1">
                            Verilen Siparişler (Açık Siparişler)
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            Satın alma operasyonları dahilinde verdiğiniz tüm tedarik taleplerini ve sipariş durumlarını izleyin.
                        </p>
                    </div>

                    {/* Filtre Strip */}
                    <div className="flex bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-white/10 dark:border-white/10 shadow-sm overflow-hidden p-1 shrink-0">
                        <Link
                            href="/hub/buyer/orders"
                            className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${!status ? "bg-slate-900 dark:bg-white dark:text-slate-900 dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white text-white shadow-sm" : "bg-transparent text-slate-700 dark:text-slate-200 dark:text-slate-200 hover:text-slate-900 dark:text-white dark:text-white hover:bg-slate-50 dark:bg-[#0f172a]"}`}
                        >
                            Tümü
                        </Link>
                        <Link
                            href="/hub/buyer/orders?status=PENDING_PAYMENT"
                            className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${status === "PENDING_PAYMENT" ? "bg-slate-900 dark:bg-white dark:text-slate-900 dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white text-white shadow-sm" : "bg-transparent text-slate-700 dark:text-slate-200 dark:text-slate-200 hover:text-slate-900 dark:text-white dark:text-white hover:bg-slate-50 dark:bg-[#0f172a]"}`}
                        >
                            Ödeme Bekleyen
                        </Link>
                        <Link
                            href="/hub/buyer/orders?status=PAID"
                            className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${status === "PAID" ? "bg-slate-900 dark:bg-white dark:text-slate-900 dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white text-white shadow-sm" : "bg-transparent text-slate-700 dark:text-slate-200 dark:text-slate-200 hover:text-slate-900 dark:text-white dark:text-white hover:bg-slate-50 dark:bg-[#0f172a]"}`}
                        >
                            Ödendi (İşleniyor)
                        </Link>
                        <Link
                            href="/hub/buyer/orders?status=DELIVERED"
                            className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${status === "DELIVERED" ? "bg-slate-900 dark:bg-white dark:text-slate-900 dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white dark:bg-white dark:bg-[#0f172a] dark:text-slate-900 dark:text-white text-white shadow-sm" : "bg-transparent text-slate-700 dark:text-slate-200 dark:text-slate-200 hover:text-slate-900 dark:text-white dark:text-white hover:bg-slate-50 dark:bg-[#0f172a]"}`}
                        >
                            Teslim Alındı
                        </Link>
                    </div>
                </div>

                {/* Ana Tablo Konteyner */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead className="bg-slate-50 dark:bg-[#0f172a]/50 border-b border-slate-100 dark:border-white/5 dark:border-white/5 text-xs uppercase text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Referans No / P.O.</th>
                                    <th className="px-6 py-4 font-bold">Tedarikçi (Satıcı)</th>
                                    <th className="px-6 py-4 font-bold">Lojistik Durumu</th>
                                    <th className="px-6 py-4 font-bold text-right">Tutar</th>
                                    <th className="px-6 py-4 font-bold">Oluşturma</th>
                                    <th className="px-6 py-4 font-bold">Ödeme / Onay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 dark:divide-white/5 text-sm">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-[#0f172a] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/10 dark:border-white/10 shadow-sm">
                                                🛒
                                            </div>
                                            <p className="text-[15px] font-semibold text-slate-900 dark:text-white dark:text-white">Satın Alma Kaydı Yok</p>
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                                                Belirtilen filtre kriterlerine uygun açık bir siparişiniz bulunamadı.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    data?.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50 dark:bg-[#0f172a] transition-colors group">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/hub/buyer/orders/${o.id}`}
                                                    className="font-bold text-slate-900 dark:text-white dark:text-white group-hover:text-blue-600 transition-colors"
                                                >
                                                    #{o.id.slice(0, 8).toUpperCase()}
                                                </Link>
                                                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-1">{o.id}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white dark:text-white">{(companyMap.get(o.sellerCompanyId) as string) ?? "-"}</div>
                                                <div className="text-[12px] text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-0.5">ID: {o.sellerCompanyId.substring(0, 8)}...</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={o.status} />
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-slate-900 dark:text-white dark:text-white text-[15px]">
                                                    {formatMoney(o.totalAmount, o.currency)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-600 dark:text-slate-300 dark:text-slate-300">
                                                {formatDateTR(o.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-[13px] font-medium text-slate-600 dark:text-slate-300 dark:text-slate-300">
                                                {formatDateTR((o as any).paidAt)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
                            {data.length} satın alma kaydı görüntüleniyor.
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {cursor ? (
                                <Link
                                    href={status ? `/hub/buyer/orders?status=${status}` : "/hub/buyer/orders"}
                                    className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-300 dark:border-white/20 dark:border-white/20 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 dark:text-slate-200 hover:bg-slate-50 dark:bg-[#0f172a] transition-colors shadow-sm"
                                >
                                    Baştan
                                </Link>
                            ) : (
                                <span className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-200 dark:border-white/10 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 cursor-not-allowed">
                                    Baştan
                                </span>
                            )}

                            {hasNext && nextCursor ? (
                                <Link
                                    href={
                                        status
                                            ? `/hub/buyer/orders?status=${status}&cursor=${nextCursor}`
                                            : `/hub/buyer/orders?cursor=${nextCursor}`
                                    }
                                    className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-300 dark:border-white/20 dark:border-white/20 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 dark:text-slate-200 hover:bg-slate-50 dark:bg-[#0f172a] transition-colors shadow-sm"
                                >
                                    Daha Fazla Kayıt
                                </Link>
                            ) : (
                                <span className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-200 dark:border-white/10 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 cursor-not-allowed">
                                    Daha Fazla Kayıt
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
