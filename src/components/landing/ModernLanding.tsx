"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    ArrowRight, 
    CheckCircle2, 
    BarChart3, 
    ShieldCheck, 
    Users, 
    TrendingUp, 
    Globe,
    Store,
    LayoutDashboard,
    Lock,
    Play,
    Star,
    ChevronDown,
    Menu,
    X,
    MessageSquare,
    Zap
} from 'lucide-react';

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);
    const [annualBilling, setAnnualBilling] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const faqs = [
        {
            q: "Sisteme nasıl geçiş yapabiliriz? Veri kaybı yaşar mıyım?",
            a: "Periodya'ya geçiş süreci tamamen uzman ekibimiz tarafından yönetilir. Mevcut sisteminizdeki Excel, Logo veya Mikro verileriniz sıfır veri kaybı garantisiyle (KVKK uyumlu) içeri aktarılır."
        },
        {
            q: "E-Fatura ve E-Defter hizmeti için ek ücret var mı?",
            a: "Seçtiğiniz plana göre değişmekle birlikte, Pro ve Enterprise planlarımızda e-dönüşüm modülü fiyata dahildir. Sadece kontör kullanımınıza göre çok ufak maliyetler yansır."
        },
        {
            q: "Saha personellerimiz için mobil uygulama mevcut mu?",
            a: "Evet. %100 Native çalışan iOS ve Android mobil uygulamalarımız ile saha plasiyerleriniz sipariş girebilir, depo sayımı yapabilir ve tahsilat alabilirler."
        },
        {
            q: "Sunucu ve yedekleme kim tarafından sağlanıyor?",
            a: "Tüm barındırma (Cloud) ve 24 saatte bir yapılan felaket yedeklemeleri Periodya sorumluluğundadır. Sunucu maliyetiniz sıfırdır."
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-blue-600 selection:text-white pb-10">
            {/* Dotted Background - Fixed */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.8 }}></div>
            
            {/* Ambient Lights */}
            <div className="fixed top-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed top-[20%] right-[-10%] w-[40vh] h-[40vh] rounded-full bg-lime-300/10 blur-[120px] pointer-events-none z-0"></div>

            {/* MAIN 80% WRAPPER */}
            <div className="w-[90%] lg:w-[80%] max-w-[1600px] mx-auto bg-white/60 backdrop-blur-3xl shadow-[0_30px_60px_rgb(0,0,0,0.05)] border border-white rounded-[40px] mt-8 overflow-hidden relative z-10 flex flex-col items-center">

                {/* HEADER */}
                <header className={`sticky top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/95 backdrop-blur-md border-slate-200/80 shadow-sm py-4' : 'bg-transparent border-transparent py-6'}`}>
                    <div className="w-[90%] mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                                P
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900">Periodya</span>
                        </div>

                        <nav className="hidden lg:flex items-center gap-10 bg-slate-100/50 px-8 py-3 rounded-full border border-slate-200/50 backdrop-blur-sm">
                            <Link href="#features" className="text-[14px] font-bold text-slate-600 hover:text-blue-600 transition-colors">Özellikler</Link>
                            <Link href="#solutions" className="text-[14px] font-bold text-slate-600 hover:text-blue-600 transition-colors">Çözümler</Link>
                            <Link href="#pricing" className="text-[14px] font-bold text-slate-600 hover:text-blue-600 transition-colors">Planlar & Fiyat</Link>
                            <Link href="#faq" className="text-[14px] font-bold text-slate-600 hover:text-blue-600 transition-colors">S.S.S.</Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            <Link href="/login" className="hidden sm:block text-[14px] font-black text-slate-700 hover:text-blue-600 px-2 transition-colors">Giriş Yap</Link>
                            <Link href="/register" className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-black text-white text-[14px] font-bold rounded-xl transition-all shadow-xl hover:-translate-y-0.5">
                                Demo Talebi
                            </Link>
                        </div>
                    </div>
                </header>

                {/* 1. HERO SECTION */}
                <section className="w-full pt-20 pb-24 lg:pt-32 lg:pb-32 px-6 lg:px-12 text-center relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 shadow-sm text-slate-700 text-xs font-bold uppercase tracking-widest mb-10 hover:-translate-y-1 transition-transform cursor-default">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
                        </span>
                        Periodya B2B ERP 2.0 YAYINDA!
                    </div>
                    
                    <h1 className="text-5xl lg:text-[85px] font-extrabold text-slate-900 tracking-tighter leading-[1.05] mb-8 max-w-5xl mx-auto">
                        Tüm Şirket Verileriniz <br className="hidden xl:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Tek Bir Merkezde.
                        </span>
                    </h1>
                    
                    <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
                        Birden çok yazılım kullanmaya son. Ön muhasebe, detaylı stok yönetimi, e-posta onaylı sözleşmeler, B2B e-ticaret ağları ve uçtan uca insan kaynakları yönetimi. Hepsi burada.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link href="/register" className="w-full sm:w-auto px-10 h-[60px] bg-blue-600 hover:bg-blue-700 text-white text-base font-extrabold rounded-2xl transition-all shadow-[0_8px_30px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 hover:-translate-y-1">
                            14 Gün Ücretsiz Dene <ArrowRight className="w-5 h-5"/>
                        </Link>
                        <Link href="#demo" className="w-full sm:w-auto px-10 h-[60px] bg-white hover:bg-slate-50 text-slate-800 text-base font-extrabold rounded-2xl transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                            <Play className="w-4 h-4" /> Videoyu İzle
                        </Link>
                    </div>

                    {/* Dashboard Floating Interface Mockup */}
                    <div className="w-[90%] mx-auto relative rounded-[32px] bg-white border-[10px] border-slate-50/50 p-2 shadow-[0_20px_50px_rgb(0,0,0,0.05)] ring-1 ring-slate-900/5">
                        <div className="absolute -top-10 -left-10 bg-white p-5 rounded-[24px] shadow-2xl border border-slate-100 z-20 animate-bounce" style={{animationDuration: '4s'}}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-lime-100 rounded-[14px] flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-lime-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nakit Akışı</p>
                                    <p className="text-xl font-black text-slate-900">+ ₺145,000</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-20 -right-10 bg-white p-5 rounded-[24px] shadow-2xl border border-slate-100 z-20 animate-bounce" style={{animationDuration: '5s', animationDelay: '1s'}}>
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-[14px] flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[12px] font-bold text-slate-900 leading-tight">Sipariş Onaylandı<br/><span className="text-slate-500 font-medium">B2B Pazaryeri</span></p>
                                </div>
                             </div>
                        </div>
                        
                        {/* Fake Dashboard Inner Container */}
                        <div className="w-full bg-[#f8fafc] rounded-[24px] border border-slate-200 overflow-hidden flex h-[400px] lg:h-[600px]">
                            {/* Sidebar Area */}
                            <div className="w-64 border-r border-slate-200 bg-white p-6 hidden lg:flex flex-col gap-6">
                                <div className="h-4 w-24 bg-slate-200 rounded-lg mb-8"></div>
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="flex items-center gap-4 w-full">
                                        <div className="h-5 w-5 bg-slate-100 rounded-md"></div>
                                        <div className="h-3 w-full bg-slate-50 rounded-md"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Main Content Area */}
                            <div className="flex-1 p-8 flex flex-col gap-8 bg-[#FAFAFA]">
                                <div className="flex justify-between items-center bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
                                    <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
                                    <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1,2,3].map(i => (
                                      <div key={i} className={`bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm ${i === 3 ? 'hidden lg:block' : ''}`}>
                                        <div className="h-10 w-10 bg-blue-50 rounded-[14px] mb-4"></div>
                                        <div className="h-4 w-24 bg-slate-100 rounded-md mb-3"></div>
                                        <div className="h-8 w-32 bg-slate-800 rounded-lg"></div>
                                      </div>
                                    ))}
                                </div>
                                <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8">
                                    <div className="h-4 w-64 bg-slate-200 rounded-md mb-8"></div>
                                    <div className="space-y-4">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="h-16 w-full bg-slate-50 rounded-[16px] border border-slate-100"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. LOGOS */}
                <section className="w-full py-12 border-y border-slate-100 bg-white">
                    <div className="w-[90%] mx-auto text-center">
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-8">Güvendiğimiz ve Entegre Çalıştığımız Ağlar</p>
                        <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            {['E-Defter', 'E-Fatura', 'Trendyol', 'Hepsiburada', 'N11', 'PayTR'].map(brand => (
                                <div key={brand} className="text-2xl font-black text-slate-800 tracking-tighter">{brand}</div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. BENTO GRID FEATURES */}
                <section id="features" className="w-full py-24 lg:py-32 bg-slate-50">
                    <div className="w-[90%] mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">İhtiyacınız olan her şey hazır.</h2>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed">Farklı departmanlar için farklı yazılımlar almaya son. Tek veritabanı, kusursuz entegrasyon.</p>
                        </div>

                        {/* Bento Auto-Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 auto-rows-[minmax(320px,auto)]">
                            
                            {/* Card 1 (Span 4) */}
                            <div className="lg:col-span-4 bg-white rounded-[32px] p-10 lg:p-12 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                               <div className="w-16 h-16 bg-blue-600 text-white rounded-[20px] flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Merkezi Finans ve Açık Bankacılık</h3>
                                <p className="text-slate-500 text-lg leading-relaxed max-w-lg">
                                    Tüm banka hesaplarınızdaki hareketleri tek ekranda görün, saniyeler içinde mutabakat sağlayın. E-fatura ve irsaliyeler otomatik eşleşsin.
                                </p>
                                {/* Aesthetic Decor */}
                                <div className="absolute right-[-10%] bottom-[-10%] w-[300px] h-[300px] bg-blue-50/50 rounded-full border-[20px] border-blue-100/30 group-hover:scale-110 transition-transform duration-700"></div>
                            </div>

                            {/* Card 2 (Span 2) */}
                            <div className="lg:col-span-2 bg-[#0f172a] rounded-[32px] p-10 lg:p-12 border border-slate-800 shadow-2xl transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-lime-400/10 to-transparent"></div>
                                <div className="w-16 h-16 bg-white/10 text-white rounded-[20px] backdrop-blur-md flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform relative z-10">
                                    <Globe className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight relative z-10">B2B İş Ağı Merkezi</h3>
                                <p className="text-slate-400 text-base leading-relaxed relative z-10">
                                    Toptancı ve perakendeci ağınızı içeri davet edin. Kendi özel platformunuzda kapalı devre alışveriş başlasın.
                                </p>
                            </div>

                            {/* Card 3 (Span 2) */}
                            <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 group">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <Store className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Akıllı Stok ve Depo</h3>
                                <p className="text-slate-500 text-base leading-relaxed">
                                    Barkod ve el terminalleri ile entegre stok sayımı, şubeler arası otomatik transferler.
                                </p>
                            </div>

                            {/* Card 4 (Span 2) */}
                            <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 group">
                                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Dijital İmza Arşivi</h3>
                                <p className="text-slate-500 text-base leading-relaxed">
                                    Personel zimmet tutanakları, ıslak imza gerektirmeden MFA (SMS/OTP) yöntemiyle dijital olarak onaylansın.
                                </p>
                            </div>

                            {/* Card 5 (Span 2) */}
                            <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 group">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">PDKS (İK)</h3>
                                <p className="text-slate-500 text-base leading-relaxed">
                                    Mobil karekod tabanlı personel giriş çıkış saatleri. Bordro, puantaj ve harcırah yönetimi.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* 4. TESTIMONIALS (Müşteri Yorumları) */}
                <section className="w-full py-24 bg-white border-b border-slate-100 overflow-hidden">
                    <div className="w-[90%] mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Müşterilerimiz Neler Diyor?</h2>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-6">
                            {[1, 2, 3].map((item, idx) => (
                                <div key={idx} className="flex-1 bg-slate-50 rounded-[32px] p-10 border border-slate-200/60 hover:-translate-y-2 transition-transform duration-300">
                                    <div className="flex gap-1 mb-6">
                                        {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
                                    </div>
                                    <p className="text-lg text-slate-700 font-medium mb-8 leading-relaxed">
                                        "Periodya'ya geçtikten sonra sipariş hatalarımız %90 azaldı. B2B pazaryeri modülü sayesinde bayilerimiz doğrudan sisteme sipariş geçiyor ve faturası anında kesiliyor."
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Ahmet Yılmaz</h4>
                                            <p className="text-sm text-slate-500">Operasyon Müdürü, XYZ Pazarlama</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5. PRICING PLANS (Planlar Kutusu) */}
                <section id="pricing" className="w-full py-24 lg:py-32 bg-slate-50">
                    <div className="w-[90%] mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">Şeffaf ve Esnek Fiyatlandırma</h2>
                            <p className="text-xl text-slate-500 font-medium mb-10">Şirketinizin büyüklüğüne göre ölçeklenebilen planlar.</p>
                            
                            {/* Toggle */}
                            <div className="inline-flex items-center bg-white p-1.5 rounded-full border border-slate-300 font-bold text-sm shadow-sm">
                                <button onClick={() => setAnnualBilling(false)} className={`px-6 py-2.5 rounded-full transition-all ${!annualBilling ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Aylık Plan</button>
                                <button onClick={() => setAnnualBilling(true)} className={`px-6 py-2.5 rounded-full transition-all flex items-center gap-2 ${annualBilling ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                                    Yıllık Plan <span className="px-2 py-0.5 bg-lime-400 text-lime-900 text-[10px] rounded-full uppercase tracking-widest hidden sm:block">2 Ay Bizden</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                            {/* Starter */}
                            <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm relative">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Başlangıç (Starter)</h3>
                                <p className="text-slate-500 text-sm mb-6 h-10">Küçük ölçekli işletmeler için temel finans ve kasa takibi.</p>
                                <div className="mb-8">
                                    <span className="text-4xl font-black text-slate-900">{annualBilling ? '₺1.490' : '₺1.890'}</span>
                                    <span className="text-slate-500 font-medium"> /aylık</span>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {['Ön Muhasebe & Kasa', 'E-Fatura Kesimi', 'Sınırlı Stok Takibi', 'Temel Raporlar', '1 Kullanıcı'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-colors">Seç ve Başla</button>
                            </div>

                            {/* Pro (Highlighted) */}
                            <div className="bg-[#0f172a] rounded-[32px] p-10 border border-blue-500/30 shadow-2xl relative transform md:-translate-y-4">
                                <div className="absolute top-0 inset-x-0 h-1bg-gradient-to-r from-blue-500 to-indigo-500 flex justify-center -translate-y-1/2">
                                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-4 border-white">En Çok Tercih Edilen</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 pt-2">Profesyonel (Pro)</h3>
                                <p className="text-slate-400 text-sm mb-6 h-10">Büyüyen KOBİ'ler için uçtan uca ERP yönetimi.</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-black text-white">{annualBilling ? '₺3.490' : '₺4.290'}</span>
                                    <span className="text-slate-400 font-medium"> /aylık</span>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {['Tüm Başlangıç Özellikleri', 'Gelişmiş Çoklu Depo', 'B2B Sipariş Portalı', 'İnsan Kaynakları & PDKS', 'Saha Satış Gücü', 'Sınırısız Kullanıcı'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300 font-medium bg-white/5 p-2.5 rounded-xl border border-white/10">
                                            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-colors">Ücretsiz Denemeye Başla</button>
                            </div>

                            {/* Enterprise */}
                            <div className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-sm relative">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Kurumsal (Enterprise)</h3>
                                <p className="text-slate-500 text-sm mb-6 h-10">Özel donanım entegrasyonu ve adanmış sunucu isteyenler.</p>
                                <div className="mb-8">
                                    <span className="text-4xl font-black text-slate-900">Özel</span>
                                    <span className="text-slate-500 font-medium"> /fiyatlandırma</span>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {['Size özel (Dedicated) Sunucu', 'Özel SLA Destek Hattı', 'API ve Donanım Entegrasyonu', 'Özel Şablon Tasarımları', 'Yerinde Kurulum Hizmeti'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:border-slate-900 hover:bg-slate-50 transition-colors">Bizimle İletişime Geçin</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. FAQ (Sıkça Sorulan Sorular) */}
                <section id="faq" className="w-full py-24 bg-white border-t border-slate-100">
                    <div className="w-[90%] max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Sıkça Sorulan Sorular</h2>
                        </div>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border border-slate-200 rounded-[24px] overflow-hidden bg-slate-50 transition-all">
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full text-left px-8 py-6 font-bold text-lg text-slate-900 flex justify-between items-center"
                                    >
                                        {faq.q}
                                        <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openFaq === index && (
                                        <div className="px-8 pb-6 text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-4">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 7. FINAL CTA */}
                <section className="w-full py-24 px-6 relative overflow-hidden bg-blue-600">
                    <div className="max-w-5xl mx-auto rounded-[40px] text-center relative z-10 flex flex-col items-center">
                         <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-8">
                            Kurumsal devrime <br/> hazır mısınız?
                         </h2>
                         <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto mb-10">
                            Hemen şimdi hesap oluşturun, Periodya'nın efsanevi hızını ve sadeliğini 14 gün boyunca kredi kartı olmadan test edin.
                         </p>
                         <Link href="/register" className="px-12 h-[64px] bg-white text-blue-600 text-[18px] font-extrabold rounded-full transition-all shadow-xl hover:bg-slate-50 flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-2xl">
                             Ücretsiz Denemeyi Başlat <ArrowRight className="w-5 h-5"/>
                         </Link>
                    </div>
                </section>

                {/* 8. FOOTER */}
                <footer className="w-full bg-white border-t border-slate-200 pt-20 pb-10 px-10">
                    <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-lg">P</div>
                                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Periodya</span>
                            </div>
                            <p className="text-base text-slate-500 font-medium max-w-sm mb-6 leading-relaxed">
                                Finans, stok, İK ve çok daha fazlası. Geleceğin B2B ERP ve Ticaret Ağı.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-extrabold mb-6 text-sm uppercase tracking-widest">Çözümler</h4>
                            <ul className="space-y-4 font-medium text-slate-500 flex flex-col">
                                <Link href="#" className="hover:text-blue-600 transition-colors">Ön Muhasebe</Link>
                                <Link href="#" className="hover:text-blue-600 transition-colors">E-Fatura & E-Arşiv</Link>
                                <Link href="#" className="hover:text-blue-600 transition-colors">PDKS</Link>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-extrabold mb-6 text-sm uppercase tracking-widest">Kaynaklar</h4>
                            <ul className="space-y-4 font-medium text-slate-500 flex flex-col">
                                <Link href="#" className="hover:text-blue-600 transition-colors">Yardım Merkezi</Link>
                                <Link href="#" className="hover:text-blue-600 transition-colors">API Dokümantasyonu</Link>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-extrabold mb-6 text-sm uppercase tracking-widest">Şirket</h4>
                            <ul className="space-y-4 font-medium text-slate-500 flex flex-col">
                                <Link href="#" className="hover:text-blue-600 transition-colors">İletişim</Link>
                                <Link href="#" className="hover:text-blue-600 transition-colors">Gizlilik Sözleşmesi</Link>
                            </ul>
                        </div>
                    </div>
                    <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
                        <p className="font-bold text-slate-400 text-sm">&copy; {new Date().getFullYear()} Periodya Yazılım A.Ş. Tüm hakları saklıdır.</p>
                        <p className="font-bold text-slate-400 text-sm">Made in Turkey with ♥</p>
                    </div>
                </footer>

            </div> {/* /END MAIN WRAPPER */}
        </div>
    );
}
