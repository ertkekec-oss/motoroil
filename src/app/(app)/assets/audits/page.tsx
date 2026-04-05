"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import { QrCode, Search, CheckCircle2 } from 'lucide-react';
import { EnterpriseSectionHeader } from '@/components/ui/enterprise';

export default function AuditsPage() {
    const { activeBranchName } = useApp();
    const { showSuccess, showError } = useModal();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [assets, setAssets] = useState<any[]>([]);
    const [audits, setAudits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [barcodeInput, setBarcodeInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        fetchData();
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [assetRes, maintRes] = await Promise.all([
                fetch('/api/assets'),
                fetch('/api/assets/maintenance')
            ]);
            const assetData = await assetRes.json();
            const maintData = await maintRes.json();

            if (assetData.success) {
                setAssets(assetData.data);
            }
            if (maintData.success) {
                setAudits(maintData.data.filter((m: any) => m.type === 'AUDIT'));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput) return;

        setIsScanning(true);
        const scannedAsset = assets.find(a => a.barcode === barcodeInput || a.serialNumber === barcodeInput);

        if (!scannedAsset) {
            showError("Bulunamadı", "Bu barkoda ait bir demirbaş yok.");
            setBarcodeInput('');
            setIsScanning(false);
            if (inputRef.current) inputRef.current.focus();
            return;
        }

        try {
            const res = await fetch('/api/assets/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId: scannedAsset.id,
                    type: 'AUDIT',
                    description: 'Fiziksel barkod okutularak sayım doğrulandı.',
                    cost: 0,
                    maintenanceDate: new Date().toISOString()
                })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess("Sayım Girdi", `${scannedAsset.name} başarıyla sayıldı.`);
                setBarcodeInput('');
                fetchData();
            } else {
                showError("Hata", data.error || "Beklenmeyen hata.");
            }
        } catch (error) {
            showError("Hata", "Kayıt sırasında hata.");
        } finally {
            setIsScanning(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    const cardClass = isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-900 border border-slate-800";
    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div data-pos-theme={theme} className={`w-full min-h-[100vh] px-8 py-8 space-y-6 transition-colors duration-300 font-sans ${isLight ? 'bg-[#FAFAFA]' : ''}`}>
            
            <EnterpriseSectionHeader 
                title="FİZİKSEL SAYIM (BARKOD MERKEZİ)" 
                subtitle="El terminali veya barkod okuyucu ile işletmedeki varlıkları hızlıca kayıt altına alın"
                icon={<QrCode />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 space-y-6">
                    <div className={`p-8 rounded-[24px] border ${cardClass}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`font-bold text-[15px] ${textValueClass}`}>Barkod Okut</h3>
                            <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center">
                                <Search className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <form onSubmit={handleScan} className="space-y-4">
                            <div>
                                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${textLabelClass}`}>Etiket Kodu (Otomatik İmleç)</label>
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Barkod okutunuz..."
                                    className={`w-full h-[54px] px-4 rounded-[12px] text-[15px] font-mono font-bold border outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 shadow-inner' : 'bg-black/20 border-white/10 text-white focus:border-blue-500'}`}
                                    autoFocus
                                    disabled={isScanning}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isScanning || !barcodeInput}
                                className={`w-full h-[50px] bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold transition-all shadow-lg ${isScanning || !barcodeInput ? 'opacity-50' : ''}`}
                            >
                                {isScanning ? 'EŞLEŞTİRİLİYOR...' : 'DOĞRULA VE KAYDET'}
                            </button>
                        </form>
                    </div>

                    <div className={`p-6 rounded-[24px] border flex items-center gap-4 ${cardClass}`}>
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-[12px] flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <div className={`text-[12px] font-bold ${textLabelClass} uppercase tracking-widest`}>Toplam Sayım İzi</div>
                            <div className={`text-[28px] font-black ${textValueClass}`}>{audits.length}</div>
                        </div>
                    </div>
                </div>

                <div className={`lg:col-span-2 rounded-[24px] border overflow-hidden ${cardClass}`}>
                    <div className={`px-6 py-4 flex justify-between items-center border-b ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
                        <h3 className={`font-bold text-[14px] ${textValueClass}`}>Son Sayım Kayıtları</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={`text-[11px] font-bold uppercase tracking-widest ${isLight ? 'bg-white text-slate-400' : 'bg-slate-900/20 text-slate-500'}`}>
                                <tr>
                                    <th className={`px-6 py-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>Varlık</th>
                                    <th className={`px-6 py-4 border-b text-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>Barkod</th>
                                    <th className={`px-6 py-4 border-b text-center ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>Tarih</th>
                                    <th className={`px-6 py-4 border-b text-right ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {audits.slice(0, 20).map((audit) => (
                                    <tr key={audit.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
                                        <td className="px-6 py-4">
                                            <div className={`font-bold text-[13px] ${textValueClass}`}>{audit.asset?.name || 'Bilinmeyen Varlık'}</div>
                                            <div className={`text-[11px] mt-1 ${textLabelClass}`}>SN: {audit.asset?.serialNumber || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-mono text-[11px] px-2 py-1 rounded ${isLight ? 'bg-slate-100' : 'bg-slate-800'} ${textLabelClass}`}>
                                                {audit.asset?.barcode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`text-[12px] font-semibold ${textValueClass}`}>
                                                {new Date(audit.maintenanceDate).toLocaleDateString('tr-TR')}
                                            </div>
                                            <div className={`text-[10px] ${textLabelClass}`}>
                                                {new Date(audit.maintenanceDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <CheckCircle2 className="w-3 h-3" />
                                                ONAYLANDI
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {audits.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-[13px] font-semibold">
                                            Henüz hiç sayım kaydı yapılmamış.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
