# 🚀 MOTOROIL ERP - HOSTING KURULUM KILAVUZU

## 📋 GEREKSİNİMLER

### Hosting Gereksinimleri
- **Node.js**: v18.0 veya üzeri
- **RAM**: Minimum 512MB (Önerilen: 1GB+)
- **Disk Alanı**: Minimum 500MB
- **Veritabanı**: MySQL 5.7+ veya PostgreSQL 12+
- **SSL Sertifikası**: Önerilen (Let's Encrypt ücretsiz)

### Desteklenen Hosting Sağlayıcıları
- ✅ Vercel (Önerilen - Ücretsiz)
- ✅ Netlify
- ✅ Railway
- ✅ DigitalOcean
- ✅ AWS
- ✅ Heroku
- ✅ Natro Hosting (Türkiye)
- ✅ Turhost (Türkiye)

---

## 🎯 YÖNTEM 1: VERCEL (ÖNERİLEN - ÜCRETSİZ)

### Adım 1: Proje Hazırlığı
```bash
# Proje dizinine git
cd "c:\Users\Life\Desktop\muhasebe app\motoroil"

# Build oluştur
npm run build

# Test et
npm start
```

### Adım 2: Vercel'e Yükle

#### A) Vercel CLI ile (Kolay)
```bash
# Vercel CLI kur
npm install -g vercel

# Giriş yap
vercel login

# Deploy et
vercel

# Production'a al
vercel --prod
```

#### B) GitHub üzerinden (Otomatik)
1. GitHub hesabı oluştur (github.com)
2. Yeni repository oluştur
3. Projeyi GitHub'a yükle:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/motoroil.git
git push -u origin main
```
4. Vercel.com'a git
5. "Import Project" → GitHub repository seç
6. Deploy'a tıkla
7. 2 dakika içinde hazır!

### Adım 3: Kurulum Sihirbazını Çalıştır
1. Tarayıcıda aç: `https://your-app.vercel.app/setup`
2. Veritabanı bilgilerini gir
3. Admin hesabı oluştur
4. Firma bilgilerini gir
5. Kurulumu tamamla

---

## 🎯 YÖNTEM 2: CPANEL HOSTING (NATRO, TURHOST)

### Adım 1: Build Oluştur
```bash
cd "c:\Users\Life\Desktop\muhasebe app\motoroil"
npm run build
```

### Adım 2: Dosyaları Hazırla
1. `.next` klasörünü sıkıştır (ZIP)
2. `public` klasörünü sıkıştır
3. `package.json` dosyasını kopyala
4. `next.config.js` dosyasını kopyala (varsa)

### Adım 3: Hosting'e Yükle
1. cPanel'e giriş yap
2. File Manager → public_html
3. ZIP dosyalarını yükle
4. Sıkıştırmayı aç
5. Terminal aç:
```bash
cd public_html
npm install --production
npm start
```

### Adım 4: Node.js Uygulaması Oluştur
1. cPanel → Setup Node.js App
2. Node.js Version: 18.x seç
3. Application Root: `/home/kullanici/public_html`
4. Application URL: `motoroil.com`
5. Application Startup File: `server.js`
6. Create

### Adım 5: .htaccess Ayarla
```apache
RewriteEngine On
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

---

## 🎯 YÖNTEM 3: VPS (DIGITALOCEAN, AWS)

### Adım 1: Sunucu Hazırlığı
```bash
# SSH ile bağlan
ssh root@your-server-ip

# Node.js kur
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kur (Process Manager)
npm install -g pm2

# Nginx kur
sudo apt install nginx
```

### Adım 2: Projeyi Yükle
```bash
# Proje dizini oluştur
mkdir /var/www/motoroil
cd /var/www/motoroil

# Dosyaları yükle (FTP veya Git)
git clone https://github.com/KULLANICI_ADINIZ/motoroil.git .

# Bağımlılıkları kur
npm install

# Build oluştur
npm run build
```

### Adım 3: PM2 ile Başlat
```bash
# Uygulamayı başlat
pm2 start npm --name "motoroil" -- start

# Otomatik başlatma
pm2 startup
pm2 save
```

### Adım 4: Nginx Yapılandır
```nginx
# /etc/nginx/sites-available/motoroil
server {
    listen 80;
    server_name motoroil.com www.motoroil.com;

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

```bash
# Nginx'i aktifleştir
sudo ln -s /etc/nginx/sites-available/motoroil /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Adım 5: SSL Sertifikası (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d motoroil.com -d www.motoroil.com
```

---

## 🔧 KURULUM SONRASI AYARLAR

### 1. Kurulum Sihirbazını Çalıştır
```
https://motoroil.com/setup
```

### 2. Veritabanı Bilgilerini Gir
- **Sunucu**: localhost (veya hosting sağlayıcınızın verdiği)
- **Port**: 3306 (MySQL) veya 5432 (PostgreSQL)
- **Veritabanı Adı**: motoroil_db
- **Kullanıcı**: (Hosting panelinden oluşturun)
- **Şifre**: (Güçlü bir şifre belirleyin)

### 3. Admin Hesabı Oluştur
- **Ad Soyad**: Yönetici adınız
- **E-posta**: admin@motoroil.com
- **Şifre**: En az 6 karakter

### 4. Firma Bilgilerini Gir
- **Firma Adı**: MOTOROIL
- **Adres**: İş yerinizin adresi
- **Telefon**: İletişim numarası
- **Vergi No**: Vergi numaranız

### 5. Kurulumu Tamamla
- "Kurulumu Başlat" butonuna tıklayın
- 2-3 dakika bekleyin
- "Sisteme Giriş Yap" ile giriş yapın

---

## 🔒 GÜVENLİK ÖNERİLERİ

### 1. Kurulum Sonrası
```bash
# /setup sayfasını devre dışı bırak
# src/app/setup/page.tsx dosyasını sil veya yeniden adlandır
```

### 2. Ortam Değişkenleri (.env)
```env
# .env.local oluştur
DATABASE_URL=mysql://user:password@localhost:3306/motoroil_db
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
```

### 3. Güvenlik Duvarı
```bash
# UFW kur (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 4. Düzenli Yedekleme
```bash
# Veritabanı yedeği (günlük)
mysqldump -u root -p motoroil_db > backup_$(date +%Y%m%d).sql

# Dosya yedeği
tar -czf motoroil_backup_$(date +%Y%m%d).tar.gz /var/www/motoroil
```

---

## 🐛 SORUN GİDERME

### Sorun: "Cannot find module" hatası
**Çözüm**:
```bash
npm install
npm run build
```

### Sorun: Port 3000 kullanımda
**Çözüm**:
```bash
# .env dosyasında port değiştir
PORT=3001
```

### Sorun: Veritabanı bağlantı hatası
**Çözüm**:
1. MySQL/PostgreSQL çalışıyor mu kontrol et
2. Kullanıcı adı ve şifre doğru mu?
3. Veritabanı oluşturuldu mu?

### Sorun: 502 Bad Gateway (Nginx)
**Çözüm**:
```bash
# PM2 durumunu kontrol et
pm2 status

# Uygulamayı yeniden başlat
pm2 restart motoroil
```

---

## 📞 DESTEK

### Hosting Önerileri
- **Küçük İşletme**: Vercel (Ücretsiz) veya Natro Hosting (₺50/ay)
- **Orta İşletme**: DigitalOcean Droplet ($12/ay)
- **Büyük İşletme**: AWS veya Azure

### Performans İpuçları
- CDN kullanın (Cloudflare ücretsiz)
- Veritabanı indeksleme yapın
- Redis cache ekleyin
- Nginx gzip sıkıştırma aktif edin

---

## ✅ KURULUM KONTROL LİSTESİ

- [ ] Node.js kuruldu
- [ ] Veritabanı oluşturuldu
- [ ] Proje build edildi
- [ ] Hosting'e yüklendi
- [ ] Domain bağlandı
- [ ] SSL sertifikası kuruldu
- [ ] Kurulum sihirbazı çalıştırıldı
- [ ] Admin hesabı oluşturuldu
- [ ] İlk giriş yapıldı
- [ ] /setup sayfası devre dışı bırakıldı
- [ ] Yedekleme sistemi kuruldu

---

**Kurulum Tarihi**: _____________  
**Domain**: _____________  
**Hosting**: _____________  
**Veritabanı**: _____________
