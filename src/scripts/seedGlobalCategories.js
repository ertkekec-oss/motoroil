const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const masterTaxonomy = [
  {
    name: "Gıda & Tarım Ürünleri",
    children: [
      { name: "Kuruyemiş & Çerez", children: [{ name: "Kavrulmuş Kuruyemiş" }, { name: "Çiğ Kuruyemiş" }] },
      { name: "Et & Kasap Ürünleri", children: [{ name: "Kırmızı Et (Dana/Kuzu)" }, { name: "Beyaz Et" }, { name: "İşlenmiş Et" }] },
      { name: "Süt ve Süt Ürünleri", children: [{ name: "Peynir Çeşitleri" }, { name: "Günlük Süt & Yoğurt" }] },
      { name: "Tarımsal Ürünler", children: [{ name: "Gübre & Zirai İlaç" }, { name: "Tohum" }] }
    ]
  },
  {
    name: "Taşıtlar & Otomotiv",
    children: [
      { name: "Motosiklet", children: [{ name: "Motosiklet Aksesuarları" }, { name: "Motor Aksamı" }, { name: "Kask & Güvenlik" }] },
      { name: "Bisiklet", children: [{ name: "Dağ Bisikleti" }, { name: "Yedek Parça & Vites" }] },
      { name: "Oto Yedek Parça", children: [{ name: "Aydınlatma (Far/Stop)" }, { name: "Mekanik (Motor/Fren)" }] }
    ]
  },
  {
    name: "Mobilya & Ev Yaşam",
    children: [
      { name: "Oturma Odası", children: [{ name: "Koltuk Takımı" }, { name: "Sehpa & TV Ünitesi" }] },
      { name: "Yatak Odası", children: [{ name: "Yatak & Baza" }, { name: "Gardırop" }] },
      { name: "Aydınlatma", children: [{ name: "Avize & Sarkıt" }, { name: "Ampul & LED" }] }
    ]
  },
  {
    name: "Elektronik & Bilgisayar",
    children: [
      { name: "Bilgisayar & Donanım", children: [{ name: "Mikroçip & Devre (Çip)" }, { name: "Bileşenler (RAM/CPU)" }] },
      { name: "Telefon & Aksesuar", children: [{ name: "Cep Telefonu" }, { name: "Kılıf & Şarj" }] }
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
