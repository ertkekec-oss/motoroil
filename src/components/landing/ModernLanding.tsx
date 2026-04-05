"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    Check, 
    ArrowRight, 
    Play, 
    BarChart2, 
    Layers, 
    Shield, 
    Smartphone, 
    Star, 
    Plus,
    X,
    Server,
    Users,
    Globe
} from 'lucide-react';

export default function ModernLanding() {
    const [annual, setAnnual] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [scrolled, setScrolled] = useState(false);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const faqs = [
        { q: "Sisteme giriş ve kurulum ne kadar sürer?", a: "Standart paketlerde hesap açılışı anında gerçekleşir. Veri aktarımı ve ekibinizin eğitimi dahil tam entegrasyon süreci ortalama 48 saat sürmektedir." },
        { q: "Mevcut verilerimi (Excel, Logo vb.) aktarabilir miyim?", a: "Evet, Periodya'nın akıllı içe aktarım sihirbazı sayesinde tüm cari, stok ve geçmiş fatura kayıtlarınızı dakikalar içinde sisteme dahil edebilirsiniz." },
        { q: "Fiyatlarınıza KDV dahil mi?", a: "Web sitemizde ve tabloda belirtilen tüm fiyatlarımıza KDV hariçtir. Kurumsal faturalandırma yapılmaktadır." },
        { q: "İptal ve iade politikalarınız nasıl çalışır?", a: "Memnun kalmadığınız takdirde ilk 14 gün koşulsuz iptal ve iade hakkınız bulunmaktadır. Taahhütsüz aylık planlarda dilediğiniz ay çıkış yapabilirsiniz." }
    ];

    return (
        <div className="min-h-screen bg-[#F1F5F9] py-10 flex justify-center selection:bg-blue-600 selection:text-white font-inter">
            {/* 80% BROWSER WIDTH WRAPPER AS REQUESTED */}
            <div className="w-[80%] bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden flex flex-col relative">
                
                {/* 1. HEADER */}
                <header className={`w-full flex items-center justify-between px-10 py-6 border-b transition-all duration-300 sticky top-0 z-50 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-slate-200' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            P
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">Periodya</span>
                    </div>

                    <nav className="hidden lg:flex items-center gap-8">
                        <Link href="#home" className="text-sm font-bold text-slate-900 hover:text-blue-600">Anasayfa</Link>
                        <Link href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600">Özellikler</Link>
                        <Link href="#pricing" className="text-sm font-bold text-slate-500 hover:text-blue-600">Planlar</Link>
                        <Link href="#faq" className="text-sm font-bold text-slate-500 hover:text-blue-600">S.S.S.</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-slate-700 hover:text-blue-600">Giriş Yap</Link>
                        <Link href="/register" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/20">
                            Ücretsiz Dene
                        </Link>
                    </div>
                </header>

                {/* 2. HERO SECTION */}
                <section id="home" className="pt-24 pb-20 px-10 text-center relative bg-white">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-bl-full -z-10 mix-blend-multiply opacity-50"></div>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-8">
                        B2B ERP SİSTEMİNDE YENİ DÖNEM <ArrowRight className="w-4 h-4"/>
                    </div>
                    
                    <h1 className="text-5xl lg:text-[72px] font-black text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-4xl mx-auto">
                        İşletmenizi Geleceğe <br/>
                        <span className="text-blue-600">Dijital Olarak</span> Taşıyın.
                    </h1>
                    
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
                        Muhasebe, e-fatura, satış, stok yönetimi ve B2B ağlarınızı saniyeler içinde kurun. Hızlı, güvenilir ve tamamen bulut tabanlı.
                    </p>
                    
                    <div className="flex items-center justify-center gap-4 mb-20">
                        <Link href="/register" className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-xl transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2">
                            Platforma Katıl <ArrowRight className="w-5 h-5"/>
                        </Link>
                        <Link href="#demo" className="px-8 py-4 bg-white text-slate-900 border border-slate-200 text-base font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Play className="w-5 h-5"/> Sunumu İzle
                        </Link>
                    </div>

                    {/* HERO MOCKUP */}
                    <div className="max-w-5xl mx-auto rounded-[24px] bg-slate-50 border border-slate-200 p-4 shadow-2xl relative">
                        <div className="w-full h-[500px] bg-white rounded-[16px] overflow-hidden flex border border-slate-100">
                            {/* Fake Sidebar */}
                            <div className="w-64 border-r border-slate-100 p-6 flex flex-col gap-6 bg-slate-50/50">
                                <div className="w-24 h-5 bg-slate-200 rounded-md mb-4"></div>
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex gap-4 items-center">
                                        <div className="w-5 h-5 bg-slate-200 rounded shrink-0"></div>
                                        <div className="h-3 w-full bg-slate-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Fake Content */}
                            <div className="flex-1 p-8 bg-white flex flex-col gap-6">
                                <div className="flex justify-between">
                                    <div className="w-48 h-6 bg-slate-100 rounded-md"></div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="h-32 rounded-xl bg-slate-50 border border-slate-100 p-5">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg mb-4"></div>
                                            <div className="w-full h-8 bg-slate-200 rounded-lg"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-6 space-y-4">
                                     {[1,2,3].map(i => <div key={i} className="w-full h-12 bg-white rounded-lg border border-slate-100"></div>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. LOGO TICKER */}
                <section className="py-12 border-y border-slate-100 bg-slate-50 px-10">
                    <p className="text-center text-xs font-bold text-slate-400 tracking-widest uppercase mb-8">TAM ENTEGRASYONLU ÇALIŞTIĞIMIZ SİSTEMLER</p>
                    <div className="flex justify-center items-center gap-16 opacity-50 grayscale">
                        <span className="text-2xl font-black">Trendyol</span>
                        <span className="text-2xl font-black">Hepsiburada</span>
                        <span className="text-2xl font-black">e-Defter</span>
                        <span className="text-2xl font-black">PayTR</span>
                        <span className="text-2xl font-black">N11</span>
                    </div>
                </section>

                {/* 4. FEATURES SECTION */}
                <section id="features" className="py-24 px-10 bg-white">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-4 block">PLATFORM ÖZELLİKLERİ</span>
                        <h2 className="text-4xl font-black text-slate-900 mb-6">İhtiyacınız olan tüm araçlar tek <br/>bir mimari üzerinde.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Feature 1 */}
                        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-100 hover:border-blue-500 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                                <BarChart2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Gelişmiş Ön Muhasebe</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Gelir ve giderlerinizi anlık takip edin, otomatik e-fatura kesin ve cari risklerinizi kontrol altında tutun.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-100 hover:border-blue-500 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Çoklu Depo Yönetimi</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Gerçek zamanlı stok hareketleri. Kayıp/kaçak sıfır fire kuralı, anlık miktar uyarısı ve varyant destekli takipler.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-100 hover:border-blue-500 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Kendi B2B Pazaryeriniz</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Tüm bayilerinizi sisteme tanımlayın, web ve mobil üzerinden kapalı devre sipariş toplamaya anında başlayın.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-100 hover:border-blue-500 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Mutabakat & Onam</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">BA/BS formlarını, cari e-mutabakatları ve personel KVKK zimmet sözleşmelerini dijital yolla güvence altına alın.</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-100 hover:border-blue-500 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Saha Satış Gücü (CRM)</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Plasiyerlerinize özel mobil görünümler. Ziyaret rotaları planlayın, sahada canlı tahsilat yapıp fatura kesin.</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="rounded-2xl p-8 bg-slate-50 border border-slate-100 hover:border-blue-500 transition-colors group">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">PDKS & Bordro (İK)</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">Personelinizi tekil kartlarla veya mobil QR ile takip edin. Ay sonu puantaj cetvelleri el değmeden hazır.</p>
                        </div>
                    </div>
                </section>

                {/* 5. TESTIMONIALS */}
                <section className="py-24 px-10 bg-slate-900 text-white">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-black mb-6">Başarı Hikayeleri</h2>
                        <p className="text-lg text-slate-400 font-medium">Büyümesini hızlandıran işletmeler arasına katılın.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[1,2,3].map((item, idx) => (
                            <div key={idx} className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                                <div className="flex gap-1 mb-6">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}
                                </div>
                                <p className="text-slate-300 font-medium leading-relaxed mb-8">
                                    "Periodya B2B Portalı sayesinde toptan sipariş sürecimiz sıfır hataya indi. Eskiden WhatsApp ile alınan Excel listelerini teker teker girerdik, şimdi sadece onay butonuna basıyoruz."
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                                    <div>
                                        <h4 className="font-bold">Mehmet Y.</h4>
                                        <p className="text-sm text-slate-400">CEO, Toptan Dağıtım Pazarlama</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 6. PRICING PLANS */}
                <section id="pricing" className="py-24 px-10 bg-slate-50">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-blue-600 font-bold tracking-widest text-sm uppercase mb-4 block">FİYATLANDIRMA</span>
                        <h2 className="text-4xl font-black text-slate-900 mb-6">İş modelinize en uygun planı seçin</h2>
                        
                        <div className="inline-flex bg-white p-1.5 rounded-lg border border-slate-200 mt-6 shadow-sm">
                            <button onClick={() => setAnnual(false)} className={`px-6 py-2.5 rounded-md font-bold text-sm ${!annual ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Aylık Fatura</button>
                            <button onClick={() => setAnnual(true)} className={`px-6 py-2.5 rounded-md font-bold text-sm ${annual ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Yıllık Peşin (-%20)</button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        
                        {/* BASIC PLAN */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-slate-900 mb-2">Başlangıç</h3>
                                <p className="text-slate-500 font-medium text-sm">Temel finans ihtiyaçları.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-slate-900">{annual ? '₺990' : '₺1,290'}</span>
                                <span className="text-slate-500 font-bold"> /ay</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Ön Muhasebe Modülü', 'E-Fatura & E-Arşiv', 'Temel Stok Depo', 'Banka Entegrasyonları', '1 Lisanslı Kullanıcı'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="bg-blue-50 p-1 rounded"><Check className="w-4 h-4 text-blue-600" /></div> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 rounded-xl font-bold bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 transition">Hemen Başla</button>
                        </div>

                        {/* PRO PLAN */}
                        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl flex flex-col relative transform lg:-translate-y-4">
                            <div className="absolute top-0 right-8 bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-b-lg">Trend</div>
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-white mb-2 pt-2">Profesyonel</h3>
                                <p className="text-slate-400 font-medium text-sm">E-Ticaret ve B2B Ağı kuranlar.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-white">{annual ? '₺2,490' : '₺3,290'}</span>
                                <span className="text-slate-400 font-bold"> /ay</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Tüm Başlangıç Özellikleri', 'B2B Bayi Sipariş Portalı', 'Çoklu Depo ve El Terminali', 'Pazaryeri Entegrasyonları', 'İnsan Kaynakları & Bordro', '5 Lisanslı Kullanıcı'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white font-medium">
                                        <div className="bg-blue-600 p-1 rounded"><Check className="w-4 h-4 text-white" /></div> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-600/30">Ücretsiz Başla (14 Gün)</button>
                        </div>

                        {/* ENTERPRISE PLAN */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-slate-900 mb-2">Kurumsal</h3>
                                <p className="text-slate-500 font-medium text-sm">Dedicated sunucu çözümleri.</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-slate-900">Custom</span>
                                <span className="text-slate-500 font-bold"> /yıllık</span>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                {['Size özel atanmış VDS Sunucu', 'Mevcut Sistem Veri Taşıması', 'Özel API Endpointleri', 'Sınırsız Kullanıcı Hacmi', 'On-Premise Seçeneği', 'SLA Garantisi (99.9%)'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="bg-slate-100 p-1 rounded"><Check className="w-4 h-4 text-slate-600" /></div> {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-4 rounded-xl font-bold bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100 transition">Satış Birimi İle Görüş</button>
                        </div>

                    </div>
                </section>

                {/* 7. FAQ */}
                <section id="faq" className="py-24 px-10 bg-white">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-black text-slate-900 mb-6">Sıkça Sorulan Sorular</h2>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full flex justify-between items-center p-6 text-left"
                                >
                                    <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
                                    {openFaq === idx ? <X className="w-5 h-5 text-slate-400" /> : <Plus className="w-5 h-5 text-slate-400" />}
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-6 text-slate-500 font-medium leading-relaxed">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* 8. FOOTER */}
                <footer className="bg-[#0f172a] text-slate-300 pt-20 pb-10 px-10 border-t-8 border-blue-600">
                    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">P</div>
                                <span className="text-xl font-black text-white">Periodya</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium mb-4">Türkiye'nin modern kurumsal yönetim sistemi.</p>
                            <p className="text-xs text-slate-500">© 2026 Periodya A.Ş.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
                            <ul className="space-y-4 text-sm font-medium text-slate-500">
                                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Giriş Yap</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Kurumsal</h4>
                            <ul className="space-y-4 text-sm font-medium text-slate-500">
                                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Yasal</h4>
                            <ul className="space-y-4 text-sm font-medium text-slate-500">
                                <li><a href="#" className="hover:text-white transition-colors">Gizlilik Şartları</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kullanım Koşulları</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">KVKK Bilgilendirmesi</a></li>
                            </ul>
                        </div>
                    </div>
                </footer>
                
            </div>
        </div>
    );
}
