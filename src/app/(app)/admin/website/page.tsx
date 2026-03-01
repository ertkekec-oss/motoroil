
'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function WebsiteManagerPage() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ pages: [], settings: {}, menus: [] });
    const [activeTab, setActiveTab] = useState<'general' | 'pages' | 'menus'>('general');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value so same file can be selected again
        e.target.value = '';

        setUploading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Maksimum genişliği 1920px olarak belirleyelim (Performans için)
                    const MAX_WIDTH = 1920;
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        // Kaliteyi %80 olarak ayarlayalım
                        const resizedUrl = canvas.toDataURL('image/jpeg', 0.82);
                        setUploading(false);
                        onSuccess(resizedUrl);
                    } else {
                        setUploading(false);
                        onSuccess(reader.result as string);
                    }
                };
                img.onerror = () => {
                    setUploading(false);
                    showError("Hata", "Görsel işlenirken hata oluştu.");
                };
                img.src = reader.result;
            }
        };
        reader.onerror = () => {
            setUploading(false);
            showError("Hata", "Dosya okuma hatası oluştu.");
        };

        reader.readAsDataURL(file);
    };

    const updateSectionContent = (index: number, field: string, value: any) => {
        setSelectedPage((prev: any) => {
            if (!prev) return prev;
            const newSections = [...prev.sections];
            newSections[index] = {
                ...newSections[index],
                content: {
                    ...newSections[index].content,
                    [field]: value
                }
            };
            return { ...prev, sections: newSections };
        });
    };

    // Form States
    const [settings, setSettings] = useState<any>({
        siteTitle: 'Periodya',
        logoUrl: '',
        primaryColor: '#446ee7',
        footerText: '',
        whatsappNumber: '',
        contactEmail: ''
    });

    const [selectedPage, setSelectedPage] = useState<any>(null);

    useEffect(() => {
        fetchCmsData();
    }, []);

    const fetchCmsData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/website');
            const json = await res.json();

            if (json.error) {
                console.error(json.error);
                showError("Hata", json.error);
                setLoading(false);
                return;
            }

            setData(json);
            if (json.settings) setSettings(json.settings);

            // Eğer daha önce bir sayfa seçiliyse onu bul, yoksa ilk sayfayı seç
            if (selectedPage) {
                const refreshed = json.pages.find((p: any) => p.id === selectedPage.id);
                if (refreshed) setSelectedPage(refreshed);
                else if (json.pages?.length > 0) setSelectedPage(json.pages[0]);
            } else if (json.pages?.length > 0) {
                setSelectedPage(json.pages[0]);
            }

            if (!json.menus || json.menus.length === 0) {
                json.menus = [
                    { id: 'new_header', name: 'Header', items: [] },
                    { id: 'new_footer', name: 'Footer', items: [] }
                ];
            }
            setData(json);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) showSuccess('Başarılı', 'Ayarlar kaydedildi!');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const saveMenus = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/website/menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.menus)
            });
            if (res.ok) showSuccess('Başarılı', 'Menüler kaydedildi!');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const createPage = async () => {
        const title = prompt('Sayfa Başlığı:');
        if (!title) return;
        const slug = prompt('Sayfa URL (Slug):', title.toLowerCase().replace(/ /g, '-'));
        if (!slug) return;

        setSaving(true);
        try {
            const res = await fetch('/api/admin/website/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, slug })
            });
            if (res.ok) {
                fetchCmsData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const deletePage = async (id: string) => {
        showConfirm('Sayfayı Sil', 'Bu sayfayı silmek istediğinize emin misiniz?', async () => {
            setSaving(true);
            try {
                const res = await fetch(`/api/admin/website/pages/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    if (selectedPage?.id === id) setSelectedPage(null);
                    showSuccess('Başarılı', 'Sayfa silindi.');
                    fetchCmsData();
                }
            } catch (error) {
                console.error(error);
                showError('Hata', 'Silme sırasında hata oluştu.');
            } finally {
                setSaving(false);
            }
        });
    };

    const savePage = async () => {
        if (!selectedPage) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/website/pages/${selectedPage.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedPage)
            });

            // Ayrıca logoyu (ve diğer genel ayarları) da kaydet
            await fetch('/api/admin/website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                showSuccess('Başarılı', 'Değişiklikler başarıyla kaydedildi!');
                fetchCmsData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const addSection = () => {
        if (!selectedPage) return;
        const newSection = {
            type: 'FEATURES',
            order: (selectedPage.sections?.length || 0) + 1,
            isActive: true, // Default to true
            content: {
                title: 'Yeni Bölüm',
                subtitle: 'Buraya bir açıklama yazın',
                items: [
                    { title: 'Özellik 1', desc: 'Açıklama 1', icon: '✨' },
                    { title: 'Özellik 2', desc: 'Açıklama 2', icon: '🚀' }
                ]
            }
        };
        const newSections = [...selectedPage.sections, newSection];
        setSelectedPage({ ...selectedPage, sections: newSections });
    };

    const removeSection = (idx: number) => {
        const newSections = selectedPage.sections.filter((_: any, i: number) => i !== idx);
        setSelectedPage({ ...selectedPage, sections: newSections });
    };



    const updateSectionType = (index: number, type: string) => {
        const newSections = [...selectedPage.sections];
        newSections[index].type = type;
        setSelectedPage({ ...selectedPage, sections: newSections });
    };

    const StyleFields = ({ section, idx, type }: { section: any, idx: number, type: 'title' | 'subtitle' }) => {
        const sizeField = `${type}Size`;
        const colorField = `${type}Color`;

        return (
            <div className="flex gap-2 items-center mt-2 bg-slate-100/50 p-2 rounded-lg border border-slate-200/50">
                <div className="flex items-center gap-1 group">
                    <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 transition">PX:</span>
                    <input
                        type="text"
                        placeholder="32px"
                        className="w-12 text-[10px] p-1 border-none bg-transparent focus:ring-0 text-slate-900"
                        value={section.content[sizeField] || ''}
                        onChange={(e) => updateSectionContent(idx, sizeField, e.target.value)}
                    />
                </div>
                <div className="w-[1px] h-3 bg-slate-300 mx-1" />
                <div className="flex items-center gap-1 group">
                    <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 transition">RENK:</span>
                    <input
                        type="color"
                        className="w-4 h-4 border-none bg-transparent cursor-pointer p-0"
                        value={section.content[colorField] || '#000000'}
                        onChange={(e) => updateSectionContent(idx, colorField, e.target.value)}
                    />
                    <input
                        type="text"
                        className="w-16 text-[10px] p-1 border-none bg-transparent focus:ring-0 text-slate-900 font-mono"
                        value={section.content[colorField] || ''}
                        onChange={(e) => updateSectionContent(idx, colorField, e.target.value)}
                    />
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Website Yönetimi (CMS)</h1>
                    <p className="text-sm text-slate-500">Landing page ve kurumsal sayfaları dinamik olarak yönetin.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => activeTab === 'general' ? saveSettings() : savePage()}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm shadow-blue-200"
                    >
                        {saving ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                    </button>
                    <a href="/" target="_blank" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-200 transition text-sm font-bold flex items-center">
                        Önizle ↗
                    </a>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'general', label: 'Genel Ayarlar', icon: '⚙️' },
                    { id: 'pages', label: 'Sayfa Üreticisi', icon: '📄' },
                    { id: 'menus', label: 'Menü Yönetimi', icon: '🍔' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {activeTab === 'general' && (
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 border-b pb-2">Görünüm ve Marka</h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Site Başlığı</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition text-slate-900"
                                    value={settings.siteTitle}
                                    onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Logo URL</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            className="flex-1 border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white text-slate-900"
                                            placeholder="https://..."
                                            value={settings.logoUrl}
                                            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                        />
                                        <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg border border-slate-200 cursor-pointer transition flex items-center gap-2 font-bold text-sm">
                                            {uploading ? '⌛' : '📁 YÜKLE'}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setSettings({ ...settings, logoUrl: url }))} />
                                        </label>
                                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 w-12 object-contain border rounded-lg p-1 bg-white" />}
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">Manuel URL girebilir veya dosya yükleyebilirsiniz.</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ana Renk (Primary)</label>
                                <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <input
                                        type="color"
                                        className="h-10 w-20 cursor-pointer border-none bg-transparent"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    />
                                    <span className="text-slate-600 font-mono text-sm uppercase font-bold">{settings.primaryColor}</span>
                                    <div className="flex-1 h-8 rounded" style={{ background: settings.primaryColor }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 border-b pb-2">İletişim ve Footer</h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Destek WhatsApp No</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 text-slate-900"
                                    placeholder="905..."
                                    value={settings.whatsappNumber}
                                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">İletişim E-posta</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 text-slate-900"
                                    value={settings.contactEmail}
                                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Footer Metni</label>
                                <textarea
                                    className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 min-h-[100px] text-slate-900"
                                    value={settings.footerText}
                                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pages' && (
                    <div className="flex flex-col min-h-[800px]">
                        {/* Top Bar: Page List */}
                        <div className="bg-slate-50 border-b border-slate-200 p-6">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SİTE SAYFALARI</p>
                                    <button
                                        onClick={createPage}
                                        className="text-blue-600 font-black text-[10px] uppercase hover:underline"
                                    >
                                        + Yeni Sayfa Oluştur
                                    </button>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {data.pages.map((p: any) => (
                                        <div key={p.id} className="relative group flex-shrink-0">
                                            <button
                                                onClick={() => setSelectedPage(p)}
                                                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm ${selectedPage?.id === p.id ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                            >
                                                {p.slug === 'index' ? '🏠' : p.slug === 'login' ? '🔐' : p.slug === 'register' ? '🚀' : '📄'} {p.title}
                                            </button>
                                            {p.slug !== 'index' && p.slug !== 'login' && p.slug !== 'register' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deletePage(p.id); }}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-[10px] items-center justify-center hidden group-hover:flex shadow-sm"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Builder Area */}
                        <div className="flex-1 bg-slate-50/30">
                            {!selectedPage ? (
                                <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="text-6xl animate-bounce">📄</div>
                                    <p className="font-bold">Düzenlemek için yukarıdan bir sayfa seçin.</p>
                                </div>
                            ) : (
                                <div className="p-8 max-w-5xl mx-auto space-y-8">
                                    {/* Page Info */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">SAYFA BAŞLIĞI (SEO)</label>
                                            <input
                                                type="text"
                                                className="w-full border-slate-200 rounded-lg font-bold"
                                                value={selectedPage.title}
                                                onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">URL SLUG</label>
                                            <input
                                                type="text"
                                                className="w-full border-slate-200 rounded-lg font-mono text-xs bg-slate-50"
                                                value={selectedPage.slug}
                                                disabled={['index', 'login', 'register'].includes(selectedPage.slug)}
                                                onChange={(e) => setSelectedPage({ ...selectedPage, slug: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Sections List */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">SAYFA BÖLÜMLERİ</h4>
                                            <button onClick={addSection} className="text-blue-600 font-bold text-xs hover:underline">+ BÖLÜM EKLE</button>
                                        </div>

                                        {selectedPage.sections?.map((section: any, idx: number) => (
                                            <div key={section.id || idx} className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-2 shadow-sm">
                                                            <span className="opacity-50 tracking-widest uppercase">BÖLÜM:</span>
                                                            <select
                                                                className="bg-transparent text-white border-none p-0 focus:ring-0 cursor-pointer text-[10px] font-black"
                                                                value={section.type}
                                                                onChange={(e) => updateSectionType(idx, e.target.value)}
                                                            >
                                                                <option value="BANNER" className="text-slate-900">BANNER (Duyuru)</option>
                                                                <option value="NAV" className="text-slate-900">NAV (Menü)</option>
                                                                <option value="HERO" className="text-slate-900">HERO (Tanıtım)</option>
                                                                <option value="PARTNERS" className="text-slate-900">PARTNERS (Logolar)</option>
                                                                <option value="COMPARISON" className="text-slate-900">BEFORE / AFTER</option>
                                                                <option value="METRICS" className="text-slate-900">STATİSTİKLER</option>
                                                                <option value="FEATURES" className="text-slate-900">ÖZELLİKLER</option>
                                                                <option value="GRID" className="text-slate-900">BİLGİ KUTULARI</option>
                                                                <option value="EXPLORE" className="text-slate-900">ANALİZ (EXPLORE)</option>
                                                                <option value="ROLES" className="text-slate-900">ROLLER (ACCORDION)</option>
                                                                <option value="PRICING" className="text-slate-900">FİYATLAMA</option>
                                                                <option value="FAQ" className="text-slate-900">S.S.S</option>
                                                                <option value="CTA" className="text-slate-900">CTA (Buton)</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="text"
                                                                    className="font-bold bg-transparent border-none focus:ring-0 text-xl p-0 text-slate-900 placeholder:text-slate-300 w-full"
                                                                    placeholder="Bölüm Başlığı..."
                                                                    value={section.content.title || section.content.mainTitle || section.content.text || ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        updateSectionContent(idx, 'title', val);
                                                                        if (section.type === 'BANNER') updateSectionContent(idx, 'text', val);
                                                                        if (['COMPARISON', 'METRICS', 'EXPLORE', 'FOOTER'].includes(section.type)) updateSectionContent(idx, 'mainTitle', val);
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => setSelectedPage((prev: any) => {
                                                                        const newSections = [...prev.sections];
                                                                        newSections[idx] = { ...newSections[idx], isActive: !newSections[idx].isActive };
                                                                        return { ...prev, sections: newSections };
                                                                    })}
                                                                    className={`px-2 py-1 rounded text-[10px] font-black transition-all ${section.isActive ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                                                                >
                                                                    {section.isActive ? 'AKTİF' : 'PASİF'}
                                                                </button>
                                                            </div>
                                                            <StyleFields section={section} idx={idx} type="title" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 ml-4 self-start mt-1">
                                                        <button
                                                            onClick={() => {
                                                                const newSections = [...selectedPage.sections];
                                                                if (idx > 0) {
                                                                    [newSections[idx - 1], newSections[idx]] = [newSections[idx], newSections[idx - 1]];
                                                                    newSections.forEach((s, i) => s.order = i + 1);
                                                                    setSelectedPage({ ...selectedPage, sections: newSections });
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                            title="Yukarı Taşı"
                                                        >⬆️</button>
                                                        <button
                                                            onClick={() => {
                                                                const newSections = [...selectedPage.sections];
                                                                if (idx < newSections.length - 1) {
                                                                    [newSections[idx + 1], newSections[idx]] = [newSections[idx], newSections[idx + 1]];
                                                                    newSections.forEach((s, i) => s.order = i + 1);
                                                                    setSelectedPage({ ...selectedPage, sections: newSections });
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                            title="Aşağı Taşı"
                                                        >⬇️</button>
                                                        <button
                                                            onClick={() => removeSection(idx)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Bölümü Sil"
                                                        >🗑️</button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        {section.type === 'BANNER' && (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">YAZI (HTML DESTEKLİ)</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-3 text-slate-900 focus:ring-2 focus:ring-blue-500"
                                                                        value={section.content.text || ''}
                                                                        onChange={(e) => updateSectionContent(idx, 'text', e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">LİNK METNİ</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-3 text-slate-900"
                                                                            value={section.content.linkText || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'linkText', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">LİNK URL</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-3 text-slate-900"
                                                                            value={section.content.linkUrl || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'linkUrl', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {section.type === 'HERO' && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">ROZET METNİ (BADGE)</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-white p-3 text-slate-900"
                                                                            placeholder="ör: ⭐ 4.4 | G2"
                                                                            value={section.content.badgeText || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'badgeText', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">YORUM METNİ</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-white p-3 text-slate-900"
                                                                            placeholder="1,000+ reviews"
                                                                            value={section.content.reviewsText || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'reviewsText', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <label className="text-[10px] font-black text-blue-600 uppercase block underline">ANA GÖRSEL (HERO IMAGE)</label>
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            className="flex-1 text-sm border-blue-200 rounded-lg bg-blue-50/30 p-3 text-slate-900 focus:bg-white"
                                                                            placeholder="Görsel URL veya yükleyin..."
                                                                            value={section.content.visualUrl || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'visualUrl', e.target.value)}
                                                                        />
                                                                        <label className="bg-blue-600 text-white px-4 py-3 rounded-lg cursor-pointer text-xs font-black shadow-sm shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center min-w-[100px]">
                                                                            {uploading ? '⌛...' : '📁 YÜKLE'}
                                                                            <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => updateSectionContent(idx, 'visualUrl', url))} />
                                                                        </label>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">BİRİNCİ BUTON</label>
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="Metin"
                                                                                value={section.content.primaryBtnText || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'primaryBtnText', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="URL"
                                                                                value={section.content.primaryBtnUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'primaryBtnUrl', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">İKİNCİ BUTON</label>
                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="Metin"
                                                                                value={section.content.secondaryBtnText || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'secondaryBtnText', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="URL"
                                                                                value={section.content.secondaryBtnUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'secondaryBtnUrl', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {section.type === 'CTA' && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">BİRİNCİ BUTON</label>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="Metin"
                                                                                value={section.content.primaryBtnText || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'primaryBtnText', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="URL"
                                                                                value={section.content.primaryBtnUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'primaryBtnUrl', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">İKİNCİ BUTON</label>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="Metin"
                                                                                value={section.content.secondaryBtnText || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'secondaryBtnText', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="URL"
                                                                                value={section.content.secondaryBtnUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'secondaryBtnUrl', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {section.type === 'NAV' && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">MENÜ ÖĞELERİ (Başlık|Link formatında, her satıra bir tane)</label>
                                                                        <textarea
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-3 text-slate-900 min-h-[100px]"
                                                                            placeholder="Ürünler|/products&#10;Hakkımızda|/about"
                                                                            value={(section.content.menuItems || []).map((m: any) => `${m.title}|${m.url}`).join('\n')}
                                                                            onChange={(e) => {
                                                                                const lines = e.target.value.split('\n').filter(l => l.includes('|'));
                                                                                const newMenuItems = lines.map(l => {
                                                                                    const [title, url] = l.split('|');
                                                                                    return { title: title.trim(), url: url.trim() };
                                                                                });
                                                                                updateSectionContent(idx, 'menuItems', newMenuItems);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">GİRİŞ LİNKİ METNİ</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-3 text-slate-900"
                                                                            value={section.content.loginText || 'Login'}
                                                                            onChange={(e) => updateSectionContent(idx, 'loginText', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">GİRİŞ LİNKİ URL</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-3 text-slate-900"
                                                                            value={section.content.loginUrl || '/login'}
                                                                            onChange={(e) => updateSectionContent(idx, 'loginUrl', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">BİRİNCİ BUTON (Primary)</label>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="Metin"
                                                                                value={section.content.primaryBtnText || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'primaryBtnText', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="URL"
                                                                                value={section.content.primaryBtnUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'primaryBtnUrl', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">İKİNCİ BUTON (Outline)</label>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="Metin"
                                                                                value={section.content.secondaryBtnText || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'secondaryBtnText', e.target.value)}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                className="text-xs border-slate-200 rounded p-2"
                                                                                placeholder="URL"
                                                                                value={section.content.secondaryBtnUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'secondaryBtnUrl', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(section.type === 'METRICS' || section.type === 'COMPARISON' || section.type === 'EXPLORE' || section.type === 'FOOTER') && (
                                                            <div className={`space-y-4 p-4 ${section.type === 'METRICS' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'} rounded-xl border`}>
                                                                <p className={`text-[10px] font-black ${section.type === 'METRICS' ? 'text-purple-400' : 'text-blue-400'} uppercase tracking-widest mb-2`}>{section.type} BAŞLIKLARI</p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-900">
                                                                    <div>
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">BİRİNCİ KISIM (ÜST)</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg p-2"
                                                                            placeholder="örn: 20,000+ scaling teams"
                                                                            value={section.content.topTitle || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'topTitle', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">İKİNCİ KISIM (ANA / RENKLİ)</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg p-2"
                                                                            placeholder="örn: without the baggage"
                                                                            value={section.content.mainTitle || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'mainTitle', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {section.type === 'COMPARISON' && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100">
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-red-500 uppercase block mb-1 underline text-center">ÖNCESİ (BEFORE) BAŞLIK</label>
                                                                            <input type="text" className="w-full text-sm border-slate-200 rounded-lg p-2" value={section.content.beforeTitle || ''} placeholder="BEFORE DATABOX" onChange={(e) => updateSectionContent(idx, 'beforeTitle', e.target.value)} />
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase block mt-2 mb-1">MADDELER (Her satıra bir tane)</label>
                                                                            <textarea className="w-full text-[11px] border-slate-200 rounded-lg p-2 min-h-[100px]" value={(section.content.beforeList || []).join('\n')} onChange={(e) => updateSectionContent(idx, 'beforeList', e.target.value.split('\n').filter(s => s.trim()))} />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-green-500 uppercase block mb-1 underline text-center">SONRASI (AFTER) BAŞLIK</label>
                                                                            <input type="text" className="w-full text-sm border-slate-200 rounded-lg p-2" value={section.content.afterTitle || ''} placeholder="AFTER DATABOX" onChange={(e) => updateSectionContent(idx, 'afterTitle', e.target.value)} />
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase block mt-2 mb-1">MADDELER (Her satıra bir tane)</label>
                                                                            <textarea className="w-full text-[11px] border-slate-200 rounded-lg p-2 min-h-[100px]" value={(section.content.afterList || []).join('\n')} onChange={(e) => updateSectionContent(idx, 'afterList', e.target.value.split('\n').filter(s => s.trim()))} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {!(section.type === 'PARTNERS' || section.type === 'BANNER' || section.type === 'NAV') && (
                                                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">ALT BAŞLIK / AÇIKLAMA</label>
                                                                <textarea
                                                                    className="w-full text-sm border-slate-200 rounded-lg min-h-[120px] bg-white text-slate-900"
                                                                    value={section.content.subtitle || section.content.desc || ''}
                                                                    onChange={(e) => updateSectionContent(idx, (section.type === 'ROLES' || section.type === 'EXPLORE') ? 'desc' : 'subtitle', e.target.value)}
                                                                />
                                                                <StyleFields section={section} idx={idx} type="subtitle" />
                                                            </div>
                                                        )}
                                                        {(section.type === 'METRICS' || section.type === 'FEATURES' || section.type === 'EXPLORE' || section.type === 'GRID' || section.type === 'PARTNERS' || section.type === 'PRICING' || section.type === 'FAQ' || section.type === 'FOOTER') && (
                                                            <div className="space-y-4">
                                                                <label className="text-[10px] font-black text-slate-500 uppercase block">{section.type === 'PARTNERS' ? 'LOGOLAR / REFERANSLAR' : 'ÖĞELER / MADDELER'}</label>
                                                                <div className="space-y-3 max-h-[400px] overflow-y-auto bg-slate-100 p-4 rounded-xl border border-slate-200 text-slate-900">
                                                                    {(section.content.items || []).map((item: any, iidx: number) => (
                                                                        <div key={iidx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3 relative group/item">
                                                                            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                                                                <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded"># {iidx + 1}</span>
                                                                                <button className="text-red-500 hover:text-red-700 font-bold text-[10px] bg-red-50 px-2 py-1 rounded transition" onClick={() => {
                                                                                    const newItems = section.content.items.filter((_: any, i: number) => i !== iidx);
                                                                                    updateSectionContent(idx, 'items', newItems);
                                                                                }}>KALDIR</button>
                                                                            </div>

                                                                            {section.type === 'PARTNERS' ? (
                                                                                <div className="space-y-3">
                                                                                    <div>
                                                                                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">PARTNER ADI</label>
                                                                                        <input
                                                                                            className="text-sm font-medium w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                            value={typeof item === 'string' ? item : item.name || ''}
                                                                                            placeholder="Partner Adı"
                                                                                            onChange={(e) => {
                                                                                                const newItems = [...section.content.items];
                                                                                                if (typeof item === 'string') {
                                                                                                    newItems[iidx] = { name: e.target.value, url: '' };
                                                                                                } else {
                                                                                                    newItems[iidx] = { ...item, name: e.target.value };
                                                                                                }
                                                                                                updateSectionContent(idx, 'items', newItems);
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">LOGO / GÖRSEL</label>
                                                                                        <div className="flex flex-col gap-2">
                                                                                            <div className="flex gap-2">
                                                                                                <input
                                                                                                    className="text-sm flex-1 border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                                    value={typeof item === 'string' ? '' : item.url || ''}
                                                                                                    placeholder="Logo URL (https://...)"
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...section.content.items];
                                                                                                        if (typeof item === 'string') {
                                                                                                            newItems[iidx] = { name: item, url: e.target.value };
                                                                                                        } else {
                                                                                                            newItems[iidx] = { ...item, url: e.target.value };
                                                                                                        }
                                                                                                        updateSectionContent(idx, 'items', newItems);
                                                                                                    }}
                                                                                                />
                                                                                                <label className="bg-slate-900 text-white px-3 py-2 rounded-lg cursor-pointer transition flex items-center gap-1 font-bold text-[10px] hover:bg-slate-800 shadow-sm shadow-slate-200">
                                                                                                    {uploading ? '⌛' : '📁 YÜKLE'}
                                                                                                    <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => {
                                                                                                        const newItems = [...section.content.items];
                                                                                                        const currentName = typeof item === 'string' ? item : (item.name || 'Logo');
                                                                                                        newItems[iidx] = { ...item, name: currentName, url: url };
                                                                                                        updateSectionContent(idx, 'items', newItems);
                                                                                                    })} />
                                                                                                </label>
                                                                                            </div>
                                                                                            {(typeof item !== 'string' && item.url) && (
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <img src={item.url} alt="Preview" className="h-10 object-contain w-min border rounded bg-white p-1" />
                                                                                                    <span className="text-[10px] text-slate-400">Görsel Önizleme</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-3">
                                                                                    <div className="grid grid-cols-2 gap-3">
                                                                                        <div>
                                                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">BAŞLIK / SORU</label>
                                                                                            <input
                                                                                                className="text-sm font-bold w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                                placeholder={section.type === 'FAQ' ? 'Soru' : section.type === 'PRICING' ? 'Paket Adı' : section.type === 'METRICS' ? 'Stat (örn: ↑ 55%)' : section.type === 'FOOTER' ? 'Kolon Başlığı' : 'Başlık'}
                                                                                                value={section.type === 'FAQ' ? (item.question || '') : (section.type === 'METRICS' ? (item.stat || '') : (item.title || ''))}
                                                                                                onChange={(e) => {
                                                                                                    const newItems = [...section.content.items];
                                                                                                    const key = section.type === 'FAQ' ? 'question' : (section.type === 'METRICS' ? 'stat' : 'title');
                                                                                                    newItems[iidx] = { ...item, [key]: e.target.value };
                                                                                                    updateSectionContent(idx, 'items', newItems);
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                        {section.type === 'METRICS' && (
                                                                                            <div>
                                                                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">ETİKET (LABEL)</label>
                                                                                                <input
                                                                                                    className="text-sm font-bold w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                                    placeholder="Etiket"
                                                                                                    value={item.label || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...section.content.items];
                                                                                                        newItems[iidx] = { ...item, label: e.target.value };
                                                                                                        updateSectionContent(idx, 'items', newItems);
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                        {section.type === 'PRICING' && (
                                                                                            <div>
                                                                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">FİYAT</label>
                                                                                                <input
                                                                                                    className="text-sm font-black w-full border-slate-200 rounded-lg bg-blue-50 p-2 text-blue-700"
                                                                                                    placeholder="99"
                                                                                                    value={item.price || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...section.content.items];
                                                                                                        newItems[iidx] = { ...item, price: e.target.value };
                                                                                                        updateSectionContent(idx, 'items', newItems);
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {(section.type === 'PRICING' || section.type === 'METRICS') && (
                                                                                        <div className="grid grid-cols-2 gap-3">
                                                                                            <div>
                                                                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">LİNK METNİ</label>
                                                                                                <input
                                                                                                    className="text-sm w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                                    placeholder="Buy Now"
                                                                                                    value={item.linkText || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...section.content.items];
                                                                                                        newItems[iidx] = { ...item, linkText: e.target.value };
                                                                                                        updateSectionContent(idx, 'items', newItems);
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">LİNK URL</label>
                                                                                                <input
                                                                                                    className="text-sm w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                                    placeholder="#"
                                                                                                    value={item.linkUrl || ''}
                                                                                                    onChange={(e) => {
                                                                                                        const newItems = [...section.content.items];
                                                                                                        newItems[iidx] = { ...item, linkUrl: e.target.value };
                                                                                                        updateSectionContent(idx, 'items', newItems);
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    <div>
                                                                                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">AÇIKLAMA / CEVAP</label>
                                                                                        <textarea
                                                                                            className="text-sm w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                            placeholder={section.type === 'FAQ' ? 'Cevap' : 'Açıklama'}
                                                                                            value={section.type === 'FAQ' ? (item.answer || '') : (item.desc || '')}
                                                                                            onChange={(e) => {
                                                                                                const newItems = [...section.content.items];
                                                                                                const key = section.type === 'FAQ' ? 'answer' : 'desc';
                                                                                                newItems[iidx] = { ...item, [key]: e.target.value };
                                                                                                updateSectionContent(idx, 'items', newItems);
                                                                                            }}
                                                                                        />
                                                                                    </div>

                                                                                    {(section.type === 'GRID' || section.type === 'EXPLORE' || section.type === 'FEATURES' || section.type === 'METRICS') && (
                                                                                        <div>
                                                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">{section.type === 'METRICS' ? 'LOGO URL' : 'İKON / GÖRSEL URL'}</label>
                                                                                            <div className="flex flex-col gap-2">
                                                                                                <div className="flex gap-2">
                                                                                                    <input
                                                                                                        className="text-sm flex-1 border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white"
                                                                                                        placeholder={section.type === 'METRICS' ? 'Logo URL (PNG/SVG)' : 'URL veya Emoji'}
                                                                                                        value={item.icon || item.logo || ''}
                                                                                                        onChange={(e) => {
                                                                                                            const newItems = [...section.content.items];
                                                                                                            const key = section.type === 'METRICS' ? 'logo' : 'icon';
                                                                                                            newItems[iidx] = { ...item, [key]: e.target.value };
                                                                                                            updateSectionContent(idx, 'items', newItems);
                                                                                                        }}
                                                                                                    />
                                                                                                    <label className="bg-slate-900 text-white px-3 py-2 rounded-lg cursor-pointer transition flex items-center gap-1 font-bold text-[10px] hover:bg-slate-800 shadow-sm shadow-slate-200">
                                                                                                        {uploading ? '⌛' : '📁 YÜKLE'}
                                                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => {
                                                                                                            const newItems = [...section.content.items];
                                                                                                            const key = section.type === 'METRICS' ? 'logo' : 'icon';
                                                                                                            newItems[iidx] = { ...item, [key]: url };
                                                                                                            updateSectionContent(idx, 'items', newItems);
                                                                                                        })} />
                                                                                                    </label>
                                                                                                </div>
                                                                                                {(item.icon || item.logo) && (item.icon?.length > 3 || item.logo?.length > 3) && (
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {(item.icon?.startsWith('http') || item.logo?.startsWith('http') || item.icon?.startsWith('/') || item.logo?.startsWith('/') || item.icon?.startsWith('data:') || item.logo?.startsWith('data:')) ? (
                                                                                                            <img src={item.icon || item.logo} alt="Preview" className="h-10 object-contain w-min border rounded bg-white p-1" />
                                                                                                        ) : (
                                                                                                            <span className="text-xl">{item.icon}</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                    {(section.type === 'EXPLORE' || section.type === 'PRICING' || section.type === 'ROLES' || section.type === 'FOOTER') && (
                                                                                        <div>
                                                                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block underline">{section.type === 'FOOTER' ? 'LİNKLER (Metin|URL)' : 'LİSTE ÖĞELERİ (Her Satırda Bir Özellik)'}</label>
                                                                                            <textarea
                                                                                                className="text-[11px] w-full border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900 focus:bg-white italic min-h-[100px]"
                                                                                                placeholder={section.type === 'FOOTER' ? 'Metin|#' : "Madde 1&#10;Madde 2..."}
                                                                                                value={(item.list || item.items || []).join('\n')}
                                                                                                onChange={(e) => {
                                                                                                    const newItems = [...section.content.items];
                                                                                                    const itemsArr = e.target.value.split('\n').filter(s => s.trim());
                                                                                                    newItems[iidx] = { ...item, list: itemsArr, items: itemsArr };
                                                                                                    updateSectionContent(idx, 'items', newItems);
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <button className="w-full py-4 bg-white border-2 border-dashed border-slate-300 text-slate-500 font-black text-[11px] rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition uppercase tracking-widest" onClick={() => {
                                                                        let newItem = { title: 'Yeni Öğe', desc: '' };
                                                                        if (section.type === 'PARTNERS') newItem = { name: 'Yeni Partner', url: '' } as any;
                                                                        if (section.type === 'FAQ') newItem = { question: 'Soru?', answer: 'Cevap' } as any;
                                                                        if (section.type === 'PRICING') newItem = { title: 'Paket', price: '99', desc: 'Açıklama', list: [] } as any;
                                                                        if (section.type === 'EXPLORE') newItem = { title: 'Analiz', desc: 'Açıklama', icon: '✨', list: [] } as any;
                                                                        if (section.type === 'METRICS') newItem = { stat: '100+', label: 'Description', logo: '' } as any;
                                                                        if (section.type === 'FOOTER') newItem = { title: 'Kolon', list: ['Link 1|#', 'Link 2|#'] } as any;

                                                                        const newItems = [...(section.content.items || []), newItem];
                                                                        updateSectionContent(idx, 'items', newItems);
                                                                    }}>+ YENİ ÖĞE EKLE</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {
                                                        section.type === 'FOOTER' && (
                                                            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4 mb-6">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">ALT BİLGİ (FOOTER) AYARLARI</label>
                                                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded italic">FOOTER ÖZEL</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">FOOTER LOGOSU (OPSİYONEL)</label>
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="flex-1 text-sm border-slate-200 rounded-lg bg-white p-3 text-slate-900 focus:bg-white"
                                                                                placeholder="Boş bırakılırsa ana logo kullanılır"
                                                                                value={section.content.footerLogoUrl || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'footerLogoUrl', e.target.value)}
                                                                            />
                                                                            <label className="bg-slate-900 text-white p-3 rounded-lg cursor-pointer text-xs font-bold hover:bg-slate-800 transition shadow-sm shadow-slate-200">
                                                                                {uploading ? '⌛' : '📁 YÜKLE'}
                                                                                <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => updateSectionContent(idx, 'footerLogoUrl', url))} />
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">FOOTER ARKA PLAN RENGİ</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-white p-3 text-slate-900 focus:bg-white"
                                                                            placeholder="#0d0e12"
                                                                            value={section.content.bg || ''}
                                                                            onChange={(e) => updateSectionContent(idx, 'bg', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">LOGO YÜKSEKLİĞİ (PX)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-white p-3 text-slate-900 focus:bg-white"
                                                                            placeholder="32"
                                                                            value={section.content.footerLogoHeight || 32}
                                                                            onChange={(e) => updateSectionContent(idx, 'footerLogoHeight', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pt-6">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`footer-hide-title-${idx}`}
                                                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                                            checked={section.content.footerHideTitle}
                                                                            onChange={(e) => updateSectionContent(idx, 'footerHideTitle', e.target.checked)}
                                                                        />
                                                                        <label htmlFor={`footer-hide-title-${idx}`} className="text-[11px] font-black text-slate-700 cursor-pointer uppercase tracking-tighter">Site Başlığını Gizle</label>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                                    <p className="text-[10px] text-blue-700 italic font-medium leading-relaxed">
                                                                        * Footer renk ve logosunu buradan değiştirebilirsiniz. Linkleri ise aşağıdaki liste öğelerinden yönetebilirsiniz.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    {
                                                        section.type === 'NAV' && (
                                                            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4 mb-6">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">SİTE LOGOSU (ANA LOGO)</label>
                                                                    <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded italic">GLOBAL AYAR</span>
                                                                </div>
                                                                <div className="flex gap-4 items-center">
                                                                    <div className="flex-1 flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            className="flex-1 text-sm border-slate-200 rounded-lg bg-white p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                                                                            placeholder="https://..."
                                                                            value={settings.logoUrl || ''}
                                                                            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                                                        />
                                                                        <label className="bg-slate-900 text-white px-4 py-3 rounded-lg cursor-pointer text-xs font-bold hover:bg-slate-800 transition shadow-sm shadow-slate-300 flex items-center gap-2">
                                                                            {uploading ? '⌛' : '📁 LOGO YÜKLE'}
                                                                            <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setSettings({ ...settings, logoUrl: url }))} />
                                                                        </label>
                                                                    </div>
                                                                    {settings.logoUrl && (
                                                                        <div className="h-16 w-16 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
                                                                            <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-black text-slate-500 uppercase block">LOGO YÜKSEKLİĞİ (PX)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="w-full text-sm border-slate-200 rounded-lg bg-slate-50 p-2 text-slate-900"
                                                                            placeholder="40"
                                                                            value={section.content.logoHeight || 40}
                                                                            onChange={(e) => updateSectionContent(idx, 'logoHeight', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pt-4">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`hide-title-${idx}`}
                                                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                                            checked={section.content.hideTitle}
                                                                            onChange={(e) => updateSectionContent(idx, 'hideTitle', e.target.checked)}
                                                                        />
                                                                        <label htmlFor={`hide-title-${idx}`} className="text-[11px] font-black text-slate-700 cursor-pointer uppercase tracking-tighter">Site Başlığını Gizle</label>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                                    <p className="text-[10px] text-blue-700 italic font-medium leading-relaxed">
                                                                        * Bu bölümden yüklediğiniz logo tüm sayfalardaki üst menü (Navigation) alanında görüntülenecektir. Menü içeriğini "Menü Yönetimi" tabından düzenleyebilirsiniz.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                    {
                                                        section.type === 'HERO' && (
                                                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm space-y-6">
                                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-fit">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`floating-${idx}`}
                                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                                        checked={section.content.showFloatingCard}
                                                                        onChange={(e) => updateSectionContent(idx, 'showFloatingCard', e.target.checked)}
                                                                    />
                                                                    <label htmlFor={`floating-${idx}`} className="text-[11px] font-black text-slate-700 cursor-pointer uppercase tracking-tighter">İkincil Kart (Floating Card) Göster</label>
                                                                </div>

                                                                {section.content.showFloatingCard && (
                                                                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200 ring-4 ring-slate-50">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-black text-slate-500 uppercase block">KART BAŞLIĞI</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-sm border-slate-200 rounded-lg bg-white p-2 text-slate-900 focus:bg-white"
                                                                                value={section.content.floatingCardTitle || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'floatingCardTitle', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-black text-slate-500 uppercase block">KART GÖRSELİ</label>
                                                                            <div className="flex gap-2">
                                                                                <input
                                                                                    type="text"
                                                                                    className="flex-1 text-sm border-slate-200 rounded-lg bg-white p-2 text-slate-900 focus:bg-white"
                                                                                    value={section.content.floatingCardVisualUrl || ''}
                                                                                    onChange={(e) => updateSectionContent(idx, 'floatingCardVisualUrl', e.target.value)}
                                                                                />
                                                                                <label className="bg-slate-900 text-white px-4 py-2 rounded-lg cursor-pointer text-xs font-black hover:bg-slate-800 transition flex items-center justify-center min-w-[100px]">
                                                                                    {uploading ? '⌛...' : '📁 YÜKLE'}
                                                                                    <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => updateSectionContent(idx, 'floatingCardVisualUrl', url))} />
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-2">
                                                                    <label className="text-[10px] font-black text-slate-500 uppercase block">CANLI ÖNİZLEME</label>
                                                                    <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center relative shadow-inner group">
                                                                        {section.content.visualUrl ? (
                                                                            <>
                                                                                <img
                                                                                    src={section.content.visualUrl}
                                                                                    className="w-full h-full object-contain transition duration-500 group-hover:scale-110"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Görsel+Yüklenemedi';
                                                                                    }}
                                                                                />
                                                                                <button
                                                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm"
                                                                                    onClick={() => updateSectionContent(idx, 'visualUrl', '')}
                                                                                    title="Görseli Kaldır"
                                                                                >❌</button>
                                                                            </>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center gap-2">
                                                                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">🖼️</div>
                                                                                <span className="text-slate-400 text-[10px] font-black italic">ANA GÖRSEL SEÇİLMEDİ</span>
                                                                            </div>
                                                                        )}
                                                                        {section.content.showFloatingCard && section.content.floatingCardVisualUrl && (
                                                                            <div className="absolute bottom-4 right-4 w-1/4 aspect-square bg-white border-2 border-white rounded-xl shadow-2xl p-0.5 overflow-hidden animate-in fade-in zoom-in duration-300">
                                                                                <img
                                                                                    src={section.content.floatingCardVisualUrl}
                                                                                    className="w-full h-full object-contain rounded-lg"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=!';
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[9px] text-slate-400 italic text-center">Önizleme mobil ve masaüstü arasında farklılık gösterebilir.</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                    {
                                                        section.type === 'ROLES' ? (
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">ROLLER (ACCORDION ITEMS)</label>
                                                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[400px] overflow-y-auto">
                                                                    {(section.content.items || []).map((role: any, rIdx: number) => (
                                                                        <div key={rIdx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                                                                            <div className="flex gap-2 items-end">
                                                                                <div className="flex-1 space-y-1">
                                                                                    <label className="text-[9px] font-black text-slate-400 uppercase">İKON / GÖRSEL</label>
                                                                                    <div className="flex gap-1">
                                                                                        <input
                                                                                            type="text" placeholder="İkon" className="flex-1 border-slate-100 rounded text-slate-900 text-[10px]"
                                                                                            value={role.icon}
                                                                                            onChange={(e) => {
                                                                                                const newItems = [...section.content.items];
                                                                                                newItems[rIdx].icon = e.target.value;
                                                                                                updateSectionContent(idx, 'items', newItems);
                                                                                            }}
                                                                                        />
                                                                                        <label className="bg-slate-900 text-white px-2 py-1.5 rounded cursor-pointer transition flex items-center gap-1 font-bold text-[9px] hover:bg-slate-800">
                                                                                            {uploading ? '⌛' : '📁'}
                                                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => {
                                                                                                const newItems = [...section.content.items];
                                                                                                newItems[rIdx].icon = url;
                                                                                                updateSectionContent(idx, 'items', newItems);
                                                                                            })} />
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1 space-y-1">
                                                                                    <label className="text-[9px] font-black text-slate-400 uppercase">ROL BAŞLIĞI</label>
                                                                                    <input
                                                                                        type="text" placeholder="Rol Başlığı" className="w-full border-slate-100 rounded font-bold text-slate-900 text-[10px]"
                                                                                        value={role.title}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...section.content.items];
                                                                                            newItems[rIdx].title = e.target.value;
                                                                                            updateSectionContent(idx, 'items', newItems);
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded border border-slate-100">
                                                                                    {role.icon && (role.icon.startsWith('http') || role.icon.startsWith('/') || role.icon.startsWith('data:')) ? (
                                                                                        <img src={role.icon} alt="Icon" className="w-6 h-6 object-contain" />
                                                                                    ) : (
                                                                                        <span className="text-lg">{role.icon || '👤'}</span>
                                                                                    )}
                                                                                </div>
                                                                                <button className="text-red-300 hover:text-red-500 pb-1" onClick={() => {
                                                                                    const newItems = section.content.items.filter((_: any, i: number) => i !== rIdx);
                                                                                    updateSectionContent(idx, 'items', newItems);
                                                                                }}>×</button>
                                                                            </div>
                                                                            <textarea
                                                                                placeholder="Kısa açıklama" className="w-full border-slate-100 rounded text-slate-900"
                                                                                value={role.desc}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...section.content.items];
                                                                                    newItems[rIdx].desc = e.target.value;
                                                                                    updateSectionContent(idx, 'items', newItems);
                                                                                }}
                                                                            />
                                                                            <input
                                                                                placeholder="Özellikler (virgülle ayırın)" className="w-full border-slate-100 rounded text-[10px] text-slate-900"
                                                                                value={(role.list || role.items || []).join(', ')}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...section.content.items];
                                                                                    newItems[rIdx].list = e.target.value.split(',').map(s => s.trim());
                                                                                    updateSectionContent(idx, 'items', newItems);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-100 transition"
                                                                        onClick={() => {
                                                                            const newItems = [...(section.content.items || []), { title: 'Yeni Rol', desc: '', icon: '👤', list: [] }];
                                                                            updateSectionContent(idx, 'items', newItems);
                                                                        }}
                                                                    >
                                                                        + YENİ ROL EKLE
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {section.type === 'COMPARISON' && (
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">BEFORE BAŞLIĞI</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-sm border-slate-200 rounded-lg bg-slate-50/50 mb-2 text-slate-900"
                                                                                value={section.content.beforeTitle || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'beforeTitle', e.target.value)}
                                                                            />
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">BEFORE LİSTESİ</label>
                                                                            <textarea
                                                                                className="w-full text-[10px] border-slate-200 rounded bg-slate-50 min-h-[150px] text-slate-900"
                                                                                placeholder="Her satıra bir madde..."
                                                                                value={(section.content.beforeList || []).join('\n')}
                                                                                onChange={(e) => updateSectionContent(idx, 'beforeList', e.target.value.split('\n'))}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">AFTER BAŞLIĞI</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-sm border-slate-200 rounded-lg bg-slate-50/50 mb-2 text-slate-900"
                                                                                value={section.content.afterTitle || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'afterTitle', e.target.value)}
                                                                            />
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">AFTER LİSTESİ</label>
                                                                            <textarea
                                                                                className="w-full text-[10px] border-slate-200 rounded bg-slate-50 min-h-[150px] text-slate-900"
                                                                                placeholder="Her satıra bir madde..."
                                                                                value={(section.content.afterList || []).join('\n')}
                                                                                onChange={(e) => updateSectionContent(idx, 'afterList', e.target.value.split('\n'))}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {!(section.type === 'HERO' || section.type === 'CTA' || section.type === 'COMPARISON' || section.type === 'BANNER' || section.type === 'PARTNERS' || section.type === 'NAV') && (
                                                                    <>
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">ARKAPLAN RENGİ</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full text-sm border-slate-200 rounded-lg bg-slate-50/50 text-slate-900"
                                                                                placeholder="#ffffff"
                                                                                value={section.content.bg || ''}
                                                                                onChange={(e) => updateSectionContent(idx, 'bg', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        {(section.type === 'FEATURES' || section.type === 'GRID') && (
                                                                            <div>
                                                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">KOLON SAYISI</label>
                                                                                <select
                                                                                    className="w-full text-sm border-slate-200 rounded-lg bg-slate-50/50 text-slate-900"
                                                                                    value={section.content.cols || 3}
                                                                                    onChange={(e) => updateSectionContent(idx, 'cols', parseInt(e.target.value))}
                                                                                >
                                                                                    <option value={2}>2 Kolon</option>
                                                                                    <option value={3}>3 Kolon</option>
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                        {(section.type === 'FEATURES' || section.type === 'GRID' || section.type === 'EXPLORE' || section.type === 'METRICS' || section.type === 'ROLES') && (
                                                                            <div>
                                                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">İKON / GÖRSEL BOYUTU (PX)</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full text-sm border-slate-200 rounded-lg bg-slate-50/50 text-slate-900"
                                                                                    placeholder="40"
                                                                                    value={section.content.iconSize || ''}
                                                                                    onChange={(e) => updateSectionContent(idx, 'iconSize', e.target.value)}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </>
                                                        )
                                                    }
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={addSection}
                                            className="w-full py-8 border-4 border-dashed border-slate-100 rounded-2xl text-slate-300 font-black hover:border-blue-100 hover:text-blue-400 transition-all flex flex-col items-center gap-2 group"
                                        >
                                            <span className="text-4xl group-hover:scale-110 transition">➕</span>
                                            <span className="uppercase tracking-widest text-[10px]">YENİ BÖLÜM (SECTION) EKLE</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {
                    activeTab === 'menus' && (
                        <div className="p-8 max-w-6xl mx-auto space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Menü Yönetimi</h2>
                                    <p className="text-sm text-slate-500">Mega menü ve dropdown yapılarını buradan yönetebilirsiniz.</p>
                                </div>
                                <button
                                    onClick={saveMenus}
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm shadow-blue-200"
                                >
                                    {saving ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                                </button>
                            </div>

                            <div className="space-y-12">
                                {data.menus?.map((menu: any, mIdx: number) => (
                                    <div key={menu.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                                                <span className="bg-slate-100 p-2 rounded-lg">🍔</span>
                                                {menu.name}
                                            </h3>
                                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider">{menu.items?.length || 0} ÖĞE</span>
                                        </div>

                                        <div className="space-y-4">
                                            {(menu.items || []).map((item: any, i: number) => (
                                                <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-blue-300 group">
                                                    {/* Item Header / Summary */}
                                                    <div className="p-4 flex gap-4 items-start">
                                                        <div className="flex flex-col items-center justify-center gap-1 pt-2">
                                                            <button
                                                                onClick={() => {
                                                                    const newMenus = [...data.menus];
                                                                    if (i > 0) {
                                                                        [newMenus[mIdx].items[i], newMenus[mIdx].items[i - 1]] = [newMenus[mIdx].items[i - 1], newMenus[mIdx].items[i]];
                                                                        setData({ ...data, menus: newMenus });
                                                                    }
                                                                }}
                                                                className="text-slate-300 hover:text-blue-500"
                                                            >⬆️</button>
                                                            <button
                                                                onClick={() => {
                                                                    const newMenus = [...data.menus];
                                                                    if (i < newMenus[mIdx].items.length - 1) {
                                                                        [newMenus[mIdx].items[i], newMenus[mIdx].items[i + 1]] = [newMenus[mIdx].items[i + 1], newMenus[mIdx].items[i]];
                                                                        setData({ ...data, menus: newMenus });
                                                                    }
                                                                }}
                                                                className="text-slate-300 hover:text-blue-500"
                                                            >⬇️</button>
                                                        </div>

                                                        <div className="flex-1 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                                <div className="md:col-span-3">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">GÖRÜNEN İSİM</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full text-sm border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                                                                        value={item.label}
                                                                        onChange={(e) => {
                                                                            const newMenus = [...data.menus];
                                                                            newMenus[mIdx].items[i].label = e.target.value;
                                                                            setData({ ...data, menus: newMenus });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-3">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">HEDEF URL</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full text-sm border-slate-200 rounded-lg text-slate-600 font-mono focus:ring-2 focus:ring-blue-500"
                                                                        value={item.link}
                                                                        onChange={(e) => {
                                                                            const newMenus = [...data.menus];
                                                                            newMenus[mIdx].items[i].link = e.target.value;
                                                                            setData({ ...data, menus: newMenus });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">TİP</label>
                                                                    <select
                                                                        className="w-full text-sm border-slate-200 rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                                                                        value={item.type || 'link'}
                                                                        onChange={(e) => {
                                                                            const newMenus = [...data.menus];
                                                                            newMenus[mIdx].items[i].type = e.target.value;
                                                                            if (e.target.value === 'mega' && !newMenus[mIdx].items[i].sidebar) {
                                                                                const defaultId = `cat_${Date.now()}`;
                                                                                newMenus[mIdx].items[i].sidebar = [{ id: defaultId, label: 'Kategori 1' }];
                                                                                newMenus[mIdx].items[i].content = [];
                                                                            }
                                                                            setData({ ...data, menus: newMenus });
                                                                        }}
                                                                    >
                                                                        <option value="link">Normal Link</option>
                                                                        <option value="mega">Mega Menü</option>
                                                                        {/* <option value="dropdown">Basit Liste</option> */}
                                                                    </select>
                                                                </div>
                                                                <div className="md:col-span-4 flex items-end justify-end">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newMenus = [...data.menus];
                                                                            newMenus[mIdx].items = newMenus[mIdx].items.filter((_: any, idx: number) => idx !== i);
                                                                            setData({ ...data, menus: newMenus });
                                                                        }}
                                                                        className="text-red-400 hover:text-red-600 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition"
                                                                    >
                                                                        SİL
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* MEGA MENU EDITOR */}
                                                            {item.type === 'mega' && (
                                                                <div className="mt-4 border-t border-slate-200 pt-4 animate-in fade-in slide-in-from-top-2">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                        {/* Sidebar Categories */}
                                                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <h4 className="text-[10px] font-black text-slate-500 uppercase">KATEGORİLER (SOL MENÜ)</h4>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newMenus = [...data.menus];
                                                                                        if (!newMenus[mIdx].items[i].sidebar) newMenus[mIdx].items[i].sidebar = [];
                                                                                        const newItemId = `cat_${Date.now()}`;
                                                                                        newMenus[mIdx].items[i].sidebar.push({ id: newItemId, label: 'Yeni Kategori' });
                                                                                        setData({ ...data, menus: newMenus });
                                                                                    }}
                                                                                    className="text-blue-600 text-[10px] font-black hover:underline"
                                                                                >+ EKLE</button>
                                                                            </div>
                                                                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                                                                {(item.sidebar || []).map((sb: any, sbIdx: number) => (
                                                                                    <div key={sbIdx} className="flex gap-1 items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                                                                                        <input
                                                                                            type="text"
                                                                                            className="w-1/2 text-xs border-none bg-transparent p-1.5 focus:ring-0 text-slate-900 font-bold border-r border-slate-100"
                                                                                            placeholder="Kategori Adı"
                                                                                            value={sb.label}
                                                                                            onChange={(e) => {
                                                                                                const newMenus = [...data.menus];
                                                                                                newMenus[mIdx].items[i].sidebar[sbIdx].label = e.target.value;
                                                                                                setData({ ...data, menus: newMenus });
                                                                                            }}
                                                                                        />
                                                                                        <input
                                                                                            type="text"
                                                                                            className="flex-1 text-[10px] border-none bg-transparent p-1.5 focus:ring-0 text-blue-600 font-mono"
                                                                                            placeholder="Link (Opsiyonel)"
                                                                                            value={sb.link || ''}
                                                                                            onChange={(e) => {
                                                                                                const newMenus = [...data.menus];
                                                                                                newMenus[mIdx].items[i].sidebar[sbIdx].link = e.target.value;
                                                                                                setData({ ...data, menus: newMenus });
                                                                                            }}
                                                                                        />
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newMenus = [...data.menus];
                                                                                                newMenus[mIdx].items[i].sidebar = newMenus[mIdx].items[i].sidebar.filter((_: any, idx: number) => idx !== sbIdx);
                                                                                                setData({ ...data, menus: newMenus });
                                                                                            }}
                                                                                            className="text-red-300 hover:text-red-500 px-2 text-lg"
                                                                                            title="Sil"
                                                                                        >×</button>
                                                                                    </div>
                                                                                ))}
                                                                                {(!item.sidebar || item.sidebar.length === 0) && (
                                                                                    <p className="text-[10px] text-slate-400 italic text-center py-4">Henüz kategori eklenmedi.</p>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Content Cards */}
                                                                        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <h4 className="text-[10px] font-black text-slate-500 uppercase">İÇERİK KARTLARI (KATEGORİYE BAĞLI)</h4>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newMenus = [...data.menus];
                                                                                        if (!newMenus[mIdx].items[i].content) newMenus[mIdx].items[i].content = [];
                                                                                        const firstCatId = newMenus[mIdx].items[i].sidebar?.[0]?.id || '';
                                                                                        newMenus[mIdx].items[i].content.push({
                                                                                            categoryId: firstCatId,
                                                                                            title: 'Yeni Kart',
                                                                                            desc: 'Açıklama',
                                                                                            icon: '✨',
                                                                                            link: '#'
                                                                                        });
                                                                                        setData({ ...data, menus: newMenus });
                                                                                    }}
                                                                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-[10px] font-black hover:bg-blue-700 shadow-sm"
                                                                                >+ KARTI EKLE</button>
                                                                            </div>
                                                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                                                                {(item.content || []).map((content: any, cIdx: number) => (
                                                                                    <div key={cIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-3 relative group/card">
                                                                                        <div className="flex gap-2 items-center">
                                                                                            <div className="w-1/3">
                                                                                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">BAĞLI KATEGORİ</label>
                                                                                                <select
                                                                                                    className="w-full text-[10px] border-slate-200 rounded-lg p-1.5 font-bold bg-white text-slate-900 border"
                                                                                                    value={content.categoryId}
                                                                                                    onChange={(e) => {
                                                                                                        const newMenus = [...data.menus];
                                                                                                        newMenus[mIdx].items[i].content[cIdx].categoryId = e.target.value;
                                                                                                        setData({ ...data, menus: newMenus });
                                                                                                    }}
                                                                                                >
                                                                                                    <option value="">Kategori Seç...</option>
                                                                                                    {(item.sidebar || []).map((s: any) => (
                                                                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            </div>
                                                                                            <div className="w-12">
                                                                                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">İKON</label>
                                                                                                <input
                                                                                                    className="w-full text-center border-slate-200 rounded-lg p-1.5 bg-white text-slate-900 border"
                                                                                                    placeholder="✨"
                                                                                                    value={content.icon}
                                                                                                    onChange={(e) => {
                                                                                                        const newMenus = [...data.menus];
                                                                                                        newMenus[mIdx].items[i].content[cIdx].icon = e.target.value;
                                                                                                        setData({ ...data, menus: newMenus });
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex-1">
                                                                                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">BAŞLIK</label>
                                                                                                <input
                                                                                                    className="w-full font-bold border-slate-200 rounded-lg p-1.5 bg-white text-slate-900 border"
                                                                                                    placeholder="Kart Başlığı"
                                                                                                    value={content.title}
                                                                                                    onChange={(e) => {
                                                                                                        const newMenus = [...data.menus];
                                                                                                        newMenus[mIdx].items[i].content[cIdx].title = e.target.value;
                                                                                                        setData({ ...data, menus: newMenus });
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <button className="text-red-300 hover:text-red-500 px-1 pt-4" onClick={() => {
                                                                                                const newMenus = [...data.menus];
                                                                                                newMenus[mIdx].items[i].content = newMenus[mIdx].items[i].content.filter((_: any, idx: number) => idx !== cIdx);
                                                                                                setData({ ...data, menus: newMenus });
                                                                                            }}>×</button>
                                                                                        </div>
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            <div>
                                                                                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">AÇIKLAMA</label>
                                                                                                <input
                                                                                                    className="w-full border-slate-200 rounded-lg p-1.5 text-slate-600 bg-white border"
                                                                                                    placeholder="Küçük açıklama yazısı"
                                                                                                    value={content.desc}
                                                                                                    onChange={(e) => {
                                                                                                        const newMenus = [...data.menus];
                                                                                                        newMenus[mIdx].items[i].content[cIdx].desc = e.target.value;
                                                                                                        setData({ ...data, menus: newMenus });
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">LİNK (URL)</label>
                                                                                                <input
                                                                                                    className="w-full border-slate-200 rounded-lg p-1.5 font-mono text-blue-600 bg-white border"
                                                                                                    placeholder="/services/web"
                                                                                                    value={content.link}
                                                                                                    onChange={(e) => {
                                                                                                        const newMenus = [...data.menus];
                                                                                                        newMenus[mIdx].items[i].content[cIdx].link = e.target.value;
                                                                                                        setData({ ...data, menus: newMenus });
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                {(!item.content || item.content.length === 0) && (
                                                                                    <p className="text-[10px] text-slate-400 italic text-center py-8">Henüz içerik kartı eklenmedi. Önce bir kategori seçerek başlayın.</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                const newMenus = [...data.menus];
                                                if (!newMenus[mIdx].items) newMenus[mIdx].items = [];
                                                newMenus[mIdx].items.push({ label: 'Yeni Link', link: '#', type: 'link' });
                                                setData({ ...data, menus: newMenus });
                                            }}
                                            className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-slate-50 transition uppercase tracking-widest text-xs flex justify-center items-center gap-2"
                                        >
                                            <span className="text-xl">➕</span> YENİ MENÜ ÖĞESİ EKLE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
