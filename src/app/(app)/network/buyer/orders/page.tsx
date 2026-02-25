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
        PENDING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
        PAID: "bg-blue-50 text-blue-700 border-blue-200",
        SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
        DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        DISPUTED: "bg-rose-50 text-rose-700 border-rose-200",
        CANCELLED: "bg-gray-50 text-gray-700 border-gray-200",
        RETURNED: "bg-gray-50 text-gray-700 border-gray-200",
    };

    const cls = map[status] ?? "bg-gray-50 text-gray-700 border-gray-200";

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
            {status}
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

    // Buyer ekranı için permission gate
    const perms: string[] = user.permissions || [];
    if (!perms.includes("network_buy") && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    const pageSize = 20;

    // Cursor pagination (createdAt desc)
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

    const companyIds = Array.from(new Set(orders.map(o => o.sellerCompanyId)));
    const companies = await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } });
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    const hasNext = orders.length > pageSize;
    const data = hasNext ? orders.slice(0, pageSize) : orders;
    const nextCursor = hasNext ? data[data.length - 1]?.id : null;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Siparişlerim</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Periodya Network üzerinden verdiğin siparişleri burada takip edebilirsin.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        className={`px-3 py-2 rounded-lg text-sm border ${!status ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                            }`}
                        href="/network/buyer/orders"
                    >
                        Tümü
                    </Link>
                    <Link
                        className={`px-3 py-2 rounded-lg text-sm border ${status === "PAID" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                            }`}
                        href="/network/buyer/orders?status=PAID"
                    >
                        Ödendi
                    </Link>
                    <Link
                        className={`px-3 py-2 rounded-lg text-sm border ${status === "DELIVERED" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                            }`}
                        href="/network/buyer/orders?status=DELIVERED"
                    >
                        Teslim Edildi
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Sipariş Listesi</p>
                    <p className="text-xs text-gray-500">{data.length} kayıt</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold">Sipariş</th>
                                <th className="text-left px-4 py-3 font-semibold">Satıcı</th>
                                <th className="text-left px-4 py-3 font-semibold">Durum</th>
                                <th className="text-right px-4 py-3 font-semibold">Tutar</th>
                                <th className="text-left px-4 py-3 font-semibold">Oluşturma</th>
                                <th className="text-left px-4 py-3 font-semibold">Ödeme</th>
                                <th className="text-left px-4 py-3 font-semibold">Onay</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-10 text-center text-gray-500" colSpan={7}>
                                        Henüz sipariş yok.
                                    </td>
                                </tr>
                            ) : (
                                data.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/network/buyer/orders/${o.id}`}
                                                className="font-semibold text-gray-900 hover:underline"
                                            >
                                                #{o.id.slice(-8).toUpperCase()}
                                            </Link>
                                            <div className="text-xs text-gray-500">{o.id}</div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{(companyMap.get(o.sellerCompanyId) as string) ?? "-"}</div>
                                            <div className="text-xs text-gray-500">{o.sellerCompanyId}</div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <StatusBadge status={o.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                            {formatMoney(o.totalAmount, o.currency)}
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">{formatDateTR(o.createdAt)}</td>
                                        <td className="px-4 py-3 text-gray-700">{formatDateTR((o as any).paidAt)}</td>
                                        <td className="px-4 py-3 text-gray-700">{formatDateTR((o as any).confirmedAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {status ? (
                            <>
                                Filtre: <span className="font-semibold text-gray-700">{status}</span>
                            </>
                        ) : (
                            "Filtre yok"
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {cursor ? (
                            <Link
                                href={status ? `/network/buyer/orders?status=${status}` : "/network/buyer/orders"}
                                className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
                            >
                                Baştan
                            </Link>
                        ) : (
                            <span className="px-3 py-2 text-sm text-gray-400 border border-gray-100 rounded-lg">
                                Baştan
                            </span>
                        )}

                        {hasNext && nextCursor ? (
                            <Link
                                href={
                                    status
                                        ? `/network/buyer/orders?status=${status}&cursor=${nextCursor}`
                                        : `/network/buyer/orders?cursor=${nextCursor}`
                                }
                                className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50"
                            >
                                Sonraki
                            </Link>
                        ) : (
                            <span className="px-3 py-2 text-sm text-gray-400 border border-gray-100 rounded-lg">
                                Sonraki
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
