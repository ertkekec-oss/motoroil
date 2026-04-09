import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPosHelp() {
    console.log("POS Terminal Bilgi Bankası içerikleri ekleniyor...");

    try {
        // 1. Kategori Kontrolü
        let category = await prisma.helpCategory.findFirst({
            where: { slug: 'pos-terminal' } // Try to find by slug first
        });

        if (!category) {
            category = await prisma.helpCategory.create({
                data: {
                    name: 'POS Terminal Cihazı Yönetimi',
                    slug: 'pos-terminal',
                    description: 'Hızlı satış ekranı, donanım ayarları ve kasa entegrasyonları.',
                    icon: '💳',
                    order: 3,
                }
            });
            console.log("Kategori oluşturuldu:", category.name);
        } else {
            console.log("Kategori zaten mevcut:", category.name);
        }

        const articles = [
            {
                title: 'POS Terminal Nedir?',
                slug: 'pos-terminal-nedir',
                content: `<h1>POS Terminal Nedir?</h1>
<p>Periodya POS (Point of Sale) Terminal, mağaza içi sıcak satış yapan perakende markaları ve toptancılar için özel olarak tasarlanmış, saniyeler içinde sepet oluşturup ödeme alabileceğiniz entegre bir "Hızlı Satış" ekranıdır.</p>
<p><strong>Özellikleri:</strong></p>
<ul>
<li>Bulut tabanlı çalışır, saniyeler içinde senkronize olur.</li>
<li>Barkod okuyucular ve dokunmatik ekranlar ile tam uyumludur.</li>
<li>Nakit, kredi kartı, veresiye ve parapuan gibi hibrit ödeme destekleri sunar.</li>
<li>Stoklardan satılan ürünü anında düşer ve faturasını e-Arşiv/e-Fatura olarak keser.</li>
</ul>`,
                status: 'PUBLISHED',
                viewCount: 154,
                order: 1
            },
            {
                title: 'POS Terminalden Satış Yapmak',
                slug: 'pos-terminalden-satis-yapmak',
                content: `<h1>POS Terminalden Satış Yapmak</h1>
<p>POS Terminal ekranından satış başlatmak oldukça kolaydır. Sırasıyla şu adımları takip edebilirsiniz:</p>
<ol>
<li>Ana menüden <strong>Operasyonlar &gt; POS Terminal</strong> sekmesine tıklayın. (veya hızlı tuş olarak <code>SHIFT + P</code> kullanın).</li>
<li>Ürünü sepete eklemek için barkod okuyucuyla ürün okutun veya sağ alandaki görsel kataloğundan (veya arama çubuğundan) ürünü bularak sepete tıklayın.</li>
<li>Sepetteki ürünlerin adetlerini <code>+</code> ve <code>-</code> butonları ile artırabilir veya manuel miktar girebilirsiniz. Miktar girdikten sonra indirim atamak isterseniz ürün bazlı iskonto butonu mevcuttur.</li>
<li>Sepet toplamı oluştuktan sonra "Ödeme Al" sekmesindeki seçeneklerden (Nakit, Kredi Kartı vs.) birine tıklayarak satışı tamamlayın. E-Fatura saniyeler içinde arka planda oluşacaktır.</li>
</ol>`,
                status: 'PUBLISHED',
                viewCount: 300,
                order: 2
            },
            {
                title: 'Nakit Satış',
                slug: 'pos-nakit-satis',
                content: `<h1>Nakit Satış İşlemleri</h1>
<p>POS terminalinde ödeme alırken <strong>Nakit</strong> metodunu seçtiğinizde, sistem kasaya peşin giriş yapar.</p>
<p>İşlem ekranında "Verilen Tutar" kutucuğuna müşteriden aldığınız nakit bedeli girebilirsiniz. Sistem, para üstünü size otomatik olarak hesaplayıp devasa bir göstergeyle sunar (Örn: "Para Üstü: 25.00 TL").</p>`,
                status: 'PUBLISHED',
                viewCount: 102,
                order: 3
            },
            {
                title: 'Kredi Kartı ile Satış',
                slug: 'pos-kredi-karti',
                content: `<h1>Kredi Kartı ile Satış</h1>
<p><strong>Kredi Kartı</strong> ödeme yöntemini seçtiğinizde fiziksel pos cihazınızdan ödemeyi almanız gerekir. Tahsilatı yaptıktan sonra sistemdeki ekranda Kredi Kartı/Banka Kartı butonuna tıklamanız yeterlidir.</p>
<p>NOT: Sistem, birden fazla kredi kartı POS hesabı destekler, işlem anında hangi banka posundan geçtiğini seçerek muhasebe banka hesaplarınızın doğru çalışmasını sağlayabilirsiniz.</p>`,
                status: 'PUBLISHED',
                viewCount: 198,
                order: 4
            },
            {
                title: 'Veresiye (Cari) Satış',
                slug: 'pos-veresiye-satis',
                content: `<h1>Veresiye (Açık Hesap) Satış</h1>
<p>Eğer müşteriniz kurumsal veya düzenli çalıştığınız bir firma/kişi ise cari hesap (Veresiye) olarak satış yapabilirsiniz.</p>
<ol>
<li>Sepeti oluşturduktan sonra sayfanın sağ üstünde yer alan <strong>"Müşteri Seç"</strong> butonuna tıklayın.</li>
<li>Carinin ismini yazarak (veya VKN/TCKN ile) müşteri kaydını eşleştirin.</li>
<li>Ödeme yöntemi olarak <strong>Veresiye (Açık Hesap)</strong> butonuna tıklayın.</li>
</ol>
<p>İşlem tutarı anında müşterinin borç bakiyesine işlenecektir.</p>`,
                status: 'PUBLISHED',
                viewCount: 412,
                order: 5
            },
            {
                title: 'Havale / EFT ile Satış',
                slug: 'pos-havale-satis',
                content: `<h1>Havale & EFT ile Satış</h1>
<p>Müşteri tutarı IBAN/FAST ile gönderdiyse (örneğin mağazadasınız fakat nakit/kart taşınmıyorsa) <strong>Havale</strong> ödeme methodu seçilir.</p>
<p>İşlem yapılırken paranın girdiği şirket banka hesabı seçilerek satış onaylanır. Tutar, banka bakiyenizi anında artıracaktır.</p>`,
                status: 'PUBLISHED',
                viewCount: 95,
                order: 6
            },
            {
                title: 'Parapuan Kullanımı ve Kazanımı',
                slug: 'pos-parapuan',
                content: `<h1>Parapuan Sistemi</h1>
<h2>Parapuan Kazanımı</h2>
<p>Müşteriyi seçtiğiniz sadakat (loyalty) programına bağlı olarak müşterilerin yaptıkları alışverişlerde kazandıkları puanlardır. Enterprise ayarlarından "Vergiesiz tutarın %x'i kadar parapuan ver" ayarını yapılandırabilirsiniz.</p>
<h2>Parapuan Kullanımı</h2>
<p>Müşteri tanımlandığında sağ üstte kullanabileceği parapuan bakiyesi yer alır. Sepet toplamından puan düşmek isterseniz <strong>Parapuan Kullan</strong> butonuna basıp ne kadar harcanacağını (₺ cinsinden değerini) düşebilirsiniz.</p>
<p>Kalan tutar kredi kartı veya nakit ile tamamlanabilir (Hibrit ödeme).</p>`,
                status: 'PUBLISHED',
                viewCount: 56,
                order: 7
            },
            {
                title: 'Canlı Kur Desteği',
                slug: 'pos-canli-kur',
                content: `<h1>Canlı Kur (Dövizli Satış)</h1>
<p>Periodya Merkez Bankası ile anlık senkronizedir. Eğer ürün fiyatları Dolar veya Euro ise, sistem sepet toplamını anlık döviz kuru üzerinden Türk Lirası'na çevirerek tahsilat tutarını belirler.</p>
<p>Pos ekranında <strong>TCMB Anlık Kur</strong> ibaresini izleyebilirsiniz. Müşteri TL ödeyebileceği gibi dilerseniz tahsilatı Döviz Kasasına da (USD/EUR vb.) doğrudan yönlendirebilirsiniz.</p>`,
                status: 'PUBLISHED',
                viewCount: 304,
                order: 8
            },
            {
                title: 'Sepeti Beklemeye Al Özelliği',
                slug: 'pos-beklemeye-al',
                content: `<h1>Beklemeye Al (Askıya Alma) Özelliği</h1>
<p>Kasa çok sıkışıksa ve müşteri bir ürünü alıp döneceğini söylediyse veya cüzdanını bulamıyorsa işlemi iptal etmenize gerek yoktur.</p>
<ol>
<li>Üstte yer alan <strong>"Beklemeye Al"</strong> (🕒) butonuna basın.</li>
<li>Sepet kaybolur ve yeni temiz bir sepet açılır. Arkadaki sıradaki müşterinin hesap işlemini yaparsınız.</li>
<li>İlk müşteri geri geldiğinde, "Bekleyen Sepetler" listesine tıklayarak az önce beklemeye aldığınız sepeti geri yükler (Restore) ve kaldığınız yerden devam edersiniz.</li>
</ol>`,
                status: 'PUBLISHED',
                viewCount: 512,
                order: 9
            },
            {
                title: 'Barkod Okuyucu ve Klavye Kullanımı',
                slug: 'pos-donanim',
                content: `<h1>Donanım Özellikleri: Barkod ve Klavye</h1>
<p><strong>Barkod Okuyucu</strong>: Mouse kullanmadan cihazınızın lazer okuyucusuyla direkt barkod okutabilirsiniz. İmlecin sayfanın neresinde olduğu önemli değildir (Akıllı Dinleme). Okutulan barkod doğrudan sepete 1 adet olarak eklenir, aynı ürün okutulursa miktar 2'ye çıkar.</p>
<p><strong>Klavye Kısayolları</strong>:</p>
<ul>
<li><code>F2</code> veya <code>Boşluk</code>: Arama alanını odaklar.</li>
<li><code>F9</code>: Nakit Ödeme Modalını açar.</li>
<li><code>F10</code>: Kredi Kartı Modalını açar.</li>
<li><code>ESC</code>: Açık olan Modal menüleri veya uyarıları temizler/kapatır.</li>
</ul>
<p>Bu yetenekler, kasa (kasiyer) personellerinin süper hızlı ve sıfır mouse teması ile işlem yapmasını garanti altına alır.</p>`,
                status: 'PUBLISHED',
                viewCount: 388,
                order: 10
            }
        ];

        console.log("İçerikler kontrol ediliyor...");

        for (const data of articles) {
            const exists = await prisma.helpArticle.findFirst({
                where: { slug: data.slug }
            });

            if (!exists) {
                await prisma.helpArticle.create({
                    data: {
                        categoryId: category.id,
                        title: data.title,
                        slug: data.slug,
                        content: data.content,
                        status: 'PUBLISHED', // If enum exists
                        viewCount: data.viewCount,
                        // Not mapping 'order' unless schema has it, we just iterate.
                    }
                });
                console.log(`✔️  Oluşturuldu: ${data.title}`);
            } else {
                console.log(`ℹ️  Zaten Mevcut: ${data.title}`);
            }
        }

        console.log("✅ Tüm POS Terminal Bilgi Bankası içerikleri eklendi.");

    } catch (e) {
        console.error("FATAL ERROR MAPPING HELPS:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

addPosHelp();
