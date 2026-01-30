"use client";

import { useState, useRef } from 'react';
import { useModal } from '@/contexts/ModalContext';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'customer' | 'supplier' | 'invoice';
    onSuccess: () => void;
}

export default function ExcelImportModal({ isOpen, onClose, type, onSuccess }: ExcelImportModalProps) {
    const { showSuccess, showError } = useModal();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getTitle = () => {
        switch (type) {
            case 'customer': return 'Toplu Müşteri (Cari) Yükle';
            case 'supplier': return 'Toplu Tedarikçi Yükle';
            case 'invoice': return 'Toplu Alış Faturası Yükle';
        }
    };

    const getTemplateHeaders = () => {
        switch (type) {
            case 'customer': return ['Ad Soyad/Unvan', 'Telefon', 'E-Posta', 'Vergi No', 'Vergi Dairesi', 'Adres', 'Yetkili Kişi', 'IBAN'];
            case 'supplier': return ['Firma Adı', 'Kategori', 'Telefon', 'E-Posta', 'Vergi No', 'Vergi Dairesi', 'Adres', 'Yetkili Kişi', 'IBAN'];
            case 'invoice': return ['Tedarikçi (Tam Ad)', 'Fatura No', 'Fatura Tarihi', 'Vade Tarihi', 'Matrah', 'KDV', 'Toplam Tutar', 'Açıklama'];
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            readExcel(selectedFile);
        }
    };

    const readExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // İlk satır başlık olduğu için ayırıyoruz
            if (jsonData.length > 1) {
                const headers = jsonData[0] as string[];
                const rows = jsonData.slice(1).map((row: any) => {
                    const obj: any = {};
                    if (type === 'invoice') {
                        // Invoice mapping
                        obj.supplierName = row[0];
                        obj.invoiceNo = row[1];
                        obj.invoiceDate = row[2]; // Excel date needs parsing usually
                        obj.dueDate = row[3];
                        obj.amount = row[4];
                        obj.taxAmount = row[5];
                        obj.totalAmount = row[6];
                        obj.description = row[7];
                    } else if (type === 'customer') {
                        obj.name = row[0];
                        obj.phone = row[1];
                        obj.email = row[2];
                        obj.taxNumber = row[3];
                        obj.taxOffice = row[4];
                        obj.address = row[5];
                        obj.contactPerson = row[6];
                        obj.iban = row[7];
                    } else {
                        // Supplier
                        obj.name = row[0];
                        obj.category = row[1];
                        obj.phone = row[2];
                        obj.email = row[3];
                        obj.taxNumber = row[4];
                        obj.taxOffice = row[5];
                        obj.address = row[6];
                        obj.contactPerson = row[7];
                        obj.iban = row[8];
                    }
                    return obj;
                });
                setPreviewData(rows.filter(r => r.name || r.supplierName)); // Boş satırları filtrele
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;

        setIsLoading(true);
        try {
            const endpoint = type === 'customer' ? '/api/customers/import' :
                type === 'supplier' ? '/api/suppliers/import' :
                    '/api/purchasing/import';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: previewData })
            });

            const result = await res.json();
            if (result.success) {
                showSuccess('Başarılı', `✅ Başarıyla yüklendi! (${result.count} kayıt)`);
                onSuccess();
                onClose();
            } else {
                showError('Hata', '❌ Hata: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            showError('Hata', 'Bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = getTemplateHeaders();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sablon");
        XLSX.writeFile(wb, `${type}_sablon.xlsx`);
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div className="card glass animate-in" style={{ width: '800px', background: '#1e1e1e', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #333', color: '#fff' }}>
                <div className="flex-between mb-6" style={{ borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>📂 {getTitle()}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                <div className="flex-col gap-6">
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed #555', textAlign: 'center' }}>
                        <p style={{ marginBottom: '15px', color: '#aaa' }}>Lütfen aşağıdaki şablona uygun bir Excel dosyası yükleyin.</p>
                        <button onClick={downloadTemplate} className="btn btn-outline" style={{ marginRight: '10px' }}>⬇ Şablon İndir</button>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">⬆ Excel Yükle</button>
                    </div>

                    {previewData.length > 0 && (
                        <div>
                            <h4 style={{ marginBottom: '10px', color: '#bbb' }}>Önizleme ({previewData.length} Kayıt)</h4>
                            <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #333', borderRadius: '4px' }}>
                                <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#252525', color: '#aaa', position: 'sticky', top: 0 }}>
                                        <tr>
                                            {Object.keys(previewData[0]).map((key) => (
                                                <th key={key} style={{ padding: '8px', borderBottom: '1px solid #333' }}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                                {Object.values(row).map((val: any, i) => (
                                                    <td key={i} style={{ padding: '8px' }}>{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button onClick={onClose} className="btn btn-ghost">İptal</button>
                        <button
                            onClick={handleUpload}
                            disabled={previewData.length === 0 || isLoading}
                            className="btn btn-primary"
                        >
                            {isLoading ? 'Yükleniyor...' : '✅ Verileri İçeri Aktar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
