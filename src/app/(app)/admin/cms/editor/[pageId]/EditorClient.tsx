"use client";
import React, { useState } from "react";
import { Save, Plus, ArrowLeft, Layout, MousePointerClick, Monitor, Smartphone, Globe, Settings as SettingsIcon, GripVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="flex h-[calc(100vh-6rem)] min-h-[800px] w-full max-w-[1600px] border border-slate-800 rounded-2xl bg-slate-950 text-slate-300 font-sans overflow-hidden shadow-2xl">
      
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

          <button className="w-full mt-4 flex items-center justify-center gap-2 p-3 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium">
            <Plus className="w-4 h-4" />
            Yeni Blok Ekle
          </button>
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
            
            {/* RENDER THE BLOCKS (MOCK PREVIEW) */}
            {blocks.map(b => (
              <div key={b.id} className={`relative group ${activeBlockId === b.id ? 'ring-2 ring-inset ring-blue-500' : ''}`} onClick={() => setActiveBlockId(b.id)}>
                {/* Simulated Hero Block Content */}
                {b.type === 'Hero' && (
                  <div className="py-24 px-8 text-center bg-gradient-to-br from-slate-50 to-white text-slate-900">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">{b.content.title}</h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10">{b.content.subtitle}</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      {b.content.primaryButton && (
                        <button className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl">{b.content.primaryButton.label}</button>
                      )}
                      {b.content.secondaryButton && (
                        <button className="px-8 py-3.5 bg-slate-100 text-slate-900 font-bold rounded-xl">{b.content.secondaryButton.label}</button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Selection Overlay */}
                <div className={`absolute inset-0 border-2 border-blue-500 bg-blue-500/5 cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 ${activeBlockId === b.id ? 'opacity-100' : ''}`}>
                  <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                    {b.type} BLOCK
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - INSPECTOR */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
        
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
                  <button className="p-2 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 transition-colors">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>

               {/* Dynamic Fields based on Type */}
               {activeBlock.type === 'Hero' && (
                 <div className="space-y-5">
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Ana Başlık (Title)</label>
                     <textarea 
                       value={activeBlock.content.title || ''} 
                       onChange={e => updateBlockData('title', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Alt Açıklama (Subtitle)</label>
                     <textarea 
                       value={activeBlock.content.subtitle || ''} 
                       onChange={e => updateBlockData('subtitle', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-28 resize-none"
                     />
                   </div>
                   
                   <div className="pt-4 border-t border-slate-800">
                     <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">Primary Button</label>
                     <div className="space-y-3">
                       <input 
                         type="text" 
                         placeholder="Buton Metni"
                         value={activeBlock.content.primaryButton?.label || ''}
                         onChange={e => updateBlockData('primaryButton', { ...activeBlock.content.primaryButton, label: e.target.value })}
                         className="w-full bg-slate-950 border border-slate-700/50 rounded-lg p-2.5 text-sm text-white outline-none"
                       />
                       <input 
                         type="text" 
                         placeholder="URL (/link)"
                         value={activeBlock.content.primaryButton?.url || ''}
                         onChange={e => updateBlockData('primaryButton', { ...activeBlock.content.primaryButton, url: e.target.value })}
                         className="w-full bg-slate-950 border border-slate-700/50 rounded-lg p-2.5 text-sm text-slate-300 font-mono outline-none"
                       />
                     </div>
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
