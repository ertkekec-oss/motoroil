"use client";

import React, { useState } from 'react';
import { 
  CreditCard, 
  RefreshCcw, 
  Send, 
  Banknote,
  SearchCode,
  ShieldCheck,
  Building2,
  TrendingUp,
  Settings,
  ArrowRight,
  Sparkles,
  Zap,
  Mic,
  Network,
  Workflow,
  BrainCircuit,
  Power
} from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function EcosystemDashboard() {
  const [activeTab, setActiveTab] = useState<'cards' | 'auction' | 'collector'>('cards');
  const { showSuccess, showConfirm } = useModal();

  const ECO_MODULES = [
    {
      id: "v-card",
      title: "Periodya Corporate V-Card",
      subtitle: "Interchange & Cashflow",
      description: "Tüm şirket harcamalarını (yemek, benzin, SaaS) Periodya kartla yapın. Takas komisyonu Periodya'ya, muhasebe kolaylığı işletmeye gelsin.",
      icon: CreditCard,
      color: "indigo",
      active: true,
      stats: "₺12.4M Hacim"
    },
    {
      id: "reverse-auction",
      title: "Tersine İhale & Tedarik",
      subtitle: "B2B Satınalma Borsası",
      description: "İhtiyaçları (Örn: 100 Laptop) havuza atın, ağdaki satıcılar rekabetçi teklif versin. Piyasadan %10 ucuza alın, Periodya komisyon kazansın.",
      icon: RefreshCcw,
      color: "emerald",
      active: true,
      stats: "34 Aktif İhale"
    },
    {
      id: "auto-collector",
      title: "Otonom Tahsilat Robotu",
      subtitle: "WhatsApp Pay-by-Link",
      description: "Vadesi geçen alacakları AI botuyla zorlamadan hatırlatın. İçine gömülü kredi kartı linklerinden geçen işlemlerin sanal pos komisyonunu kazanın.",
      icon: Send,
      color: "amber",
      active: false,
      stats: "₺840K Kurtarılan"
    },
    {
      id: "acoustic-inventory",
      title: "Akustik Stok Düşümü",
      subtitle: "Acoustic Inventory Mgmt",
      description: "POS'a girmeden cihaz seslerini (kompresör, kahve değirmeni) algılayarak kullanılan hammaddeleri saniyesinde ERP'den otonom düşer.",
      icon: Mic,
      color: "rose",
      active: true,
      stats: "2.4M Algılama"
    },
    {
      id: "deep-routing",
      title: "Temerrüt Kalkanı",
      subtitle: "Deep Routing Engine",
      description: "Ağdaki iflas riskli firmaları sezip, paranızı direkt bir üst tedarikçiye göndererek riski sıfırlar. Çapraz ve güvenli ödeme rotası çizer.",
      icon: Network,
      color: "blue",
      active: true,
      stats: "₺44M Korunan"
    },
    {
      id: "intent-genesis",
      title: "Tersine Ticaret Ağı",
      subtitle: "Intent-Genesis Trade",
      description: "Hiçbir şey üretilmeden sadece tüketici talebini toplayıp doğrudan fabrika ve hammaddeye sipariş fırlatan yapay zeka konsorsiyumu.",
      icon: Workflow,
      color: "violet",
      active: false,
      stats: "Yeni Ekipman"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-[var(--pdy-bg-light)] dark:bg-[#0B1220] pb-12 text-slate-900 dark:text-white">
      {/* HEADER SECTION */}
      <div className="w-full bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30">
        <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Banknote className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-[900] tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Altın Ekosistem <Sparkles className="w-6 h-6 text-amber-500" />
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                Gömülü Finans (Embedded Finance) & B2B Tersine İhale Merkezi
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="h-11 px-5 rounded-xl font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
              Rapor Cıktısı
            </button>
            <button className="h-11 px-5 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-[0_4px_14px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] flex items-center gap-2 transform hover:-translate-y-0.5">
              <Zap className="w-4 h-4 fill-white" />
              Tümünü Etkinleştir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        
        {/* SOVEREIGN AUTO-PILOT NUCLEAR CARD */}
        <div className="mb-10 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 rounded-[28px] blur-md opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative bg-white dark:bg-[#0B1220] border-2 border-rose-500/30 dark:border-rose-500/50 rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="flex items-center gap-6 z-10 relative">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg shadow-rose-500/30 shrink-0">
                        <BrainCircuit className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-purple-600 dark:from-rose-400 dark:to-purple-400 mb-1">
                            Sovereign Auto-Pilot: Otonom CEO
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 font-semibold max-w-2xl text-[15px] leading-relaxed">
                            Açıldığında yazılım şirketinizi sizin yerinize fiziksel olarak yönetmeye başlar. Daha ucuz tedarikçi bulur pazarlık yapar, nakit düşüşü sezerse borçları faktoring ile kırdırır ve sabah size sadece kâr raporu WhatsApp mesajı atar.
                        </p>
                    </div>
                </div>

                <div className="z-10 shrink-0 flex flex-col items-center">
                    <button className="relative w-36 h-16 bg-slate-100 dark:bg-slate-800 rounded-full p-2 border-2 border-slate-200 dark:border-slate-700 transition-all cursor-pointer group/btn overflow-hidden shadow-inner flex items-center">
                        {/* Status Label */}
                        <span className="absolute right-6 text-sm font-bold text-slate-400 dark:text-slate-500 transition-opacity">KAPALI</span>
                        
                        {/* The Draggable Thumb */}
                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-md flex items-center justify-center relative translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/btn:scale-105 z-10">
                            <Power className="w-6 h-6 text-slate-400 dark:text-slate-400" />
                        </div>
                    </button>
                    <span className="text-[10px] font-bold text-rose-500 tracking-widest uppercase mt-3 animate-pulse opacity-80">UYARI: NÜKLEER ÇEKİRDEK</span>
                </div>
            </div>
        </div>

        {/* GRAND STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-500" />
                    Kart İhraç Geliri (Interchange)
                </div>
                <div className="text-4xl font-[900] font-mono tracking-tighter">₺342,850</div>
                <div className="text-sm text-emerald-500 font-bold mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Bu Ayki Temettü
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    İhale Aracılık Komisyonu
                </div>
                <div className="text-4xl font-[900] font-mono tracking-tighter">₺1.4M <span className="text-lg text-slate-400 font-sans font-normal ml-1">Hacim</span></div>
                <div className="text-sm text-slate-500 font-semibold mt-2">B2B Borsasından Doğan Değer</div>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-[24px] border border-slate-200/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
                <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    Pos & Vade Komisyonu
                </div>
                <div className="text-4xl font-[900] font-mono tracking-tighter">₺89,400</div>
                <div className="text-sm text-slate-500 font-semibold mt-2">Otonom Tahsilat (Sanal POS)</div>
            </div>
        </div>

        {/* ECOSYSTEM MODULES LIST */}
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-[900] tracking-tight">Sermaye Üretim Motorları</h2>
            <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Canlı Devrede</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {ECO_MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div key={i} className="group bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-[24px] p-6 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${mod.color}-100 dark:bg-${mod.color}-500/10 scale-100 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon strokeWidth={2.5} className={`w-7 h-7 text-${mod.color}-600 dark:text-${mod.color}-400`} />
                    </div>
                    {/* Switch Toggle */}
                    <button className={`w-12 h-6.5 rounded-full transition-colors relative ${mod.active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div className={`w-5.5 h-5.5 rounded-full bg-white absolute top-0.5 transition-transform ${mod.active ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                </div>
                <div className="mt-1 flex-1">
                    <h3 className="text-[17px] font-[900] tracking-tight text-slate-900 dark:text-white mb-1">{mod.title}</h3>
                    <div className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-4 bg-${mod.color}-50 dark:bg-${mod.color}-500/10 text-${mod.color}-600 dark:text-${mod.color}-400`}>
                        {mod.subtitle}
                    </div>
                    <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                        {mod.description}
                    </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Üretilen Değer</span>
                        <span className={`text-[15px] font-[900] font-mono tracking-tight text-${mod.color}-600 dark:text-${mod.color}-400`}>{mod.stats}</span>
                    </div>
                    <button className="h-10 w-10 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group-hover:border-amber-500 group-hover:text-amber-500">
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
