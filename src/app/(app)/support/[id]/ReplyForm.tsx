"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReplyForm({ ticketId }: { ticketId: string }) {
    const [body, setBody] = useState('');
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
                // 1. Get Presigned URL
                const res = await fetch('/api/support/attachments/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, contentType: file.type })
                });
                const { uploadUrl, fileKey } = await res.json();

                // 2. Upload to S3
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
            const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, attachments: files })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Mesaj gönderilemedi');
            }

            setBody('');
            setFiles([]);
            router.refresh(); // Fetch new messages
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#0f111a] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col gap-4">
            {error && <div className="text-red-400 text-xs font-medium px-4">{error}</div>}

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
                placeholder="Yanıtınızı buraya yazın..."
                rows={3}
                required={files.length === 0}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-orange-500/50 transition-colors placeholder:text-gray-600 resize-y"
            />
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2">
                        <span>📎 Dosya Ekle</span>
                        <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
                    </label>
                    {uploading && <span className="text-[10px] text-orange-400 animate-pulse">Yükleniyor...</span>}
                </div>
                <button
                    type="submit"
                    disabled={loading || uploading || (!body.trim() && files.length === 0)}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                >
                    {loading ? 'Gönderiliyor...' : 'Yanıt Gönder'}
                </button>
            </div>
        </form>
    );
}
