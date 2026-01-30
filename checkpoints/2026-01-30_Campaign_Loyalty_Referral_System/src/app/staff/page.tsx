"use client";

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

export default function StaffPage() {
    const [activeTab, setActiveTab] = useState('list'); // list, roles, performance
    const { staff, setStaff, currentUser, hasPermission, addNotification, refreshStaff, branches } = useApp();
    const { showSuccess, showConfirm } = useModal();
    const isSystemAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);

    const [taskContent, setTaskContent] = useState('');
    const [taskPriority, setTaskPriority] = useState('normal');
    const [isProcessing, setIsProcessing] = useState(false);

    const [newStaff, setNewStaff] = useState({
        name: '', role: '', branch: '', type: 'service'
    });

    // Set default branch when branches load
    useEffect(() => {
        if (branches.length > 0 && !newStaff.branch) {
            setNewStaff(prev => ({ ...prev, branch: branches[0].name }));
        }
    }, [branches]);

    const [searchTerm, setSearchTerm] = useState('');

    const allPermissions = [
        { id: 'pos_access', label: 'Hızlı Satış (POS)', category: 'Satış' },
        { id: 'sales_archive', label: 'Geçmiş Satışları Görme', category: 'Satış' },
        { id: 'discount_auth', label: 'İskonto Yapma Yetkisi', category: 'Satış' },
        { id: 'inventory_view', label: 'Stok Görüntüleme', category: 'Depo' },
        { id: 'inventory_edit', label: 'Stok Düzenleme/Ekleme', category: 'Depo' },
        { id: 'inventory_transfer', label: 'Depolar Arası Transfer', category: 'Depo' },
        { id: 'reports_view', label: 'Raporları Görme (Dashboard)', category: 'Muhasebe' },
        { id: 'accounting_manage', label: 'Kasa/Banka Yönetimi', category: 'Muhasebe' },
        { id: 'expense_create', label: 'Gider/Ödeme Girişi', category: 'Muhasebe' },
        { id: 'customer_view', label: 'Müşteri Listesi Görme', category: 'Müşteri' },
        { id: 'customer_edit', label: 'Müşteri Bilgi Düzenleme', category: 'Müşteri' },
        { id: 'supplier_view', label: 'Tedarikçileri Görme', category: 'Tedarikçi' },
        { id: 'finance_view', label: 'Finansal Özetleri Görme', category: 'Finansal Yönetim' },
        { id: 'finance_transactions', label: 'Kasa/Banka Hareketleri', category: 'Finansal Yönetim' },
        { id: 'finance_reports', label: 'Bilanço ve Kar/Zarar Raporları', category: 'Finansal Yönetim' },
        { id: 'ecommerce_view', label: 'E-Ticaret Satışlarını Görme', category: 'E-Ticaret' },
        { id: 'ecommerce_manage', label: 'E-Ticaret Sipariş Yönetimi', category: 'E-Ticaret' },
        { id: 'staff_manage', label: 'Personel Yönetimi', category: 'Yönetim' },
        { id: 'settings_manage', label: 'Sistem Ayarlarını Değiştirme', category: 'Yönetim' },
        { id: 'security_access', label: 'Güvenlik Masasına Erişim', category: 'Yönetim' },
        { id: 'delete_records', label: '🔴 Kayıt Silme', category: 'Kritik Yetkiler' },
        { id: 'create_staff', label: '🔴 Personel Ekleme', category: 'Kritik Yetkiler' },
        { id: 'create_bank', label: '🔴 Kasa/Banka Açma', category: 'Kritik Yetkiler' },
        { id: 'approve_products', label: '🔴 Ürün Kartı Onaylama', category: 'Kritik Yetkiler' },
        { id: 'branch_isolation', label: '❌ Sadece Kendi Şubesi (Zorunlu)', category: 'Güvenlik' }
    ];

    const filteredStaff = useMemo(() => {
        return staff.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.branch.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [staff, searchTerm]);

    const handleAssignTask = async () => {
        if (!taskContent) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedStaff.id,
                    currentJob: taskContent,
                    status: 'Meşgul'
                })
            });

            if (res.ok) {
                await refreshStaff();
                addNotification({
                    type: 'info',
                    icon: '⚒️',
                    text: `${selectedStaff.name} personeline görev atandı: ${taskContent.substring(0, 20)}...`
                });
                setShowTaskModal(false);
                setTaskContent('');
                showSuccess("Görev Atandı", "Personel durumu 'Meşgul' olarak güncellendi.");
            }
        } catch (e) {
            console.error('Task assign failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    const togglePermission = (permId: string) => {
        const currentPerms = selectedStaff.permissions || [];
        const newPerms = currentPerms.includes(permId)
            ? currentPerms.filter((p: string) => p !== permId)
            : [...currentPerms, permId];
        setSelectedStaff({ ...selectedStaff, permissions: newPerms });
    };

    const handleSaveStaff = async () => {
        if (!newStaff.name || !newStaff.role) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newStaff,
                    status: 'Müsait',
                    permissions: ['branch_isolation']
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowAddStaffModal(false);
                setNewStaff({ name: '', role: '', branch: branches[0]?.name || '', type: 'service' });
                showSuccess("Personel Eklendi", "Sisteme giriş yetkileri varsayılan olarak tanımlandı.");
            }
        } catch (e) {
            console.error('Save staff failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    const savePermissions = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/staff', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedStaff.id,
                    permissions: selectedStaff.permissions
                })
            });

            if (res.ok) {
                await refreshStaff();
                setShowPermissionModal(false);
                showSuccess("Yetkiler Kaydedildi", "Yeni yetki tanımları bir sonraki girişte aktif olacaktır.");
            }
        } catch (e) {
            console.error('Save permissions failed', e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteStaff = (person: any) => {
        showConfirm("Personel Silinecek", `${person.name} isimli personeli silmek istediğinizden emin misiniz?`, async () => {
            try {
                const res = await fetch(`/api/staff?id=${person.id}`, { method: 'DELETE' });
                if (res.ok) {
                    await refreshStaff();
                    showSuccess("Personel Başarıyla Silindi", "");
                }
            } catch (err) {
                console.error("Staff delete error", err);
            }
        });
    };

    return (
        <div className="p-6 pb-32 animate-fade-in relative">
            <style jsx>{`
                .staff-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 20px;
                }
                .perm-cat {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 20px;
                }
            `}</style>

            {/* --- HEADER --- */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">👥 Ekip & Yetki Yönetimi</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        <p className="text-white/60 font-medium text-sm">Personel performansı ve erişim kontrol merkezi.</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {hasPermission('create_staff') && (
                        <button onClick={() => setShowAddStaffModal(true)} className="btn btn-primary h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20">
                            <span className="text-xl">+</span>
                            <span>YENİ PERSONEL</span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- STATS OVERVIEW --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">👥</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Toplam Ekip</div>
                    <div className="text-3xl font-black text-white">{staff.length} <span className="text-xs font-normal opacity-40">Kişi</span></div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🟢</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Müsait Personel</div>
                    <div className="text-3xl font-black text-emerald-400">{staff.filter(s => s.status === 'Müsait' || s.status === 'Boşta' || !s.status).length}</div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">⚒️</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Devam Eden İŞ</div>
                    <div className="text-3xl font-black text-amber-400">{staff.filter(s => s.status === 'Meşgul').length}</div>
                </div>
                <div className="card glass p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">📈</div>
                    <div className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">Ekip Verimliliği</div>
                    <div className="text-3xl font-black text-purple-400">%94</div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="flex items-center gap-4 mb-8 bg-white/5 p-2 rounded-2xl border border-white/5">
                <div className="flex bg-black/20 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>PERSONEL LİSTESİ</button>
                    <button onClick={() => setActiveTab('roles')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'roles' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>ROLLER & İZİNLER</button>
                    <button onClick={() => setActiveTab('performance')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'performance' ? 'bg-primary text-white' : 'text-white/40 hover:text-white'}`}>PERFORMANS</button>
                </div>

                {activeTab === 'list' && (
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                        <input
                            type="text"
                            placeholder="İsim, rol veya şube ile ara..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* --- LIST TAB --- */}
            {activeTab === 'list' && (
                <div className="staff-grid">
                    {filteredStaff.map(person => (
                        <div key={person.id} className="card glass p-6 border border-white/5 hover:border-primary/30 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-white/10 flex items-center justify-center text-2xl font-black text-primary">
                                        {person.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">{person.name}</h3>
                                        <div className="text-xs text-white/40 font-bold uppercase tracking-wide">{person.role} • {person.branch}</div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${(person.status === 'Müsait' || person.status === 'Boşta' || !person.status) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                    {person.status || 'Boşta'}
                                </div>
                            </div>

                            <div className="bg-white/[0.03] rounded-2xl p-4 mb-6">
                                <div className="text-[10px] text-white/20 font-black uppercase mb-1 tracking-widest">GÜNCEL GÖREV</div>
                                <div className="text-sm text-white/80 font-medium italic">"{person.currentJob || '-'}"</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] text-white/30 font-bold uppercase mb-1">BU AY CİRO</div>
                                    <div className="text-sm font-black text-emerald-400">₺ {Number(person.earnings || 0).toLocaleString()}</div>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                    <div className="text-[9px] text-white/30 font-bold uppercase mb-1">İŞ SKORU</div>
                                    <div className="text-sm font-black text-white">{person.performance || 100}</div>
                                </div>
                            </div>

                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setSelectedStaff(person); setShowTaskModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black hover:bg-white/10 transition-all"
                                >
                                    GÖREV ATA
                                </button>
                                <button
                                    onClick={() => { setSelectedStaff(person); setShowPermissionModal(true); }}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black hover:bg-white/10 transition-all"
                                >
                                    YETKİLER
                                </button>
                                <button
                                    onClick={() => handleDeleteStaff(person)}
                                    className="flex-none px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black hover:bg-red-500/20 transition-all"
                                >
                                    🗑️ SİL
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- ROLES TAB --- */}
            {activeTab === 'roles' && (
                <div className="card glass p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[10px] text-white/40 font-black uppercase tracking-widest">
                                <th className="p-6">ROL TANIMI</th>
                                <th className="p-6">ERİŞİM KAPSAMI</th>
                                <th className="p-6">KRİTİK YETKİLER</th>
                                <th className="p-6 text-right">AKSİYON</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Yönetici', scope: 'Tam Erişim', critical: 'Tüm Sistem Kontrolü', color: 'text-primary' },
                                { name: 'Şube Müdürü', scope: 'Kendi Şubesi + Raporlar', critical: 'İskonto Yetkisi, Silme Yok', color: 'text-white' },
                                { name: 'E-Ticaret Uzmanı', scope: 'Siparişler + Ürünler', critical: 'Fiyat Güncelleme', color: 'text-white' },
                                { name: 'Servis Personeli', scope: 'İş Emirleri + Stok', critical: 'Müşteri Kaydı', color: 'text-white' }
                            ].map((role, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6 font-black text-lg">{role.name}</td>
                                    <td className="p-6 text-sm text-white/60">{role.scope}</td>
                                    <td className="p-6">
                                        <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full font-bold">{role.critical}</span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="text-xs font-black text-primary hover:underline">DÜZENLE</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- PERFORMANCE TAB --- */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card glass p-8 border-t-4 border-emerald-500">
                            <h4 className="text-muted text-xs font-black uppercase mb-4">CİRO HEDEFİ (%)</h4>
                            <div className="text-5xl font-black text-white mb-4">%82</div>
                            <div className="w-full h-2 bg-white/5 rounded-full">
                                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '82%' }}></div>
                            </div>
                        </div>
                        <div className="card glass p-8 border-t-4 border-primary">
                            <h4 className="text-muted text-xs font-black uppercase mb-4">TOPLAM PRİM</h4>
                            <div className="text-5xl font-black text-white mb-4">₺ 32,4K</div>
                            <p className="text-xs text-white/30">Bu ayki toplam hakediş.</p>
                        </div>
                        <div className="card glass p-8 border-t-4 border-purple-500">
                            <h4 className="text-muted text-xs font-black uppercase mb-4">MÜŞTERİ MEMNUNİYETİ</h4>
                            <div className="text-5xl font-black text-white mb-4">4.9</div>
                            <p className="text-xs text-white/30">Anket ortalaması (5 üzerinden).</p>
                        </div>
                    </div>

                    <div className="card glass p-0 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xl font-black">Personel Bazlı Analiz</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] text-white/40 font-black uppercase">
                                <tr>
                                    <th className="p-6">PERSONEL</th>
                                    <th className="p-6">HEDEF</th>
                                    <th className="p-6">GERÇEKLEŞEN</th>
                                    <th className="p-6">SKOR</th>
                                    <th className="p-6 text-right">HAKEDİLEN PRİM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { name: 'Kemal Yıldız', target: 50000, actual: 45000, score: '90%', bonus: 2250 },
                                    { name: 'Ayşe Bilge', target: 120000, actual: 154000, score: '128%', bonus: 4620 },
                                    { name: 'Serkan Demir', target: 15000, actual: 12500, score: '83%', bonus: 625 }
                                ].map((p, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02]">
                                        <td className="p-6 font-bold">{p.name}</td>
                                        <td className="p-6 text-white/40">₺ {p.target.toLocaleString()}</td>
                                        <td className="p-6 font-black">₺ {p.actual.toLocaleString()}</td>
                                        <td className="p-6">
                                            <span className={`font-black ${parseInt(p.score) >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{p.score}</span>
                                        </td>
                                        <td className="p-6 text-right font-black text-primary">₺ {p.bonus.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TASK MODAL --- */}
            {showTaskModal && (
                <div className="modal-overlay">
                    <div className="modal-content card glass p-8 animate-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black">⚒️ Görev Ata: {selectedStaff?.name}</h2>
                            <button onClick={() => setShowTaskModal(false)} className="close-btn">&times;</button>
                        </div>

                        <div className="space-y-6">
                            <div className="form-group">
                                <label>İş Açıklaması</label>
                                <textarea
                                    className="input-field min-h-[120px]"
                                    placeholder="Yapılacak işin detaylarını yazın..."
                                    value={taskContent}
                                    onChange={(e) => setTaskContent(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Öncelik Seviyesi</label>
                                <select className="input-field" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                                    <option value="normal">Normal Öncelik</option>
                                    <option value="high">Yüksek Öncelik</option>
                                    <option value="urgent">Acil 🔥</option>
                                </select>
                            </div>

                            <button onClick={handleAssignTask} className="w-full btn btn-primary py-4 font-black shadow-lg shadow-primary/20">
                                {isProcessing ? 'İŞLENİYOR...' : 'GÖREVİ BAŞLAT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PERMISSION MODAL --- */}
            {showPermissionModal && (
                <div className="modal-overlay">
                    <div className="modal-content card glass p-0 max-w-4xl max-h-[85vh] flex flex-col animate-in">
                        <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black">🔐 Yetki Tanımlama</h2>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">{selectedStaff?.name} • {selectedStaff?.branch} ŞUBESİ</p>
                                </div>
                                <button onClick={() => setShowPermissionModal(false)} className="close-btn">&times;</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4">
                                <span className="text-2xl">👮</span>
                                <div className="text-xs font-bold text-amber-500/80 leading-relaxed uppercase tracking-wide">
                                    Şube İzolasyonu Aktif: Bu personel sadece kendi şube verilerine erişebilir.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Array.from(new Set(allPermissions.map(p => p.category))).map(cat => (
                                    <div key={cat} className="perm-cat">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">{cat}</h4>
                                        <div className="space-y-2">
                                            {allPermissions.filter(p => p.category === cat).map(perm => (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => togglePermission(perm.id)}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedStaff.permissions?.includes(perm.id)
                                                        ? 'bg-primary/10 border-primary/30'
                                                        : 'border-white/5 hover:border-white/10'
                                                        }`}
                                                >
                                                    <span className={`text-[13px] font-medium transition-colors ${selectedStaff.permissions?.includes(perm.id) ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                                                        }`}>{perm.label}</span>
                                                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center text-[10px] ${selectedStaff.permissions?.includes(perm.id) ? 'bg-primary border-primary' : 'border-white/10'
                                                        }`}>
                                                        {selectedStaff.permissions?.includes(perm.id) && '✓'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
                            <button onClick={() => setShowPermissionModal(false)} className="px-8 py-3 rounded-xl border border-white/10 text-white/60 font-bold hover:bg-white/5">VAZGEÇ</button>
                            <button onClick={savePermissions} className="px-8 py-3 rounded-xl bg-primary text-white font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                {isProcessing ? 'İŞLENİYOR...' : 'YETKİLERİ KAYDET'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD STAFF MODAL --- */}
            {showAddStaffModal && (
                <div className="modal-overlay">
                    <div className="modal-content card glass p-8 max-w-md animate-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black">👤 Personel Kaydı</h2>
                            <button onClick={() => setShowAddStaffModal(false)} className="close-btn">&times;</button>
                        </div>

                        <div className="space-y-5">
                            <div className="form-group">
                                <label>Ad Soyad</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Personel tam adını girin"
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Rol / Unvan</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Mekanik, Satış Danışmanı vb."
                                    value={newStaff.role}
                                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Atanacak Şube</label>
                                <select className="input-field" value={newStaff.branch} onChange={(e) => setNewStaff({ ...newStaff, branch: e.target.value })}>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                                <span className="text-xl">ℹ️</span>
                                <p className="text-[10px] font-bold text-primary/80 leading-relaxed uppercase">KAYIT SONRASI ŞUBE İZOLASYONU OTOMATİK OLARAK TANIMLANACAKTIR.</p>
                            </div>

                            <button onClick={handleSaveStaff} className="w-full btn btn-primary py-4 font-black mt-4">
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'PERSONELİ EKLE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
