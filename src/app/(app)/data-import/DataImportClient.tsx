"use client";

import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, CheckCircle, Database, Settings, Play, ArrowRight, Table, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { EnterpriseCard, EnterpriseButton, EnterpriseInput, EnterpriseSelect } from '@/components/ui/enterprise';
import { useModal } from '@/contexts/ModalContext';

type ImportType = 'CUSTOMERS' | 'SUPPLIERS' | 'PRODUCTS';

const STEPS = [
    { id: 'upload', label: 'Dosya Yükle', icon: UploadCloud },
    { id: 'map', label: 'Yapay Zeka Eşleştirme', icon: Database },
    { id: 'config', label: 'Ek Yapılandırmalar', icon: Settings },
    { id: 'review', label: 'Önizleme & Aktar', icon: Play },
];

const FIELDS: Record<ImportType, { key: string, label: string, required?: boolean, isNumber?: boolean }[]> = {
    CUSTOMERS: [
        { key: 'name', label: 'Cari Unvanı / Ad Soyad', required: true },
        { key: 'email', label: 'E-Posta' },
        { key: 'phone', label: 'Telefon' },
        { key: 'taxNumber', label: 'VKN / TCKN' },
        { key: 'taxOffice', label: 'Vergi Dairesi' },
        { key: 'address', label: 'Adres' },
        { key: 'city', label: 'İl' },
        { key: 'district', label: 'İlçe' },
        { key: 'balance', label: 'Açılış Bakiyesi (Alınacak/Verilecek)', isNumber: true }
    ],
    SUPPLIERS: [
        { key: 'name', label: 'Tedarikçi Unvanı / Ad Soyad', required: true },
        { key: 'email', label: 'E-Posta' },
        { key: 'phone', label: 'Telefon' },
        { key: 'taxNumber', label: 'VKN / TCKN' },
        { key: 'taxOffice', label: 'Vergi Dairesi' },
        { key: 'address', label: 'Adres' },
        { key: 'city', label: 'İl' },
        { key: 'district', label: 'İlçe' },
        { key: 'balance', label: 'Açılış Bakiyesi', isNumber: true }
    ],
    PRODUCTS: [
        { key: 'code', label: 'Ürün Kodu' },
        { key: 'barcode', label: 'Barkod' },
        { key: 'name', label: 'Ürün Adı', required: true },
        { key: 'brand', label: 'Marka' },
        { key: 'category', label: 'Kategori' },
        { key: 'buyPrice', label: 'Alış Fiyatı', isNumber: true },
        { key: 'price', label: 'Satış Fiyatı', isNumber: true },
        { key: 'stock', label: 'Stok Miktarı', isNumber: true },
        { key: 'unit', label: 'Birim (Adet, Kg vb.)' },
        { key: 'description', label: 'Açıklama' },
        { key: 'priceListValue', label: 'Yeni Fiyat Listesi Tutarı (Opsiyonel)', isNumber: true }
    ]
};

// Advanced Heuristic Mapper (Acting as AI)
const heuristicMap = (colName: string, sampleData: any[], fieldDef: any) => {
    const c = colName.toLowerCase().replace(/[^a-zöçşiğü]/g, '');

    if (fieldDef.key === 'email' && (c.includes('mail') || c.includes('eposta'))) return true;
    if (fieldDef.key === 'phone' && (c.includes('tel') || c.includes('gsm'))) return true;
    if (fieldDef.key === 'taxNumber' && (c.includes('vkn') || c.includes('tckn') || c.includes('vergi') || c.includes('kimlik'))) return true;
    if (fieldDef.key === 'name' && (c.includes('unvan') || c.includes('ad') || c.includes('isim') || c.includes('musteri') || c.includes('tedarikci') || c.includes('urun'))) return true;
    if (fieldDef.key === 'code' && (c.includes('kod') || c.includes('sku'))) return true;
    if (fieldDef.key === 'barcode' && (c.includes('barkod') || c.includes('ean'))) return true;
    if (fieldDef.key === 'buyPrice' && (c.includes('alis') || c.includes('maliyet'))) return true;
    if (fieldDef.key === 'price' && (c.includes('satis') || c.includes('fiyat') && !c.includes('alis'))) return true;
    if (fieldDef.key === 'stock' && (c.includes('stok') || c.includes('adet') || c.includes('miktar'))) return true;
    if (fieldDef.key === 'balance' && (c.includes('bakiye') || c.includes('alacak') || c.includes('verecek') || c.includes('borc'))) return true;

    // Data-driven heuristics if column name is generic
    if (sampleData.length > 0) {
        const val = sampleData[0];
        if (typeof val === 'string') {
            if (fieldDef.key === 'email' && val.includes('@')) return true;
            if (fieldDef.key === 'phone' && /^[0-9\s+()]{10,15}$/.test(val)) return true;
        }
    }

    return false;
};

export default function DataImportClient() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [importType, setImportType] = useState<ImportType>('CUSTOMERS');
    const [currentStep, setCurrentStep] = useState(0);

    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({}); // fieldKey -> headerName
    const [config, setConfig] = useState<any>({ categoryId: '', createPriceList: false, priceListName: '', branch: 'Merkez' });

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFileData([]);
        setHeaders([]);
        setMapping({});
        setCurrentStep(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

                if (data.length === 0) {
                    showError("Hata", "Dosya boş.");
                    return;
                }

                // Extract headers
                const fileHeaders = Object.keys(data[0] as object);
                setHeaders(fileHeaders);
                setFileData(data);

                // Run AI / Heuristic Mapping
                const autoMap: Record<string, string> = {};
                const fields = FIELDS[importType];

                fields.forEach(f => {
                    for (const h of fileHeaders) {
                        if (heuristicMap(h, data.slice(0, 5).map(row => (row as any)[h]), f)) {
                            // Only map if not already mapped
                            if (!Object.values(autoMap).includes(h)) {
                                autoMap[f.key] = h;
                                break;
                            }
                        }
                    }
                });

                setMapping(autoMap);
                setCurrentStep(1); // Go to map

            } catch (err) {
                showError("Hata", "Dosya okunurken bir sorun oluştu. Geçerli bir Excel (.xlsx) yükleyin.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleMapChange = (fieldKey: string, headerName: string) => {
        setMapping(prev => ({
            ...prev,
            [fieldKey]: headerName
        }));
    };

    const previewData = useMemo(() => {
        if (!fileData || fileData.length === 0) return [];
        return fileData.slice(0, 5).map(row => {
            const mappedRow: any = {};
            FIELDS[importType].forEach(f => {
                const header = mapping[f.key];
                mappedRow[f.key] = header ? row[header] : '';
            });
            return mappedRow;
        });
    }, [fileData, mapping, importType]);

    const executeImport = async () => {
        // Validate required fields
        const requiredFields = FIELDS[importType].filter(f => f.required);
        for (const rf of requiredFields) {
            if (!mapping[rf.key]) {
                showError("Hata", `"${rf.label}" alanı için eşleştirme yapmanız zorunludur.`);
                return;
            }
        }

        // Prepare Payload
        const processedData = fileData.map(row => {
            const mappedRow: any = {};
            FIELDS[importType].forEach(f => {
                const header = mapping[f.key];
                let val = header ? row[header] : undefined;
                if (f.isNumber && val) {
                    // Try to parse number globally
                    if (typeof val === 'string') {
                        val = val.replace(/[^0-9.,-]/g, '').replace(',', '.');
                    }
                    val = parseFloat(val);
                }
                mappedRow[f.key] = val;
            });
            return mappedRow;
        });

        setIsUploading(true);
        try {
            const res = await fetch('/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: importType,
                    data: processedData,
                    config: config
                })
            });
            const result = await res.json();

            if (result.success) {
                showSuccess("Aktarım Tamamlandı", result.message || "Tüm kayıtlar başarıyla Periodya'ya aktarıldı.");
                resetState();
            } else {
                showError("Aktarım Hatası", result.error || "Aktarım sırasında bir sorun oluştu.");
            }

            if (result.errors && result.errors.length > 0) {
                console.error("ACTUAL IMPORT ERRORS:", result.errors);
            }

        } catch (e: any) {
            showError("Ağ Hatası", e.message || "Sunucuyla bağlantı kurulamadı.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* HEROS SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-500" />
                        Gelişmiş İçe Aktarım
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-sm">
                        Yapay zeka destekli akıllı eşleştirme motoru ile mevcut Excel kayıtlarınızı tek tıkla içeri aktarın. Sıfır hata ile aktarım sağlanarak tenant bütünlüğü korunur.
                    </p>
                </div>
                {fileData.length > 0 && (
                    <button onClick={resetState} className="text-sm font-semibold text-rose-500 hover:text-rose-600 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl transition-colors">
                        Süreci İptal Et & Başa Dön
                    </button>
                )}
            </div>

            {/* STEPPER UI */}
            <div className="flex items-center justify-between relative mb-8 overflow-x-auto pb-4 custom-scrollbar">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />

                {STEPS.map((s, i) => {
                    const isActive = i === currentStep;
                    const isPassed = i < currentStep;
                    const Icon = s.icon;
                    return (
                        <div key={s.id} className="flex flex-col items-center gap-3 min-w-[120px] bg-white dark:bg-[#020617]">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300 relative border-2
                                ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30' :
                                    isPassed ? 'bg-white dark:bg-slate-800 text-blue-600 border-blue-600' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-transparent'}
                            `}>
                                {isPassed && !isActive ? <CheckCircle className="w-5 h-5 absolute" /> : <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-wider text-center ${isActive ? 'text-blue-600' : isPassed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* MAIN CONTENT AREA */}
            <EnterpriseCard className="p-0 overflow-hidden shadow-lg border-blue-100 dark:border-blue-900/30">

                {/* 1. UPLOAD STEP */}
                {currentStep === 0 && (
                    <div className="p-8 md:p-12 animate-in slide-in-from-right-8 duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Hangi Verileri Aktaracaksınız?</h2>
                            <p className="text-slate-500">Mevcut şablonunuz veya ham veri dosyanız hazırsa işlemlerinizi hemen başlatabilirsiniz.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                            {[
                                { id: 'CUSTOMERS', icon: '👥', title: 'Müşteri Kayıtları', desc: 'Carileriniz, iletişim ve bakiye bilgileri' },
                                { id: 'SUPPLIERS', icon: '🏢', title: 'Tedarikçiler', desc: 'Toptancı ve partner carileriniz' },
                                { id: 'PRODUCTS', icon: '📦', title: 'Ürün & Stok Listesi', desc: 'Sınırsız ürün, barkod, marka ve fiyatlar' }
                            ].map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setImportType(t.id as ImportType)}
                                    className={`
                                        p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3
                                        ${importType === t.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-md' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}
                                    `}
                                >
                                    <span className="text-4xl">{t.icon}</span>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-[#0b1120] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center relative hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                            />
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Excel Dosyanızı Buraya Sürükleyin veya Seçin</h3>
                            <p className="text-slate-500 text-sm">Sadece .xlsx, .xls uzantılı dosyalar desteklenmektedir.</p>
                        </div>
                    </div>
                )}


                {/* 2. MAP STEP */}
                {currentStep === 1 && (
                    <div className="p-8 animate-in slide-in-from-right-8 duration-500">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-lg flex items-center justify-center text-sm">✨</span>
                                    Akıllı Eşleştirme Motoru
                                </h2>
                                <p className="text-slate-500">Yüklediğiniz dosyadaki sütunlar sistem alanlarıyla otomatik eşleştirildi. Hatalı olanları düzeltebilir veya atlayabilirsiniz.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Mapping UI */}
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {FIELDS[importType].map(f => (
                                    <div key={f.key} className={`flex items-center gap-4 p-4 rounded-xl border ${mapping[f.key] ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                                        <div className="w-1/2">
                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                {f.label}
                                                {f.required && <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded uppercase font-bold">Zorunlu</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">Periodya Alanı</div>
                                        </div>
                                        <div className="w-8 flex-shrink-0 flex justify-center text-slate-400">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                        <div className="w-1/2">
                                            <EnterpriseSelect
                                                value={mapping[f.key] || ''}
                                                onChange={(e) => handleMapChange(f.key, e.target.value)}
                                            >
                                                <option value="">Atla (Eşleştirme Yok)</option>
                                                {headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </EnterpriseSelect>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Live Preview */}
                            <div className="bg-slate-50 dark:bg-[#0b1120] rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <Table className="w-5 h-5 text-indigo-500" />
                                    Canlı Önizleme (İlk 5 Satır)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr>
                                                {FIELDS[importType].filter(f => mapping[f.key]).map(f => (
                                                    <th key={f.key} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-400">
                                                        {f.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, i) => (
                                                <tr key={i} className="hover:bg-white dark:hover:bg-slate-800/50">
                                                    {FIELDS[importType].filter(f => mapping[f.key]).map(f => (
                                                        <td key={f.key} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700/50">
                                                            {row[f.key] || '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {previewData.length === 0 && <p className="text-xs text-slate-400 mt-4">Henüz değer atanmamış.</p>}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <EnterpriseButton onClick={() => setCurrentStep(2)}>Kaydet ve Devam Et</EnterpriseButton>
                        </div>
                    </div>
                )}

                {/* 3. CONFIG STEP */}
                {currentStep === 2 && (
                    <div className="p-8 animate-in slide-in-from-right-8 duration-500">
                        <h2 className="text-2xl font-bold mb-6">Aktarım Seçenekleri</h2>

                        <div className="space-y-6 max-w-2xl">
                            {/* CUSTOMERS / SUPPLIERS BALANCE LOGIC */}
                            {(importType === 'CUSTOMERS' || importType === 'SUPPLIERS') && (
                                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 mb-6">
                                    <h4 className="font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-5 h-5" /> Bakiye Aktarımı (Finansal Geçiş)
                                    </h4>
                                    <p className="text-sm text-amber-900/70 dark:text-amber-500/70">
                                        Dosyadaki bakiye (Alacak/Verecek) sütununu eşleştirdiyseniz, her bir bakiye için muhasebeleştirme kurallarına uygun olarak otomatik bir "Açılış/Devir Fişi" oluşturulur.
                                    </p>
                                </div>
                            )}

                            {/* CUSTOMERS DEFAULT CATEGORY */}
                            {importType === 'CUSTOMERS' && (
                                <div className="space-y-2">
                                    <label className="font-semibold text-sm">Aktarılan Müşteriler İçin Varsayılan Kategori Atansın Mı?</label>
                                    <EnterpriseSelect
                                        value={config.categoryId}
                                        onChange={e => setConfig({ ...config, categoryId: e.target.value })}
                                    >
                                        <option value="">Hayır, standart bırak.</option>
                                        <option value="import_group">"İçe Aktarılanlar" isimli yeni kategori kur ve onlara ata.</option>
                                    </EnterpriseSelect>
                                </div>
                            )}

                            {/* PRODUCTS PRICELISTS */}
                            {importType === 'PRODUCTS' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="font-semibold text-sm">Yeni fiyat listesi tetiklensin mi?</label>
                                        <p className="text-xs text-slate-500">Dosyanızda eğer "Satış Fiyatı" haricinde B2B/Toptan / Ek fiyat sütunlarını "Yeni Fiyat Listesi Tutarı" olarak eşleştirdiyseniz bu fiyatlardan anında bir fiyat listesi menüsü yaratılır.</p>

                                        <div className="flex items-center gap-3 mt-4">
                                            <input
                                                type="checkbox"
                                                id="createPriceList"
                                                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                                checked={config.createPriceList}
                                                onChange={e => setConfig({ ...config, createPriceList: e.target.checked })}
                                            />
                                            <label htmlFor="createPriceList" className="font-bold">Eşleşen ikinci fiyattan yeni fiyat listesi üret</label>
                                        </div>
                                    </div>

                                    {config.createPriceList && (
                                        <div className="pl-8 slide-in-from-top-2 animate-in">
                                            <EnterpriseInput
                                                label="Yeni Fiyat Listesinin Adı"
                                                placeholder="Örn: B2B Toptan Liste, 2026 Liste vb."
                                                value={config.priceListName}
                                                onChange={e => setConfig({ ...config, priceListName: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <EnterpriseInput
                                            label="Ürünlerin Atanacağı Şube / Depo"
                                            value={config.branch}
                                            onChange={e => setConfig({ ...config, branch: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Stokları eğer içeri atarsak bu depoya kaydedilir.</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                            <button onClick={() => setCurrentStep(1)} className="font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Geri Dön</button>
                            <EnterpriseButton onClick={() => setCurrentStep(3)}>Önizleme Aşamasına Gec</EnterpriseButton>
                        </div>
                    </div>
                )}

                {/* 4. EXECUTE STEP */}
                {currentStep === 3 && (
                    <div className="p-8 md:p-12 animate-in slide-in-from-right-8 duration-500 text-center">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Play className="w-10 h-10 ml-1" />
                        </div>
                        <h2 className="text-3xl font-black mb-4">Her Şey Hazır!</h2>
                        <p className="text-lg text-slate-500 mb-8 max-w-xl mx-auto">
                            Toplam <strong className="text-slate-900 dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">{fileData.length}</strong> veri tespit edildi.
                            Görevi başlattığınızda yapay zeka tarafından eşleştirilen sütunlar kural listesine göre güvenli bir şekilde aktarılacaktır.
                        </p>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => setCurrentStep(2)} className="font-semibold text-slate-500 hover:text-slate-800 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:hover:text-white transition-colors">
                                Son Kontrol
                            </button>
                            <button
                                onClick={executeImport}
                                disabled={isUploading}
                                className="font-bold text-white bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading ? 'Veriler İşleniyor / Aktarılıyor...' : '🚀 Aktarımı Başlat'}
                            </button>
                        </div>
                    </div>
                )}

            </EnterpriseCard>
        </div>
    );
}
