'use client';
import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { EnterprisePageShell, EnterpriseCard, EnterpriseButton, EnterpriseSectionHeader } from '@/components/ui/enterprise';
import { Plus, Trash } from 'lucide-react';

export default function YeniGelismisCMS() {
    const { showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // YENI CMS MODELLERI
    const [hero, setHero] = useState({ title: '', subtitle: '', primaryBtnText: '', visualUrl: '' });
    const [tabs, setTabs] = useState<any[]>([]);
    const [integrations, setIntegrations] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/admin/website').then(r => r.json()).then(data => {
            const page = data.pages?.[0];
            if (page) {
                const heroSection = page.sections?.find((s: any) => s.type === 'MODERN_HERO' || s.type === 'HERO');
                const tabsSection = page.sections?.find((s: any) => s.type === 'MODERN_TABS');
                const intSection = page.sections?.find((s: any) => s.type === 'MODERN_INTEGRATIONS');
                
                if (heroSection) setHero(heroSection.content);
                if (tabsSection) setTabs(tabsSection.content.items || []);
                if (intSection) setIntegrations(intSection.content.items || []);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/website/modern', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hero, tabs, integrations })
            });
            showSuccess('Başarılı', 'Yeni CMS içerikleri güncellendi!');
        } catch (e) {
            showError('Hata', 'Kaydedilemedi');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <EnterprisePageShell
            title="Website Yönetimi (Yeni Gelişmiş CMS)"
            description="Modern Landing sayfanızın tüm bileşenlerini buradan yönetebilirsiniz."
            actions={
                <EnterpriseButton onClick={handleSave} disabled={saving} variant="primary">
                    {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
                </EnterpriseButton>
            }
        >
            <div className="space-y-6">
                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Hero (Ana Ekran) Yönetimi" />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Ana Başlık (HTML Kullanabilirsiniz)</label>
                            <input className="w-full p-2 border rounded" value={hero.title || ''} onChange={e => setHero({...hero, title: e.target.value})} placeholder="E-Ticaret ve Ön Muhasebede..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Alt Başlık</label>
                            <textarea className="w-full p-2 border rounded h-24" value={hero.subtitle || ''} onChange={e => setHero({...hero, subtitle: e.target.value})} placeholder="Günümüzün rekabetçi ticaretinde..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Buton Metni</label>
                                <input className="w-full p-2 border rounded" value={hero.primaryBtnText || ''} onChange={e => setHero({...hero, primaryBtnText: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Ana Görsel URL</label>
                                <input className="w-full p-2 border rounded" value={hero.visualUrl || ''} onChange={e => setHero({...hero, visualUrl: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Platform Sekmeleri (Kişiselleştirilmiş Çözüm vb.)" />
                    {tabs.map((tab, idx) => (
                        <div key={idx} className="border p-4 rounded-lg mb-4 space-y-3 bg-slate-50/50">
                            <input className="w-full p-2 border rounded font-semibold" value={tab.title} onChange={e => { const n = [...tabs]; n[idx].title = e.target.value; setTabs(n); }} placeholder="Sekme Başlığı (Örn: Kişiselleştirilmiş Çözüm)" />
                            <textarea className="w-full p-2 border rounded h-20" value={tab.desc} onChange={e => { const n = [...tabs]; n[idx].desc = e.target.value; setTabs(n); }} placeholder="Açıklama" />
                            <div className="flex gap-4 items-center">
                                <input className="w-full p-2 border rounded text-sm" value={tab.image} onChange={e => { const n = [...tabs]; n[idx].image = e.target.value; setTabs(n); }} placeholder="Panel Görseli URL" />
                                <button onClick={() => setTabs(tabs.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 rounded font-bold px-4 py-2 transition-colors">SİL</button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setTabs([...tabs, { title: 'Yeni Sekme', desc: '', image: '' }])} className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
                        <Plus className="w-4 h-4" /> Yeni Platform Sekmesi Ekle
                    </button>
                </EnterpriseCard>

                <EnterpriseCard>
                    <EnterpriseSectionHeader title="Entegrasyon Çözümleri (E-Ticaret, Banka vb.)" />
                    {integrations.map((item, idx) => (
                        <div key={idx} className="border p-4 rounded-lg mb-4 space-y-3 bg-slate-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sol Menü Başlığı</label>
                                    <input className="w-full p-2 border rounded font-semibold" value={item.title} onChange={e => { const n = [...integrations]; n[idx].title = e.target.value; setIntegrations(n); }} placeholder="Örn: E-Ticaret" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sağ İçerik Ana Başlığı</label>
                                    <input className="w-full p-2 border rounded font-semibold" value={item.contentTitle} onChange={e => { const n = [...integrations]; n[idx].contentTitle = e.target.value; setIntegrations(n); }} placeholder="E-Ticaret Çözümleri" />
                                </div>
                            </div>
                            <input className="w-full p-2 border rounded" value={item.descLine1} onChange={e => { const n = [...integrations]; n[idx].descLine1 = e.target.value; setIntegrations(n); }} placeholder="Açıklama 1. Satır" />
                            <input className="w-full p-2 border rounded" value={item.descLine2} onChange={e => { const n = [...integrations]; n[idx].descLine2 = e.target.value; setIntegrations(n); }} placeholder="Açıklama 2. Satır" />
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Logolar (Virgülle Ayırın)</label>
                                <input className="w-full p-2 border border-slate-200 shadow-inner rounded" value={(item.logos || []).join(', ')} onChange={e => { const n = [...integrations]; n[idx].logos = e.target.value.split(',').map(s=>s.trim()); setIntegrations(n); }} placeholder="Trendyol, Hepsiburada, Amazon..." />
                            </div>
                            <div className="flex justify-end pt-2 border-t mt-2">
                                <button onClick={() => setIntegrations(integrations.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-100 rounded px-3 py-1 font-bold flex items-center gap-1 transition">
                                    <Trash className="w-4 h-4"/> Bölümü Sil
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setIntegrations([...integrations, { title: 'Yeni Kategori', contentTitle: '', descLine1: '', descLine2: '', logos: [] }])} className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
                        <Plus className="w-4 h-4" /> Yeni Entegrasyon Kategorisi Ekle
                    </button>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
