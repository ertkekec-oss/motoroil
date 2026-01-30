# 📋 NATRO KURULUM - HIZLI REFERANS KARTI

## ⚡ 10 ADIMDA NATRO KURULUMU

```
┌─────────────────────────────────────────────────────────────┐
│  MOTOROIL ERP - NATRO DEPLOYMENT HIZLI REHBERİ              │
└─────────────────────────────────────────────────────────────┘

1️⃣  PANEL GİRİŞİ
    → https://panel.natro.com
    → Giriş yap

2️⃣  YENİ SİTE OLUŞTUR
    → Hosting → Yeni Site
    → Node.js + Next.js
    → Domain: motoroil.com

3️⃣  DATABASE OLUŞTUR
    → Veritabanları → PostgreSQL
    → motoroil_db
    → Connection string kaydet

4️⃣  ZIP YÜKLE
    → Dosya Yöneticisi → public_html
    → motoroil-natro-upload.zip yükle
    → Extract et

5️⃣  ENV VARIABLES
    → Ayarlar → Environment Variables
    → DATABASE_URL, API keys ekle

6️⃣  TERMINAL KURULUM
    → cd ~/public_html
    → npm install

7️⃣  PM2 BAŞLAT
    → npm install -g pm2
    → pm2 start ecosystem.config.json
    → pm2 startup && pm2 save

8️⃣  SSL KUR
    → SSL/TLS → AutoSSL
    → Let's Encrypt (ücretsiz)

9️⃣  TEST ET
    → https://motoroil.com
    → Login yap
    → API'leri test et

🔟  GÜVENLİK
    → Admin şifresi değiştir
    → Yedekleme aktif et

✅  TAMAMLANDI!
```

---

## 🔑 ÖNEMLİ BİLGİLER

### Database Connection String
```
postgresql://motoroil_user:SIFRE@localhost:5432/motoroil_db
```

### Environment Variables (Minimum)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://motoroil.com
JWT_SECRET=32_karakter_rastgele
SESSION_SECRET=32_karakter_rastgele
```

### Terminal Komutları
```bash
# Kurulum
cd ~/public_html
npm install

# PM2
pm2 start ecosystem.config.json
pm2 status
pm2 logs motoroil
pm2 restart motoroil

# Sorun Giderme
rm -rf .next node_modules
npm install
npm run build
```

---

## ⏱️ SÜRE TAHMİNİ

| Adım | Süre |
|------|------|
| Panel giriş + site oluştur | 5 dk |
| Database oluştur | 2 dk |
| Zip yükle | 3-5 dk |
| Zip extract | 1-2 dk |
| Env variables ekle | 5-10 dk |
| npm install | 3-5 dk |
| PM2 başlat | 2 dk |
| SSL kur | 3-5 dk |
| Test | 5 dk |
| **TOPLAM** | **30-45 dk** |

---

## 🆘 HIZLI SORUN ÇÖZÜM

### Site açılmıyor?
```bash
pm2 logs motoroil
```

### Database bağlanamıyor?
- DATABASE_URL kontrol et
- PostgreSQL çalışıyor mu?

### Build hatası?
```bash
rm -rf .next node_modules
npm install
npm run build
```

### API çalışmıyor?
- Environment variables doğru mu?
- API anahtarları production mu?

---

## 📞 DESTEK

**Natro**: destek@natro.com | 0850 460 0 460  
**Detaylı Rehber**: NATRO_ADIM_ADIM.md  
**Checklist**: DEPLOYMENT_CHECKLIST.md

---

**Yazdır ve masanızda tutun! 📌**
