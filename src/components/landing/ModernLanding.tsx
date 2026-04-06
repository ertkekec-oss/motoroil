"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, Moon, Sun, Play, ArrowUpRight, Check, Star, Facebook, Twitter, Instagram, Linkedin,
    Bot, Activity, PieChart, Users, Shield, Headphones, Target, Cloud
} from 'lucide-react';

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F7FF] font-sans text-[#0E1528] selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
            
            {/* --- GLOBAL BACKGROUND DOTS --- */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }}></div>

            {/* Faint Background Geometry Block (Approximation for the Hero Left) */}
            <div className="absolute top-10 -left-64 w-[500px] h-[500px] bg-white rounded-[100px] rotate-45 opacity-40 z-0"></div>
            
            {/* --- 1. HEADER --- */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#F4F7FF]/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-[1300px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-[10px] flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg">
                            P
                        </div>
                        <span className="text-xl md:text-2xl font-bold tracking-tight text-[#0E1528]">Periodya</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8 font-semibold text-[15px] text-[#0E1528]">
                        <Link href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Demo <span className="text-xs">▼</span></Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors flex items-center gap-1">Özellikler <span className="text-xs">▼</span></Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">Pazar Yerleri</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">Hakkımızda</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">İletişim</Link>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 border-l border-slate-300/30 pl-4">
                        <button className="text-[#0E1528] hover:text-blue-600 transition-colors hidden sm:block p-2">
                            <Search className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                            className="flex items-center gap-2 text-[#0E1528] font-semibold text-sm mr-4"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} <span className="hidden sm:inline">Dark</span>
                        </button>
                        <Link href="/register" className="px-6 py-2.5 bg-[#2563EB] text-white text-[15px] font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/30">
                            Ücretsiz Dene
                        </Link>
                    </div>
                </div>
            </header>

            {/* --- 2. HERO SECTION (image_0.png) --- */}
            <section className="pt-40 lg:pt-48 pb-20 max-w-[1300px] mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Left Column */}
                    <div className="max-w-xl pr-4">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-white text-blue-600 font-semibold text-xs border border-blue-100 mb-6 shadow-sm">
                            Online program is now available
                        </div>
                        
                        <h1 className="text-3xl md:text-5xl lg:text-5xl font-black tracking-tight leading-tight text-[#0E1528] mb-6 max-w-lg">
                            Periodya ile E-Ticaret ve Muhasebede <br className="hidden md:block"/>
                            <span className="text-[#2563EB]">Üstün</span> Sonuçlar
                        </h1>
                        
                        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8 pr-10">
                            Pazar yerleri ve ön muhasebenizi tek panelden, yorulmadan yönetin. Dönüşüm yolculuğunuza bizimle başlayın.
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 relative">
                            <Link href="/register" className="px-8 py-4 bg-[#2563EB] text-white text-[15px] font-bold rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] flex items-center gap-2 hover:-translate-y-1 transition-transform">
                                14 Gün Ücretsiz Dene <ArrowUpRight className="w-4 h-4"/>
                            </Link>
                            <Link href="#demo" className="px-8 py-4 bg-[#0E1528] text-white text-[15px] font-bold rounded-xl flex items-center gap-2 hover:-translate-y-1 transition-transform shadow-[0_10px_20px_rgba(14,21,40,0.2)]">
                                Detayları İncele <ArrowUpRight className="w-4 h-4"/>
                            </Link>
                            
                            {/* Blue Hand-Drawn Arrow & Text */}
                            <div className="absolute -bottom-20 left-10 hidden sm:flex items-center gap-2 -rotate-6">
                                {/* Hand-drawn curved arrow SVG pointing to button */}
                                <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                    <path d="M90 90C70 80 50 40 30 10M30 10L50 15M30 10L25 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="font-['Caveat',cursive] text-blue-600 font-bold text-lg rotate-6 mt-10">
                                    Building Enterprise Growth: <br/>An Efficient Blueprint
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Hero Image & Overlays) */}
                    <div className="relative mt-20 lg:mt-0 pl-10">
                        {/* Green floating cube icon */}
                        <div className="absolute top-1/4 -left-6 z-20 w-12 h-12 bg-[#B4F23B] rounded-xl flex items-center justify-center shadow-lg">
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        </div>

                        {/* Top Right Floating Box */}
                        <div className="absolute -top-6 right-6 z-20 bg-white rounded-2xl p-3 px-5 shadow-[0_15px_30px_rgba(0,0,0,0.08)] flex items-center gap-4">
                            <div className="flex -space-x-3">
                                <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-2 border-white relative z-30" alt="User" />
                                <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-2 border-white relative z-20" alt="User" />
                                <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-2 border-white relative z-10" alt="User" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#0E1528] leading-tight">150,000+</p>
                                <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Aktif Kullanıcı</p>
                            </div>
                        </div>

                        {/* Main Image Base */}
                        <div className="rounded-3xl overflow-hidden aspect-[4/4] relative shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80" alt="İş İnsanı" className="w-full h-full object-cover" />
                            
                            {/* Dark gradient for text visibility at bottom */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                            {/* White Pills Bottom Left inside image */}
                            <div className="absolute bottom-8 left-8 flex flex-col gap-3 items-start">
                                <div className="bg-white backdrop-blur-md px-5 py-2.5 rounded-full text-slate-800 text-sm font-bold shadow-lg">Stok Takibi</div>
                                <div className="bg-white backdrop-blur-md px-5 py-2.5 rounded-full text-slate-800 text-sm font-bold shadow-lg">Ön Muhasebe</div>
                                <div className="bg-white backdrop-blur-md px-5 py-2.5 rounded-full text-slate-800 text-sm font-bold shadow-lg">Sipariş Yönetimi</div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* --- 3. SOCIAL PROOF (image_1.png) --- */}
            <section className="py-24 max-w-[1000px] mx-auto px-6 text-center relative z-10">
                {/* Right faint 3D geometric shape */}
                <div className="absolute right-[-20%] top-[-50%] w-[400px] h-[400px] opacity-[0.15] bg-blue-200 rotate-12 rounded-[60px] pointer-events-none"></div>

                <h2 className="text-3xl md:text-4xl font-bold text-[#0E1528] mb-3">150,000+ Şirketin Güvendiği ERP</h2>
                <p className="text-slate-500 mb-14 font-medium">Büyük hacimli e-ticaret siteleri Periodya ile çalışıyor — sizin de işinize yarayacak.</p>
                
                <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">
                    <span className="font-black text-2xl text-[#0E1528] flex items-center gap-2"><div className="w-5 h-5 bg-orange-500 rounded-full"></div>Trendyol</span>
                    <span className="font-black text-2xl text-[#0E1528] flex items-center gap-2"><div className="w-5 h-5 bg-orange-400 rounded-lg"></div>Hepsiburada</span>
                    <span className="font-black text-2xl text-[#0E1528] flex items-center gap-2"><div className="w-5 h-5 bg-blue-600 rounded-sm"></div>Akbank</span>
                    <span className="font-black text-2xl text-[#0E1528] flex items-center gap-2"><div className="w-5 h-5 bg-green-500 rounded-sm"></div>Garanti</span>
                    <span className="font-black text-2xl text-[#0E1528] flex items-center gap-2"><div className="w-5 h-5 bg-purple-600 rounded-full"></div>Gittigidiyor</span>
                </div>
            </section>

            {/* --- 4. TESTIMONIAL BENTO GRID (image_3&4 layout adapted) --- */}
            <section className="py-24 max-w-[1300px] mx-auto px-6 relative z-10">
                
                {/* Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div className="max-w-xl">
                        <h2 className="text-2xl md:text-4xl font-bold text-[#0E1528] leading-[1.1] mb-2">
                            Kusursuz entegrasyon ile <br/>operasyonlarınızı <span className="text-[#0E1528]">hızlandırın</span>
                        </h2>
                        <p className="text-slate-500 font-medium">Gerçek müşterilerimizden dürüst geri bildirimler.</p>
                    </div>
                    <div className="mt-6 md:mt-0">
                        <Link href="#" className="px-6 py-3 bg-[#2563EB] text-white font-bold rounded-lg flex items-center gap-2">
                            Tüm Yorumlar <ArrowUpRight className="w-4 h-4"/>
                        </Link>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Top Left: Wide Image Card */}
                    <div className="md:col-span-8 h-[320px] rounded-[32px] overflow-hidden relative shadow-lg">
                        <img src="https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&w=800&q=80" alt="User Smiling" className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                            <h3 className="text-white text-3xl font-bold mb-1">E-Ticaret Yönetimi</h3>
                            <p className="text-white/80 text-sm font-medium">Entegrasyon, Depo, Fatura</p>
                        </div>
                        <div className="absolute bottom-8 right-8 bg-black/50 backdrop-blur text-white px-4 py-1.5 rounded-full text-sm font-bold">1 / 3</div>
                    </div>

                    {/* Top Right: Vertical Info Card */}
                    <div className="md:col-span-4 h-[320px] rounded-[32px] overflow-hidden relative shadow-lg">
                        <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" alt="Focus" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10 flex flex-col justify-end p-8">
                            <h3 className="text-white text-5xl font-bold mb-2">%98.2</h3>
                            <p className="text-white/90 text-sm font-medium leading-relaxed">Kullanıcılarımız Periodya entegrasyonu sayesinde süreçlerini iyileştirdi.</p>
                        </div>
                    </div>

                    {/* Bottom Left: Cyan Card */}
                    <div className="md:col-span-5 h-[320px] rounded-[32px] bg-[#A8F0FF] p-8 flex flex-col justify-between shadow-lg">
                        <div className="flex -space-x-2">
                            <img src="https://i.pravatar.cc/100?img=4" className="w-12 h-12 rounded-full border-2 border-[#A8F0FF]" alt="User" />
                            <img src="https://i.pravatar.cc/100?img=5" className="w-12 h-12 rounded-full border-2 border-[#A8F0FF]" alt="User" />
                            <img src="https://i.pravatar.cc/100?img=6" className="w-12 h-12 rounded-full border-2 border-[#A8F0FF]" alt="User" />
                        </div>
                        <div>
                            <h3 className="text-[#0E1528] text-5xl md:text-6xl font-black leading-none mb-2">10x</h3>
                            <p className="text-[#0E1528]/80 text-base md:text-lg font-medium italic leading-tight">Zaman tasarrufu sağlayan kusursuz entegrasyon altyapısı.</p>
                        </div>
                    </div>

                    {/* Bottom Right: Gray Testimonial Card */}
                    <div className="md:col-span-7 h-[320px] rounded-[32px] bg-[#EAECEF] p-10 flex flex-col justify-between shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-[#0E1528]">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"><Check className="w-4 h-4 text-white"/></div>
                                <span className="font-black text-xl">ABC KİMYA</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm text-slate-300">
                                <div className="w-2 h-2 rounded-full bg-slate-400"></div><div className="w-2 h-2 rounded-full bg-slate-400"></div>
                            </div>
                        </div>
                        
                        <p className="text-[#0E1528] text-[22px] font-medium italic leading-relaxed mb-6">
                            "Tüm pazar yerlerini tek bir yerden yönetmek harika. Stoklarımız artık hiç karışmıyor. Operasyonel yükümüz inanılmaz hafifledi."
                        </p>
                        
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-3">
                                <img src="https://i.pravatar.cc/100?img=7" className="w-12 h-12 rounded-full" alt="Ahmet Y." />
                                <div>
                                    <h4 className="font-bold text-[#0E1528]">Ahmet Y.</h4>
                                    <p className="text-xs font-semibold text-slate-500">Şirket Sahibi</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="text-[40px] font-bold text-[#0E1528] leading-none mb-1">4.9</h3>
                                <div className="flex gap-0.5 text-orange-500 justify-end mb-1">
                                    <Star className="w-4 h-4 fill-orange-500" /><Star className="w-4 h-4 fill-orange-500" /><Star className="w-4 h-4 fill-orange-500" /><Star className="w-4 h-4 fill-orange-500" /><Star className="w-4 h-4 fill-orange-500" />
                                </div>
                                <p className="text-xs text-slate-500 font-semibold">(10k+ Yorum)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 5. DATA / STATS SECTION (image_5.png layout) --- */}
            <section className="py-24 max-w-[1300px] mx-auto px-6 z-10 relative">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    
                    {/* Left Photo & Arrow */}
                    <div className="relative">
                        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80" alt="Team checking laptop" className="rounded-[32px] w-full shadow-2xl" />
                        
                        <div className="absolute -bottom-16 left-20 hidden md:flex items-center gap-2">
                             {/* Hand-drawn arrow up-left SVG */}
                            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600 rotate-180">
                                <path d="M10 90C30 80 50 40 70 10M70 10L50 15M70 10L75 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="font-['Caveat',cursive] text-blue-600 font-bold text-[20px] leading-tight">
                                An Efficient Path to <br/>enterprise Growth
                            </span>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="lg:pl-10">
                        <h2 className="text-3xl md:text-4xl font-black text-[#0E1528] leading-tight mb-6">
                            Periodya ile Operasyonel Verimliliğinizi %50 Artırın.
                        </h2>
                        <p className="text-[#0E1528]/70 text-lg font-medium leading-relaxed mb-12">
                            Odak noktamız sadece özellikler sunmak değil, kullanıcı faydası yaratmaktır: şirketinizin tüm süreçlerinde size tam kontrol sağlıyoruz. Bu, tüm e-ticaret markaları için devrim niteliğinde.
                        </p>

                        <div className="space-y-10">
                            {/* Stat 1 */}
                            <div className="flex gap-6 items-start">
                                <h3 className="text-4xl md:text-5xl font-black text-[#0E1528] leading-none whitespace-nowrap">5.2m</h3>
                                <div>
                                    <p className="text-[#0E1528]/70 font-medium mb-3">Ortak başarı vizyonumuzda bize güvenen işletmeler üzerinden geçen başarılı işlem hacmi.</p>
                                    <Link href="#" className="text-[#0E1528] font-bold text-sm flex items-center gap-1 hover:text-blue-600">Read more <ArrowUpRight className="w-3 h-3" /></Link>
                                </div>
                            </div>
                            
                            {/* Stat 2 */}
                            <div className="flex gap-6 items-start">
                                <h3 className="text-4xl md:text-5xl font-black text-[#0E1528] leading-none whitespace-nowrap">3.1k</h3>
                                <div>
                                    <p className="text-[#0E1528]/70 font-medium mb-3">Türkiye çapında kesintisiz hizmet alan ve operasyonlarını yöneten aktif e-ticaret mağazası.</p>
                                    <Link href="#" className="text-[#0E1528] font-bold text-sm flex items-center gap-1 hover:text-blue-600">Read more <ArrowUpRight className="w-3 h-3" /></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 6. FEATURE / VIDEO SECTION (image_6.png layout) --- */}
            <section className="py-24 z-10 relative">
                {/* Yellowish full-width background box */}
                <div className="absolute inset-0 bg-[#FAFAEE] border-y border-[#F3F4E6] -z-10"></div>
                
                <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center py-20">
                    
                    {/* Left Content */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0E1528] leading-tight mb-6">
                            Operasyonlarınızı Anlayın, Müşterilerinizi Mutlu Edin
                        </h2>
                        <p className="text-[#0E1528]/70 text-lg font-medium leading-relaxed mb-8">
                            İster yeni bir şirket olun, ister köklü bir kurum; Periodya modern e-ticaret operasyonlarınız üzerinde size tam bağımsızlık tanır.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {[
                                "Bulut Tabanlı Altyapı", "E-Fatura Entegrasyonu", 
                                "Otomatik Stok Güncelleme", "Hızlı Sipariş İşleme", "Kusursuz Veri Mimarisi"
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-semibold text-[#0E1528] shadow-sm">
                                    <Check className="w-4 h-4 text-slate-800" /> {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Video Image */}
                    <div className="relative rounded-[24px] overflow-hidden shadow-2xl cursor-pointer group">
                        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80" alt="Students/Startup team" className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 fill-[#0E1528] text-[#0E1528] ml-2" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- NEW 8-CARD FLEX GRID (Makes Us Different) --- */}
            <section className="py-24 max-w-[1300px] mx-auto px-6 relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-[#0E1528] mb-4">
                        Bizi <span className="text-blue-600">Farklı Kılan</span> Özellikler.
                    </h2>
                    <p className="text-slate-500 font-medium leading-relaxed">Sürekli yenilikçi teknolojilerle ön saflarda yer almaktan, sınırları yeniden tanımlamaktan ve e-ticaret dijital dünyasını birlikte şekillendirmekten gurur duyuyoruz.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1 */}
                    <div className="bg-[#f4f9ff] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#dee9f9] pointer-events-none select-none">01</span>
                        <div className="mb-6 z-10"><Bot className="w-9 h-9 text-[#5c8af0]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">YZ Destekli Analiz</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Ön muhasebenizde yapay zekanın hızını ve kusursuzluğunu hissedin.</p>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-[#fff9f0] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#f7eadd] pointer-events-none select-none">02</span>
                        <div className="mb-6 z-10"><PieChart className="w-9 h-9 text-[#fc9d36]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Derin İçgörüler</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Pazar yerlerindeki satış trendlerinizi anlık ve net raporlarla takip edin.</p>
                    </div>
                    {/* Card 3 */}
                    <div className="bg-[#f0fff9] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#dbf5eb] pointer-events-none select-none">03</span>
                        <div className="mb-6 z-10"><Activity className="w-9 h-9 text-[#30b583]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Stratejik Kararlar</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Gerçek verilere dayalı altyapımızla doğru zamanda en iyi ticaret kararını alın.</p>
                    </div>
                    {/* Card 4 */}
                    <div className="bg-[#f9f4ff] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#efe1ff] pointer-events-none select-none">04</span>
                        <div className="mb-6 z-10"><Users className="w-9 h-9 text-[#a75ff5]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">İşbirliği Araçları</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Ekibinizle aynı panelde uyum içerisinde rolleri dağıtarak çalışın.</p>
                    </div>
                    {/* Card 5 */}
                    <div className="bg-[#fff0f4] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#f9dce4] pointer-events-none select-none">05</span>
                        <div className="mb-6 z-10"><Shield className="w-9 h-9 text-[#e8517e]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Veri Koruması</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">KVKK standartlarına tam uyumlu yüksek şifrelemelerle verilerinizi koruyun.</p>
                    </div>
                    {/* Card 6 */}
                    <div className="bg-[#eef9f4] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#d0ede0] pointer-events-none select-none">06</span>
                        <div className="mb-6 z-10"><Headphones className="w-9 h-9 text-[#2bae77]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">7/24 Teknik Destek</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Uzman kadromuzla mağazanızın operasyonlarında asla yarı yolda kalmayın.</p>
                    </div>
                    {/* Card 7 */}
                    <div className="bg-[#f4f2ea] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#eadac6] pointer-events-none select-none">07</span>
                        <div className="mb-6 z-10"><Target className="w-9 h-9 text-[#b28b5e]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Gelişmiş Cari CRM</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Tüm tedarikçi ağınızı tek bir listede puanınıza göre otonom olarak yönetin.</p>
                    </div>
                    {/* Card 8 */}
                    <div className="bg-[#f0f4f8] rounded-[24px] p-8 relative flex flex-col items-start overflow-hidden hover:-translate-y-1 transition duration-300">
                        <span className="absolute top-4 right-4 text-5xl font-black text-[#dde5ee] pointer-events-none select-none">08</span>
                        <div className="mb-6 z-10"><Cloud className="w-9 h-9 text-[#51769d]" strokeWidth={1.5} /></div>
                        <h3 className="text-[19px] font-bold text-[#0E1528] mb-3 z-10">Premium Bulut</h3>
                        <p className="text-[13px] font-medium text-slate-500 z-10 leading-[1.6]">Sunucu veya kurulum olmadan güvenle anında her cihazdan işinize erişin.</p>
                    </div>
                </div>
            </section>

            {/* --- 7. PRICING --- */}
            <section className="py-32 max-w-[1300px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl font-black text-[#0E1528] mb-4">Esnek Fiyatlandırma</h2>
                    <p className="text-slate-500 font-medium">Büyüme hızınıza ayak uyduran paketler.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Basic */}
                    <div className="bg-white border border-slate-200 rounded-[32px] p-10 flex flex-col shadow-sm">
                        <h3 className="text-2xl font-bold text-[#0E1528] mb-2">Başlangıç</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Küçük işletmeler için pazar yeri.</p>
                        <div className="mb-8 font-black text-[#0E1528] text-4xl">₺990<span className="text-sm text-slate-500 font-semibold">/ay</span></div>
                        <button className="w-full py-4 rounded-xl font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors mb-10">14 Gün Deneyin</button>
                        <ul className="space-y-4 text-slate-600 font-medium">
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-600 shrink-0"/> Sınırlı Pazar Yeri</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-600 shrink-0"/> Stok Takibi</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-600 shrink-0"/> E-Fatura</li>
                        </ul>
                    </div>

                    {/* Pro (Highlighted) */}
                    <div className="bg-[#2563EB] text-white rounded-[32px] p-10 flex flex-col shadow-2xl relative transform lg:-translate-y-4 border-4 border-blue-400/30">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#B4F23B] text-[#0E1528] font-black uppercase text-xs px-4 py-2 rounded-full shadow-lg">📈 En Popüler</div>
                        <h3 className="text-2xl font-bold mb-2 mt-2">Profesyonel</h3>
                        <p className="text-blue-200 text-sm font-medium mb-8">E-Ticarette büyüyenler için.</p>
                        <div className="mb-8 font-black text-4xl">₺2,490<span className="text-sm text-blue-300 font-semibold">/ay</span></div>
                        <button className="w-full py-4 rounded-xl font-bold bg-white text-blue-600 hover:bg-slate-50 transition-colors mb-10 shadow-lg">14 Gün Deneyin</button>
                        <ul className="space-y-4 font-medium">
                            <li className="flex gap-3"><Check className="w-5 h-5 shrink-0"/> Sınırsız Pazar Yeri</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 shrink-0"/> Çoklu Depo Yönetimi</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 shrink-0"/> Kargo Entegrasyonu</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 shrink-0"/> Detaylı Raporlama</li>
                        </ul>
                    </div>

                    {/* Enterprise */}
                    <div className="bg-white border border-slate-200 rounded-[32px] p-10 flex flex-col shadow-sm">
                        <h3 className="text-2xl font-bold text-[#0E1528] mb-2">Kurumsal</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Özel sunucu ihtiyaçları için.</p>
                        <div className="mb-8 font-black text-[#0E1528] text-4xl">Özel<span className="text-sm text-slate-500 font-semibold">/yıllık</span></div>
                        <button className="w-full py-4 rounded-xl font-bold border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors mb-10">İletişime Geçin</button>
                        <ul className="space-y-4 text-slate-600 font-medium">
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-600 shrink-0"/> VDS Sunucu</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-600 shrink-0"/> Sıfırdan Veri Aktarımı</li>
                            <li className="flex gap-3"><Check className="w-5 h-5 text-blue-600 shrink-0"/> Özel Eğitim & SLA</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- 8. FOOTER (image_6.png) --- */}
            <footer className="bg-[#0b0c10] text-slate-400 pt-24 pb-12 mt-10 rounded-t-[40px]">
                <div className="max-w-[1300px] mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
                        {/* 1. Column - Brand */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">P</div>
                                <span className="text-2xl font-bold text-white tracking-tight">Periodya</span>
                            </div>
                            <div className="space-y-4 font-semibold text-lg text-white mb-10">
                                <p>0850 123 45 67</p>
                                <p>merhaba@periodya.com</p>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-4">E-Bültene Abone Olun</h4>
                                <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                                    <input type="email" placeholder="E-posta adresi" className="bg-transparent border-none text-white px-4 py-2 w-full focus:outline-none" />
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700 transition-colors">Gönder</button>
                                </div>
                            </div>
                        </div>

                        {/* Menus */}
                        <div>
                            <h4 className="text-white font-bold text-lg mb-6">Navigasyon</h4>
                            <ul className="space-y-4 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pazar Yerleri</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg mb-6">Destek</h4>
                            <ul className="space-y-4 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">S.S.S.</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-lg mb-6">Şirket</h4>
                            <ul className="space-y-4 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="font-medium text-sm">© {new Date().getFullYear()} Periodya Yazılım. Tüm hakları saklıdır.</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Facebook className="w-4 h-4"/></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Twitter className="w-4 h-4"/></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Instagram className="w-4 h-4"/></a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Linkedin className="w-4 h-4"/></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
