# 🔌 MOTOROIL ERP - ENTEGRASYON KILAVUZU

## 📋 İÇİNDEKİLER

1. [Nilvera E-Fatura Entegrasyonu](#nilvera-e-fatura)
2. [Trendyol Entegrasyonu](#trendyol)
3. [Hepsiburada Entegrasyonu](#hepsiburada)
4. [N11 Entegrasyonu](#n11)
5. [Amazon Entegrasyonu](#amazon)
6. [Özel API Entegrasyonu](#ozel-api)

---

## 📄 NILVERA E-FATURA ENTEGRASYONU {#nilvera-e-fatura}

### Nilvera Nedir?
Nilvera, Türkiye'nin önde gelen e-fatura ve e-arşiv fatura hizmet sağlayıcısıdır. GİB (Gelir İdaresi Başkanlığı) onaylı entegratördür.

### Kurulum Adımları

#### 1. Nilvera Hesabı Oluşturma
1. https://www.nilvera.com adresine gidin
2. "Ücretsiz Deneyin" butonuna tıklayın
3. Firma bilgilerinizi girin
4. E-posta doğrulaması yapın
5. Test ortamı otomatik aktif olur

#### 2. API Bilgilerini Alma
1. Nilvera paneline giriş yapın
2. **Ayarlar** → **API Bilgileri**
3. **API Key** ve **API Secret** bilgilerini kopyalayın
4. **VKN/TCKN** bilginizi not edin

#### 3. MOTOROIL ERP'de Ayarlama
1. Yan menü → **Entegrasyonlar**
2. **E-Fatura (Nilvera)** sekmesi
3. Bilgileri girin:
   ```
   API URL: https://api.nilvera.com/v1
   API Key: [Nilvera'dan aldığınız]
   API Secret: [Nilvera'dan aldığınız]
   Şirket VKN: [10 haneli vergi numaranız]
   Şirket Ünvanı: [Resmi firma ünvanınız]
   ```
4. **Ortam**: Test (ilk kurulumda)
5. **Bağlantıyı Test Et** butonuna tıklayın
6. ✅ Başarılı mesajı aldıktan sonra **Ayarları Kaydet**

#### 4. Otomatik Fatura Gönderimi
- **Otomatik Gönderim**: Satış tamamlandığında e-faturayı otomatik gönder
- **Otomatik Onay**: Gelen e-faturaları otomatik onayla

### Test Ortamı → Canlı Ortam Geçişi
1. Nilvera'dan **Canlı Ortam** onayı alın
2. Canlı ortam API bilgilerini alın
3. MOTOROIL ERP → Entegrasyonlar
4. **Ortam**: Production seçin
5. Yeni API bilgilerini girin
6. Test edin ve kaydedin

### E-Fatura Gönderme
```typescript
// Otomatik (POS satışı sonrası)
// Manuel (Muhasebe → Faturalar → Gönder)
```

### Fiyatlandırma
- **Test Ortamı**: Ücretsiz (sınırsız)
- **Canlı Ortam**: 
  - 0-100 fatura/ay: ₺50/ay
  - 101-500 fatura/ay: ₺150/ay
  - 501+ fatura/ay: ₺300/ay

### Destek
- **Dokümantasyon**: https://docs.nilvera.com
- **Destek**: destek@nilvera.com
- **Telefon**: 0850 XXX XX XX

---

## 🟠 TRENDYOL ENTEGRASYONU {#trendyol}

### Trendyol API Nedir?
Trendyol Pazaryeri API'si ile ürünlerinizi Trendyol'da satabilir, siparişleri otomatik olarak sisteminize aktarabilirsiniz.

### Kurulum Adımları

#### 1. Trendyol Satıcı Hesabı
1. https://partner.trendyol.com adresine gidin
2. Satıcı başvurusu yapın
3. Onay sürecini tamamlayın (1-3 gün)
4. Satıcı paneline giriş yapın

#### 2. API Bilgilerini Alma
1. Satıcı Paneli → **Ayarlar**
2. **Entegrasyon** → **API Bilgileri**
3. **API Key** ve **API Secret** oluşturun
4. **Supplier ID** bilginizi not edin

#### 3. MOTOROIL ERP'de Ayarlama
1. Entegrasyonlar → **Pazaryerleri** sekmesi
2. **Trendyol** kartını bulun
3. **Aktif** kutusunu işaretleyin
4. Bilgileri girin:
   ```
   API Key: [Trendyol'dan aldığınız]
   API Secret: [Trendyol'dan aldığınız]
   Supplier ID: [Satıcı numaranız]
   ```
5. **Otomatik Senkronizasyon**: Aktif
6. **Bağlantıyı Test Et**
7. **Ayarları Kaydet**

### Özellikler
- ✅ Otomatik sipariş aktarımı (her 15 dakikada)
- ✅ Stok senkronizasyonu
- ✅ Fiyat güncelleme
- ✅ Kargo takibi
- ✅ İptal/İade yönetimi

### Sipariş Akışı
```
Trendyol Sipariş → MOTOROIL ERP → Otomatik Fatura → Kargo
```

### Komisyon Oranları
- Kategori bazlı değişir: %5 - %20
- Otomatik hesaplanır ve giderlere eklenir

---

## 🟧 HEPSIBURADA ENTEGRASYONU {#hepsiburada}

### Hepsiburada API Kurulumu

#### 1. Satıcı Hesabı
1. https://merchant.hepsiburada.com
2. Satıcı başvurusu
3. Onay (2-5 gün)

#### 2. API Bilgileri
1. Merchant Panel → **Entegrasyon**
2. **API Anahtarları**
3. Merchant ID, Username, Password

#### 3. MOTOROIL ERP Ayarları
```
Merchant ID: [Satıcı numaranız]
Kullanıcı Adı: [API kullanıcı adı]
Şifre: [API şifresi]
Otomatik Senkronizasyon: Aktif
```

### Özellikler
- ✅ Sipariş yönetimi
- ✅ Ürün yönetimi
- ✅ Stok takibi
- ✅ Fiyat güncelleme
- ✅ Kargo entegrasyonu

---

## 🟣 N11 ENTEGRASYONU {#n11}

### N11 API Kurulumu

#### 1. Satıcı Hesabı
1. https://www.n11.com/magaza-ac
2. Mağaza açma başvurusu
3. Onay süreci

#### 2. API Bilgileri
1. Mağaza Yönetimi → **Entegrasyon**
2. **API Anahtarları** oluştur
3. API Key ve Secret

#### 3. MOTOROIL ERP Ayarları
```
API Key: [N11'den aldığınız]
API Secret: [N11'den aldığınız]
Otomatik Senkronizasyon: Aktif
```

---

## 🌐 AMAZON ENTEGRASYONU {#amazon}

### Amazon Seller Central API

#### 1. Satıcı Hesabı
1. https://sellercentral.amazon.com.tr
2. Professional Seller hesabı açın
3. MWS (Marketplace Web Service) aktif edin

#### 2. API Bilgileri
1. Settings → **User Permissions**
2. **Amazon MWS** → Developer Access
3. Seller ID, MWS Auth Token, Access Key, Secret Key

#### 3. MOTOROIL ERP Ayarları
```
Seller ID: [Amazon satıcı ID]
MWS Auth Token: [Yetkilendirme token]
Access Key: [AWS erişim anahtarı]
Secret Key: [AWS gizli anahtar]
```

---

## 🔧 ÖZEL API ENTEGRASYONU {#ozel-api}

### Kendi API'nizi Bağlama

MOTOROIL ERP, özel API entegrasyonlarını destekler. Kendi e-ticaret siteniz veya özel pazaryeriniz varsa:

#### Gereksinimler
- RESTful API
- JSON formatı
- OAuth 2.0 veya API Key authentication

#### Entegrasyon Adımları
1. API dokümantasyonunuzu hazırlayın
2. Endpoint'leri tanımlayın:
   - GET /orders (Siparişler)
   - GET /products (Ürünler)
   - POST /stock (Stok güncelleme)
   - POST /invoice (Fatura gönderme)

3. MOTOROIL ERP → Entegrasyonlar → **Özel API**
4. Endpoint ve kimlik bilgilerini girin
5. Mapping (eşleştirme) yapın
6. Test edin

---

## 🚀 TOPLU ENTEGRASYON YÖNETİMİ

### Tüm Pazaryerlerini Aktif Etme
1. Her pazaryeri için API bilgilerini toplayın
2. Entegrasyonlar sayfasından sırayla aktif edin
3. Bağlantı testlerini yapın
4. Otomatik senkronizasyonu aktif edin

### Sipariş Akış Şeması
```
Pazaryeri Sipariş
    ↓
MOTOROIL ERP (Otomatik Aktarım)
    ↓
Stok Kontrolü
    ↓
E-Fatura Oluştur (Nilvera)
    ↓
Kargo Hazırlama
    ↓
Kargo Kodu Pazaryerine Gönder
    ↓
Müşteri Bildirimi
```

---

## 📊 ENTEGRASYON İZLEME

### Dashboard
- Toplam sipariş sayısı (pazaryeri bazlı)
- Günlük sipariş grafiği
- Hata logları
- API kullanım istatistikleri

### Bildirimler
- Yeni sipariş bildirimi
- Stok uyarıları
- API hata bildirimleri
- Günlük özet rapor

---

## 🔒 GÜVENLİK

### API Anahtarları
- ❌ API anahtarlarınızı asla paylaşmayın
- ✅ Güçlü şifreler kullanın
- ✅ Düzenli olarak yenileyin
- ✅ HTTPS kullanın

### Veri Güvenliği
- Tüm API iletişimi şifreli (SSL/TLS)
- API anahtarları veritabanında şifreli saklanır
- Log kayıtları tutuluyor

---

## 🐛 SORUN GİDERME

### Sorun: "API bağlantı hatası"
**Çözüm**:
1. API bilgilerini kontrol edin
2. İnternet bağlantınızı kontrol edin
3. API servisinin çalıştığını doğrulayın
4. Test ortamı/canlı ortam seçimini kontrol edin

### Sorun: "Sipariş aktarılmıyor"
**Çözüm**:
1. Otomatik senkronizasyon aktif mi?
2. API limitleri aşıldı mı?
3. Hata loglarını kontrol edin

### Sorun: "E-Fatura gönderilemedi"
**Çözüm**:
1. Nilvera bakiyenizi kontrol edin
2. VKN bilgisi doğru mu?
3. Test/canlı ortam seçimi doğru mu?

---

## 📞 DESTEK

### Nilvera Destek
- **E-posta**: destek@nilvera.com
- **Telefon**: 0850 XXX XX XX
- **Dokümantasyon**: https://docs.nilvera.com

### Trendyol Destek
- **Satıcı Destek**: 0850 XXX XX XX
- **E-posta**: saticidestek@trendyol.com
- **Dokümantasyon**: https://developers.trendyol.com

### Hepsiburada Destek
- **Merchant Destek**: 0850 XXX XX XX
- **E-posta**: merchantdestek@hepsiburada.com

### N11 Destek
- **Mağaza Destek**: 0850 XXX XX XX
- **E-posta**: magazadestek@n11.com

---

## ✅ ENTEGRASYON KONTROL LİSTESİ

### E-Fatura (Nilvera)
- [ ] Nilvera hesabı oluşturuldu
- [ ] API bilgileri alındı
- [ ] MOTOROIL ERP'de ayarlandı
- [ ] Bağlantı test edildi
- [ ] Test faturası gönderildi
- [ ] Canlı ortama geçildi

### Trendyol
- [ ] Satıcı hesabı onaylandı
- [ ] API bilgileri alındı
- [ ] MOTOROIL ERP'de ayarlandı
- [ ] Bağlantı test edildi
- [ ] İlk ürün yüklendi
- [ ] İlk sipariş alındı

### Hepsiburada
- [ ] Merchant hesabı aktif
- [ ] API bilgileri alındı
- [ ] MOTOROIL ERP'de ayarlandı
- [ ] Bağlantı test edildi

### N11
- [ ] Mağaza açıldı
- [ ] API bilgileri alındı
- [ ] MOTOROIL ERP'de ayarlandı
- [ ] Bağlantı test edildi

---

**Son Güncelleme**: 25 Ocak 2026  
**Versiyon**: 1.0  
**Durum**: Production Ready ✅
