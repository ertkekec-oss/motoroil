const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const masterTaxonomy = [
  {
    name: "Bilgisayar & Teknoloji",
    children: [
      { name: "Bilgisayar", children: [
        { name: "Masaüstü Bilgisayarlar" }, { name: "Dizüstü Bilgisayarlar" }, { name: "Tabletler" }, { name: "Sunucular" }, { name: "Barebone Bilgisayarlar" }
      ]},
      { name: "Donanım & Bileşenler", children: [
        { name: "Bileşenler (RAM/CPU/Anakart)" }, { name: "Veri Depolama" }, { name: "Monitörler" }, { name: "Ağ Cihazları" }
      ]},
      { name: "Çevre Birimleri", children: [
        { name: "Yazıcılar ve Aksesuarları" }, { name: "Tarayıcılar" }, { name: "3D Yazıcılar" }, { name: "Aksesuarlar (Klavye/Mouse vb.)" }
      ]}
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
  },
  {
    name: "Mobilya & Ev Yaşam",
    children: [
      { name: "Oturma Odası", children: [{ name: "Koltuk Takımı" }, { name: "Sehpa & TV Ünitesi" }] },
      { name: "Yatak Odası", children: [{ name: "Yatak & Baza" }] }
    ]
  },
  {
    name: "Endüstri & Hırdavat",
    children: [
      { name: "El Aletleri", children: [{ name: "Matkap & Vidalama" }, { name: "Pense & Anahtar" }] },
      { name: "İş Güvenliği", children: [{ name: "Baret & Yelek" }, { name: "Çelik Burunlu Ayakkabı" }] }
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
