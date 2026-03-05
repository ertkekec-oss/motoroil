import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        await prisma.helpTopic.updateMany({
            where: { tenantId: 'PLATFORM_ADMIN' },
            data: { tenantId: null }
        });

        const initialContent = [
            {
                name: 'POS Terminal Kullanımı',
                slug: 'pos-terminal',
                description: 'Hızlı perakende satış işlemleri hakkında her şey.',
                order: 1,
                topics: [
                    {
                        title: 'Hızlı Satış Nasıl Yapılır?',
                        slug: 'hizli-satis',
                        excerpt: 'POS Terminali üzerinden barkodlu hızlı satış işlemi.',
                        status: 'PUBLISHED',
                        order: 1,
                        body: `# Hızlı Satış Nasıl Yapılır?

POS Terminali, müşterilerinize en hızlı şekilde hizmet verebilmeniz için tasarlanmıştır.

## Adım Adım Satış:
1. **Barkod Okutma:** Ürünün barkodunu okutun. Sisteme anında eklenecektir.
2. **Manuel Ürün Ekleme:** Arama çubuğuna ürün adı veya kodu yazarak manuel seçim yapabilirsiniz.
3. **Müşteri Seçimi (İsteğe Bağlı):** Sağ üst köşeden mevcut bir cariyi seçebilir veya cari seçmeden anonim (perakende) satış yapabilirsiniz.
4. **Ödeme Alımı:** Alt kısımdaki **Nakit** veya **Kredi Kartı** seçeneklerinden birine tıklayın.
5. **Fiş/Fatura:** İşlem tamamlandığında otomatik olarak tahsilat makbuzu/fiş dökülecektir.

> 💡 **İpucu:** Sesli komutları kullanarak (Örn: "2 adet Motor Yağı ekle") satışı hızlandırabilirsiniz.`
                    },
                    {
                        title: 'Parka Alma ve Bekleyen İşlemler',
                        slug: 'parka-alma',
                        excerpt: 'Müşteri kasada beklerken başka bir satışa geçme.',
                        status: 'PUBLISHED',
                        order: 2,
                        body: `# Parka Alma ve Bekleyen İşlemler

Müşteriniz cüzdanını unuttuğunda veya reyondan ek bir ürün almak için kasadan ayrıldığında sepeti "Park" edebilirsiniz.

## Nasıl Yapılır?
1. Sepet doluyken alt bölümdeki **Park Et** butonuna tıklayın.
2. Sepet içeriği geçici olarak kaydedilir ve ekran yeni satışa hazır hale gelir.
3. Müşteri geri döndüğünde, sağ üstteki **Sepetler (Park)** ikonuna tıklayın ve kaydettiğiniz sepeti seçin.
4. Ödeme işlemini tamamlayın.`
                    }
                ]
            },
            {
                name: 'Envanter ve Stok Yönetimi',
                slug: 'envanter-yonetimi',
                description: 'Ürün, stok hareketleri ve sayım işlemleri.',
                order: 2,
                topics: [
                    {
                        title: 'Yeni Ürün Ekleme',
                        slug: 'yeni-urun-ekleme',
                        excerpt: 'Sisteme yeni bir stok kartı tanımlama.',
                        status: 'PUBLISHED',
                        order: 1,
                        body: `# Yeni Ürün Ekleme

Envanterinize yeni bir ürün eklemek için şu adımları izleyin:

1. Sol menüden **Envanter** modülüne tıklayın.
2. Sağ üst köşedeki **Yeni Ürün** butonuna tıklayın.
3. **Temel Bilgiler:** Ürün Adı, Stok Kodu, Kategori ve Marka bilgilerini doldurun.
4. **Fiyatlandırma:** Alış ve Satış fiyatlarını KDV oranları ile birlikte belirleyin.
5. **Stok ve Tanımlar:** Başlangıç stok miktarını, minimum stok alarm seviyesini ve şube bilgisini girin.
6. **Kaydet** butonuna tıklayarak işlemi tamamlayın.

> ⚠️ **Not:** Eklenen ürünler POS Terminali ve B2B ağında (eğer ağınızda paylaştıysanız) anında aktif olur.`
                    },
                    {
                        title: 'Akıllı İçe Aktarım (Excel)',
                        slug: 'excel-ice-aktar',
                        excerpt: 'Excel üzerinden toplu envanter yükleme.',
                        status: 'PUBLISHED',
                        order: 2,
                        body: `# Smart Excel Import (Akıllı İçe Aktarım)

Yüzlerce ürünü tek tek eklemek yerine Periodya'nın **Gelişmiş İçe Aktar** özelliğini kullanabilirsiniz.

## Adımlar:
1. **Sistem > Gelişmiş İçe Aktar** menüsüne gidin.
2. **Örnek Şablonu İndir** butonuna tıklayarak taslağı indirin.
3. Excel dosyasını zorunlu alanlara (Ürün Adı, Kod, Fiyat, Stok) dikkat ederek doldurun ve kaydedin.
4. Dosyayı sisteme yükleyin. Sistem, verilerinizi otomatik analiz edecek ve oluşabilecek hataları (örn. aynı stok koduna sahip ürünler) yükleme öncesinde size bildirecektir.
5. **Onayla ve Başlat** butonuna basarak aktarımı tamamlayın.`
                    }
                ]
            },
            {
                name: 'B2B Network (Bayi Ağı)',
                slug: 'b2b-network',
                description: 'Bayi ekleme, komisyonlar ve iade işlemleri.',
                order: 3,
                topics: [
                    {
                        title: 'Yeni Bayi Daveti Gönderme',
                        slug: 'yeni-bayi-daveti',
                        excerpt: 'Ağınıza yeni bir alt bayi ekleme adımları.',
                        status: 'PUBLISHED',
                        order: 1,
                        body: `# Yeni Bayi Daveti

Periodya Hub üzerinden B2B bayilerinizi sisteme dahil etmek çok basittir.

## Davet Süreci
1. **Dealer Network > Bayiler** ekranına gidin.
2. **Yeni Bayi Davet Et** butonuna tıklayın.
3. Firmanın e-posta adresini ve uygulanacak (eğer varsa) fiyat listesini/bayi klasmanını seçin.
4. Sistem, karşı tarafa güvenli bir giriş bağlantısı iletecektir. 
5. Bayi, şifresini oluşturup onayladığında artık sizin B2B kataloğunuzu görüp sipariş verebilir.`
                    }
                ]
            },
            {
                name: 'Finans ve Muhasebe',
                slug: 'finans-yonetimi',
                description: 'Kasa işlemleri, cari ekstre ve raporlamalar.',
                order: 4,
                topics: [
                    {
                        title: 'Tahsilat ve Tediye İşlemleri',
                        slug: 'tahsilat-tediye',
                        excerpt: 'Carilerden ödeme alma veya carilere ödeme yapma.',
                        status: 'PUBLISHED',
                        order: 1,
                        body: `# Tahsilat ve Tediye (Ödeme) 

Cari hesaplarla olan nakit, kredi kartı veya havale işlemlerinizi yönetmek için kullanılır.

## Tahsilat Nasıl Eklenir?
1. **Cariler** listesinden işlem yapılacak müşteriyi seçin.
2. Detay sayfasında sağ üstteki **Tahsilat Ekle** butonuna tıklayın.
3. Ödeme türünü (Nakit, KK, Havale vb.), hangi **Kasaya** veya bankaya gireceğini ve tutarı belirtin.
4. Açıklama ekledikten sonra kaydedin. Cariye ait bakiye otomatik güncellenecektir.

> *Tediye (Ödeme) işlemleri de tedarikçileriniz için aynı ekran üzerinden **Ödeme Ekle** butonuyla yapılır.*`
                    }
                ]
            }
        ];

        for (const catData of initialContent) {
            let cat = await prisma.helpCategory.findFirst({
                where: { slug: catData.slug }
            });

            if (!cat) {
                cat = await prisma.helpCategory.create({
                    data: {
                        name: catData.name,
                        slug: catData.slug,
                        description: catData.description,
                        order: catData.order,
                        icon: ''
                    }
                });
            }

            for (const topicData of catData.topics) {
                const exist = await prisma.helpTopic.findFirst({
                    where: { slug: topicData.slug }
                });

                if (!exist) {
                    await prisma.helpTopic.create({
                        data: {
                            categoryId: cat.id,
                            title: topicData.title,
                            slug: topicData.slug,
                            excerpt: topicData.excerpt,
                            body: topicData.body,
                            status: topicData.status,
                            order: topicData.order,
                            tenantId: null
                        }
                    });
                } else {
                    await prisma.helpTopic.update({
                        where: { id: exist.id },
                        data: { tenantId: null, body: topicData.body }
                    });
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Help content synced successfully!' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
    }
}
