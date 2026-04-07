import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {  Search, Filter, Download, ArrowUpRight, PackageOpen, RotateCw, Wallet  } from "lucide-react";
import { EnterprisePageShell } from "@/components/ui/enterprise";

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

    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER")) {
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
    const companyMap = new Map(companies?.map(c => [c.id, c.name]));

    return (
        <EnterprisePageShell
            title="Yönetim"
            description="Sistem detaylarını yapılandırın"
        >
            <div className="animate-in fade-in duration-300">

                {/* Header Area */}
                <div className="border-b border-slate-200 dark:border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <PackageOpen className="w-7 h-7 text-indigo-500 dark:text-emerald-500" />
                            Sipariş İzleme (Ops)
                        </h1>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 ml-10">Global B2B & Escrow İşlemleri Merkezi</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="h-[36px] px-5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-black rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm tracking-widest uppercase">
                            <Download className="w-4 h-4" />
                            CSV Dışa Aktar
                        </button>
                    </div>
                </div>

                {/* Filter Bar (Dense ERP Style) */}
                <form className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-64">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Kimlik Arama</label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                            <input
                                name="q"
                                type="text"
                                placeholder="Sipariş ID veya Firma..."
                                defaultValue={qStr}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white text-xs transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-48">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Genel Durum</label>
                        <select
                            name="status"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 cursor-pointer uppercase font-bold tracking-widest"
                            defaultValue={statusFilter || ''}
                        >
                            <option value="">TÜM SİPARİŞLER</option>
                            <option value="PENDING_PAYMENT">ÖDEME BEKLİYOR</option>
                            <option value="PAID">ÖDENDİ (KARGO BEKLİYOR)</option>
                            <option value="SHIPPED">KARGOLANDI</option>
                            <option value="DELIVERED">TESLİM EDİLDİ</option>
                            <option value="COMPLETED">TAMAMLANDI</option>
                        </select>
                    </div>

                    <div className="w-full md:w-40">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Tarih Aralığı</label>
                        <input type="date" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 dark:focus:border-emerald-500 text-xs text-center" />
                    </div>

                    <div className="flex-1"></div>

                    <button type="submit" className="h-[36px] px-5 bg-indigo-600 dark:bg-emerald-600 hover:bg-indigo-700 dark:hover:bg-emerald-500 text-white font-black rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto text-[11px] uppercase tracking-widest shadow-sm">
                        <Filter className="w-4 h-4" />
                        FİLTRELE
                    </button>
                </form>

                {/* Main Data Table */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-250px)]">

                    {/* Fixed Header Tabular Layout perfectly compatible with TanStack/ReactTable mental model */}
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                                <tr>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-28">Sipariş ID</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-40 text-center">Oluşturulma</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-48 truncate">Alıcı Firma</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-48 truncate">Satıcı Firma</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-right w-36">Toplam Tutar</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-36">Ödeme Durumu</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-36">Kargo Durumu</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 text-center w-36">Escrow</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] text-center w-32">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {orders.length === 0 ? (
                                    <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest">Filtrelere uygun kayıt bulunamadı.</td></tr>
                                ) : (
                                    orders?.map(order => {
                                        const pay = order.payments[0];
                                        const shpCount = order.shipments.length;
                                        const delivCount = order.shipments.filter(s => s.status === 'DELIVERED').length;

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 border-b border-transparent hover:border-slate-200 dark:hover:bg-white/5 transition-colors group">
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-[11px] text-[#1F3A5F] dark:text-indigo-300 font-bold truncate">
                                                    <Link href={`/admin/ops/orders/${order.id}`} className="hover:underline hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors">
                                                        #{order.id.slice(-6).toUpperCase()}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono text-slate-500 dark:text-slate-400 text-center text-[11px]">
                                                    {formatDateTR(order.createdAt)}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-bold text-slate-800 dark:text-slate-200 text-xs truncate tracking-tight uppercase" title={companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}>
                                                    {companyMap.get(order.buyerCompanyId) || order.buyerCompanyId}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-bold text-indigo-600 dark:text-indigo-400 text-xs truncate tracking-tight uppercase" title={companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}>
                                                    {companyMap.get(order.sellerCompanyId) || order.sellerCompanyId}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 font-mono font-black text-slate-900 dark:text-white text-right text-[13px]">
                                                    {formatMoney(order.totalAmount, order.currency)}
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black border tracking-widest uppercase shadow-sm 
                                                    ${pay?.status === 'PAID' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 border-amber-300 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                        {pay ? pay.status : order.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black border shadow-sm tracking-widest uppercase
                                                        ${delivCount > 0 && delivCount === shpCount ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                                shpCount > 0 ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                                                            {shpCount === 0 ? 'KARGO YOK' : `${delivCount}/${shpCount} TESLİM`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-center">
                                                    {pay?.mode === 'ESCROW' ? (
                                                        <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-black border tracking-widest uppercase shadow-sm
                                                        ${pay.payoutStatus === 'RELEASED' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                                pay.payoutStatus === 'FAILED' ? 'bg-rose-50 border-rose-300 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400' :
                                                                    'bg-blue-50 border-blue-300 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                                                            {pay.payoutStatus}
                                                        </span>
                                                    ) : <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] font-bold">DİREKT</span>}
                                                </td>
                                                <td className="px-5 py-4 text-center text-slate-400 dark:text-slate-500 flex items-center justify-center gap-3">
                                                    <Link href={`/admin/ops/orders/${order.id}`} title="Siparişi Gör" className="hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-transparent p-2 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:shadow-md"><ArrowUpRight className="w-4 h-4" /></Link>
                                                    <button title="Kargo Senk. Zorla" className="hover:text-indigo-600 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-transparent p-2 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:shadow-md"><RotateCw className="w-4 h-4" /></button>
                                                    <Link href={`/admin/payouts?q=${pay?.id}`} title="Payout Paneli Görüntüle" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-transparent p-2 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:shadow-md"><Wallet className="w-4 h-4" /></Link>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-[#F6F7F9] dark:bg-slate-800/80 border-t border-slate-300 dark:border-slate-700 px-5 py-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold uppercase tracking-widest backdrop-blur-sm">
                        <span>LİSTELENEN: {orders.length} KAYIT</span>
                        <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md cursor-not-allowed opacity-50 shadow-sm">ÖNCEKİ</button>
                            <button className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md opacity-50 cursor-not-allowed shadow-sm">SONRAKİ</button>
                        </div>
                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}