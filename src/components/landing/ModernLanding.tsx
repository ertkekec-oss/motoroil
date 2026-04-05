"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Check, ArrowRight, Play, BarChart2, Layers, 
    Shield, Smartphone, Star, Plus, X, Globe, Users, 
    ArrowUpRight, Building2, Zap, CircleDollarSign
} from 'lucide-react';

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);
    const [annual, setAnnual] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        { q: "Sisteme giriş ve kurulum ne kadar sürer?", a: "Standart paketlerde hesap açılışı anında gerçekleşir. Veri aktarımı ve ekibinizin eğitimi dahil tam entegrasyon süreci ortalama 48 saat sürmektedir." },
        { q: "Mevcut verilerimi (Excel, Logo vb.) aktarabilir miyim?", a: "Evet, Periodya'nın akıllı içe aktarım sihirbazı sayesinde tüm cari, stok ve geçmiş fatura kayıtlarınızı dakikalar içinde sisteme dahil edebilirsiniz." },
        { q: "Fiyatlarınıza KDV dahil mi?", a: "Web sitemizde ve tabloda belirtilen tüm fiyatlarımıza KDV hariçtir. Kurumsal faturalandırma yapılmaktadır." },
        { q: "İptal ve iade politikalarınız nasıl çalışır?", a: "Memnun kalmadığınız takdirde ilk 14 gün koşulsuz iptal ve iade hakkınız bulunmaktadır. Taahhütsüz aylık planlarda dilediğiniz ay çıkış yapabilirsiniz." }
    ];

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
            
            {/* AMBIENT BACKGROUND EFFECTS */}
            <div className="absolute top-0 left-0 right-0 h-screen overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[150px] mix-blend-screen"></div>
                <div className="absolute top-[10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen"></div>
                {/* Micro-grid overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
            </div>

            {/* NAVBAR */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-white/10 py-4 shadow-2xl' : 'bg-transparent border-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all">
                            P
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">Periodya</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 bg-white/5 border border-white/10 px-8 py-3 rounded-full backdrop-blur-md">
                        <Link href="#features" className="text-[13px] font-bold text-slate-300 hover:text-white transition-colors">Özellikler</Link>
                        <Link href="#solutions" className="text-[13px] font-bold text-slate-300 hover:text-white transition-colors">B2B Pazaryeri</Link>
                        <Link href="#pricing" className="text-[13px] font-bold text-slate-300 hover:text-white transition-colors">Planlar</Link>
                        <Link href="#faq" className="text-[13px] font-bold text-slate-300 hover:text-white transition-colors">S.S.S.</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block text-[13px] font-bold text-slate-300 hover:text-white transition-colors">Müşteri Girişi</Link>
                        <Link href="/register" className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-white text-black text-[13px] font-black transition-all hover:scale-105">
                            <span className="relative z-10">Demo Talep Et</span>
                            <div className="absolute inset-0 bg-blue-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 lg:px-8 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-slate-300 text-xs font-bold uppercase tracking-widest mb-10">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                        <span>SaaS ERP Dönüşümü Başladı</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-[90px] font-black tracking-tighter leading-[1.05] mb-8">
                        Şirketinizi <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Işık Hızına Çıkarın.
                        </span>
                    </h1>

                    <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
                        Muhasebe, e-Dönüşüm, depo takibi ve B2B onay süreçlerinizi aynı platformda birleştiren yeni nesil işletim sistemi. Karmaşaya son.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 group">
                            Başlamak İçin Tıklayın <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                        </Link>
                        <Link href="#demo" className="w-full sm:w-auto px-8 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-base font-bold rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md group">
                            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" /> Arayüzü İncele
                        </Link>
                    </div>
                </div>

                {/* 3D Dashboard Mockup */}
                <div className="max-w-[1200px] mx-auto mt-24 relative z-10" style={{ perspective: '2000px' }}>
                    <div 
                        className="w-full bg-[#0a0a0a] rounded-t-[32px] rounded-b-[16px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-1000 ease-out hover:rotate-0"
                        style={{ transform: 'rotateX(8deg) translateY(20px)', transformStyle: 'preserve-3d' }}
                    >
                        {/* Windows Bar */}
                        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                            <div className="ml-auto w-48 h-5 bg-white/5 rounded-md"></div>
                            <div className="ml-auto w-3 h-3"></div>
                        </div>

                        {/* Layout */}
                        <div className="flex h-[400px] md:h-[600px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz48L3N2Zz4=')]">
                            {/* Sidebar */}
                            <div className="w-64 border-r border-white/5 bg-black/40 p-6 hidden md:flex flex-col gap-4">
                                <div className="h-5 w-24 bg-white/10 rounded mb-4"></div>
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="h-10 w-full bg-white/5 rounded-lg border border-white/5"></div>
                                ))}
                            </div>
                            {/* Content */}
                            <div className="flex-1 p-8 flex flex-col gap-6 backdrop-blur-3xl">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="h-6 w-48 bg-white/10 rounded"></div>
                                    <div className="h-10 w-10 bg-blue-600/30 rounded-full border border-blue-500/50"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[1,2,3].map((i) => (
                                        <div key={i} className="h-32 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                                            <div className="w-10 h-10 bg-white/10 rounded-xl mb-4"></div>
                                            <div className="h-4 w-1/2 bg-white/20 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                                    <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                                    {[1,2,3].map(i => <div key={i} className="h-14 w-full bg-black/40 rounded-xl border border-white/5"></div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LOGOS */}
            <section className="py-10 border-t border-white/10 bg-white/5 relative z-10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 hidden sm:flex justify-between items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700 text-xl md:text-2xl font-black">
                    <span>E-DEFTER</span>
                    <span>TRENDYOL</span>
                    <span>HEPSİBURADA</span>
                    <span>E-FATURA</span>
                    <span>PAYTR</span>
                </div>
                {/* Mobile version */}
                <div className="sm:hidden flex flex-wrap justify-center gap-6 opacity-40 font-black text-lg">
                    <span>E-DEFTER</span>
                    <span>TRENDYOL</span>
                    <span>PAYTR</span>
                </div>
            </section>

            {/* BENTO GRID FEATURES (Exsit Style) */}
            <section id="features" className="py-32 px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20 md:flex items-end justify-between">
                        <div className="max-w-2xl">
                            <span className="text-blue-500 font-bold tracking-widest text-sm uppercase mb-4 block">Modüler Mimari</span>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">Zamanınızı geri alın. <br/><span className="text-slate-500">Gerisini yazılım yapsın.</span></h2>
                        </div>
                        <div className="mt-8 md:mt-0">
                            <Link href="/register" className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-bold transition-all border border-white/10">  
                                Tüm Özellikleri Gör <ArrowRight className="w-4 h-4"/>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        
                        {/* Large Bento Card */}
                        <div className="md:col-span-2 row-span-2 bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[32px] p-10 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/noise-lines.png')] opacity-10 mix-blend-overlay"></div>
                           <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] group-hover:bg-blue-500/40 transition-colors duration-700"></div>
                           
                           <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                                    <BarChart2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white mb-4">Açık Bankacılık & Ön Muhasebe</h3>
                                    <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                                        Gelir panoları, otomatik e-fatura kesimi ve banka hesap hareketleriniz tek vizörde. İşletmenizin nakit akış röntgenini anında çekin.
                                    </p>
                                </div>
                           </div>
                        </div>

                        {/* Small Bento 1 */}
                        <div className="bg-[#0b0f19] border border-white/10 rounded-[32px] p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
                            <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Çoklu Depo</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Farklı şubelerdeki stok hareketlerinizi barkod okutarak anında merkezden takip edin.</p>
                        </div>

                        {/* Small Bento 2 */}
                        <div className="bg-[#0b0f19] border border-white/10 rounded-[32px] p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
                            <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">B2B Platformu</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Bayilerinizi sisteme tanımlayarak kendi e-ticaret sitenizi aracı olmadan yönetin.</p>
                        </div>

                        {/* Medium Horizontal Bento */}
                        <div className="md:col-span-3 bg-gradient-to-r from-blue-900/40 to-indigo-900/20 border border-blue-500/20 rounded-[32px] p-10 flex flex-col md:flex-row items-center justify-between gap-10 group">
                            <div className="max-w-xl">
                                <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">Sıfır Kağıt: Dijital İmza ve Zimmet</h3>
                                <p className="text-slate-300">BA/BS formları, cari mutabakatlar ve personel zimmet tutanaklarını MFA / SMS onay kodu ile saniyeler içinde taraflara yasal imzalatın.</p>
                            </div>
                            <div className="hidden md:flex flex-1 items-center justify-end">
                                <div className="px-8 py-4 bg-black/50 border border-white/10 rounded-2xl flex items-center gap-4 backdrop-blur-md">
                                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center"><Check className="w-6 h-6" /></div>
                                    <div>
                                        <p className="text-white font-bold text-lg">Ömer T. imzaladı</p>
                                        <p className="text-slate-400 text-xs">Bugün 14:45 - OTP Doğrulandı</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* PRICING PLANS */}
            <section id="pricing" className="py-32 px-6 lg:px-8 relative bg-black/40 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Ölçeklenebilir Yatırım</h2>
                        <p className="text-lg text-slate-400">Gizli maliyet veya sürpriz yok. İş modelinize uyan planı seçin.</p>
                        
                        <div className="inline-flex bg-white/5 p-1.5 rounded-xl border border-white/10 mt-10 backdrop-blur-md">
                            <button onClick={() => setAnnual(false)} className={`px-8 py-3 rounded-lg font-bold text-sm transition-all ${!annual ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Aylık Plan</button>
                            <button onClick={() => setAnnual(true)} className={`px-8 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${annual ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                                Yıllık <span className="bg-lime-400 text-black px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">-%20 İndirim</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-center">
                        {/* Starter */}
                        <div className="bg-[#0b0f19] border border-white/10 rounded-[32px] p-10 relative">
                            <h3 className="text-2xl font-bold text-white mb-2">Başlangıç</h3>
                            <p className="text-slate-500 text-sm mb-8 h-10">Temel finans ve e-fatura ihtiyaçları için idealdir.</p>
                            <div className="mb-8">
                                <span className="text-5xl font-black text-white">{annual ? '₺990' : '₺1,290'}</span>
                                <span className="text-slate-500">/ay</span>
                            </div>
                            <ul className="space-y-4 mb-10 min-h-[220px]">
                                {['Ön Muhasebe & Kasa', 'E-Fatura & E-Arşiv', '1 Depo & Temel Stok', 'Temel Raporlamalar'].map((f,i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                                        <Check className="w-5 h-5 text-blue-500 shrink-0"/> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 rounded-xl font-bold border border-white/20 text-white hover:bg-white/5 transition-colors">Başla</button>
                        </div>

                        {/* Professional - Highlighted */}
                        <div className="bg-gradient-to-b from-blue-900/40 to-[#0b0f19] border border-blue-500/30 rounded-[32px] p-10 relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(37,99,235,0.15)] ring-1 ring-white/5">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-[32px]"></div>
                            <div className="absolute top-0 right-8 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-lg">Popüler</div>
                            
                            <h3 className="text-2xl font-bold text-white mb-2 mt-2">Profesyonel</h3>
                            <p className="text-blue-300 text-sm mb-8 h-10">KOBİ'lerin dijitalleşmesi ve B2B Ağı için uygundur.</p>
                            <div className="mb-8">
                                <span className="text-5xl font-black text-white">{annual ? '₺3,490' : '₺4,290'}</span>
                                <span className="text-blue-300">/ay</span>
                            </div>
                            <ul className="space-y-4 mb-10 min-h-[220px]">
                                {['Tüm Başlangıç Özellikleri', 'B2B Kapalı Sipariş Ağı', 'Gelişmiş Çoklu Depo', 'PDKS & İnsan Kaynakları', 'CRM & Saha Satış Mobil'].map((f,i) => (
                                    <li key={i} className="flex items-center gap-3 text-white font-medium">
                                        <Check className="w-5 h-5 text-blue-400 shrink-0"/> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xl shadow-blue-600/30">Hemen Test Et</button>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-[#0b0f19] border border-white/10 rounded-[32px] p-10 relative">
                            <h3 className="text-2xl font-bold text-white mb-2">Kurumsal</h3>
                            <p className="text-slate-500 text-sm mb-8 h-10">Özel veri sunucusu ve donanım entegrasyonu arayanlar.</p>
                            <div className="mb-8 flex items-end">
                                <span className="text-5xl font-black text-white flex items-center gap-2">Özel <Zap className="w-6 h-6 text-amber-500"/></span>
                            </div>
                            <ul className="space-y-4 mb-10 min-h-[220px]">
                                {['Dedicated VDS Sunucu', 'Mevcut Veritabanı Aktarımı', 'Sınırsız Kullanıcı Lisansı', '7/24 SLA Telefon Desteği'].map((f,i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                                        <Check className="w-5 h-5 text-slate-500 shrink-0"/> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 rounded-xl font-bold border border-white/20 text-white hover:bg-white/5 transition-colors">Bize Ulaşın</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-6xl mx-auto rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-900 border border-white/10 p-12 lg:p-20 text-center relative overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.3)]">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
                    
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8 relative z-10">İşletmenizi modernleştirme vakti.</h2>
                    <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto mb-12 relative z-10">
                        Kredi kartı gerektirmeden 14 gün boyunca tüm "Enterprise" modülleri ücretsiz deneyimleyin. 
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                         <Link href="/register" className="px-10 py-5 bg-white text-blue-900 text-lg font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl">
                            Ücretsiz Denemeyi Başlat <ArrowUpRight className="w-6 h-6" />
                         </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/10 pt-20 pb-10 px-6 bg-[#020202]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    <div className="col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-sm">P</div>
                            <span className="text-xl font-black text-white">Periodya ERP</span>
                        </div>
                        <p className="text-slate-400 font-medium max-w-sm mb-6 leading-relaxed">Yeni nesil finans, lojistik ve operasyonel iş istasyonu. Sınırları kaldırın.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Çözümler</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-500">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">E-Fatura & Maliyet</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">İnsan Kaynakları</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">B2B Platformu</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Kaynaklar</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-500">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Yardım Merkezi</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Geliştirici API</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Kurumsal</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-500">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Hakkımızda</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">İletişim</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">KVKK & Gizlilik</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-slate-600 gap-4">
                    <p>© {new Date().getFullYear()} Periodya Yazılım A.Ş. Tüm hakları saklıdır.</p>
                    <p>Built for Enterprise Scale.</p>
                </div>
            </footer>
        </div>
    );
}
