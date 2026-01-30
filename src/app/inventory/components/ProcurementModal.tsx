
import React, { useState } from 'react';
import { Product } from '@/contexts/AppContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProcurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
}

export default function ProcurementModal({ isOpen, onClose, products }: ProcurementModalProps) {
    const criticalItems = products.filter(p => (p.stock || 0) <= (p.minStock || 5));
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>(criticalItems.map(p => p.id));
    const [targetQuantities, setTargetQuantities] = useState<Record<string | number, number>>(
        criticalItems.reduce((acc, p) => {
            // Suggest ordering enough to reach minStock + 10 or similar
            const suggest = Math.max(0, (p.minStock || 5) * 2 - (p.stock || 0));
            acc[p.id] = suggest;
            return acc;
        }, {} as Record<string | number, number>)
    );

    if (!isOpen) return null;

    const handleExportExcel = () => {
        const data = criticalItems
            .filter(p => selectedIds.includes(p.id))
            .map(p => ({
                'Ürün Kodu': p.code,
                'Barkod': p.barcode,
                'Ürün Adı': p.name,
                'Marka': p.brand,
                'Kategori': p.category,
                'Mevcut Stok': p.stock,
                'Kritik Seviye': p.minStock,
                'Sipariş Miktarı': targetQuantities[p.id] || 0,
                'Tedarikçi': p.supplier || 'Belirtilmemiş'
            }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Tedarik Listesi");
        XLSX.writeFile(wb, `Tedarik_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add font support for Turkish characters if needed (default fonts often fail with Turkish chars)
        // For simplicity, we'll try to use standard ASCII or just hope for the best, 
        // but robust Turkish support usually requires adding a custom font.
        // We will stick to basic display for now.

        doc.setFontSize(18);
        doc.text("Tedarik Planlama Listesi", 14, 22);

        doc.setFontSize(11);
        doc.text(`Olusturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 30);

        const tableData = criticalItems
            .filter(p => selectedIds.includes(p.id))
            .map(p => [
                p.code,
                p.name, // Note: Turkish chars might be an issue without custom font
                p.brand || '-',
                String(p.stock || 0),
                String(p.minStock || 5),
                String(targetQuantities[p.id] || 0),
                p.supplier || '-'
            ]);

        autoTable(doc, {
            head: [['Kod', 'Urun Adi', 'Marka', 'Stok', 'Kritik', 'Siparis', 'Tedarikci']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        doc.save(`Tedarik_Listesi_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const toggleSelect = (id: string | number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const updateQty = (id: string | number, val: number) => {
        setTargetQuantities(prev => ({ ...prev, [id]: val }));
    };

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-5xl bg-[#080911] rounded-[40px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-500/10 to-transparent">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            <span className="text-4xl">📋</span> Gelişmiş Tedarik Planlayıcı
                        </h2>
                        <p className="text-muted text-xs font-bold uppercase tracking-[2px] mt-1 opacity-60">Kritik seviyeleri normalize etmek için ürün seçin</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-3xl font-light transition-all">×</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-[11px] font-black text-white/40 uppercase tracking-widest">
                                <th className="px-6 py-2">Seç</th>
                                <th className="px-6 py-2">Ürün Bilgisi</th>
                                <th className="px-6 py-2 text-center">Mevcut</th>
                                <th className="px-6 py-2 text-center">Kritik</th>
                                <th className="px-6 py-2 text-center">Önerilen</th>
                                <th className="px-6 py-2">Sipariş Miktarı</th>
                            </tr>
                        </thead>
                        <tbody>
                            {criticalItems.map(p => (
                                <tr key={p.id} className={`group transition-all ${selectedIds.includes(p.id) ? 'bg-white/[0.03]' : 'opacity-40'}`}>
                                    <td className="px-6 py-4 rounded-l-2xl">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(p.id)}
                                            onChange={() => toggleSelect(p.id)}
                                            className="w-5 h-5 accent-red-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white">{p.name}</span>
                                            <span className="text-[10px] text-white/40 font-bold">{p.code} • {p.brand}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-sm font-black ${p.stock <= 0 ? 'text-red-500' : 'text-amber-500'}`}>{p.stock}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-white/60">{p.minStock || 5}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-black text-emerald-400">+{Math.max(0, (p.minStock || 5) * 2 - (p.stock || 0))}</span>
                                    </td>
                                    <td className="px-6 py-4 rounded-r-2xl">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={targetQuantities[p.id] || 0}
                                                onChange={(e) => updateQty(p.id, parseInt(e.target.value) || 0)}
                                                className="w-24 bg-black/40 border border-white/10 rounded-xl p-2 text-center text-sm font-black focus:border-red-500 outline-none"
                                            />
                                            <span className="text-[10px] font-black text-white/20">ADET</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {criticalItems.length === 0 && (
                        <div className="py-20 text-center">
                            <span className="text-6xl block mb-4">✨</span>
                            <p className="text-white/40 font-bold">Tüm stoklar güvenli seviyede.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Planlanan Kalem Sayısı</span>
                        <span className="text-2xl font-black text-white">{selectedIds.length} Ürün</span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl border border-white/10 text-white/60 font-black text-xs hover:bg-white/5 transition-all"
                        >
                            VAZGEÇ
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={selectedIds.length === 0}
                            className="px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-30 ripple"
                        >
                            📥 EXCEL İNDİR
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={selectedIds.length === 0}
                            className="px-10 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-xl shadow-red-500/20 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-30 ripple"
                        >
                            📄 PDF İNDİR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
