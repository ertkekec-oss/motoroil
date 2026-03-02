import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseTextarea,
    EnterpriseButton,
    EnterpriseSectionHeader
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// Bu bileşen yalnızca UI katmanını standartlaştırır.
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Tüm prop'lar page.tsx'ten sharedProps yoluyla gelir, birebir iletilir.
// ─────────────────────────────────────────────────────────────────────────────

export default function CompanyProfileForm(props: any) {
    const {
        TURKISH_CITIES,
        TURKISH_DISTRICTS,
        tempCompanyInfo,
        setTempCompanyInfo,
        isSaving,
        handleSaveCompany,
    } = props;

    return (
        <EnterprisePageShell
            title="Kurumsal Kimlik Yönetimi"
            description="İşletmenizin resmi kimlik ve iletişim bilgileri. Bu veriler e-arşiv, teklif ve faturalarda varsayılan organizasyon bilgisi olarak görüntülenir."
        >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl">

                {/* SOL PANEL: CANLI ÖZET VE YÖNERGELER */}
                <div className="xl:col-span-1 space-y-6">
                    <EnterpriseCard>
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-105">
                                🏢
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {tempCompanyInfo?.company_name || 'FİRMA ADI GİRİLMEDİ'}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                                {tempCompanyInfo?.company_slogan || 'Slogan tanımlanmamış'}
                            </p>

                            <div className="mt-8 w-full space-y-3">
                                <div className="flex flex-col items-start text-left py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Kurumsal E-Posta</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-medium mt-0.5 w-full truncate">
                                        {tempCompanyInfo?.company_email || '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start text-left py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Genel Merkez Telefonu</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-medium mt-0.5">
                                        {tempCompanyInfo?.company_phone || '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start text-left py-2 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Web Sitesi</span>
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-0.5 truncate w-full">
                                        {tempCompanyInfo?.company_website || '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start text-left py-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Bulunduğu Konum</span>
                                    <span className="text-sm text-slate-900 dark:text-white font-medium mt-0.5">
                                        {tempCompanyInfo?.company_city ? `${tempCompanyInfo.company_city}${tempCompanyInfo.company_district ? ` / ${tempCompanyInfo.company_district}` : ''}` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-4">
                            <span className="text-2xl mt-0.5">💡</span>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Şube Mantığı</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                    Sistem belgelerinde varsayılan bilgiler bu profilden alınır. İşletmenizin ek şubeleri varsa, fatura keserken "Şubeler ve Depo" ekranındaki spesifik şube adresleri önceliklendirilir.
                                </p>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* SAĞ PANEL: DETAYLI FORM ALANLARI */}
                <div className="xl:col-span-2 space-y-6">
                    <EnterpriseCard>
                        <EnterpriseSectionHeader
                            title="Temel Kimlik Bilgileri"
                            subtitle="Kamu kurumları ve müşterilerinize görünen resmi unvan."
                        />
                        <div className="space-y-6">
                            <EnterpriseField label="FİRMA ADI / RESMİ UNVAN">
                                <EnterpriseInput
                                    type="text"
                                    value={tempCompanyInfo?.company_name || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTempCompanyInfo({ ...tempCompanyInfo, company_name: e.target.value })
                                    }
                                    placeholder="Örn: MOTOROIL MADENİ YAĞLAR SAN. VE TİC. LTD. ŞTİ."
                                />
                            </EnterpriseField>

                            <EnterpriseField label="SLOGAN VEYA KISA AÇIKLAMA">
                                <EnterpriseInput
                                    type="text"
                                    value={tempCompanyInfo?.company_slogan || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTempCompanyInfo({ ...tempCompanyInfo, company_slogan: e.target.value })
                                    }
                                    placeholder="Örn: Profesyonel Bakımın Güvenilir Adresi"
                                />
                            </EnterpriseField>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard>
                        <EnterpriseSectionHeader
                            title="İletişim ve Dijital Varlıklar"
                            subtitle="Dijital platformlarda ve evraklarda yer alacak iletişim bağları."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EnterpriseField label="GENEL E-POSTA ADRESİ">
                                <EnterpriseInput
                                    type="email"
                                    value={tempCompanyInfo?.company_email || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTempCompanyInfo({ ...tempCompanyInfo, company_email: e.target.value })
                                    }
                                    placeholder="info@sirketiniz.com"
                                />
                            </EnterpriseField>

                            <EnterpriseField label="KURUMSAL WEB SİTESİ">
                                <EnterpriseInput
                                    type="text"
                                    value={tempCompanyInfo?.company_website || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTempCompanyInfo({ ...tempCompanyInfo, company_website: e.target.value })
                                    }
                                    placeholder="www.sirketiniz.com"
                                />
                            </EnterpriseField>

                            <div className="md:col-span-2">
                                <EnterpriseField label="VARSAYILAN KURUMSAL TELEFON">
                                    <EnterpriseInput
                                        type="tel"
                                        value={tempCompanyInfo?.company_phone || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setTempCompanyInfo({ ...tempCompanyInfo, company_phone: e.target.value })
                                        }
                                        placeholder="+90 (---) --- -- --"
                                    />
                                </EnterpriseField>
                            </div>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard>
                        <EnterpriseSectionHeader
                            title="Merkez Adres ve Konumlama"
                            subtitle="Ana şube / yönetimin bulunduğu fiziki veya yasal tebligat adresi."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <EnterpriseField label="İŞLETME ŞEHRİ">
                                <EnterpriseSelect
                                    value={tempCompanyInfo?.company_city || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                        setTempCompanyInfo({ ...tempCompanyInfo, company_city: e.target.value, company_district: '' })
                                    }
                                >
                                    <option value="">İl Seçiniz...</option>
                                    {(TURKISH_CITIES || []).map((city: string) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </EnterpriseSelect>
                            </EnterpriseField>

                            <EnterpriseField label="İŞLETME İLÇESİ">
                                <EnterpriseSelect
                                    value={tempCompanyInfo?.company_district || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                        setTempCompanyInfo({ ...tempCompanyInfo, company_district: e.target.value })
                                    }
                                    disabled={!tempCompanyInfo?.company_city}
                                >
                                    <option value="">İlçe Seçiniz...</option>
                                    {((TURKISH_DISTRICTS || {})[tempCompanyInfo?.company_city] || []).map((district: string) => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </EnterpriseSelect>
                            </EnterpriseField>
                        </div>

                        <EnterpriseField label="TAM AÇIK ADRES">
                            <EnterpriseTextarea
                                rows={3}
                                value={tempCompanyInfo?.company_address || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setTempCompanyInfo({ ...tempCompanyInfo, company_address: e.target.value })
                                }
                                placeholder="Mahalle, Cadde, Sokak, Kapı No bilgisini eksiksiz giriniz..."
                            />
                        </EnterpriseField>

                        <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                            <EnterpriseButton
                                variant="primary"
                                onClick={handleSaveCompany}
                                disabled={isSaving}
                                className="w-full sm:w-auto h-12 px-8"
                            >
                                {isSaving ? '⏳ Sistem Güncelleniyor...' : '💾 Kurumsal Profili Kaydet'}
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
