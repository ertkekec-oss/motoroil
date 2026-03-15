"use client";

import React, { useState, useEffect } from 'react';
import { Staff } from '@/contexts/AppContext';
import { useModal } from "@/contexts/ModalContext";

interface HrFilesTabProps {
    staff: Staff[];
    setSelectedStaff: (staff: Staff) => void;
}

export default function HrFilesTab({ staff, setSelectedStaff }: HrFilesTabProps) {
    const { showSuccess, showError, showWarning } = useModal();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/staff/documents');
            const data = await res.json();
            if (Array.isArray(data)) {
                setDocuments(data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/staff/documents?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== id));
            }
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || doc.fileType?.includes(filterType);
        return matchesSearch && matchesType;
    });

    const triggerUploadForStaff = () => {
        // Personel Listesi veya Modal aracılığıyla belge eklenebilir. 
        // Şimdilik sadece yönlendirme veya mesaj.
        showError("Uyarı", 'Yeni dosya yüklemek için lütfen Personel Listesi üzerinden ilgili personelin detay (Düzenle) paneline gidin ve Belgeler sekmesini kullanın.');
    };

    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden animate-fade-in min-h-[500px]">
            {/* Header & Filters */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-[#1e293b]">
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>📁</span> Personel Özlük Dosyaları
                    </h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">Kimlik, sözleşme ve performans evrakları genel görünümü</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative min-w-[240px]">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Dosya veya personel ara..."
                            className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] h-[40px] pl-10 pr-4 text-[13px] font-semibold outline-none focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-[40px] px-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-[12px] text-[13px] outline-none focus:border-blue-500"
                    >
                        <option value="all">Tüm Dosya Türleri</option>
                        <option value="pdf">PDF</option>
                        <option value="image">Resim/Görsel</option>
                        <option value="officedocument">Ofis Belgesi</option>
                    </select>
                    <button onClick={triggerUploadForStaff} className="h-[40px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap">
                        + DOSYA YÜKLE
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto p-4 max-h-[600px] overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-slate-500">Dosyalar Yükleniyor...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest sticky top-0 bg-white dark:bg-[#0f172a] z-10 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="p-4 pl-6 font-bold w-[250px]">Personel</th>
                                <th className="p-4 font-bold">Dosya Adı</th>
                                <th className="p-4 font-bold">Tür / Boyut</th>
                                <th className="p-4 font-bold">Yüklenme Tarihi</th>
                                <th className="p-4 font-bold text-right pr-6">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map(doc => (
                                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/70 transition-colors h-[70px] group">
                                        <td className="p-4 pl-6 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[12px] font-black text-slate-600 dark:text-slate-400 shrink-0">
                                                    {(doc.staff?.name || '?').charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{doc.staff?.name || 'Bilinmeyen Personel'}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium tracking-wider uppercase truncate">{doc.staff?.role || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg opacity-70">
                                                    {doc.fileType?.includes('pdf') ? '📕' :
                                                        doc.fileType?.includes('image') ? '🖼️' : '📄'}
                                                </span>
                                                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1" title={doc.fileName}>
                                                    {doc.fileName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] font-bold bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider w-max">
                                                    {doc.fileType ? doc.fileType.split('/')[1] || doc.fileType : 'Unknown'}
                                                </span>
                                                <span className="text-[12px] font-semibold text-slate-500 ml-1">{formatBytes(doc.fileSize)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-[12px] font-medium text-slate-500 dark:text-slate-400">
                                            {new Date(doc.uploadedAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4 align-middle text-right pr-6">
                                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={doc.fileData}
                                                    download={doc.fileName}
                                                    className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm"
                                                    title="İndir"
                                                >
                                                    ⬇
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm"
                                                    title="Sil"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 opacity-70">
                                            <div className="text-5xl mb-2">📥</div>
                                            <h4 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Belge Bulunamadı</h4>
                                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Arama kriterlerine uygun veya sisteme yüklenmiş personel özlük dosyası yok.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
