"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Package, CreditCard, ShieldCheck, Zap, AlertTriangle, FileText, Landmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from "@/contexts/ModalContext";

export default function TenantNetworkDashboard() {
    const { currentUser, hasPermission } = useApp();
    const router = useRouter();

    const isSystemAdmin = currentUser === null || currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

    // @ts-ignore
    const isBuyer = isSystemAdmin || hasPermission('supplier_view') || currentUser?.type === 'buying';
    // @ts-ignore
    const isSeller = isSystemAdmin || hasPermission('sales_archive') || currentUser?.type === 'selling';

    const [earningsData, setEarningsData] = useState<any>(null);
    const [billingData, setBillingData] = useState<any>(null);
    const [ordersData, setOrdersData] = useState<any>({ buyerPending: 0, buyerEscrow: 0, sellerPending: 0, sellerEscrow: 0 });
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Sadece mevcut API'lerden derliyoruz:
                const [earnRes, billRes, oppRes] = await Promise.all([
                    fetch('/api/dealer-network/earnings').catch(() => null),
                    fetch('/api/billing/boost-invoices').catch(() => null),
                    fetch('/api/network/trade-opportunities').catch(() => null)
                ]);

                if (oppRes?.ok) {
                    const oData = await oppRes.json();
                    if (oData.success) {
                        setOpportunities(oData.opportunities || []);
                    }
                }

                if (earnRes?.ok) {
                    const eData = await earnRes.json();
                    setEarningsData(eData);
                }

                if (billRes?.ok) {
                    const bData = await billRes.json();
                    setBillingData(bData);
                }

                // Simulate/approximate order metrics from existing earnings API items if actual order API is missing
                // Or try checking API orders if exists
                const ordRes = await fetch('/api/dealer-network/orders').catch(() => null);
                if (ordRes?.ok) {
                    const oData = await ordRes.json();
                    // Just count them
                    const sp = (oData.items || []).filter((i: any) => i.role === 'SELLER' && i.status === 'PENDING').length;
                    const se = (oData.items || []).filter((i: any) => i.role === 'SELLER' && i.status === 'ESCROW').length;
                    const bp = (oData.items || []).filter((i: any) => i.role === 'BUYER' && i.status === 'PENDING').length;
                    const be = (oData.items || []).filter((i: any) => i.role === 'BUYER' && i.status === 'ESCROW').length;
                    setOrdersData({ buyerPending: bp, buyerEscrow: be, sellerPending: sp, sellerEscrow: se });
                } else {
                    // Fallback to zeros as per user request to clean demo data
                    setOrdersData({ buyerPending: 0, buyerEscrow: 0, sellerPending: 0, sellerEscrow: 0 });
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const hasBoostIssue = billingData?.health?.status === 'OVERDUE' || billingData?.health?.status === 'GRACE';
    const hasPayoutIssue = earningsData?.kpis?.payoutPaused; // hypothetically from earnings

    if (loading) {
        return <div className="p-20 text-center font-bold text-slate-400">Yükleniyor...</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 xl:p-12 relative font-sans min-h-screen dark:bg-[#0f172a]" style={{ scrollbarWidth: 'none' }}>
            <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
            <div className="max-w-[1400px] mx-auto space-y-8 pb-24">

                {/* HEADERS & BANNERS */}
                <div className="mb-6 xl:mb-8">
                    <h1 className="text-[32px] sm:text-[40px] font-[700] tracking-tight text-[#0F172A] dark:text-white leading-tight mb-1">
                        B2B Network Paneli
                    </h1>
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full">
                        Satış, tedarik ve finansal durumunuzun özeti
                    </p>
                </div>

                {hasBoostIssue && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 p-5 rounded-[24px] flex items-center justify-between shadow-sm transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <div className="font-bold text-orange-800 dark:text-orange-400 text-[15px]">Gecikmiş Fatura</div>
                                <div className="text-[13px] text-orange-700 dark:text-orange-500/80 mt-0.5">Ödenmemiş faturalarınız bulunuyor. Görünürlüğünüz kısıtlanmış olabilir.</div>
                            </div>
                        </div>
                        <span className="text-[12px] font-bold bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-xl">Öde &rarr;</span>
                    </div>
                )}

                {/* TRADE OPPORTUNITIES WIDGET */}
                {opportunities.length > 0 && (
                    <div className="mb-6 xl:mb-8 space-y-4">
                        <h2 className="text-[17px] font-bold text-[#0F172A] dark:text-slate-100 border-b border-[#0F172A]/[0.06] dark:border-white/5 pb-3 flex items-center gap-2">
                            <span className="text-xl">🎯</span> Trade Opportunities (AI Matches)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {opportunities?.map((opp: any) => (
                                <div key={opp.id} className="p-5 rounded-[24px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 hover:shadow-sm transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${opp.signalType === 'OVERSTOCK' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
                                            {opp.signalType?.replace('_', ' ')}
                                        </div>
                                        <div className="text-[12px] font-bold text-slate-600 dark:text-slate-400">
                                            {Math.round(opp.confidence)}% Match
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-[#0F172A] dark:text-white line-clamp-1">{opp.supplierProfile?.displayName || opp.buyerProfile?.displayName}</h3>
                                    <p className="text-[13px] text-slate-500 mt-1 mb-4">Kategori: {opp.categoryId}</p>
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-white dark:bg-slate-800 text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl py-2 shadow-sm text-slate-700 dark:text-slate-200 min-w-0" onClick={() => router.push(`/network/profile?id=${opp.supplierProfile?.id || opp.buyerProfile?.id}`)}>İncele</button>
                                        <button className="flex-1 bg-indigo-600 text-white text-sm font-bold rounded-xl py-2 shadow-sm hover:bg-indigo-700 min-w-0" onClick={() => {
                                            fetch(`/api/network/opportunities/${opp.id}/generate-rfq`, { method: 'POST' })
                                                .then(res => res.json())
                                                .then(data => {
                                                    const { showSuccess, showError, showWarning } = useModal();
                                                    if (data.success) showSuccess("Bilgi", 'Auto RFQ Draft Generated!');
                                                    else showError("Uyarı", 'Error: ' + data.error);
                                                });
                                        }}>Auto RFQ</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* IF SELLER: SELLER DASHBOARD */}
                {isSeller && (
                    <div className="space-y-4">
                        <h2 className="text-[17px] font-bold text-[#0F172A] dark:text-slate-100 border-b border-[#0F172A]/[0.06] dark:border-white/5 pb-3">📦 Satıcı Görünümü (Seller)</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Box 1 */}
                            <div className="bg-white dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:hover:shadow-sm hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-[16px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bekleyen Sipariş</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">{ordersData.sellerPending}</div>
                                </div>
                            </div>

                            {/* Box 2 */}
                            <div className="bg-white dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:hover:shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all cursor-pointer flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-[16px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Kullanılabilir Bakiye</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">
                                        ₺{Number(earningsData?.kpis?.releasedLast30dNetTotal || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Box 3 */}
                            <div className="bg-white dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:hover:shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-[16px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Escrow'da Bekleyen</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">
                                        ₺{Number(earningsData?.kpis?.pendingNetTotal || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Box 4 */}
                            <div className="bg-white dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:hover:shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 transition-all cursor-pointer flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-[16px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Trust Tier</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">TİER A</div>
                                </div>
                            </div>

                            {/* Box 5 */}
                            <div className="bg-white dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:hover:shadow-sm hover:border-fuchsia-400 dark:hover:border-fuchsia-500/50 transition-all cursor-pointer flex items-center gap-4 group" onClick={() => router.push('/seller/boost')}>
                                <div className="w-14 h-14 rounded-[16px] bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Boost Kullanımı</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">{billingData?.items?.length || 0} Aktif</div>
                                </div>
                            </div>

                            {/* Box 6 */}
                            <div className="bg-white dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-[#0F172A]/[0.06] dark:border-white/5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:hover:shadow-sm hover:border-red-400 dark:hover:border-red-500/50 transition-all cursor-pointer flex items-center gap-4 group" onClick={() => router.push('/support/tickets')}>
                                <div className="w-14 h-14 rounded-[16px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Aktif Dispute</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">0</div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* IF BUYER: BUYER DASHBOARD */}
                {isBuyer && (
                    <div className="space-y-4 pt-4">
                        <h2 className="text-[17px] font-bold text-[#0F172A] dark:text-slate-100 border-b border-[#0F172A]/[0.06] dark:border-white/5 pb-3">🛒 Tedarik & Keşif (Buyer)</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Box 1 */}
                            <div className="bg-slate-50 dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-slate-200/60 dark:border-[#1E293B] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.2)] hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-[16px] bg-blue-100 dark:bg-slate-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Verilen Siparişler</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">{ordersData.buyerPending}</div>
                                </div>
                            </div>

                            {/* Box 2 */}
                            <div className="bg-slate-50 dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-slate-200/60 dark:border-[#1E293B] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.2)] hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all cursor-pointer flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-[16px] bg-emerald-100 dark:bg-slate-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Aylık Harcama (30D)</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">₺0</div>
                                </div>
                            </div>

                            {/* Box 3 */}
                            <div className="bg-slate-50 dark:bg-[#0f172a] p-[24px] rounded-[24px] border border-slate-200/60 dark:border-[#1E293B] shadow-sm dark:shadow-[0_6px_18px_rgba(0,0,0,0.2)] hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex items-center gap-4 group" onClick={() => router.push('/contracts')}>
                                <div className="w-14 h-14 rounded-[16px] bg-indigo-100 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Aktif Sözleşmeler</div>
                                    <div className="text-[24px] font-black text-[#0F172A] dark:text-white mt-1 leading-none group-hover:translate-x-1 transition-transform">0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!isBuyer && !isSeller && (
                    <div className="p-[48px] text-center bg-white dark:bg-[#0f172a] border border-dashed rounded-[24px] border-slate-300 dark:border-slate-700">
                        <div className="text-slate-500 dark:text-slate-400 font-bold mb-2">Platform yetkilendirmesi bulunamadı.</div>
                        <div className="text-[14px] text-slate-500">Bu alan ağ (B2B) panelidir. Sistem yöneticiniz ile görüşüp satıcı/alıcı onayı alabilirsiniz.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
