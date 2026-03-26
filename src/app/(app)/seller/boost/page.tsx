"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FinanceStatusBanner from "@/components/FinanceStatusBanner";
import HubFinanceTabs from "@/components/network/HubFinanceTabs";
import { TrendingUp, BarChart } from "lucide-react";

export default function BoostPage() {
    const [loading, setLoading] = useState(true);
    const [boostData, setBoostData] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        fetch("/api/seller/boost")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.subscription) {
                    setBoostData({
                        planName: data.subscription.planName || "Bilinmeyen Plan",
                        status: data.subscription.status,
                        quotaMax: data.subscription.quotaTotal || 0,
                        quotaUsed: data.subscription.quotaUsed || 0,
                        renewalDate: data.subscription.renewsAt || new Date().toISOString(),
                        price: data.subscription.price || 0
                    });
                } else {
                    setBoostData(null);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const formatMoney = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
    const formatDate = (dateString: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(dateString));

    return (
        <div className="bg-slate-50  min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <HubFinanceTabs />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6">
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600 " />
                            Boost Yönetimi
                        </h1>
                        <p className="text-[13px] text-slate-500  mt-1.5 max-w-4xl">
                            B2B Katalog sponsorlu ürün gösterim paketlerinizi ve kotalarınızı yönetin.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link href="/seller/boost/analytics">
                            <button className="h-9 px-4 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900  text-white hover:bg-slate-800 :bg-indigo-700 transition-colors shadow-sm gap-2">
                                <BarChart className="w-4 h-4" /> Performans Raporu
                            </button>
                        </Link>
                    </div>
                </div>
            <FinanceStatusBanner />

            {loading ? (
                <div className="bg-white  p-6 rounded-xl border border-slate-200  shadow-sm text-center py-12 text-slate-500 ">
                    Abonelik detaylarınız yükleniyor...
                </div>
            ) : !boostData ? (
                <div className="bg-white  p-6 rounded-xl border border-slate-200  shadow-sm text-center py-12 text-slate-500 ">
                    Aktif bir Boost aboneliğiniz bulunmuyor. Yeni bir plan seçerek hemen başlayın.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Plan Card */}
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full  opacity-20"></div>
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500 rounded-full  opacity-20"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-indigo-200 font-medium uppercase tracking-wider text-xs mb-1">Mevcut Planınız</p>
                                    <h2 className="text-3xl font-extrabold tracking-tight">{boostData.planName}</h2>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${boostData.status === 'ACTIVE' ? 'bg-indigo-800/50 text-indigo-100 border-indigo-400/30' : 'bg-red-500/20 text-red-200 border-red-500/50'}`}>
                                    {boostData.status === 'ACTIVE' ? 'Aktif' : 'Askıda'}
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="text-4xl font-bold">{formatMoney(boostData.price)}</span>
                                <span className="text-indigo-200 font-medium text-sm ml-1">/ ay</span>
                            </div>

                            <div className="bg-white  rounded-2xl p-5  border border-white/10 mb-6">
                                <div className="flex justify-between text-sm mb-2 font-medium">
                                    <span className="text-indigo-100">Kota Kullanımı (Gösterim)</span>
                                    <span className="text-white">{boostData.quotaUsed.toLocaleString()} / {boostData.quotaMax.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-indigo-950/50 rounded-full h-3 mb-2 overflow-hidden border border-indigo-900">
                                    <div className="bg-gradient-to-r from-blue-400 to-indigo-400 h-3 rounded-full" style={{ width: `${(boostData.quotaUsed / boostData.quotaMax) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-indigo-300">Yenilenme Tarihi: <span className="text-indigo-100 font-semibold">{formatDate(boostData.renewalDate)}</span></p>
                            </div>

                            <Link href="/settings">
                                <button className="w-full bg-white  text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm shadow-indigo-900/50 relative overflow-hidden group">
                                    <span className="relative z-10">Planı Değiştir</span>
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* How It Works / Details */}
                    <div className="bg-white  rounded-3xl p-8 border border-slate-200  shadow-sm flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-slate-900  mb-6">Boost Sistemi Nasıl Çalışır?</h3>

                        <div className="space-y-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                                <div className="ml-4">
                                    <h4 className="text-base font-bold text-slate-800">Sponsorlu Gösterimler</h4>
                                    <p className="text-sm text-slate-600  mt-1">Belirlediğiniz ürünler, B2B Kataloğunda ve arama sonuçlarında ön sıralara çıkartılır. Tıklama değil gösterim üzerinden kota düşer.</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">2</div>
                                <div className="ml-4">
                                    <h4 className="text-base font-bold text-slate-800">Performans Takibi</h4>
                                    <p className="text-sm text-slate-600  mt-1">"Performans Raporu" sekmesinden anlık olarak hangi kategoride ne kadar etkileşim aldığınızı analiz edebilirsiniz.</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">3</div>
                                <div className="ml-4">
                                    <h4 className="text-base font-bold text-slate-800">Faturalandırma & Ödeme</h4>
                                    <p className="text-sm text-slate-600  mt-1">Abonelik ücretleriniz aylık olarak tahakkuk ettirilir ve Kazançlarınızdan (Escrow) rezerve edilebilir veya manuel ödenebilir.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
