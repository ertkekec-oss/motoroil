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

const DEF_TABS = [
    { id: 'brands', label: 'Markalar' },
    { id: 'prod_cat', label: 'Ürün Kategorileri' },
    { id: 'cust_class', label: 'Cari Sınıfları' },
    { id: 'supp_class', label: 'Tedarikçi Sınıfları' },
    { id: 'warranties', label: 'Garanti Parametreleri' },
    { id: 'vehicle_types', label: 'Taşıt Türleri' },
    { id: 'payment_methods', label: 'Tahsilat Kanalları' },
];

const TAB_TITLE: Record<string, string> = {
    brands: 'Marka & Üretici Tanımları',
    prod_cat: 'Stok Kategori Ağacı',
    cust_class: 'Müşteri Derecelendirme Sınıfları',
    supp_class: 'Tedarikçi Nitelik Sınıfları',
    warranties: 'Yasal Garanti Süreçleri',
    vehicle_types: 'Filo & Taşıt Tipolojisi',
    payment_methods: 'Finansal Tahsilat Kanalları',
};

const TAB_DESC: Record<string, string> = {
    brands: 'Sisteme işlenen ürünlere ait global veya yerel marka listesi.',
    prod_cat: 'Stok kartlarını hiyerarşik yapılandırmak için ana başlıklar.',
    cust_class: 'B2B ve B2C müşterilerinizin fiyatlandırma grupları.',
    supp_class: 'Mal ve hizmet tedariği sağladığınız paydaş sınıfları.',
    warranties: 'Satış sonrası hizmetlerde geçerli yasal teminat süreleri.',
    vehicle_types: 'Servis modülünde araca atanacak geçerli şasi formları.',
    payment_methods: 'Nakit, banka kartı ve transfer odaklı yasal ödeme yolları.',
};

export default function DefinitionsListPanel(props: any) {
    const {
        setNewItemInput, newItemInput, addDefinition,
        brands, setBrands, prodCats, setProdCats,
        custClasses, setCustClasses, suppClasses, setSuppClasses,
        warranties, setWarranties, vehicleTypes, setVehicleTypes,
        quickRemovePaymentMethod, removeDefinition,
        paymentMethods, updatePaymentMethods,
        newPaymentMethod, setNewPaymentMethod,
        showSuccess, showError,
        definitionTab, setDefinitionTab,
    } = props;

    // ── helpers (zero logic — unchanged) ───────────────────────
    const getActiveList = () => {
        if (definitionTab === 'brands') return brands || [];
        if (definitionTab === 'prod_cat') return prodCats || [];
        if (definitionTab === 'cust_class') return custClasses || [];
        if (definitionTab === 'supp_class') return suppClasses || [];
        if (definitionTab === 'warranties') return warranties || [];
        if (definitionTab === 'vehicle_types') return vehicleTypes || [];
        if (definitionTab === 'payment_methods') return paymentMethods || [];
        return [];
    };

    const handleAdd = () => {
        if (definitionTab === 'payment_methods') {
            const id = Math.random().toString(36).substr(2, 9);
            const iconMap: Record<string, string> = { cash: '💵', card: '💳', transfer: '🏦' };
            const icon = iconMap[newPaymentMethod.type] || '💰';
            const newVal = { id, label: newItemInput || 'Yeni Hesap', type: newPaymentMethod.type, icon, linkedKasaId: '' };
            updatePaymentMethods([...paymentMethods, newVal])
                .then(() => { setNewItemInput(''); if (showSuccess) showSuccess('Başarılı', 'Ödeme yöntemi eklendi.'); })
                .catch(() => { if (showError) showError('Hata', 'Eklenemedi'); });
        } else {
            if (definitionTab === 'brands') addDefinition('brands', brands, setBrands);
            else if (definitionTab === 'prod_cat') addDefinition('prod_cat', prodCats, setProdCats);
            else if (definitionTab === 'cust_class') addDefinition('custClasses', custClasses, setCustClasses);
            else if (definitionTab === 'supp_class') addDefinition('suppClasses', suppClasses, setSuppClasses);
            else if (definitionTab === 'warranties') addDefinition('warranties', warranties, setWarranties);
            else if (definitionTab === 'vehicle_types') addDefinition('vehicleTypes', vehicleTypes, setVehicleTypes);
        }
    };

    const handleRemove = (item: any) => {
        if (definitionTab === 'payment_methods') { quickRemovePaymentMethod(item.id); return; }
        if (definitionTab === 'brands') removeDefinition('brands', item, brands, setBrands);
        else if (definitionTab === 'prod_cat') removeDefinition('prodCats', item, prodCats, setProdCats);
        else if (definitionTab === 'cust_class') removeDefinition('custClasses', item, custClasses, setCustClasses);
        else if (definitionTab === 'supp_class') removeDefinition('suppClasses', item, suppClasses, setSuppClasses);
        else if (definitionTab === 'warranties') removeDefinition('warranties', item, warranties, setWarranties);
        else if (definitionTab === 'vehicle_types') removeDefinition('vehicleTypes', item, vehicleTypes, setVehicleTypes);
    };

    const activeList = getActiveList();
    const isPayment = definitionTab === 'payment_methods';

    return (
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            {/* Header Alanı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Sistem Parametreleri & Alt Tablolar</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Sistemdeki modüllerin beslendiği anahtar/değer sözlüklerini ve evrensel listeleri yönetin.</p>
                </div>
            </div>

            {/* Yatay Minimal Strip Navigation */}
            <div className="flex bg-white dark:bg-[#0f172a] rounded-t-2xl border-b border-slate-200 dark:border-white/5 mb-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-x-auto whitespace-nowrap hide-scrollbar">
                {DEF_TABS.map(tab => {
                    const isActive = definitionTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setDefinitionTab(tab.id); setNewItemInput(''); }}
                            className={`relative px-5 py-3.5 text-[14px] font-semibold transition-colors focus:outline-none ${isActive ? 'text-slate-900 dark:text-white bg-slate-50 dark:bg-[#1e293b]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50/50'}`}
                        >
                            {tab.label}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 dark:bg-white" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SOL: YENİ KAYIT FORMU (4 Kolon) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">Deklarasyon Ekle</h3>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5">Sisteme yeni bir parametre kaydedin.</p>

                        <div className="space-y-4">
                            {isPayment && (
                                <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
                                    <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">YÖNTEM SINIFI</label>
                                    <ERPSelect
                                        value={newPaymentMethod.type}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                            setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })
                                        }
                                    >
                                        <option value="cash">Nakit (Kasa Transferi)</option>
                                        <option value="card">Kredi Kartı (Fiziki/Sanal POS)</option>
                                        <option value="transfer">Bankasal Havale/EFT (Ertesi Gün)</option>
                                    </ERPSelect>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
                                <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                                    {isPayment ? 'HESAP veya ENSTRÜMAN ADI' : 'PARAMETRE DEĞERİ (VALUE)'}
                                </label>
                                <div className="flex gap-2">
                                    <ERPInput
                                        type="text"
                                        placeholder={isPayment ? 'Örn: Ana Kasa, Yapı Kredi' : 'Kayıt ismini yazın'}
                                        value={newItemInput}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemInput(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd(); }}
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={handleAdd}
                                        className="w-10 h-10 shrink-0 bg-slate-900 dark:bg-white text-white rounded-lg flex items-center justify-center font-bold hover:bg-slate-800 shadow-sm transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 p-5 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📚</span>
                            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Sistem Referansı</span>
                        </div>
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            Buradaki veriler global drop-down alanlarında sergilenmektedir. Bir silme işlemi yapıldığında geçmişteki fatura ve stok fişlerindeki "kayıtlı string metinler" etkilenmez; ancak yeni açılacak kayıtlarda seçilemez hale gelir.
                        </p>
                    </div>
                </div>

                {/* SAĞ: LİSTE VE TABLO (8 Kolon) */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{TAB_TITLE[definitionTab]}</h3>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{TAB_DESC[definitionTab]}</p>
                            </div>
                            <span className="inline-flex px-2.5 py-1 bg-slate-100 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 rounded uppercase tracking-widest shrink-0">
                                {activeList.length} TEYİTLİ
                            </span>
                        </div>

                        {activeList.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-[#1e293b] mx-auto rounded-xl flex items-center justify-center text-xl mb-3 shadow-sm border border-slate-100 dark:border-white/5">
                                    📭
                                </div>
                                <p className="text-[15px] font-semibold text-slate-900 dark:text-white mb-1">Veri Bulunamadı</p>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Bu kategoriye ait mevcut bir kayıt yok. Sol taraftaki menüyü kullanarak ekleme yapabilirsiniz.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200 dark:border-white/5">
                                        <th className="px-6 py-3 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Veri Değeri</th>
                                        {isPayment && (
                                            <th className="px-6 py-3 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enstrüman Fonksiyonu</th>
                                        )}
                                        <th className="px-6 py-3 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Aksiyon</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeList.map((item: any, i: number) => {
                                        const uniqueKey = isPayment ? (item.id || i) : i;
                                        return (
                                            <tr key={uniqueKey} className="hover:bg-slate-50/50 group transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {isPayment && <span className="text-xl w-6 text-center shrink-0">{item.icon || '■'}</span>}
                                                        <span className="text-[14px] font-medium text-slate-900 dark:text-white">{isPayment ? item.label : item}</span>
                                                    </div>
                                                </td>
                                                {isPayment && (
                                                    <td className="px-6 py-3">
                                                        <span className="inline-flex px-2 py-1 text-[11px] font-semibold rounded bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                                            {item.type === 'card' ? 'Kredi Kartı' : item.type === 'transfer' ? 'EFT / Banka' : 'Nakit'}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRemove(item)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[13px] font-semibold text-red-600 hover:text-red-700 bg-white dark:bg-[#0f172a] border border-red-200 px-3 py-1.5 rounded shadow-sm hover:shadow"
                                                    >
                                                        Sistemden Sil
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
