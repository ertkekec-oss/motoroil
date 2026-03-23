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
      { name: "Aydınlatma", children: [
        { name: "Ampuller" }, { name: "Dış Mekan Aydınlatma" }, { name: "İç Mekan Aydınlatma" }, { name: "LED Hortumlar" }, { name: "Ticari Aydınlatma Ürünleri" }, { name: "Yılbaşı Işıklandırmaları" }
      ]},
      { name: "Banyo", children: [] },
      { name: "Dini ve Manevi Ürünler", children: [] },
      { name: "Ev Aletleri", children: [
        { name: "Beyaz Eşya Parça ve Aksesuarları" }, { name: "Bulaşık Makineleri ve Bulaşık Kurutucuları" }, { name: "Çamaşır Makineleri ve Kurutucular" }, { name: "Çöp, Kompost ve Geri Dönüşüm" }, { name: "Dondurucular ve Buzdolapları" }, { name: "Fırınlar ve Ocaklar" }, { name: "Kompakt Mutfak Üniteleri" }
      ]},
      { name: "Ev Dekorasyonu", children: [
        { name: "Aynalar" }, { name: "Bebek Odası Dekorasyonu" }, { name: "Çocuk Odası Dekorasyonu" }, { name: "Dekoratif Aksesuarlar" }, { name: "Duvar ve Masa Saatleri" }, { name: "Fotoğraf Albümleri, Çerçeveler ve Aksesuarlar" }, { name: "Halılar, Pedler ve Koruyucular" }, { name: "İç Mekan Fıskiye Aksesuarları" }, { name: "İç Mekan Fıskiyeleri" }, { name: "Kapı Altı Rüzgar Önleyiciler" }, { name: "Kumbaralar" }, { name: "Kurutulmuş ve Korunmuş Flora" }, { name: "Magnetler" }, { name: "Mevsimlik Süsler" }, { name: "Misafir Defterleri" }, { name: "Mobilya ve Koltuk Kılıfları" }, { name: "Mumlar, Mumluklar ve Aksesuarları" }, { name: "Not Tahtaları" }, { name: "Oda Kokuları" }, { name: "Perde ve Güneşlik Aksesuarları" }, { name: "Perdeler, Jaluziler ve Panjurlar" }, { name: "Rüya Yakalayıcılar" }, { name: "Tabela ve Levhalar" }, { name: "Vazolar" }, { name: "Yapay ve Kurutulmuş Bitkiler" }
      ]},
      { name: "Ev İçin Düzenleme ve Depolama Ürünleri", children: [
        { name: "Askı Kancaları" }, { name: "Banyo İçin Düzenleme ve Depolama Ürünleri" }, { name: "Çamaşır Odası Ürünleri" }, { name: "Çöp ve Geri Dönüşüm Kutuları" }, { name: "Ev-Ofis Saklama Çözümleri" }, { name: "Garajlar İçin Saklama Çözümleri" }, { name: "Giysi ve Dolap İçi Saklama Çözümleri" }, { name: "Mutfak Saklama ve Düzenleme" }, { name: "Raflar ve Çekmeceler" }, { name: "Sepetler ve Kovalar" }, { name: "Yılbaşı Dekorasyonu Saklama Çözümleri" }
      ]},
      { name: "Ev Tekstili ve Uyku Setleri", children: [
        { name: "Banyo Tekstili" }, { name: "Çocuk Yatak Takımları" }, { name: "Dekoratif Minderler, Minder Kılıfları ve Aksesuarları" }, { name: "Halılar ve Kilimler" }, { name: "Kreş Yatak Takımları" }, { name: "Mutfak Tekstili" }, { name: "Perdeler ve Güneşlikler" }, { name: "Perde ve Güneşlik Aksesuarları" }, { name: "Şişme Yataklar, Yastıklar ve Aksesuarları" }, { name: "Uyku Setleri" }, { name: "Yatak Aksesuarları" }, { name: "Yatak Odası Tekstili" }
      ]},
      { name: "Mobilyalar", children: [
        { name: "Antre Mobilyaları" }, { name: "Bahçe Mobilyaları ve Aksesuarları" }, { name: "Banyo Mobilyaları" }, { name: "Bebek Odası Mobilyaları" }, { name: "Çocuk Mobilyaları" }, { name: "Ev İçin Bar Mobilyaları" }, { name: "Ev-Ofis Mobilyaları" }, { name: "Mobilya Garantileri" }, { name: "Mutfak Mobilyaları" }, { name: "Oturma Odası Mobilyaları" }, { name: "Yatak Odası Mobilyaları" }, { name: "Yemek Odası Mobilyaları" }
      ]},
      { name: "Resimler, Posterler ve Heykeller", children: [
        { name: "Baskılar ve Posterler" }, { name: "Duvar Çıkartmaları ve Resimleri" }, { name: "Duvar Kilim ve Örtüleri" }, { name: "Fotoğraflar" }, { name: "Heykeller" }, { name: "Tablolar" }
      ]},
      { name: "Temizlik Aletleri", children: [
        { name: "Buharlı Temizleyici Aksesuarları" }, { name: "Buharlı Temizleyiciler ve Zemin Cila Makineleri" }, { name: "Elektrikli Süpürge Aksesuarları" }, { name: "Elektrikli Süpürgeler" }, { name: "Faraş ve Fırça Takımları" }, { name: "Fırçalar" }, { name: "Halı Yıkayıcı Aksesuarları" }, { name: "Halı Yıkayıcılar" }, { name: "Kovalar" }, { name: "Paspaslar" }, { name: "Saplı Süpürgeler ve Süpürücüler" }, { name: "Silecekler" }, { name: "Süngerler" }, { name: "Süpürme Parçaları ve Aksesuarları" }, { name: "Teleskopik Saplar" }, { name: "Temizlik Bezleri" }, { name: "Toz Alma Püskülleri" }
      ]},
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
      { name: "Kadın Kıyafet", children: [
        { name: "Çorap ve Külotlu Çorap" },
        { name: "Dış Giyim", children: [
          { name: "Ceket" }, { name: "Mont ve Kaban" }, { name: "Yağmurluk" }, { name: "Yelek" }
        ]},
        { name: "Elbise", children: [
          { name: "Abiye" }, { name: "Gelinlik" }, { name: "Günlük" }, { name: "İş" }, { name: "Kokteyl" }, { name: "Parti" }
        ]},
        { name: "Etek" },
        { name: "Ev Giyimi, İç Çamaşırı ve İç Giyim" },
        { name: "Hamile", children: [
          { name: "Elbise" }, { name: "Emzirme" }, { name: "Etek" }, { name: "İç Çamaşırı ve İç Giyim" }, { name: "Jean" }, { name: "Montlar, Ceketler ve Yelekler" }, { name: "Pantolon" }, { name: "Plaj Giyim" }, { name: "Spor Giyim" }, { name: "Sweatshirt" }, { name: "Şort" }, { name: "Takım" }, { name: "Tayt" }, { name: "Triko" }, { name: "Uyku Giyimi" }, { name: "Üst ve T-shirt" }
        ]},
        { name: "Jean" },
        { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" },
        { name: "Kar ve Yağmur Kıyafeti" },
        { name: "Pantolon" },
        { name: "Plaj Giyim", children: [
          { name: "Bikini" }, { name: "Döküntü Koruma" }, { name: "Gömlekleri" }, { name: "Döküntü Koruyucu Setler" }, { name: "Mayo" }, { name: "Monokiniler" }, { name: "Plaj Elbisesi ve Pareo" }, { name: "Şort" }, { name: "Tankini" }
        ]},
        { name: "Salopet" },
        { name: "Spor Giyim", children: [
          { name: "Elbise" }, { name: "Eşofman Altı" }, { name: "Eşofman Üstü" }, { name: "Etek ve Şort Etek" }, { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" }, { name: "Tozluklar" }, { name: "Spor Atlet ve İç Giyim" }, { name: "Spor Çorabı" }, { name: "Şort" }, { name: "Takım" }, { name: "Triko" }, { name: "T-shirt ve Polo Yaka T-shirt" }, { name: "Yelek" }, { name: "İçlik ve Kompresyon" }
        ]},
        { name: "Şort" },
        { name: "Takım Elbise ve Blazer Ceket" },
        { name: "Tayt" },
        { name: "Tesettür Giyim" },
        { name: "Triko", children: [
          { name: "Askılı Triko" }, { name: "Hırka" }, { name: "Hırka Ceket" }, { name: "İkili Takım" }, { name: "Kazak" }, { name: "Panço ve Pelerin" }
        ]},
        { name: "Tulum" },
        { name: "Üst ve T-shirt", children: [
          { name: "Askılı Bluz ve Kolsuz Üst" }, { name: "Bluz ve Gömlek" }, { name: "Polo Yaka T-shirt" }, { name: "T-shirt" }, { name: "Tunik" }
        ]}
      ]},
      { name: "Kadın Ayakkabı", children: [
        { name: "Babet" }, { name: "Topuklu Ayakkabı" }, { name: "Bot ve Çizme" }, { name: "Spor ve Outdoor Ayakkabısı" }, { name: "Sneaker" }, { name: "Sandalet" }, { name: "Terlik" }
      ]},
      { name: "Erkek Kıyafet", children: [
        { name: "Dış Giyim", children: [
          { name: "Ceket" }, { name: "Mont ve Kaban" }, { name: "Yağmurluk" }, { name: "Yelek" }
        ]},
        { name: "Gömlek" },
        { name: "Sweatshirt" },
        { name: "Jean" },
        { name: "Pantolon" },
        { name: "Takım Elbise ve Blazer Ceket", children: [
          { name: "Blazer Ceket" }, { name: "Smokin" }, { name: "Takım Ceketi" }, { name: "Takım Elbise" }, { name: "Takım Pantolonu" }, { name: "Takım Yeleği" }
        ]},
        { name: "Spor Giyim", children: [
          { name: "Eşofman Altı" }, { name: "Eşofman Üstü" }, { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" }, { name: "Tozluklar" }, { name: "Spor Atlet ve İç Giyim" }, { name: "Spor Çorabı" }, { name: "Şort" }, { name: "Takım" }, { name: "Triko" }, { name: "T-shirt ve Polo Yaka T-shirt" }, { name: "İçlik ve Kompresyon" }, { name: "Yelekler" }
        ]},
        { name: "Triko" },
        { name: "Üst ve Tişört", children: [
          { name: "Polo Yaka Tişört" }, { name: "Tişört" }, { name: "Yakası Düğmeli Gömlekler" }, { name: "Yelek" }
        ]},
        { name: "Ev Giyimi", children: [
          { name: "Bornoz" }, { name: "Günlük Şort" }, { name: "Pijama Altı" }, { name: "Pijama Takımı" }, { name: "Pijama Üstü" }
        ]},
        { name: "Plaj Giyim" }
      ]},
      { name: "Erkek Ayakkabı", children: [
        { name: "Bağcıklı Ayakkabı" }, { name: "Bot ve Çizme" }, { name: "Düz Ayakkabı" }, { name: "Sandalet" }, { name: "Sneaker" }, 
        { name: "Spor ve Outdoor Ayakkabısı", children: [
          { name: "Basketbol Ayakkabısı" }, { name: "Bisiklet Ayakkabısı" }, { name: "Cross Training Ayakkabısı" }, { name: "Fitness Ayakkabısı" }, { name: "Futbol Ayakkabısı" }, { name: "Havuz Ayakkabısı" }, { name: "Hentbol Ayakkabısı" }, { name: "Jimnastik Ayakkabısı" }, { name: "Kapalı Alan Ayakkabısı" }, { name: "Kaykay Ayakkabısı" }, { name: "Koşu Ayakkabısı" }, { name: "Yürüyüş Ayakkabısı" }, { name: "Salon Futbolu Ayakkabısı" }, { name: "Spor ve Outdoor Sandaleti" }, { name: "Tenis Ayakkabısı" }, { name: "Tırmanış Ayakkabısı" }, { name: "Trekking ve Yürüyüş" }, { name: "Triatlon Ayakkabısı" }, { name: "Voleybol Ayakkabısı" }
        ]}
      ]},
      { name: "Aksesuarlar", children: [
        { name: "Güneş Gözlüğü" }, { name: "Şapka" }, { name: "Çanta" }, { name: "Cüzdan ve Kartlık" }, { name: "Kemer" }
      ]},
      { name: "Kız Çocuk Kıyafet", children: [
        { name: "Çorap, Külotlu Çorap ve Tayt" },
        { name: "Dış Giyim" },
        { name: "Elbise" },
        { name: "Etek ve Şort Etek" },
        { name: "İç Giyim" },
        { name: "Jean" },
        { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" },
        { name: "Kar ve Yağmur Kıyafeti" },
        { name: "Pantolon" },
        { name: "Pijama ve Bornoz", children: [
          { name: "Pijama Altı" }, { name: "Pijama Takımı" }, { name: "Tulum" }
        ]},
        { name: "Plaj Giyim" },
        { name: "Spor Giyim", children: [
          { name: "Elbise" }, { name: "Eşofman Altı" }, { name: "Eşofman Üstü" }, { name: "Etek ve Şort Etek" }, { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" }, { name: "Tozluklar" }, { name: "Külot ve Sütyen" }, { name: "Spor Çorap" }, { name: "Şort" }, { name: "Takım" }, { name: "Triko" }, { name: "T-shirt ve Polo Yaka T-shirt" }, { name: "İçlik ve Kompresyon" }
        ]},
        { name: "Şort" },
        { name: "Takım" },
        { name: "Triko" },
        { name: "Tulum" },
        { name: "Üst ve T-shirt" }
      ]},
      { name: "Erkek Çocuk Kıyafet", children: [
        { name: "Çorap ve İç Çamaşırı" },
        { name: "Dış Giyim", children: [
          { name: "Ceket" }, { name: "Mont ve Kaban" }, { name: "Yağmurluk" }, { name: "Yelek" }
        ]},
        { name: "İç Giyim" },
        { name: "Jean" },
        { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" },
        { name: "Kar ve Yağmur Kıyafeti" },
        { name: "Pantolon" },
        { name: "Pijama ve Bornoz" },
        { name: "Plaj Giyim" },
        { name: "Spor Giyim", children: [
          { name: "Eşofman Altı" }, { name: "Eşofman Üstü" }, { name: "İç Giyim" }, { name: "Kapüşonlu ve Kapüşonsuz Sweatshirt" }, { name: "Tozluklar" }, { name: "Spor Çorabı" }, { name: "Şort" }, { name: "Takım" }, { name: "Triko" }, { name: "T-shirt ve Polo Yaka T-shirt" }, { name: "İçlik ve Kompresyon" }, { name: "Yelek" }
        ]},
        { name: "Şort" },
        { name: "Takım" },
        { name: "Takım Elbise ve Blazer Ceket", children: [
          { name: "Blazer Ceket" }, { name: "Smokin" }, { name: "Takım Ceketi" }, { name: "Takım Elbise" }, { name: "Takım Pantolonu" }, { name: "Takım Yeleği" }
        ]},
        { name: "Triko" },
        { name: "Tulum" },
        { name: "Üst ve T-shirt", children: [
          { name: "Gömlek" }, { name: "Kolsuz Üst" }, { name: "Polo Yaka T-shirt" }, { name: "T-shirt" }
        ]}
      ]},
      { name: "Kız Bebek Kıyafet", children: [
        { name: "Alt Giyim" }, { name: "Body ve Tek Parça Kıyafet" }, { name: "Çorap ve Külotlu Çorap" }, { name: "Dış Giyim" }, { name: "Elbise" }, { name: "İç Giyim" }, { name: "Kar ve Yağmur Kıyafeti" }, { name: "Pijama ve Bornoz" }, { name: "Plaj Giyim" }, { name: "Sweatshirt ve Eşofman" }, { name: "Takım" }, { name: "Triko" }, { name: "Üst" }
      ]},
      { name: "Erkek Bebek Kıyafet", children: [
        { name: "Alt Giyim" }, { name: "Çorap ve Külotlu Çorap" }, { name: "Dış Giyim" }, { name: "İç Giyim" }, { name: "Pijama ve Bornoz" }, { name: "Plaj Giyim" }, { name: "Sweatshirt ve Eşofman" }, { name: "Takım" }, { name: "Takım Elbise ve Blazer Ceket" }, { name: "Triko" }, { name: "Üst" }, { name: "Zıbın ve Tek Parça Kıyafet" }
      ]},
      { name: "Kız Bebek Ayakkabı", children: [
        { name: "Clog ve Mule Terlik" }, { name: "İlk Adım Ayakkabısı" }, { name: "Patik" }, { name: "Sandalet" }, { name: "Spor ve Outdoor Ayakkabılar" }
      ]},
      { name: "Erkek Bebek Ayakkabı", children: [
        { name: "İlk Adım Ayakkabısı" }, { name: "Patik" }, { name: "Sandalet" }, { name: "Spor ve Outdoor Ayakkabılar" }
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
          const l3Node = await prisma.globalCategory.upsert({
            where: { slug: l3Slug },
            update: { name: l3.name, parentId: l2Node.id },
            create: {
              name: l3.name,
              slug: l3Slug,
              parentId: l2Node.id
            }
          });
          
          if (l3.children) {
            for (const l4 of l3.children) {
              const l4Slug = l4.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
              await prisma.globalCategory.upsert({
                where: { slug: l4Slug },
                update: { name: l4.name, parentId: l3Node.id },
                create: {
                  name: l4.name,
                  slug: l4Slug,
                  parentId: l3Node.id
                }
              });
            }
          }
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
