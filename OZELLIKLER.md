# 📋 MOTOROIL MUHASEBE & YÖNETİM SİSTEMİ - KAPSAMLI ÖZELLİK LİSTESİ

**Versiyon:** 2.0  
**Tarih:** 2026-02-02  
**Platform:** Next.js 15 + PostgreSQL (Neon)  
**Deployment:** Vercel (https://www.kech.tr)

---

## 🎯 GENEL BAKIŞ

Motoroil, otomotiv sektörüne özel geliştirilmiş **tam entegre işletme yönetim sistemi**dir. Muhasebe, stok, satış, servis, e-ticaret ve resmi belge yönetimini tek platformda sunar.

---

## 📊 1. MUHASEBE & FİNANS YÖNETİMİ

### 💰 Kasa & Banka Yönetimi
- ✅ Çoklu kasa/banka hesabı desteği
- ✅ Şube bazlı kasa takibi
- ✅ Global (tüm şubeler) ve yerel kasa tanımlama
- ✅ Nakit, banka, kredi kartı, çek hesapları
- ✅ Anlık bakiye takibi
- ✅ Kasa hareketleri geçmişi
- ✅ Otomatik kasa mutabakatı

### 📒 Hesap Planı & Muhasebe
- ✅ Türk Muhasebe Standartları uyumlu hesap planı
- ✅ Ana hesap grupları (Varlıklar, Yükümlülükler, Gelirler, Giderler)
- ✅ Alt hesap hiyerarşisi
- ✅ Otomatik yevmiye kayıtları
- ✅ Çift taraflı kayıt sistemi (Borç/Alacak)
- ✅ Hesap bakiye raporları
- ✅ Muhasebe dönemi takibi

### 💳 Finansal İşlemler
- ✅ Gelir/Gider kayıtları
- ✅ Banka transferleri
- ✅ Çek/Senet yönetimi
- ✅ Kredi kartı tahsilatları
- ✅ Taksitli ödeme planları
- ✅ Otomatik komisyon hesaplama
- ✅ Ödeme hatırlatıcıları
- ✅ Tahsilat/Ödeme takibi

### 📈 Raporlama & Analiz
- ✅ Gelir-Gider raporu
- ✅ Kasa durum raporu
- ✅ Müşteri bazlı cari hesap
- ✅ Tedarikçi bazlı cari hesap
- ✅ Karlılık analizi
- ✅ Dönemsel karşılaştırma
- ✅ Excel export
- ✅ Grafik ve görselleştirme

---

## 🛒 2. SATIŞ YÖNETİMİ

### 🧾 Fatura & Belge Yönetimi
- ✅ Satış faturası oluşturma
- ✅ İrsaliye (sevk belgesi) kesme
- ✅ Proforma fatura
- ✅ Fiyat teklifi
- ✅ Toplu fatura işlemleri
- ✅ Fatura iptal/düzeltme
- ✅ Otomatik fatura numaralandırma
- ✅ Müşteri bazlı fiyatlandırma

### 📄 E-Dönüşüm Entegrasyonu
**Çift Sağlayıcı Desteği: eLogo & Nilvera**

#### e-Fatura
- ✅ Otomatik e-Fatura oluşturma
- ✅ VKN/TCKN sorgulama (müşteri e-fatura kullanıcısı mı?)
- ✅ UBL-TR XML formatı
- ✅ GİB onaylı belge gönderimi
- ✅ Fatura durumu takibi (Gönderildi/Onaylandı/Reddedildi)
- ✅ Toplu fatura gönderimi

#### e-Arşiv Fatura
- ✅ Bireysel müşteriler için e-Arşiv
- ✅ Otomatik tip belirleme (e-Fatura/e-Arşiv)
- ✅ PDF oluşturma ve gönderim
- ✅ E-posta ile müşteriye iletim

#### e-İrsaliye
- ✅ Dijital sevk irsaliyesi
- ✅ Mal hareketlerinin resmi kaydı
- ✅ Lojistik entegrasyonu
- ✅ İrsaliye onay sistemi

**Desteklenen Sağlayıcılar:**
- 🦅 **eLogo** (SOAP/XML)
- 📄 **Nilvera** (REST/JSON)

### 💰 Ödeme & Tahsilat
- ✅ Nakit tahsilat
- ✅ Kredi kartı (Ödeal POS entegrasyonu)
- ✅ Banka transferi
- ✅ Çek/Senet
- ✅ Taksitli satış
- ✅ Ön ödeme/Avans
- ✅ Borç takibi
- ✅ Otomatik cari hesap güncelleme

---

## 📦 3. STOK & ENVANTER YÖNETİMİ

### 🏪 Ürün Yönetimi
- ✅ Ürün kategorileri
- ✅ Barkod sistemi
- ✅ Stok kodu (SKU)
- ✅ Çoklu birim (Adet, Litre, Kg, vb.)
- ✅ Ürün varyantları (Renk, Beden, vb.)
- ✅ Ürün görselleri
- ✅ Detaylı ürün açıklaması
- ✅ Tedarikçi bilgisi

### 📊 Stok Takibi
- ✅ Anlık stok miktarı
- ✅ Şube bazlı stok
- ✅ Depo yönetimi
- ✅ Kritik stok seviyesi uyarıları
- ✅ Stok hareketleri geçmişi
- ✅ Stok sayım modülü
- ✅ Fire/Zayi kayıtları
- ✅ Seri/Lot takibi

### 🔄 Stok Hareketleri
- ✅ Stok girişi (Alım)
- ✅ Stok çıkışı (Satış)
- ✅ Şubeler arası transfer
- ✅ İade işlemleri
- ✅ Konsinye stok
- ✅ Rezervasyon sistemi
- ✅ Otomatik stok güncelleme

### 📈 Stok Raporları
- ✅ Stok durum raporu
- ✅ Hareket raporu
- ✅ Kritik stok listesi
- ✅ En çok satan ürünler
- ✅ Yavaş hareket eden ürünler
- ✅ Stok değerleme raporu
- ✅ ABC analizi

---

## 🛍️ 4. E-TİCARET ENTEGRASYONU

### 🌐 Pazaryeri Entegrasyonları
- ✅ **Trendyol** API entegrasyonu
- ✅ **Hepsiburada** API entegrasyonu
- ✅ **N11** API entegrasyonu
- ✅ **Amazon TR** MWS entegrasyonu
- ✅ **Özel XML** entegrasyonu (Periodya.com.tr)

### 📦 Sipariş Yönetimi
- ✅ Otomatik sipariş senkronizasyonu
- ✅ Sipariş durumu takibi
- ✅ Kargo etiket yazdırma (Trendyol)
- ✅ Toplu sipariş işleme
- ✅ Otomatik stok düşme
- ✅ Müşteri oluşturma
- ✅ Tahsilat kaydı

### 🔄 Stok Eşleştirme
- ✅ E-ticaret ürün eşleştirme
- ✅ Barkod bazlı otomatik eşleştirme
- ✅ Manuel eşleştirme
- ✅ Çoklu platform desteği
- ✅ Eşleştirme geçmişi
- ✅ Toplu eşleştirme

### ⏰ Otomatik Senkronizasyon
- ✅ Zamanlı sipariş çekme (Cron job)
- ✅ Ayarlanabilir senkronizasyon aralığı
- ✅ Hata yönetimi
- ✅ Senkronizasyon logları

---

## 🔧 5. SERVİS & BAKIM YÖNETİMİ

### 🚗 Araç Takibi
- ✅ Müşteri araç kayıtları
- ✅ Plaka, marka, model bilgisi
- ✅ Kilometre takibi
- ✅ Servis geçmişi
- ✅ QR kod ile araç kartı
- ✅ Araç doküman yönetimi

### 🛠️ Servis İşlemleri
- ✅ Servis kaydı oluşturma
- ✅ Yapılan işlemler listesi
- ✅ Kullanılan parçalar
- ✅ İşçilik ücretlendirme
- ✅ Servis durumu (Bekliyor/Devam Ediyor/Tamamlandı)
- ✅ Teknisyen ataması
- ✅ Tahmini teslim tarihi

### 📅 Randevu Sistemi
- ✅ Online randevu alma
- ✅ Randevu takvimi
- ✅ SMS/E-posta hatırlatma
- ✅ Randevu onay/iptal
- ✅ Müsaitlik kontrolü
- ✅ Çakışma önleme

### ⚠️ Bakım Uyarı Sistemi
- ✅ Periyodik bakım takibi
- ✅ Kilometre bazlı uyarılar
- ✅ Tarih bazlı uyarılar
- ✅ Otomatik müşteri bildirimi
- ✅ WhatsApp entegrasyonu
- ✅ Bakım geçmişi

### 📱 QR Kod Sistemi
- ✅ Her araç için benzersiz QR kod
- ✅ Mobil erişim
- ✅ Servis geçmişi görüntüleme
- ✅ Hızlı servis kaydı
- ✅ Müşteri self-servis

---

## 👥 6. MÜŞTERİ & TEDARİKÇİ YÖNETİMİ (CRM)

### 👤 Müşteri Yönetimi
- ✅ Detaylı müşteri kartları
- ✅ İletişim bilgileri
- ✅ VKN/TCKN kaydı
- ✅ Vergi dairesi bilgisi
- ✅ Adres yönetimi
- ✅ Müşteri kategorileri (A/B/C sınıflandırma)
- ✅ Müşteri notları
- ✅ Özel fiyat listeleri

### 💼 Cari Hesap
- ✅ Borç/Alacak takibi
- ✅ İşlem geçmişi
- ✅ Ödeme planları
- ✅ Vade takibi
- ✅ Otomatik hesap özeti
- ✅ Ekstre yazdırma
- ✅ Tahsilat hatırlatıcıları

### 🏢 Tedarikçi Yönetimi
- ✅ Tedarikçi kartları
- ✅ Ürün-tedarikçi eşleştirme
- ✅ Alış fiyat geçmişi
- ✅ Ödeme koşulları
- ✅ Tedarikçi performans takibi
- ✅ Borç/Alacak durumu

### 📊 Müşteri Analizi
- ✅ En çok alışveriş yapan müşteriler
- ✅ Müşteri bazlı karlılık
- ✅ Satın alma sıklığı
- ✅ Ortalama sepet tutarı
- ✅ Müşteri segmentasyonu
- ✅ Churn analizi

---

## 🏢 7. ŞUBE & DEPO YÖNETİMİ

### 🏪 Çoklu Şube Desteği
- ✅ Sınırsız şube tanımlama
- ✅ Şube bazlı yetkilendirme
- ✅ Merkez-şube hiyerarşisi
- ✅ Şube bazlı raporlama
- ✅ Şubeler arası veri paylaşımı
- ✅ Konsolidasyon raporları

### 📦 Depo Yönetimi
- ✅ Çoklu depo tanımlama
- ✅ Depo bazlı stok takibi
- ✅ Raf/Konum yönetimi
- ✅ Depo kapasitesi takibi
- ✅ Depo transfer işlemleri

### 🔄 Transfer Sistemi
- ✅ Şubeler arası ürün transferi
- ✅ Transfer talep/onay süreci
- ✅ Transfer durumu takibi
- ✅ Otomatik stok güncelleme
- ✅ Transfer geçmişi
- ✅ Yoldaki stok takibi

---

## 👨‍💼 8. PERSONEL & YETKİLENDİRME

### 👥 Personel Yönetimi
- ✅ Personel kartları
- ✅ Görev tanımları
- ✅ Şube ataması
- ✅ İletişim bilgileri
- ✅ Personel dokümanları
- ✅ İzin/Devamsızlık takibi

### 🔐 Rol Tabanlı Yetkilendirme (RBAC)
- ✅ Önceden tanımlı roller (Admin, Muhasebe, Satış, vb.)
- ✅ Özel rol oluşturma
- ✅ Granüler izin sistemi
- ✅ Sayfa bazlı erişim kontrolü
- ✅ İşlem bazlı yetkilendirme
- ✅ Veri güvenliği

### 📝 Kullanıcı İşlemleri
- ✅ Kullanıcı oluşturma/düzenleme
- ✅ Şifre yönetimi
- ✅ Şifre sıfırlama (E-posta ile)
- ✅ Oturum yönetimi
- ✅ Çoklu oturum desteği
- ✅ Otomatik çıkış (timeout)

### 📊 Aktivite Takibi
- ✅ Audit log sistemi
- ✅ Kim-ne-ne zaman kaydı
- ✅ İşlem geçmişi
- ✅ Değişiklik takibi
- ✅ Güvenlik logları

---

## 💳 9. ÖDEME SİSTEMLERİ

### 💰 Ödeal POS Entegrasyonu
- ✅ Fiziki POS cihazı entegrasyonu
- ✅ Otomatik ödeme gönderimi
- ✅ Ödeme durumu takibi
- ✅ Otomatik fiş kesme
- ✅ Test modu
- ✅ Hata yönetimi

### 💳 Ödeme Yöntemleri
- ✅ Nakit
- ✅ Kredi kartı
- ✅ Banka transferi
- ✅ Çek
- ✅ Senet
- ✅ Havale/EFT
- ✅ Kripto para (hazırlık aşamasında)

### 📊 Ödeme Planları
- ✅ Taksitli ödeme
- ✅ Vade farklı fiyatlandırma
- ✅ Peşin indirim
- ✅ Erken ödeme teşviki
- ✅ Otomatik tahsilat hatırlatma

---

## 📊 10. RAPORLAMA & ANALİTİK

### 📈 Dashboard & KPI'lar
- ✅ Gerçek zamanlı dashboard
- ✅ Günlük satış özeti
- ✅ Aylık gelir/gider
- ✅ Stok durumu
- ✅ Kritik stok uyarıları
- ✅ Bekleyen işlemler
- ✅ Grafik ve görselleştirme

### 📊 Finansal Raporlar
- ✅ Gelir-Gider tablosu
- ✅ Kasa raporu
- ✅ Banka hesap özeti
- ✅ Cari hesap raporu
- ✅ Karlılık analizi
- ✅ Dönemsel karşılaştırma

### 📦 Stok Raporları
- ✅ Stok durum raporu
- ✅ Stok hareket raporu
- ✅ Kritik stok listesi
- ✅ Envanter değerleme
- ✅ ABC analizi
- ✅ Yavaş hareket eden ürünler

### 👥 Müşteri Raporları
- ✅ Müşteri listesi
- ✅ Borç/Alacak raporu
- ✅ En çok alışveriş yapan müşteriler
- ✅ Müşteri bazlı karlılık
- ✅ Satış analizi

### 🏢 Tedarikçi Raporları
- ✅ Tedarikçi listesi
- ✅ Alış raporu
- ✅ Ödeme durumu
- ✅ Tedarikçi performansı

### 📤 Export Özellikleri
- ✅ Excel export
- ✅ PDF export
- ✅ CSV export
- ✅ Yazdırma optimizasyonu

---

## 🔔 11. BİLDİRİM & UYARI SİSTEMİ

### 📧 E-posta Bildirimleri
- ✅ Fatura gönderimi
- ✅ Ödeme hatırlatıcıları
- ✅ Stok uyarıları
- ✅ Servis tamamlama
- ✅ Şifre sıfırlama

### 📱 WhatsApp Entegrasyonu
- ✅ Servis tamamlama bildirimi
- ✅ Bakım hatırlatıcıları
- ✅ Randevu onayı
- ✅ Kampanya duyuruları

### 🔔 Sistem Bildirimleri
- ✅ Kritik stok uyarıları
- ✅ Bekleyen onaylar
- ✅ Vade yaklaşan ödemeler
- ✅ Sistem güncellemeleri
- ✅ Hata bildirimleri

### 📊 Bildirim Merkezi
- ✅ Tüm bildirimleri görüntüleme
- ✅ Okundu işaretleme
- ✅ Bildirim filtreleme
- ✅ Bildirim ayarları

---

## 🔒 12. GÜVENLİK ÖZELLİKLERİ

### 🛡️ Kimlik Doğrulama
- ✅ JWT tabanlı authentication
- ✅ Bcrypt şifre hashleme
- ✅ HttpOnly cookie
- ✅ Brute force koruması (5 deneme/15dk)
- ✅ Oturum yönetimi
- ✅ Otomatik logout

### 🔐 Veri Güvenliği
- ✅ SSL/TLS şifreleme
- ✅ Sertifika doğrulama
- ✅ SQL injection koruması (Prisma ORM)
- ✅ XSS koruması
- ✅ CSRF koruması
- ✅ Hassas veri maskeleme

### 📝 Güvenlik Politikaları
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options (Clickjacking koruması)
- ✅ X-Content-Type-Options
- ✅ Referrer Policy
- ✅ Permissions Policy

### 📊 Audit & Logging
- ✅ Tüm işlemlerin loglanması
- ✅ Kim-ne-ne zaman kaydı
- ✅ Değişiklik takibi
- ✅ Güvenli log saklama
- ✅ Hassas veri filtreleme

### 🔄 Yedekleme
- ✅ Otomatik veritabanı yedekleme
- ✅ Manuel yedek alma
- ✅ Yedek geri yükleme
- ✅ Veri export/import

---

## 🌐 13. SİSTEM ÖZELLİKLERİ

### ⚙️ Genel Ayarlar
- ✅ Firma bilgileri
- ✅ Logo yönetimi
- ✅ Vergi ayarları
- ✅ Para birimi
- ✅ Dil seçenekleri
- ✅ Zaman dilimi

### 🎨 Arayüz
- ✅ Modern, responsive tasarım
- ✅ Dark mode (koyu tema)
- ✅ Mobil uyumlu
- ✅ Tablet desteği
- ✅ Hızlı erişim menüleri
- ✅ Klavye kısayolları

### 🔧 Teknik Özellikler
- ✅ Next.js 15 (React 19)
- ✅ TypeScript
- ✅ Prisma ORM
- ✅ PostgreSQL (Neon)
- ✅ Vercel deployment
- ✅ API-first architecture
- ✅ RESTful API

### 📱 Performans
- ✅ Server-side rendering (SSR)
- ✅ Static generation
- ✅ Image optimization
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Caching stratejileri

---

## 🔮 14. YAKINDA GELECEK ÖZELLİKLER

### 🚀 Planlanan Geliştirmeler
- 🔄 Mobil uygulama (iOS/Android)
- 🔄 Gelişmiş BI & Analytics
- 🔄 AI destekli tahminleme
- 🔄 Blockchain entegrasyonu
- 🔄 IoT cihaz entegrasyonu
- 🔄 Sesli komut desteği
- 🔄 Çoklu dil desteği
- 🔄 2FA (İki faktörlü doğrulama)

---

## 📞 DESTEK & DOKÜMANTASYON

### 📚 Mevcut Dokümanlar
- ✅ `README.md` - Kurulum kılavuzu
- ✅ `DURUM_RAPORU.md` - Geliştirme durumu
- ✅ `GUVENLIK_RAPORU.md` - Güvenlik denetimi
- ✅ `GUVENLIK_DUZELTMELER.md` - Güvenlik düzeltmeleri
- ✅ `UCRETSIZ_DEPLOY.md` - Deployment rehberi
- ✅ API dokümantasyonu (kod içi)

### 🎯 Kullanım Senaryoları
1. **Oto Yedek Parça Mağazası**
2. **Servis İstasyonu**
3. **Lastik Satış & Montaj**
4. **Akü Satış & Değişim**
5. **Yağ Değişim Merkezi**
6. **Oto Aksesuar Mağazası**

---

## 📊 İSTATİSTİKLER

**Toplam Özellik Sayısı:** 300+  
**API Endpoint Sayısı:** 80+  
**Veritabanı Tablosu:** 35+  
**Kod Satırı:** 50,000+  
**Güvenlik Skoru:** 9.3/10  

---

## 🎉 SONUÇ

Motoroil, otomotiv sektöründe faaliyet gösteren işletmeler için **eksiksiz bir dijital dönüşüm çözümü**dür. Muhasebe, stok, satış, servis ve e-ticaret süreçlerini tek platformda birleştirerek:

✅ **Zaman tasarrufu** (Manuel işlemler %80 azalır)  
✅ **Maliyet düşürme** (Kağıt ve insan kaynağı tasarrufu)  
✅ **Hata oranı azaltma** (Otomatik hesaplamalar)  
✅ **Müşteri memnuniyeti** (Hızlı servis, düzenli bilgilendirme)  
✅ **Yasal uyumluluk** (GİB onaylı e-dönüşüm)  
✅ **Veri güvenliği** (Bankacılık seviyesinde güvenlik)  

**Motoroil ile işletmenizi geleceğe taşıyın!** 🚀
