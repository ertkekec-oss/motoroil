"use client";

import React, { useState } from 'react';
import { 
  Activity, 
  Store, 
  Mic, 
  Zap, 
  Users, 
  Video, 
  MessageSquare,
  ArrowRight,
  Settings,
  Sparkles,
  Link as LinkIcon,
  ShoppingBag,
  BellRing,
  Network,
  RefreshCcw
} from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function SoSalesDashboard() {
  const [activeTab, setActiveTab] = useState<'hub' | 'config'>('hub');
  const { showSuccess, showConfirm } = useModal();

  const [activeVoiceEnabled, setActiveVoiceEnabled] = useState(true);
  const [activeNightAgent, setActiveNightAgent] = useState(false);

  const SOSALES_MODULES = [
    {
      id: "clearing-house",
      title: "Çapraz Takas Ağı",
      subtitle: "B2B Mahsuplaşma Odası",
      description: "Tedarikçiler, kargo şirketleri ve üreticiler arasındaki borçları yakalar. Kasadan hiç nakit çıkartmadan takas makbuzuyla tüm borçları sıfırlar.",
      icon: RefreshCcw,
      color: "emerald",
      active: true,
      onToggle: () => {}
    },
    {
      id: "universal-restock",
      title: "Otonom Evrensel Tedarik",
      subtitle: "Predictive AI Restocking",
      description: "Restoranların domatesi, tamircinin yedek parçası bitmeden önce yapay zeka ile otomatik öngörü yapıp WhatsApp'tan sipariş onayı çeker.",
      icon: Network,
      color: "blue",
      active: true,
      onToggle: () => {}
    },
    {
      id: "zero-ui",
      title: "Zero-UI Chat Agent",
      subtitle: "WhatsApp / IG DM Müşteri Asistanı",
      description: "Müşterilerin 'aynısından yolla' mesajlarını okuyup arka planda sepet ve kargo fişi oluşturan AI asistan.",
      icon: MessageSquare,
      color: "indigo",
      active: activeVoiceEnabled,
      onToggle: () => setActiveVoiceEnabled(!activeVoiceEnabled)
    },
    {
      id: "night-agent",
      title: "Gece Vardiyası Satıcısı",
      subtitle: "B2B AI Pazarlık Motoru",
      description: "Mesai dışı gelen sipariş taleplerinde anlık kâr marjını hesaplayarak müşteriyle 7/24 otonom fiyat pazarlığı yapar.",
      icon: Sparkles,
      color: "indigo",
      active: activeNightAgent,
      onToggle: () => setActiveNightAgent(!activeNightAgent)
    },
    {
      id: "voice-to-order",
      title: "Sesten Siparişe",
      subtitle: "Voice-To-ERP",
      description: "Gelen WhatsApp sesli mesajlarını anında çözümler, stok kodlarıyla eşleştirir ve hazır ödeme linki fırlatır.",
      icon: Mic,
      color: "emerald",
      active: true,
      onToggle: () => {}
    },
    {
      id: "live-commerce",
      title: "Canlı Yayın Satış (Live Commerce)",
      subtitle: "Live Stream ERP Sync",
      description: "Instagram, TikTok veya YouTube canlı yayınlarında vitrine çıkarılan ürünlerin canlı stoklarını saniyesinde düşer.",
      icon: Video,
      color: "rose",
      active: false,
      onToggle: () => {}
    },
    {
      id: "flash-trade",
      title: "Flash Trade / FOMO",
      subtitle: "Zaman Ayarlı Linkler",
      description: "Saat başı fiyatı düşen veya ilk alana ucuza giden zaman ayarlı fırsat stoklarını sosyal medyaya dağıtır.",
      icon: Zap,
      color: "amber",
      active: true,
      onToggle: () => {}
    },
    {
      id: "split-payment",
      title: "Ortak Havuz B2B",
      subtitle: "Sosyal Sepet Düzenleyici",
      description: "Büyük çaplı sepetleri bir WhatsApp grubundaki birden fazla kişinin ortak kredi kartı girişiyle tamamlamasını sağlar.",
      icon: Users,
      color: "teal",
      active: false,
      onToggle: () => {}
    },
    {
      id: "micro-affiliate",
      title: "Sanal Usta Ağı",
      subtitle: "Influencer Zero-Touch Bayilik",
      description: "Fenomenlerin komisyon karşılığı fiziksel depo görmeden sizin ERP üzerinden satış yapmasını sağlayan akıllı cüzdan bölücü.",
      icon: Store,
      color: "violet",
      active: true,
      onToggle: () => {}
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-slate-50 dark:bg-slate-900 pb-12 text-slate-900 dark:text-white">
      {/* HEADER SECTION */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                SoSales <span className="text-indigo-500">Hub</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Sosyal Ticaret & Otonom Satış Modülleri Yönetim Merkezi
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="h-10 px-4 rounded-xl font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm">
              Raporlar
            </button>
            <button className="h-10 px-4 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Ayarları
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    Toplam Sosyal Ciro 
                    <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight">₺142,500<span className="text-sm text-emerald-500 ml-2">↑ 24%</span></div>
                <div className="text-xs text-slate-500 mt-1">Bu Ay WhatsApp / IG DM Üzerinden</div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    Otonom Kapanan Satış 
                    <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight">128 <span className="text-sm text-slate-400 font-sans font-normal ml-1">Sipariş</span></div>
                <div className="text-xs text-slate-500 mt-1">Sıfır İnsan Müdahalesi (Zero-UI)</div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    Gece Pazarlığı Ciro 
                    <Mic className="w-4 h-4" />
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight">₺18,400</div>
                <div className="text-xs text-slate-500 mt-1">Gece 00:00 - 08:00 Arası</div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    Mikro-Bayiler
                    <Users className="w-4 h-4" />
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight">14 <span className="text-sm text-slate-400 font-sans font-normal ml-1">Aktif</span></div>
                <div className="text-xs text-slate-500 mt-1">Sanal Ortak Ağında Satış Yapanlar</div>
            </div>
        </div>

        {/* MAIN MODULES GRID */}
        <div className="mb-4 text-lg font-bold">Modül Yönetimi</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOSALES_MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 flex flex-col shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${mod.color}-100 dark:bg-${mod.color}-500/10`}>
                        <Icon strokeWidth={2} className={`w-6 h-6 text-${mod.color}-600 dark:text-${mod.color}-400`} />
                    </div>
                    {/* Switch Toggle */}
                    <button 
                        onClick={mod.onToggle}
                        className={`w-11 h-6 rounded-full transition-colors relative ${mod.active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${mod.active ? 'left-5' : 'left-0.5'}`} />
                    </button>
                </div>
                <div className="mt-1 flex-1">
                    <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white mb-0.5">{mod.title}</h3>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">{mod.subtitle}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {mod.description}
                    </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center group-hover:border-slate-200 dark:group-hover:border-slate-600/50 transition-colors">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Settings size={14}/> Konfigürasyon</span>
                    <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <ArrowRight size={14} className="text-slate-500" />
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
