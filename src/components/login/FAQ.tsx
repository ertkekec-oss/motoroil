"use client";
import { useState } from 'react';

const FAQS = [
    { q: 'Mevcut verilerimi taşıyabilir miyim?', a: 'Evet. Excel, muhasebe programları ve pazaryeri geçmişlerini aktarma desteği sunuyoruz. Onboarding ekibimiz süreci uçtan uca yönetir.' },
    { q: 'Minimum sözleşme süresi var mı?', a: 'Hayır. Aylık ya da yıllık (indirimli) seçenek mevcut. İstediğiniz zaman iptal edebilirsiniz.' },
    { q: 'Kaç kullanıcı ekleyebilirim?', a: 'Başlangıç planında 1, Büyüme\'de 5 kullanıcı bulunur. Kurumsal planda sınır yoktur. Kullanıcı başına ek ücret modelimiz de mevcuttur.' },
    { q: 'Pazaryeri entegrasyonları hangi kanal?', a: 'Trendyol, Hepsiburada, Pazarama, n11 ve Amazon TR desteği aktiftir. Yeni entegrasyonlar düzenli eklenmektedir.' },
    { q: 'E-fatura için ayrı başvuru gerekiyor mu?', a: 'Hayır. GİB başvurusu ve e-fatura aktivasyonu Periodya üzerinden gerçekleştirilir; sizi adım adım yönlendiririz.' },
    { q: 'Destek nasıl sağlanıyor?', a: 'Chat, e-posta ve telefon desteği mevcuttur. Kurumsal planlarda 7/24 öncelikli destek SLA ile garanti altındadır.' },
];

export default function FAQ() {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <section id="sss" className="py-20 px-6" aria-labelledby="faq-heading">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-[0.3em]">SSS</span>
                    <h2 id="faq-heading" className="text-3xl font-black text-white mt-2 mb-3">Sık Sorulan Sorular</h2>
                </div>
                <div className="space-y-3">
                    {FAQS.map((faq, i) => (
                        <div key={i}
                            className="rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-white/10"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 p-5 text-left"
                                aria-expanded={open === i}
                            >
                                <span className="font-bold text-white text-sm">{faq.q}</span>
                                <span className={`text-orange-400 text-lg transition-transform flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>+</span>
                            </button>
                            {open === i && (
                                <div className="px-5 pb-5 -mt-1">
                                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
