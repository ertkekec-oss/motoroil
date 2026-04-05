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
    Briefcase,
    Store,
    LayoutDashboard,
    Lock
} from 'lucide-react';

export default function ModernLanding() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-200">
            {/* Header / Navbar */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/30">
                            P
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">Periodya</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Özellikler</Link>
                        <Link href="#solutions" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Çözümler</Link>
                        <Link href="/pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Fiyatlandırma</Link>
                        <Link href="/help" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Destek Merkezi</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">Giriş Yap</Link>
                        <Link href="/register" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-full transition-all hover:shadow-lg">
                            Hemen Başla <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
                {/* Background decorative blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
                
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-8">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        TÜRKİYE'NİN YENİ NESİL ERP ÇÖZÜMÜ
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                        İşletmenizi dijitalleştirin, <br className="hidden lg:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            sınırları kaldırın.
                        </span>
                    </h1>
                    
                    <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
                        Muhasebe, B2B sipariş yönetimi, fiziki stok takibi, e-dönüşüm ve saha satış operasyonlarınızı tek bir modern platformda toplayın.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-full transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 hover:-translate-y-1">
                            Ücretsiz Dene <ArrowRight className="w-5 h-5"/>
                        </Link>
                        <Link href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 text-base font-bold rounded-full transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                            Satış Ekibiyle Görüş
                        </Link>
                    </div>
                    
                    <div className="mt-12 flex items-center justify-center gap-6 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Kurulum Gerektirmez</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Kredi Kartı İstemez</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> İstenilen Zaman İptal</div>
                    </div>
                </div>

                {/* Dashboard Mockup (CSS Pure) */}
                <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-20 relative">
                    <div className="rounded-[24px] border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-2xl p-4 lg:p-6 ring-4 ring-white/50">
                        <div className="w-full h-[400px] lg:h-[600px] bg-slate-50 rounded-[16px] border border-slate-200 overflow-hidden flex shadow-inner">
                            {/* Mock Sidebar */}
                            <div className="w-48 lg:w-64 border-r border-slate-200 bg-white p-4 hidden md:flex flex-col gap-4">
                                <div className="h-6 w-24 bg-slate-200 rounded-md mb-4 animate-pulse"></div>
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex items-center gap-3 w-full">
                                        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
                                        <div className="h-3 w-full bg-slate-100 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Mock Content */}
                            <div className="flex-1 p-6 flex flex-col gap-6 bg-[#FAFAFA]">
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse"></div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1,2,3,4].map(i => (
                                      <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="h-4 w-12 bg-slate-100 rounded mb-3"></div>
                                        <div className="h-8 w-24 bg-blue-100 rounded animate-pulse"></div>
                                      </div>
                                    ))}
                                </div>
                                <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                                    <div className="h-4 w-48 bg-slate-200 rounded mb-6"></div>
                                    <div className="space-y-4">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="h-10 w-full bg-slate-50 rounded border border-slate-100 animate-pulse"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Logo Cloud */}
            <section className="border-y border-slate-200 bg-white py-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Entegre Çalıştığımız Platformlar</p>
                    <div className="flex flex-wrap justify-center gap-8 lg:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder for logos */}
                        <div className="text-xl font-black text-slate-800">TRENDYOL</div>
                        <div className="text-xl font-black text-slate-800">HEPSİBURADA</div>
                        <div className="text-xl font-black text-slate-800">GİB (E-Arşiv)</div>
                        <div className="text-xl font-black text-slate-800">N11</div>
                        <div className="text-xl font-black text-slate-800">PAYTR</div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 lg:py-32 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Her işletme tipine uygun mimari.</h2>
                        <p className="text-lg text-slate-600 font-medium">Satış, üretim veya hizmet sektöründe olun, Periodya sizinle birlikte esner ve büyür.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Box 1 */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Finans & Muhasebe Başucu</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                Cari takibi, faturalandırma, banka mutabakatları ve gelir/gider analizleri ile işletmenizin nakit akışını tek ekrandan kontrol edin. E-Fatura saniyeler içinde kesilir.
                            </p>
                            <a href="#" className="font-bold text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">Daha fazla keşfet <ArrowRight className="w-4 h-4"/></a>
                        </div>

                        {/* Box 2 */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                <Store className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Çoklu Depo & Stok</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                Fiziki deponuzu ve e-ticaret stoklarınızı anlık eşleştirin. Minimum stok uyarıları, sayım fişleri ve hareket geçmişi ile sıfır fire vererek çalışın.
                            </p>
                            <a href="#" className="font-bold text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">Daha fazla keşfet <ArrowRight className="w-4 h-4"/></a>
                        </div>

                        {/* Box 3 */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">PDKS & İnsan Kaynakları</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                Personelinizin giriş/çıkış takibi (QR tabanlı), bordro hesaplamaları, avans ve izin yönetim süreçleri artık otonom. Puantajla uğraşmaya son.
                            </p>
                            <a href="#" className="font-bold text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">Daha fazla keşfet <ArrowRight className="w-4 h-4"/></a>
                        </div>

                        {/* Box 4 */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Pazaryeri & B2B Hub</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                Kendi B2B bayi sipariş portalınızı kurun veya markalar arası otonom ticaret ağımıza katılarak siparişlerinizi tek bir merkezden eritin.
                            </p>
                            <a href="#" className="font-bold text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">Daha fazla keşfet <ArrowRight className="w-4 h-4"/></a>
                        </div>

                        {/* Box 5 */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Mutabakat & E-İmza</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                BA/BS formları, cari mutabakatlar ve şirket içi evrak izin onam formlarını tek tuşla, yasal geçerliliği olan bir şekilde dijital bağlama alın.
                            </p>
                            <a href="#" className="font-bold text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">Daha fazla keşfet <ArrowRight className="w-4 h-4"/></a>
                        </div>

                        {/* Box 6 */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Saha Satış Gücü (Plasiyer)</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                Saha personelinize mobil cihazlar üzerinden rota planlayın, stoklara online erişim sunun ve siparişi depoya anlık düşürün.
                            </p>
                            <a href="#" className="font-bold text-blue-600 text-sm flex items-center gap-1 hover:gap-2 transition-all">Daha fazla keşfet <ArrowRight className="w-4 h-4"/></a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 100" className="w-[800px] h-[800px] fill-white spin-slow">
                         <path d="M50 0 L100 50 L50 100 L0 50 Z" />
                    </svg>
                </div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
                        Kağıtlarla boğuşmaya son verin.
                    </h2>
                    <p className="text-blue-100 text-lg lg:text-xl font-medium mb-10">
                        Modern işletmelerin güvendiği altyapıya bugün geçiş yapın. 14 gün ücretsiz deneme veya Satış temsilcimizden özel demo talep edin.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 text-base font-bold rounded-full transition-all shadow-lg hover:bg-slate-50">
                            Ücretsiz Denemeye Başla
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">P</div>
                            <span className="text-xl font-extrabold text-white">Periodya</span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-xs mb-6">
                            Türkiye'nin en gelişmiş bulut tabanlı B2B, ERP ve Muhasebe Yönetim Platformu. İşinizi ölçeklendirmek için tasarlandı.
                        </p>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> 256-bit SSL ve KVKK Uyumlu Altyapı
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-bold mb-4">Ürün</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Ön Muhasebe</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">E-Fatura / E-Defter</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Saha Satış / CRM</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Stok & Depo</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">B2B Pazaryeri</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Kaynaklar</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Yardım Merkezi</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Geliştirici API</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Sistem Durumu</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Eğitim Videoları</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Kurumsal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">İletişim</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col sm:flex-row justify-between items-center">
                    <p>&copy; {new Date().getFullYear()} Periodya Yazılım A.Ş. Tüm hakları saklıdır.</p>
                    <p className="mt-2 sm:mt-0">İstanbul, Türkiye konumundan sevgiyle geliştirildi.</p>
                </div>
            </footer>
        </div>
    );
}
