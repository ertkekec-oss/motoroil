"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, Moon, Sun, Play, ArrowUpRight, ArrowRight, Zap, Check, Star, Facebook, Twitter, Instagram, Linkedin,
    Bot, Activity, PieChart, Users, Shield, Headphones, Target, Cloud, Box, Database, ShoppingBag, Layout
} from 'lucide-react';
import LoginSpotlight from './LoginSpotlight';
import Login3DHoloCard from './Login3DHoloCard';

const platformTabs = [
    {
        title: "Kişiselleştirilmiş Çözüm", 
        desc: "İşletmenizin spesifik ihtiyaçlarına ve hedeflerine uyacak şekilde teknolojimizi tamamen size özel hale getiriyoruz.", 
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Öncü Teknoloji",
        desc: "Sektördeki en son standartlarla inşa edilmiş entegrasyon sistemimiz sayesinde sınır tanımaz bir e-ticaret hızı sunar.",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Keşif ve Analiz",
        desc: "Karmaşık verilerinizi sezgisel grafiklerle okuyun. Günlük kar zarar durumunuzu ve stratejilerinizi hızla analiz edin.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Dağıtım ve Destek",
        desc: "Mükemmel sonuçları garanti eden kişiselleştirilmiş teknoloji optimizasyonu ve daima arkanızda duran 7/24 uzman desteği.",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
    }
];

const integrationItems = [
    {
        title: "Başlarken",
        contentTitle: "150,000+ Şirketin Güvendiği ERP",
        descLine1: "",
        descLine2: "Büyük hacimli e-ticaret siteleri Periodya ile çalışıyor — sizin de işinize yarayacak.",
        logos: ["Trendyol", "Hepsiburada", "Akbank", "Garanti", "Gittigidiyor"]
    },
    {
        title: "E-Ticaret",
        contentTitle: "E-Ticaret Çözümleri",
        descLine1: "Tüm pazaryeri satışlarınızı ve stoklarınızı tek bir merkezden kolayca yönetin.",
        descLine2: "Siparişten kargoya, faturalandırmadan müşteri ilişkilerine kadar tam entegrasyon.",
        logos: ["Trendyol", "Hepsiburada", "N11", "Çiçeksepeti", "Amazon", "PttAVM", "Shopify"]
    },
    {
        title: "Banka",
        contentTitle: "Banka Çözümleri",
        descLine1: "Türkiye'nin önde gelen tüm bankalarıyla direkt API üzerinden çalışarak hesaplarınızı anında izleyin.",
        descLine2: "Hesap hareketleri, otomatik virman ve bakiye mutabakatı artık saniyeler içinde.",
        logos: ["Garanti BBVA", "Akbank", "İş Bankası", "Yapı Kredi", "Ziraat Bankası", "QNB Finans"]
    },
    {
        title: "E-Fatura",
        contentTitle: "E-Fatura Çözümleri",
        descLine1: "Gelir İdaresi Başkanlığı onaylı operatörlerle saniyeler içinde e-fatura ve e-arşiv kesin.",
        descLine2: "Maliyetlerinizi düşürün ve muhasebe süreçlerinizi dijitalin hızıyla kusursuzlaştırın.",
        logos: ["QNB eFinans", "Digital Planet", "Sovos", "Uyumsoft", "GİB Portal", "Türkkep"]
    },
    {
        title: "Ödeme",
        contentTitle: "Ödeme Çözümleri",
        descLine1: "B2B ve B2C müşterilerinizden dilediğiniz kredi kartıyla 7/24 güvenli online tahsilat yapın.",
        descLine2: "Düşük komisyon oranları ve ertesi gün sanal POS aktarımıyla nakit akışınızı koruyun.",
        logos: ["PayTR", "İyzico", "Param", "Ozan", "Sipay", "Moka"]
    },
    {
        title: "Yazarkasa POS",
        contentTitle: "Yazarkasa POS Çözümleri",
        descLine1: "Mağazadaki fiziksel satışlarınızı ERP sisteminizle anlık senkronize eden akıllı altyapı.",
        descLine2: "Yeni nesil ÖKC (Ödeme Kaydedici Cihaz) entegrasyonuyla stok ve maliye bildirim problemlerine son verin.",
        logos: ["Beko", "Ingenico", "Profilo", "Hugin", "Vera", "Paygo"]
    }
];

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState('light');
    const [activeTab, setActiveTab] = useState(0);
    const [activeIntegrationTab, setActiveIntegrationTab] = useState(0);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F7FF] font-sans text-[#0E1528] selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
            
            <LoginHoloModal isOpen={isLoginOpen} setIsOpen={setIsLoginOpen} />

            {/* Faint Background Geometry Block (Approximation for the Hero Left) */}
            <div className="absolute top-10 -left-64 w-[500px] h-[500px] bg-white rounded-[100px] rotate-45 opacity-40 z-0"></div>
            
            {/* --- 1. HEADER (Exsit Redesign) --- */}
            <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-sm transition-all duration-300">
                <style>{`
                  @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                  }
                  .animate-marquee-infinite {
                    display: flex;
                    width: max-content;
                    animation: marquee 35s linear infinite;
                  }
                  .animate-marquee-infinite:hover {
                    animation-play-state: paused;
                  }
                `}</style>
                
                {/* Top Notification Bar */}
                <div className="bg-[#2563EB] text-white py-2.5 hidden sm:flex justify-center items-center">
                    <div className="bg-white/10 px-6 py-1 rounded-full text-[11px] font-medium tracking-wide">
                        Yeni: Periodya'nın baştan aşağı yenilenen kullanıcı arayüzü ile tanışın! Operasyonlarınız çok daha güçlü.
                    </div>
                </div>

                {/* Main Navbar */}
                <div className={`transition-colors duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md' : 'bg-white'} border-b border-slate-100`}>
                    <div className="max-w-[1400px] mx-auto px-6 h-[76px] flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                             <div className="flex gap-1 items-center">
                                 {/* Mimicking the slanted 'SS' logo of Sasstech using basic shapes */}
                                 <div className="w-[18px] h-[22px] bg-blue-600 rounded-sm skew-x-[-15deg]"></div>
                                 <div className="w-[8px] h-[22px] bg-[#0E1528] rounded-sm skew-x-[-15deg]"></div>
                             </div>
                            <span className="text-[22px] font-bold tracking-tight text-[#0E1528] ml-1">Periodya</span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-8 font-semibold text-[14px] text-slate-700">
                            <Link href="#" className="text-blue-600 flex items-center gap-1 transition-colors">Ana Sayfa <span className="text-[10px] font-black">▼</span></Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Özellikler <span className="text-[10px] font-black">▼</span></Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Modüller <span className="text-[10px] font-black">▼</span></Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Blog <span className="text-[10px] font-black">▼</span></Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">İletişim</Link>
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsLoginOpen(true)} className="text-[13px] font-bold text-slate-500 hover:text-[#0E1528] transition-colors hidden sm:block">
                                Giriş Yap
                            </button>
                            <Link href="/register" className="px-7 py-3 bg-[#0E1528] text-white text-[13px] font-bold rounded-sm hover:bg-blue-600 transition-colors shadow-md">
                                Ücretsiz Dene
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Ticker/Marquee Bar */}
                <div className="bg-white border-b border-slate-100 py-3.5 overflow-hidden flex whitespace-nowrap">
                    <div className="animate-marquee-infinite text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {/* We loop 3 times to ensure infinite scroll fills the screen */}
                        {[1,2,3].map((set) => (
                            <div key={set} className="flex items-center gap-14 px-7">
                                <span className="flex items-center gap-2"><Activity className="w-[14px] h-[14px] text-blue-600 stroke-[2.5px]"/> BAŞARI İÇİN MÜKEMMEL ÇÖZÜM</span>
                                <span className="flex items-center gap-2"><Activity className="w-[14px] h-[14px] text-blue-600 stroke-[2.5px]"/> E-TİCARET OPERASYONLARINDA MÜKEMMELLİK</span>
                                <span className="flex items-center gap-2"><Activity className="w-[14px] h-[14px] text-blue-600 stroke-[2.5px]"/> MARKANIZI PERİODYA İLE YÜKSELTİN</span>
                                <span className="flex items-center gap-2"><Activity className="w-[14px] h-[14px] text-blue-600 stroke-[2.5px]"/> İŞ HEDEFLERİNİZE ULAŞACAK TEKNOLOJİ</span>
                                <span className="flex items-center gap-2"><Activity className="w-[14px] h-[14px] text-blue-600 stroke-[2.5px]"/> GÜÇLÜ PAZAR YERİ VARLIĞI</span>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* --- 2. HERO SECTION (Exsit Redesign) --- */}
            <section className="pt-56 lg:pt-64 pb-32 max-w-[1300px] mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column Text */}
                    <div className="col-span-12 lg:col-span-7">
                        <h1 className="text-5xl md:text-[64px] lg:text-[72px] text-[#0E1528] leading-[1.1] tracking-tight mb-8">
                            <span className="font-light">E-Ticaret</span> <span className="font-bold">ve</span><br/>
                            <span className="font-bold">Ön Muhasebede</span><br/>
                            <span className="font-bold text-[#2563EB]">Üstün</span> <span className="font-light whitespace-nowrap">Sonuçlar</span>
                        </h1>
                        
                        <p className="text-slate-500 text-base md:text-lg mb-12 max-w-[480px] font-medium leading-relaxed">
                            Günümüzün rekabetçi ticaretinde, etkin ve düşük maliyetli yazılım çözümlerine olan ihtiyaç hiç bu kadar kritik olmamıştı.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-6 relative">
                            <Link href="/register" className="px-8 py-3.5 bg-[#2563EB] text-white text-[15px] font-bold rounded-sm shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:-translate-y-1 transition-transform">
                                Ücretsiz Başla
                            </Link>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-[3px] border-[#F4F7FF] relative z-30" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-[3px] border-[#F4F7FF] relative z-20" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-[3px] border-[#F4F7FF] relative z-10" alt="User" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="font-black text-[#0E1528] text-sm leading-none mb-1">2.3M+</div>
                                    <div className="text-[10px] whitespace-nowrap font-bold text-slate-500 leading-none">5000+ Müşteri Yorumu</div>
                                </div>
                            </div>

                            {/* Blue decorative element floating near bottom */}
                            <div className="absolute -bottom-8 right-20 hidden md:block select-none pointer-events-none opacity-40">
                                <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M50 10 L50 90 M10 50 L90 50 M25 25 L75 75 M25 75 L75 25" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Complex Image Composition) */}
                    <div className="col-span-12 lg:col-span-5 relative mt-24 lg:mt-0 flex justify-center lg:justify-end pr-4">
                        
                        {/* Faint Background Geometric Grid (Top Right) */}
                        <div className="absolute top-[-30px] -right-4 w-48 h-48 grid grid-cols-4 grid-rows-4 gap-3 opacity-[0.03] z-0">
                            {Array.from({length: 16}).map((_, i) => <div key={i} className="bg-[#0E1528] rounded-[2px]" />)}
                        </div>

                        {/* Main Subject Card (Rounded Arches) */}
                        <div className="w-[85%] max-w-[420px] bg-white rounded-t-[120px] rounded-b-[40px] p-1.5 pb-0 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative z-20">
                            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" alt="Business Professional" className="w-full h-[500px] object-cover rounded-t-[115px] rounded-b-[38px] grayscale-[0.3]" />
                        </div>

                        {/* Floating Card 1: Trustpilot (Top Right) */}
                        <div className="absolute top-10 -right-2 lg:-right-8 bg-white rounded-md p-4 px-5 shadow-[0_20px_40px_rgba(0,0,0,0.06)] z-30 flex flex-col items-center gap-1.5 border border-slate-100">
                            <div className="absolute -top-3 right-4 bg-[#00b67a] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                4.9 <Star className="w-2.5 h-2.5 fill-white" />
                            </div>
                            <div className="flex gap-0.5 mt-2">
                                <div className="w-5 h-5 bg-[#00b67a] flex items-center justify-center rounded-[2px]"><Star className="w-3 h-3 text-white fill-white"/></div>
                                <div className="w-5 h-5 bg-[#00b67a] flex items-center justify-center rounded-[2px]"><Star className="w-3 h-3 text-white fill-white"/></div>
                                <div className="w-5 h-5 bg-[#00b67a] flex items-center justify-center rounded-[2px]"><Star className="w-3 h-3 text-white fill-white"/></div>
                                <div className="w-5 h-5 bg-[#00b67a] flex items-center justify-center rounded-[2px]"><Star className="w-3 h-3 text-white fill-white"/></div>
                                <div className="w-5 h-5 bg-slate-200 flex items-center justify-center rounded-[2px]"><Star className="w-3 h-3 text-white fill-white"/></div>
                            </div>
                            <div className="font-bold text-[#0E1528] text-[13px] flex items-center gap-1 mt-0.5">
                                Trust pilot <Check className="w-3.5 h-3.5 text-white bg-blue-600 rounded-full p-0.5" />
                            </div>
                        </div>

                        {/* Floating Card 2: Daily Revenue (Bottom Left) */}
                        <div className="absolute bottom-12 -left-6 lg:left-[-60px] bg-white/95 backdrop-blur-md rounded-[20px] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.12)] z-30 w-[260px] border border-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Günlük Ciro</div>
                                    <div className="text-[20px] font-black text-[#0E1528] tracking-tight leading-none">₺48,200.00</div>
                                </div>
                                <div className="w-12 h-12 rounded-full border-[3px] border-pink-100 flex items-center justify-center bg-white shadow-inner">
                                    <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8517e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                                <span className="text-[#0E1528]">Günlük</span>
                                <span className="hover:text-[#0E1528] cursor-pointer transition-colors">Haftalık</span>
                                <span className="hover:text-[#0E1528] cursor-pointer transition-colors">Aylık</span>
                            </div>
                        </div>

                        {/* Floating Card 3: Experience Blue Box (Bottom Right) */}
                        <div className="absolute -bottom-6 -right-6 lg:-right-4 bg-[#2563EB] text-white rounded-md rounded-tl-none p-6 md:p-8 shadow-[0_20px_40px_rgba(37,99,235,0.4)] z-20 w-40 md:w-48 outline outline-4 outline-[#F4F7FF]">
                            <div className="text-4xl md:text-5xl font-black mb-2 leading-none">8+</div>
                            <div className="text-[10px] md:text-xs font-semibold leading-tight text-white/90">Yıllık Sektör<br/>Tecrübesi</div>
                        </div>

                        {/* Setting gear icon floating right */}
                        <div className="absolute top-[35%] -right-16 hidden lg:flex w-10 h-10 bg-blue-600 rounded drop-shadow-xl text-white items-center justify-center z-10">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- 3. DYNAMIC INTEGRATIONS TABS --- */}
            <section className="pt-4 pb-12 md:pt-4 md:pb-16 max-w-[1200px] mx-auto px-6 relative z-10 w-full text-center">
                
                {/* Header Pattern Centered */}
                <div className="mb-10">
                    <h2 className="text-3xl md:text-4xl lg:text-[42px] text-[#0E1528] leading-[1.1] mb-4 tracking-tight">
                        <span className="font-extrabold">Sıradışı Bir Entegrasyon</span> <span className="font-light">Ağı</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-[16px]">Bütün operasyonunuz için gerekli olan tüm platformlar tek çatı altında.</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mb-8">
                    {integrationItems.map((item, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveIntegrationTab(idx)}
                            className={`px-5 py-2.5 rounded-sm font-bold text-[14px] transition-all duration-300 ${
                                activeIntegrationTab === idx 
                                ? "bg-[#2563EB] text-white shadow-md" 
                                : "bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0E1528] border border-slate-200"
                            }`}
                        >
                            {item.title}
                        </button>
                    ))}
                </div>

                {/* Tab Content Box */}
                {activeIntegrationTab === 0 ? (
                    <div className="w-full text-left mt-8">
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 max-w-[1050px] mx-auto">
                            <div>
                                <h2 className="text-2xl md:text-3xl lg:text-[40px] font-bold text-[#0E1528] leading-[1.1] mb-2 tracking-tight">
                                    Kusursuz entegrasyon ile operasyonlarınızı hızlandırın
                                </h2>
                                <p className="text-slate-500 font-medium text-[15px]">Gerçek müşterilerimizden dürüst geri bildirimler.</p>
                            </div>
                            <div className="mt-4 md:mt-0 shrink-0">
                                <Link href="#" className="px-6 py-3 bg-[#2563EB] text-white font-bold rounded-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                                    Tüm Yorumlar <ArrowUpRight className="w-4 h-4"/>
                                </Link>
                            </div>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-[1050px] mx-auto">
                            
                            {/* Top Left: Wide Image Card */}
                            <div className="md:col-span-8 h-[240px] rounded-md overflow-hidden relative shadow-sm">
                                <img src="https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&w=800&q=80" alt="User Smiling" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                    <h3 className="text-white text-xl font-bold mb-1">E-Ticaret Yönetimi</h3>
                                    <p className="text-white/80 text-[13px] font-medium">Entegrasyon, Depo, Fatura</p>
                                </div>
                                <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold">1 / 3</div>
                            </div>

                            {/* Top Right: Vertical Info Card */}
                            <div className="md:col-span-4 h-[240px] rounded-md overflow-hidden relative shadow-sm">
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" alt="Focus" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3E2723]/90 to-transparent p-6">
                                    <h3 className="text-white text-4xl font-bold mb-1">%98.2</h3>
                                    <p className="text-white/80 text-[13px] font-medium leading-tight">En iyi ve güvenilir geri bildirimler bizi tam olarak anlayan müşterilerimizden gelir.</p>
                                </div>
                            </div>

                            {/* Bottom Left: Cyan Card */}
                            <div className="md:col-span-4 h-[240px] rounded-md bg-[#BCEBFA] p-6 flex flex-col justify-between shadow-sm">
                                <div className="flex -space-x-2">
                                    <img src="https://i.pravatar.cc/100?img=4" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=5" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                    <img src="https://i.pravatar.cc/100?img=6" className="w-8 h-8 rounded-full border border-[#A8F0FF]" alt="User" />
                                </div>
                                <div>
                                    <h3 className="text-[#0E1528] text-[42px] font-medium leading-none mb-2">30x</h3>
                                    <p className="text-[#0E1528]/80 text-[14px] font-medium italic leading-snug">Zaman tasarrufu sağlayan kusursuz altyapı.</p>
                                </div>
                            </div>

                            {/* Bottom Right: Gray Testimonial Card */}
                            <div className="md:col-span-8 h-[240px] rounded-md bg-[#F0F2F4] p-6 flex flex-col justify-between shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-[#0E1528]">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center"><Check className="w-3 h-3 text-white"/></div>
                                        <span className="font-extrabold text-[15px] uppercase tracking-wide">Periodya</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                    </div>
                                </div>
                                
                                <p className="text-[#0E1528] text-[15px] font-medium leading-relaxed mb-4 italic pr-6">
                                    "Tüm pazar yerlerini tek bir yerden yönetmek harika. Stoklarımız artık hiç karışmıyor. Ekip her zaman duyarlı ve müşteri memnuniyetini gerçekten önemsiyor."
                                </p>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <img src="https://i.pravatar.cc/100?img=7" className="w-8 h-8 rounded-full" alt="Ahmet Y." />
                                        <div>
                                            <h4 className="font-bold text-[#0E1528] text-[13px] leading-none mb-0.5">Ahmet Y.</h4>
                                            <p className="text-[10px] font-semibold text-slate-500 leading-none">Şirket Sahibi</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-3xl font-medium text-[#0E1528] leading-none mb-1">4.5</h3>
                                        <div className="flex gap-0.5 text-orange-500 justify-end mb-1">
                                            <Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 fill-orange-500" /><Star className="w-3 h-3 text-slate-300 fill-slate-300" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-semibold">(2.3k+ Reviews)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-md p-10 shadow-sm min-h-[250px] flex flex-col items-center justify-center text-center max-w-[1050px] mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold text-[#0E1528] mb-4 tracking-tight">{integrationItems[activeIntegrationTab].contentTitle}</h3>
                        <p className="text-slate-500 text-[14px] font-medium leading-[1.6] max-w-2xl mx-auto mb-1">
                            {integrationItems[activeIntegrationTab].descLine1}
                        </p>
                        <p className="text-slate-500 text-[14px] font-medium leading-[1.6] max-w-2xl mx-auto mb-10">
                            {integrationItems[activeIntegrationTab].descLine2}
                        </p>

                        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                            {integrationItems[activeIntegrationTab].logos.map((logo, i) => (
                                <span key={i} className="font-extrabold text-xl lg:text-[22px] tracking-tight text-slate-400 hover:text-[#0E1528] transition-colors cursor-default">
                                    {logo}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* --- 5. INTERACTIVE PLATFORM SECTION (Exsit Redesign) --- */}
            <section className="py-16 md:py-20 max-w-[1300px] mx-auto px-6 z-10 relative">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    
                    {/* Left Column (Accordion) */}
                    <div className="lg:pr-10">
                        <div className="inline-block px-4 py-1.5 bg-white shadow-sm font-bold text-blue-600 text-[10px] uppercase rounded-full mb-6">
                            Tech Solution
                        </div>
                        <h2 className="text-4xl lg:text-[46px] text-[#0E1528] leading-[1.1] tracking-tight mb-6">
                            <span className="font-light">The</span> <span className="font-bold">CompletePlatform</span><span className="font-light">To</span><br/>
                            <span className="font-bold">PowerYourOperations</span>
                        </h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10 max-w-[420px]">
                            In today's competitive business, the demand for efficient and cost-effective IT solutions has never been more critical.
                        </p>

                        {/* Tabs list */}
                        <div className="space-y-3">
                             {platformTabs.map((tab, idx) => {
                                 const isActive = activeTab === idx;
                                 return (
                                     <div key={idx} 
                                        className={`cursor-pointer transition-all duration-300 rounded-md overflow-hidden shadow-sm ${isActive ? 'bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)] border-l-[3px] border-blue-600 pt-6 px-6 pb-6 mt-4' : 'p-4 pl-6 border-l-[3px] border-transparent hover:bg-white/40'}`}
                                        onClick={() => setActiveTab(idx)}
                                     >
                                         <h3 className={`text-lg transition-colors font-bold ${isActive ? 'text-blue-600 mb-3' : 'text-[#0E1528]'}`}>
                                             {tab.title}
                                         </h3>
                                         {isActive && (
                                             <p className="text-slate-500 text-[13px] font-medium leading-relaxed">
                                                 {tab.desc}
                                             </p>
                                         )}
                                     </div>
                                 )
                             })}
                        </div>
                    </div>

                    {/* Right Column (Dynamic Image + Floating UI) */}
                    <div className="relative pt-10 flex justify-end">
                        {/* Background subtle curve graphic (SVG or just gray circle overlay) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full -z-10 opacity-40 shadow-2xl"></div>

                        {/* Main Image Container */}
                        <div className="w-[90%] max-w-[600px] bg-white p-2.5 rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.07)] relative z-20 transition-all duration-500">
                            <img src={platformTabs[activeTab].image} alt="Platform view" className="w-full aspect-[4/3] object-cover rounded-[18px]" />
                        </div>

                        {/* Top Right Floating Badge */}
                        <div className="absolute top-6 -right-2 lg:-right-8 bg-white rounded-md shadow-xl flex items-center p-3 gap-6 border border-slate-100 z-30">
                            <div>
                                <div className="text-[8px] uppercase font-bold text-slate-400 mb-0.5">Your balance</div>
                                <div className="text-lg font-black text-[#0E1528] tracking-tight">$1,000</div>
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-100">
                                <img src="https://flagcdn.com/w40/us.png" alt="USA Flag" className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Bottom Left Floating Bar Chart */}
                        <div className="absolute -bottom-10 -left-6 lg:-left-16 bg-white rounded-md p-5 shadow-2xl z-30 w-[240px] border border-slate-50">
                             <div className="flex justify-between items-center mb-6">
                                 <div className="flex gap-3 items-center">
                                     <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex justify-center items-center"><Activity className="w-4 h-4"/></div>
                                     <div>
                                          <div className="text-[11px] font-bold text-[#0E1528] leading-tight">Usability testing</div>
                                          <div className="text-[9px] font-semibold text-slate-500">12 products</div>
                                     </div>
                                 </div>
                                 <div className="text-[8px] text-slate-400 font-bold">● ● ●</div>
                             </div>
                             {/* Mini CSS Bar Chart */}
                             <div className="flex items-end justify-between h-14 w-full px-1">
                                <div className="w-[12px] bg-[#0E1528] rounded-t-[3px]" style={{height: '40%'}}></div>
                                <div className="w-[12px] bg-blue-600 rounded-t-[3px]" style={{height: '75%'}}></div>
                                <div className="w-[12px] bg-[#0E1528] rounded-t-[3px]" style={{height: '30%'}}></div>
                                <div className="w-[12px] bg-[#0E1528] rounded-t-[3px]" style={{height: '85%'}}></div>
                                <div className="w-[12px] bg-[#0E1528] rounded-t-[3px]" style={{height: '50%'}}></div>
                                <div className="w-[12px] bg-[#0E1528] rounded-t-[3px]" style={{height: '65%'}}></div>
                                <div className="w-[12px] bg-[#0E1528] rounded-t-[3px]" style={{height: '45%'}}></div>
                                <div className="w-[12px] bg-slate-200 rounded-t-[3px]" style={{height: '25%'}}></div>
                             </div>
                        </div>

                        {/* Bottom Right Floating Pie Chart */}
                        <div className="absolute bottom-2 -right-4 lg:-right-10 bg-white rounded-md p-4 shadow-2xl z-30 w-[140px] border border-slate-50">
                             <div className="text-[9px] font-bold text-[#0E1528] mb-3 flex justify-between">
                                 <span>Your Pie Chart</span>
                                 <span className="text-slate-400 text-[8px]">Monthly ▾</span>
                             </div>
                             <div className="flex justify-center mb-4">
                                 <div className="w-[60px] h-[60px] rounded-full border-[10px] border-blue-600" style={{ borderRightColor: '#0E1528', rotate: '45deg' }}></div>
                             </div>
                             <div className="flex justify-around text-[9px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                                 <div><span className="text-blue-600 text-xs">●</span> 65%</div>
                                 <div className="border-l border-slate-200"></div>
                                 <div><span className="text-[#0E1528] text-xs">●</span> 35%</div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 6. INTEGRATION / WHY CHOOSE US SECTION (Exsit Redesign) --- */}
            <section className="py-16 lg:py-20 bg-white relative z-10 w-full overflow-hidden">
                <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    
                    {/* Left Column (Image & Floating Integration Nodes) */}
                    <div className="relative flex justify-center">
                        {/* Background faint circle overlay behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-slate-50 rounded-full -z-10"></div>

                        {/* Main Photography Card */}
                        <div className="w-[85%] max-w-[420px] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative z-20">
                            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" alt="Team meeting" className="w-full h-[550px] object-cover" />
                        </div>

                        {/* Floating Node 1: Red/Pink (Top Left) */}
                        <div className="absolute top-10 -left-2 lg:-left-6 w-20 h-20 bg-white rounded-md shadow-xl flex items-center justify-center z-30 transition-transform duration-500 hover:scale-110">
                             <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                 <Layout strokeWidth={2} className="w-5 h-5"/>
                             </div>
                        </div>

                        {/* Floating Node 2: Black Logo Box (Top Right) */}
                        <div className="absolute top-12 -right-4 lg:right-6 w-[88px] h-[88px] bg-white rounded-md shadow-xl flex items-center justify-center z-30 transition-transform duration-500 hover:scale-110">
                             <div className="w-12 h-12 bg-[#0E1528] rounded-xl flex items-center justify-center text-white">
                                 <Box strokeWidth={2} className="w-6 h-6"/>
                             </div>
                        </div>

                        {/* Floating Node 3: Outline Icon Box (Middle Left) */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-2 lg:-left-4 w-24 h-24 bg-white rounded-[20px] shadow-[0_15px_40px_rgba(0,0,0,0.1)] flex items-center justify-center z-30 transition-transform duration-500 hover:scale-110">
                             <Activity strokeWidth={1.5} className="w-10 h-10 text-[#0E1528]"/>
                        </div>

                        {/* Floating Node 4: Colorful Polygon/Layer (Bottom Right) */}
                        <div className="absolute bottom-20 -right-6 lg:-right-4 w-28 h-28 bg-white rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex items-center justify-center z-30 transition-transform duration-500 hover:scale-110">
                             <div className="grid grid-cols-2 grid-rows-2 gap-1 w-12 h-12 rotate-45">
                                 <div className="bg-orange-500 rounded-sm"></div>
                                 <div className="bg-sky-500 rounded-sm"></div>
                                 <div className="bg-rose-500 rounded-sm"></div>
                                 <div className="bg-teal-400 rounded-sm"></div>
                             </div>
                        </div>
                    </div>

                    {/* Right Column (Content) */}
                    <div className="lg:pl-8">
                        <div className="inline-block px-5 py-1.5 bg-[#2563EB] shadow-[0_10px_20px_rgba(37,99,235,0.3)] text-white font-bold text-[10px] uppercase tracking-wide rounded-full mb-8">
                            Neden Bizi Seçmelisiniz
                        </div>
                        
                        <h2 className="text-[38px] md:text-[46px] text-[#0E1528] leading-[1.1] tracking-tight mb-8">
                            <span className="font-bold">Periodya</span> <span className="font-light">operasyonlarınızı optimize ederek ekibinizin performansını artırır ve</span> <span className="font-bold">Büyümeyi hızlandırır.</span>
                        </h2>
                        
                        <p className="text-slate-500 font-medium text-[13px] md:text-sm leading-relaxed mb-12 max-w-[480px]">
                            Günümüz rekabetçi e-ticaret pazarında, etkin ve düşük maliyetli yazılım çözümlerine olan talep hiç bu kadar kritik olmamıştı. Sizi bir adım öne taşıyoruz.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 mb-12">
                            {/* Card 1 */}
                            <div className="bg-[#FAFBFD] p-6 lg:p-8 rounded-md border border-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300">
                                <h4 className="font-bold text-[#0E1528] text-[15px] mb-3">Uzmanlık & Özelleştirme</h4>
                                <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
                                    Ekibimiz size özel tasarlanmış tam teşekküllü donanımlar ve büyüme planları sunar.
                                </p>
                            </div>
                            
                            {/* Card 2 */}
                            <div className="bg-[#FAFBFD] p-6 lg:p-8 rounded-md border border-slate-50 hover:bg-white hover:shadow-xl transition-all duration-300">
                                <h4 className="font-bold text-[#0E1528] text-[15px] mb-3">Kesintisiz Entegrasyon</h4>
                                <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
                                    Sistemlerimiz her ay yeni pazar yeri standartlarına uygun olarak kesintisiz güncellenir.
                                </p>
                            </div>
                        </div>

                        {/* Huge Number Row */}
                        <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                            <div className="text-[64px] md:text-[76px] text-[#2563EB] font-light leading-none tracking-tight">
                                1.3m
                            </div>
                            <div className="text-sm font-bold text-[#0E1528] leading-relaxed max-w-[150px]">
                                Yıllık ortalama işlenen başarılı paket hacmi.
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* --- NEW 8-CARD FLEX GRID (Makes Us Different) --- */}            <section className="pt-8 pb-16 md:pb-20 max-w-[1300px] mx-auto px-6 relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-[#0E1528] mb-4">
                        Bizi <span className="text-blue-600">Farklı Kılan</span> Özellikler.
                    </h2>
                    <p className="text-slate-500 font-medium leading-relaxed">Sürekli yenilikçi teknolojilerle ön saflarda yer almaktan, sınırları yeniden tanımlamaktan ve e-ticaret dijital dünyasını birlikte şekillendirmekten gurur duyuyoruz.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">01</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Bot className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">YZ Destekli Analiz</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Ön muhasebenizde yapay zekanın hızını ve kusursuzluğunu hissedin.</p>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">02</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><PieChart className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Derin İçgörüler</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Pazar yerlerindeki satış trendlerinizi anlık ve net raporlarla takip edin.</p>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">03</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Activity className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Stratejik Kararlar</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Gerçek verilere dayalı altyapımızla doğru zamanda en iyi ticaret kararını alın.</p>
                    </div>
                    {/* Card 4 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">04</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Users className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">İşbirliği Araçları</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Ekibinizle aynı panelde uyum içerisinde rolleri dağıtarak çalışın.</p>
                    </div>
                    {/* Card 5 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">05</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Shield className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Veri Koruması</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">KVKK standartlarına tam uyumlu yüksek şifrelemelerle verilerinizi koruyun.</p>
                    </div>
                    {/* Card 6 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">06</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Headphones className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">7/24 Teknik Destek</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Uzman kadromuzla mağazanızın operasyonlarında asla yarı yolda kalmayın.</p>
                    </div>
                    {/* Card 7 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">07</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Target className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Gelişmiş Cari CRM</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Tüm tedarikçi ağınızı tek bir listede puanınıza göre otonom olarak yönetin.</p>
                    </div>
                    {/* Card 8 */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-md p-8 relative flex flex-col items-start overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-6xl font-black text-slate-50 pointer-events-none select-none">08</span>
                        <div className="mb-6 z-10 p-3 bg-blue-50/50 rounded-md"><Cloud className="w-8 h-8 text-blue-600" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Premium Bulut</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Sunucu veya kurulum olmadan güvenle anında her cihazdan işinize erişin.</p>
                    </div>
                </div>
            </section>

            {/* --- 7. PRICING --- */}
            <section className="py-16 md:py-24 max-w-[1300px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-black text-[#0E1528] mb-4">Esnek Fiyatlandırma</h2>
                    <p className="text-slate-500 font-medium">Büyüme hızınıza ayak uyduran paketler.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-[1050px] mx-auto mt-8">
                    {/* Basic */}
                    <div className="bg-white border border-slate-200 rounded-[12px] p-8 lg:p-10 flex flex-col shadow-sm">
                        <h3 className="text-[22px] font-bold text-[#0E1528] mb-1">Başlangıç</h3>
                        <p className="text-slate-500 text-[13px] font-medium leading-[1.6] min-h-[40px] mb-6">Küçük işletmeler için tam teşekküllü pazar yeri otomasyonu.</p>
                        <div className="mb-6 font-black text-[#0E1528] text-[42px] leading-none tracking-tight">₺990<span className="text-[15px] text-slate-500 font-semibold align-bottom font-sans">/ay</span></div>
                        <button className="w-full py-3.5 rounded-sm font-bold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors mb-8 flex justify-center items-center gap-2 text-[14px]">14 Gün Deneyin <ArrowRight className="w-4 h-4"/></button>
                        <ul className="space-y-3.5 text-slate-600 text-[13.5px] font-medium">
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Sınırlı Pazar Yeri</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Stok Takibi</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>E-Fatura Kesimi</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Sınırsız Güncelleme</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Standart Destek</li>
                        </ul>
                    </div>

                    {/* Pro */}
                    <div className="bg-white border-2 border-[#2563EB] rounded-[12px] p-8 lg:p-10 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2563EB] text-white font-bold text-[11px] tracking-widest uppercase px-4 py-1.5 rounded-[6px] flex items-center gap-1.5 whitespace-nowrap"><Zap className="w-3 h-3 fill-white stroke-white"/> EN POPÜLER</div>
                        <h3 className="text-[22px] font-bold text-[#0E1528] mb-1">Profesyonel</h3>
                        <p className="text-slate-500 text-[13px] font-medium leading-[1.6] min-h-[40px] mb-6">E-ticarette sağlam adımlar atmak isteyen profesyoneller için tam kontrol.</p>
                        <div className="mb-6 font-black text-[#0E1528] text-[42px] leading-none tracking-tight">₺2,490<span className="text-[15px] text-slate-500 font-semibold align-bottom font-sans">/ay</span></div>
                        <button className="w-full py-3.5 rounded-sm font-bold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors mb-8 flex justify-center items-center gap-2 text-[14px]">14 Gün Deneyin <ArrowRight className="w-4 h-4"/></button>
                        <ul className="space-y-3.5 text-slate-600 text-[13.5px] font-medium">
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Sınırsız Pazar Yeri</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Çoklu Depo Yönetimi</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Kargo Entegrasyonu</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Sınırsız Güncelleme</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Öncelikli Destek</li>
                        </ul>
                    </div>

                    {/* Enterprise */}
                    <div className="bg-white border border-slate-200 rounded-[12px] p-8 lg:p-10 flex flex-col shadow-sm">
                        <h3 className="text-[22px] font-bold text-[#0E1528] mb-1">Kurumsal</h3>
                        <p className="text-slate-500 text-[13px] font-medium leading-[1.6] min-h-[40px] mb-6">Kendi altyapınızda özel sunucu ihtiyaçlarıyla sınırları kaldıran kapasite.</p>
                        <div className="mb-6 font-black text-[#0E1528] text-[42px] leading-none tracking-tight">Özel<span className="text-[15px] text-slate-500 font-semibold align-bottom font-sans">/yıllık</span></div>
                        <button className="w-full py-3.5 rounded-sm font-bold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors mb-8 flex justify-center items-center gap-2 text-[14px]">İletişime Geçin <ArrowRight className="w-4 h-4"/></button>
                        <ul className="space-y-3.5 text-slate-600 text-[13.5px] font-medium">
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>VDS Sunucu Yönetimi</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Sıfırdan Veri Aktarımı</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Bayi Ağı (B2B) Desteği</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Sınırsız Güncelleme</li>
                            <li className="flex items-center gap-3"><div className="w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white stroke-[3]"/></div>Özel Eğitim & SLA</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- 8. FOOTER (Exsit Redesign) --- */}
            <footer className="bg-[#000000] text-slate-400 pt-24 pb-8 mt-10">
                <div className="max-w-[1300px] mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20 text-[13px]">
                        
                        {/* 1. Column - Brand & Subscribe (Span 4) */}
                        <div className="lg:col-span-4 lg:pr-10">
                            {/* Logo */}
                            <div className="flex items-center gap-2 mb-10">
                                 <div className="flex gap-1 items-center">
                                     <div className="w-[18px] h-[22px] bg-blue-600 rounded-sm skew-x-[-15deg]"></div>
                                     <div className="w-[8px] h-[22px] bg-white rounded-sm skew-x-[-15deg]"></div>
                                 </div>
                                <span className="text-[22px] font-bold tracking-tight text-white ml-2">Periodya</span>
                            </div>
                            
                            {/* Subscribe */}
                            <div className="bg-[#111111] rounded-xl flex items-center p-1.5 border border-white/5 mb-6">
                                <div className="pl-3 pr-2">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <input type="email" placeholder="Email Address" className="bg-transparent border-none text-white text-[13px] px-2 py-2 flex-1 focus:outline-none placeholder-slate-500" />
                                <button className="bg-[#2563EB] text-white text-[13px] font-bold px-6 py-2.5 rounded-sm hover:bg-blue-500 transition-colors">Sign Up &nbsp;&gt;</button>
                            </div>
                            <p className="text-slate-500 text-[12px] font-medium tracking-wide">By subscribing, you're accept <span className="text-white font-bold cursor-pointer hover:underline">Privacy Policy</span></p>
                        </div>

                        {/* 2. Column - My account (Span 2) */}
                        <div className="lg:col-span-2">
                            <h4 className="text-white font-bold text-[17px] mb-8">My account</h4>
                            <ul className="space-y-4 font-medium text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">Forum Support</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Help & FAQ</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing and plans</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookies Policy</a></li>
                            </ul>
                        </div>

                        {/* 3. Column - Service (Span 3) */}
                        <div className="lg:col-span-3">
                            <h4 className="text-white font-bold text-[17px] mb-8">Service</h4>
                            <ul className="space-y-4 font-medium text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">It Consultation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cloud Services</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">AI Machine Learning</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Data Security</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Software Development</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cyber Security</a></li>
                            </ul>
                        </div>

                        {/* 4. Column - Locations & Contact (Span 3) */}
                        <div className="lg:col-span-3">
                            <h4 className="text-white font-bold text-[17px] mb-6">Locations</h4>
                            <div className="flex gap-4 mb-10 text-slate-400 font-medium leading-relaxed">
                                <div className="mt-1 shrink-0">
                                    <svg className="w-[18px] h-[18px] text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <p className="text-[13px]">55 Main Street, 2nd block Melbourne,<br/> Australia</p>
                            </div>

                            <h4 className="text-white font-bold text-[17px] mb-6">Contact</h4>
                            <div className="space-y-5 text-slate-400 font-medium">
                                <a href="mailto:support@gmail.com" className="hover:text-white transition-colors flex items-center text-[13px]">support@gmail.com</a>
                                <div className="flex items-center gap-3 text-white text-[19px] tracking-tight font-bold">
                                    <svg className="w-[20px] h-[20px] text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    +880 (123) 456 88
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-slate-800 border-dashed pt-8 pb-4 flex flex-col md:flex-row justify-between items-center gap-6 text-[12.5px] font-medium relative">
                        <p className="text-slate-400">© 2026 <span className="text-white hover:text-blue-600 transition-colors cursor-pointer">Periodya</span> - IT Services. All rights reserved.</p>
                        
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 items-center">
                            <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#2563EB] flex items-center justify-center"><Facebook className="w-2.5 h-2.5 text-white fill-white"/></div> Facebook
                            </a>
                            <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#2563EB] flex items-center justify-center"><Twitter className="w-2.5 h-2.5 text-white fill-white"/></div> Twitter
                            </a>
                            <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#2563EB] flex items-center justify-center"><Instagram className="w-2.5 h-2.5 text-white"/></div> Instagram
                            </a>
                            <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#2563EB] flex items-center justify-center"><Linkedin className="w-2.5 h-2.5 text-white fill-white"/></div> Pinterest
                            </a>
                        </div>

                        {/* Target scroll to top arrow absolute positioned to right */}
                        <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-8 lg:-right-16 hidden md:block">
                             <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="w-[38px] h-[38px] bg-[#2563EB] hover:bg-blue-500 rounded-sm flex justify-center items-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)] transition-all">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                             </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
