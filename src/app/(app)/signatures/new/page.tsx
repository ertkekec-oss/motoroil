"use client";

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function NewSignaturePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('CONTRACT');
    const [recipients, setRecipients] = useState([{ name: '', email: '', role: 'SIGNER' }]);
    const [submitting, setSubmitting] = useState(false);

    const handleAddRecipient = () => {
        setRecipients([...recipients, { name: '', email: '', role: 'SIGNER' }]);
    };

    const handleRemoveRecipient = (index: number) => {
        setRecipients(recipients.filter((_, i) => i !== index));
    };

    const handleChangeRecipient = (index: number, field: string, value: string) => {
        const newR = [...recipients];
        newR[index] = { ...newR[index], [field]: value };
        setRecipients(newR);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!title || !file || recipients.some(r => !r.name || !r.email)) {
            toast.error('Lütfen tüm alanları doldurun ve yüklemek için bir PDF dosyası seçin.');
            return;
        }

        setSubmitting(true);
        try {
            // First upload the file
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadRes = await fetch('/api/uploads/signatures', {
                method: 'POST',
                body: uploadFormData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.ok) {
                toast.error(uploadData.error || 'Dosya yükleme başarısız oldu.');
                setSubmitting(false);
                return;
            }

            // Then create the envelope with the S3 key
            const res = await fetch('/api/signatures/envelopes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    documentFileName: uploadData.fileName || file.name,
                    documentKey: uploadData.key,
                    category,
                    recipients
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Zarf başarıyla oluşturuldu ve hazırlandı!');
                router.push(`/signatures/envelopes/${data.envelope.id}`);
            } else {
                toast.error(data.error || 'Zarf oluşturulamadı.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Bağlantı hatası.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <Link href="/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '24px' }} className="hover:text-blue-500">
                    <span style={{ fontSize: '16px' }}>←</span> Panoya Dön
                </Link>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                    Yeni Zarf Gönder (Sözleşme)
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
                    İmzalanmasını istediğiniz evrakı yükleyin ve imzacıları sırasıyla tanımlayın.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Zarf Bilgileri</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Zarf Başlığı / Konusu</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Örn: 2026 Q1 B2B Tedarik Sözleşmesi" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '14px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>Yüklenecek PDF Dosyası (Max 15MB)</label>
                                    <input required type="file" accept="application/pdf" onChange={handleFileChange} style={{ width: '100%', padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '14px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>İşlem Kategorisi</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '14px' }}>
                                        <option value="CONTRACT" style={{ color: 'black' }}>Sözleşme (Contract)</option>
                                        <option value="AGREEMENT" style={{ color: 'black' }}>Anlaşma (Agreement)</option>
                                        <option value="COMPANY_DOCUMENT" style={{ color: 'black' }}>Şirket Evrakı</option>
                                        <option value="FORM" style={{ color: 'black' }}>Genel Form/Tutanak</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>İmzacılar (Sıralı İmza Rejimi)</h2>
                            <button type="button" onClick={handleAddRecipient} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                                + İmzacı Ekle
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recipients.map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', position: 'relative' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', marginTop: '6px' }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 100px', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>İmzacı Adı Soyadı</label>
                                            <input required value={r.name} onChange={e => handleChangeRecipient(i, 'name', e.target.value)} type="text" placeholder="Ahmet Yılmaz" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '13px' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>E-Posta Adresi</label>
                                            <input required value={r.email} onChange={e => handleChangeRecipient(i, 'email', e.target.value)} type="email" placeholder="ahmet@firma.com" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '13px' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Rolü</label>
                                            <select value={r.role} onChange={e => handleChangeRecipient(i, 'role', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '13px' }}>
                                                <option value="SIGNER" style={{ color: 'black' }}>İmzacı</option>
                                                <option value="APPROVER" style={{ color: 'black' }}>Onaycı</option>
                                                <option value="CC" style={{ color: 'black' }}>Bilgi (CC)</option>
                                            </select>
                                        </div>
                                    </div>
                                    {recipients.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveRecipient(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer', padding: '8px' }} title="Sil">
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button disabled={submitting} type="submit" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }} className="hover:bg-blue-600 disabled:opacity-50">
                            {submitting ? 'Gönderiliyor...' : 'Doğrula ve Gönder (Başlat)'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
