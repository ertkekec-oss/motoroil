"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReplyForm({ ticketId, currentStatus }: { ticketId: string, currentStatus: string }) {
    const [body, setBody] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [statusChange, setStatusChange] = useState('');
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        setUploading(true);
        setError('');
        const newFiles = [...files];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            try {
                const res = await fetch('/api/support/attachments/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, contentType: file.type })
                });
                const { uploadUrl, fileKey } = await res.json();

                await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type },
                    body: file
                });

                newFiles.push({
                    fileName: file.name,
                    fileKey: fileKey,
                    mimeType: file.type,
                    size: file.size
                });
            } catch (err) {
                setError('Bazı dosyalar yüklenemedi.');
            }
        }
        setFiles(newFiles);
        setUploading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() && files.length === 0) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, isInternal, statusChange, attachments: files })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Mesaj gönderilemedi');
            }

            setBody('');
            setFiles([]);
            setIsInternal(false);
            setStatusChange('');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cannedResponses = [
        { title: 'Selamlama', body: 'Merhaba,\n\nTalebiniz bize ulaştı. Konuyu ilgili birime aktardım, en kısa sürede dönüş yapacağız.\n\nSaygılarımızla,\nPeriodya Destek Ekibi' },
        { title: 'Çözüm Onayı', body: 'Merhaba,\n\nİlettiğiniz sorun çözümlenmiştir. Kontrol edip onay verebilir misiniz?\n\nKeyifli çalışmalar dileriz.' },
        { title: 'Daha Fazla Bilgi', body: 'Merhaba,\n\nKonuyu detaylı inceleyebilmemiz için ekran görüntüsü veya işlem yaptığınız sayfanın URL bilgisini iletebilir misiniz?' },
    ];

    return (
        <form onSubmit={handleSubmit} className={`bg-[#0f111a] border p-4 rounded-2xl shadow-xl flex flex-col gap-4 ${isInternal ? 'border-yellow-500/50' : 'border-white/5'}`}>
            {error && <div className="text-red-400 text-xs font-medium px-4">{error}</div>}

            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded border-gray-600 bg-white/5 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className={isInternal ? 'text-yellow-500' : ''}>
                            🟡 İç Not (Internal)
                        </span>
                    </label>
                    <select
                        className="bg-white/5 border border-white/10 text-white text-[10px] px-2 py-1 rounded-lg outline-none max-w-[150px]"
                        onChange={(e) => {
                            const found = cannedResponses.find(r => r.title === e.target.value);
                            if (found) setBody(found.body);
                        }}
                    >
                        <option value="">Hazır Yanıtlar...</option>
                        {cannedResponses.map(r => <option key={r.title} value={r.title}>{r.title}</option>)}
                    </select>
                    {!isInternal && (
                        <select
                            className="bg-white/5 border border-white/10 text-white text-[10px] px-2 py-1 rounded-lg outline-none"
                            value={statusChange}
                            onChange={(e) => setStatusChange(e.target.value)}
                        >
                            <option value="">Durumu Değiştirme</option>
                            <option value="WAITING_CUSTOMER">Cevap Bekleniyor Yap</option>
                            <option value="IN_PROGRESS">İşlemde Yap</option>
                            <option value="RESOLVED">Çözüldü Yap</option>
                            <option value="CLOSED">Kapat</option>
                        </select>
                    )}
                </div>
            </div>

            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2">
                    {files.map((f, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-gray-300 flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{f.fileName}</span>
                            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 font-bold">×</button>
                        </div>
                    ))}
                </div>
            )}

            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={isInternal ? "Ekip için iç notunuzu yazın. Müşteri görmeyecek..." : "Müşteriye yanıtınızı buraya yazın..."}
                rows={5}
                required={files.length === 0}
                className={`w-full bg-white/5 border p-4 rounded-xl text-white text-sm outline-none transition-colors placeholder:text-gray-600 resize-y ${isInternal ? 'border-yellow-500/30 focus:border-yellow-500/60 bg-yellow-500/5' : 'border-white/10 focus:border-orange-500/50'}`}
            />
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2">
                        <span>📎 Ek Ekle</span>
                        <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
                    </label>
                    {uploading && <span className="text-[10px] text-orange-400 animate-pulse">Yükleniyor...</span>}
                </div>
                <button
                    type="submit"
                    disabled={loading || uploading || (!body.trim() && files.length === 0)}
                    className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 ${isInternal ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}
                >
                    {loading ? 'Gönderiliyor...' : isInternal ? 'İç Not Ekle' : 'Müşteriye Gönder'}
                </button>
            </div>
        </form>
    );
}
