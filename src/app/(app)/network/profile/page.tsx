"use client";

import React, { useEffect, useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import {
    EnterprisePageShell,
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseInput,
    EnterpriseTextarea,
    EnterpriseSelect,
    EnterpriseButton,
    EnterpriseSwitch
} from '@/components/ui/enterprise';
import { Building2, Save } from 'lucide-react';
import { TURKISH_CITIES } from '@/lib/constants';

export default function NetworkProfilePage() {
    const { showSuccess, showError } = useModal();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [profile, setProfile] = useState<any>({
        displayName: '',
        legalName: '',
        shortDescription: '',
        longDescription: '',
        website: '',
        email: '',
        phone: '',
        country: 'Turkey',
        city: '',
        sectors: [],
        capabilities: [],
        visibilityLevel: 'PRIVATE',
        isPublicListingEnabled: false,
        isDiscoveryEnabled: false,
        verificationStatus: 'UNVERIFIED'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/network/profile');
            const data = await res.json();
            if (data.profile) {
                setProfile({
                    ...data.profile,
                    sectors: data.profile.sectors || [],
                    capabilities: data.profile.capabilities || [],
                    country: data.profile.country || 'Turkey'
                });
            }
        } catch (error) {
            showError("Hata", "Profil bilgileri alınamadı.");
        } finally {
            setIsLoading(false);
            setHasUnsavedChanges(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/network/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            const data = await res.json();

            if (!res.ok) {
                showError("Hata", data.error || "Profil güncellenemedi.");
                return;
            }

            showSuccess("Başarılı", "Network profili güncellendi.");
            setHasUnsavedChanges(false);
        } catch (error) {
            showError("Hata", "Bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setProfile((prev: any) => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true);
    };

    if (isLoading) {
        return (
            <EnterprisePageShell title="Network Profili">
                <EnterpriseCard><div className="h-64 animate-pulse bg-slate-100  rounded-lg" /></EnterpriseCard>
            </EnterprisePageShell>
        );
    }

    const verificationBadgeColors: Record<string, string> = {
        'UNVERIFIED': 'bg-slate-100 text-slate-600',
        'PENDING': 'bg-amber-100 text-amber-700',
        'VERIFIED': 'bg-emerald-100 text-emerald-700',
        'RESTRICTED': 'bg-rose-100 text-rose-700'
    };

    return (
        <EnterprisePageShell
            title="Şirket Network Profili"
            description="B2B Ağı içerisindeki herkese açık görünümünüzü yönetin."
            actions={
                <div className="flex gap-3 items-center">
                    {hasUnsavedChanges && <span className="text-xs font-semibold text-amber-500">Değişiklikler kaydedilmedi</span>}
                    <EnterpriseButton variant="primary" onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </EnterpriseButton>
                </div>
            }
        >
            <EnterpriseCard>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-100  border border-slate-200  flex items-center justify-center">
                            {/* Logo Placeholder */}
                            <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900  leading-tight">
                                {profile.displayName || 'İsimsiz Şirket'}
                            </h2>
                            <p className="text-sm text-slate-500 ">Hub Kimliği: {profile.slug}</p>
                            <div className="flex gap-4 mt-2 border-t border-slate-100  pt-2">
                                <div className="text-xs font-semibold text-slate-600 ">
                                    Trust Score: <span className="text-slate-900  ml-1">{profile.trustScore?.score || 0}</span>
                                </div>
                                <div className="text-xs font-semibold text-slate-600 ">
                                    Profil Doluluğu: <span className="text-slate-900  ml-1">%{(profile as any).profileCompleteness || 0}</span>
                                </div>
                                <div className="text-xs font-semibold text-slate-600 ">
                                    Bağlantı Sayısı: <span className="text-slate-900  ml-1">{((profile as any)._count?.sourceRelationships || 0) + ((profile as any)._count?.targetRelationships || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${verificationBadgeColors[profile.verificationStatus] || 'bg-slate-100 text-slate-600'}`}>
                            {profile.verificationStatus}
                        </span>
                        {profile.trustScore?.badge && (
                            <span className="px-3 py-1 text-[10px] font-bold bg-slate-100  text-slate-700  rounded uppercase tracking-wider">
                                {profile.trustScore.badge.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 ">
                    <div className="space-y-4">
                        <EnterpriseSectionHeader title="Temel Bilgiler" subtitle="Firma unvanı ve iletişim verileri." />
                        <EnterpriseInput
                            label="Görünen Ad (Display Name)"
                            value={profile.displayName}
                            onChange={(e) => handleChange('displayName', e.target.value)}
                            placeholder="Örn: Periodya Teknoloji"
                        />
                        <EnterpriseInput
                            label="Resmi Unvan (Legal Name)"
                            value={profile.legalName || ''}
                            onChange={(e) => handleChange('legalName', e.target.value)}
                            placeholder="Sadece bağlantılı olanlara gösterilebilir"
                        />
                        <EnterpriseTextarea
                            label="Kısa Açıklama"
                            value={profile.shortDescription || ''}
                            onChange={(e) => handleChange('shortDescription', e.target.value)}
                            placeholder="Bir veya iki cümlelik şirket özeti"
                        />
                        <EnterpriseInput
                            label="E-Posta"
                            type="email"
                            value={profile.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                        />
                        <EnterpriseInput
                            label="Telefon"
                            value={profile.phone || ''}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                        <EnterpriseInput
                            label="Web Sitesi"
                            value={profile.website || ''}
                            onChange={(e) => handleChange('website', e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <EnterpriseInput
                                label="Ülke"
                                value={profile.country || 'Turkey'}
                                onChange={(e) => handleChange('country', e.target.value)}
                                disabled
                            />
                            <EnterpriseSelect
                                label="Şehir"
                                value={profile.city || ''}
                                onChange={(e) => handleChange('city', e.target.value)}
                            >
                                <option value="">Şehir Seçin</option>
                                {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </EnterpriseSelect>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <EnterpriseSectionHeader title="Görünürlük ve Keşif" subtitle="Diğer tenant'lara ağ içerisinde nasıl görüneceğinizi seçin." />
                        <EnterpriseSelect
                            label="Görünürlük Seviyesi"
                            value={profile.visibilityLevel}
                            onChange={(e) => handleChange('visibilityLevel', e.target.value)}
                        >
                            <option value="PRIVATE">Gizli (Sadece ID ile bulunabilir)</option>
                            <option value="NETWORK">Ağ İçi (Tüm Hub tenantları görebilir)</option>
                            <option value="PUBLIC">Herkese Açık (Dış ziyaretçiler dahil)</option>
                        </EnterpriseSelect>

                        <div className="space-y-3 pt-2">
                            <EnterpriseSwitch
                                checked={profile.isDiscoveryEnabled}
                                onChange={(e) => handleChange('isDiscoveryEnabled', e.target.checked)}
                                label="Keşif Motorunda Göster"
                                description="Diğer firmalar sizi arama sonuçlarında bulabilir."
                            />
                            <EnterpriseSwitch
                                checked={profile.isPublicListingEnabled}
                                onChange={(e) => handleChange('isPublicListingEnabled', e.target.checked)}
                                label="Herkese Açık Dizin (Public Listing)"
                                description="Profiliniz login olmayan kullanıcılara public URL üzerinden gösterilsin."
                            />
                        </div>

                        <div className="pt-4 space-y-4">
                            <EnterpriseInput
                                label="Sektörler (Bağlantı kelimeleri örn: Retail, IT)"
                                value={(profile.sectors || []).join(', ')}
                                onChange={(e) => handleChange('sectors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="Virgülle ayırarak girin..."
                            />
                            <EnterpriseTextarea
                                label="Uzun Açıklama & Yetenekler"
                                value={profile.longDescription || ''}
                                onChange={(e) => handleChange('longDescription', e.target.value)}
                                placeholder="Firma yetenekleri, tesis büyüklükleri, sertifikasyonlar vb."
                            />
                        </div>
                    </div>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
