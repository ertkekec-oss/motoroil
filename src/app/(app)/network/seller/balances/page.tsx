import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Wallet, Info, ArrowUpRight } from 'lucide-react';

export default async function SellerBalancesPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    // Yetki Kontrolü
    const perms: string[] = user.permissions || [];
    if (!perms.includes("network_sell") && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    const companyId = session.settings.companyId;

    // 1. Toplam Bakiye (SellerBalanceLedger üzerinden)
    // CREDIT (bize giren para) - DEBIT (varsa iadeler veya platforma dönüş)
    const balances = await prisma.sellerBalanceLedger.groupBy({
        by: ['currency', 'type'],
        where: { sellerCompanyId: companyId },
        _sum: { amount: true }
    });

    // Calculate generic TRY balance from sum (for multi currency, map to cards)
    let totalCredit = 0;
    let totalDebit = 0;

    balances.forEach(b => {
        if (b.currency === 'TRY') {
            if (b.type === 'CREDIT') totalCredit += Number(b._sum.amount || 0);
            if (b.type === 'DEBIT') totalDebit += Number(b._sum.amount || 0);
        }
    });

    const exactBalance = totalCredit - totalDebit;

    // 2. Bekleyen Kilitli Paralar (NetworkPayment status=PAID, mode=ESCROW, payoutStatus!=RELEASED)
    const lockedPayments = await prisma.networkPayment.aggregate({
        _sum: { amount: true },
        where: {
            mode: 'ESCROW',
            status: 'PAID',
            payoutStatus: { not: 'RELEASED' },
            order: { sellerCompanyId: companyId }
        }
    });

    const lockedEscrow = Number(lockedPayments._sum.amount || 0);

    // 3. Son 20 Ledger Hareketini çek
    const recentTransactions = await prisma.sellerBalanceLedger.findMany({
        where: { sellerCompanyId: companyId },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kazanç ve Bakiye</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">Siparişlerden serbest kalan kazançlarınız ve işlem havuzunuz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-black text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-300 text-xs font-semibold uppercase tracking-widest mb-1">Çekilebilir Bakiye</p>
                        <h2 className="text-4xl font-bold tracking-tight mb-2">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(exactBalance)}
                        </h2>
                        <p className="text-sm text-gray-400">Ledger mutabakatı tamamlanmış total kazanç</p>
                        <button className="mt-5 px-4 py-2 bg-white text-black font-semibold text-sm rounded-lg shadow-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                            Para Çekme Talebi <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">Güvenli Havuz (Escrow)</p>
                    <div className="flex items-end gap-2 mb-2">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(lockedEscrow)}
                        </h2>
                    </div>
                    <p className="text-sm text-gray-500 border-t border-gray-100 pt-3 mt-3 flex items-start gap-2">
                        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        Alıcının kargoyu onaylamasıyla birlikte bakiye serbest kalarak çekilebilir hesaba geçer.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900">Son Hesap Hareketleri (Ledger Logs)</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-5 py-3 font-medium">Tarih</th>
                            <th className="px-5 py-3 font-medium">İşlem Gerekçesi (Sipariş No)</th>
                            <th className="px-5 py-3 font-medium">Tür</th>
                            <th className="px-5 py-3 font-medium text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recentTransactions.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-10 text-gray-500">Henüz bir hesap hareketi bulunmuyor.</td></tr>
                        ) : (
                            recentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">
                                        {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "medium" }).format(tx.createdAt)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <Link href={`/network/seller/orders/${tx.networkOrderId}`} className="font-semibold text-gray-900 hover:underline">
                                            Sipariş #{tx.networkOrderId.slice(-8).toUpperCase()}
                                        </Link>
                                        <div className="text-xs text-gray-500 font-mono mt-1">Ref: {tx.idempotencyKey}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider 
                                            ${tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className={`px-5 py-4 text-right font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'}{new Intl.NumberFormat("tr-TR", { style: "currency", currency: tx.currency }).format(Number(tx.amount))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
