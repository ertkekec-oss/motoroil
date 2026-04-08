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
    if (type === 'MODERN_HERO') return {
      title: 'Yepyeni Bir E-Ticaret Deneyimi',
      subtitle: 'Sınırları yeniden çiziyoruz.',
      primaryBtnText: 'Hemen Başla',
      visualUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978'
    };
    if (type === 'MODERN_TABS') return {
        items: [
            { title: "Yeni Tab", desc: "Açıklama...", image: "https://images.unsplash.com/photo-1552664730-d307ca884978" }
        ]
    };
    if (type === 'MODERN_INTEGRATIONS') return {
        items: [
            { title: "Entegrasyon 1", contentTitle: "Harika Entegrasyon", descLine1: "Açıklama 1", descLine2: "Açıklama 2", logos: ["Trendyol", "Hepsiburada"] }
        ]
    };
    if (type === 'MODERN_WHY_US') return {
        heading: '<span class="font-bold">Periodya</span> <span class="font-light">ile operasyonlarınızı kolaylaştırın.</span>',
        desc: 'Günümüz e-ticaret dünyasında düşük maliyetli hızlı çözümler.',
        card1: { title: "Hızlı Entegrasyon", desc: "1 saatte tüm ürünlerinizi aktarın." },
        card2: { title: "Sürekli Destek", desc: "7/24 uzman kadromuz yanınızda." }
    };
    if (type === 'MODERN_FEATURES') return {
        heading: 'Bizi <span class="text-blue-600">Özel Kılan</span> Detaylar.',
        desc: 'Ön saflarda yer alan teknolojimizle büyüyün.'
    };
    if (type === 'MODERN_PRICING') return {
        heading: 'Esnek Paket Seçenekleri',
        desc: 'Sürpriz ödemeler olmadan işletmenizle büyüyen modeller.'
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
           <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow transition-colors disabled:opacity-50">
             <Save className="w-4 h-4" />
             {saving ? "Kaydediliyor..." : "Taslağı Kaydet"}
           </button>
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
               {activeBlock.type === 'HERO' || activeBlock.type === 'MODERN_HERO' ? (
                 <div className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Ana Başlık (Görsel Editör)</label>
                     <VisualTextEditor 
                       value={activeBlock.content.title || ''} 
                       onChange={(val: any) => updateBlockData('title', val)}
                       placeholder="Ana başlık buraya..."
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Alt Açıklama (Subtitle)</label>
                     <VisualTextEditor 
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
                 </div>
               ) : activeBlock.type === 'MODERN_FEATURES' || activeBlock.type === 'MODERN_PRICING' ? (
                 <div className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Kutu Başlığı (Görsel Editör)</label>
                     <VisualTextEditor 
                       value={activeBlock.content.heading || ''} 
                       onChange={(val: any) => updateBlockData('heading', val)}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Açıklama</label>
                     <VisualTextEditor 
                       value={activeBlock.content.desc || ''} 
                       onChange={(val: any) => updateBlockData('desc', val)}
                     />
                   </div>
                 </div>
               ) : activeBlock.type === 'MODERN_WHY_US' ? (
                 <div className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Ana Başlık (Görsel Editör)</label>
                     <VisualTextEditor value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Kısa Açıklama</label>
                     <VisualTextEditor value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
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
                          <VisualTextEditor placeholder="Ana Başlık (Görsel Editör)" value={activeBlock.content.heading || ''} onChange={(val: any) => updateBlockData('heading', val)} />
                          <VisualTextEditor placeholder="Alt Açıklama" value={activeBlock.content.desc || ''} onChange={(val: any) => updateBlockData('desc', val)} />
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
                                    }} className="w-full bg-slate-900 border border-slate-800 p-1.5 text-xs text-white rounded outline-none h-16 resize-none" />
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
