"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Plus, QrCode, Laptop, AlertCircle, RefreshCcw, DollarSign } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function AssetsPage() {
    const { currentUser, activeBranchName } = useApp();
    const { showSuccess, showError } = useModal();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedQr, setSelectedQr] = useState<any>(null);

    const [newAsset, setNewAsset] = useState({
        name: '',
        category: 'Elektronik',
        serialNumber: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        branch: activeBranchName || 'Merkez'
    });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/assets');
            const data = await res.json();
            if (data.success) {
                setAssets(data.data);
            }
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAsset = async () => {
        if (!newAsset.name) {
            showError("Hata", "Lütfen demirbaş adı giriniz.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAsset)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Başarılı", "Demirbaş başarıyla eklendi.");
                setIsAddModalOpen(false);
                setNewAsset({ name: '', category: 'Elektronik', serialNumber: '', purchasePrice: '', purchaseDate: new Date().toISOString().split('T')[0], branch: activeBranchName || 'Merkez' });
                fetchAssets();
            } else {
                showError("Hata", data.error || "Beklenmeyen hata oluştu.");
            }
        } catch (error) {
            showError("Hata", "Kayıt sırasında hata oluştu.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredAssets = assets.filter(a => 
        (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    const totalValue = assets.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
    const activeAssignments = assets.filter(a => a.assignments?.length > 0 && !a.assignments[0].returnedAt).length;

    // Simple QR Modal
    const showQr = (asset: any) => {
        setSelectedQr(asset);
        setIsQrModalOpen(true);
    };

    return (
        <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? 'bg-[#FAFAFA]' : ''}`}>
            {/* Header & KPI Banner */}
            <div className={`flex rounded-[24px] border overflow-hidden ${cardClass}`}>
                <div className={`flex-1 p-5 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Laptop className={`w-4 h-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Demirbaş</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
                        {assets.length}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Adet şirkete kayıtlı ürün</div>
                </div>
                
                <div className={`flex-1 p-5 border-r ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className={`w-4 h-4 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Zimmetlenen</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        {activeAssignments}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Personele teslim edilmiş</div>
                </div>

                <div className="flex-1 p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className={`w-4 h-4 ${isLight ? 'text-blue-500' : 'text-blue-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>Toplam Varlık Değeri</span>
                    </div>
                    <div className={`text-[28px] font-semibold tracking-tight ${textValueClass}`}>
                        {formatCurrency(totalValue)}
                    </div>
                    <div className={`text-[12px] mt-1 font-medium ${textLabelClass}`}>Alış fiyatı üzerinden hesaplandı</div>
                </div>
            </div>

            {/* List/Grid Container */}
            <div className={`mt-6 rounded-[24px] border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-sm bg-white dark:bg-[#0f172a]`}>
                {/* ═══════════════ LİSTE BAŞLIĞI VE ARAMA ═══════════════ */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest hidden sm:block">Varlık Kütüğü</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-none justify-start sm:justify-end">
                        <div className="relative w-full sm:w-[240px] shrink-0 min-w-[150px] flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                                placeholder="Seri no, barkod, etiket ara..."
                                className="w-full pl-9 pr-4 h-[36px] bg-white dark:bg-black/20 rounded-[8px] border border-slate-200 dark:border-white/10 text-[12px] font-bold outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 shadow-sm text-slate-800 dark:text-white"
                            />
                        </div>
                        <button
                            onClick={fetchAssets}
                            className="w-9 h-[36px] flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[8px] transition-colors border border-slate-200 dark:border-white/10"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            YENİ VARLIK EKLE
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                        <tr>
                            <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Varlık Detayı</th>
                            <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Kayıt Türü</th>
                            <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-center">QR / Etiket</th>
                            <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Durum & Zimmet</th>
                            <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Maliyet (Amortisman)</th>
                            <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap text-right">İşlem</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Yükleniyor...</td>
                                </tr>
                            ) : paginatedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Kayıt bulunamadı.</td>
                                </tr>
                            ) : paginatedAssets.map(asset => {
                                const activeAssignment = asset.assignments?.find((a:any) => !a.returnedAt);
                                return (
                                    <tr key={asset.id} className="h-[48px] transition-colors hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 group">
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <div className={`font-bold text-[14px] ${textValueClass}`}>{asset.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[11px] font-mono border rounded ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'} px-1`}>
                                                    SN: {asset.serialNumber || 'Bilinmiyor'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <span className={`px-2 py-1 text-[11px] font-bold border rounded-[6px] inline-block ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                                {asset.category}
                                            </span>
                                            <div className="mt-1 text-[11px] opacity-70 border-t border-dashed border-slate-400 pt-1 mt-1 inline-block w-full">
                                                Şube: {asset.branch || 'Merkez'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] text-center font-semibold text-slate-600 dark:text-slate-400">
                                            <button 
                                                onClick={() => showQr(asset)}
                                                className={`mx-auto w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors border ${isLight ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                                            >
                                                <QrCode className="w-5 h-5"/>
                                            </button>
                                            <div className="mt-1 text-[9px] font-mono text-slate-400 tracking-wider">
                                                {asset.barcode}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            {activeAssignment ? (
                                                <div>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-bold ${isLight ? 'bg-rose-50 text-rose-700' : 'bg-rose-500/10 text-rose-400'}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Zimmetli
                                                    </span>
                                                    <div className="mt-1 text-[12px] opacity-80">
                                                        👤 {activeAssignment.staff?.name || 'Personel'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-bold ${isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ofiste / Boşta
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                            <div className={`font-semibold text-[14px] ${textValueClass}`}>
                                                {formatCurrency(Number(asset.purchasePrice))}
                                            </div>
                                            <div className="text-[11px] opacity-70">
                                                Alış: {new Date(asset.purchaseDate).toLocaleDateString('tr-TR')}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400 text-right">
                                           {/* Details coming soon */}
                                           <button className="px-4 py-1.5 h-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[6px] font-bold text-[11px] transition-all whitespace-nowrap shadow-sm">Seçenekler</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Pagination currentPage={currentPage} totalPages={totalPages > 0 ? totalPages : 1} onPageChange={setCurrentPage} />
            </div>

            {/* ADD ASSET MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[500px] rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                            <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Yeni Varlık (Demirbaş)</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className={`text-[20px] leading-none ${textLabelClass} hover:${textValueClass}`}>&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Varlık Adı <span className="text-rose-500">*</span></label>
                                <input type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="Örn: Macbook Pro 16 İnç" className={`w-full px-3 py-2.5 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Kategori</label>
                                    <select value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})} className={`w-full px-3 py-2.5 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`}>
                                        <option value="Elektronik">Elektronik & Bilgisayar</option>
                                        <option value="Mobilya">Ofis & Mobilya</option>
                                        <option value="Arac">Taşıt & Araç</option>
                                        <option value="Diger">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Seri No / Plaka</label>
                                    <input type="text" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className={`w-full px-3 py-2.5 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Maliyet Tutarı (TL)</label>
                                    <input type="number" value={newAsset.purchasePrice} onChange={e => setNewAsset({...newAsset, purchasePrice: e.target.value})} className={`w-full px-3 py-2.5 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${textLabelClass}`}>Alış Tarihi</label>
                                    <input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} className={`w-full px-3 py-2.5 rounded-[12px] text-[13px] border outline-none ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-blue-500' : 'bg-[#0f172a] border-slate-700 text-slate-200 focus:border-blue-500'}`} />
                                </div>
                            </div>

                            <button onClick={handleAddAsset} disabled={isProcessing} className={`w-full mt-4 py-3.5 rounded-[12px] text-[14px] font-bold text-white transition-colors shadow-sm bg-blue-600 hover:bg-blue-700 ${isProcessing ? 'opacity-70' : ''}`}>
                                {isProcessing ? 'Kaydediliyor...' : 'Varlık Defterine İşle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal Placeholder */}
            {isQrModalOpen && selectedQr && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[9999]">
                    <div className={`w-full max-w-[340px] rounded-[24px] shadow-2xl animate-in fade-in zoom-in-95 ${cardClass}`}>
                        <div className="p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-[12px] flex items-center justify-center mb-4">
                                {/* In a real implementation we would render QRCode canvas here using qrcode.react */}
                                <QrCode className="w-16 h-16 text-slate-300"/>
                                <span className="absolute text-[10px] text-slate-400 font-bold max-w-[150px]">Karekod Oluşturuldu</span>
                            </div>
                            <h3 className={`font-bold text-[16px] mb-1 ${textValueClass}`}>{selectedQr.name}</h3>
                            <div className={`font-mono text-[13px] px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md tracking-widest ${textLabelClass}`}>
                                {selectedQr.barcode}
                            </div>
                            <p className="mt-4 text-[11px] text-slate-500">Demirbaşa yapıştırmak üzere bu barkodu yazdırabilirsiniz.</p>
                            <button onClick={() => setIsQrModalOpen(false)} className="mt-6 w-full py-2.5 rounded-[12px] font-bold text-[13px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-white/5">
                                Kapat
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
