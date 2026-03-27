import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PlatformFinancePage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "PLATFORM_ADMIN")
  ) {
    return redirect("/login");
  }

  // Platform-wide Statistics
  const companyCount = await prisma.company.count({
    where: { deletedAt: null },
  });
  const userCount = await prisma.user.count({ where: { deletedAt: null } });

  // Live Escrow & Trade queries
  const activeEscrows = await prisma.escrowCase.count({
      where: {
          status: {
              in: ['FUNDS_HELD', 'RELEASE_REQUESTED', 'SETTLEMENT_EXECUTING', 'DISPUTED']
          }
      }
  });

  const completedTrades = await prisma.tradeLedgerEntry.count({
      where: {
          eventType: 'TRADE_COMPLETED'
      }
  });

  const recentLedgersQuery = await prisma.tradeLedgerEntry.findMany({
      orderBy: { occurredAt: 'desc' },
      take: 5
  });

  const recentLedgers = recentLedgersQuery.map(l => ({
      id: l.id,
      proposalId: l.proposalId || "N/A",
      status: l.eventStatus || l.eventType,
      recordedAt: l.occurredAt.toISOString(),
      metaJson: l.metadataJson || { type: "B2B Ağ İşlemi" }
  }));

  const salesInvoices = await prisma.salesInvoice.findMany({
      take: 5,
      orderBy: { invoiceDate: 'desc' },
      include: { customer: true, company: true }
  });

  const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      take: 5,
      orderBy: { invoiceDate: 'desc' },
      include: { supplier: true, company: true }
  });

  return (
    <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
              Platform Finans & B2B Gelir Tablosu
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tüm ağın (Network) toplam dönen hacmi, komisyonlar ve aktif Emanet
              (Escrow) büyüklüğü.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              Global Görünüm (SUPER_ADMIN)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Ağdaki Şirketler
              </h3>
              <span className="text-2xl">🏢</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {companyCount}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Toplam Kayıtlı Acenta/Tedarikçi
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Kilitli Escrow (Aktif)
              </h3>
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {activeEscrows}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Teslimat onayı bekleyen işlem
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-blue-400/30 transition-colors duration-700"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                Aylık SaaS & Ekstra Gelir
              </h3>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-3xl font-mono font-bold text-white relative z-10">
              214.500 <span className="text-lg">₺</span>
            </p>
            <p className="text-xs text-indigo-200 mt-2 font-medium relative z-10">
              Paket, SMS, ve Lojistik Kârı
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -translate-x-10 translate-y-10 group-hover:bg-green-400/30 transition-colors duration-700"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Platform B2B Komisyon
              </h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-mono font-bold text-white relative z-10">
              86.200 <span className="text-lg">₺</span>
            </p>
            <p className="text-xs text-emerald-200 mt-2 font-medium relative z-10">
              Bu ay Escrow'dan kesilen komisyon
            </p>
          </div>
        </div>

        {/* PLATFORM INVOICING / KURUMSAL FATURA MERKEZİ */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🧾</span> Kurumsal Fatura Merkezi
                (Gelen / Giden)
              </h2>
              <p className="text-sm text-slate-500">
                Periodya A.Ş. operasyonel giderleri ve Tenant'lara kesilen
                platform hizmet faturaları.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                Sendeo Mutabakat Excel'i Yükle
              </button>
              <button className="px-4 py-2 bg-indigo-600 border border-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                + Yeni Fatura Oluştur / Kes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* GİDEN FATURALAR (PLATFORM GELİRİ) */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/50">
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  Giden Faturalar (Tenant / Müşteri Çıkışları)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white dark:bg-transparent">
                  <thead className="text-slate-500 border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="py-3 px-4">Tarih</th>
                      <th className="py-3 px-4">Fatura No</th>
                      <th className="py-3 px-4">Alıcı (Tenant)</th>
                      <th className="py-3 px-4">Açıklama / Kalemler</th>
                      <th className="py-3 px-4 text-right">Tutar</th>
                      <th className="py-3 px-4 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                    {salesInvoices.length === 0 ? (
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td colSpan={6} className="py-8 px-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                           Henüz Giden Fatura Yok
                        </td>
                      </tr>
                    ) : (
                      salesInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            {new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" }).format(new Date(inv.invoiceDate))}
                          </td>
                          <td className="py-4 px-4 font-mono">{inv.invoiceNo || "-"}</td>
                          <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                            {inv.customer?.name || "Bilinmiyor"}
                          </td>
                          <td className="py-4 px-4 font-medium turncate max-w-[200px]">
                            {inv.description || "Hizmet Bedeli"}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {Number(inv.totalAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded uppercase">
                              {inv.status || "KESİLDİ"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GELEN FATURALAR (PLATFORM GİDERİ) */}
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/50">
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  Gelen Faturalar (Vendor / Operasyonel Giderler)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white dark:bg-transparent">
                  <thead className="text-slate-500 border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="py-3 px-4">Tarih</th>
                      <th className="py-3 px-4">Fatura No</th>
                      <th className="py-3 px-4">Tedarikçi (Vendor)</th>
                      <th className="py-3 px-4 text-right">Tutar</th>
                      <th className="py-3 px-4 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                     {purchaseInvoices.length === 0 ? (
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td colSpan={5} className="py-8 px-4 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                           Henüz Gelen Fatura Yok
                        </td>
                      </tr>
                     ) : (
                       purchaseInvoices.map((inv) => (
                         <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="py-4 px-4 whitespace-nowrap">
                             {new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" }).format(new Date(inv.invoiceDate))}
                           </td>
                           <td className="py-4 px-4 font-mono">{inv.invoiceNo || "-"}</td>
                           <td className="py-4 px-4 font-bold">
                             {inv.supplier?.name || "Bilinmiyor"}
                           </td>
                           <td className="py-4 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                             -{Number(inv.totalAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                           </td>
                           <td className="py-4 px-4 text-center">
                             <span className="text-rose-600 font-bold text-[10px] bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded uppercase">
                               {inv.status || "ÖDENDİ"}
                             </span>
                           </td>
                         </tr>
                       ))
                     )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* EXISTING: TİCARET GEÇMİŞİ */}
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]/50">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Gerçek Zamanlı Network İşlemleri (Trade Ledger)
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                Son tamamlanan blok ticaretlerinin ham platform kayıtları.
              </p>
            </div>
          </div>

          <div className="p-0">
            {recentLedgers.length === 0 ? (
              <div className="p-16 text-center">
                <span className="text-4xl text-slate-400">⛓️</span>
                <h3 className="font-semibold text-slate-900 dark:text-white mt-4">
                  Henüz İşlem Yok
                </h3>
                <p className="text-slate-500 text-sm mt-2">
                  Platform üzerinde onaylanıp Ledger'a yazılmış bir B2B ticareti
                  bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th className="px-6 py-4">Tarih</th>
                      <th className="px-6 py-4">Ledger ID / Hash</th>
                      <th className="px-6 py-4">Teklif (Proposal)</th>
                      <th className="px-6 py-4 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {recentLedgers.map((l) => (
                      <tr
                        key={l.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {new Intl.DateTimeFormat("tr-TR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(l.recordedAt))}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {l.id.substring(0, 16)}...
                        </td>
                        <td className="px-6 py-4">
                          {(l.metaJson as any)?.type ||
                            l.proposalId ||
                            "B2B Trade"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
