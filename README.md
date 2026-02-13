# 🏢 MOTOROIL ERP - Garaj ve Oto Yedek Parça Yönetim Sistemi

> **Versiyon**: 3.0  
> **Durum**: Production Ready ✅  
> **Son Güncelleme**: 25 Ocak 2026

---

## 🚀 HIZLI BAŞLANGIÇ

### Yerel Geliştirme
```bash
cd "c:\Users\Life\Desktop\muhasebe app\motoroil"
npm install  # İlk kurulum için
npm run dev  # Geliştirme sunucusu
```
**Tarayıcı**: http://localhost:3000

### Kurulum Sihirbazı
İlk kurulum için: http://localhost:3000/setup

---

## 📋 PROJE HAKKINDA

MOTOROIL ERP, motosiklet ve bisiklet yedek parça satışı yapan işletmeler için geliştirilmiş kapsamlı bir işletme yönetim sistemidir.

### Temel Modüller
- 🏮 **POS Terminal** - Hızlı satış ve ödeme işlemleri
- 🏛️ **Finansal Yönetim** - Muhasebe, kasa, banka yönetimi
- 📥 **Envanter & Depo** - Stok takibi ve yönetimi
- 🤝 **Cari Hesaplar** - Müşteri alacak/borç takibi
- 🚚 **Tedarikçi Ağı** - Tedarikçi yönetimi
- 👤 **Ekip Yönetimi** - Personel ve yetki kontrolü
- 🛡️ **Güvenlik Kalkanı** - Şüpheli işlem tespiti
- 📊 **Veri Analizi** - Raporlama ve analizler

---

## ✨ ÖNE ÇIKAN ÖZELLİKLER

### 🔐 Gelişmiş Yetki Sistemi
- Rol bazlı erişim kontrolü
- Şube bazlı veri izolasyonu
- Kritik işlemler için admin onayı
- Ürün kartı onay akışı

### 💰 Finansal Yönetim
- Kasalar arası virman
- Taksitli kredi kartı satışı (2-12 taksit)
- Otomatik komisyon hesaplama
- Çek/senet takibi
- Alacak/borç yönetimi

### 📊 Akıllı Raporlama
- Şube bazlı performans analizi
- Stok uyarı sistemi
- Satış trendleri
- Kar/zarar hesaplamaları

### 🛡️ Güvenlik
- Şüpheli satış tespiti (AI destekli)
- Para sızıntısı takibi
- Komisyon kayıt sistemi
- Kullanıcı aktivite logları

---

## 🌐 HOSTING'E YÜKLEME

### Yöntem 1: Vercel (Önerilen - Ücretsiz)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Yöntem 2: cPanel Hosting
1. `npm run build` ile build oluştur
2. Dosyaları FTP ile yükle
3. cPanel → Node.js App oluştur
4. http://your-domain.com/setup adresine git

### Detaylı Kurulum Kılavuzu
📖 **[HOSTING_KURULUM.md](./HOSTING_KURULUM.md)** dosyasını okuyun

---

## 🎯 KURULUM SİHİRBAZI

### Özellikler
✅ WordPress tarzı adım adım kurulum  
✅ Veritabanı otomatik yapılandırma  
✅ Admin hesabı oluşturma  
✅ Firma bilgileri ayarlama  
✅ Hata kontrolü ve doğrulama  

### Kurulum Adımları
1. **Veritabanı Ayarları** - MySQL/PostgreSQL bilgileri
2. **Yönetici Hesabı** - Admin kullanıcı oluşturma
3. **Firma Bilgileri** - Şirket detayları
4. **Kurulum** - Otomatik kurulum işlemi
5. **Tamamlandı** - Sisteme giriş

### Erişim
```
http://your-domain.com/setup
```

---

## 📁 PROJE YAPISI

```
motoroil/
├── src/
│   ├── app/
│   │   ├── page.tsx              # POS Terminal
│   │   ├── setup/page.tsx        # Kurulum Sihirbazı ⭐
│   │   ├── accounting/           # Muhasebe
│   │   ├── customers/            # Cari Hesaplar
│   │   ├── inventory/            # Envanter
│   │   ├── staff/                # Personel
│   │   ├── security/             # Güvenlik
│   │   └── settings/             # Ayarlar
│   ├── components/               # Bileşenler
│   └── contexts/                 # Global State
├── HOSTING_KURULUM.md           # Hosting Kılavuzu ⭐
├── GELISTIRME_DURUMU.md         # Durum Raporu
├── HIZLI_BASLANGIC.md           # Hızlı Başlangıç
└── README.md                     # Bu dosya
```

---

## 🔧 TEKNOLOJİLER

- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript
- **Stil**: Vanilla CSS + CSS Variables
- **State Yönetimi**: React Context API
- **Build Tool**: Turbopack

---

## 📖 DOKÜMANTASYON

### Kullanıcı Kılavuzları
1. **[HOSTING_KURULUM.md](./HOSTING_KURULUM.md)** - Hosting'e yükleme kılavuzu ⭐
2. **[HIZLI_BASLANGIC.md](./HIZLI_BASLANGIC.md)** - Hızlı başlangıç
3. **[GELISTIRME_DURUMU.md](./GELISTIRME_DURUMU.md)** - Özellik durumu

### Geliştirici Dokümantasyonu
4. **[KRITIK_YETKI_SISTEMI.md](./KRITIK_YETKI_SISTEMI.md)** - Yetki sistemi
5. **[OZELLIK_DURUMU.md](./OZELLIK_DURUMU.md)** - Özellik tablosu

---

## 🎯 TAMAMLANMA DURUMU

```
████████████████████ 100% TAMAMLANDI!

✅ Kritik Yetkiler       100%
✅ Şube İzolasyonu       100%
✅ Cari Yönetimi         100%
✅ Virman Sistemi        100%
✅ Taksitli Satış        100%
✅ Kurulum Sihirbazı     100% ⭐
```

---

## 🚀 PRODUCTION DEPLOYMENT

### Gereksinimler
- Node.js 18+
- MySQL 5.7+ veya PostgreSQL 12+
- 512MB+ RAM
- SSL Sertifikası (Önerilen)

### Önerilen Hosting
- **Küçük İşletme**: Vercel (Ücretsiz)
- **Orta İşletme**: DigitalOcean ($12/ay)
- **Büyük İşletme**: AWS/Azure

### Kurulum Süresi
⏱️ **5-10 dakika** (Kurulum sihirbazı ile)

---

## ⚙️ PRODUCTION SETUP (Marketplace Action Platform)

### 🔴 Redis Kurulumu (Upstash - Ücretsiz)

Marketplace aksiyonları (etiket yazdırma, kargo değiştirme, durum yenileme) için Redis gereklidir.

#### 1. Upstash Redis Oluştur
```bash
# https://upstash.com adresine git
# → Create Database
# → Region: EU (Europe) seç
# → Database Name: motoroil-redis
# → Create
```

#### 2. Redis URL'i Kopyala
```bash
# Dashboard → motoroil-redis → Details
# → REDIS_URL'i kopyala
# Örnek: rediss://default:YOUR_PASSWORD@optimal-mollusk-18716.upstash.io:6379
```

#### 3. Vercel Environment Variables Ekle
```bash
# Vercel Dashboard → motoroil-projects → Settings → Environment Variables

# Eklenecek değişken:
REDIS_URL=rediss://default:YOUR_PASSWORD@optimal-mollusk-18716.upstash.io:6379
```

#### 4. Deploy
```bash
git add .
git commit -m "Production: Upstash Redis configured"
vercel --prod
```

### ✅ Production Validation Checklist

Deployment sonrası aşağıdaki kontrolleri yapın:

```bash
# 1. REDIS_URL var mı?
vercel env ls
# → REDIS_URL görünmeli

# 2. Redis bağlantısı çalışıyor mu?
# Vercel Logs → "redis_connected" event'i arayın

# 3. Marketplace Actions API çalışıyor mu?
# Test: POST /api/marketplaces/trendyol/orders/{orderId}/actions
# Expected: 202 Accepted

# 4. Queue çalışıyor mu?
# Vercel Logs → "job_enqueued" event'i arayın

# 5. Worker processing yapıyor mu?
# Vercel Logs → "worker_started" event'i arayın
# Vercel Logs → "job_active" event'i arayın

# 6. Label download çalışıyor mu?
# Test: GET /api/marketplaces/trendyol/orders/{orderId}/label?shipmentPackageId=XXX
# Expected: 302 Redirect to S3
```

### 🚨 Troubleshooting

**Sorun**: `REDIS_URL missing` hatası  
**Çözüm**: Vercel environment variables'a `REDIS_URL` ekleyin ve redeploy yapın

**Sorun**: `ECONNREFUSED 127.0.0.1:6379`  
**Çözüm**: Localhost Redis kullanılıyor. `REDIS_URL` environment variable'ını kontrol edin

**Sorun**: `503 Service Unavailable`  
**Çözüm**: Redis bağlantısı başarısız. Upstash dashboard'dan Redis'in aktif olduğunu kontrol edin

**Sorun**: `409 shipmentPackageId missing`  
**Çözüm**: Önce "Durum Yenile" butonuna tıklayın, ardından etiket yazdırın

### 📊 Monitoring

Vercel Functions Logs'u izleyin:
```bash
vercel logs https://www.kech.tr --follow
```

Aranacak event'ler:
- `redis_connected` - Redis bağlantısı başarılı
- `job_enqueued` - İş kuyruğa eklendi
- `worker_started` - Worker başlatıldı
- `job_active` - İş işleniyor
- `job_completed` - İş tamamlandı
- `job_failed` - İş başarısız

---

## 🔒 GÜVENLİK

### Kurulum Sonrası
1. `/setup` sayfasını devre dışı bırakın
2. `.env` dosyasında güçlü şifreler kullanın
3. SSL sertifikası kurun
4. Düzenli yedekleme yapın

### Güvenlik Özellikleri
- ✅ Rol bazlı erişim kontrolü
- ✅ Şube bazlı veri izolasyonu
- ✅ Şüpheli işlem tespiti
- ✅ Aktivite logları

---

## 🐛 SORUN GİDERME

### Kurulum Sorunları
**Sorun**: Veritabanı bağlantı hatası  
**Çözüm**: Veritabanı bilgilerini kontrol edin

**Sorun**: Port 3000 kullanımda  
**Çözüm**: `.env` dosyasında `PORT=3001` ayarlayın

**Sorun**: Build hatası  
**Çözüm**: `npm install` ve `npm run build` komutlarını çalıştırın

### Detaylı Sorun Giderme
📖 **[HOSTING_KURULUM.md](./HOSTING_KURULUM.md)** → Sorun Giderme bölümü

---

## 📞 DESTEK

### Hosting Önerileri
- **Vercel**: https://vercel.com (Ücretsiz)
- **DigitalOcean**: https://digitalocean.com ($12/ay)
- **Natro**: https://www.natro.com (Türkiye)

### Performans İpuçları
- CDN kullanın (Cloudflare)
- Veritabanı indeksleme
- Redis cache
- Nginx gzip sıkıştırma

---

## 📜 LİSANS

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

---

## 🙏 TEŞEKKÜRLER

Bu projeyi geliştirirken kullanılan açık kaynak kütüphanelere teşekkürler:
- Next.js
- React
- TypeScript

---

## 📊 PROJE İSTATİSTİKLERİ

**Toplam Kod Satırı**: ~16,000+  
**Toplam Dosya**: 30+  
**Aktif Özellik**: 10+  
**Tamamlanma**: 100% ✅

---

**Son Güncelleme**: 25 Ocak 2026, 03:26  
**Versiyon**: 3.0.0  
**Build**: Production Ready ✅
