# 📋 MOTOROIL ERP - NATRO DEPLOYMENT CHECKLIST

## Tarih: _______________
## Deploy Eden: _______________

---

## 🎯 ÖN HAZIRLIK

### Dosya Kontrolü
- [✅] `motoroil-natro-upload.zip` oluşturuldu
- [ ] `.env.production` gerçek değerlerle dolduruldu
- [✅] `ecosystem.config.json` hazır
- [✅] `deploy.sh` hazır
- [✅] `package.json` kontrol edildi
- [✅] `NATRO_DEPLOYMENT.md` okundu

### API Anahtarları Hazırlığı
- [ ] **Nilvera** (Production)
  - [ ] API Key: ________________
  - [ ] API Secret: ________________
  - [ ] VKN: ________________
  - [ ] Ortam: Production ✅

- [ ] **Trendyol** (Production)
  - [ ] API Key: ________________
  - [ ] API Secret: ________________
  - [ ] Supplier ID: ________________

- [ ] **Hepsiburada** (Production)
  - [ ] Merchant ID: ________________
  - [ ] Username: ________________
  - [ ] Password: ________________

- [ ] **N11** (Production)
  - [ ] API Key: ________________
  - [ ] API Secret: ________________

- [ ] **Amazon** (Production)
  - [ ] Seller ID: ________________
  - [ ] MWS Auth Token: ________________
  - [ ] Access Key: ________________
  - [ ] Secret Key: ________________

### Güvenlik
- [ ] JWT_SECRET oluşturuldu (min 32 karakter)
- [ ] SESSION_SECRET oluşturuldu (min 32 karakter)
- [ ] Database şifresi güçlü (min 16 karakter)

---

## 🌐 NATRO PANEL İŞLEMLERİ

### 1. Hesap ve Hosting
- [ ] Natro hesabı aktif
- [ ] Node.js hosting paketi satın alındı
- [ ] Panel'e giriş yapıldı: https://panel.natro.com

### 2. Site Kurulumu
- [ ] Yeni site oluşturuldu
- [ ] Site türü: Node.js Application
- [ ] Framework: Next.js
- [ ] Node versiyonu: 20.x seçildi
- [ ] Domain ayarlandı: ________________

### 3. SSL Sertifikası
- [ ] Let's Encrypt SSL aktif edildi
- [ ] HTTPS yönlendirmesi aktif
- [ ] SSL sertifikası doğrulandı (🔒)

### 4. Database
- [ ] PostgreSQL database oluşturuldu
- [ ] Database adı: motoroil_db
- [ ] Kullanıcı adı: ________________
- [ ] Şifre: ________________
- [ ] Host: ________________
- [ ] Port: 5432
- [ ] Connection string kopyalandı

### 5. Dosya Yükleme
- [ ] Dosya Yöneticisi açıldı
- [ ] `motoroil-natro-upload.zip` yüklendi
- [ ] Zip dosyası extract edildi
- [ ] Dosyalar doğru dizinde

### 6. Environment Variables
- [ ] Natro Panel → Ayarlar → Environment Variables
- [ ] Tüm değişkenler eklendi:
  - [ ] DATABASE_URL
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] NODE_ENV=production
  - [ ] JWT_SECRET
  - [ ] SESSION_SECRET
  - [ ] NILVERA_API_KEY
  - [ ] NILVERA_API_SECRET
  - [ ] TRENDYOL_API_KEY
  - [ ] (diğer tüm API anahtarları)

---

## 🚀 DEPLOYMENT

### 7. Terminal İşlemleri
- [ ] Natro Terminal açıldı
- [ ] Proje dizinine gidildi
- [ ] `npm install` çalıştırıldı
  - [ ] Başarılı ✅
  - [ ] Hata varsa: ________________
- [ ] `npm run build` çalıştırıldı
  - [ ] Başarılı ✅
  - [ ] Hata varsa: ________________

### 8. PM2 Kurulumu
- [ ] `npm install -g pm2` çalıştırıldı
- [ ] PM2 versiyonu kontrol edildi: `pm2 --version`
- [ ] `pm2 start ecosystem.config.json` çalıştırıldı
- [ ] `pm2 status` kontrol edildi
- [ ] Uygulama "online" durumda ✅

### 9. Otomatik Başlatma
- [ ] `pm2 startup` çalıştırıldı
- [ ] Çıkan komutu çalıştırdı
- [ ] `pm2 save` çalıştırıldı
- [ ] Server reboot testi yapıldı

---

## ✅ TEST VE DOĞRULAMA

### 10. Site Erişim
- [ ] Site açılıyor: https://________________
- [ ] SSL aktif (🔒 ikonu görünüyor)
- [ ] Ana sayfa yükleniyor
- [ ] Responsive tasarım çalışıyor
- [ ] Mobil görünüm test edildi

### 11. Fonksiyonel Testler
- [ ] **Login Sayfası**
  - [ ] Sayfa açılıyor
  - [ ] Form çalışıyor
  - [ ] Giriş yapılabiliyor
  - [ ] Hatalı giriş kontrolü çalışıyor

- [ ] **Dashboard**
  - [ ] Sayfa yükleniyor
  - [ ] Grafikler görünüyor
  - [ ] Veriler doğru

- [ ] **POS Sayfası**
  - [ ] Sayfa açılıyor
  - [ ] Ürün arama çalışıyor
  - [ ] Sepete ekleme çalışıyor
  - [ ] Satış tamamlanabiliyor

- [ ] **Faturalar**
  - [ ] Liste görünüyor
  - [ ] Fatura detayı açılıyor
  - [ ] PDF oluşturuluyor

- [ ] **Raporlar**
  - [ ] Satış raporu çalışıyor
  - [ ] Kar/Zarar raporu çalışıyor
  - [ ] Excel export çalışıyor

### 12. Entegrasyon Testleri
- [ ] **Nilvera E-Fatura**
  - [ ] Bağlantı testi başarılı
  - [ ] Test faturası gönderildi
  - [ ] Fatura GİB'e ulaştı
  - [ ] Durum: ________________

- [ ] **Trendyol**
  - [ ] API bağlantısı başarılı
  - [ ] Sipariş çekme test edildi
  - [ ] Stok güncelleme test edildi
  - [ ] Durum: ________________

- [ ] **Hepsiburada**
  - [ ] API bağlantısı başarılı
  - [ ] Test siparişi alındı
  - [ ] Durum: ________________

- [ ] **N11**
  - [ ] API bağlantısı başarılı
  - [ ] Durum: ________________

### 13. Database Testleri
- [ ] Bağlantı başarılı
- [ ] Veri yazma çalışıyor
- [ ] Veri okuma çalışıyor
- [ ] Backup alındı

### 14. Performance Testleri
- [ ] Sayfa yüklenme hızı: _____ saniye
- [ ] API response time: _____ ms
- [ ] Memory kullanımı: _____ MB
- [ ] CPU kullanımı: _____ %
- [ ] `pm2 monit` kontrol edildi

---

## 📊 MONİTORİNG

### 15. Log Kontrolü
- [ ] `pm2 logs motoroil` çalıştırıldı
- [ ] Hata yok ✅
- [ ] Varsa hatalar: ________________

### 16. Monitoring Kurulumu
- [ ] PM2 monitoring aktif
- [ ] Log dosyaları oluşturuldu
- [ ] Error log: `./logs/pm2-error.log`
- [ ] Out log: `./logs/pm2-out.log`

---

## 🔒 GÜVENLİK

### 17. Güvenlik Kontrolleri
- [ ] HTTPS zorunlu
- [ ] API anahtarları environment variables'da
- [ ] `.env` dosyası `.gitignore`'da
- [ ] Database şifresi güçlü
- [ ] JWT secret güçlü
- [ ] CORS ayarları yapılandırılmış
- [ ] Rate limiting aktif
- [ ] SQL injection koruması var

---

## 📦 BACKUP

### 18. Backup Planı
- [ ] Database backup alındı
- [ ] Dosya backup alındı
- [ ] Backup lokasyonu: ________________
- [ ] Otomatik backup planı oluşturuldu
- [ ] Backup sıklığı: Günlük ✅

---

## 📢 KULLANICI BİLDİRİMİ

### 19. Duyuru
- [ ] Kullanıcılara email gönderildi
- [ ] Yeni URL bildirildi: ________________
- [ ] Login bilgileri paylaşıldı
- [ ] Kullanım kılavuzu gönderildi

---

## 📝 DOKÜMANTASYON

### 20. Dokümantasyon Güncellemesi
- [ ] Deployment tarihi kaydedildi
- [ ] API endpoint'leri dokümante edildi
- [ ] Kullanıcı kılavuzu güncellendi
- [ ] Troubleshooting rehberi hazır

---

## ✅ FİNAL KONTROL

### 21. Son Kontroller
- [ ] Tüm özellikler çalışıyor
- [ ] Performans kabul edilebilir
- [ ] Güvenlik önlemleri alındı
- [ ] Backup planı hazır
- [ ] Monitoring aktif
- [ ] Dokümantasyon tamamlandı

### 22. Canlıya Geçiş Onayı
- [ ] Teknik ekip onayı
- [ ] Müşteri onayı
- [ ] Test kullanıcı onayı

---

## 🎉 DEPLOYMENT TAMAMLANDI!

**Deployment Tarihi**: _______________
**Deployment Saati**: _______________
**Deploy Eden**: _______________
**Site URL**: _______________
**Durum**: ✅ CANLI

---

## 📞 DESTEK BİLGİLERİ

### Acil Durum Kişileri
- Teknik Sorumlu: ________________
- Telefon: ________________
- Email: ________________

### Natro Destek
- Panel: https://panel.natro.com
- Email: destek@natro.com
- Telefon: 0850 XXX XX XX

### Entegrasyon Destek
- Nilvera: destek@nilvera.com
- Trendyol: saticidestek@trendyol.com
- Hepsiburada: merchantdestek@hepsiburada.com

---

## 🔄 SONRAKI ADIMLAR

- [ ] İlk hafta günlük monitoring
- [ ] Kullanıcı geri bildirimleri topla
- [ ] Performance optimizasyonu
- [ ] Özellik iyileştirmeleri planla

---

**NOTLAR:**
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
