import React, { useState, useMemo } from 'react';
import {
    EnterpriseField,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ───────────────────────────────────────────────────────
// Tüm state, handler, API, submit akışı değişmedi.
// Yalnızca UI katmanı: Split-layout (liste sol / form sağ) kurumsal tasarım.
// ─────────────────────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h4>
            {children}
        </div>
    );
}

function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl text-slate-200 dark:text-slate-700 mb-4">{icon}</div>
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</h4>
            {description && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Aktif') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {type || 'Şube'}
        </span>
    );
}

const TYPE_ICON: Record<string, string> = {
    'Depo': '📦',
    'Merkez Ofis': '🏢',
    'Home Office': '🏠',
    'Şube': '🏪',
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function BranchesPanel(props: any) {
    const {
        TURKISH_CITIES, TURKISH_DISTRICTS, setSelectedBranchDocs, selectedBranchDocs,
        handleFileUpload, isDocsLoading, branchDocs, deleteBranchDoc, setShowKasaDefinitions,
        showKasaDefinitions, addPaymentMethodDefinition, editingPaymentMethodId, setEditingPaymentMethodId,
        startEditingPaymentMethod, removePaymentMethodDefinition, kasaTypes, contextBranches,
        branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch,
        editBranch, deleteBranch,
        kasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, isProcessingKasa,
        showKasaModal, setShowKasaModal, handleSaveKasa, startEditingKasa, handleDeleteKasa,
        newPaymentMethod, setNewPaymentMethod, paymentMethods,
    } = props;

    // Local UI state
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Derived stats
    const totalBranches = (branches || []).length;
    const activeBranches = (branches || []).filter((b: any) => b.status === 'Aktif').length;
    const depots = (branches || []).filter((b: any) => b.type === 'Depo').length;

    // Filtered list
    const filteredBranches = useMemo(() => {
        return (branches || []).filter((b: any) => {
            const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.city?.toLowerCase().includes(search.toLowerCase());
            const matchType = !filterType || b.type === filterType;
            const matchStatus = !filterStatus || b.status === filterStatus;
            return matchSearch && matchType && matchStatus;
        });
    }, [branches, search, filterType, filterStatus]);

    const openAddPanel = () => {
        setEditingBranchId(null);
        setNewBranch({ name: '', type: 'Şube', city: '', district: '', address: '', phone: '', manager: '', status: 'Aktif' });
        setIsPanelOpen(true);
    };

    const openEditPanel = (branch: any) => {
        editBranch(branch);
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setEditingBranchId(null);
        setNewBranch({ name: '', type: 'Şube', city: '', district: '', address: '', phone: '', manager: '', status: 'Aktif' });
    };

    const handleSave = () => {
        addBranch();
        setIsPanelOpen(false);
    };

    return (
        <div className="space-y-5 max-w-3xl animate-in fade-in duration-300">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Şubeler & Depo Yönetimi</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Firma şubelerini, depoları ve konumlarını yönetin.</p>
                </div>
                <EnterpriseButton variant="primary" onClick={openAddPanel}>
                    + Yeni Şube Ekle
                </EnterpriseButton>
            </div>

            {/* ── INLINE STAT STRIP ───────────────────────────────────── */}
            <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-800 rounded-xl">
                {[
                    { label: 'Toplam', value: totalBranches, icon: '🏪' },
                    { label: 'Aktif', value: activeBranches, icon: '✅' },
                    { label: 'Depo', value: depots, icon: '📦' },
                ].map((s, i) => (
                    <React.Fragment key={s.label}>
                        {i > 0 && <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />}
                        <div className="flex items-center gap-2">
                            <span className="text-base">{s.icon}</span>
                            <div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{s.value}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">{s.label}</span>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* ── MAIN SPLIT LAYOUT ───────────────────────────────────── */}
            <div className={`grid gap-5 transition-all duration-300 ${isPanelOpen ? 'grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>

                {/* ═══ LEFT — BRANCH LIST ═══════════════════════════════ */}
                <div className="bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    {/* Card header + inline filters */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mr-1">
                            Kayıtlı Şubeler
                            <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {filteredBranches.length}
                            </span>
                        </h3>
                        <div className="flex-1" />
                        {/* 🔍 Search */}
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">🔍</span>
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 w-36 pl-7 pr-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                            <option value="">Tüm Türler</option>
                            <option value="Şube">Şube</option>
                            <option value="Depo">Depo</option>
                            <option value="Merkez Ofis">Merkez Ofis</option>
                            <option value="Home Office">Home Office</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Tadilat">Tadilat</option>
                            <option value="Kapalı">Kapalı</option>
                        </select>
                    </div>

                    {/* Branch cards */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredBranches.length === 0 ? (
                            <EmptyState
                                icon="🏪"
                                title={totalBranches === 0 ? 'Henüz şube eklenmedi' : 'Sonuç bulunamadı'}
                                description={totalBranches === 0 ? 'Sağ üstteki butona tıklayarak ilk şubeyi ekleyin.' : 'Arama kriterlerinizi değiştirip tekrar deneyin.'}
                                action={totalBranches === 0 ? (
                                    <EnterpriseButton variant="primary" onClick={openAddPanel}>+ Yeni Şube Ekle</EnterpriseButton>
                                ) : undefined}
                            />
                        ) : (
                            filteredBranches.map((branch: any) => (
                                <div key={branch.id}>
                                    <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            {/* Icon */}
                                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm shrink-0">
                                                {TYPE_ICON[branch.type] || '🏪'}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <TypeBadge type={branch.type} />
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{branch.name}</span>
                                                    <StatusBadge status={branch.status || 'Aktif'} />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-2.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {(branch.city || branch.district) && (
                                                        <span>📍 {branch.city}{branch.district ? ` / ${branch.district}` : ''}</span>
                                                    )}
                                                    {branch.phone && <span>📞 {branch.phone}</span>}
                                                    {branch.manager && <span>👤 {branch.manager}</span>}
                                                </div>
                                            </div>

                                            {/* Actions — visible on hover */}
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedBranchDocs(selectedBranchDocs === branch.id ? null : branch.id)}
                                                    className={`h-7 px-2 rounded border text-[11px] font-medium transition-colors ${selectedBranchDocs === branch.id
                                                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                                                        : 'bg-white dark:bg-slate-900 dark:bg-white border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    📁{(branch.docs || 0) > 0 ? ` ${branch.docs}` : ''}
                                                </button>
                                                <button
                                                    onClick={() => openEditPanel(branch)}
                                                    className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs"
                                                >✏️</button>
                                                <button
                                                    onClick={() => deleteBranch(branch.id)}
                                                    className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all text-sm"
                                                >×</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evraklar inline panel */}
                                    {selectedBranchDocs === branch.id && (
                                        <div className="px-5 pb-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                                            <div className="pt-4 flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Dijital Arşiv</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kira, Ruhsat, Vergi Levhası vb. belgeler</p>
                                                </div>
                                                <div>
                                                    <input type="file" id={`file-${branch.id}`} className="hidden" onChange={(e) => handleFileUpload(e, branch.id)} />
                                                    <label
                                                        htmlFor={`file-${branch.id}`}
                                                        className="inline-flex items-center gap-1.5 h-8 px-3 bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                                    >
                                                        ⬆ Yükle
                                                    </label>
                                                </div>
                                            </div>

                                            {isDocsLoading ? (
                                                <div className="flex justify-center py-6 gap-1">
                                                    {[0, 100, 200].map(d => (
                                                        <div key={d} className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                                    ))}
                                                </div>
                                            ) : !branchDocs || branchDocs.length === 0 ? (
                                                <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                                    <p className="text-sm text-slate-400 dark:text-slate-500">Belge yüklenmemiş.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {branchDocs.map((file: any) => (
                                                        <div key={file.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-700 rounded-lg">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-base shrink-0">{file.fileType.includes('pdf') ? '📄' : '🖼️'}</span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{file.fileName}</p>
                                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                                        {new Date(file.uploadedAt).toLocaleDateString('tr-TR')} · {(file.fileSize / 1024).toFixed(1)} KB
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => deleteBranchDoc(file.id, branch.id)}
                                                                className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-sm shrink-0"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT — ADD / EDIT PANEL ══════════════════════════════ */}
                {isPanelOpen && (
                    <div className="bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm animate-in slide-in-from-right-4 duration-200">
                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                    {editingBranchId ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {editingBranchId ? 'Bilgileri güncelleyip kaydedin.' : 'Yeni şube veya depo bilgilerini girin.'}
                                </p>
                            </div>
                            <button
                                onClick={closePanel}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-base"
                            >
                                ×
                            </button>
                        </div>

                        {/* Form body */}
                        <div className="p-5 space-y-7 overflow-y-auto max-h-[calc(100vh-280px)]">

                            {/* Section 1: Temel Bilgiler */}
                            <FormSection title="📍 Temel Bilgiler">
                                <EnterpriseField label="Tür">
                                    <EnterpriseSelect value={newBranch.type} onChange={(e: any) => setNewBranch({ ...newBranch, type: e.target.value })}>
                                        <option>Şube</option>
                                        <option>Depo</option>
                                        <option>Merkez Ofis</option>
                                        <option>Home Office</option>
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label="Şube / Depo Adı">
                                    <EnterpriseInput
                                        value={newBranch.name}
                                        onChange={(e: any) => setNewBranch({ ...newBranch, name: e.target.value })}
                                        placeholder="Örn: İzmir Bornova Şubesi"
                                        autoFocus
                                    />
                                </EnterpriseField>
                                <EnterpriseField label="Durum">
                                    <EnterpriseSelect value={newBranch.status} onChange={(e: any) => setNewBranch({ ...newBranch, status: e.target.value })}>
                                        <option>Aktif</option>
                                        <option>Tadilat</option>
                                        <option>Kapalı</option>
                                    </EnterpriseSelect>
                                </EnterpriseField>
                            </FormSection>

                            {/* Section 2: Konum Bilgileri */}
                            <FormSection title="🗺 Konum Bilgileri">
                                <EnterpriseField label="Şehir">
                                    <EnterpriseSelect
                                        value={newBranch.city}
                                        onChange={(e: any) => setNewBranch({ ...newBranch, city: e.target.value, district: '' })}
                                    >
                                        <option value="">Şehir Seçin</option>
                                        {TURKISH_CITIES.map((city: string) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label="İlçe">
                                    <EnterpriseSelect
                                        value={newBranch.district}
                                        onChange={(e: any) => setNewBranch({ ...newBranch, district: e.target.value })}
                                        disabled={!newBranch.city}
                                    >
                                        <option value="">İlçe Seçin</option>
                                        {(TURKISH_DISTRICTS[newBranch.city] || []).map((d: string) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label="Açık Adres">
                                    <EnterpriseInput
                                        value={newBranch.address}
                                        onChange={(e: any) => setNewBranch({ ...newBranch, address: e.target.value })}
                                        placeholder="Mahalle, Cadde, No..."
                                    />
                                </EnterpriseField>
                            </FormSection>

                            {/* Section 3: İletişim */}
                            <FormSection title="📞 İletişim">
                                <EnterpriseField label="Telefon">
                                    <EnterpriseInput
                                        value={newBranch.phone}
                                        onChange={(e: any) => setNewBranch({ ...newBranch, phone: e.target.value })}
                                        placeholder="0212 000 00 00"
                                    />
                                </EnterpriseField>
                                <EnterpriseField label="Yönetici">
                                    <EnterpriseInput
                                        value={newBranch.manager}
                                        onChange={(e: any) => setNewBranch({ ...newBranch, manager: e.target.value })}
                                        placeholder="Ad Soyad"
                                    />
                                </EnterpriseField>
                            </FormSection>
                        </div>

                        {/* Panel footer */}
                        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                            <EnterpriseButton variant="secondary" onClick={closePanel}>
                                Vazgeç
                            </EnterpriseButton>
                            <EnterpriseButton variant="primary" onClick={handleSave}>
                                {editingBranchId ? '💾 Kaydet' : '+ Şube Ekle'}
                            </EnterpriseButton>
                        </div>
                    </div>
                )}
            </div>

            {/* ── KASA & ÖDEME YÖNTEMLERİ ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* SOL: ÖDEME YÖNTEMİ BUTONLARI */}
                <div className="bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ödeme Yöntemi Butonları</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Hızlı işlem (POS/Nakit) butonları</p>
                        </div>
                        <EnterpriseButton
                            variant={showKasaDefinitions ? 'secondary' : 'primary'}
                            onClick={() => setShowKasaDefinitions(!showKasaDefinitions)}
                        >
                            {showKasaDefinitions ? 'Kapat' : '+ Yeni Buton'}
                        </EnterpriseButton>
                    </div>

                    {showKasaDefinitions && (
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <EnterpriseField label="Buton Adı">
                                    <EnterpriseInput
                                        value={newPaymentMethod.label}
                                        onChange={(e: any) => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })}
                                        placeholder="Nakit, Bonus..."
                                    />
                                </EnterpriseField>
                                <EnterpriseField label="İşlem Tipi">
                                    <EnterpriseSelect
                                        value={newPaymentMethod.type}
                                        onChange={(e: any) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })}
                                    >
                                        <option value="cash">Nakit (Kasa)</option>
                                        <option value="card">Kredi Kartı / POS</option>
                                        <option value="transfer">Havale / EFT</option>
                                    </EnterpriseSelect>
                                </EnterpriseField>
                            </div>
                            <div className="flex gap-2">
                                <EnterpriseButton variant="primary" onClick={addPaymentMethodDefinition} className="flex-1">
                                    {editingPaymentMethodId ? 'Güncelle' : 'Ekle'}
                                </EnterpriseButton>
                                {editingPaymentMethodId && (
                                    <EnterpriseButton variant="secondary" onClick={() => {
                                        setEditingPaymentMethodId(null);
                                        setNewPaymentMethod({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' });
                                    }}>
                                        İptal
                                    </EnterpriseButton>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(paymentMethods || []).length === 0 && !showKasaDefinitions && (
                            <div className="px-5 py-8 text-center">
                                <p className="text-sm text-slate-400 dark:text-slate-500">Ödeme yöntemi tanımlanmamış.</p>
                            </div>
                        )}
                        {(paymentMethods || []).map((pm: any) => (
                            <div key={pm.id} className="group flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm">
                                        {pm.icon || '💳'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{pm.label}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{pm.type}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditingPaymentMethod(pm)}
                                        className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs"
                                    >✏️</button>
                                    <button
                                        onClick={() => removePaymentMethodDefinition(pm.id)}
                                        className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                                    >×</button>
                                </div>
                            </div>
                        ))}

                        {/* Sabit: Veresiye */}
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/30">
                            <div className="w-8 h-8 bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm">📖</div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Veresiye</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Sistem tarafından sabitlenmiştir</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ: KASA & BANKA HESAPLARI */}
                <div className="bg-white dark:bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Kasa & Banka Hesapları</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Para giriş-çıkışı yapılan hesaplar</p>
                        </div>
                        <EnterpriseButton
                            variant={showKasaModal ? 'secondary' : 'primary'}
                            onClick={() => {
                                setEditingKasa(null);
                                setNewKasa({ name: '', type: 'Nakit', branch: 'Merkez', balance: 0 });
                                setShowKasaModal(!showKasaModal);
                            }}
                        >
                            {showKasaModal ? 'Kapat' : '+ Yeni Hesap'}
                        </EnterpriseButton>
                    </div>

                    {showKasaModal && (
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <EnterpriseField label="Hesap Adı">
                                <EnterpriseInput
                                    value={newKasa.name}
                                    onChange={(e: any) => setNewKasa({ ...newKasa, name: e.target.value })}
                                    placeholder="Merkez Nakit, Garanti Bankası..."
                                />
                            </EnterpriseField>
                            <div className="grid grid-cols-2 gap-3">
                                <EnterpriseField label="Tip">
                                    <EnterpriseSelect value={newKasa.type} onChange={(e: any) => setNewKasa({ ...newKasa, type: e.target.value })}>
                                        {(kasaTypes || []).map((t: string) => <option key={t} value={t}>{t}</option>)}
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label="Şube">
                                    <EnterpriseSelect value={newKasa.branch} onChange={(e: any) => setNewKasa({ ...newKasa, branch: e.target.value })}>
                                        <option value="Global">Küresel (Tümü)</option>
                                        {(contextBranches || []).map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    </EnterpriseSelect>
                                </EnterpriseField>
                            </div>
                            {!editingKasa && (
                                <EnterpriseField label="Açılış Bakiyesi">
                                    <EnterpriseInput
                                        type="number"
                                        value={newKasa.balance}
                                        onChange={(e: any) => setNewKasa({ ...newKasa, balance: Number(e.target.value) })}
                                        placeholder="0.00"
                                    />
                                </EnterpriseField>
                            )}
                            <EnterpriseButton
                                variant={editingKasa ? 'secondary' : 'primary'}
                                onClick={handleSaveKasa}
                                disabled={isProcessingKasa}
                                className="w-full"
                            >
                                {isProcessingKasa ? 'İşleniyor...' : editingKasa ? '💾 Güncelle' : 'Hesabı Oluştur'}
                            </EnterpriseButton>
                        </div>
                    )}

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(kasalar || []).length === 0 && !showKasaModal && (
                            <div className="px-5 py-8 text-center">
                                <p className="text-sm text-slate-400 dark:text-slate-500">Henüz hesap oluşturulmamış.</p>
                            </div>
                        )}
                        {(kasalar || []).map((k: any) => (
                            <div key={k.id} className="group flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        {k.type.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{k.name}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {k.type} · {k.branch || 'Merkez'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                                        ₺{(Number(k.balance) || 0).toLocaleString('tr-TR')}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditingKasa(k)}
                                            className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs"
                                        >✏️</button>
                                        <button
                                            onClick={() => handleDeleteKasa(String(k.id))}
                                            className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                                        >×</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
