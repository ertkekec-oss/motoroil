import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 ${props.className || ''}`}
        />
    );
}

function ERPSelect(props: any) {
    return (
        <select
            {...props}
            className={`w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500 ${props.className || ''}`}
        />
    );
}

function ERPTextarea(props: any) {
    return (
        <textarea
            {...props}
            className={`w-full p-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 uppercase tracking-widest transition-colors">{label}</label>
            {children}
        </div>
    );
}

function ERPBlock({ title, description, children, action }: { title?: string, description?: string, children: React.ReactNode, action?: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description || action) && (
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
                    <div>
                        {title && <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>}
                        {description && <p className="text-[14px] text-slate-500 mt-1">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

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
        <div className="max-w-6xl animate-in fade-in duration-300">
            {/* Header Alanı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 tracking-tight">Firma Organizasyon Profili</h2>
                    <p className="text-[14px] text-slate-500 mt-1">E-arşiv, teklif, irsaliye ve yasal zeminlerde kullanılacak resmi kurum kimliğiniz.</p>
                </div>

                <div className="shrink-0">
                    <button
                        onClick={handleSaveCompany}
                        disabled={isSaving}
                        className="h-10 px-5 bg-slate-900 border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <><div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Güncelleniyor</>
                        ) : (
                            <>💾 Sistemi Onayla ve Kaydet</>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SOL PANEL (Özet Kartı) - 4 Kolon */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-5 border border-slate-200 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                            🏢
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-tight leading-tight">
                            {tempCompanyInfo?.company_name || 'HÜKMi ŞAHSİYET TANIMLANMADI'}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400 mt-2 uppercase tracking-widest">
                            {tempCompanyInfo?.company_slogan || 'Ticari Faaliyet'}
                        </p>

                        <div className="mt-8 w-full border-t border-slate-100 divide-y divide-slate-100 text-left">
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-widest">Kurumsal E-Posta</span>
                                <span className="text-[14px] text-slate-900 font-medium truncate">
                                    {tempCompanyInfo?.company_email || '-'}
                                </span>
                            </div>
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-widest">Santral / Tel</span>
                                <span className="text-[14px] text-slate-900 font-medium">
                                    {tempCompanyInfo?.company_phone || '-'}
                                </span>
                            </div>
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-widest">Web Adresi</span>
                                <span className="text-[14px] text-slate-600 font-medium truncate">
                                    {tempCompanyInfo?.company_website || '-'}
                                </span>
                            </div>
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-widest">Kayıtlı Bölge / Lokasyon</span>
                                <span className="text-[14px] text-slate-900 font-medium">
                                    {tempCompanyInfo?.company_city ? `${tempCompanyInfo.company_city}${tempCompanyInfo.company_district ? ` / ${tempCompanyInfo.company_district}` : ''}` : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 text-blue-900 text-[13px] leading-relaxed">
                        <span className="shrink-0">📌</span>
                        <div>
                            Sistemdeki belgelerde (Fatura, Teklif) merkez şube bilgileri kullanılır. Ayrı operasyon / depo şubeleriniz varsa sağ üstte yer alan <strong>Şubeler</strong> modülünden ekleyebilirsiniz.
                        </div>
                    </div>
                </div>

                {/* SAĞ PANEL (Veri Girişi) - 8 Kolon */}
                <div className="lg:col-span-8">
                    {/* Temel Kimlik */}
                    <ERPBlock title="Ticari Sicil ve Ünvan" description="Kamu kurumlarına ve müşteri matbu evraklarına yansıyacak resmi şahıs/şirket ünvanı.">
                        <div className="space-y-5">
                            <ERPField label="Firma Adı / Resmi Ticari Ünvan">
                                <ERPInput
                                    type="text"
                                    value={tempCompanyInfo?.company_name || ''}
                                    onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_name: e.target.value })}
                                    placeholder="Örn: X BİLİŞİM ENDÜSTRİ VE TİC. LTD. ŞTİ."
                                />
                            </ERPField>
                            <ERPField label="Kısa Slogan veya Alt Faaliyet Kodu">
                                <ERPInput
                                    type="text"
                                    value={tempCompanyInfo?.company_slogan || ''}
                                    onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_slogan: e.target.value })}
                                    placeholder="Örn: Yeni Nesil Teknolojik Çözümler"
                                />
                            </ERPField>
                        </div>
                    </ERPBlock>

                    {/* İletişim */}
                    <ERPBlock title="Dijital İletişim Kanalları" description="Fatura, mail şablonları ve SMS gönderimlerinde kullanılacak olan ulaşım rotaları.">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <ERPField label="Resmi E-Posta">
                                <ERPInput
                                    type="email"
                                    value={tempCompanyInfo?.company_email || ''}
                                    onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_email: e.target.value })}
                                    placeholder="info@sistem.com"
                                />
                            </ERPField>
                            <ERPField label="Merkez Santral / Telefon">
                                <ERPInput
                                    type="tel"
                                    value={tempCompanyInfo?.company_phone || ''}
                                    onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_phone: e.target.value })}
                                    placeholder="+90 5XX XXX XX XX"
                                />
                            </ERPField>
                            <div className="md:col-span-2">
                                <ERPField label="B2B E-Ticaret / Web Sitesi">
                                    <ERPInput
                                        type="text"
                                        value={tempCompanyInfo?.company_website || ''}
                                        onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_website: e.target.value })}
                                        placeholder="https://www.firmaadi.com"
                                    />
                                </ERPField>
                            </div>
                        </div>
                    </ERPBlock>

                    {/* Adres */}
                    <ERPBlock title="Fiziki veya Yasal Tebligat Adresi" description="Gib mali mührüne de yansıması beklenen kurum ikamet lokasyonu.">
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <ERPField label="Dahili İl (Şehir)">
                                    <ERPSelect
                                        value={tempCompanyInfo?.company_city || ''}
                                        onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_city: e.target.value, company_district: '' })}
                                    >
                                        <option value="">İl Seçiniz</option>
                                        {(TURKISH_CITIES || []).map((city: string) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </ERPSelect>
                                </ERPField>
                                <ERPField label="Dahili İlçe">
                                    <ERPSelect
                                        value={tempCompanyInfo?.company_district || ''}
                                        onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_district: e.target.value })}
                                        disabled={!tempCompanyInfo?.company_city}
                                    >
                                        <option value="">İlçe Seçiniz</option>
                                        {((TURKISH_DISTRICTS || {})[tempCompanyInfo?.company_city] || []).map((d: string) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </ERPSelect>
                                </ERPField>
                            </div>
                            <ERPField label="Tam Açık Adres">
                                <ERPTextarea
                                    rows={3}
                                    value={tempCompanyInfo?.company_address || ''}
                                    onChange={(e: any) => setTempCompanyInfo({ ...tempCompanyInfo, company_address: e.target.value })}
                                    placeholder="Mahalle, mevkii, cadde, numara vb. açık adresi giriniz"
                                />
                            </ERPField>
                        </div>
                    </ERPBlock>
                </div>
            </div>
        </div>
    );
}
