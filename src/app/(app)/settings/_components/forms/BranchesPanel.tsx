import React from 'react';
import {
    EnterpriseField,
    EnterpriseInput,
    EnterpriseSelect,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ───────────────────────────────────────────────────────
// Tüm state, handler, API, submit akışı değişmedi.
// Yalnızca UI katmanı kurumsal tasarım sistemine (flat, minimal, border-only) geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({
    icon,
    title,
    description,
    action,
}: {
    icon: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base shrink-0">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">{title}</h2>
                    {description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 ${className}`}>
            {children}
        </div>
    );
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Aktif') return null;
    return (
        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded text-[10px] font-semibold uppercase">
            {status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    return (
        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium">
            {type}
        </span>
    );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl text-slate-300 dark:text-slate-600 mb-3">{icon}</div>
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</h4>
            {description && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs">{description}</p>}
        </div>
    );
}

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

    return (
        <div className="space-y-8 max-w-6xl animate-in fade-in duration-300">

            {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
            <SectionHeader
                icon="🏪"
                title="Şubeler ve Depo Yönetimi"
                description="Firma şubelerini, depoları, belgeleri ve kasa/banka hesaplarını bu alandan yönetin."
            />

            {/* ── BRANCH FORM ─────────────────────────────────────────────── */}
            <Card>
                <CardHeader
                    title={editingBranchId ? 'Şube Düzenle' : 'Yeni Şube / Depo Ekle'}
                    subtitle={editingBranchId ? 'Şube bilgilerini güncelleyin.' : 'Yeni bir şube veya depo tanımlayın.'}
                    action={
                        editingBranchId ? (
                            <EnterpriseButton
                                variant="secondary"
                                onClick={() => {
                                    setEditingBranchId(null);
                                    setNewBranch({ name: '', type: 'Şube', city: '', district: '', address: '', phone: '', manager: '', status: 'Aktif' });
                                }}
                            >
                                Vazgeç
                            </EnterpriseButton>
                        ) : null
                    }
                />

                {/* Row 1: Kimlik alanları */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <EnterpriseField label="Tür">
                        <EnterpriseSelect value={newBranch.type} onChange={(e: any) => setNewBranch({ ...newBranch, type: e.target.value })}>
                            <option>Şube</option>
                            <option>Depo</option>
                            <option>Merkez Ofis</option>
                            <option>Home Office</option>
                        </EnterpriseSelect>
                    </EnterpriseField>

                    <EnterpriseField label="Şube / Depo Adı" className="lg:col-span-2">
                        <EnterpriseInput
                            value={newBranch.name}
                            onChange={(e: any) => setNewBranch({ ...newBranch, name: e.target.value })}
                            placeholder="Örn: İzmir Bornova Şubesi"
                        />
                    </EnterpriseField>

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
                            {(TURKISH_DISTRICTS[newBranch.city] || []).map((district: string) => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </EnterpriseSelect>
                    </EnterpriseField>
                </div>

                {/* Row 2: İletişim alanları */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <EnterpriseField label="Açık Adres" className="lg:col-span-2">
                        <EnterpriseInput
                            value={newBranch.address}
                            onChange={(e: any) => setNewBranch({ ...newBranch, address: e.target.value })}
                            placeholder="Mahalle, Cadde, No..."
                        />
                    </EnterpriseField>

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
                </div>

                {/* Row 3: Durum + Kaydet */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <EnterpriseField label="Durum" className="w-full sm:w-40">
                        <EnterpriseSelect value={newBranch.status} onChange={(e: any) => setNewBranch({ ...newBranch, status: e.target.value })}>
                            <option>Aktif</option>
                            <option>Tadilat</option>
                            <option>Kapalı</option>
                        </EnterpriseSelect>
                    </EnterpriseField>

                    <EnterpriseButton variant="primary" onClick={addBranch}>
                        {editingBranchId ? '💾 Değişiklikleri Kaydet' : '+ Şube Ekle'}
                    </EnterpriseButton>
                </div>
            </Card>

            {/* ── BRANCH LIST ─────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Kayıtlı Şubeler
                        <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium text-slate-500 dark:text-slate-400">
                            {(branches || []).length}
                        </span>
                    </h3>
                </div>

                {(branches || []).length === 0 ? (
                    <Card>
                        <EmptyState
                            icon="🏪"
                            title="Henüz şube eklenmedi"
                            description="Yukarıdaki formu doldurarak ilk şubenizi ekleyebilirsiniz."
                        />
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {branches.map((branch: any) => (
                            <Card key={branch.id} className="!p-0">
                                {/* Branch Row */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5">
                                    {/* Left: Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-base shrink-0">
                                            {branch.type === 'Depo' ? '📦' : branch.type === 'Merkez Ofis' ? '🏢' : '🏪'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <TypeBadge type={branch.type || 'Şube'} />
                                                <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate">{branch.name}</h4>
                                                <StatusBadge status={branch.status || 'Aktif'} />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                                {(branch.city || branch.district) && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-slate-400">📍</span>
                                                        {branch.city}{branch.district ? ` / ${branch.district}` : ''}
                                                    </span>
                                                )}
                                                {branch.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-slate-400">📞</span>
                                                        {branch.phone}
                                                    </span>
                                                )}
                                                {branch.manager && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-slate-400">👤</span>
                                                        {branch.manager}
                                                    </span>
                                                )}
                                            </div>
                                            {branch.address && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                                                    {branch.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setSelectedBranchDocs(selectedBranchDocs === branch.id ? null : branch.id)}
                                            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${selectedBranchDocs === branch.id
                                                ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            📁 Evraklar
                                            {(branch.docs || 0) > 0 && (
                                                <span className="text-[10px] font-semibold">{branch.docs}</span>
                                            )}
                                        </button>
                                        <EnterpriseButton variant="secondary" onClick={() => editBranch(branch)} className="!h-9 !px-3">
                                            ✏️
                                        </EnterpriseButton>
                                        <EnterpriseButton variant="danger" onClick={() => deleteBranch(branch.id)} className="!h-9 !px-3">
                                            🗑️
                                        </EnterpriseButton>
                                    </div>
                                </div>

                                {/* Evraklar Panel */}
                                {selectedBranchDocs === branch.id && (
                                    <div className="border-t border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h5 className="text-sm font-semibold text-slate-900 dark:text-white">Dijital Arşiv</h5>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Kira Kontratı, Ruhsat, Vergi Levhası vb. belgeleri buraya yükleyin.
                                                </p>
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    id={`file-upload-${branch.id}`}
                                                    className="hidden"
                                                    onChange={(e) => handleFileUpload(e, branch.id)}
                                                />
                                                <label
                                                    htmlFor={`file-upload-${branch.id}`}
                                                    className="inline-flex items-center gap-2 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                                >
                                                    ⬆ Belge Yükle
                                                </label>
                                            </div>
                                        </div>

                                        {isDocsLoading ? (
                                            <div className="flex items-center justify-center py-8 gap-1.5">
                                                {[0, 100, 200].map((delay) => (
                                                    <div
                                                        key={delay}
                                                        className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce"
                                                        style={{ animationDelay: `${delay}ms` }}
                                                    />
                                                ))}
                                            </div>
                                        ) : !branchDocs || branchDocs.length === 0 ? (
                                            <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                                <p className="text-sm text-slate-400 dark:text-slate-500">
                                                    Bu şubeye ait belge bulunmamaktadır.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {branchDocs.map((file: any) => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-xl shrink-0">
                                                                {file.fileType.includes('pdf') ? '📄' : '🖼️'}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.fileName}</p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                                    {new Date(file.uploadedAt).toLocaleDateString('tr-TR')} · {(file.fileSize / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteBranchDoc(file.id, branch.id)}
                                                            className="ml-2 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-sm"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* ── KASA & ÖDEME YÖNTEMLERİ ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* SOL: ÖDEME YÖNTEMİ BUTONLARI */}
                <Card>
                    <CardHeader
                        title="Ödeme Yöntemi Butonları"
                        subtitle="Hızlı işlem (POS/Nakit) butonlarını tanımlayın."
                        action={
                            <EnterpriseButton
                                variant={showKasaDefinitions ? 'secondary' : 'primary'}
                                onClick={() => setShowKasaDefinitions(!showKasaDefinitions)}
                            >
                                {showKasaDefinitions ? 'Kapat' : '+ Yeni Buton'}
                            </EnterpriseButton>
                        }
                    />

                    {/* Add form */}
                    {showKasaDefinitions && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 gap-3">
                                <EnterpriseField label="Buton Adı">
                                    <EnterpriseInput
                                        value={newPaymentMethod.label}
                                        onChange={(e: any) => setNewPaymentMethod({ ...newPaymentMethod, label: e.target.value })}
                                        placeholder="Nakit, Bonus, Havale..."
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
                                    <EnterpriseButton
                                        variant="secondary"
                                        onClick={() => {
                                            setEditingPaymentMethodId(null);
                                            setNewPaymentMethod({ label: '', type: 'cash', icon: '💰', linkedKasaId: '' });
                                        }}
                                    >
                                        İptal
                                    </EnterpriseButton>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment method list */}
                    <div className="space-y-2">
                        {(paymentMethods || []).length === 0 && (
                            <EmptyState icon="💳" title="Ödeme yöntemi bulunamadı" description="Yeni bir buton ekleyin." />
                        )}
                        {(paymentMethods || []).map((pm: any) => (
                            <div
                                key={pm.id}
                                className="group flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-base">
                                        {pm.icon || '💳'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{pm.label}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 capitalize">{pm.type}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditingPaymentMethod(pm)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-all"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => removePaymentMethodDefinition(pm.id)}
                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Sabit: Veresiye */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="w-9 h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-base">
                                📖
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Veresiye</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sistem tarafından sabitlenmiştir</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* SAĞ: KASA & BANKA HESAPLARI */}
                <Card>
                    <CardHeader
                        title="Kasa & Banka Hesapları"
                        subtitle="Gerçek para giriş-çıkışı yapılan hesaplar."
                        action={
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
                        }
                    />

                    {/* Add / Edit Kasa form */}
                    {showKasaModal && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <EnterpriseField label="Hesap Adı">
                                <EnterpriseInput
                                    value={newKasa.name}
                                    onChange={(e: any) => setNewKasa({ ...newKasa, name: e.target.value })}
                                    placeholder="Merkez Nakit, Garanti Bankası..."
                                />
                            </EnterpriseField>
                            <div className="grid grid-cols-2 gap-3">
                                <EnterpriseField label="Tip">
                                    <EnterpriseSelect
                                        value={newKasa.type}
                                        onChange={(e: any) => setNewKasa({ ...newKasa, type: e.target.value })}
                                    >
                                        {(kasaTypes || []).map((t: string) => <option key={t} value={t}>{t}</option>)}
                                    </EnterpriseSelect>
                                </EnterpriseField>
                                <EnterpriseField label="Şube">
                                    <EnterpriseSelect
                                        value={newKasa.branch}
                                        onChange={(e: any) => setNewKasa({ ...newKasa, branch: e.target.value })}
                                    >
                                        <option value="Global">Küresel (Tüm Şubeler)</option>
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

                    {/* Kasa list */}
                    <div className="space-y-2">
                        {(kasalar || []).length === 0 && (
                            <EmptyState icon="🏦" title="Hesap bulunamadı" description="Yeni bir kasa veya banka hesabı ekleyin." />
                        )}
                        {(kasalar || []).map((k: any) => (
                            <div
                                key={k.id}
                                className="group flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        {k.type.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{k.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500">{k.type}</span>
                                            <span className="text-[11px] text-slate-300 dark:text-slate-600">·</span>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500">{k.branch || 'Merkez'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                                        ₺{(Number(k.balance) || 0).toLocaleString('tr-TR')}
                                    </p>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditingKasa(k)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-all"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteKasa(String(k.id))}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
