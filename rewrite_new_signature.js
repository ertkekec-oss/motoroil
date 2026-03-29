const fs = require('fs');

const code = `"use client";

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Info, Plus, Trash2, UploadCloud, Users, Send } from 'lucide-react';

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={\`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm overflow-hidden flex flex-col \${className}\`}>
        {title && (
            <div className="bg-[#f8fafc] dark:bg-[#1e293b]/50 text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest px-6 py-4 border-b border-slate-200 dark:border-white/5 sticky top-0 z-20 flex items-center gap-2">
                {icon && <span className="opacity-70 text-slate-400">{icon}</span>}
                {title}
            </div>
        )}
        <div className="flex-1 w-full relative">
            {children}
        </div>
    </div>
);

export default function NewSignaturePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('CONTRACT');
    const [otpRequired, setOtpRequired] = useState(false);
    const [recipients, setRecipients] = useState([{ name: '', email: '', phone: '', role: 'SIGNER' }]);
    const [submitting, setSubmitting] = useState(false);

    const handleAddRecipient = () => {
        setRecipients([...recipients, { name: '', email: '', phone: '', role: 'SIGNER' }]);
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
        if (!title || !file || recipients.some(r => !r.name || !r.email || (otpRequired && !r.phone))) {
            toast.error('Lütfen tüm alanları doldurun ve yüklemek için bir PDF dosyası seçin. (SMS onayında telefon zorunludur)');
            return;
        }

        setSubmitting(true);
        try {
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

            const res = await fetch('/api/signatures/envelopes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    documentFileName: uploadData.fileName || file.name,
                    documentKey: uploadData.key,
                    category,
                    recipients,
                    otpRequired
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Zarf başarıyla oluşturuldu ve hazırlandı!');
                router.push(\`/signatures/envelopes/\${data.envelope.id}\`);
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
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[48rem] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/signatures" className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#1e293b] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all shrink-0">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-[24px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                            Yeni Zarf Gönder
                        </h1>
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            İmzalanmasını istediğiniz evrakı yükleyin ve imzacıları tanımlayın.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                    
                    <SoftContainer title="Zarf ve Belge Bilgileri" icon={<Info className="w-4 h-4"/>}>
                        <div className="p-6 md:p-8 flex flex-col gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Zarf Başlığı / Konusu</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Örn: 2026 Q1 B2B Tedarik Sözleşmesi" className="w-full px-5 py-4 bg-[#f8fafc] dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-[12px] text-slate-800 dark:text-white text-[14px] font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow placeholder-slate-400 disabled:opacity-50" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Yüklenecek PDF (Max 15MB)</label>
                                    <div className="relative">
                                        <input required type="file" accept="application/pdf" onChange={handleFileChange} className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-[12px] text-slate-800 dark:text-white text-[14px] font-medium outline-none focus:border-blue-500 transition-shadow file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:bg-blue-50 file:dark:bg-blue-500/10 file:text-blue-600 file:dark:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-500/20" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">İşlem Kategorisi</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-5 py-4 bg-[#f8fafc] dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/10 rounded-[12px] text-slate-800 dark:text-white text-[14px] font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow appearance-none">
                                        <option value="CONTRACT">Sözleşme (Contract)</option>
                                        <option value="AGREEMENT">Anlaşma (Agreement)</option>
                                        <option value="COMPANY_DOCUMENT">Şirket Evrakı</option>
                                        <option value="FORM">Genel Form/Tutanak</option>
                                    </select>
                                </div>
                            </div>
                            
                            <label className="flex items-center gap-3 mt-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={otpRequired} onChange={e => setOtpRequired(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-[#0f172a] checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none drop-shadow-sm text-white">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                </div>
                                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">SMS ile Doğrula (MFA/OTP Koruması)</span>
                            </label>
                            {otpRequired && (
                                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mt-1 shadow-sm">
                                    DİKKAT: İmzacıların sisteme erişimi telefon numaralarına gönderilecek SMS kodlarıyla sağlanacaktır.
                                </div>
                            )}
                        </div>
                    </SoftContainer>

                    <SoftContainer title="İmzacı Akışı Yönetimi" icon={<Users className="w-4 h-4"/>}>
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">İmzacı Sıralaması (Hiyerarşi)</h3>
                                <button type="button" onClick={handleAddRecipient} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors font-sans">
                                    <Plus className="w-4 h-4"/> YENİ İMZACI EKLE
                                </button>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                {recipients.map((r, i) => (
                                    <div key={i} className="flex gap-4 p-5 bg-[#f8fafc] dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-2xl relative transition-shadow hover:shadow-sm group">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600 dark:text-slate-400 shrink-0 mt-3 border border-slate-300 dark:border-slate-700">
                                            {i + 1}
                                        </div>
                                        
                                        <div className={\`flex-1 grid \${otpRequired ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'} gap-4\`}>
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">İmzacı Adı Soyadı</label>
                                                <input required value={r.name} onChange={e => handleChangeRecipient(i, 'name', e.target.value)} type="text" placeholder="Ahmet Yılmaz" className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-[13px] font-medium outline-none focus:border-blue-500 transition-shadow" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">E-Posta Adresi</label>
                                                <input required value={r.email} onChange={e => handleChangeRecipient(i, 'email', e.target.value)} type="email" placeholder="ahmet@firma.com" className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-[13px] font-medium outline-none focus:border-blue-500 transition-shadow" />
                                            </div>
                                            {otpRequired && (
                                                <div className="flex flex-col">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cep Telefonu</label>
                                                    <input required value={r.phone || ''} onChange={e => handleChangeRecipient(i, 'phone', e.target.value)} type="tel" placeholder="905554443322" className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-[13px] font-medium outline-none focus:border-blue-500 transition-shadow" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Rolü (Görev)</label>
                                                <select value={r.role} onChange={e => handleChangeRecipient(i, 'role', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white text-[13px] font-medium outline-none focus:border-blue-500 transition-shadow appearance-none">
                                                    <option value="SIGNER">İmzacı</option>
                                                    <option value="APPROVER">Onaycı</option>
                                                    <option value="CC">Bilgi (CC)</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        {recipients.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveRecipient(i)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm" title="İmzacı Sil">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SoftContainer>

                    <div className="flex justify-end pt-4">
                        <button disabled={submitting} type="submit" className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 dark:border-blue-500/50 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? 'SİSTEM İŞLİYOR...' : 'DOĞRULA VE GÖNDER'} <Send className="w-4 h-4"/>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
`;

fs.writeFileSync('src/app/(app)/signatures/new/page.tsx', code);
console.log('done rewriting signatures/new/page.tsx');
