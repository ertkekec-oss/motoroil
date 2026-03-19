const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: "Elektronik",
    children: [
      {
        name: "Bilgisayar & Donanım",
        children: [
          { name: "Dizüstü Bilgisayar (Laptop)" },
          { name: "Masaüstü Bilgisayar" },
          { name: "Bilgisayar Bileşenleri (Klavye, Mouse)" },
          { name: "Monitör" },
          { name: "Ağ & Modem" }
        ]
      },
      {
        name: "Cep Telefonu & Aksesuar",
        children: [
          { name: "Cep Telefonu" },
          { name: "Cep Telefonu Kılıfları" },
          { name: "Şarj Cihazları ve Kablolar" },
          { name: "Kulaklıklar" },
          { name: "Powerbank" }
        ]
      },
      {
        name: "Beyaz Eşya",
        children: [
          { name: "Buzdolabı" },
          { name: "Çamaşır Makinesi" },
          { name: "Bulaşık Makinesi" },
          { name: "Fırın & Ocak" },
          { name: "Derin Dondurucu" }
        ]
      },
      {
        name: "Elektrikli Ev Aletleri",
        children: [
          { name: "Süpürge" },
          { name: "Ütü" },
          { name: "Isıtma & Soğutma" },
          { name: "Mutfak Robotları" },
          { name: "Kahve Makineleri" }
        ]
      },
      {
        name: "Ses & Görüntü",
        children: [
          { name: "Televizyon" },
          { name: "Ev Sinema Sistemleri" },
          { name: "Bluetooth Hoparlörler" },
          { name: "Kameralar" }
        ]
      }
    ]
  },
  {
    name: "Kadın Giyim & Ayakkabı",
    children: [
      {
        name: "Giyim",
        children: [
          { name: "Elbise" },
          { name: "Tişört" },
          { name: "Pantolon" },
          { name: "Gömlek" },
          { name: "Ceket & Mont" }
        ]
      },
      {
        name: "Ayakkabı",
        children: [
          { name: "Topuklu Ayakkabı" },
          { name: "Spor Ayakkabı" },
          { name: "Bot & Çizme" },
          { name: "Sneaker" }
        ]
      },
      {
        name: "Çanta & Aksesuar",
        children: [
          { name: "Omuz Çantası" },
          { name: "Sırt Çantası" },
          { name: "Takı & Saat" },
          { name: "Gözlük" }
        ]
      },
      {
        name: "İç Giyim & Pijama",
        children: [
          { name: "Sütyen" },
          { name: "Külot" },
          { name: "Pijama Takımı" },
          { name: "Çorap" }
        ]
      }
    ]
  },
  {
    name: "Erkek Giyim & Ayakkabı",
    children: [
      {
        name: "Giyim",
        children: [
          { name: "Tişört" },
          { name: "Gömlek" },
          { name: "Pantolon & Jeans" },
          { name: "Ceket & Mont" },
          { name: "Takım Elbise" }
        ]
      },
      {
        name: "Ayakkabı",
        children: [
          { name: "Spor Ayakkabı" },
          { name: "Klasik Ayakkabı" },
          { name: "Bot & Çizme" },
          { name: "Terlik" }
        ]
      },
      {
        name: "Aksesuar",
        children: [
          { name: "Saat" },
          { name: "Cüzdan & Kemer" },
          { name: "Gözlük" },
          { name: "Kravat & Papyon" }
        ]
      }
    ]
  },
  {
    name: "Otomotiv & Motosiklet",
    children: [
      {
        name: "Oto Aksesuar & Tuning",
        children: [
          { name: "Paspas" },
          { name: "Bagaj Havuzu" },
          { name: "Koltuk Kılıfı" },
          { name: "Cam Filmi" }
        ]
      },
      {
        name: "Bakım & Temizlik İşleri",
        children: [
          { name: "Motor Yağı & Katkıları" },
          { name: "Oto Şampuanı & Cila" },
          { name: "Filtreler (Polen, Hava, Yağ)" },
          { name: "Antifriz & Cam Suyu" }
        ]
      },
      {
        name: "Lastik & Jant",
        children: [
          { name: "Otomobil Lastiği" },
          { name: "Arazi Aracı Lastiği" },
          { name: "Çelik Jant" },
          { name: "Jant Kapağı" }
        ]
      },
      {
        name: "Oto Ses & Görüntü",
        children: [
          { name: "Teyp / Multimedya" },
          { name: "Hoparlör & Amplifikatör" },
          { name: "Navigasyon" }
        ]
      },
      {
        name: "Motosiklet & Ekipman",
        children: [
          { name: "Kask" },
          { name: "Motosiklet Mont ve Aksesuarları" },
          { name: "Motor Koruma ve Yedek Parça" },
          { name: "Dizlik & Dirseklik" }
        ]
      }
    ]
  },
  {
    name: "Ev & Yaşam",
    children: [
      {
        name: "Mobilya",
        children: [
          { name: "Oturma Odası & Salon" },
          { name: "Yatak Odası" },
          { name: "Yemek Odası" },
          { name: "Ofis Mobilyaları" }
        ]
      },
      {
        name: "Ev Tekstili",
        children: [
          { name: "Nevresim Takımı" },
          { name: "Havlu & Bornoz" },
          { name: "Perde" },
          { name: "Halı & Kilim" }
        ]
      },
      {
        name: "Sofra & Mutfak",
        children: [
          { name: "Tencere & Tava" },
          { name: "Yemek Takımları" },
          { name: "Bardak & Kupa" },
          { name: "Mutfak Aksesuarları" }
        ]
      },
      {
        name: "Banyo",
        children: [
          { name: "Banyo Aksesuarları" },
          { name: "Banyo Dolapları" },
          { name: "Ayna" }
        ]
      }
    ]
  },
  {
    name: "Süpermarket & Gıda",
    children: [
      {
        name: "Temel Gıda",
        children: [
          { name: "Sıvı Yağ & Zeytinyağı" },
          { name: "Unlu Mamüller" },
          { name: "Salça ve Soslar" },
          { name: "Kurubaklagil" }
        ]
      },
      {
        name: "İçecekler",
        children: [
          { name: "Su & Maden Suyu" },
          { name: "Gazlı İçecekler" },
          { name: "Kahve & Çay" }
        ]
      },
      {
        name: "Ev Temizlik & Deterjan",
        children: [
          { name: "Çamaşır Deterjanı" },
          { name: "Bulaşık Deterjanı" },
          { name: "Genel Ev Temizleyici" },
          { name: "Kağıt Ürünler (Peçete, Havlu)" }
        ]
      },
      {
        name: "Evcil Hayvan Ürünleri",
        children: [
          { name: "Kedi Maması" },
          { name: "Köpek Maması" },
          { name: "Kedi Kumu" },
          { name: "Kuş Yemi" }
        ]
      }
    ]
  },
  {
    name: "Anne & Çocuk",
    children: [
      {
        name: "Bebek Giyim",
        children: [
          { name: "Bebek Tulumu" },
          { name: "Bebek Ayakkabısı" },
          { name: "Body & Zıbın" }
        ]
      },
      {
        name: "Bebek Bakım",
        children: [
          { name: "Bebek Bezi" },
          { name: "Islak Mendil" },
          { name: "Bebek Şampuan & Yağ" },
          { name: "Banyo ve Küvet" }
        ]
      },
      {
        name: "Beslenme & Emzirme",
        children: [
          { name: "Biberon & Emzik" },
          { name: "Göğüs Pompası" },
          { name: "Bebek Maması" }
        ]
      },
      {
        name: "Oyuncak",
        children: [
          { name: "Eğitici Oyuncaklar" },
          { name: "Peluş Oyuncaklar" },
          { name: "Arabalar ve Parkurlar" },
          { name: "Kutu Oyunları" }
        ]
      }
    ]
  },
  {
    name: "Kozmetik & Kişisel Bakım",
    children: [
      {
        name: "Makyaj",
        children: [
          { name: "Göz Makyajı" },
          { name: "Dudak Makyajı" },
          { name: "Yüz Makyajı" }
        ]
      },
      {
        name: "Cilt Bakımı",
        children: [
          { name: "Yüz Temizleyici & Tonik" },
          { name: "Nemlendirici Krem" },
          { name: "Güneş Kremi" }
        ]
      },
      {
        name: "Saç Bakımı",
        children: [
          { name: "Şampuan" },
          { name: "Saç Kremi & Maskesi" },
          { name: "Saç Şekillendirici" }
        ]
      },
      {
        name: "Parfüm & Deodorant",
        children: [
          { name: "Kadın Parfüm" },
          { name: "Erkek Parfüm" },
          { name: "Deodorant & Roll-on" }
        ]
      }
    ]
  },
  {
    name: "Spor & Outdoor",
    children: [
      {
        name: "Spor Giyim & Ayakkabı",
        children: [
          { name: "Sporcu Tişörtü" },
          { name: "Koşu & Antrenman Ayakkabısı" },
          { name: "Tayt & Eşofman" }
        ]
      },
      {
        name: "Kondisyon & Fitness",
        children: [
          { name: "Dambıl & Ağırlık" },
          { name: "Kondisyon Bisikleti" },
          { name: "Sporcu Besinleri" },
          { name: "Yoga Matı" }
        ]
      },
      {
        name: "Kamp & Doğa Sporları",
        children: [
          { name: "Çadır & Uyku Tulumu" },
          { name: "Kamp Sandalyesi" },
          { name: "Fener ve Kamplama" }
        ]
      },
      {
        name: "Bisiklet",
        children: [
          { name: "Dağ Bisikleti" },
          { name: "Şehir Bisikleti" },
          { name: "Bisiklet Kask & Aksesuar" }
        ]
      }
    ]
  },
  {
    name: "Kitap, Kırtasiye, Hobi",
    children: [
      {
        name: "Kitap",
        children: [
          { name: "Edebiyat" },
          { name: "Eğitim ve Sınav Kitapları" },
          { name: "Çocuk Kitapları" },
          { name: "Tarih ve Bilim" }
        ]
      },
      {
        name: "Kırtasiye & Ofis",
        children: [
          { name: "Kalemler" },
          { name: "Defter" },
          { name: "Masaüstü Gereçleri" },
          { name: "Fotokopi Kağıdı" }
        ]
      },
      {
        name: "Oyun Konsolları & Müzik",
        children: [
          { name: "Oyun Konsolu" },
          { name: "Oyunlar" },
          { name: "Müzik Aletleri" },
          { name: "Kutu ve Masa Oyunları" }
        ]
      }
    ]
  }
];

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function main() {
  console.log("Seeding Multiple Categories...");
  
  for (const rootCat of defaultCategories) {
    const rootSlug = slugify(rootCat.name);
    let rootRecord = await prisma.globalCategory.findUnique({ where: { slug: rootSlug } });
    if (!rootRecord) {
      rootRecord = await prisma.globalCategory.create({
        data: { name: rootCat.name, slug: rootSlug }
      });
    }

    if (rootCat.children) {
      for (const subCat of rootCat.children) {
        // Unique slug to avoid duplicate categories with same names under different parents
        const subSlug = slugify(rootCat.name + '-' + subCat.name);
        
        let subRecord = await prisma.globalCategory.findUnique({ where: { slug: subSlug } });
        if (!subRecord) {
          subRecord = await prisma.globalCategory.create({
            data: { name: subCat.name, slug: subSlug, parentId: rootRecord.id }
          });
        }

        if (subCat.children) {
          for (const leafCat of subCat.children) {
            const leafSlug = slugify(rootCat.name + '-' + subCat.name + '-' + leafCat.name);
            let leafRecord = await prisma.globalCategory.findUnique({ where: { slug: leafSlug } });
            if (!leafRecord) {
              await prisma.globalCategory.create({
                data: { name: leafCat.name, slug: leafSlug, parentId: subRecord.id }
              });
            }
          }
        }
      }
    }
  }

  console.log("Trendyol categories seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
