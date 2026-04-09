"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { EnterprisePageShell, EnterpriseCard, EnterpriseInput, EnterpriseButton, EnterpriseSectionHeader } from '@/components/ui/enterprise';
import { ChevronLeft, Mail, Save, FileText, Code2, Eye, LayoutTemplate, Send } from 'lucide-react';

const MOCK_TEMPLATES = [
    {
        id: 'e_invoice',
        name: 'E-Fatura Gönderimi',
        description: 'Müşteriye e-arşiv veya e-Fatura kesildiğinde otomatik giden şablon.',
        subject: '[{{companyName}}] E-Faturanız Hazır - {{invoiceNumber}}',
        content: `Merhaba {{customerName}},

{{companyName}} üzerinden yaptığınız alışverişe ait E-Faturanız ({{invoiceNumber}}) ektedir.
Toplam Tutar: {{totalAmount}}

Bizi tercih ettiğiniz için teşekkür ederiz.`,
        variables: ['{{companyName}}', '{{customerName}}', '{{invoiceNumber}}', '{{totalAmount}}', '{{downloadLink}}']
    },
    {
        id: 'welcome',
        name: 'Yeni Müşteri Hoşgeldin',
        description: 'Sisteme manuel veya otomatik eklenen kişilere giden kayıt maili.',
        subject: 'Aramıza Hoş Geldiniz - {{companyName}}',
        content: `Merhaba {{customerName}},

{{companyName}} B2B platofrmuna hoş geldiniz!
Artık sistemimize giriş yaparak özel fiyatlarla alışverişe başlayabilirsiniz.
Kullanıcı Adınız: {{customerEmail}}

Teşekkürler by Periodya`,
        variables: ['{{companyName}}', '{{customerName}}', '{{customerEmail}}']
    },
    {
        id: 'order_status',
        name: 'Sipariş Durumu Güncellemesi',
        description: 'B2B veya POS üzerinden yapılan siparişlerin "Kargoya Verildi" bildirimleri.',
        subject: 'Siparişiniz Yola Çıktı - #{{orderId}}',
        content: `Sayın {{customerName}},

{{orderId}} numaralı siparişiniz kargoya teslim edilmiştir.
Kargo Firması: {{shippingCompany}}
Takip No: {{trackingNumber}}

Kargo Takibi: {{trackingLink}}`,
        variables: ['{{customerName}}', '{{orderId}}', '{{shippingCompany}}', '{{trackingNumber}}', '{{trackingLink}}']
    }
];

export default function MailTemplatesPage() {
    const [templates, setTemplates] = useState(MOCK_TEMPLATES);
    const [activeTab, setActiveTab] = useState<string>(MOCK_TEMPLATES[0].id);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const currentTemplate = templates.find(t => t.id === activeTab);

    const handleUpdate = (field: 'subject' | 'content', value: string) => {
        setTemplates(prev => prev.map(t => 
            t.id === activeTab ? { ...t, [field]: value } : t
        ));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success('Mail şablonu arka planda kaydedildi.');
        }, 800);
    };

    const sendTestEmail = () => {
        toast.info('Test maili sistem yöneticinizin (admin) kayıtlı hesabına gönderildi.');
    };

    return (
        <EnterprisePageShell
            title="E-Posta Şablonları Yönetimi"
            description="Müşterilere ve personele giden tüm otomatik e-postaların başlık, içerik ve tasarımlarını (HTML/Metin) buradan düzenleyebilirsiniz."
            actions={
                <Link href="/admin/integrations">
                    <EnterpriseButton variant="secondary" className="gap-2 px-4 h-10">
                        <ChevronLeft className="w-4 h-4" /> Switchboard'a Dön
                    </EnterpriseButton>
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Sidebar - Template Selection */}
                <div className="lg:col-span-4 space-y-4">
                    <EnterpriseCard className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-white/5">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-white/5">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <LayoutTemplate className="w-4 h-4 text-fuchsia-500" /> Şablon Türleri
                            </h3>
                        </div>
                        <div className="flex flex-col">
                            {templates.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => setActiveTab(tpl.id)}
                                    className={\`text-left p-4 border-b border-slate-100 dark:border-white/5 transition-colors \${activeTab === tpl.id ? 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-l-4 border-l-fuchsia-500' : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-4 border-l-transparent'}\`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === tpl.id ? 'bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}\`}>
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className={\`text-sm font-bold \${activeTab === tpl.id ? 'text-fuchsia-700 dark:text-fuchsia-300' : 'text-slate-800 dark:text-slate-200'}\`}>
                                                {tpl.name}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tpl.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="bg-fuchsia-50 dark:bg-fuchsia-500/5 border border-fuchsia-100 dark:border-fuchsia-500/20 shadow-none">
                        <h4 className="text-xs font-black text-fuchsia-800 dark:text-fuchsia-300 uppercase tracking-widest mb-2">Kullanılabilir Değişkenler</h4>
                        <p className="text-xs text-fuchsia-700/80 dark:text-fuchsia-200/60 mb-4">Şu an seçili şablon içindeki dinamik alanlar (Süslü parantez ile yazılır):</p>
                        <div className="flex flex-wrap gap-2">
                            {currentTemplate?.variables.map((v, i) => (
                                <span key={i} className="px-2 py-1 bg-white dark:bg-slate-900 border border-fuchsia-200 dark:border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-400 text-[10px] font-mono rounded-md shadow-sm">
                                    {v}
                                </span>
                            ))}
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Right Area - Editor */}
                <div className="lg:col-span-8">
                    {currentTemplate && (
                        <EnterpriseCard className="h-full flex flex-col p-6 shadow-sm border border-slate-200 dark:border-white/5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-fuchsia-500" /> {currentTemplate.name}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">HTML kodları ve text değişkenleri kullanılabilir.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                                    <button 
                                        onClick={() => setIsPreviewMode(false)}
                                        className={\`flex-1 sm:flex-none flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all \${!isPreviewMode ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                                    >
                                        <Code2 className="w-4 h-4" /> Düzenle
                                    </button>
                                    <button 
                                        onClick={() => setIsPreviewMode(true)}
                                        className={\`flex-1 sm:flex-none flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all \${isPreviewMode ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}
                                    >
                                        <Eye className="w-4 h-4" /> Önizle
                                    </button>
                                </div>
                            </div>

                            {!isPreviewMode ? (
                                <div className="space-y-5 flex-1">
                                    <EnterpriseInput 
                                        label="Mail Başlığı (Subject)"
                                        value={currentTemplate.subject}
                                        onChange={(e) => handleUpdate('subject', e.target.value)}
                                        hint="Bu alan spame düşmemek için net ve kısa olmalıdır."
                                    />
                                    
                                    <div className="space-y-2 flex-1 flex flex-col h-full">
                                        <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">HTML İçerik (Body)</label>
                                        <textarea 
                                            className="w-full flex-1 min-h-[300px] p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-300 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 transition-all resize-y shadow-inner leading-relaxed"
                                            value={currentTemplate.content}
                                            onChange={(e) => handleUpdate('content', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-xl min-h-[400px]">
                                    <div className="bg-white border text-black border-slate-200 shadow-md p-8 rounded-lg max-w-2xl mx-auto font-sans">
                                        <h3 className="text-lg font-bold border-b pb-4 mb-4 border-slate-200">
                                            Konu: {currentTemplate.subject.replace(/{{([^}]+)}}/g, 'Örnek Veri')}
                                        </h3>
                                        <div 
                                            className="whitespace-pre-wrap leading-relaxed text-sm text-gray-700"
                                            dangerouslySetInnerHTML={{ 
                                                __html: currentTemplate.content.replace(/{{([^}]+)}}/g, '<span class="bg-yellow-100 text-yellow-800 font-mono px-1 rounded">[$1]</span>') 
                                            }}
                                        />
                                    </div>
                                    <p className="text-center text-xs text-slate-400 mt-4">Bu, alıcının posta kutusunda göreceği kaba bir önizlemedir.</p>
                                </div>
                            )}

                            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-3 justify-end">
                                <EnterpriseButton variant="secondary" onClick={sendTestEmail} className="h-10">
                                    <Send className="w-4 h-4 mr-2" /> Kendime Test Gönder
                                </EnterpriseButton>
                                <EnterpriseButton variant="primary" onClick={handleSave} disabled={isSaving} className="h-10 px-8">
                                    {isSaving ? 'Kaydediliyor...' : <><Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet</>}
                                </EnterpriseButton>
                            </div>
                        </EnterpriseCard>
                    )}
                </div>

            </div>
        </EnterprisePageShell>
    );
}
