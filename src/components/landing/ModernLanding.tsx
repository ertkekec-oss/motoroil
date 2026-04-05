"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Search, Moon, Sun, ArrowRight, CheckCircle2, 
    Star, Play, PlayCircle, Facebook, Twitter, 
    Linkedin, Instagram, Mail, Phone, ChevronRight
} from 'lucide-react';

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState('light'); // Mock theme state

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-600 selection:text-white overflow-x-hidden">
            
            {/* 1. HEADER */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-white py-6'}`}>
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo & Links */}
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">
                                P
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900">Periodya</span>
                        </div>

                        <nav className="hidden lg:flex items-center gap-8 font-semibold text-[15px] text-slate-600">
                            <Link href="#" className="hover:text-blue-600 transition-colors">Demo</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Özellikler</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Pazar Yerleri</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Hakkımızda</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">İletişim</Link>
                        </nav>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        <button className="text-slate-500 hover:text-blue-600 transition-colors hidden sm:block">
                            <Search className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <Link href="/register" className="hidden sm:flex px-6 py-2.5 bg-blue-600 text-white text-[15px] font-bold rounded-lg hover:bg-blue-700 transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                            Ücretsiz Dene
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION */}
            <section className="pt-40 lg:pt-48 pb-20 max-w-[1400px] mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
                    
                    {/* Left Copy */}
                    <div className="max-w-xl">
                        <h1 className="text-5xl lg:text-[64px] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                            Periodya ile E-Ticaret ve Muhasebede <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Üstün Sonuçlar</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10">
                            Pazar yerleri ve ön muhasebenizi tek panelden, yorulmadan yönetin.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 relative">
                            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-[0_10px_30px_rgba(37,99,235,0.25)] hover:-translate-y-1 transition-all z-10 text-center">
                                14 Gün Ücretsiz Dene
                            </Link>
                            <Link href="#" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-xl shadow-lg hover:-translate-y-1 transition-all z-10 text-center">
                                Detayları İncele
                            </Link>
                            
                            {/* Hand arrow pointer */}
                            <div className="hidden md:flex absolute -bottom-16 left-10 items-center gap-4 animate-bounce">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500 -rotate-45">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="font-['Caveat',cursive] text-lg font-bold text-blue-600 -rotate-3">Building Enterprise Growth: An Efficient Blueprint</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Image Layout */}
                    <div className="relative">
                        <div className="rounded-[32px] overflow-hidden shadow-2xl relative bg-slate-100 aspect-[4/3] max-w-xl ml-auto">
                            <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="İş insanı laptop başında" className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Green Overlay Simge */}
                        <div className="absolute top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce" style={{animationDuration: '4s'}}>
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Pazar Yeri Entegrasyonları</p>
                                <p className="text-sm font-black text-slate-800">Trendyol, Hepsiburada</p>
                            </div>
                        </div>

                        {/* Top Right Avatar Box */}
                        <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl z-10">
                            <div className="flex -space-x-3 mb-2">
                                <img className="w-10 h-10 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=1" alt="U" />
                                <img className="w-10 h-10 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=2" alt="U" />
                                <img className="w-10 h-10 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=3" alt="U" />
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">+</div>
                            </div>
                            <p className="text-lg font-black text-slate-900">150,000+</p>
                            <p className="text-sm font-semibold text-slate-500">Aktif Kullanıcı</p>
                        </div>

                        {/* Bottom Oval Tags */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 w-full">
                            <span className="px-5 py-2.5 bg-yellow-400 text-yellow-900 font-bold rounded-full shadow-lg text-sm rotate-2">Stok Takibi</span>
                            <span className="px-5 py-2.5 bg-blue-500 text-white font-bold rounded-full shadow-lg text-sm -rotate-2">Ön Muhasebe</span>
                            <span className="px-5 py-2.5 bg-rose-500 text-white font-bold rounded-full shadow-lg text-sm rotate-3">Sipariş Yönetimi</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. SOCIAL PROOF (Logos with Big 'P') */}
            <section className="py-20 relative overflow-hidden bg-slate-50 mt-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-black text-slate-200/50 -z-10 leading-none select-none">P</div>
                
                <div className="max-w-[1400px] mx-auto px-6 text-center z-10 relative">
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-12">150,000+ Şirketin Güvendiği ERP</h2>
                    
                    <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                        {/* Mock Logos */}
                        <span className="text-3xl font-black text-slate-800">Trendyol</span>
                        <span className="text-3xl font-black text-slate-800">Hepsiburada</span>
                        <span className="text-3xl font-black text-rose-600">Akbank</span>
                        <span className="text-3xl font-black text-blue-800">İş Bankası</span>
                        <span className="text-3xl font-black text-slate-800">N11</span>
                    </div>
                </div>
            </section>

            {/* 4. BENEFIT / TESTIMONIAL CARDS */}
            <section className="py-24 max-w-[1200px] mx-auto px-6 relative">
                <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Top/Left Card: Smiling User */}
                    <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] lg:aspect-auto h-full">
                        <img src="https://images.unsplash.com/photo-1542596594-649edbc13630?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Gülümseyen Kullanıcı" className="w-full h-full object-cover" />
                        
                        {/* Overlays */}
                        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-5 py-3 rounded-2xl shadow-lg">
                            <p className="font-black text-lg text-slate-900">%98 Kullanıcı Memnuniyeti</p>
                        </div>
                        <div className="absolute bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl">
                            <p className="font-bold text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Kusursuz Entegrasyon</p>
                        </div>
                    </div>

                    {/* Bottom/Right Card: Big Testimonial */}
                    <div className="bg-blue-50 rounded-[32px] p-10 lg:p-14 border border-blue-100 flex flex-col justify-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                            E-Ticaret Operasyonlarımızı Periodya ile <span className="text-blue-600">10 Kat Hızlandırdık</span>
                        </h2>
                        
                        <p className="text-xl lg:text-2xl text-slate-600 font-medium italic mb-12 relative leading-relaxed">
                            <span className="text-6xl text-blue-200 absolute -top-8 -left-4">"</span>
                            Tüm pazar yerlerini tek yerden yönetmek harika. Stoklarımız artık hiç karışmıyor. Manuel fatura kesme derdimiz de bitti!
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <img src="https://i.pravatar.cc/100?img=11" alt="Ahmet Y." className="w-14 h-14 rounded-full border-2 border-white shadow-md"/>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Ahmet Y.</h4>
                                    <p className="text-sm font-semibold text-slate-500">ABC Ltd. Şti. Sahibi</p>
                                </div>
                            </div>
                            <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-800 flex items-center gap-2">
                                4.9/5 <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> <span className="text-slate-400 text-sm">(10k+ Yorum)</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 5. DATA / STATS SECTION */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                {/* BG Geometric figure */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

                <div className="max-w-[1400px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    
                    {/* Left Photo */}
                    <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] shadow-2xl border border-slate-700">
                        <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Ekip Çalışıyor" className="w-full h-full object-cover" />
                    </div>

                    {/* Right Info */}
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-10 leading-[1.1] tracking-tight">
                            Periodya ile Operasyonel Verimliliğinizi <span className="text-blue-400">%50 Artırın</span>
                        </h2>
                        
                        <div className="flex flex-col sm:flex-row gap-10">
                            <div className="border-l-4 border-blue-500 pl-6">
                                <p className="text-5xl font-black mb-2">5.2m</p>
                                <p className="text-lg text-slate-400 font-semibold">Tamamlanan Sipariş</p>
                            </div>
                            <div className="border-l-4 border-yellow-400 pl-6">
                                <p className="text-5xl font-black mb-2">3.1k</p>
                                <p className="text-lg text-slate-400 font-semibold">Aktif Mağaza</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* 6. FEATURE / DEMO VIDEO */}
            <section className="py-24 max-w-[1400px] mx-auto px-6">
                <div className="bg-[#FFFAEE] rounded-[40px] p-10 lg:p-16 border border-yellow-100 flex flex-col lg:flex-row items-center gap-16 shadow-lg relative overflow-hidden">
                    
                    {/* Left Features */}
                    <div className="flex-1 lg:max-w-xl relative w-full">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-10 leading-tight">
                            Operasyonlarınızı Anlayın, Müşterilerinizi Mutlu Edin
                        </h2>
                        
                        <ul className="space-y-6">
                            {[
                                'Bulut Tabanlı Altyapı',
                                'E-Fatura Entegrasyonu',
                                'Otomatik Stok Güncelleme',
                                'Hızlı Sipariş İşleme'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-4 text-xl font-bold text-slate-700">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Photo/Video */}
                    <div className="flex-1 w-full relative group cursor-pointer">
                        <div className="rounded-[32px] overflow-hidden shadow-2xl aspect-[4/3] relative">
                            <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Gençler laptop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                            
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur px-8 py-4 rounded-full flex items-center gap-3 font-bold text-slate-900 shadow-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <PlayCircle className="w-8 h-8" /> <span>Demo Videoyu İzle</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. PRICING */}
            <section className="py-24 bg-white max-w-[1400px] mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6">Şeffaf Fiyatlandırma</h2>
                    <p className="text-xl text-slate-500 font-medium">Büyümenize ayak uyduran esnek planlar.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                    
                    {/* Basic */}
                    <div className="rounded-[32px] border border-slate-200 p-10 bg-white">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Başlangıç</h3>
                        <p className="text-slate-500 mb-8 font-medium">Küçük işletmeler için.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-slate-900">₺990</span><span className="text-slate-500">/ay</span>
                        </div>
                        <button className="w-full py-4 rounded-xl font-bold border-2 border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors mb-10">14 Gün Deneyin</button>
                        <ul className="space-y-4">
                            {['Ön Muhasebe Temel', 'E-Fatura Paketi', '1 Pazar Yeri', 'Otomatik Stok'].map((f,i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-semibold"><CheckCircle2 className="w-5 h-5 text-slate-300"/>{f}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Pro */}
                    <div className="rounded-[32px] border-2 border-blue-600 p-10 bg-blue-600 text-white relative transform lg:-translate-y-4 shadow-2xl shadow-blue-600/30">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-1 shadow-lg">
                            📈 En Popüler
                        </div>
                        <h3 className="text-2xl font-bold mb-2 mt-2">Profesyonel</h3>
                        <p className="text-blue-200 mb-8 font-medium">Büyüyen şirketler için.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-white">₺2,490</span><span className="text-blue-200">/ay</span>
                        </div>
                        <button className="w-full py-4 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors mb-10 shadow-lg">14 Gün Deneyin</button>
                        <ul className="space-y-4">
                            {['Tüm Başlangıç Özellikleri', 'Sınırsız Pazar Yeri', 'Çoklu Depo Yönetimi', 'B2B Sipariş Ağı', 'Gelişmiş Raporlar'].map((f,i) => (
                                <li key={i} className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-blue-300"/>{f}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Enterprise */}
                    <div className="rounded-[32px] border border-slate-200 p-10 bg-white">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Kurumsal</h3>
                        <p className="text-slate-500 mb-8 font-medium">Özel sunucu isteyenler.</p>
                        <div className="mb-8">
                            <span className="text-5xl font-black text-slate-900">Özel</span><span className="text-slate-500">/yıllık</span>
                        </div>
                        <button className="w-full py-4 rounded-xl font-bold border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors mb-10">Bize Ulaşın</button>
                        <ul className="space-y-4">
                            {['Özel API Bağlantıları', 'Dedicated Sunucu', 'Özel SLA Desteği', 'Yerinde Eğitim'].map((f,i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-semibold"><CheckCircle2 className="w-5 h-5 text-slate-300"/>{f}</li>
                            ))}
                        </ul>
                    </div>

                </div>
            </section>

            {/* 8. FOOTER */}
            <footer className="bg-[#0A1128] text-white pt-24 pb-12 mt-10">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20 relative">
                        {/* Column 1 */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl">P</div>
                                <span className="text-2xl font-black tracking-tight">Periodya</span>
                            </div>
                            <div className="space-y-4 text-slate-400 font-medium">
                                <p className="flex items-center gap-3"><Phone className="w-5 h-5"/> 0850 123 45 67</p>
                                <p className="flex items-center gap-3"><Mail className="w-5 h-5"/> merhaba@periodya.com</p>
                            </div>
                            
                            <div className="mt-10">
                                <h4 className="font-bold mb-4">E-Bültene Kayıt Ol</h4>
                                <div className="flex">
                                    <input type="email" placeholder="E-posta adresiniz" className="px-4 py-3 rounded-l-lg bg-white/10 border border-white/20 text-white w-full focus:outline-none focus:border-blue-500" />
                                    <button className="bg-blue-600 px-4 py-3 rounded-r-lg hover:bg-blue-500 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div>
                            <h4 className="font-bold text-lg mb-6">Navigasyon</h4>
                            <ul className="space-y-4 text-slate-400 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pazar Yerleri</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div>
                            <h4 className="font-bold text-lg mb-6">Destek</h4>
                            <ul className="space-y-4 text-slate-400 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">S.S.S.</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API Dokümantasyon</a></li>
                            </ul>
                        </div>

                        {/* Column 4 */}
                        <div>
                            <h4 className="font-bold text-lg mb-6">Şirket</h4>
                            <ul className="space-y-4 text-slate-400 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-slate-500 font-medium text-sm">
                            &copy; {new Date().getFullYear()} Periodya Yazılım A.Ş. Tüm hakları saklıdır.
                        </p>
                        <div className="flex items-center gap-4 text-slate-400">
                            <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
