# 🚀 MOTOROIL ERP - NATRO DEPLOYMENT REHBERİ

## 📦 Hazırlık Aşaması

### 1. Zip Dosyası Kontrolü
✅ Zip dosyası oluşturuldu: `motoroil-natro-upload.zip`

### 2. Gerekli Dosyalar
- ✅ `package.json` - Bağımlılıklar tanımlı
- ✅ `next.config.js` - Next.js yapılandırması
- ⚠️ `.env.production` - **ÖNEMLİ: Gerçek API anahtarlarınızı girin!**

---

## 🌐 NATRO PANEL İŞLEMLERİ

### Adım 1: Natro Paneline Giriş
1. https://panel.natro.com adresine gidin
2. Hesabınızla giriş yapın
3. **Hosting** → **Yeni Site Ekle**

### Adım 2: Site Oluşturma
1. **Site Türü**: Node.js Application
2. **Framework**: Next.js
3. **Node Versiyonu**: 20.x (önerilen)
4. **Domain**: motoroil.natro.app (veya kendi domain'iniz)
5. **SSL**: Otomatik Let's Encrypt (ücretsiz)

### Adım 3: Dosya Yükleme
1. **Dosya Yöneticisi** → **Upload**
2. `motoroil-natro-upload.zip` dosyasını yükleyin
3. Zip dosyasını **Extract** edin
4. Ana dizine çıkarıldığından emin olun

### Adım 4: Environment Variables (Çevre Değişkenleri)
1. Natro Panel → **Ayarlar** → **Environment Variables**
2. `.env.production` dosyasındaki tüm değişkenleri ekleyin:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://motoroil.natro.app
NODE_ENV=production
NILVERA_API_KEY=...
TRENDYOL_API_KEY=...
... (tüm değişkenler)
```

### Adım 5: Database Kurulumu
1. Natro Panel → **Veritabanları** → **Yeni PostgreSQL**
2. Database adı: `motoroil_db`
3. Kullanıcı adı ve şifre oluşturun
4. Connection string'i kopyalayın
5. `DATABASE_URL` environment variable'ına yapıştırın

### Adım 6: Build ve Deploy
1. Natro Panel → **Terminal** açın
2. Aşağıdaki komutları sırayla çalıştırın:

```bash
# Bağımlılıkları yükle
npm install

# Production build
npm run build

# Uygulamayı başlat
npm start
```

### Adım 7: PM2 ile Otomatik Başlatma
```bash
# PM2 yükle (global)
npm install -g pm2

# Uygulamayı PM2 ile başlat
pm2 start npm --name "motoroil" -- start

# Otomatik başlatmayı aktif et
pm2 startup
pm2 save
```

---

## 🔧 NATRO ÖZEL AYARLAR

### nginx Yapılandırması (Natro otomatik yapar)
Eğer manuel yapılandırma gerekirse:

```nginx
server {
    listen 80;
    server_name motoroil.natro.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Port Ayarları
- Next.js varsayılan port: **3000**
- Natro otomatik proxy yapar
- Özel port gerekirse `package.json`'da değiştirin:
  ```json
  "start": "next start -p 3001"
  ```

---

## 📊 DEPLOYMENT SONRASI KONTROLLER

### 1. Site Erişim Testi
- [ ] https://motoroil.natro.app açılıyor mu?
- [ ] SSL sertifikası aktif mi? (🔒 ikonu)
- [ ] Login sayfası görünüyor mu?

### 2. API Testleri
- [ ] Nilvera E-Fatura bağlantısı çalışıyor mu?
- [ ] Trendyol API bağlantısı çalışıyor mu?
- [ ] Database bağlantısı çalışıyor mu?

### 3. Fonksiyon Testleri
- [ ] Login yapılabiliyor mu?
- [ ] POS sayfası açılıyor mu?
- [ ] Satış kaydı yapılabiliyor mu?
- [ ] E-Fatura gönderilebiliyor mu?
- [ ] Raporlar çalışıyor mu?

### 4. Performance Testi
```bash
# Natro terminal'den
pm2 monit
```
- CPU kullanımı normal mi?
- Memory kullanımı normal mi?
- Response time hızlı mı?

---

## 🐛 SORUN GİDERME

### Sorun: "Application Error"
**Çözüm**:
```bash
# Logları kontrol et
pm2 logs motoroil

# Uygulamayı yeniden başlat
pm2 restart motoroil
```

### Sorun: "Database Connection Error"
**Çözüm**:
1. `DATABASE_URL` doğru mu kontrol et
2. PostgreSQL servisi çalışıyor mu?
3. Firewall kuralları doğru mu?

### Sorun: "Build Failed"
**Çözüm**:
```bash
# Cache'i temizle
rm -rf .next
rm -rf node_modules

# Yeniden yükle ve build et
npm install
npm run build
```

### Sorun: "Environment Variables Not Working"
**Çözüm**:
1. Natro Panel'den env variables'ı kontrol et
2. PM2'yi restart et: `pm2 restart motoroil`
3. Server'ı reboot et (son çare)

---

## 🔒 GÜVENLİK KONTROL LİSTESİ

### Üretim Öncesi Güvenlik
- [ ] Tüm API anahtarları production versiyonları
- [ ] `.env` dosyası `.gitignore`'da
- [ ] JWT_SECRET güçlü ve rastgele
- [ ] Database şifresi güçlü
- [ ] HTTPS aktif (SSL)
- [ ] CORS ayarları yapılandırılmış
- [ ] Rate limiting aktif
- [ ] SQL injection koruması var

---

## 📈 İZLEME VE BAKIM

### Günlük Kontroller
```bash
# PM2 status
pm2 status

# Logları izle
pm2 logs motoroil --lines 100

# CPU/Memory izle
pm2 monit
```

### Haftalık Bakım
- [ ] Disk alanı kontrolü
- [ ] Log dosyalarını temizle
- [ ] Database backup al
- [ ] Güvenlik güncellemeleri kontrol et

### Aylık Bakım
- [ ] Bağımlılıkları güncelle: `npm update`
- [ ] Performance analizi
- [ ] Kullanıcı geri bildirimleri değerlendir

---

## 🔄 GÜNCELLEME SÜRECİ

### Yeni Versiyon Deploy Etme
```bash
# 1. Yeni kodu yükle (FTP veya Git)
# 2. Bağımlılıkları güncelle
npm install

# 3. Yeniden build et
npm run build

# 4. PM2 ile restart
pm2 restart motoroil

# 5. Kontrol et
pm2 logs motoroil
```

---

## 📞 DESTEK

### Natro Destek
- **Panel**: https://panel.natro.com
- **Destek**: destek@natro.com
- **Telefon**: 0850 XXX XX XX
- **Dokümantasyon**: https://docs.natro.com

### Acil Durum
- Database backup: Natro Panel → Veritabanları → Backup
- Site backup: Natro Panel → Dosya Yöneticisi → Backup
- Rollback: Önceki backup'ı restore et

---

## ✅ DEPLOYMENT KONTROL LİSTESİ

### Ön Hazırlık
- [✅] Zip dosyası hazır
- [ ] `.env.production` gerçek değerlerle dolduruldu
- [ ] Database bilgileri hazır
- [ ] API anahtarları (production) hazır

### Natro Panel
- [ ] Hesap oluşturuldu/giriş yapıldı
- [ ] Node.js hosting paketi aktif
- [ ] Domain ayarlandı
- [ ] SSL sertifikası aktif

### Deployment
- [ ] Dosyalar yüklendi
- [ ] Environment variables eklendi
- [ ] Database oluşturuldu
- [ ] npm install tamamlandı
- [ ] npm build başarılı
- [ ] PM2 ile başlatıldı

### Test
- [ ] Site açılıyor
- [ ] Login çalışıyor
- [ ] API'ler bağlı
- [ ] E-Fatura test edildi
- [ ] Pazaryerleri test edildi

### Canlı
- [ ] Tüm testler başarılı
- [ ] Monitoring aktif
- [ ] Backup planı hazır
- [ ] Kullanıcılara duyuru yapıldı

---

**Deployment Tarihi**: _____________________  
**Deploy Eden**: _____________________  
**Versiyon**: 1.0  
**Durum**: Ready for Production ✅
