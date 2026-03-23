const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const masterTaxonomy = [
  {
    name: "Elektronik & Bilgisayar",
    children: [
      { name: "Bilgisayarlar, Bileşenleri ve Aksesuarları", children: [
        { name: "Masaüstü Bilgisayarlar" }, { name: "Dizüstü Bilgisayarlar" }, { name: "Tabletler" }, { name: "Sunucular" }, { name: "Barebone Bilgisayarlar" }, { name: "Ağ Cihazları" }, { name: "3D Yazıcılar" }
      ]},
      { name: "Cep Telefonları ve Aksesuarlar", children: [] },
      { name: "E-kitap Okuyucular ve Aksesuarları", children: [] },
      { name: "Giyilebilir Teknoloji", children: [] },
      { name: "GPS, Navigasyon ve Aksesuarları", children: [] },
      { name: "Güç Aksesuarları", children: [] },
      { name: "Kameralar ve Fotoğraf Makineleri", children: [] },
      { name: "Kulaklıklar ve Aksesuarları", children: [] },
      { name: "Oto ve Araç Elektroniği", children: [] },
      { name: "Piller ve Pil Şarj Aletleri", children: [] },
      { name: "Ses Sistemleri ve Hoparlörler", children: [] },
      { name: "Taşınabilir Ses ve Görüntü", children: [] },
      { name: "Telefonlar, VoIP ve Aksesuarları", children: [] },
      { name: "Televizyonlar ve Ev Sinema Sistemleri", children: [] },
      { name: "Telsiz İletişim Ürünleri", children: [] }
    ]
  },
  {
    name: "Kitap",
    children: [
      { name: "Aile ve Yaşam", children: [] },
      { name: "Aşk Romanları", children: [] },
      { name: "Başvuru Kaynakları", children: [] },
      { name: "Bilgisayarlar ve İnternet", children: [] },
      { name: "Bilim, Doğa ve Matematik", children: [] },
      { name: "Bilim Kurgu ve Fantastik", children: [] },
      { name: "Biyografiler ve Anılar", children: [] },
      { name: "Çizgi Romanlar, Manga ve Grafik Romanlar", children: [] },
      { name: "Çocuk Kitapları", children: [] },
      { name: "Ders ve Alıştırma Kitapları", children: [] },
      { name: "Din ve Maneviyat", children: [] },
      { name: "Edebiyat ve Kurgu", children: [] },
      { name: "Eğitim Araştırmaları ve Öğretim Kitapları", children: [] },
      { name: "Ev, Bahçe ve Hobi", children: [] },
      { name: "Gençler ve Genç Yetişkinler", children: [] },
      { name: "Gizem, Gerilim ve Şüphe", children: [] },
      { name: "Güzel Sanatlar ve Fotoğraf", children: [] },
      { name: "Hukuk", children: [] },
      { name: "İş ve Ekonomi", children: [] },
      { name: "Mizah ve Eğlence", children: [] },
      { name: "Mühendislik ve Ulaştırma", children: [] },
      { name: "Sağlık, Fitness ve Beslenme", children: [] },
      { name: "Seyahat ve Turizm", children: [] },
      { name: "Siyaset, Felsefe ve Sosyal Bilimler", children: [] },
      { name: "Spor ve Outdoor", children: [] },
      { name: "Takvimler ve Yıllıklar", children: [] },
      { name: "Tarih", children: [] },
      { name: "Tıp ve Hemşirelik", children: [] },
      { name: "Yemek Pişirme, Yiyecekler ve Şarap", children: [] }
    ]
  },
  {
    name: "Ev ve Yaşam",
    children: [
      { name: "Aydınlatma", children: [] },
      { name: "Banyo", children: [] },
      { name: "Dini ve Manevi Ürünler", children: [] },
      { name: "Ev Aletleri", children: [] },
      { name: "Ev Dekorasyonu", children: [] },
      { name: "Ev İçin Düzenleme ve Depolama Ürünleri", children: [] },
      { name: "Ev Tekstili ve Uyku Setleri", children: [] },
      { name: "Mobilyalar", children: [] },
      { name: "Resimler, Posterler ve Heykeller", children: [] },
      { name: "Temizlik Aletleri", children: [] },
      { name: "Temizlik Malzemeleri", children: [] }
    ]
  },
  {
    name: "Yapı Market",
    children: [
      { name: "Badana, Boya ve Duvar Kağıdı Malzemeleri", children: [] },
      { name: "Çim Biçiciler ve Elektrikli Aletler", children: [] },
      { name: "Depolama Sistemleri", children: [] },
      { name: "Elektrik Malzemeleri", children: [] },
      { name: "Elektrikli Aletler ve El Aletleri", children: [] },
      { name: "Güvenlik ve Koruma", children: [] },
      { name: "Hırdavat", children: [] },
      { name: "İnşaat Ürünleri", children: [] },
      { name: "Mutfak ve Banyo Armatürleri", children: [] },
      { name: "Sıhhi tesisat", children: [] },
      { name: "Şömineler", children: [] }
    ]
  },
  {
    name: "Moda & Giyim",
    children: [
      { name: "Kadın Giyim", children: [
        { name: "Bluz ve Gömlek" }, { name: "Dış Giyim" }, { name: "Elbise" }, { name: "Etek" }, { name: "Hamile" }, { name: "Jean" }, { name: "Pantolon" }, { name: "Spor Giyim" }, { name: "Sweatshirt" }, { name: "Triko" }, { name: "Üst ve T-shirt" }, { name: "Plaj Giyim" }
      ]},
      { name: "Kadın Ayakkabı", children: [
        { name: "Babet" }, { name: "Topuklu Ayakkabı" }, { name: "Bot ve Çizme" }, { name: "Spor ve Outdoor Ayakkabısı" }, { name: "Sneaker" }, { name: "Sandalet" }, { name: "Terlik" }
      ]},
      { name: "Erkek Giyim", children: [
        { name: "Dış Giyim" }, { name: "Gömlek" }, { name: "Sweatshirt" }, { name: "Jean" }, { name: "Pantolon" }, { name: "Takım ve Blazer" }, { name: "Spor Giyim" }, { name: "Triko" }, { name: "Üst ve T-shirt" }, { name: "Ev Kıyafeti" }, { name: "Plaj Giyim" }
      ]},
      { name: "Erkek Ayakkabı", children: [
        { name: "Bağcıklı Ayakkabı" }, { name: "Bot ve Çizme" }, { name: "Düz Ayakkabı" }, { name: "Sandalet" }, { name: "Sneaker" }, { name: "Spor ve Outdoor Ayakkabısı" }
      ]},
      { name: "Aksesuarlar", children: [
        { name: "Güneş Gözlüğü" }, { name: "Şapka" }, { name: "Çanta" }, { name: "Cüzdan ve Kartlık" }, { name: "Kemer" }
      ]},
      { name: "Çocuk & Bebek Giyim", children: [
        { name: "Kız Çocuk Kıyafet" }, { name: "Erkek Çocuk Kıyafet" }, { name: "Kız Çocuk Ayakkabı" }, { name: "Erkek Çocuk Ayakkabı" }, { name: "Bebek Kıyafet ve Aksesuar" }
      ]}
    ]
  },
  {
    name: "Oyuncak & Hobi",
    children: [
      { name: "Araçlar & Modeller", children: [
        { name: "Oyuncak Araçlar" }, { name: "Uzaktan Kumandalı Cihazlar" }, { name: "Model Yapımı ve Hobi Gereçleri" }
      ]},
      { name: "Bebek & Pelüş", children: [
        { name: "Bebek ve Küçük Çocuk Oyuncakları" }, { name: "Dolgu ve Pelüş Oyuncaklar" }, { name: "Oyuncak Bebekler ve Aksesuarları" }
      ]},
      { name: "Eğitim & Oyun", children: [
        { name: "Eğitim ve Bilim Oyuncakları" }, { name: "Elektronik Oyuncaklar" }, { name: "Yapbozlar ve Bulmacalar" }, { name: "Oyunlar ve Oyun Aksesuarları" }, { name: "Yapı İnşa Oyunları" }, { name: "Yap-İnan Oyunları" }
      ]},
      { name: "Hobi & Eğlence", children: [
        { name: "İlginç Oyuncaklar ve Şaka Oyuncakları" }, { name: "Koleksiyon Ürünleri" }, { name: "Kuklalar ve Kukla Tiyatroları" }, { name: "Oyuncak Figürler" }, { name: "Oyuncak Müzik Aletleri" }, { name: "Parti Malzemeleri" }, { name: "Resim ve El İşi" }, { name: "Spor ve Açık Hava" }
      ]}
    ]
  },
  {
    name: "Gıda & Tarım Ürünleri",
    children: [
      { name: "Kuruyemiş & Çerez", children: [{ name: "Kavrulmuş Kuruyemiş" }, { name: "Çiğ Kuruyemiş" }] },
      { name: "Et & Kasap Ürünleri", children: [{ name: "Kırmızı Et (Dana/Kuzu)" }, { name: "Beyaz Et" }, { name: "İşlenmiş Et" }] },
      { name: "Tarımsal Ürünler", children: [{ name: "Gübre & Zirai İlaç" }, { name: "Tohum" }] }
    ]
  },
  {
    name: "Taşıtlar & Otomotiv",
    children: [
      { name: "Motosiklet", children: [{ name: "Motosiklet Aksesuarları" }, { name: "Motor Aksamı" }, { name: "Kask & Güvenlik" }] },
      { name: "Bisiklet", children: [{ name: "Dağ Bisikleti" }, { name: "Şehir Bisikleti" }, { name: "Yedek Parça & Vites" }] },
      { name: "Oto Yedek Parça", children: [{ name: "Aydınlatma (Far/Stop)" }, { name: "Mekanik (Motor/Fren)" }] }
    ]
  }
];

async function seedGlobalCategories() {
  console.log("🌱 Periodya Universal B2B Taxonomy Seeder Başlatılıyor...");
  
  // Clean start (optional, maybe dangerous in prod, but fine for seed phase)
  // await prisma.globalCategory.deleteMany({});
  
  for (const root of masterTaxonomy) {
    const rSlug = root.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const rootNode = await prisma.globalCategory.upsert({
      where: { slug: rSlug },
      update: { name: root.name },
      create: {
        name: root.name,
        slug: rSlug
      }
    });

    for (const l2 of root.children) {
      const l2Slug = l2.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const l2Node = await prisma.globalCategory.upsert({
        where: { slug: l2Slug },
        update: { name: l2.name, parentId: rootNode.id },
        create: {
          name: l2.name,
          slug: l2Slug,
          parentId: rootNode.id
        }
      });

      if (l2.children) {
        for (const l3 of l2.children) {
          const l3Slug = l3.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          await prisma.globalCategory.upsert({
            where: { slug: l3Slug },
            update: { name: l3.name, parentId: l2Node.id },
            create: {
              name: l3.name,
              slug: l3Slug,
              parentId: l2Node.id
            }
          });
        }
      }
    }
  }
  
  console.log("✅ Evrensel Taksonomi başarıyla Periodya Hub'a yerleştirildi.");
}

seedGlobalCategories()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
