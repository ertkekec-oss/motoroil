# 🚀 MOTOROIL ERP - NATRO HOSTING KURULUM KILAVUZU

## 📋 ÖN HAZIRLIK

### Gerekli Bilgiler
- ✅ Natro Hosting hesabınız (cPanel erişimi)
- ✅ Domain adınız (örn: motoroil.com)
- ✅ FTP/SSH bilgileriniz
- ✅ MySQL veritabanı bilgileri

---

## 🎯 ADIM 1: YEREL BİLGİSAYARDA HAZIRLIK

### 1.1 Build Oluştur
```bash
cd "c:\Users\Life\Desktop\muhasebe app\motoroil"
npm run build
```

### 1.2 Yüklenecek Dosyaları Hazırla
Aşağıdaki dosya ve klasörleri ZIP olarak sıkıştırın:

**✅ Yüklenecekler:**
- `.next/` klasörü (build çıktısı)
- `public/` klasörü (statik dosyalar)
- `src/` klasörü (kaynak kodlar)
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`

**❌ Yüklenmeyecekler:**
- `node_modules/` (sunucuda yeniden kurulacak)
- `.git/`
- `.next/cache/`
- Markdown dosyalar (opsiyonel)

### 1.3 ZIP Dosyası Oluştur
```powershell
# PowerShell ile ZIP oluştur
Compress-Archive -Path ".next", "public", "src", "package.json", "package-lock.json", "next.config.ts", "tsconfig.json" -DestinationPath "motoroil-upload.zip"
```

---

## 🎯 ADIM 2: NATRO CPANEL'E GİRİŞ

### 2.1 cPanel'e Bağlan
1. Tarayıcıda aç: `https://cpanel.natro.com` (veya hosting sağlayıcınızın verdiği adres)
2. Kullanıcı adı ve şifrenizle giriş yapın

### 2.2 Node.js Desteğini Kontrol Et
1. cPanel ana sayfasında **"Setup Node.js App"** arayın
2. Yoksa → Natro destek ekibine "Node.js 18.x kurulumu" için ticket açın
3. Varsa → Devam edin

---

## 🎯 ADIM 3: MYSQL VERİTABANI OLUŞTUR

### 3.1 Veritabanı Oluştur
1. cPanel → **MySQL® Databases**
2. **Create New Database** bölümünde:
   - Database Name: `motoroil_db`
   - **Create Database** tıkla

### 3.2 Veritabanı Kullanıcısı Oluştur
1. Aynı sayfada **MySQL Users** bölümünde:
   - Username: `motoroil_user`
   - Password: **Güçlü bir şifre oluştur** (kaydet!)
   - **Create User** tıkla

### 3.3 Kullanıcıyı Veritabanına Ekle
1. **Add User To Database** bölümünde:
   - User: `motoroil_user`
   - Database: `motoroil_db`
   - **Add** tıkla
2. **ALL PRIVILEGES** seç
3. **Make Changes** tıkla

### 3.4 Bilgileri Kaydet
```
Veritabanı Sunucusu: localhost
Veritabanı Adı: cpanelusername_motoroil_db
Kullanıcı Adı: cpanelusername_motoroil_user
Şifre: [oluşturduğunuz şifre]
Port: 3306
```
⚠️ **ÖNEMLİ:** cPanel kullanıcı adınız otomatik olarak ön ek olarak eklenir!

---

## 🎯 ADIM 4: DOSYALARI YÜKLE

### 4.1 File Manager ile Yükle
1. cPanel → **File Manager**
2. `public_html` klasörüne git
3. **Upload** butonuna tıkla
4. `motoroil-upload.zip` dosyasını sürükle-bırak
5. Yükleme tamamlanınca **Extract** (Sıkıştırmayı Aç) tıkla

### 4.2 Alternatif: FTP ile Yükle
```
FTP Sunucu: ftp.yourdomain.com
Kullanıcı: [cPanel kullanıcı adınız]
Şifre: [cPanel şifreniz]
Port: 21
```
FileZilla veya WinSCP ile bağlanıp dosyaları `/public_html` dizinine yükleyin.

---

## 🎯 ADIM 5: NODE.JS UYGULAMASI KONFIGÜRASYONU

### 5.1 Setup Node.js App
1. cPanel → **Setup Node.js App**
2. **Create Application** tıkla
3. Ayarları yapın:

```
Node.js version: 18.x (en güncel)
Application mode: Production
Application root: public_html
Application URL: motoroil.com (veya subdomain)
Application startup file: server.js
```

4. **Create** tıkla

### 5.2 server.js Dosyası Oluştur
1. File Manager → `public_html` → **+ File**
2. Dosya adı: `server.js`
3. Düzenle ve aşağıdaki kodu yapıştır:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false; // Production mode
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

5. **Save Changes**

### 5.3 Environment Variables (.env.local)
1. File Manager → `public_html` → **+ File**
2. Dosya adı: `.env.local`
3. Düzenle:

```env
# Veritabanı
DATABASE_URL=mysql://cpanelusername_motoroil_user:SIFRENIZ@localhost:3306/cpanelusername_motoroil_db

# Güvenlik
JWT_SECRET=super-secret-key-change-this-in-production-12345678
NEXT_PUBLIC_API_URL=https://motoroil.com

# Ortam
NODE_ENV=production
PORT=3000
```

4. **Save Changes**

---

## 🎯 ADIM 6: BAĞIMLILIKLARI KURU

### 6.1 Terminal Aç
1. cPanel → **Terminal** (veya **SSH Access**)
2. Komutları çalıştır:

```bash
# Proje dizinine git
cd ~/public_html

# Node.js versiyonunu kontrol et
node -v
# Çıktı: v18.x.x olmalı

# npm versiyonunu kontrol et
npm -v

# Bağımlılıkları kur (production)
npm install --production

# Build'i kontrol et
ls -la .next/

# Uygulamayı başlat (test)
npm start
```

### 6.2 Uygulama Çalışıyor mu Kontrol Et
Tarayıcıda: `http://sunucu-ip:3000`
✅ Sayfa açılıyorsa başarılı!

---

## 🎯 ADIM 7: .HTACCESS İLE DOMAIN BAĞLA

### 7.1 .htaccess Dosyası Oluştur
1. File Manager → `public_html` → **+ File**
2. Dosya adı: `.htaccess`
3. Düzenle:

```apache
# Node.js uygulamasına yönlendir
RewriteEngine On

# HTTPS zorla (SSL varsa)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Ana sayfa yönlendirmesi
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]

# Tüm istekleri Node.js'e yönlendir
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

4. **Save Changes**

### 7.2 mod_proxy Aktif mi Kontrol Et
Eğer 500 hatası alırsanız:
1. Natro destek ekibine ticket açın
2. "mod_proxy ve mod_proxy_http modüllerini aktif edin" deyin

---

## 🎯 ADIM 8: UYGULAMAYI SÜREKLİ ÇALIŞTIR (PM2)

### 8.1 PM2 Kur
```bash
cd ~/public_html
npm install -g pm2
```

### 8.2 Uygulamayı PM2 ile Başlat
```bash
# Uygulamayı başlat
pm2 start server.js --name motoroil

# Durum kontrol et
pm2 status

# Logları görüntüle
pm2 logs motoroil

# Otomatik başlatma (sunucu yeniden başladığında)
pm2 startup
pm2 save
```

### 8.3 PM2 Komutları
```bash
# Yeniden başlat
pm2 restart motoroil

# Durdur
pm2 stop motoroil

# Sil
pm2 delete motoroil

# Logları temizle
pm2 flush
```

---

## 🎯 ADIM 9: SSL SERTİFİKASI (HTTPS)

### 9.1 Let's Encrypt SSL (Ücretsiz)
1. cPanel → **SSL/TLS Status**
2. Domain seç: `motoroil.com`
3. **Run AutoSSL** tıkla
4. 2-5 dakika bekle
5. ✅ Yeşil kilit simgesi görünmeli

### 9.2 Manuel SSL Kurulumu
1. cPanel → **SSL/TLS**
2. **Manage SSL Sites**
3. Sertifika, Private Key, CA Bundle girin
4. **Install Certificate**

---

## 🎯 ADIM 10: KURULUM SIHIRBAZINI ÇALIŞTIR

### 10.1 Tarayıcıda Aç
```
https://motoroil.com/setup
```

### 10.2 Veritabanı Bilgilerini Gir
- **Sunucu**: `localhost`
- **Port**: `3306`
- **Veritabanı**: `cpanelusername_motoroil_db`
- **Kullanıcı**: `cpanelusername_motoroil_user`
- **Şifre**: [oluşturduğunuz şifre]

### 10.3 Admin Hesabı Oluştur
- **Ad Soyad**: Yönetici Adınız
- **E-posta**: admin@motoroil.com
- **Şifre**: Güçlü bir şifre (min 6 karakter)

### 10.4 Firma Bilgileri
- **Firma Adı**: MOTOROIL
- **Vergi No**: Vergi numaranız
- **Adres**: İş yeri adresiniz
- **Telefon**: İletişim numaranız

### 10.5 Kurulumu Tamamla
1. **Kurulumu Başlat** tıkla
2. 2-3 dakika bekle
3. ✅ "Kurulum başarılı" mesajı
4. **Sisteme Giriş Yap**

---

## 🎯 ADIM 11: GÜVENLİK AYARLARI

### 11.1 /setup Sayfasını Devre Dışı Bırak
```bash
cd ~/public_html/src/app
mv setup setup.disabled
```

### 11.2 Dosya İzinlerini Ayarla
```bash
cd ~/public_html
chmod 755 public
chmod 644 .env.local
chmod 600 .env.local  # Daha güvenli
```

### 11.3 Güvenlik Duvarı (Firewall)
cPanel → **IP Blocker**
- Gereksiz IP'leri engelleyin
- Sadece Türkiye IP'lerine izin verin (opsiyonel)

---

## 🔧 SORUN GİDERME

### ❌ Sorun: "500 Internal Server Error"
**Çözüm:**
1. `.htaccess` dosyasını kontrol et
2. mod_proxy aktif mi kontrol et
3. Error log kontrol et: cPanel → **Errors**

### ❌ Sorun: "Cannot find module"
**Çözüm:**
```bash
cd ~/public_html
rm -rf node_modules
npm install --production
pm2 restart motoroil
```

### ❌ Sorun: "Port 3000 already in use"
**Çözüm:**
```bash
# Çalışan işlemi bul
lsof -i :3000

# İşlemi sonlandır
kill -9 [PID]

# Veya PM2 ile yeniden başlat
pm2 restart motoroil
```

### ❌ Sorun: "Database connection failed"
**Çözüm:**
1. `.env.local` dosyasındaki bilgileri kontrol et
2. MySQL kullanıcısı ve şifresi doğru mu?
3. cPanel → **phpMyAdmin** ile veritabanına bağlanmayı dene

### ❌ Sorun: "Application not starting"
**Çözüm:**
```bash
# Logları kontrol et
pm2 logs motoroil

# Manuel başlat ve hataları gör
cd ~/public_html
npm start
```

---

## 📊 PERFORMANS OPTİMİZASYONU

### 1. Gzip Sıkıştırma
`.htaccess` dosyasına ekle:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### 2. Browser Caching
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 3. Cloudflare CDN (Ücretsiz)
1. https://cloudflare.com hesap aç
2. Domain ekle
3. Nameserver'ları değiştir
4. SSL/TLS → Full
5. Speed → Optimization → Auto Minify (JS, CSS, HTML)

---

## 📞 NATRO DESTEK

### Destek Kanalları
- **Telefon**: 0850 460 0 460
- **E-posta**: destek@natro.com
- **Canlı Destek**: https://www.natro.com (sağ alt köşe)
- **Ticket Sistemi**: cPanel → **Support**

### Sık Sorulan Sorular
**S: Node.js versiyonu nasıl değiştirilir?**
C: cPanel → Setup Node.js App → Version seç → Restart

**S: Uygulama çöktüğünde otomatik yeniden başlar mı?**
C: Evet, PM2 kullanıyorsanız otomatik yeniden başlar.

**S: Veritabanı yedeği nasıl alınır?**
C: cPanel → phpMyAdmin → Export → SQL

---

## ✅ KURULUM KONTROL LİSTESİ

- [ ] Build oluşturuldu (`npm run build`)
- [ ] ZIP dosyası hazırlandı
- [ ] cPanel'e giriş yapıldı
- [ ] MySQL veritabanı oluşturuldu
- [ ] MySQL kullanıcısı oluşturuldu
- [ ] Dosyalar yüklendi (FTP/File Manager)
- [ ] Node.js uygulaması oluşturuldu
- [ ] `server.js` dosyası oluşturuldu
- [ ] `.env.local` dosyası oluşturuldu
- [ ] `npm install` çalıştırıldı
- [ ] `.htaccess` dosyası oluşturuldu
- [ ] PM2 kuruldu ve uygulama başlatıldı
- [ ] SSL sertifikası kuruldu
- [ ] Domain bağlandı
- [ ] `/setup` sayfası çalıştırıldı
- [ ] Admin hesabı oluşturuldu
- [ ] İlk giriş yapıldı
- [ ] `/setup` sayfası devre dışı bırakıldı
- [ ] Yedekleme sistemi kuruldu

---

## 📝 NOTLAR

**Kurulum Tarihi**: _____________  
**Domain**: _____________  
**cPanel Kullanıcı Adı**: _____________  
**Veritabanı Adı**: _____________  
**Veritabanı Kullanıcısı**: _____________  
**Veritabanı Şifresi**: _____________ (güvenli yerde saklayın!)

---

**Son Güncelleme**: 25 Ocak 2026  
**Versiyon**: 1.0  
**Durum**: Production Ready ✅

---

## 🎉 KURULUM TAMAMLANDI!

Artık MOTOROIL ERP sisteminiz canlıda! 

**Sıradaki Adımlar:**
1. Entegrasyonları kurun (Nilvera, Trendyol, vb.)
2. Ürünlerinizi ekleyin
3. Personel hesapları oluşturun
4. İlk satışı yapın

**Başarılar! 🚀**
