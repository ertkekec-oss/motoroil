"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { Download, Trash2, Upload, File, FileText, FileSpreadsheet } from 'lucide-react';

export default function ExportReportsContent() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [reports, setReports] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/exports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            showError("Hata", "Dosya boyutu 20MB'dan küçük olmalıdır.");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('reportType', 'GENERAL'); // Default type for manual uploads

            const res = await fetch('/api/exports/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                await fetchReports();
                showSuccess("Başarılı", "Rapor arşive eklendi.");
            } else {
                const err = await res.json();
                showError("Hata", err.error || "Rapor yüklenemedi.");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "Dosya yüklenirken bir sorun oluştu.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const res = await fetch(`/api/exports/${id}/download`);
            const data = await res.json();

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            } else {
                showError("Hata", data.error || "İndirme bağlantısı alınamadı");
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "İndirme sırasında bir hata oluştu");
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm("Raporu Sil", "Bu raporu arşivden kaldırmak istediğinize emin misiniz?", async () => {
            try {
                const res = await fetch(`/api/exports/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    await fetchReports();
                } else {
                    showError("Hata", "Rapor silinemedi.");
                }
            } catch (e) {
                console.error(e);
                showError("Hata", "Silme sırasında bir hata oluştu.");
            }
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (!mimeType) return <File className="w-5 h-5 text-gray-400" />;
        if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
        return <File className="w-5 h-5 text-blue-500" />;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Dışa Aktarılan Raporlar</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Arşivlenmiş ve üretilmiş tüm sistem raporları (PDF, Excel, vb.)</p>
                    </div>

                    <label className={`flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer text-sm font-semibold ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Yükleniyor...' : 'Manuel Arşiv Ekle'}
                        <input type="file" className="hidden" accept=".pdf,.csv,.xlsx,.xls" onChange={handleFileUpload} />
                    </label>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center text-slate-500">Yükleniyor...</div>
                ) : reports.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <File className="w-12 h-12 mb-4 text-slate-400 opacity-50" />
                        <p className="text-sm font-medium">Henüz dışa aktarılmış veya arşivlenmiş rapor yok.</p>
                        <p className="text-xs opacity-75 mt-1">İleride oluşturulacak arka plan (background worker) raporları da burada listelenecektir.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/10 text-xs text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3 pl-2">Dosya</th>
                                    <th className="pb-3">Tür / Grup</th>
                                    <th className="pb-3">Oluşturulma</th>
                                    <th className="pb-3 text-right pr-2">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports?.map((report) => (
                                    <tr key={report.id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-4 pl-2">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(report.mimeType)}
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white max-w-[300px] truncate" title={report.fileName || report.name}>
                                                        {report.name || report.fileName}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {report.size ? (report.size / 1024).toFixed(0) + ' KB' : 'Bilinmiyor'} • {report.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                                                {report.reportType}
                                            </span>
                                        </td>
                                        <td className="py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(report.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-4 pr-2">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownload(report.id, report.fileName || report.name || 'report')}
                                                    className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="İndir"
                                                    disabled={report.status !== 'READY'}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(report.id)}
                                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
