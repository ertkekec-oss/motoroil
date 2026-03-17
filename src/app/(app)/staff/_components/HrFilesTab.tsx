"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '@/contexts/AppContext';
import { useModal } from "@/contexts/ModalContext";

interface HrFilesTabProps {
    staff: Staff[];
    setSelectedStaff: (staff: Staff) => void;
}

export default function HrFilesTab({ staff, setSelectedStaff }: HrFilesTabProps) {
    const { showConfirm, showSuccess, showError } = useModal();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState<string | number | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        showConfirm(
            "Dosyayı Sil",
            "Bu dosyayı silmek istediğinize emin misiniz?",
            async () => {
                try {
                    const res = await fetch(`/api/staff/documents?id=${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        setDocuments(prev => prev.filter(d => d.id !== id));
                        showSuccess("Bilgi", "Dosya başarıyla silindi.");
                    } else {
                        showError("Uyarı", "Dosya silinirken bir hata oluştu.");
                    }
                } catch (error) {
                    console.error('Error deleting document:', error);
                    showError("Hata", "Sistem hatası oluştu.");
                }
            }
        );
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedStaffId) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result as string;
                const res = await fetch('/api/staff/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        staffId: selectedStaffId,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileData: base64Data
                    })
                });

                if (res.ok) {
                    const newDoc = await res.json();
                    const activePerson = staff.find(s => s.id === selectedStaffId);
                    if (activePerson) {
                        newDoc.staff = { name: activePerson.name, role: activePerson.role };
                    }
                    setDocuments([newDoc, ...documents]);
                    showSuccess("Başarılı", "Dosya başarıyla yüklendi.");
                } else {
                    showError("Hata", "Dosya yüklenirken bir hata oluştu.");
                }
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            showError("Hata", "Sistem hatası oluştu.");
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const docCountsByStaff = documents.reduce((acc, doc) => {
        acc[doc.staffId] = (acc[doc.staffId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const filteredStaff = staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeStaff = staff.find(s => s.id === selectedStaffId);
    const activeStaffDocs = documents.filter(d => d.staffId === selectedStaffId);

    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden animate-fade-in min-h-[500px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-[#1e293b]">
                <div className="flex items-center gap-4">
                    {selectedStaffId && (
                        <button 
                            onClick={() => setSelectedStaffId(null)}
                            className="w-10 h-10 rounded-[12px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm shrink-0"
                            title="Listeye Dön"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                    )}
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{selectedStaffId ? '📂' : '📁'}</span> 
                            {selectedStaffId ? `${activeStaff?.name} - Dosyaları` : 'Personel Özlük Dosyaları Merkezi'}
                        </h3>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {selectedStaffId 
                                ? 'Personelin kimlik, sözleşme, performans evrakları ve diğer belgeleri.' 
                                : 'Tüm personelleri listeleyip belge yükleme ve yönetimi yapın.'}
                        </p>
                    </div>
                </div>

                {!selectedStaffId ? (
                    <div className="flex gap-3">
                        <div className="relative min-w-[280px]">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Personel adında ara..."
                                className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[12px] h-[40px] pl-10 pr-4 text-[13px] font-semibold outline-none focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            onChange={handleFileChange} 
                        />
                        <button 
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()} 
                            className="h-[40px] px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                        >
                            {uploading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> YÜKLENİYOR...</>
                            ) : (
                                <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> DOSYA YÜKLE</>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="overflow-x-auto p-4 max-h-[600px] overflow-y-auto custom-scroll">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-slate-500">Veriler Yükleniyor...</p>
                    </div>
                ) : !selectedStaffId ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest sticky top-0 bg-white dark:bg-[#0f172a] z-10 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="p-4 pl-6 font-bold">Personel</th>
                                <th className="p-4 font-bold">Rol / Şube</th>
                                <th className="p-4 font-bold text-center">Dosya Sayısı</th>
                                <th className="p-4 font-bold text-right pr-6">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredStaff.length > 0 ? filteredStaff.map(person => {
                                const count = docCountsByStaff[person.id] || 0;
                                return (
                                    <tr key={person.id} onClick={() => setSelectedStaffId(person.id)} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/70 transition-colors h-[64px] group cursor-pointer">
                                        <td className="p-4 pl-6 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[13px] font-black text-slate-600 dark:text-slate-400 shrink-0">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="text-[14px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors truncate">{person.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium truncate">{person.email || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#334155]/50 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5 whitespace-nowrap">{person.role}</span>
                                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap">{person.branch}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-bold bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                                {count > 0 ? (
                                                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {count} Belge</span>
                                                ) : (
                                                    <span className="opacity-50 text-slate-400">Dosya Yok</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-right pr-6">
                                            <div className="flex justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button className="h-[32px] px-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm text-[11px] tracking-wide uppercase">
                                                    Detaylar →
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 opacity-70">
                                            <div className="text-5xl mb-2">👥</div>
                                            <h4 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Personel Bulunamadı</h4>
                                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Arama kriterlerine uygun personel kaydı yok.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {activeStaffDocs.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest sticky top-0 bg-white dark:bg-[#0f172a] z-10 border-b border-slate-100 dark:border-white/5">
                                    <tr>
                                        <th className="p-4 pl-6 font-bold w-[350px]">Dosya Adı</th>
                                        <th className="p-4 font-bold">Tür / Boyut</th>
                                        <th className="p-4 font-bold">Yüklenme Tarihi</th>
                                        <th className="p-4 font-bold text-right pr-6">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {activeStaffDocs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/70 transition-colors h-[64px] group">
                                            <td className="p-4 pl-6 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-[10px] bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 flex items-center justify-center text-[18px] opacity-70 shrink-0">
                                                        {doc.fileType?.includes('pdf') ? '📕' :
                                                            doc.fileType?.includes('image') ? '🖼️' : '📄'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-slate-900 dark:text-white line-clamp-1" title={doc.fileName}>
                                                            {doc.fileName}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-slate-500 mt-0.5">Yükleyen: {doc.staff?.name || 'Sistem'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-[#334155]/50 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                                                        {doc.fileType ? doc.fileType.split('/')[1] || doc.fileType : 'Bilinmiyor'}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-slate-500 ml-1">{formatBytes(doc.fileSize)}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-[12px] font-medium text-slate-600 dark:text-slate-400">
                                                {new Date(doc.uploadedAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 align-middle text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={doc.fileData}
                                                        download={doc.fileName}
                                                        className="h-[32px] px-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm text-[11px] uppercase"
                                                        title="İndir"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                        İNDİR
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                        className="w-[32px] h-[32px] rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center font-bold transition-all shadow-sm"
                                                        title="Sil"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 opacity-70 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-[#1e293b]/30 mx-4 mt-4">
                                <div className="text-5xl mb-3">📂</div>
                                <h4 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Belge Bulunmuyor</h4>
                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 text-center max-w-sm mt-1">Bu personele ait henüz sisteme yüklenmiş bir dosya bulunmuyor. Sağ üstteki butonu kullanarak yeni belge ekleyebilirsiniz.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
