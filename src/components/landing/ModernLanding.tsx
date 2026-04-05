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
    Zap,
    Building2,
    Store,
    LayoutDashboard,
    Lock,
    Globe,
    Smartphone
} from 'lucide-react';

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
            {/* Dotted Grid Background */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
            
            {/* Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none z-0"></div>
            <div className="fixed top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-lime-300/10 blur-[100px] pointer-events-none z-0"></div>

            {/* Header / Navbar */}
            <header className={`fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 transition-all duration-300 rounded-[24px] ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 py-3 px-6' : 'bg-transparent py-4 px-6'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                            P
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight text-slate-900">Periodya</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-8 bg-slate-50/50 px-6 py-2.5 rounded-full border border-slate-200/60 backdrop-blur-sm">
                        <Link href="#features" className="text-[13px] font-bold text-slate-600 hover:text-blue-600 transition-colors">Özellikler</Link>
                        <Link href="#solutions" className="text-[13px] font-bold text-slate-600 hover:text-blue-600 transition-colors">B2B Çözümler</Link>
                        <Link href="/pricing" className="text-[13px] font-bold text-slate-600 hover:text-blue-600 transition-colors">Fiyatlandırma</Link>
                        <Link href="/help" className="text-[13px] font-bold text-slate-600 hover:text-blue-600 transition-colors">Destek Merkez</Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:block text-[13px] font-bold text-slate-700 hover:text-blue-600 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Giriş Yap</Link>
                        <Link href="/register" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5">
                            Hemen Başla
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-40 pb-20 lg:pt-52 lg:pb-32 relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 text-xs font-bold uppercase tracking-widest mb-10 hover:-translate-y-1 transition-transform cursor-default">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
                        </span>
                        Periodya 2.0 Yayında
                    </div>
                    
                    <h1 className="text-5xl lg:text-[80px] font-extrabold text-slate-900 tracking-tighter leading-[1.05] mb-8">
                        İşletmenizi dijitalleştirin, <br className="hidden lg:block"/>
                        <span className="text-blue-600">
                            sınırları kaldırın.
                        </span>
                    </h1>
                    
                    <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
                        Muhasebe, B2B sipariş yönetimi, fiziki stok takibi, e-dönüşüm ve saha satış operasyonlarınızı tek bir platformda toplayın.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto px-8 py-4.5 h-[56px] bg-slate-900 hover:bg-black text-white text-base font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 hover:-translate-y-1">
                            Platforma Katıl <ArrowRight className="w-5 h-5"/>
                        </Link>
                        <Link href="#demo" className="w-full sm:w-auto px-8 py-4.5 h-[56px] bg-white hover:bg-slate-50 text-slate-700 text-base font-bold rounded-2xl transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2 hover:-translate-y-1">
                            Satış Ekibiyle Görüş
                        </Link>
                    </div>
                </div>

                {/* Dashboard Floating Interface Mockup */}
                <div className="max-w-[1200px] mx-auto px-6 mt-20 relative">
                    {/* Floating elements */}
                    <div className="absolute -top-10 -left-10 lg:-left-20 bg-white p-4 rounded-[24px] shadow-2xl border border-slate-100 z-20 animate-bounce" style={{animationDuration: '4s'}}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-lime-600" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Aylık Büyüme</p>
                                <p className="text-xl font-black text-slate-900">+ %124.5</p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-20 -right-10 lg:-right-16 bg-white p-4 rounded-[24px] shadow-2xl border border-slate-100 z-20 animate-bounce" style={{animationDuration: '5s', animationDelay: '1s'}}>
                         <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">P1</div>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-600">P2</div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">+9</div>
                            </div>
                            <div>
                                <p className="text-[12px] font-bold text-slate-900 leading-tight">Yüzlerce işletme<br/><span className="text-slate-500">bizimle büyüyor</span></p>
                            </div>
                         </div>
                    </div>

                    {/* Main UI Mockup */}
                    <div className="rounded-[32px] bg-white border border-slate-200 shadow-[0_20px_50px_rgb(0,0,0,0.05)] p-4 ring-1 ring-slate-900/5 overflow-hidden relative">
                         {/* Window Controls */}
                         <div className="flex items-center gap-2 px-2 pb-4 pt-1">
                             <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                             <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                             <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                         </div>
                         
                         <div className="w-full bg-[#f8fafc] rounded-[24px] border border-slate-100 overflow-hidden flex h-[500px]">
                            {/* Mock Sidebar */}
                            <div className="w-64 border-r border-slate-200 bg-white p-6 hidden md:flex flex-col gap-6">
                                <div className="h-4 w-24 bg-slate-200 rounded-lg mb-4"></div>
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex items-center gap-4 w-full">
                                        <div className="h-5 w-5 bg-slate-200 rounded-md"></div>
                                        <div className="h-3 w-full bg-slate-100 rounded-md"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Mock Content */}
                            <div className="flex-1 p-8 flex flex-col gap-8 bg-[#FAFAFA]">
                                <div className="flex justify-between items-center bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
                                    <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
                                    <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    {[1,2,3].map(i => (
                                      <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-[100%]"></div>
                                        <div className="h-4 w-16 bg-slate-100 rounded-md mb-4"></div>
                                        <div className="h-10 w-32 bg-slate-800 rounded-lg"></div>
                                      </div>
                                    ))}
                                </div>
                                <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm p-8">
                                    <div className="h-4 w-64 bg-slate-200 rounded-md mb-8"></div>
                                    <div className="space-y-5">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </main>

            {/* Clients */}
            <section className="py-10 border-b border-slate-200 bg-white/50 backdrop-blur-xl relative z-10">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">Türkiye'nin dijital altyapılarına tam entegrasyon</p>
                    <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">e-Defter</div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">Trendyol</div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">Hepsiburada</div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">e-Fatura</div>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">PayTR</div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="py-24 lg:py-32 relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-6">Her ihtiyaca özel mimari.</h2>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">Geleneksel ERP yavaşlığını unutun. Periodya'nın modüler yapısı ile sadece kullandığınız özellikleri görürsünüz.</p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
                        
                        {/* Large Card (Span 2) */}
                        <div className="lg:col-span-2 bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
                           <div className="w-16 h-16 bg-blue-600 text-white rounded-[20px] flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Finans & Ön Muhasebe</h3>
                            <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                                Cari hesaplar, anlık banka entegrasyonu, kasa yönetimi ve e-fatura kesimi tek tık uzağınızda. İşletmenizin nakit akışını x-ray gibi görün.
                            </p>
                            <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-50 rounded-tl-full -z-10 group-hover:bg-blue-100 transition-colors"></div>
                        </div>

                        {/* Standard Card */}
                        <div className="bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                            <div className="w-16 h-16 bg-lime-400 text-lime-900 rounded-[20px] flex items-center justify-center mb-8 shadow-xl shadow-lime-400/20 group-hover:scale-110 transition-transform">
                                <Store className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Çoklu Depo</h3>
                            <p className="text-slate-500 text-base leading-relaxed">
                                Şubeler arası otonom transferler, QR kodlu sayımlar ve e-ticaret stoklarınızın saniyelik senkronizasyonu.
                            </p>
                        </div>

                        {/* Standard Card */}
                        <div className="bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                            <div className="w-16 h-16 bg-purple-500 text-white rounded-[20px] flex items-center justify-center mb-8 shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">İnsan Kaynakları</h3>
                            <p className="text-slate-500 text-base leading-relaxed">
                                Telefon kamerası ile QR okutarak PDKS (giriş-çıkış) takibi, otomatik puantaj ve bordro tahakkuku.
                            </p>
                        </div>
                        
                        {/* Standard Card */}
                         <div className="bg-white rounded-[32px] p-10 border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
                            <div className="w-16 h-16 bg-rose-500 text-white rounded-[20px] flex items-center justify-center mb-8 shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Dijital İmza & Sözleşme</h3>
                            <p className="text-slate-500 text-base leading-relaxed">
                                Çalışan zimmet formları, mutabakat ve sözleşmeleri SMS/MFA entegrasyonlu doğrulama ile %100 yasal şekilde imzalayın.
                            </p>
                        </div>

                        {/* Standard Card */}
                         <div className="bg-slate-900 rounded-[32px] p-10 border border-slate-800 shadow-2xl transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
                            <div className="w-16 h-16 bg-white/10 text-white rounded-[20px] flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                                <Globe className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight">B2B Kendi Pazaryeriniz</h3>
                            <p className="text-slate-300 text-base leading-relaxed relative z-10">
                                Tüm toptancı ve bayi ağınızı tek portala taşıyın. Kendi kapalı devre alışveriş ağınızı anında başlatın.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 relative z-10 px-6">
                <div className="max-w-5xl mx-auto bg-blue-600 rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-600/30">
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900 opacity-20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
                     
                     <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-8 relative z-10">
                        Eski usül yönetime veda edin.<br/>
                        <span className="text-blue-200">Geleceğe hazır mısınız?</span>
                     </h2>
                     <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto mb-12 relative z-10">
                        Hemen ücretsiz kayıt olun, tüm dev entegrasyonlar ve özellikler 14 gün boyunca kullanımınıza açık olsun.
                     </p>

                     <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                        <Link href="/register" className="w-full sm:w-auto px-10 h-[64px] bg-white text-blue-600 text-lg font-extrabold rounded-2xl transition-all shadow-xl hover:bg-slate-50 flex items-center justify-center gap-2 hover:-translate-y-1">
                            Anında Başla <ArrowRight className="w-5 h-5"/>
                        </Link>
                        <Link href="/help" className="w-full sm:w-auto px-10 h-[64px] bg-blue-700/50 hover:bg-blue-700 text-white border border-blue-500 text-lg font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                            Daha Fazla Bilgi
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 pt-20 pb-10 relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-lg">P</div>
                            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Periodya</span>
                        </div>
                        <p className="text-base text-slate-500 font-medium max-w-sm mb-6 leading-relaxed">
                            Türkiye'nin yeni nesil akıllı kurumsal kaynak yönetimi ve B2B otonom ticaret merkezi.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-slate-900 font-extrabold mb-6 text-sm uppercase tracking-widest">Platform</h4>
                        <ul className="space-y-4 font-medium text-slate-500 flex flex-col">
                            <Link href="#" className="hover:text-blue-600 transition-colors">Ön Muhasebe</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">E-Dönüşüm</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Saha Satış</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Tedarik Zinciri</Link>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-900 font-extrabold mb-6 text-sm uppercase tracking-widest">Kaynaklar</h4>
                        <ul className="space-y-4 font-medium text-slate-500 flex flex-col">
                            <Link href="#" className="hover:text-blue-600 transition-colors">Yardım Kütüphanesi</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Geliştirici API</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Blog</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Sistem Durumu</Link>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-900 font-extrabold mb-6 text-sm uppercase tracking-widest">Kurumsal</h4>
                        <ul className="space-y-4 font-medium text-slate-500 flex flex-col">
                            <Link href="#" className="hover:text-blue-600 transition-colors">Hakkımızda</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">İletişim</Link>
                            <Link href="#" className="hover:text-blue-600 transition-colors">Gizlilik Politikası</Link>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-20 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="font-medium text-slate-400 text-sm">&copy; {new Date().getFullYear()} Periodya Yazılım A.Ş. Tüm hakları saklıdır.</p>
                    <div className="flex gap-4">
                        {/* Legal Links */}
                        <Link href="#" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Şartlar</Link>
                        <Link href="#" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Gizlilik</Link>
                        <Link href="#" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">KVKK</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
