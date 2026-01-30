# 🚀 NATRO HIZLI BAŞLANGIÇ

## ⚡ 5 Dakikada Canlıya Geçin

### 1️⃣ Natro Panel'e Giriş
```
https://panel.natro.com
```

### 2️⃣ Zip Dosyasını Yükle
- Dosya Yöneticisi → Upload
- `motoroil-natro-upload.zip` yükle
- Extract et

### 3️⃣ Environment Variables Ekle
Natro Panel → Ayarlar → Environment Variables

**Minimum Gerekli:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/motoroil_db
NEXT_PUBLIC_APP_URL=https://motoroil.natro.app
NODE_ENV=production
JWT_SECRET=your_random_secret_here
```

### 4️⃣ Terminal'de Çalıştır
```bash
npm install
npm run build
npm start
```

### 5️⃣ PM2 ile Başlat (Önerilen)
```bash
npm install -g pm2
pm2 start npm --name motoroil -- start
pm2 startup
pm2 save
```

---

## 🎯 Hızlı Komutlar

### Deployment
```bash
# Otomatik deployment
chmod +x deploy.sh
./deploy.sh
```

### Monitoring
```bash
# Status
pm2 status

# Loglar
pm2 logs motoroil

# Restart
pm2 restart motoroil

# Stop
pm2 stop motoroil
```

### Troubleshooting
```bash
# Cache temizle
rm -rf .next node_modules
npm install
npm run build

# Logları kontrol et
pm2 logs motoroil --lines 50
```

---

## ✅ Kontrol Listesi

- [ ] Zip yüklendi ve extract edildi
- [ ] Environment variables eklendi
- [ ] Database oluşturuldu
- [ ] `npm install` çalıştırıldı
- [ ] `npm run build` başarılı
- [ ] PM2 ile başlatıldı
- [ ] Site açılıyor: https://motoroil.natro.app
- [ ] Login çalışıyor

---

## 🆘 Sorun mu var?

### Site açılmıyor
```bash
pm2 logs motoroil
# Hata mesajlarını kontrol et
```

### Build hatası
```bash
npm run build
# Hata detaylarını oku
```

### Database bağlanamıyor
- DATABASE_URL doğru mu kontrol et
- PostgreSQL servisi çalışıyor mu?

---

## 📞 Destek
- Natro Destek: destek@natro.com
- Dokümantasyon: NATRO_DEPLOYMENT.md
- Entegrasyon: ENTEGRASYON_KILAVUZU.md
