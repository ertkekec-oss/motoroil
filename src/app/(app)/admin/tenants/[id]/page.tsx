"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";

export default function TenantDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const { showSuccess, showError, showConfirm } = useModal();
  const router = useRouter();
  const [tenant, setTenant] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null); // 'PLAN', 'TRIAL', 'STATUS'
  const [activeTab, setActiveTab] = useState<"LOGS" | "FINANCE" | "DOCS">("LOGS");
  const [kycDocs, setKycDocs] = useState<{ submissions: any[], signatures: any[] }>({ submissions: [], signatures: [] });

  // Form States
  const [selectedPlan, setSelectedPlan] = useState("");
  const [trialDays, setTrialDays] = useState(7);
  const [suspendReason, setSuspendReason] = useState("Payment Failed");

  // Plans list (Mock or API fetch)
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Fetch plans for modal
      fetch("/api/billing/plans")
        .then((r) => r.json())
        .then(setPlans)
        .catch(console.error);

      // Fetch Tenant Details
      try {
        const res = await fetch(`/api/admin/tenants/${params.id}`);
        const data = await res.json();
        if (data.tenant) {
          setTenant(data.tenant);
          setUsage(data.usage);
          setHistory(data.history);
          setErrors(data.errors);
          setSelectedPlan(data.tenant.subscription?.planId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }

      // Fetch KYC Documents
      try {
        const docRes = await fetch(`/api/admin/kyc/submissions?tenantId=${params.id}`);
        const docData = await docRes.json();
        if (docData.success) {
            setKycDocs({ submissions: docData.submissions || [], signatures: docData.signatures || [] });
        }
      } catch (e) {
          console.error(e);
      }
    };
    loadData();
  }, [params.id]);

  const handleAction = async (action: string, payload: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${params.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (res.status === 200) {
        showSuccess("Başarılı", "İşlem Başarılı");
        window.location.reload();
      } else {
        showError("Hata", "Hata: " + data.error);
      }
    } catch (e: any) {
      showError("Hata", "Sistem Hatası: " + e.message);
    } finally {
      setActionLoading(false);
      setShowModal(null);
    }
  };

  if (loading)
    return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
  if (!tenant)
    return (
      <div className="p-8 text-center text-red-500">Tenant bulunamadı.</div>
    );

  const sub = tenant.subscription;
  const plan = sub?.plan;

  // Calculate Usage Percent
  const invoiceLimit =
    plan?.limits?.find((l: any) => l.resource === "monthly_documents")?.limit ||
    0;
  const invoiceUsage = usage?.currentMonthInvoices || 0;
  const invoicePercent =
    invoiceLimit > 0 ? (invoiceUsage / invoiceLimit) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. HERO SECTION */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {tenant.name}
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                sub?.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : sub?.status === "PAST_DUE"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {sub?.status}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit">
            <span>{tenant.id}</span>
            <button
              className="text-blue-500 hover:underline text-xs"
              onClick={() => navigator.clipboard.writeText(tenant.id)}
            >
              (Kopyala)
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {tenant.ownerEmail} • {plan?.name || "No Plan"} ({sub?.period})
          </p>
        </div>

        <div className="flex gap-2">
          {sub?.status !== "SUSPENDED" && (
            <button
              onClick={() => setShowModal("STATUS_SUSPEND")}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition shadow-sm"
            >
              🔴 Suspend
            </button>
          )}
          {sub?.status === "SUSPENDED" && (
            <button
              onClick={() => handleAction("SET_STATUS", { status: "ACTIVE" })}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
            >
              🟢 Activate
            </button>
          )}
          <button
            onClick={() => setShowModal("TRIAL")}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            ⏳ Trial Uzat
          </button>
          <button
            onClick={() => setShowModal("PLAN")}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm"
          >
            🔁 Plan Değiştir
          </button>
        </div>
      </div>

      {/* 2. QUOTA DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-slate-500">Aylık Fatura</h3>
            <span className="text-xs text-slate-400">{plan?.interval}</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900">
              {invoiceUsage}
            </span>
            <span className="text-sm text-slate-400 mb-1">
              / {invoiceLimit === -1 ? "∞" : invoiceLimit}
            </span>
          </div>
          {invoiceLimit > 0 && (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${invoicePercent > 90 ? "bg-red-500" : invoicePercent > 75 ? "bg-amber-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min(100, invoicePercent)}%` }}
              />
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-slate-500">Kullanıcılar</h3>
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900">
              {tenant.users?.length || 0}
            </span>
            {/* Find User limit */}
            <span className="text-sm text-slate-400 mb-1">
              /{" "}
              {plan?.limits?.find((l: any) => l.resource === "users")?.limit ||
                0}
            </span>
          </div>
        </div>

        {/* Companies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-slate-500">Şirketler</h3>
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-900">
              {tenant.companies?.length || 0}
            </span>
            <span className="text-sm text-slate-400 mb-1">
              /{" "}
              {plan?.limits?.find((l: any) => l.resource === "companies")
                ?.limit || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SYSTEM STATUS & LOGS / FINANCE TABS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="border-b border-slate-100 flex items-center bg-slate-50">
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === "LOGS" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            Sistem Logları & Geçmiş
          </button>
          <button
            onClick={() => setActiveTab("DOCS")}
            className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === "DOCS" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            Evraklar & Sözleşmeler
          </button>
          <button
            onClick={() => setActiveTab("FINANCE")}
            className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === "FINANCE" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            Finans İşlemleri & Cari Ekstre
            <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full tracking-widest uppercase">
              Yeni
            </span>
          </button>
        </div>

        {activeTab === "DOCS" && (
            <div className="p-6 animate-in fade-in zoom-in-95 duration-300">
             <div className="mb-6">
                <h4 className="text-base font-black text-slate-900">Müşteri Sözleşmeleri</h4>
                <p className="text-xs text-slate-500 mt-1">Bu müşterinin platformda onayladığı dijital yasal metinler.</p>
             </div>
             
             {kycDocs.signatures.length === 0 ? (
                 <div className="bg-slate-50 text-slate-500 text-sm p-4 rounded-xl border border-slate-200 text-center mb-8">Henüz imzalanmış bir sözleşme bulunmuyor.</div>
             ) : (
                 <div className="overflow-x-auto border border-slate-200 rounded-xl mb-8">
                    <table className="w-full text-left text-xs bg-white">
                        <thead className="text-slate-500 border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="py-3 px-4">Kullanıcı / IP</th>
                                <th className="py-3 px-4">Sözleşme</th>
                                <th className="py-3 px-4">İmzalanma Tarihi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {kycDocs.signatures.map(sig => (
                                <tr key={sig.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="font-bold">{sig.user?.name || sig.user?.email || sig.userId}</div>
                                        <div className="text-[10px] text-slate-500">{sig.ipAddress}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-semibold text-blue-600">{sig.contract?.title}</div>
                                        <div className="text-[10px] text-slate-500">Versiyon: {sig.version}</div>
                                    </td>
                                    <td className="py-3 px-4 text-emerald-600 font-medium">
                                        {new Date(sig.signedAt).toLocaleString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
             )}

             <div className="mb-6">
                <h4 className="text-base font-black text-slate-900">Modül Başvuruları & Evraklar</h4>
                <p className="text-xs text-slate-500 mt-1">Gatekeeper (KYC) sisteminden yüklenen vergi levhası vb. dokümanlar.</p>
             </div>
             {kycDocs.submissions.length === 0 ? (
                 <div className="bg-slate-50 text-slate-500 text-sm p-4 rounded-xl border border-slate-200 text-center">Henüz modül başvurusu veya evrak bulunmuyor.</div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {kycDocs.submissions.map(sub => (
                        <div key={sub.id} className="bg-white border text-sm border-slate-200 p-4 rounded-xl flex items-start gap-4">
                            <div className={`p-3 rounded-xl flex-shrink-0 ${sub.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500 tracking-wider mb-1 inline-block">{sub.requirement?.moduleId}</span>
                                <h5 className="font-bold text-slate-800">{sub.requirement?.name}</h5>
                                <div className="text-xs text-slate-500 mt-1">Yükleyen: {sub.user?.name || sub.user?.email || sub.userId}</div>
                                <div className="text-xs text-slate-500">Tarih: {new Date(sub.createdAt).toLocaleDateString('tr-TR')}</div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : sub.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {sub.status === 'APPROVED' ? 'ONAYLANDI' : sub.status === 'PENDING' ? 'BEKLİYOR' : 'REDDEDİLDİ'}
                                    </span>
                                    {sub.documentUrl && (
                                        <a href={sub.documentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 underline">İndir / Görüntüle</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}
            </div>
        )}

        {activeTab === "LOGS" && (
          <div className="p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              Son Hatalar (External Requests)
            </h4>
            <div className="overflow-x-auto mb-8 border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs bg-white">
                <thead className="text-slate-500 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4">Payload/Error</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {errors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-slate-400 font-medium"
                      >
                        Hata kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    errors?.map((err) => (
                      <tr key={err.id}>
                        <td className="py-3 px-4">
                          {new Date(err.updatedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold">{err.provider}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {err.entityId}
                        </td>
                        <td className="py-3 px-4 truncate max-w-xs">
                          {JSON.stringify(err.responsePayload)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-red-100 text-red-600 font-bold rounded">
                            {err.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-3">
              Abonelik Değişimleri
            </h4>
            <ul className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              {history.length === 0 ? (
                <li className="text-sm text-slate-400 font-medium">
                  Kayıt yok.
                </li>
              ) : (
                history?.map((h) => (
                  <li key={h.id} className="text-sm flex gap-3 items-center">
                    <span className="text-slate-500 font-mono text-xs">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                      {h.action}
                    </span>
                    <span className="text-slate-600">
                      Plan changed from{" "}
                      <strong className="text-slate-800">{h.prevPlanId}</strong>{" "}
                      to{" "}
                      <strong className="text-blue-600">{h.newPlanId}</strong>
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {activeTab === "FINANCE" && (
          <div className="p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  Platform İçi Finansal Cari (Ledger)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Bu tenanta ait B2B komisyonları, paket satın alımları ve
                  Sendeo kargo maliyetleri bu ekrana düşer.
                </p>
              </div>
              <button className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                Toplu Fatura Kes (Mutabakat)
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs bg-white">
                <thead className="text-slate-500 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">İşlem Tipi</th>
                    <th className="py-3 px-4">Açıklama / Referans</th>
                    <th className="py-3 px-4 text-right">Tutar (KDV Dahil)</th>
                    <th className="py-3 px-4 text-center">Ödeme Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      Bugün, 14:30
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-bold tracking-widest">
                        SMS PAKETİ
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900">
                      10.000 Kredi (PayTR Checkout ile)
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600">
                      +1.250,00 ₺
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded">
                        TAHSİL EDİLDİ
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">Dün, 09:15</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold tracking-widest">
                        B2B KOMİSYON
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900">
                      Sipariş #ORD-991 B2B Escrow İade Kesintisi (%10)
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-rose-600">
                      -4.500,00 ₺
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        FATURA BEKLİYOR
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">24.03.2026</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded text-[10px] font-bold tracking-widest">
                        LOJİSTİK
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900">
                      Sendeo Kargo Maliyeti + %10 Marj Yansıması (Desi: 12)
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-rose-600">
                      -320,00 ₺
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        FATURA BEKLİYOR
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">15.03.2026</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold tracking-widest">
                        SAAS PLAN
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-900">
                      Periodya Pro Plan - Aylık Yenileme Tahsilatı
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600">
                      +2.500,00 ₺
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-1 rounded">
                        TAHSİL EDİLDİ
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {showModal === "PLAN" && (
              <>
                <h3 className="text-lg font-bold mb-4">Plan Değiştir</h3>
                <div className="space-y-2 mb-6">
                  {plans?.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${selectedPlan === p.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={selectedPlan === p.id}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {p.price} {p.currency} / {p.interval}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() =>
                      handleAction("CHANGE_PLAN", { planId: selectedPlan })
                    }
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? "..." : "Planı Güncelle"}
                  </button>
                </div>
              </>
            )}

            {showModal === "TRIAL" && (
              <>
                <h3 className="text-lg font-bold mb-4">Trial Süresini Uzat</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Mevcut bitiş tarihine seçilen gün kadar eklenir.
                </p>
                <div className="flex gap-2 mb-6">
                  {[3, 7, 14, 30]?.map((d) => (
                    <button
                      key={d}
                      onClick={() => setTrialDays(d)}
                      className={`flex-1 py-2 border rounded-lg ${trialDays === d ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      +{d} Gün
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() =>
                      handleAction("EXTEND_TRIAL", { days: trialDays })
                    }
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? "..." : "Süreyi Uzat"}
                  </button>
                </div>
              </>
            )}

            {showModal === "STATUS_SUSPEND" && (
              <>
                <h3 className="text-lg font-bold mb-4 text-red-600">
                  Hesabı Askıya Al
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Bu işlem müşterinin giriş yapmasını ve API kullanmasını
                  engeller.
                </p>
                <select
                  className="w-full border p-2 rounded mb-6"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                >
                  <option value="Payment Failed">Ödeme Alınamadı</option>
                  <option value="Policy Violation">Kullanım İhlali</option>
                  <option value="Other">Diğer</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(null)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() =>
                      handleAction("SET_STATUS", {
                        status: "SUSPENDED",
                        reason: suspendReason,
                      })
                    }
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? "..." : "Hesabı Dondur"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
