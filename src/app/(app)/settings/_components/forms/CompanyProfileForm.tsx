import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-200 dark:disabled:border-white/10 ${props.className || ''}`}
        />
    );
}

function ERPSelect(props: any) {
    return (
        <select
            {...props}
            className={`w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 ${props.className || ''}`}
        />
    );
}

function ERPTextarea(props: any) {
    return (
        <textarea
            {...props}
            className={`w-full p-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{label}</label>
            {children}
        </div>
    );
}

function ERPBlock({ title, description, children, action }: { title?: string, description?: string, children: React.ReactNode, action?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description || action) && (
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100 dark:border-white/5">
                    <div>
                        {title && <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>}
                        {description && <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
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
        showError,
        showSuccess,
        showConfirm
    } = props;

    const [documents, setDocuments] = React.useState<any[]>([]);
    const [isDocsLoading, setIsDocsLoading] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        setIsDocsLoading(true);
        try {
            const res = await fetch('/api/company-docs');
            const data = await res.json();
            if (data.success) setDocuments(data.documents);
        } catch (e) {
            console.error(e);
        } finally {
            setIsDocsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!validTypes.includes(file.type)) {
            showError('Hata', 'Desteklenmeyen formattır.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showError('Hata', 'Dosya boyutu 10MB limitini aşıyor.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        try {
            const res = await fetch('/api/company-docs/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                // reset or fast refresh
                fetchDocs();
                if (fileInputRef.current) fileInputRef.current.value = "";
                showSuccess('Başarılı', 'Belge başarıyla yüklendi.');
            } else {
                showError('Hata', data.error || 'Yüklemekte sorun yaşandı');
            }
        } catch (e: any) {
            showError('Hata', 'Sunucu hatası: ' + e.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const res = await fetch(`/api/company-docs/${id}/download`);
            const data = await res.json();
            if (data.success && data.url) {
                // Link'e tıklayıp frontend'den doğrudan indirme başlatılır
                const link = document.createElement('a');
                link.href = data.url;
                link.download = fileName || "belge";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                showError('Hata', data.error || 'İndirme adresi alınamadı');
            }
        } catch (e) {
            showError('Hata', 'İndirmede bir hata oluştu.');
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm('Belgeyi Sil', 'Bu belgeyi kalıcı olarak silmek istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/company-docs/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    fetchDocs();
                    showSuccess('Silindi', 'Belge başarıyla silindi.');
                } else {
                    showError('Hata', data.error || 'Silinirken bir hata oluştu');
                }
            } catch (e) {
                showError('Hata', 'Sunucu hatası oluştu');
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            {/* Header Alanı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Firma Organizasyon Profili</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">E-arşiv, teklif, irsaliye ve yasal zeminlerde kullanılacak resmi kurum kimliğiniz.</p>
                </div>

                <div className="shrink-0">
                    <button
                        onClick={handleSaveCompany}
                        disabled={isSaving}
                        className="h-10 px-5 bg-slate-900 dark:bg-white border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white/20 disabled:opacity-70 flex items-center gap-2"
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
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-[#1e293b] rounded-2xl flex items-center justify-center text-4xl mb-5 border border-slate-200 dark:border-white/5 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                            🏢
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                            {tempCompanyInfo?.company_name || 'HÜKMi ŞAHSİYET TANIMLANMADI'}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                            {tempCompanyInfo?.company_slogan || 'Ticari Faaliyet'}
                        </p>

                        <div className="mt-8 w-full border-t border-slate-100 dark:border-white/5 divide-y divide-slate-100 text-left">
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-widest">Kurumsal E-Posta</span>
                                <span className="text-[14px] text-slate-900 dark:text-white font-medium truncate">
                                    {tempCompanyInfo?.company_email || '-'}
                                </span>
                            </div>
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-widest">Santral / Tel</span>
                                <span className="text-[14px] text-slate-900 dark:text-white font-medium">
                                    {tempCompanyInfo?.company_phone || '-'}
                                </span>
                            </div>
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-widest">Web Adresi</span>
                                <span className="text-[14px] text-slate-600 dark:text-slate-300 font-medium truncate">
                                    {tempCompanyInfo?.company_website || '-'}
                                </span>
                            </div>
                            <div className="py-3 flex flex-col gap-1">
                                <span className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-widest">Kayıtlı Bölge / Lokasyon</span>
                                <span className="text-[14px] text-slate-900 dark:text-white font-medium">
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

                    {/* Private Documents Box */}
                    <ERPBlock
                        title="Gizli Firma Belgeleri"
                        description="Şirketinize ait imza sirküleri, vergi levhası ve yasal dosyalarınızı özel (private) bulut alanında saklayın."
                        action={
                            <div className="flex items-center">
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded disabled:opacity-50"
                                >
                                    {isUploading ? 'Yükleniyor...' : '+ Belge Yükle'}
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-2">
                            {isDocsLoading ? (
                                <div className="text-sm text-slate-500">Belgeler yükleniyor...</div>
                            ) : documents.length === 0 ? (
                                <div className="text-sm text-slate-500 italic">Henüz özel belgeniz bulunmuyor.</div>
                            ) : (
                                documents.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] rounded-lg">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded shadow-sm">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate" title={doc.name}>{doc.name}</span>
                                                <span className="text-xs text-slate-500 truncate">{new Date(doc.createdAt).toLocaleDateString('tr-TR')} • {(doc.size / 1024).toFixed(0)} KB</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleDownload(doc.id, doc.fileName)}
                                                className="shrink-0 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                title="İndir (Signed URL)"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors ml-1"
                                                title="Sistemden Sil"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ERPBlock>
                </div>
            </div>
        </div>
    );
}
