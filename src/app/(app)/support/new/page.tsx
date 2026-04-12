"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseInput, EnterpriseSelect, EnterpriseButton, EnterpriseSectionHeader } from '@/components/ui/enterprise';
import { ChevronLeft, Send, AlertTriangle, Info, MessageSquarePlus } from 'lucide-react';

export default function NewTicketPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topicId = searchParams.get('topicId'); // Pre-fill related topic if coming from help page

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        subject: '',
        category: 'GENERAL',
        priority: 'P3_NORMAL',
        description: ''
    });

    const categoryOptions = [
        { value: 'GENERAL', label: 'Genel Soru / Bilgi Talebi' },
        { value: 'BILLING', label: 'Fatura, Kredi & Ödeme' },
        { value: 'TECHNICAL', label: 'Teknik Destek & Sistem' },
        { value: 'FEATURE_REQUEST', label: 'Yeni Özellik İsteği' },
        { value: 'BUG', label: 'Sistem Hatası (Bug) Bildirimi' }
    ];

    const priorityOptions = [
        { value: 'P3_NORMAL', label: 'Normal (Standart İşlem)' },
        { value: 'P4_LOW', label: 'Düşük (Acelesi Yok)' },
        { value: 'P2_HIGH', label: 'Yüksek (Operasyonu Yavaşlatıyor)' },
        { value: 'P1_URGENT', label: 'Acil (İşleyiş Tamamen Durdu)' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const browserInfo = typeof window !== 'undefined' ? navigator.userAgent : 'Unknown';
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    relatedHelpTopicId: topicId,
                    metadata: {
                        userAgent: browserInfo,
                        url: window.location.href,
                        resolution: `${window.innerWidth}x${window.innerHeight}`
                    }
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'İşlem başarısız');
            }

            const ticketData = await res.json();
            router.push(`/support/${ticketData.id || ticketData.ticket?.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnterprisePageShell
            title="Yeni Destek Talebi"
            description="Sorununuzu detaylı bir şekilde açıklayın, destek uzmanlarımız size en kısa sürede dönüş yapacaktır."
            actions={
                <Link href="/support">
                    <EnterpriseButton variant="secondary" className="h-10 px-4">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Taleplerime Dön
                    </EnterpriseButton>
                </Link>
            }
        >
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* INFORMATIVE BANNER */}
                <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 shrink-0 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 tracking-wide uppercase mb-1">Hızlı Çözüm İçin Ek Bilgi</h4>
                        <p className="text-sm font-medium text-indigo-800/80 dark:text-indigo-200/70 leading-relaxed">
                            Talebinizin daha hızlı çözülebilmesi için lütfen karşılaştığınız sorunu adımlarıyla birlikte detaylıca tarif edin. Sisteme giriş yaptığınız cihaz ve tarayıcı bilgileriniz tanısal amaçlı olarak otomatik olarak kaydedilmektedir.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <EnterpriseCard>
                        <EnterpriseSectionHeader 
                            title="Talep Detayları" 
                            subtitle="Yaşadığınız sorunu veya talebinizi aşağıdaki alanlara eksiksiz giriniz." 
                            icon={<MessageSquarePlus className="w-5 h-5" />} 
                        />
                        
                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm font-bold flex items-start gap-3 mt-4">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span className="mt-0.5">{error}</span>
                            </div>
                        )}

                        <div className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <EnterpriseSelect
                                    label="Departman / Kategori"
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categoryOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </EnterpriseSelect>
                                
                                <EnterpriseSelect
                                    label="Öncelik Derecesi"
                                    name="priority"
                                    required
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    {priorityOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </EnterpriseSelect>
                            </div>

                            <EnterpriseInput
                                label="Konu Özeti (Başlık)"
                                required
                                name="subject"
                                placeholder="Örn: E-Fatura gönderiminde 404 hatası alıyorum"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                hint="Karşılaştığınız sorunu tek cümlede özetleyin."
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    Açıklama (Detaylar)
                                </label>
                                <textarea
                                    required
                                    rows={8}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Karşılaştığınız durumu lütfen adım adım, varsa hata mesajlarıyla birlikte açıklayın..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors placeholder:text-slate-400 resize-y shadow-inner"
                                />
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 ml-1">Hata nasıl oluştu? Ekran uyarıları verdiyse tam hallerini yazın.</p>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                <EnterpriseButton
                                    type="submit"
                                    disabled={loading}
                                    variant="primary"
                                    className="h-12 px-8"
                                >
                                    {loading ? (
                                        <div className="flex gap-2 items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Gönderiliyor...</div>
                                    ) : (
                                        <div className="flex gap-2 items-center"><Send className="w-4 h-4" /> Destek Talebini Gönder</div>
                                    )}
                                </EnterpriseButton>
                            </div>
                        </div>
                    </EnterpriseCard>
                </form>
            </div>
        </EnterprisePageShell>
    );
}
