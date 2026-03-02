import React from 'react';
import {
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseTextarea,
    EnterpriseButton,
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
        <div className="animate-fade-in-up max-w-5xl mx-auto">
            {/* ── Header ── */}
            <EnterpriseSectionHeader
                icon="🏢"
                title="Firma Profili"
                subtitle="Belgelerde ve tekliflerde görünecek genel firma bilgilerini düzenleyin."
            />

            {/* ── Form Card ── */}
            <EnterpriseCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Firma Adı — full width */}
                    <div className="md:col-span-2">
                        <EnterpriseField label="FİRMA ADI">
                            <EnterpriseInput
                                type="text"
                                value={tempCompanyInfo?.company_name || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setTempCompanyInfo({ ...tempCompanyInfo, company_name: e.target.value })
                                }
                                placeholder="Örn: MOTOROIL"
                            />
                        </EnterpriseField>
                    </div>

                    {/* Slogan — full width */}
                    <div className="md:col-span-2">
                        <EnterpriseField label="SLOGAN / ALT BAŞLIK">
                            <EnterpriseInput
                                type="text"
                                value={tempCompanyInfo?.company_slogan || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setTempCompanyInfo({ ...tempCompanyInfo, company_slogan: e.target.value })
                                }
                                placeholder="Örn: Profesyonel Oto Servis ve Bakım"
                            />
                        </EnterpriseField>
                    </div>

                    {/* Şehir */}
                    <EnterpriseField label="ŞEHİR">
                        <EnterpriseSelect
                            value={tempCompanyInfo?.company_city || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                setTempCompanyInfo({ ...tempCompanyInfo, company_city: e.target.value, company_district: '' })
                            }
                        >
                            <option value="">Şehir Seçin...</option>
                            {(TURKISH_CITIES || []).map((city: string) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </EnterpriseSelect>
                    </EnterpriseField>

                    {/* İlçe */}
                    <EnterpriseField label="İLÇE">
                        <EnterpriseSelect
                            value={tempCompanyInfo?.company_district || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                setTempCompanyInfo({ ...tempCompanyInfo, company_district: e.target.value })
                            }
                            disabled={!tempCompanyInfo?.company_city}
                        >
                            <option value="">İlçe Seçin...</option>
                            {((TURKISH_DISTRICTS || {})[tempCompanyInfo?.company_city] || []).map((district: string) => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </EnterpriseSelect>
                    </EnterpriseField>

                    {/* E-Posta */}
                    <EnterpriseField label="GENEL E-POSTA">
                        <EnterpriseInput
                            type="email"
                            value={tempCompanyInfo?.company_email || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTempCompanyInfo({ ...tempCompanyInfo, company_email: e.target.value })
                            }
                            placeholder="info@firma.com"
                        />
                    </EnterpriseField>

                    {/* Web Sitesi */}
                    <EnterpriseField label="WEB SİTESİ">
                        <EnterpriseInput
                            type="text"
                            value={tempCompanyInfo?.company_website || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTempCompanyInfo({ ...tempCompanyInfo, company_website: e.target.value })
                            }
                            placeholder="www.firma.com.tr"
                        />
                    </EnterpriseField>

                    {/* Telefon */}
                    <EnterpriseField label="VARSAYILAN TELEFON">
                        <EnterpriseInput
                            type="text"
                            value={tempCompanyInfo?.company_phone || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setTempCompanyInfo({ ...tempCompanyInfo, company_phone: e.target.value })
                            }
                            placeholder="+90 (---) --- -- --"
                        />
                    </EnterpriseField>

                    {/* Adres — full width */}
                    <div className="md:col-span-2">
                        <EnterpriseField label="VARSAYILAN ADRES (ŞUBE BİLGİSİ YOKSA)">
                            <EnterpriseTextarea
                                rows={3}
                                value={tempCompanyInfo?.company_address || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setTempCompanyInfo({ ...tempCompanyInfo, company_address: e.target.value })
                                }
                                placeholder="Firma açık adresi..."
                                className="min-h-[80px]"
                            />
                        </EnterpriseField>
                    </div>

                    {/* Save Button — full width */}
                    <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                            💡 Bu bilgiler sistem genelindeki belgelerde (teklif, fatura vb.) varsayılan olarak kullanılır.
                            Şube bazlı belgelerde ilgili şubenin kendi adresi önceliklidir.
                        </p>
                        <EnterpriseButton
                            variant="primary"
                            onClick={handleSaveCompany}
                            disabled={isSaving}
                        >
                            {isSaving ? '⏳ Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
                        </EnterpriseButton>
                    </div>

                </div>
            </EnterpriseCard>
        </div>
    );
}
