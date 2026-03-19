"use client";

import React, { useState } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { Download, FileSpreadsheet, Briefcase, Building2, Ticket, PackageOpen, DownloadCloud, Import } from 'lucide-react';

export default function AdvisorExportModule() {
    const { showSuccess, showWarning, showError } = useModal();
    const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedSoftware, setSelectedSoftware] = useState('LUCA'); // LUCA, ZIRVE, MIKRO, LOGO
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = (type: 'PAYROLL' | 'INVOICES' | 'FINANCE' | 'CHECKS') => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            showSuccess('Aktarım Tamamlandı', `${type} verileri ${selectedSoftware} formunda başarıyla dışa aktarıldı. Dosya indirmeleriniz başladı.`);
            // In a real implementation, this would trigger a download of an XML or CSV file.
            const dummyContent = `<?xml version="1.0" encoding="UTF-8"?>\n<${selectedSoftware}_DATA>\n  <TYPE>${type}</TYPE>\n  <PERIOD>${selectedPeriod}</PERIOD>\n  <STATUS>SUCCESS</STATUS>\n</${selectedSoftware}_DATA>`;
            const blob = new Blob([dummyContent], { type: 'text/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedSoftware}_${type}_${selectedPeriod}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1500);
    };

    const handleExportAll = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            showSuccess('Tam Aktarım Başarılı', `Tüm muhasebe verileri (Faturalar, Finans, Bordro, Çekler) ${selectedSoftware} paketine uygun olarak indirildi.`);
        }, 2000);
    };

    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col gap-8 min-h-[600px]">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shrink-0">
                            <Import className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-[20px] font-black tracking-tight text-slate-900 dark:text-white">
                                Resmi Muhasebe Paket Aktarımı (Entegrasyon)
                            </h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                                Ön muhasebe verilerinizi (Faturalar, Hakedişler, Çekler vb.) resmi mali müşavir yazılımlarına <br className="hidden md:block"/> uyumlu XML/Excel formatında saniyeler içinde aktarın.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 ml-[52px] md:ml-0 bg-slate-50 dark:bg-[#1e293b] p-4 rounded-[16px] border border-slate-200 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Aktarım Dönemi</label>
                            <input
                                type="month"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="h-10 px-3 rounded-[10px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[13px] font-semibold focus:border-blue-500 outline-none w-[180px]"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Muhasebe Programı</label>
                            <select
                                value={selectedSoftware}
                                onChange={(e) => setSelectedSoftware(e.target.value)}
                                className="h-10 px-3 pr-8 rounded-[10px] bg-white dark:bg-[#0f172a] border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[13px] font-black focus:border-blue-500 outline-none appearance-none cursor-pointer w-[180px]"
                                style={{
                                    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%233b82f6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                                    backgroundPosition: "right 0.5rem center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "1.5em 1.5em"
                                }}
                            >
                                <option value="LUCA">Luca (Muhasebe)</option>
                                <option value="ZIRVE">Zirve Yazılım</option>
                                <option value="MIKRO">Mikro Yazılım</option>
                                <option value="LOGO">Logo (Go/Tiger)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. FATURALAR */}
                <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-500/20"><FileSpreadsheet className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Alış & Satış Faturaları</h3>
                            <p className="text-[11px] font-medium text-slate-500 border-none m-0 p-0 leading-tight mt-0.5">Gelen/Giden E-Fatura kayıtları, KDV ve Tevkifatlar</p>
                        </div>
                    </div>
                    <div className="flex-1 text-[12px] text-slate-600 dark:text-slate-400 mb-6 space-y-2 mt-2">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Satış Faturaları</span> <span className="font-bold text-slate-900 dark:text-white">245 Adet</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Alış Faturaları</span> <span className="font-bold text-slate-900 dark:text-white">112 Adet</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Masraf Fişleri</span> <span className="font-bold text-slate-900 dark:text-white">48 Adet</span></div>
                    </div>
                    <button 
                        onClick={() => handleExport('INVOICES')}
                        disabled={isExporting}
                        className="w-full h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[13px] border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" /> XML DIŞA AKTAR
                    </button>
                </div>

                {/* 2. BORDRO VE ÖZLÜK */}
                <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] -z-10 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-500/20"><Briefcase className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Bordro, Puantaj & Finans</h3>
                            <p className="text-[11px] font-medium text-slate-500 border-none m-0 p-0 leading-tight mt-0.5">Maaş, prim, avans ve SGK devamsızlık bildirimleri</p>
                        </div>
                    </div>
                     <div className="flex-1 text-[12px] text-slate-600 dark:text-slate-400 mb-6 space-y-2 mt-2">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Çalışan Personel</span> <span className="font-bold text-slate-800 dark:text-slate-200">12 Kişi</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> İzinli/Raporlu</span> <span className="font-bold text-slate-800 dark:text-slate-200">2 Gün</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Avans/Kesintiler</span> <span className="font-bold font-mono text-slate-800 dark:text-slate-200">₺ 4.500,00</span></div>
                    </div>
                    <button 
                         onClick={() => handleExport('PAYROLL')}
                         disabled={isExporting}
                        className="w-full h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-[13px] border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                         <Download className="w-4 h-4" /> XML DIŞA AKTAR
                    </button>
                </div>

                {/* 3. KASA & BANKA (FİNANS) */}
                <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] -z-10 group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-100 dark:border-amber-500/20"><Building2 className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Kasa & Banka Hareketleri</h3>
                            <p className="text-[11px] font-medium text-slate-500 border-none m-0 p-0 leading-tight mt-0.5">Tahsilat, tediye, virman ve banka ekstreleri</p>
                        </div>
                    </div>
                     <div className="flex-1 text-[12px] text-slate-600 dark:text-slate-400 mb-6 space-y-2 mt-2">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Kasa İşlemleri (Tahsilat/Tediye)</span> <span className="font-bold text-slate-900 dark:text-white">89 Adet</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Banka & POS İşlemleri</span> <span className="font-bold text-slate-900 dark:text-white">428 Adet</span></div>
                         <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Virman İşlemleri</span> <span className="font-bold text-slate-900 dark:text-white">4 Adet</span></div>
                    </div>
                    <button 
                         onClick={() => handleExport('FINANCE')}
                         disabled={isExporting}
                        className="w-full h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 font-bold text-[13px] border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                         <Download className="w-4 h-4" /> XML DIŞA AKTAR
                    </button>
                </div>

                {/* 4. ÇEK & SENET */}
                <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] -z-10 group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 border border-purple-100 dark:border-purple-500/20"><Ticket className="w-5 h-5" /></div>
                        <div>
                            <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Çek & Senet Bordroları</h3>
                            <p className="text-[11px] font-medium text-slate-500 border-none m-0 p-0 leading-tight mt-0.5">Alınan/Verilen çekler, portföy ve banka tahsil durumları</p>
                        </div>
                    </div>
                     <div className="flex-1 text-[12px] text-slate-600 dark:text-slate-400 mb-6 space-y-2 mt-2">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Evrak Girişi</span> <span className="font-bold text-slate-900 dark:text-white">14 Adet</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Evrak Çıkışı (Ciro/İade)</span> <span className="font-bold text-slate-900 dark:text-white">8 Adet</span></div>
                         <div className="flex items-center justify-between"><span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div> Banka Tahsile Verilen</span> <span className="font-bold text-slate-900 dark:text-white">3 Adet</span></div>
                    </div>
                    <button 
                         onClick={() => handleExport('CHECKS')}
                         disabled={isExporting}
                        className="w-full h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold text-[13px] border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                         <Download className="w-4 h-4" /> XML DIŞA AKTAR
                    </button>
                </div>
            </div>

            <div className="mt-4 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <div className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white mb-0.5">Tüm Verileri Toplu Aktar</div>
                     <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Yukarıdaki tüm verileri tek bir ZIP dosyasında (XML/CSV) indirebilirsiniz.</div>
                </div>
                <button 
                    onClick={handleExportAll}
                    disabled={isExporting}
                    className="h-12 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[13px] tracking-widest hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageOpen className="w-5 h-5" />}
                   {isExporting ? 'İŞLENİYOR...' : `TÜMÜNÜ İNDİR (${selectedSoftware})`} 
                </button>
            </div>
        </div>
    );
}
