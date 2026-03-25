import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const catalogTree = [
  {
    name: "Otomotiv",
    children: [
      { name: "Yedek Parça", children: [{ name: "Motor Yağları" }, { name: "Filtreler" }, { name: "Fren Balataları" }, { name: "Silecekler" }, { name: "Ateşleme Sistemi" }] },
      { name: "Aksesuarlar", children: [{ name: "Paspas" }, { name: "Koltuk Kılıfı" }, { name: "Güneşlik" }] }
    ]
  },
  {
    name: "Motosiklet",
    children: [
      { name: "Yedek Parça", children: [{ name: "Zincir ve Dişli" }, { name: "Fren Sistemleri" }, { name: "Motor Yağı" }, { name: "Aküler" }] },
      { name: "Sürücü Ekipmanları", children: [{ name: "Kask" }, { name: "Mont ve Ceket" }, { name: "Eldiven" }, { name: "Dizlik ve Koruma" }] },
      { name: "Aksesuarlar", children: [{ name: "Çanta" }, { name: "Telefon Tutucu" }, { name: "Branda" }] }
    ]
  },
  {
    name: "Bisiklet",
    children: [
      { name: "Bisiklet Modelleri", children: [{ name: "Dağ Bisikleti" }, { name: "Şehir Bisikleti" }, { name: "Elektrikli Bisiklet" }, { name: "Çocuk Bisikleti" }] },
      { name: "Yedek Parça", children: [{ name: "Jant ve Lastik" }, { name: "Vites Sistemleri" }, { name: "Fren" }, { name: "Kadro" }] },
      { name: "Aksesuarlar", children: [{ name: "Çamurluk" }, { name: "Matara" }, { name: "Kask" }, { name: "Aydınlatma" }] }
    ]
  },
  {
    name: "Giyim ve Moda",
    children: [
      {
        name: "Kadın",
        children: [
          {
            name: "Ayakkabı",
            children: [
              { name: "Sneaker" },
              { 
                name: "Spor ve Outdoor Ayakkabısı",
                children: [
                  { name: "Basketbol Ayakkabısı" }, { name: "Bisiklet Ayakkabısı" }, { name: "Cross Training Ayakkabısı" },
                  { name: "Dans Ayakkabısı" }, { name: "Golf Ayakkabısı" }, { name: "Jimnastik Ayakkabısı" },
                  { name: "Kapalı Alan Ayakkabısı" }, { name: "Koşu Ayakkabısı" }, { name: "Plaj Terliği" },
                  { name: "Spor ve Outdoor Sandaleti" }, { name: "Su Sporları Ayakkabısı" }, { name: "Tenis Ayakkabısı" },
                  { name: "Trekking ve Yürüyüş" }, { name: "Triatlon Ayakkabısı" }, { name: "Voleybol Ayakkabısı" }
                ]
              },
              { 
                name: "Düz Ayakkabı",
                children: [{ name: "Babet" }, { name: "Bağcıklı Ayakkabı" }, { name: "Espadril" }, { name: "Loafer ve Mokasen" }, { name: "Tekne Ayakkabısı" }]
              },
              { name: "Çizme ve Bot" },
              { 
                name: "Sandalet ve Terlik",
                children: [{ name: "Parmak Arası Terlik" }, { name: "Plaj Terliği" }, { name: "Sandalet" }, { name: "Spor ve Outdoor Sandaleti" }]
              }
            ]
          },
          { name: "Giyim" },
          { name: "Aksesuarlar" }
        ]
      },
      {
        name: "Erkek",
        children: [
          {
            name: "Ayakkabı",
            children: [
               { name: "Bağcıklı Ayakkabı" }, { name: "Çizme ve Bot" }, { name: "Düz Ayakkabı" }, { name: "Espadril" },
               { name: "Sandalet" }, { name: "Sneaker" },
               { 
                 name: "Spor ve Outdoor Ayakkabısı",
                 children: [
                   { name: "Basketbol Ayakkabısı" }, { name: "Bisiklet Ayakkabısı" }, { name: "Cross Training Ayakkabısı" },
                   { name: "Fitness Ayakkabısı" }, { name: "Futbol Ayakkabısı" }, { name: "Havuz Ayakkabısı" },
                   { name: "Koşu Ayakkabısı" }, { name: "Yürüyüş Ayakkabısı" }, { name: "Tenis Ayakkabısı" },
                   { name: "Trekking ve Yürüyüş" }, { name: "Triatlon Ayakkabısı" }, { name: "Voleybol Ayakkabısı" }
                 ]
               }
            ]
          },
          { name: "Giyim" }
        ]
      },
      {
        name: "Kız Çocuk",
        children: [
          {
            name: "Ayakkabı",
            children: [{ name: "Babet" }, { name: "Çizme ve Bot" }, { name: "Düz Ayakkabı" }, { name: "Sandalet" }, { name: "Sneaker" }, { name: "Spor Ayakkabısı" }]
          }
        ]
      },
      {
        name: "Erkek Çocuk",
        children: [
          {
            name: "Ayakkabı",
            children: [{ name: "Bağcıklı Ayakkabı" }, { name: "Çizme ve Bot" }, { name: "Sandalet" }, { name: "Sneaker" }, { name: "Spor Ayakkabısı" }]
          }
        ]
      },
      {
        name: "Bebek Giyim ve Aksesuar",
        children: [
          {
            name: "Erkek Bebek",
            children: [
              { name: "Ayakkabı", children: [{ name: "İlk Adım Ayakkabısı" }, { name: "Patik" }, { name: "Sandalet" }] }
            ]
          },
          {
            name: "Kız Bebek",
            children: [
              { name: "Ayakkabı", children: [{ name: "İlk Adım Ayakkabısı" }, { name: "Patik" }, { name: "Sandalet" }] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Bahçe",
    children: [
      { name: "Aydınlatma" },
      { 
        name: "Bahçe Aletleri ve Sulama Ekipmanları",
        children: [
          { name: "Arabalar ve Tekerlekli Arabalar" }, { name: "Dağıtıcılar" }, { name: "El Aletleri" },
          { name: "Püskürtücüler ve Aksesuarları" }, { name: "Saksılar ve Aksesuarları" }, { name: "Sulama Ekipmanları" }
        ]
      },
      { name: "Bahçe Yapıları ve Çim Ekipmanları" },
      { 
        name: "Barbekü ve Yemek Pişirme Ürünleri",
        children: [{ name: "Açık Hava Sofra ve Piknik Eşyaları" }, { name: "Barbekü Aksesuarları" }, { name: "Barbekü ve Smoker" }]
      },
      { 
        name: "Çim Biçiciler ve Elektrikli Bahçe Aletleri",
        children: [
          { name: "Basınçlı Yıkama Araçları ve Aksesuarları" }, { name: "Budama Makası, Parçalar ve Aksesuarlar" },
          { name: "Çim Biçiciler ve Aksesuarları" }, { name: "Jeneratörler ve Elektrik Makasları" },
          { name: "Metal Dedektörleri" }, { name: "Üfleyiciler ve Elektrikli Süpürgeler" }
        ]
      },
      { 
        name: "Çim ve Bitki Bakımı",
        children: [{ name: "Bitki Koruma ve Haşere Kontrolü" }, { name: "Bitki ve Toprak İzleme" }, { name: "Gübreler ve Bitki Besinleri" }]
      },
      { name: "Dekoratif Bahçe Eşyaları" },
      { name: "Dış Mekan Isıtma ve Soğutma" },
      { name: "Havuzlar, Jakuziler ve Aksesuarları" },
      { name: "Teras ve Veranda Mobilyaları" }
    ]
  },
  {
    name: "Ev ve Yaşam",
    children: [
      {
        name: "Aydınlatma",
        children: [
          { name: "Dış Mekan Aydınlatma", children: [{ name: "Fenerler" }, { name: "Peyzaj Aydınlatmaları" }, { name: "Teras ve Veranda Aydınlatmaları" }, { name: "Yer Lambaları" }] }
        ]
      },
      { name: "Mutfak", children: [{ name: "Sofra ve Sunum" }, { name: "Tencere ve Tava" }] },
      { name: "Mobilya", children: [{ name: "Oturma Odası" }, { name: "Yatak Odası" }, { name: "Çalışma Odası" }] },
      { name: "Ev Tekstili", children: [{ name: "Nevresim Takımı" }, { name: "Havlular" }, { name: "Perdeler" }] }
    ]
  },
  {
    name: "Elektronik",
    children: [
      {
        name: "Bilgisayar",
        children: [
          { 
            name: "Dizüstü Bilgisayarlar",
            children: [{ name: "2'si 1 Arada Dizüstü Bilgisayarlar" }, { name: "Geleneksel Dizüstü Bilgisayarlar" }]
          },
          { 
            name: "Masaüstü Bilgisayarlar",
            children: [{ name: "All-In-One Bilgisayarlar" }, { name: "Kule Tipi Bilgisayarlar" }, { name: "Mini Bilgisayarlar" }]
          },
          { name: "Tabletler" },
          { name: "Monitörler" },
          { name: "Oyun Bilgisayarları" },
          {
            name: "Bileşenler",
            children: [
              { name: "Bilgisayar Vidaları" },
              { 
                name: "Dahili Bileşenler",
                children: [{ name: "Anakartlar" }, { name: "Bellekler" }, { name: "İşlemciler" }, { name: "Ekran Kartları" }, { name: "Bilgisayar Kasaları" }]
              },
              { name: "Dizüstü Bilgisayar Bileşenleri" },
              { name: "Harici Bileşenler" },
              { name: "Tablet Bileşenleri ve Yedek Parçaları" }
            ]
          },
          {
            name: "Aksesuarlar",
            children: [
              { name: "3D Yazıcı Malzemeleri" }, { name: "3D Yazıcı Parçaları ve Aksesuarları" }, { name: "Adaptörler" },
              { name: "Bilgisayar Bellek Kartı Aksesuarları" }, { name: "Dizüstü Bilgisayar Aksesuarları" }, { name: "Güvenlik Kabloları" },
              { name: "Kablolar ve Donanım Aksesuarları" }, { name: "Kesintisiz Güç Kaynakları" }, { name: "Klavyeler, Fareler ve Giriş Cihazları" },
              { name: "Küçük USB Araçları" }, { name: "Medya Depolama Ürünleri" }, { name: "Monitör Aksesuarları" },
              { name: "PC için Oyun Aksesuarları" }, { name: "Sabit Sürücü Aksesuarları" }, { name: "Ses ve Video Aksesuarları" },
              { name: "Tablet Aksesuarları" }, { name: "Tamir Setleri" }, { name: "USB Hub'ları" }, { name: "Yazıcı Aksesuarları" }, { name: "Yazılabilir Medya" }
            ]
          },
          {
            name: "Veri Depolama",
            children: [
              { name: "Dahili Sabit Sürücüler" }, { name: "Dahili SSD'ler" }, { name: "Dahili Veri Depolama" },
              { name: "Harici Veri Depolama Cihazları" }, { name: "NAS Ağa Bağlı Depolama Sistemleri" }, { name: "USB Bellekler" }
            ]
          }
        ]
      },
      {
        name: "Cep Telefonları ve Aksesuarlar",
        children: [
          { name: "Akıllı Saatler" },
          { name: "Telefon Aksesuarları" },
          { name: "Cep Telefonları" },
          { name: "Mobil İnternet Cihazları" },
          { name: "Tuşlu Cep Telefonları" }
        ]
      },
      {
        name: "Televizyonlar ve Ev Sinema Sistemleri",
        children: [
          { name: "TV ve Ev Sineması Aksesuarları" }, { name: "AV Alıcılar ve Amfiler" },
          { name: "Blu-Ray Oynatıcılar ve Kayıt Cihazları" }, { name: "DVD Oynatıcılar ve Kayıt Cihazları" },
          { name: "Ev Sinema Sistemleri" }, { name: "Ev Tipi Sinema Hoparlörleri" }, { name: "Medya Akış Cihazları" },
          { name: "Projeksiyon Cihazları" }, { name: "Set Üstü Kutular" }, { name: "Sinema Gözlükleri" },
          { name: "Taşınabilir DVD ve Blu-Ray Oynatıcılar" }, { name: "Televizyonlar" }, { name: "Uydu Çanakları" },
          { name: "Uydu Ekipmanları" }, { name: "Uydu Televizyon Sistemleri" }
        ]
      },
      {
        name: "Kulaklıklar",
        children: [
          { 
            name: "Kulaküstü ve Kulakiçi Kulaklıklar",
            children: [{ name: "Açık Kulak Kulaklıklar" }, { name: "Kulak İçi Kulaklıklar" }, { name: "Kulak Üstü Büyük Kulaklıklar" }, { name: "Kulak Üstü Kulaklıklar" }]
          }
        ]
      },
      {
        name: "Ses Sistemleri ve Taşınabilir Hoparlörler",
        children: [
          { name: "Ses Sistemi Aksesuarları" }, { name: "Alıcılar ve Bağımsız Alıcılar" },
          { name: "Bağımsız Hoparlörler" }, { name: "Taşınabilir Hoparlörler" },
          { name: "İnternet ve Ağ Medya Cihazları" }, { name: "Kompakt Müzik Sistemleri" },
          { name: "Pikaplar" }, { name: "Radyolar ve Boombox Hoparlörler" }
        ]
      },
      { name: "Kameralar ve Fotoğraf Makineleri" },
      { name: "Elektrikli Ev ve Mutfak Aletleri" },
      { name: "Oto ve Araç Elektroniği" },
      { name: "Piller ve Pil Şarj Aletleri" },
      { name: "Telefonlar, VOIP ve Ofis Telefon Sistemleri" }
    ]
  },
  {
    name: "Video Oyunu ve Konsol",
    children: [
      { name: "Xbox Series X ve S", children: [{ name: "Aksesuarlar" }, { name: "Konsollar" }, { name: "Oyunlar" }] },
      { name: "PlayStation 5", children: [{ name: "Aksesuarlar" }, { name: "Konsollar" }, { name: "Oyunlar" }] },
      { name: "Nintendo Switch 2", children: [{ name: "Aksesuarlar" }, { name: "İndirilebilir İçerik" }, { name: "Konsollar" }, { name: "Oyunlar" }] },
      { name: "Nintendo Switch", children: [{ name: "Aksesuarlar" }, { name: "Konsollar" }, { name: "Oyunlar" }] },
      { name: "Xbox One", children: [{ name: "Aksesuarlar" }, { name: "İnteraktif Oyun Figürleri" }, { name: "Konsollar" }, { name: "Oyunlar" }] },
      { name: "PlayStation 4", children: [{ name: "Aksesuarlar" }, { name: "İnteraktif Oyun Figürleri" }, { name: "Konsollar" }, { name: "Oyunlar" }, { name: "PlayStation VR Donanımı" }] },
      { name: "PC", children: [{ name: "Aksesuarlar" }, { name: "Oyunlar" }] },
      { name: "Eski Sistemler", children: [{ name: "Handheld Oyun Sistemleri" }, { name: "Nintendo Sistemleri" }, { name: "PlayStation Sistemleri" }, { name: "Xbox Sistemleri" }] },
      { name: "Elde Taşınabilir Oyun Sistemleri", children: [{ name: "ROG Ally" }, { name: "Steam Deck" }] }
    ]
  },
  {
    name: "Kişisel Bakım ve Kozmetik",
    children: [ { name: "Parfüm" }, { name: "Makyaj" }, { name: "Cilt Bakımı" }, { name: "Saç Bakımı" } ]
  },
  {
    name: "Spor ve Outdoor",
    children: [ { name: "Kamp ve Doğa Sporları" }, { name: "Fitness ve Kondisyon" }, { name: "Paten ve Kaykay" }, { name: "Su Sporları" } ]
  },
  {
    name: "Bebek", 
    children: [
      { 
        name: "Alt Değiştirme",
        children: [
          { name: "Alt Değiştirme Masaları" }, { name: "Bebek Bezi Çöp Kovaları ve Poşetleri" }, { name: "Bebek Bezi Torbaları ve Kutuları" },
          { name: "Bez Çocuk Bezi ve Aksesuarları" }, { name: "Çantalar" }, { name: "Bebek Mendiller ve Aksesuarlar" },
          { name: "Pedler ve Örtüler" }, { name: "Pişik Kremleri" }, { name: "Tek Kullanımlık Bezler" }
        ]
      },
      { name: "Bebek Bezleri" },
      { 
        name: "Sağlık ve Bakım Ürünleri",
        children: [
          { 
            name: "Bakım Mendilleri ve Aksesuarlar",
            children: [{ name: "Islak Mendiller" }, { name: "Kuru Mendiller" }, { name: "Mendil Isıtıcılar" }, { name: "Mendil Kutuları" }, { name: "Mendiller ve Yedekler" }]
          }
        ]
      },
      { 
        name: "Emzirme ve Besleme Ürünleri",
        children: [
          { name: "Alıştırma Bardakları" }, { name: "Bebek Gıdaları" },
          { name: "Biberonlar ve Aksesuarları", children: [{ name: "Biberon Emzikleri" }, { name: "Kurutmalıklar" }, { name: "Setler" }, { name: "Temizleme Ürünleri" }, { name: "Tutacaklar" }] },
          { name: "Blender, Mutfak Robotu ve Gıda Presleri" }, { name: "Çocuk Önlükleri" }, { name: "Emzirme Ürünleri" },
          { name: "Mama Hediye Setleri" }, { name: "Mama Isıtıcıları" }, { name: "Mama Saklama Kapları" },
          { name: "Mama Sandalyeleri ve Aksesuarları", children: [{ name: "Mama Sandalyeleri" }] },
          { name: "Müslin Bezler" }, { name: "Önlükler ve Ağız Bezleri" }, { name: "Sofra Eşyaları" }
        ]
      },
      {
        name: "Seyahat Ürünleri",
        children: [
          { name: "Oto Koltukları ve Aksesuarları", children: [{ name: "Oto Koltukları", children: [{ name: "Çok Amaçlı Koltuklar" }, { name: "Yenidoğanlar" }, { name: "Yükseltici Koltuklar" }] }] },
          { name: "Puset, Bebek Arabası ve Aksesuarları", children: [{ name: "Parçalar ve Aksesuarlar" }, { name: "Pusetler ve Bebek Arabaları" }] }
        ]
      },
      {
        name: "Bebek Odası",
        children: [{ name: "Dekorasyon" }, { name: "Mobilyalar" }, { name: "Yatak Takımları" }]
      },
      { name: "Bebek Giyim" },
      { 
        name: "Aktivite ve Eğlence",
        children: [
          { name: "Aktivite Kitapları" }, { name: "Aktivite Merkezleri" }, { name: "Banyo Oyuncakları" }, { name: "Bebek Oturakları ve Yatma Minderleri" },
          { name: "Dönenceler" }, { name: "Oyun Halıları ve Matları" }, { name: "Salıncaklar ve Sallanan Ana Kucakları" }, { name: "Yürüteçler" }
        ]
      },
      { 
        name: "Güvenlik Ekipmanları",
        children: [
          { name: "Banyo Güvenliği" },
          { name: "Bebek Telsizleri", children: [{ name: "Akıllı Monitörler" }, { name: "Sesli Monitörler" }, { name: "Video Monitörler" }] },
          { name: "Fetal Monitörler" }, { name: "Güvenlik Kapıları ve Kapı Uzatmaları" }, { name: "Güvenlik Kayışları" },
          { name: "İşitme Koruyucu Kulaklıklar" }, { name: "Korumalar ve Kilitler" }, { name: "Yatak Rayları" }
        ]
      },
      { 
        name: "Emzikler ve Diş Kaşıyıcılar",
        children: [{ name: "Diş Kaşıyıcılar" }, { name: "Emzik Aksesuarları" }, { name: "Emzikler" }]
      },
      { 
        name: "Tuvalet Eğitimi ve Basamaklar",
        children: [
          { name: "Lazımlık Islak Mendiller" }, { name: "Klozet Kapakları" }, { name: "Lazımlık Kuru Mendiller" }, { name: "Lazımlık Alıştırma Yardımcıları" },
          { name: "Lazımlıklar" }, { name: "Oturaklar" }, { name: "Portatif Lazımlıklar" }, { name: "Tek Kullanımlık Alıştırma Külotları" }, { name: "Tekrar Kullanılabilir Alıştırma Külotları" }
        ]
      }
    ]
  },
  {
    name: "Evcil Hayvan",
    children: [ { name: "Kedi" }, { name: "Köpek" }, { name: "Kuş" }, { name: "Balık" } ]
  },
  {
    name: "Gıda Ürünleri",
    children: [
      { name: "Temel Gıda" }, { name: "Atıştırmalık" }, { name: "İçecekler" },
      {
        name: "Bebek Beslenme",
        children: [
          { name: "Atıştırmalıklar, Krakerler ve Meyve Barları" }, { name: "Hazır Yemekler ve Yan Öğünler" },
          { name: "İçecekler ve Meyve Püreleri" }, { name: "Mama" }, { name: "Tahıllar ve Lapalar" }
        ]
      }
    ]
  },
  {
    name: "Kitap",
    children: [ { name: "Edebiyat" }, { name: "Tarih" }, { name: "Eğitim" }, { name: "Çocuk Kitapları" } ]
  },
  {
    name: "Yapı Market",
    children: [ { name: "Elektrik ve Aydınlatma" }, { name: "Hırdavat ve El Aletleri" }, { name: "İş Güvenliği" }, { name: "Boya" } ]
  }
];

async function seedCategory(node: any, parentId: string | null = null) {
  const generatedSlug = node.name.toLowerCase().replace(/[^a-z0-9\u011f\u011e\u0131\u0130\u00f6\u00d6\u00fc\u00dc\u015f\u015e\u00e7\u00c7]/g, "-") + "-" + Math.random().toString(36).substring(2, 8);
  const created = await prisma.globalCategory.create({
    data: { name: node.name, slug: generatedSlug, parentId: parentId }
  });

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await seedCategory(child, created.id);
    }
  }
}

async function run() {
  console.log("Wiping existing Global Categories to inject fresh parameters...");
  try {
    await prisma.categoryMapping.deleteMany();
    await prisma.globalCategory.deleteMany();
  } catch (e) {}

  console.log("Seeding extended amazon hierarchical taxonomy with strict deduplication rules...");
  for (const rootNode of catalogTree) {
    if (rootNode) await seedCategory(rootNode);
  }

  const count = await prisma.globalCategory.count();
  console.log(`Successfully seeded ${count} global categories.`);
  process.exit(0);
}

run();
