import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseButton,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseEmptyState,
    EnterpriseTabs,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

const DEF_TABS = [
    { id: 'brands', label: 'Markalar', icon: '🏷️' },
    { id: 'prod_cat', label: 'Ürün Kategorileri', icon: '📂' },
    { id: 'cust_class', label: 'Cari Sınıfları', icon: '👥' },
    { id: 'supp_class', label: 'Tedarikçi Sınıfları', icon: '🏭' },
    { id: 'warranties', label: 'Garanti Süreleri', icon: '🛡️' },
    { id: 'vehicle_types', label: 'Taşıt Türleri', icon: '🛵' },
    { id: 'payment_methods', label: 'Ödeme Yöntemleri', icon: '💳' },
];

const TAB_TITLE: Record<string, string> = {
    brands: 'Marka Tanımları',
    prod_cat: 'Ürün Kategorileri',
    cust_class: 'Cari Sınıfları',
    supp_class: 'Tedarikçi Sınıfları',
    warranties: 'Garanti Seçenekleri',
    vehicle_types: 'Taşıt Türleri',
    payment_methods: 'Ödeme Yöntemleri',
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

    // ── helpers (zero logic — unchanged from original) ───────────────────────
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
        <EnterprisePageShell
            title="Tanımlar & Listeler"
            description="Markalar, kategoriler, cari sınıfları ve diğer sistem listelerini yönetin."
        >
            {/* Tab bar */}
            <EnterpriseTabs
                tabs={DEF_TABS}
                activeTab={definitionTab}
                onTabChange={(id: string) => { setDefinitionTab(id); setNewItemInput(''); }}
            />

            {/* Add form */}
            <EnterpriseCard>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {TAB_TITLE[definitionTab]} — Yeni Ekle
                </p>
                <div className="flex items-end gap-3">
                    {/* Payment method type selector */}
                    {isPayment && (
                        <div className="w-40 shrink-0">
                            <EnterpriseSelect
                                value={newPaymentMethod.type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })
                                }
                            >
                                <option value="cash">💵 Nakit</option>
                                <option value="card">💳 Kredi Kartı</option>
                                <option value="transfer">🏦 Havale/EFT</option>
                            </EnterpriseSelect>
                        </div>
                    )}
                    <div className="flex-1">
                        <EnterpriseInput
                            type="text"
                            placeholder={isPayment ? 'Hesap adı (örn: Akbank)' : 'Yeni değer yazın...'}
                            value={newItemInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemInput(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd(); }}
                        />
                    </div>
                    <EnterpriseButton variant="primary" onClick={handleAdd} className="shrink-0">
                        + Ekle
                    </EnterpriseButton>
                </div>
            </EnterpriseCard>

            {/* List */}
            <EnterpriseCard noPadding>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {TAB_TITLE[definitionTab]}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {activeList.length} kayıt
                    </span>
                </div>

                {activeList.length === 0 ? (
                    <EnterpriseEmptyState
                        icon="📝"
                        title="Liste boş"
                        description="Yeni eklemek için yukarıdaki alanı kullanın."
                    />
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {activeList.map((item: any, i: number) => (
                            <div
                                key={isPayment ? (item.id || i) : i}
                                className="flex items-center justify-between px-6 py-3.5 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {isPayment && (
                                        <span className="text-xl shrink-0">{item.icon || '💰'}</span>
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {isPayment ? item.label : item}
                                        </div>
                                        {isPayment && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">
                                                {item.type === 'card' ? 'Kredi Kartı' : item.type === 'transfer' ? 'Banka' : 'Nakit'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(item)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                    title="Kaldır"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
