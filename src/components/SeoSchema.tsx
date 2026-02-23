import React from 'react';

/**
 * SeoSchema Component
 * 
 * Bu bileşen, JSON-LD formatında yapılandırılmış verileri (Schema.org) sayfaya enjekte eder.
 * Organization, WebSite, SoftwareApplication ve FAQPage şemalarını içerir.
 */
const SeoSchema: React.FC = () => {
    const schemas = [
        // Organization Schema
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Periodya",
            "url": "https://www.periodya.com",
            "logo": "https://www.periodya.com/logo.png",
            "sameAs": [
                "https://twitter.com/periodya",
                "https://www.linkedin.com/company/periodya"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+90-212-XXX-XXXX",
                "contactType": "customer service",
                "areaServed": "TR",
                "availableLanguage": "Turkish"
            }
        },
        // SoftwareApplication Schema
        {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Periodya Enterprise ERP",
            "operatingSystem": "Web-based",
            "applicationCategory": "BusinessApplication",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "TRY",
                "description": "30 Gün Ücretsiz Deneme"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "120"
            }
        },
        // FAQ Schema
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Periodya ERP yazılımı kimler için uygundur?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Periodya perakende, üretim ve hizmet sektörlerindeki orta ve büyük ölçekli işletmeler için uçtan uca yönetim sağlayan modüler bir ERP sistemidir."
                    }
                },
                {
                    "@type": "Question",
                    "name": "POS Terminal stok ve finansı otomatik günceller mi?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Evet, POS üzerinden yapılan her işlem anlık olarak envanter ve finans modülleriyle senkronize çalışarak veri tutarlılığı sağlar."
                    }
                },
                {
                    "@type": "Question",
                    "name": "PDKS vardiya/mesai/giriş-çıkış yönetimini destekler mi?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Periodya PDKS modülü vardiya planlama, mesai hesaplama ve personelin tüm giriş-çıkış hareketlerini izleme özelliklerine sahiptir."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Cari hesaplar ile finansal yönetim entegre mi?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Cari hesaplardaki borç/alacak hareketleri finansal yönetim modülünde anlık nakit akışı ve mizan verisi olarak işlenir."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Saha satış paneli ve canlı saha takibi nasıl çalışır?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Saha ekipleri uygulama üzerinden sipariş alırken, merkez ofis canlı harita üzerinden ekiplerin konumlarını ve ziyaret verilerini izleyebilir."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Denetim kayıtları (audit log) neleri izler?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Sistemdeki veri girişleri, silme işlemleri ve yetki değişiklikleri kullanıcı bazlı olarak zaman damgasıyla kayıt altına alınır."
                    }
                },
                {
                    "@type": "Question",
                    "name": "İş zekası & analiz hangi raporları sunar?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Karlılık analizi, satış öngörüleri, personel performans metrikleri ve stok devir hızı gibi stratejik raporlar sunulmaktadır."
                    }
                }
            ]
        }
    ];

    return (
        <>
            {schemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </>
    );
};

export default SeoSchema;
