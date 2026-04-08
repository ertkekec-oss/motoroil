"use client";
import React, { useState, useEffect } from "react";
import { Save, Plus, ArrowLeft, Layout, MousePointerClick, Monitor, Smartphone, Globe, Settings as SettingsIcon, GripVertical, Trash2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ModernLanding from "@/components/landing/ModernLanding";

const VisualTextEditor = ({ value, onChange, placeholder }: any) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = prompt("Link URL:");
    if (url) exec('createLink', url);
  };

  const notifyChange = () => {
    if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700/50 rounded-md overflow-hidden flex flex-col mb-3">
       <div className="flex items-center gap-1 bg-slate-950/80 border-b border-slate-700/50 p-1">
          <button onClick={() => exec('bold')} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Kalın"><Bold size={14}/></button>
          <button onClick={() => exec('italic')} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Eğik"><Italic size={14}/></button>
          <button onClick={handleLink} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Link Ekle"><LinkIcon size={14}/></button>
          <div className="w-px h-4 bg-slate-700 mx-1"></div>
          <div className="relative group">
              <button className="px-2 py-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white text-[10px] font-bold">Renk</button>
              <input type="color" onChange={(e) => exec('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Yazı Rengi" />
          </div>
          <div className="relative group">
              <button className="px-2 py-1 bg-slate-800/50 hover:bg-slate-800 rounded text-slate-400 hover:text-white text-[10px] font-bold">Zemin</button>
              <input type="color" onChange={(e) => exec('hiliteColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Arkaplan Rengi" />
          </div>
          <div className="w-px h-4 bg-slate-700 mx-1"></div>
          <button onClick={() => exec('formatBlock', 'H1')} className="px-2 py-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white text-[11px] font-bold">H1</button>
          <button onClick={() => exec('formatBlock', 'H3')} className="px-2 py-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white text-[11px] font-bold">H3</button>
          <button onClick={() => exec('removeFormat')} className="px-2 py-1 hover:bg-rose-900/50 rounded text-rose-400 hover:text-rose-300 text-[10px] font-bold">Temizle</button>
       </div>
       <div 
          ref={editorRef}
          contentEditable 
          onBlur={notifyChange}
          onKeyUp={notifyChange}
          className="p-3 text-sm text-white focus:outline-none min-h-[80px] max-h-[250px] overflow-y-auto"
          style={{ whiteSpace: 'pre-wrap' }}
          data-placeholder={placeholder}
       />
    </div>
  );
}

const ImageUploadField = ({ value, onChange }: any) => {
   const handleFile = (e: any) => {
       const file = e.target.files[0];
       if (!file) return;
       const reader = new FileReader();
       reader.onloadend = () => {
           onChange(reader.result);
       };
       reader.readAsDataURL(file);
   };

   return (
       <div className="flex flex-col gap-2 mb-3">
           {value && value.startsWith('data:image') && (
               <img src={value} className="h-20 object-contain rounded-md border border-slate-700 bg-slate-900" alt="preview" />
           )}
           <div className="flex items-center gap-2">
               <input 
                 value={value && !value.startsWith('data:image') ? value : ''} 
                 onChange={e => onChange(e.target.value)}
                 placeholder="Görsel URL..."
                 className="flex-1 bg-slate-900 border border-slate-700/50 rounded p-2.5 text-xs text-white outline-none"
               />
               <label className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded px-3 h-[38px] cursor-pointer shadow-md shrink-0">
                   <Upload size={14} className="mr-1.5" />
                   <span className="text-xs font-bold">Yükle</span>
                   <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
               </label>
           </div>
       </div>
   );
};

const JsonEditor = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
  const [jsonStr, setJsonStr] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setJsonStr(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (e: any) => {
    const newVal = e.target.value;
    setJsonStr(newVal);
    try {
      const parsed = JSON.parse(newVal);
      setError(false);
      onChange(parsed);
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <textarea
        value={jsonStr}
        onChange={handleChange}
        className={`w-full bg-slate-950 border ${error ? 'border-rose-500' : 'border-slate-700/50'} rounded-lg p-3 text-xs text-green-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-[400px] resize-y font-mono font-medium`}
        spellCheck={false}
      />
      {error && <p className="text-[10px] text-rose-500 font-bold">Geçersiz JSON formatı. Değişiklikleriniz ancak JSON geçerli olduğunda uygulanır.</p>}
    </div>
  );
};

export default function EditorClient({ initialPage, initialBlocks }: { initialPage: any, initialBlocks: any[] }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<any[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(initialBlocks[0]?.id || null);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    setBlocks(initialBlocks);
    if (!blocks.find(b => b.id === activeBlockId) && initialBlocks.length > 0) {
       setActiveBlockId(initialBlocks[0].id);
    }
  }, [initialBlocks]);

  const activeBlock = blocks.find(b => b.id === activeBlockId);

  const updateBlockData = (key: string, value: any) => {
    setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, content: { ...b.content, [key]: value } } : b));
  };

  const handleAddBlock = (type: string) => {
    const newBlock = {
      id: `temp-${Date.now()}`,
      type,
      content: getInitialContentForType(type),
      order: blocks.length,
      isActive: true
    };
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  const getInitialContentForType = (type: string) => {
    if (type === 'MODERN_HEADER') return {
        notificationText: "Yeni: Periodya'nın baştan aşağı yenilenen kullanıcı arayüzü ile tanışın! Operasyonlarınız çok daha güçlü.",
        logoText: "Periodya",
        menuItems: [
            { title: "Ana Sayfa", linksTo: "#" },
            { title: "Özellikler", linksTo: "#" },
            { title: "Modüller", linksTo: "#" },
            { title: "Blog", linksTo: "#" },
            { title: "İletişim", linksTo: "#" }
        ],
        btn1Text: "Giriş Yap",
        btn2Text: "Ücretsiz Dene",
        btn2Url: "/register",
        tickerItems: ["BAŞARI İÇİN MÜKEMMEL ÇÖZÜM", "E-TİCARET OPERASYONLARINDA MÜKEMMELLİK", "MARKANIZI PERİODYA İLE YÜKSELTİN", "İŞ HEDEFLERİNİZE ULAŞACAK TEKNOLOJİ", "GÜÇLÜ PAZAR YERİ VARLIĞI"]
    };
    if (type === 'MODERN_FOOTER') return {
        brandName: "Periodya",
        copyright: "© 2026 Periodya - IT Services. All rights reserved.",
        contactEmail: "support@periodya.com",
        contactPhone: "+880 (123) 456 88",
        address: "55 Main Street, 2nd block Melbourne, Australia",
        menu1Title: "My account",
        menu1Items: [{title: "Forum Support", linksTo: "#"}, {title: "Help & FAQ", linksTo: "#"}, {title: "Contact Us", linksTo: "#"}, {title: "Pricing and plans", linksTo: "#"}],
        menu2Title: "Service",
        menu2Items: [{title: "It Consultation", linksTo: "#"}, {title: "Cloud Services", linksTo: "#"}, {title: "AI Machine Learning", linksTo: "#"}, {title: "Data Security", linksTo: "#"}]
    };
    if (type === 'MODERN_HERO') return {
      title: '<span class="font-light">E-Ticaret</span> <span class="font-bold">ve</span><br/><span class="font-bold">Ön Muhasebede</span><br/><span class="font-bold text-[#2563EB]">Üstün</span> <span class="font-light whitespace-nowrap">Sonuçlar</span>',
      subtitle: 'Günümüzün rekabetçi ticaretinde etkili çözümler.',
      primaryBtnText: 'Ücretsiz Başla',
      visualUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
      stat1Val: '2.3M+',
      stat1Text: '5000+ Müşteri Yorumu',
      trustBadgeText: 'Trust pilot',
      revenueTitle: 'Günlük Ciro',
      revenueAmount: '₺48,200.00',
      revenueTab1: 'Günlük',
      revenueTab2: 'Haftalık',
      revenueTab3: 'Aylık',
      stat2Val: '8+',
      stat2Text: 'Yıllık Sektör<br/>Tecrübesi'
    };
    if (type === 'MODERN_TABS') return {
        badge: 'TECH SOLUTION',
        heading: '<span class="font-light">The</span> <span class="font-bold">CompletePlatform</span><span class="font-light">To</span><br/> <span class="font-bold">PowerYourOperations</span>',
        desc: "In today's competitive business, the demand for efficient and cost-effective IT solutions has never been more critical.",
        balanceTitle: 'Your balance',
        balanceAmount: '$1,000',
        usabilityTitle: 'Usability testing',
        usabilityDesc: '12 products',
        chartTitle: 'Your Pie Chart',
        chartFilter: 'Monthly',
        items: [
            { title: "Yeni Tab", desc: "Açıklama...", image: "https://images.unsplash.com/photo-1552664730-d307ca884978" }
        ]
    };
    if (type === 'MODERN_INTEGRATIONS') return {
        heading: '<span class="font-extrabold">Sıradışı Bir Entegrasyon</span> <span class="font-light">Ağı</span>',
        desc: 'Bütün operasyonunuz için gerekli olan tüm platformlar tek çatı altında.',
        testimonialHeading: 'Kusursuz entegrasyon ile operasyonlarınızı hızlandırın',
        testimonialDesc: 'Gerçek müşterilerimizden dürüst geri bildirimler.',
        items: [
            { title: "Entegrasyon 1", contentTitle: "Harika Entegrasyon", descLine1: "Açıklama 1", descLine2: "Açıklama 2", logos: ["Trendyol", "Hepsiburada"] }
        ]
    };
    if (type === 'MODERN_WHY_US') return {
        heading: '<span class="font-bold">Periodya</span> <span class="font-light">operasyonlarınızı optimize ederek ekibinizin performansını artırır ve</span> <span class="font-bold">Büyümeyi hızlandırır.</span>',
        desc: 'Günümüz rekabetçi e-ticaret pazarında, etkin ve düşük maliyetli yazılım çözümlerine olan talep hiç bu kadar kritik olmamıştı. Sizi bir adım öne taşıyoruz.',
        card1: { title: "Uzmanlık & Özelleştirme", desc: "Ekibimiz size özel tasarlanmış tam teşekküllü donanımlar ve büyüme planları sunar." },
        card2: { title: "Kesintisiz Entegrasyon", desc: "Sistemlerimiz her ay yeni pazar yeri standartlarına uygun olarak kesintisiz güncellenir." },
        visualUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
        statsNumber: '1.3m',
        statsDesc: 'Yıllık ortalama işlenen başarılı paket hacmi.'
    };
    if (type === 'MODERN_FEATURES') return {
        heading: 'Bizi <span class="text-blue-600">Farklı Kılan</span> Özellikler.',
        desc: 'Sürekli yenilikçi teknolojilerle ön saflarda yer almaktan, sınırları yeniden tanımlamaktan ve e-ticaret dijital dünyasını birlikte şekillendirmekten gurur duyuyoruz.',
        features: [
            { title: "YZ Destekli Analiz", desc: "Ön muhasebenizde yapay zekanın hızını ve kusursuzluğunu hissedin.", icon: "bot" },
            { title: "Derin İçgörüler", desc: "Pazar yerlerindeki satış trendlerinizi anlık ve net raporlarla takip edin.", icon: "pie-chart" },
            { title: "Stratejik Kararlar", desc: "Gerçek verilere dayalı altyapımızla doğru zamanda en iyi ticaret kararını alın.", icon: "activity" }
        ]
    };
    if (type === 'MODERN_PRICING') return {
        heading: 'Esnek Fiyatlandırma',
        desc: 'Büyüme hızınıza ayak uyduran paketler.',
        packages: [
            {
                name: "Başlangıç",
                desc: "Küçük işletmeler için tam teşekküllü pazar yeri otomasyonu.",
                price: "₺990",
                period: "/ay",
                btnText: "14 Gün Deneyin",
                isPopular: false,
                features: ["Sınırlı Pazar Yeri", "Stok Takibi"]
            }
        ]
    };
    return {};
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: initialPage.id, blocks, publish })
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Kaydetme işlemi başarısız!");
      }
    } catch(e) {
      console.error(e);
      alert("Sunucu hatası!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-300 font-sans overflow-hidden border-t border-slate-800">
      
      {/* LEFT SIDEBAR - HIERARCHY & BLOCKS */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0">
        <div className="h-14 border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
          <Link href="/admin/cms" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Stüdyo'ya Dön</span>
          </Link>
          <div className="px-2 py-1 bg-slate-800 rounded text-xs font-bold font-mono tracking-wider text-slate-300">
            /{initialPage.slug}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto hidden-scrollbar p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
            <span>SAYFA BLOKLARI</span>
            <Plus className="w-4 h-4 cursor-pointer hover:text-white" />
          </h3>
          
          <div className="space-y-2">
            {blocks.map((block) => (
              <div 
                key={block.id}
                onClick={() => setActiveBlockId(block.id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  activeBlockId === block.id 
                  ? "bg-blue-600/10 border-blue-500/50 text-white" 
                  : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{block.type}</span>
                    <span className="text-[10px] text-slate-500">Block ID: {block.id.slice(0, 6)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {/* ADD BLOCK BUTTONS */}
            <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-slate-800">
              <button 
                onClick={() => handleAddBlock('MODERN_HEADER')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 bg-slate-950/40 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN HEADER
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_HERO')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN HERO
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_TABS')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN TABS
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_INTEGRATIONS')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN INTEGRATIONS
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_WHY_US')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN WHY US
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_FEATURES')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN FEATURES
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_PRICING')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN PRICING
              </button>
              <button 
                onClick={() => handleAddBlock('MODERN_FOOTER')}
                className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-700 bg-slate-950/40 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold"
              >
                <Plus className="w-3 h-3" /> MODERN FOOTER
              </button>
            </div>
        </div>
      </div>

      {/* CENTER STAGE - VISUAL PREVIEW */}
      <div className="flex-1 flex flex-col items-center bg-black relative">
        <div className="absolute top-4 bg-slate-900 border border-slate-700 rounded-full flex items-center p-1 shadow-2xl z-20">
          <button onClick={() => setDevice('desktop')} className={`p-2 rounded-full transition-colors ${device === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Monitor className="w-4 h-4" />
          </button>
          <button onClick={() => setDevice('mobile')} className={`p-2 rounded-full transition-colors ${device === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Smartphone className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-2" />
          <div className="px-3 text-xs font-mono text-slate-400 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            {initialPage.site.domain}/{initialPage.slug}
          </div>
        </div>

        <div className="flex-1 w-full overflow-y-auto hidden-scrollbar pt-20 pb-10 flex justify-center">
          <div className={`bg-white transition-all duration-500 ${device === 'desktop' ? 'w-full max-w-[1200px] shadow-2xl rounded-t-xl' : 'w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] border-8 border-slate-800 min-h-[800px]'}`}>
            
            {/* RENDER THE REAL PAGE COMPONENT */}
            <div className="relative w-full h-full overflow-y-auto hidden-scrollbar pointer-events-auto bg-slate-100 rounded-t-xl">
                <ModernLanding cmsData={{ sections: blocks }} isEditorMode={true} />
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - INSPECTOR */}
      <div className="w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
        
        {/* Top actions */}
        <div className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-950/50 shrink-0">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-amber-500" />
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TASLAK</span>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-sm font-bold shadow transition-colors disabled:opacity-50 border border-slate-700">
               <Save className="w-4 h-4" />
               {saving ? "..." : "Taslağı Kaydet"}
             </button>
             <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow transition-colors disabled:opacity-50">
               <Globe className="w-4 h-4" />
               Yayına Al
             </button>
           </div>
        </div>

        {/* Inspector Fields */}
        <div className="flex-1 overflow-y-auto hidden-scrollbar p-5 space-y-6">
          {!activeBlock ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center px-4">
                <MousePointerClick className="w-12 h-12 mb-4 opacity-50" />
                <p>Düzenlemek için sol menüden veya önizlemeden bir blok seçin.</p>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-white font-bold text-lg">{activeBlock.type}</h2>
                    <p className="text-slate-500 text-xs">Blok Yöneticisi</p>
                  </div>
                  <button 
                    onClick={() => {
                        setBlocks(prev => prev.filter(b => b.id !== activeBlock.id));
                        setActiveBlockId(null);
                    }}
                    className="p-2 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 transition-colors"
                  >
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>

               {/* Dynamic Fields based on Type */}
               {activeBlock.type === 'MODERN_HEADER' ? (
                  <div className="space-y-4">
                     <p className="text-xs font-bold text-slate-400">Üst Bar & Menü</p>
                     <input placeholder="Üst Bildirim Çubuğu" value={activeBlock.content.notificationText || ''} onChange={e => updateBlockData('notificationText', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     <input placeholder="Logo Metni" value={activeBlock.content.logoText || ''} onChange={e => updateBlockData('logoText', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     
                     <div className="p-3 border border-slate-800 bg-slate-950/30 rounded-lg">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-400">Menü Linkleri</span>
                            <button onClick={() => updateBlockData('menuItems', [...(activeBlock.content.menuItems || []), { title: 'Yeni', linksTo: '#' }])} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 px-2 py-1 rounded">+ Ekle</button>
                         </div>
                         {(activeBlock.content.menuItems || []).map((m: any, idx: number) => (
                             <div key={idx} className="flex gap-2 mb-2 relative">
                                <input value={m.title || ''} onChange={(e) => { const arr = [...activeBlock.content.menuItems]; arr[idx].title = e.target.value; updateBlockData('menuItems', arr); }} className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-7" placeholder="İsim" />
                                <input value={m.linksTo || ''} onChange={(e) => { const arr = [...activeBlock.content.menuItems]; arr[idx].linksTo = e.target.value; updateBlockData('menuItems', arr); }} className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-7" placeholder="URL" />
                                <button onClick={() => updateBlockData('menuItems', activeBlock.content.menuItems.filter((_: any, i: number) => i !== idx))} className="text-rose-500 font-bold px-1">X</button>
                             </div>
                         ))}
                     </div>
                     
                     <p className="text-xs font-bold text-slate-400 border-t border-slate-800 pt-3">Butonlar</p>
                     <div className="flex gap-2">
                        <input placeholder="Buton 1 (Giriş Yap)" value={activeBlock.content.btn1Text || ''} onChange={e => updateBlockData('btn1Text', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                        <input placeholder="Buton 2 (Ücretsiz Dene)" value={activeBlock.content.btn2Text || ''} onChange={e => updateBlockData('btn2Text', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     </div>
                     <input placeholder="Buton 2 URL (/register)" value={activeBlock.content.btn2Url || ''} onChange={e => updateBlockData('btn2Url', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     
                     <p className="text-xs font-bold text-slate-400 border-t border-slate-800 pt-3">Akan Bant Yazıları (Virgülle Ayırın)</p>
                     <textarea value={(activeBlock.content.tickerItems || []).join(', ')} onChange={(e) => {
                         const arr = e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean);
                         updateBlockData('tickerItems', arr);
                     }} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white h-16 resize-none" placeholder="Yazı 1, Yazı 2..." />
                  </div>
               ) : activeBlock.type === 'MODERN_FOOTER' ? (
                  <div className="space-y-4">
                     <p className="text-xs font-bold text-slate-400">Marka & İletişim</p>
                     <input placeholder="Marka Adı" value={activeBlock.content.brandName || ''} onChange={e => updateBlockData('brandName', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white mb-2" />
                     <input placeholder="İletişim Maili" value={activeBlock.content.contactEmail || ''} onChange={e => updateBlockData('contactEmail', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white mb-2" />
                     <input placeholder="Telefon" value={activeBlock.content.contactPhone || ''} onChange={e => updateBlockData('contactPhone', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white mb-2" />
                     <input placeholder="Açık Adres" value={activeBlock.content.address || ''} onChange={e => updateBlockData('address', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     
                     <p className="text-xs font-bold text-slate-400 border-t border-slate-800 pt-3">Menü 1</p>
                     <input placeholder="Menü 1 Başlık" value={activeBlock.content.menu1Title || ''} onChange={e => updateBlockData('menu1Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white mb-2" />
                     <textarea value={(activeBlock.content.menu1Items || []).map((m: any) => m.title).join(', ')} onChange={(e) => {
                         const arr = e.target.value.split(',').map((x: string) => ({ title: x.trim(), linksTo: '#' })).filter((x: any) => x.title);
                         updateBlockData('menu1Items', arr);
                     }} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white h-16 resize-none" placeholder="Link 1, Link 2..." />

                     <p className="text-xs font-bold text-slate-400 border-t border-slate-800 pt-3">Menü 2</p>
                     <input placeholder="Menü 2 Başlık" value={activeBlock.content.menu2Title || ''} onChange={e => updateBlockData('menu2Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white mb-2" />
                     <textarea value={(activeBlock.content.menu2Items || []).map((m: any) => m.title).join(', ')} onChange={(e) => {
                         const arr = e.target.value.split(',').map((x: string) => ({ title: x.trim(), linksTo: '#' })).filter((x: any) => x.title);
                         updateBlockData('menu2Items', arr);
                     }} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white h-16 resize-none" placeholder="Link 1, Link 2..." />
                     
                     <p className="text-xs font-bold text-slate-400 border-t border-slate-800 pt-3">Telif Hakkı (Copyright)</p>
                     <input placeholder="© 2026..." value={activeBlock.content.copyright || ''} onChange={e => updateBlockData('copyright', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                  </div>
               ) : activeBlock.type === 'HERO' || activeBlock.type === 'MODERN_HERO' ? (
                 <div className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Ana Başlık (Görsel Editör)</label>
                     <VisualTextEditor 
                       key={activeBlock.id + '-hero-title'}
                       value={activeBlock.content.title || ''} 
                       onChange={(val: any) => updateBlockData('title', val)}
                       placeholder="Ana başlık buraya..."
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Alt Açıklama (Subtitle)</label>
                     <VisualTextEditor 
                       key={activeBlock.id + '-hero-subtitle'}
                       value={activeBlock.content.subtitle || ''} 
                       onChange={(val: any) => updateBlockData('subtitle', val)}
                       placeholder="Alt açıklama buraya..."
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Medya URL (Görsel)</label>
                     <ImageUploadField 
                       value={activeBlock.content.visualUrl || ''} 
                       onChange={(val: any) => updateBlockData('visualUrl', val)}
                     />
                   </div>
                   <div className="pt-4 border-t border-slate-800">
                     <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">Primary Button Metni</label>
                     <input 
                       type="text" 
                       placeholder="Örn: Ücretsiz Dene"
                       value={activeBlock.content.primaryBtnText || ''}
                       onChange={e => updateBlockData('primaryBtnText', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700/50 rounded-lg p-2.5 text-sm text-white outline-none"
                     />
                   </div>
                   <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
                       <div className="col-span-2"><p className="text-[10px] font-bold text-blue-400 uppercase">Sol Alt Kutu Txt</p></div>
                       <div><input placeholder="2.3M+" value={activeBlock.content.stat1Val || ''} onChange={e => updateBlockData('stat1Val', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>
                       <div><input placeholder="5000+ Yorum" value={activeBlock.content.stat1Text || ''} onChange={e => updateBlockData('stat1Text', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>
                       
                       <div className="col-span-2 mt-2"><p className="text-[10px] font-bold text-indigo-400 uppercase">Sağ Üst Rozet</p></div>
                       <div className="col-span-2"><input placeholder="Trust pilot" value={activeBlock.content.trustBadgeText || ''} onChange={e => updateBlockData('trustBadgeText', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>

                       <div className="col-span-2 mt-2"><p className="text-[10px] font-bold text-pink-400 uppercase">Sol Alt Gelir Kutusu</p></div>
                       <div className="col-span-2"><input placeholder="Günlük Ciro" value={activeBlock.content.revenueTitle || ''} onChange={e => updateBlockData('revenueTitle', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>
                       <div className="col-span-2"><input placeholder="₺48,200.00" value={activeBlock.content.revenueAmount || ''} onChange={e => updateBlockData('revenueAmount', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>
                       <div className="col-span-2 flex gap-1">
                           <input placeholder="Günlük" value={activeBlock.content.revenueTab1 || ''} onChange={e => updateBlockData('revenueTab1', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                           <input placeholder="Haftalık" value={activeBlock.content.revenueTab2 || ''} onChange={e => updateBlockData('revenueTab2', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                           <input placeholder="Aylık" value={activeBlock.content.revenueTab3 || ''} onChange={e => updateBlockData('revenueTab3', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                       </div>

                       <div className="col-span-2 mt-2"><p className="text-[10px] font-bold text-sky-400 uppercase">Sağ Alt Mavi Kutu</p></div>
                       <div><input placeholder="8+" value={activeBlock.content.stat2Val || ''} onChange={e => updateBlockData('stat2Val', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>
                       <div><input placeholder="Yıllık Sektör<br/>Tecrübesi" value={activeBlock.content.stat2Text || ''} onChange={e => updateBlockData('stat2Text', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" /></div>
                   </div>
                 </div>
               ) : activeBlock.type === 'MODERN_FEATURES' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Kutu Başlığı (Görsel Editör)</label>
                      <VisualTextEditor key={activeBlock.id + '-features-heading'} value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Açıklama</label>
                      <VisualTextEditor key={activeBlock.id + '-features-desc'} value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
                    </div>
                    <div className="flex justify-between items-center mt-4 border-t border-slate-800 pt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Özellik Kartları</span>
                        <button onClick={() => updateBlockData('features', [...(activeBlock.content.features || []), { title: 'Yeni', desc: 'Açıklama', icon: 'bot' }])} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 px-2 py-1 rounded">+ Kart Ekle</button>
                    </div>
                    {(activeBlock.content.features || []).map((ft: any, idx: number) => (
                        <div key={idx} className="p-3 border border-slate-800 bg-slate-950/30 rounded-lg relative space-y-2">
                             <button onClick={() => updateBlockData('features', activeBlock.content.features.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 p-1 bg-rose-500/10 rounded">X</button>
                             <input value={ft.title || ''} onChange={(e) => { const arr = [...activeBlock.content.features]; arr[idx].title = e.target.value; updateBlockData('features', arr); }} className="w-[85%] bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-7 font-bold" placeholder="Kart Başlığı" />
                             <input value={ft.desc || ''} onChange={(e) => { const arr = [...activeBlock.content.features]; arr[idx].desc = e.target.value; updateBlockData('features', arr); }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-7" placeholder="Açıklama..." />
                             <input value={ft.icon || ''} onChange={(e) => { const arr = [...activeBlock.content.features]; arr[idx].icon = e.target.value; updateBlockData('features', arr); }} className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 text-[10px] text-zinc-400 rounded outline-none h-7" placeholder="İkon Adı (bot, pie-chart...)" />
                        </div>
                    ))}
                  </div>
                ) : activeBlock.type === 'MODERN_PRICING' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Kutu Başlığı (Görsel Editör)</label>
                      <VisualTextEditor key={activeBlock.id + '-pricing-heading'} value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Açıklama</label>
                      <VisualTextEditor key={activeBlock.id + '-pricing-desc'} value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
                    </div>
                    <div className="flex justify-between items-center mt-4 border-t border-slate-800 pt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Fiyat Paketleri</span>
                        <button onClick={() => updateBlockData('packages', [...(activeBlock.content.packages || []), { name: 'Yeni', desc: 'Açıklama', price: '₺0', period: '/ay', btnText: 'Satın Al', features: [], isPopular: false }])} className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 px-2 py-1 rounded">+ Paket Ekle</button>
                    </div>
                    {(activeBlock.content.packages || []).map((pkg: any, idx: number) => (
                        <div key={idx} className="p-3 border border-slate-800 bg-slate-950/30 rounded-lg relative space-y-2">
                             <button onClick={() => updateBlockData('packages', activeBlock.content.packages.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 p-1 bg-rose-500/10 rounded shadow-sm z-10 w-6 h-6 flex justify-center items-center font-bold">X</button>
                             <div className="flex items-center gap-2 w-[85%]">
                                <input value={pkg.name || ''} onChange={(e) => { const arr = [...activeBlock.content.packages]; arr[idx].name = e.target.value; updateBlockData('packages', arr); }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-8 font-bold" placeholder="Paket Adı" />
                                <label className="text-[10px] flex items-center gap-1 text-emerald-400"><input type="checkbox" checked={pkg.isPopular || false} onChange={(e: any) => { const arr = [...activeBlock.content.packages]; arr[idx].isPopular = e.target.checked; updateBlockData('packages', arr); }}/> Popüler</label>
                             </div>
                             <textarea value={pkg.desc || ''} onChange={(e) => { const arr = [...activeBlock.content.packages]; arr[idx].desc = e.target.value; updateBlockData('packages', arr); }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-16 resize-none" placeholder="Paket Kısa Açıklaması" />
                             
                             <div className="flex gap-2">
                                <input value={pkg.price || ''} onChange={(e) => { const arr = [...activeBlock.content.packages]; arr[idx].price = e.target.value; updateBlockData('packages', arr); }} className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-8" placeholder="Fiyat (örn: ₺990)" />
                                <input value={pkg.period || ''} onChange={(e) => { const arr = [...activeBlock.content.packages]; arr[idx].period = e.target.value; updateBlockData('packages', arr); }} className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-8" placeholder="Periyot (örn: /ay)" />
                             </div>
                             <input value={pkg.btnText || ''} onChange={(e) => { const arr = [...activeBlock.content.packages]; arr[idx].btnText = e.target.value; updateBlockData('packages', arr); }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-[10px] font-bold text-blue-300 rounded outline-none h-8" placeholder="Buton Metni" />
                             
                             <label className="block text-[10px] text-slate-500 uppercase mt-2">Özellikler (Virgülle ayırın)</label>
                             <textarea value={(pkg.features || []).join(', ')} onChange={(e) => {
                                 const arr = [...activeBlock.content.packages]; 
                                 arr[idx].features = e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean); 
                                 updateBlockData('packages', arr);
                             }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-[10px] text-white rounded outline-none h-16 leading-tight break-words resize-none" placeholder="Özellik 1, Özellik 2, Özellik 3" />
                        </div>
                    ))}
                  </div>
                ) : activeBlock.type === 'MODERN_WHY_US' ? (
                 <div className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Ana Başlık (Görsel Editör)</label>
                     <VisualTextEditor key={activeBlock.id + '-why-heading'} value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Kısa Açıklama</label>
                     <VisualTextEditor key={activeBlock.id + '-why-desc'} value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Medya URL (Görsel)</label>
                     <ImageUploadField 
                       value={activeBlock.content.visualUrl || ''} 
                       onChange={(val: any) => updateBlockData('visualUrl', val)}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="block text-[10px] text-slate-500 uppercase">Dev Sayı (Örn: 1.3m)</label>
                         <input value={activeBlock.content.statsNumber || ''} onChange={e => updateBlockData('statsNumber', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" />
                       </div>
                       <div>
                         <label className="block text-[10px] text-slate-500 uppercase">Sayı Açıklaması</label>
                         <input value={activeBlock.content.statsDesc || ''} onChange={e => updateBlockData('statsDesc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-xs text-white rounded outline-none h-8" />
                       </div>
                   </div>
                   <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg space-y-3">
                     <p className="text-xs font-bold text-blue-400">KART 1 AYARLARI</p>
                     <input placeholder="Kart 1 Başlık" value={activeBlock.content.card1?.title || ''} onChange={e => updateBlockData('card1', { ...activeBlock.content.card1, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     <input placeholder="Kart 1 Açıklama" value={activeBlock.content.card1?.desc || ''} onChange={e => updateBlockData('card1', { ...activeBlock.content.card1, desc: e.target.value })} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                   </div>
                   <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg space-y-3">
                     <p className="text-xs font-bold text-emerald-400">KART 2 AYARLARI</p>
                     <input placeholder="Kart 2 Başlık" value={activeBlock.content.card2?.title || ''} onChange={e => updateBlockData('card2', { ...activeBlock.content.card2, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                     <input placeholder="Kart 2 Açıklama" value={activeBlock.content.card2?.desc || ''} onChange={e => updateBlockData('card2', { ...activeBlock.content.card2, desc: e.target.value })} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                   </div>
                 </div>
               ) : activeBlock.type === 'MODERN_TABS' || activeBlock.type === 'MODERN_INTEGRATIONS' ? (
                  <div className="space-y-4">
                     {activeBlock.type === 'MODERN_TABS' && (
                        <div className="p-3 border border-slate-800 bg-slate-950/50 rounded-lg space-y-3 mb-4">
                           <p className="text-xs font-bold text-slate-400">Üst Metin Ayarları</p>
                           <input placeholder="Rozet (Badge)" value={activeBlock.content.badge || ''} onChange={e => updateBlockData('badge', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white mb-2" />
                           <VisualTextEditor key={activeBlock.id + '-tabs-heading'} placeholder="Ana Başlık (Görsel Editör)" value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                           <VisualTextEditor key={activeBlock.id + '-tabs-desc'} placeholder="Alt Açıklama" value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
                           
                           <p className="text-xs font-bold text-slate-400 mt-4 border-t border-slate-800 pt-3">Floating UI Metinleri</p>
                           <div className="grid grid-cols-2 gap-2 mt-2">
                               <input placeholder="Your balance" value={activeBlock.content.balanceTitle || ''} onChange={e => updateBlockData('balanceTitle', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                               <input placeholder="$1,000" value={activeBlock.content.balanceAmount || ''} onChange={e => updateBlockData('balanceAmount', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                               
                               <input placeholder="Usability testing" value={activeBlock.content.usabilityTitle || ''} onChange={e => updateBlockData('usabilityTitle', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                               <input placeholder="12 products" value={activeBlock.content.usabilityDesc || ''} onChange={e => updateBlockData('usabilityDesc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                               
                               <input placeholder="Your Pie Chart" value={activeBlock.content.chartTitle || ''} onChange={e => updateBlockData('chartTitle', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                               <input placeholder="Monthly" value={activeBlock.content.chartFilter || ''} onChange={e => updateBlockData('chartFilter', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                           </div>
                           <p className="text-xs font-bold text-slate-400 mt-4 border-t border-slate-800 pt-3">Floating UI Görselleri</p>
                           <input placeholder="Bayrak Linki (örn: https://flagcdn.com/w40/tr.png)" value={activeBlock.content.balanceFlagUrl || ''} onChange={e => updateBlockData('balanceFlagUrl', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] text-white rounded outline-none h-7 mt-2" />
                        </div>
                      )}

                      {activeBlock.type === 'MODERN_INTEGRATIONS' && (
                        <div className="p-3 border border-slate-800 bg-slate-950/50 rounded-lg space-y-3 mb-4">
                           <p className="text-xs font-bold text-slate-400">Genel Başlık ve Açıklamalar</p>
                           <VisualTextEditor key={activeBlock.id + '-integ-heading'} placeholder="Ana Başlık (Görsel Editör)" value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                           <VisualTextEditor key={activeBlock.id + '-integ-desc'} placeholder="Açıklama" value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
                           
                           <p className="text-xs font-bold text-slate-400 mt-4 border-t border-slate-800 pt-3">Yorum Alanı (Section 2)</p>
                           <input placeholder="Yorumlar Ana Başlık" value={activeBlock.content.testimonialHeading || ''} onChange={e => updateBlockData('testimonialHeading', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                           <input placeholder="Yorumlar Açıklama" value={activeBlock.content.testimonialDesc || ''} onChange={e => updateBlockData('testimonialDesc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-2 text-xs text-white" />
                           
                           <p className="text-[10px] text-amber-400 mt-2 font-bold mt-4 border-t border-slate-800 pt-3">Link & Buton</p>
                           <input placeholder="Buton Metni (Tüm Yorumlar)" value={activeBlock.content.integBtnText || ''} onChange={e => updateBlockData('integBtnText', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />

                           <p className="text-[10px] text-blue-400 mt-4 border-t border-slate-800 pt-3 font-bold">1. Geniş Resim (Sol Üst)</p>
                           <input placeholder="Geniş Resim URL (E-Ticaret Yönetimi)" value={activeBlock.content.integB1Img || ''} onChange={e => updateBlockData('integB1Img', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="E-Ticaret Yönetimi" value={activeBlock.content.integB1Title || ''} onChange={e => updateBlockData('integB1Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Entegrasyon, Depo, Fatura" value={activeBlock.content.integB1Desc || ''} onChange={e => updateBlockData('integB1Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />

                           <p className="text-[10px] text-orange-400 mt-4 border-t border-slate-800 pt-3 font-bold">2. Dikey Resim (Sağ Üst)</p>
                           <input placeholder="Dikey Resim URL (Focus)" value={activeBlock.content.integB2Img || ''} onChange={e => updateBlockData('integB2Img', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="%98.2" value={activeBlock.content.integB2Title || ''} onChange={e => updateBlockData('integB2Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="En iyi ve güvenilir..." value={activeBlock.content.integB2Desc || ''} onChange={e => updateBlockData('integB2Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           
                           <p className="text-[10px] text-cyan-400 mt-4 border-t border-slate-800 pt-3 font-bold">3. Mavi İstatistik (Sol Alt)</p>
                           <input placeholder="30x" value={activeBlock.content.integB3Title || ''} onChange={e => updateBlockData('integB3Title', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Zaman tasarrufu..." value={activeBlock.content.integB3Desc || ''} onChange={e => updateBlockData('integB3Desc', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-xs text-white mt-1" />
                           <input placeholder="Avatar URL, Avatar URL (virgülle)" value={activeBlock.content.integB3Avatars || ''} onChange={e => updateBlockData('integB3Avatars', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />

                           <p className="text-[10px] text-purple-400 mt-4 border-t border-slate-800 pt-3 font-bold">4. Yorum (Sağ Alt)</p>
                           <input placeholder="Periodya" value={activeBlock.content.integB4Brand || ''} onChange={e => updateBlockData('integB4Brand', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <textarea placeholder="Yorum metni..." value={activeBlock.content.integB4Quote || ''} onChange={e => updateBlockData('integB4Quote', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1 h-12" />
                           <div className="flex gap-2 mt-1">
                                <input placeholder="Kişi İsmi" value={activeBlock.content.integB4Name || ''} onChange={e => updateBlockData('integB4Name', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white" />
                                <input placeholder="Ünvan (Şirket Sahibi)" value={activeBlock.content.integB4Role || ''} onChange={e => updateBlockData('integB4Role', e.target.value)} className="w-1/2 bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white" />
                           </div>
                           <input placeholder="Avatar Resim URL" value={activeBlock.content.integB4Avatar || ''} onChange={e => updateBlockData('integB4Avatar', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                           <input placeholder="(2.3k+ Reviews)" value={activeBlock.content.integB4Reviews || ''} onChange={e => updateBlockData('integB4Reviews', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />
                        </div>
                      )}
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Diziler (Items)</span>
                        <button 
                          onClick={() => updateBlockData('items', [...(activeBlock.content.items || []), { title: "Yeni Öğe", desc: "Açıklama" }])}
                          className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 px-2 py-1 rounded"
                        >
                          + Gelişmiş Öğe Ekle
                        </button>
                     </div>
                     {(activeBlock.content.items || []).map((item: any, idx: number) => (
                         <div key={idx} className="p-3 border border-slate-800 bg-slate-950/30 rounded-lg relative">
                             <button onClick={() => updateBlockData('items', activeBlock.content.items.filter((_: any, i: number) => i !== idx))} className="absolute top-2 right-2 text-rose-500 hover:text-rose-400 p-1 bg-rose-500/10 rounded">X</button>
                             <div className="space-y-2 pr-6">
                                <label className="block text-[10px] text-slate-500 uppercase">Başlık (Menü Adı)</label>
                                <input value={item.title || ''} onChange={(e) => {
                                  const arr = [...activeBlock.content.items]; arr[idx].title = e.target.value; updateBlockData('items', arr);
                                }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-7" />
                                
                                {activeBlock.type === 'MODERN_INTEGRATIONS' && (
                                  <>
                                    <label className="block text-[10px] text-slate-500 uppercase mt-2">Kart Başlığı</label>
                                    <input value={item.contentTitle || ''} onChange={(e) => {
                                      const arr = [...activeBlock.content.items]; arr[idx].contentTitle = e.target.value; updateBlockData('items', arr);
                                    }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-7" />
                                    
                                    <label className="block text-[10px] text-slate-500 uppercase mt-2">Line 1 & Line 2</label>
                                    <div className="flex gap-2">
                                      <input value={item.descLine1 || ''} onChange={(e) => { const arr = [...activeBlock.content.items]; arr[idx].descLine1 = e.target.value; updateBlockData('items', arr); }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-[10px] text-white rounded outline-none h-7" placeholder="Line 1" />
                                      <input value={item.descLine2 || ''} onChange={(e) => { const arr = [...activeBlock.content.items]; arr[idx].descLine2 = e.target.value; updateBlockData('items', arr); }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-[10px] text-white rounded outline-none h-7" placeholder="Line 2" />
                                    </div>
                                    <label className="block text-[10px] text-slate-500 uppercase mt-2">Entegrasyon Markaları (Virgülle Ayırın)</label>
                                    <input placeholder="Trendyol, Hepsiburada, Amazon..." value={(item.logos || []).join(', ')} onChange={(e) => {
                                      const arr = [...activeBlock.content.items]; 
                                      arr[idx].logos = e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean); 
                                      updateBlockData('items', arr);
                                    }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-[10px] text-white rounded outline-none h-7" />
                                  </>
                                )}

                                {activeBlock.type === 'MODERN_TABS' && (
                                  <>
                                    <label className="block text-[10px] text-slate-500 uppercase mt-2">Açıklama Formatı</label>
                                    <textarea value={item.desc || ''} onChange={(e) => {
                                      const arr = [...activeBlock.content.items]; arr[idx].desc = e.target.value; updateBlockData('items', arr);
                                    }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-16 resize-none mb-2" />
                                    
                                    <label className="block text-[10px] text-slate-500 uppercase mb-1">Sekme Görseli</label>
                                    <ImageUploadField 
                                      value={item.image || ''} 
                                      onChange={(val: any) => { const arr = [...activeBlock.content.items]; arr[idx].image = val; updateBlockData('items', arr); }}
                                    />
                                  </>
                                )}
                             </div>
                         </div>
                     ))}
                  </div>
               ) : (
                  <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Tesisat Verisi (JSON Gelişmiş Editör)</label>
                       <JsonEditor 
                         value={activeBlock.content} 
                         onChange={(newContent) => {
                           setBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, content: newContent } : b));
                         }} 
                       />
                     </div>
                  </div>
               )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
