# 🚀 MOTOROIL ERP - NATRO DEPLOYMENT ÖZET

## 📅 Son Güncelleme: 25 Ocak 2026

---

## ✅ HAZIR OLAN DOSYALAR

### 1. Uygulama Dosyaları
- ✅ **motoroil-natro-upload.zip** - Deployment paketi hazır
- ✅ **package.json** - Bağımlılıklar tanımlı
- ✅ **next.config.js** - Next.js yapılandırması

### 2. Deployment Dosyaları
- ✅ **ecosystem.config.json** - PM2 yapılandırması
- ✅ **deploy.sh** - Otomatik deployment script
- ✅ **.env.production** - Production environment template
- ✅ **.gitignore** - Güvenlik için gerekli

### 3. Dokümantasyon
- ✅ **NATRO_DEPLOYMENT.md** - Detaylı deployment rehberi
- ✅ **NATRO_QUICKSTART.md** - Hızlı başlangıç kılavuzu
- ✅ **DEPLOYMENT_CHECKLIST.md** - Adım adım kontrol listesi
- ✅ **ENTEGRASYON_KILAVUZU.md** - API entegrasyon rehberi

---

## 🎯 ŞİMDİ YAPILACAKLAR

### Adım 1: API Anahtarlarını Hazırlayın
`.env.production` dosyasını açın ve gerçek değerleri girin:

```env
# ÖNEMLİ: Aşağıdaki değerleri gerçek API anahtarlarınızla değiştirin!

# Nilvera (Production)
NILVERA_API_KEY=gerçek_api_key_buraya
NILVERA_API_SECRET=gerçek_api_secret_buraya

# Trendyol (Production)
TRENDYOL_API_KEY=gerçek_api_key_buraya
TRENDYOL_API_SECRET=gerçek_api_secret_buraya

# Diğer entegrasyonlar...
```

### Adım 2: Natro Panel'e Gidin
1. https://panel.natro.com
2. Giriş yapın
3. **Hosting** → **Yeni Site Ekle**

### Adım 3: Zip Dosyasını Yükleyin
1. Dosya Yöneticisi → Upload
2. `motoroil-natro-upload.zip` yükleyin
3. Extract edin

### Adım 4: Database Oluşturun
1. Natro Panel → Veritabanları
2. Yeni PostgreSQL database
3. Connection string'i kopyalayın

### Adım 5: Environment Variables Ekleyin
1. Natro Panel → Ayarlar → Environment Variables
2. `.env.production` dosyasındaki tüm değişkenleri ekleyin
3. DATABASE_URL'i yapıştırın

### Adım 6: Deploy Edin
Natro Terminal'de:
```bash
npm install
npm run build
pm2 start ecosystem.config.json
pm2 startup
pm2 save
```

---

## 📋 HIZLI KONTROL LİSTESİ

Deployment öncesi:
- [ ] `.env.production` gerçek değerlerle dolduruldu
- [ ] API anahtarları (production) hazır
- [ ] Database bilgileri hazır

Natro Panel:
- [ ] Hesap aktif
- [ ] Zip yüklendi
- [ ] Database oluşturuldu
- [ ] Environment variables eklendi

Deployment:
- [ ] npm install ✅
- [ ] npm build ✅
- [ ] PM2 başlatıldı ✅

Test:
- [ ] Site açılıyor
- [ ] Login çalışıyor
- [ ] API'ler bağlı

---

## 🆘 SORUN ÇÖZÜM

### Build hatası?
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Site açılmıyor?
```bash
pm2 logs motoroil
# Hata mesajlarını kontrol edin
```

### Database bağlanamıyor?
- DATABASE_URL doğru mu kontrol edin
- PostgreSQL servisi çalışıyor mu?

---

## 📞 DESTEK

### Detaylı Rehberler
- **Deployment**: `NATRO_DEPLOYMENT.md` okuyun
- **Hızlı Başlangıç**: `NATRO_QUICKSTART.md` okuyun
- **Checklist**: `DEPLOYMENT_CHECKLIST.md` kullanın
- **Entegrasyon**: `ENTEGRASYON_KILAVUZU.md` okuyun

### Natro Destek
- Panel: https://panel.natro.com
- Email: destek@natro.com
- Telefon: 0850 XXX XX XX

---

## 🎉 BAŞARILAR!

Tüm dosyalar hazır. Artık Natro'da canlıya geçebilirsiniz!

**Önemli**: `.env.production` dosyasındaki değerleri mutlaka gerçek API anahtarlarınızla değiştirin!

---

**Hazırlayan**: AI Assistant  
**Tarih**: 25 Ocak 2026  
**Durum**: Ready for Production ✅
