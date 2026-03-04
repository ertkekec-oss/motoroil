import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// Sıfırlama handler'ı, fetch, showConfirm, showError → DOKUNULMADI.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

export default function SystemResetPanel(props: any) {
    const {
        resetOptions,
        setResetOptions,
        showSuccess,
        showError,
        showConfirm,
        currentUser,
    } = props;

    const resetModules = [
        { id: 'customers', label: 'Cari Kartlar & Hareketler' },
        { id: 'inventory', label: 'Stok Modülü & Depo' },
        { id: 'ecommerce', label: 'Pazaryeri & E-Ticaret' },
        { id: 'pos', label: 'Hızlı Satış (POS) Belgeleri' },
        { id: 'receivables', label: 'Müşteri Alacakları (AR)' },
        { id: 'payables', label: 'Tedarikçi Borçları (AP)' },
        { id: 'checks', label: 'Kıymetli Evrak (Çek)' },
        { id: 'notes', label: 'Kıymetli Evrak (Senet)' },
        { id: 'staff', label: 'Personel & Özlük Dosyaları' },
        { id: 'branches', label: 'Bağlı Şubeler & Konumlar' },
        { id: 'expenses', label: 'Gider Fişleri & Faturalar' },
    ];

    return (
        <div className="max-w-4xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Kritik Sistem & Veri Katmanı Sıfırlama</h2>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Geri dönüşü olmayan, kalıcı veri silme işlemleri protokolü.</p>
            </div>

            {/* Warning Banner */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4 mb-8">
                <div className="w-10 h-10 bg-white dark:bg-[#0f172a] border border-red-200 rounded-lg flex items-center justify-center text-red-600 text-xl shadow-sm shrink-0 mt-0.5">
                    ⚠️
                </div>
                <div>
                    <h3 className="text-[15px] font-bold text-red-800">Riskli Alan (Danger Zone) Bildirimi</h3>
                    <p className="text-[13px] text-red-700 mt-1 leading-relaxed">
                        Bu sayfadan uygulanacak veri sıfırlama talepleri, <strong>Cloud ortamından da izole silinmektedir.</strong> Kesinlikle geri döndürülemez (No Rollback). Sadece sistem kurulum (Onboarding) hatası veya test aşamasından canlıya geçiş arifesinde kullanılması önerilir.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border-2 border-red-100 rounded-2xl shadow-[0_4px_12px_rgba(239,68,68,0.05)] overflow-hidden">
                <div className="p-6 pb-5 border-b border-red-100 bg-red-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-[16px] font-semibold text-red-900">Module-Level Silme Matrisi</h3>
                        <p className="text-[14px] text-red-600/80 mt-1">İlgili modülün bağlı olduğu tüm transaction ve referanslar da cascade yoluyla silinecektir.</p>
                    </div>
                </div>

                <div className="p-6">
                    {/* Tümünü Seç Gövdesi */}
                    <label className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 cursor-pointer hover:bg-red-100/50 transition-colors mb-6">
                        <input
                            type="checkbox"
                            checked={resetOptions.all}
                            onChange={(e) => setResetOptions({ ...resetOptions, all: e.target.checked })}
                            className="w-4 h-4 accent-red-600 shrink-0 mt-0.5"
                        />
                        <div>
                            <span className="text-[14px] font-bold text-red-800 tracking-tight">GLOBAL RESET (TÜM SİSTEMİ TEMİZLE)</span>
                            <p className="text-[13px] text-red-600 mt-0.5">Firmaya kayıtlı olan; sadece ayarlar ve tanımlar hariç, işlem gören <b>TÜM</b> veri tabloları truncate edilir.</p>
                        </div>
                    </label>

                    {/* Modül Modül Grid */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <h4 className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Kısmi Silme / Modül Seçimi</h4>
                            <div className="h-px bg-slate-100 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {resetModules.map((opt) => {
                                const isChecked = resetOptions.all || (resetOptions as any)[opt.id];
                                return (
                                    <label
                                        key={opt.id}
                                        className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors text-[13px] font-medium ${isChecked
                                                ? 'bg-red-50 border-red-200 text-red-700'
                                                : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            disabled={resetOptions.all}
                                            checked={isChecked}
                                            onChange={(e) => setResetOptions({ ...resetOptions, [opt.id]: e.target.checked })}
                                            className="w-4 h-4 accent-red-600 shrink-0"
                                        />
                                        {opt.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Onay Formu */}
                    <div className="p-6 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl space-y-4">
                        <div>
                            <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Güvenlik Onay İmzası</label>
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-3 block">Bilinçli bir işlem olduğunu belgelemek için kutucuğa eksiksiz <strong>ONAYLIYORUM</strong> kelimesini yazınız.</p>
                            <ERPInput
                                type="text"
                                id="resetConfirmationInput"
                                placeholder="Buraya ONAYLIYORUM yazınız..."
                                className="border-red-300 focus:ring-red-600 focus:border-red-600 max-w-sm font-mono tracking-widest text-[14px]"
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                disabled={!Object.values(resetOptions).some((v) => v)}
                                className="h-12 px-8 bg-red-600 text-white rounded-lg text-[14px] font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                onClick={async () => {
                                    const input = (document.getElementById('resetConfirmationInput') as HTMLInputElement).value;
                                    if (input !== 'ONAYLIYORUM') {
                                        showError('Güvenlik İhlali', 'Lütfen onay kutusuna büyük harflerle ONAYLIYORUM yazın.');
                                        return;
                                    }
                                    showConfirm(
                                        'Yasal Uyarı Geçidi',
                                        `Belirtilen veri kapsamı ("${currentUser?.username}" kullanıcısının yetkisi ile) KALICI OLARAK DB'den temizlenecektir. İşlemi onaylıyor musunuz?`,
                                        async () => {
                                            try {
                                                const res = await fetch('/api/admin/reset-data', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        confirmation: input,
                                                        options: resetOptions,
                                                        currentUsername: currentUser?.username,
                                                    }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    showSuccess('Protokol Tamamlandı', '✅ Seçilen veriler truncate edildi.');
                                                    setTimeout(() => window.location.reload(), 2000);
                                                } else {
                                                    showError('Silme Başarısız', 'Reddedildi: ' + data.error);
                                                }
                                            } catch (e) {
                                                showError('Bağlantı Hatası', 'Sunucu ile iletişim koptu.');
                                            }
                                        }
                                    );
                                }}
                            >
                                <span>🔥</span> Seçili Verileri Kalıcı Sil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
