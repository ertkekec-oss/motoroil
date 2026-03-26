import React from 'react';
import { ChevronLeft, ChevronRight, Box, Activity, TrendingUp, Cpu, Wrench, Shield, Truck, Settings } from 'lucide-react';

export default function CategoryCarousel() {
    const cats = [
        { icon: <Box className="w-5 h-5 text-blue-500" />, title: "Sıvı & Kimyasallar", count: "12 Yeni İşlem", subs: ["Motor Yağları", "Antifriz", "Fren Hidroliği", "Cam Suyu"] },
        { icon: <Wrench className="w-5 h-5 text-indigo-500" />, title: "Filtre & Aksam", count: "5 Kritik Talep", subs: ["Yağ Filtresi", "Hava Filtresi", "Kabin Filtresi"] },
        { icon: <Activity className="w-5 h-5 text-emerald-500" />, title: "Fren Sistemi", count: "8 Stokta", subs: ["Fren Balatası", "Fren Diski", "Fren Hortumu"] },
        { icon: <Cpu className="w-5 h-5 text-rose-500" />, title: "Oto Elektronik", count: "Sipariş Yok", subs: ["Aküler", "Buji & Ateşleme", "Sensörler"] },
        { icon: <Settings className="w-5 h-5 text-slate-500" />, title: "Motor Parçaları", count: "24 Alt Kategori", subs: ["Piston", "Krank Mili", "Supap", "Eksantrik"] },
        
        { icon: <Truck className="w-5 h-5 text-orange-500" />, title: "Ağır Vasıta Ekipmanları", count: "11 Yeni İşlem", subs: ["Çekici Parçaları", "Dorse Aksesuar", "Havalı Fren"] },
        { icon: <Shield className="w-5 h-5 text-cyan-500" />, title: "Şasi & Karoseri", count: "9 Alt Kategori", subs: ["Tampon", "Çamurluk", "Izgara"] },
        { icon: <TrendingUp className="w-5 h-5 text-purple-500" />, title: "Performans Ürünleri", count: "4 Alt Kategori", subs: ["Spor Filtreler", "Performans Buji", "Tuning"] },
        { icon: <Box className="w-5 h-5 text-amber-500" />, title: "Lastik & Jant", count: "18 Stokta", subs: ["Yaz Lastiği", "Kış Lastiği", "Dört Mevsim", "Çelik Jant"] },
        { icon: <Activity className="w-5 h-5 text-teal-500" />, title: "Bakım & Temizlik", count: "Sipariş Yok", subs: ["Cila & Şampuan", "Döşeme Temizleyici", "Seramik Kaplama"] },
    ];

    return (
        <div className="w-full mb-16 mt-6 flex flex-col items-center select-none relative z-20">
            <h2 className="text-2xl font-black text-[#0f172a] tracking-tight mb-2">Ağ Kategorileri</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">Tedarikçi ağında tüm endüstriyel çözüm kategorilerini keşfedin.</p>
            
            <div className="w-full flex items-center justify-center gap-4">
                <button className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-slate-400 hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors shadow-sm shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 overflow-visible w-full max-w-[1300px]">
                    {cats.map((c, i) => (
                        <div key={i} className="relative group/card h-[4.5rem]">
                            {/* Ana Kart */}
                            <div className="bg-white border border-slate-200/80 rounded-[12px] p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:border-blue-500 hover:shadow-[0_8px_20px_-6px_rgba(59,130,246,0.15)] transition-all cursor-pointer h-full z-10 relative">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#f8fafc] flex items-center justify-center shrink-0">
                                    {c.icon}
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <h4 className="text-[12px] md:text-[13px] font-bold text-[#0f172a] leading-tight line-clamp-1">{c.title}</h4>
                                    <span className="text-[10px] md:text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1">{c.count}</span>
                                </div>
                            </div>
                            
                            {/* Hover İçin Alt Menü Görünmez Köprüsü (Fare kaçmasın diye) */}
                            <div className="absolute top-0 left-0 w-full h-[150%] z-[8] pointer-events-none group-hover/card:pointer-events-auto"></div>

                            {/* Hover Dropdown (Alt Menü) */}
                            <div className="absolute top-full left-0 mt-3 w-full min-w-[220px] bg-white border border-slate-200/80 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] rounded-xl py-2 opacity-0 pointer-events-none translate-y-2 group-hover/card:opacity-100 group-hover/card:pointer-events-auto group-hover/card:translate-y-0 transition-all duration-300 z-50 flex flex-col">
                                <div className="absolute -top-[6px] left-6 w-3 h-3 bg-white border-t border-l border-slate-200/80 rotate-45"></div>
                                {c.subs.map((s, idx) => (
                                    <div key={idx} className="relative z-10 mx-2 px-3 py-2.5 hover:bg-[#f1f5f9] rounded-lg text-[13px] font-semibold text-[#334155] hover:text-blue-600 transition-colors cursor-pointer text-left flex items-center justify-between group/item">
                                        <span>{s}</span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all text-blue-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-slate-400 hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-colors shadow-sm shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            
            {/* Pagination Noktaları */}
            <div className="flex gap-2.5 mt-10">
                <div className="w-2 h-2 rounded-full bg-[#e2e8f0] cursor-pointer hover:bg-slate-400 transition-colors"></div>
                <div className="w-2 h-2 rounded-full bg-[#e2e8f0] cursor-pointer hover:bg-slate-400 transition-colors"></div>
                <div className="w-[20px] h-2 rounded-full bg-blue-500 cursor-pointer transition-colors shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <div className="w-2 h-2 rounded-full bg-[#e2e8f0] cursor-pointer hover:bg-slate-400 transition-colors"></div>
            </div>
        </div>
    );
}
