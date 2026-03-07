"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseButton,
    EnterpriseEmptyState
} from '@/components/ui/enterprise';
import { Search, Building2, UserPlus, Filter, X } from 'lucide-react';
import { TURKISH_CITIES } from '@/lib/constants';
import Link from 'next/link';

export default function NetworkDiscoverPage() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [companies, setCompanies] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, cityFilter, sectorFilter]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (searchTerm) query.set('q', searchTerm);
            if (cityFilter) query.set('city', cityFilter);
            if (sectorFilter) query.set('sector', sectorFilter);

            const [compRes, recRes] = await Promise.all([
                fetch(`/api/network/discover?${query.toString()}`),
                fetch(`/api/network/recommendations`)
            ]);

            const compData = await compRes.json();
            const recData = await recRes.json();

            if (compRes.ok) {
                setCompanies(compData.companies || []);
            } else {
                showError("Hata", compData.error || "Şirketler yüklenirken hata oluştu.");
            }

            if (recRes.ok) {
                setRecommendations(recData.recommendations || []);
            }

        } catch (error) {
            showError("Hata", "Ağ hatası.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendInvite = (targetTenantId: string, companyName: string) => {
        // Quick workaround instead of full form: we will default to 'SUPPLIER' or prompt user using confirm for now
        // In real app we'd open a modal to select type. Let's send a generic type.
        showConfirm(
            'Bağlantı Kur',
            `${companyName} firmasına bağlantı isteği göndermek istiyor musunuz? Varsayılan olarak TEDARİKÇİ (SUPPLIER) tipinde gönderilecektir.`,
            async () => {
                try {
                    const res = await fetch('/api/network/invitations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            toTenantId: targetTenantId,
                            proposedRelationshipType: 'SUPPLIER',
                            message: 'Merhaba, ağınıza katılmak istiyoruz.'
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    showSuccess('Başarılı', `${companyName} firmasına davet iletildi.`);
                    // Ideally we refresh list to disable button or visually update
                } catch (err: any) {
                    showError('Hata', err.message || 'Davet gönderilemedi.');
                }
            }
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        setCityFilter('');
        setSectorFilter('');
    };

    return (
        <EnterprisePageShell
            title="Ağ Keşif Motoru"
            description="Hub içerisindeki firmaları keşfedin ve ticaret grafiğinizi büyütün."
        >
            <EnterpriseCard noPadding className="mb-6 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <EnterpriseInput
                            className="pl-9"
                            placeholder="Şirket adı veya sektör ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <EnterpriseSelect value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                            <option value="">Tüm Şehirler</option>
                            {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </EnterpriseSelect>
                    </div>
                    <div className="w-full md:w-1/4">
                        <EnterpriseInput
                            placeholder="Sektör (örn: Lojistik)"
                            value={sectorFilter}
                            onChange={(e) => setSectorFilter(e.target.value)}
                        />
                    </div>
                    {(searchTerm || cityFilter || sectorFilter) && (
                        <EnterpriseButton variant="secondary" onClick={resetFilters} className="shrink-0 px-3">
                            <X className="w-4 h-4" /> Temizle
                        </EnterpriseButton>
                    )}
                </div>
            </EnterpriseCard>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <EnterpriseCard key={i} className="h-48 animate-pulse bg-slate-50 dark:bg-slate-800" />
                    ))}
                </div>
            ) : (
                <>
                    {recommendations.length > 0 && !searchTerm && !cityFilter && !sectorFilter && (
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <span className="text-xl">✨</span> Sizin İçin Önerilenler
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommendations.map(rec => {
                                    const c = rec.targetProfile;
                                    const score = c.trustScore?.score || 0;
                                    const badgeStr = c.trustScore?.badge || 'UNVERIFIED';
                                    const completion = c.profileCompleteness || 0;
                                    let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                                    if (badgeStr === 'VERIFIED_BUSINESS') badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';

                                    return (
                                        <EnterpriseCard key={c.id} className="flex flex-col gap-4 border-emerald-100 dark:border-emerald-900 shadow-sm hover:shadow-md bg-emerald-50/30 dark:bg-emerald-900/10">
                                            <div className="flex justify-between items-start">
                                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                                                    <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-1 text-[9px] font-bold rounded tracking-widest uppercase border ${badgeColor}`}>
                                                        {badgeStr.replace('_', ' ')}
                                                    </span>
                                                    <div className="text-[10px] text-slate-500 mt-1">Match Score: <b>{Math.round(rec.score)}</b></div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">{c.displayName}</h3>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{rec.reason}</p>
                                            </div>
                                            <EnterpriseButton variant="secondary" className="w-full justify-center mt-auto" onClick={() => handleSendInvite(c.tenantId, c.displayName)}>
                                                <UserPlus className="w-4 h-4 mr-2" /> Bağlantı Kur
                                            </EnterpriseButton>
                                        </EnterpriseCard>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{searchTerm || cityFilter || sectorFilter ? 'Arama Sonuçları' : 'Keşfet'}</h2>
                        {companies.length === 0 ? (
                            <EnterpriseCard noPadding className="p-12">
                                <EnterpriseEmptyState
                                    icon={<Building2 />}
                                    title="Firma Bulunamadı"
                                    description="Arama kriterlerinize uygun, bağlantı kurabileceğiniz discoverable bir şirket bulunamadı."
                                    action={<EnterpriseButton variant="primary" onClick={resetFilters}>Filtreleri Temizle</EnterpriseButton>}
                                />
                            </EnterpriseCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {companies.map(c => {
                                    const score = c.trustScore?.score || 0;
                                    const badgeStr = c.trustScore?.badge || 'UNVERIFIED';
                                    const completion = c.profileCompleteness || 0;
                                    const relCount = (c._count?.sourceRelationships || 0) + (c._count?.targetRelationships || 0);

                                    let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                                    if (badgeStr === 'VERIFIED_BUSINESS') badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                    else if (badgeStr === 'TRUSTED_PARTNER') badgeColor = 'bg-sky-100 text-sky-700 border-sky-200';
                                    else if (badgeStr === 'ACTIVE_TRADER') badgeColor = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                    else if (badgeStr === 'NEW_MEMBER') badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';

                                    return (
                                        <EnterpriseCard key={c.id} className="flex flex-col gap-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                    <Building2 className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        {c.verificationStatus === 'VERIFIED' && (
                                                            <span title="Doğrulanmış B2B Üyesi" className="w-5 h-5 bg-emerald-100 text- emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                                                        )}
                                                        <span className={`px-2 py-1 text-[9px] font-bold rounded tracking-widest uppercase border ${badgeColor}`}>
                                                            {badgeStr.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                        Score: <span className={score >= 70 ? 'text-emerald-600' : 'text-slate-700'}>{score}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight mb-1">{c.displayName}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {c.shortDescription || 'Bu firma hakkında kısa bir açıklama bulunmuyor.'}
                                                </p>
                                            </div>

                                            <div className="mt-2 space-y-2">
                                                {/* Profile completion bar */}
                                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                                                    <span>Profil Doluluğu</span>
                                                    <span>{completion}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${completion > 80 ? 'bg-emerald-500' : completion > 50 ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${completion}%` }} />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-[11px] font-medium mt-auto border-t border-slate-100 dark:border-slate-800 pt-3 text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <span>📍 {c.city ? `${c.city} / ${c.country}` : 'Gzili'}</span>
                                                </div>
                                                <div className="font-semibold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded">
                                                    {relCount} Bağlantı
                                                </div>
                                            </div>

                                            <EnterpriseButton
                                                variant="secondary"
                                                className="w-full justify-center mt-2 group-hover:bg-slate-800 transition-colors"
                                                onClick={() => handleSendInvite(c.tenantId, c.displayName)}
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                İstek Gönder
                                            </EnterpriseButton>
                                        </EnterpriseCard>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </EnterprisePageShell>
    );
}
