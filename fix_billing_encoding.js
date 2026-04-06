const fs = require('fs');

function fixBillingHealthEncoding() {
    let path = 'src/app/(app)/admin/growth/billing-health/page.tsx';
    let code = fs.readFileSync(path, 'utf8');
    
    // Quick replacements for the Turkish encoding bugs.
    const replacements = {
        'Ä°ÅŸlem Sebebi': 'İşlem Sebebi',
        'Ä°ÅŸlem OnayÄ±': 'İşlem Onayı',
        'Ã§alÄ±ÅŸtÄ±rÄ±r': 'çalıştırır',
        'Ä°ÅŸlem BaÅŸarÄ±lÄ±': 'İşlem Başarılı',
        'Ä°ÅŸlem BaÅŸarÄ±sÄ±z': 'İşlem Başarısız',
        'LÃ¼tfen': 'Lütfen',
        'iÃ§in': 'için',
        'Ä°ÅŸlem': 'İşlem',
        'UyarÄ±': 'Uyarı',
        'TÃœMÃœ': 'TÜMÜ',
        'GÃœNCEL': 'GÜNCEL',
        'GECÄ°KMÄ°Åž': 'GECİKMİŞ',
        'TOLERASYON': 'TOLERANS',
        'AÃ‡ILMAYI': 'AÇILMAYI',
        'TutarÄ±': 'Tutarı',
        'ZamanÄ±': 'Zamanı',
        'UyarÄ±': 'Uyarı',
        'Belirsiz': 'Belirsiz',
        'BLOKELÄ°': 'BLOKELİ',
        'TOLERANS': 'TOLERANS',
        'Ã‡alÄ±ÅŸtÄ±r': 'Çalıştır',
        'Bu iÅŸlem': 'Bu işlem',
        'altyapÄ±sÄ±nÄ±': 'altyapısını',
        'gecikmiÅŸleri': 'gecikmişleri',
        'BUGÃœN': 'BUGÜN',
        'itibarÄ±yla': 'itibarıyla',
        'gerÃ§ekleÅŸtir': 'gerçekleştir',
        'Koleksiyon': 'Koleksiyon',
        'GÃ¼vende': 'Güvende',
        'AkÄ±ÅŸ': 'Akış',
        'GÃ¼ven sÃ¼resi': 'Güven süresi',
        'YÃ¼ksek': 'Yüksek',
        'KayÄ±tlÄ±': 'Kayıtlı',
        'Filtrelere': 'Filtrelere',
        'Finansal Veriler Ã‡ekiliyor': 'Finansal Veriler Çekiliyor',
        'Toplam KayÄ±t': 'Toplam Kayıt',
        'Ã§alÄ±ÅŸtÄ±r': 'çalıştır',
        'pÃ¼rÃ¼zsÃ¼z': 'pürüzsüz',
        'akÄ±ÅŸÄ±': 'akışı',
        'AskÄ±daki': 'Askıdaki'
    };
    
    for (const [bad, good] of Object.entries(replacements)) {
        code = code.split(bad).join(good);
    }
    
    fs.writeFileSync(path, code, 'utf8');
    console.log("Fixed encoding in billing-health");
}

fixBillingHealthEncoding();
