"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Plus, Wrench, Calendar as CalIcon, AlertTriangle, ShieldCheck } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function AssetMaintenancePage() {
    const { showSuccess, showError } = useModal();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [maintenances, setMaintenances] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]); // To select from
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [newRecord, setNewRecord] = useState({
        assetId: '',
        type: 'REPAIR',
        cost: '',
        description: '',
        maintenanceDate: new Date().toISOString().split('T')[0],
        nextMaintenanceDate: '' // Takvim entegrasyonu için tetikleyici
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [maintData, astData] = await Promise.all([
                fetch('/api/assets/maintenance').then(r => r.json()),
                fetch('/api/assets').then(r => r.json())
            ]);
            
            if (maintData.success) setMaintenances(maintData.data);
            if (astData.success) setAssets(astData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRecord = async () => {
        if (!newRecord.assetId || !newRecord.description) {
            showError("Eksik Bilgi", "Lütfen demirbaşı ve işlemi yazın.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/assets/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord)
            });
            const data = await res.json();
            if (data.success) {
                if (newRecord.nextMaintenanceDate) {
                    showSuccess("Kayıt Başarılı", "Masraf işlendi. Global Takvim'e yeni bakım için alarm kuruldu.");
                } else {
                    showSuccess("Kayıt Başarılı", "Bakım ve masraf deftere işlendi.");
                }
                
                setIsAddModalOpen(false);
                setNewRecord({
                    assetId: '', type: 'REPAIR', cost: '', description: '', 
                    maintenanceDate: new Date().toISOString().split('T')[0], nextMaintenanceDate: ''
                });
                fetchData();
            } else {
                showError("Hata", data.error || "Beklenmeyen hata oluştu.");
            }
        } catch (error) {
            showError("Hata", "Sistem ile bağlantı kurulamadı.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredRecords = maintenances.filter(m => 
         (m.asset?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
         (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    const totalCost = maintenances.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

    return (
        <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? 'bg-[#FAFAFA]' : ''}`}>
            
            <div className={`p-6 rounded-[24px] border ${cardClass} flex flex-wrap gap-6 items-center justify-between`}>
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-amber-500 rounded-[12px] flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
                        <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className={`text-[20px] font-bold ${textValueClass}`}>Bakım ve Masraf Geçmişi</h2>
                        <p className={`text-[12px] mt-0.5 ${textLabelClass}`}>Araç muayenesi, kasko, arıza ve diğer finansal kayıtlar</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right border-r pr-6 border-slate-200 dark:border-white/10 hidden sm:block">
                        <div className={`text-[11px] font-bold uppercase tracking-widest ${textLabelClass}`}>Toplam Masraf</div>
                        <div className={`text-[18px] font-black ${isLight ? 'text-amber-600' : 'text-amber-500'}`}>{formatCurrency(totalCost)}</div>
                    </div>
                    
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-[44px] px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        BAKIM İŞLE
                    </button>
                </div>
            </div>

            <div className={`mt-6 rounded-[24px] border flex flex-col overflow-hidden shadow-sm ${cardClass}`}>
                <div className={`p-4 flex flex-wrap justify-between items-center gap-4 border-b ${isLight ? 'border-slate-200 bg-white' : 'border-white/5 bg-[#0f172a]'}`}>
                    <h3 className="text-[13px] font-black uppercase tracking-widest hidden sm:block">BAKIM DEFTerİ</h3>
                    
                    <div className="relative w-full sm:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                            placeholder="Açıklama veya cihaz ara..."
                            className={`w-full pl-9 pr-4 h-[38px] rounded-[8px] border text-[13px] font-bold outline-none transition-all focus:border-blue-500 shadow-sm ${isLight ? 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400' : 'bg-black/20 border-white/10 text-white placeholder:text-slate-500'}`}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={`text-[11px] font-semibold uppercase tracking-widest border-b ${isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-[#1e293b] text-slate-400 border-white/5'}`}>
                        <tr>
                            <th className="px-6 py-4">Tarih</th>
                            <th className="px-6 py-4">İşlem Tipi</th>
                            <th className="px-6 py-4">İlgili Varlık</th>
                            <th className="px-6 py-4">Açıklama</th>
                            <th className="px-6 py-4 text-right">Masraf (Maliyet)</th>
                        </tr>
                        </thead>
                        <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Yükleniyor...</td></tr>
                            ) : paginatedRecords.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Bakım kaydı bulunamadı.</td></tr>
                            ) : paginatedRecords.map(r => (
                                <tr key={r.id} className={`h-[54px] transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1e293b]/50'}`}>
                                    <td className="px-6 py-3 align-middle text-[12px] opacity-70 font-medium whitespace-nowrap">
                                        {new Date(r.maintenanceDate).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-bold ${
                                            r.type === 'REPAIR' ? (isLight ? 'bg-rose-50 text-rose-700' : 'bg-rose-500/10 text-rose-400') :
                                            r.type === 'INSURANCE' ? (isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/10 text-indigo-400') :
                                            r.type === 'INSPECTION' ? (isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-400') :
                                            (isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400')
                                        }`}>
                                            {r.type === 'REPAIR' && <AlertTriangle className="w-3 h-3"/>}
                                            {r.type === 'INSURANCE' && <ShieldCheck className="w-3 h-3"/>}
                                            {r.type === 'INSPECTION' && <CalIcon className="w-3 h-3"/>}
                                            {r.type === 'REPAIR' ? 'Arıza/Onarım' : r.type === 'INSURANCE' ? 'Kasko/Sigorta' : r.type === 'INSPECTION' ? 'Periyodik Muayene' : r.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 align-middle">
                                        <div className={`font-bold text-[13px] ${textValueClass}`}>{r.asset?.name || 'Bilinmiyor'}</div>
                                    </td>
                                    <td className="px-6 py-3 align-middle text-[12px] max-w-sm truncate opacity-80">
                                        {r.description || '-'}
                                    </td>
                                    <td className="px-6 py-3 align-middle text-[14px] font-semibold text-right">
                                        {Number(r.cost) > 0 ? (
                                            <span className={isLight ? 'text-amber-600' : 'text-amber-500'}>
                                                {formatCurrency(Number(r.cost))}
                                            </span>
                                        ) : <span className="opacity-40">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <Pagination currentPage={currentPage} totalPages={totalPages > 0 ? totalPages : 1} onPageChange={setCurrentPage} />
                </div>
            </div>

            {/* ADD MAINTENANCE MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[540px] rounded-[24px] shadow-2xl animate-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-bold ${textValueClass}`}>Yeni Bakım/Masraf İşle</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className={`text-[20px] ${textLabelClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>İşlem Yapılacak Varlık</label>
                                <select 
                                    value={newRecord.assetId} 
                                    onChange={e => setNewRecord({...newRecord, assetId: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] border font-bold outline-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10 text-white'}`}
                                >
                                    <option value="">-- Varlık Seçiniz --</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>İşlem Tipi</label>
                                    <select 
                                        value={newRecord.type} 
                                        onChange={e => setNewRecord({...newRecord, type: e.target.value})}
                                        className={`w-full px-3 py-3 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10 text-white'}`}
                                    >
                                        <option value="REPAIR">Arıza / Onarım</option>
                                        <option value="INSURANCE">Kasko / Trafik Sigortası</option>
                                        <option value="INSPECTION">Periyodik Bakım / Muayene</option>
                                        <option value="UPGRADE">Parça & Donanım Artırımı</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>Masraf (₺)</label>
                                    <input 
                                        type="number" 
                                        value={newRecord.cost} 
                                        onChange={e => setNewRecord({...newRecord, cost: e.target.value})}
                                        placeholder="0.00"
                                        className={`w-full px-3 py-3 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10 text-white'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${textLabelClass}`}>
                                    Yapılan İşlemin Özeti
                                </label>
                                <textarea 
                                    rows={2}
                                    placeholder="Ekran değişimi yapıldı..."
                                    value={newRecord.description} 
                                    onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                                    className={`w-full px-3 py-3 rounded-[12px] text-[13px] border outline-none resize-none ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10 text-white'}`}
                                />
                            </div>
                            
                            <hr className={`my-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />

                            {/* TAKVİM ENTEGRASYONU */}
                            <div className={`p-4 rounded-[12px] border flex gap-3 ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30'}`}>
                                <CalIcon className={`w-6 h-6 flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                                <div className="flex-1">
                                    <h4 className={`text-[13px] font-bold mb-1 ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>Sonraki Bakım Alarmı (Opsiyonel)</h4>
                                    <p className={`text-[11px] leading-relaxed mb-3 ${isLight ? 'text-blue-700/80' : 'text-blue-300/70'}`}>
                                        Bu işlem Kasko veya Muayene işlemiyse, bir sonraki geçerlilik tarihini seçin. Sistem günü geldiğinde <b>Görev Kulesine</b> alarm düşürecektir.
                                    </p>
                                    <input 
                                        type="date" 
                                        value={newRecord.nextMaintenanceDate} 
                                        onChange={e => setNewRecord({...newRecord, nextMaintenanceDate: e.target.value})}
                                        className={`w-full px-3 py-2 rounded-[8px] text-[12px] font-bold border outline-none ${isLight ? 'bg-white border-blue-200 text-blue-900 focus:border-blue-500' : 'bg-black/20 border-blue-500/30 text-white focus:border-blue-500'}`}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleAddRecord} 
                                disabled={isProcessing} 
                                className={`w-full mt-4 py-4 rounded-[12px] text-[14px] font-black tracking-widest text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-md ${isProcessing ? 'opacity-70' : ''}`}
                            >
                                {isProcessing ? 'KAYDEDİLİYOR...' : 'MASRAFI İŞLE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
