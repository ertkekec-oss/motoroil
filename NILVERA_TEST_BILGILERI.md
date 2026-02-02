# 🔐 NILVERA TEST API BİLGİLERİ

**Ortam:** TEST  
**API Base URL:** https://apitest.nilvera.com

---

## 📋 TEST KURUM 1 BİLGİLERİ

### Kimlik Bilgileri
- **Kullanıcı Adı:** test01@nilvera.com
- **Şifre:** q8rzSB~iRDd%NlRn
- **Vergi Kimlik No:** 1234567801

### Etiketler
- **PK Etiket (Posta Kutusu):** urn:mail:defaultpk@nilvera.com
- **GB Etiket (Gelen Belge):** urn:mail:defaultgb@nilvera.com

---

## 🔑 API KEY OLUŞTURMA

Nilvera API'yi kullanmak için önce API Key oluşturmanız gerekiyor:

### Adım 1: Nilvera Portal'a Giriş
1. https://portaltest.nilvera.com adresine gidin
2. Yukarıdaki kullanıcı adı ve şifre ile giriş yapın

### Adım 2: API Key Oluşturma
1. Portal'da **Ayarlar** > **API Anahtarları** bölümüne gidin
2. **Yeni API Anahtarı Oluştur** butonuna tıklayın
3. İzinleri seçin:
   - ✅ e-Fatura Okuma
   - ✅ e-Fatura Yazma
   - ✅ e-Arşiv Okuma
   - ✅ e-Arşiv Yazma
   - ✅ e-İrsaliye Okuma
   - ✅ e-İrsaliye Yazma
4. Geçerlilik süresi: **Sınırsız** (veya istediğiniz süre)
5. **Oluştur** butonuna tıklayın
6. Oluşturulan API Key'i kopyalayın (bir daha gösterilmeyecek!)

---

## 🔧 UYGULAMA AYARLARI

### .env Dosyasına Ekle
```bash
# Nilvera Test API
NILVERA_API_KEY="your-api-key-here"
NILVERA_ENVIRONMENT="test"
NILVERA_COMPANY_VKN="1234567801"
```

### Vercel Environment Variables
Production'a deploy ederken Vercel'de de aynı değişkenleri ekleyin:
```bash
vercel env add NILVERA_API_KEY
# API Key'i yapıştırın

vercel env add NILVERA_ENVIRONMENT
# "test" yazın

vercel env add NILVERA_COMPANY_VKN
# "1234567801" yazın
```

---

## 🧪 TEST SENARYOLARI

### 1. Bağlantı Testi
Entegrasyonlar sayfasından:
1. **Nilvera** sağlayıcısını seçin
2. API Key'i girin
3. **Bağlantıyı Test Et** butonuna tıklayın
4. ✅ "Nilvera API Bağlantısı Başarılı!" mesajını görmelisiniz

### 2. VKN Sorgulama Testi
```typescript
// Test VKN'leri
const testVKNs = [
  '1234567801', // Nilvera test kullanıcısı - e-Fatura kullanıcısı
  '1111111111', // Genel test VKN - e-Fatura kullanıcısı DEĞİL
];
```

### 3. e-Fatura Gönderme Testi
1. Satış > Faturalar sayfasına gidin
2. Yeni fatura oluşturun:
   - Müşteri VKN: **1234567801**
   - Ürün ekleyin
   - Kaydedin
3. **🚀 e-Fatura Gönder** butonuna tıklayın
4. Sistem otomatik olarak:
   - VKN'yi sorgular
   - e-Fatura kullanıcısı olduğunu tespit eder
   - TEMELFATURA profili ile gönderir
   - Fatura UUID'sini alır

### 4. e-Arşiv Gönderme Testi
1. Bireysel müşteri için fatura oluşturun:
   - Müşteri TCKN: **11111111111**
   - Ürün ekleyin
   - Kaydedin
2. **🚀 e-Fatura Gönder** butonuna tıklayın
3. Sistem otomatik olarak:
   - TCKN'yi sorgular
   - e-Fatura kullanıcısı olmadığını tespit eder
   - EARSIVFATURA profili ile gönderir

### 5. e-İrsaliye Gönderme Testi
1. Satış > e-İrsaliyeler sayfasına gidin
2. İrsaliye oluşturun
3. **🚀 e-İrsaliye Gönder** butonuna tıklayın
4. TEMELIRSALIYE profili ile gönderilir

---

## 📊 NILVERA API ENDPOINTS

### Temel Endpointler
```
Base URL: https://apitest.nilvera.com

# Kullanıcı Sorgulama
GET /general/CheckUser/{vkn}

# e-Fatura Gönderme
POST /einvoice/Send/Model

# e-Arşiv Gönderme
POST /earchive/Send/Model

# e-İrsaliye Gönderme
POST /edespatch/Send/Model

# Belge Sorgulama
GET /einvoice/Get/{uuid}

# Belge Listesi
GET /einvoice/List
```

### Authentication
Tüm isteklerde header:
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

---

## 🔍 HATA AYIKLAMA

### Yaygın Hatalar

#### 1. "Unauthorized" (401)
- ✅ API Key'in doğru olduğundan emin olun
- ✅ API Key'in süresi dolmamış olmalı
- ✅ API Key'in gerekli izinlere sahip olduğunu kontrol edin

#### 2. "Invalid VKN"
- ✅ VKN formatı: 10 haneli sayı
- ✅ TCKN formatı: 11 haneli sayı
- ✅ Başında sıfır varsa string olarak gönderin

#### 3. "Invalid Invoice Model"
- ✅ Zorunlu alanların dolu olduğunu kontrol edin
- ✅ Tarih formatı: YYYY-MM-DD
- ✅ Saat formatı: HH:mm:ss

#### 4. "Certificate Error"
- ✅ Test ortamında SSL sertifikası geçerli
- ✅ `rejectUnauthorized: true` kullanın
- ✅ Production'da aynı şekilde çalışır

---

## 📝 ÖRNEK API ÇAĞRILARI

### CheckUser
```bash
curl -X GET "https://apitest.nilvera.com/general/CheckUser/1234567801" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Yanıt:
```json
{
  "IsEInvoiceUser": true,
  "Aliases": [
    {
      "Alias": "urn:mail:defaultpk@nilvera.com",
      "Type": "PK"
    }
  ]
}
```

### Send Invoice
```bash
curl -X POST "https://apitest.nilvera.com/einvoice/Send/Model" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "InvoiceInfo": {
      "IssueDate": "2026-02-02",
      "IssueTime": "21:55:00",
      "InvoiceType": "SATIS",
      "InvoiceProfile": "TEMELFATURA",
      "CurrencyCode": "TRY"
    },
    "CompanyInfo": {
      "Name": "Test Firma",
      "TaxNumber": "1234567801",
      "TaxOffice": "Test VD",
      "Address": "Test Adres"
    },
    "CustomerInfo": {
      "Name": "Müşteri Adı",
      "TaxNumber": "1111111111",
      "TaxOffice": "İstanbul VD",
      "Address": "Müşteri Adres"
    },
    "InvoiceLines": [
      {
        "Index": 1,
        "Name": "Test Ürün",
        "Quantity": 1,
        "UnitCode": "NIU",
        "UnitPrice": 100,
        "VatRate": 20
      }
    ]
  }'
```

---

## 🎯 BAŞARILI TEST KRİTERLERİ

Entegrasyon başarılı sayılır eğer:

- ✅ Bağlantı testi başarılı
- ✅ VKN sorgulama çalışıyor
- ✅ e-Fatura gönderimi başarılı
- ✅ e-Arşiv gönderimi başarılı
- ✅ e-İrsaliye gönderimi başarılı
- ✅ Fatura UUID alınıyor
- ✅ Veritabanında `formalId` güncelleniyor
- ✅ Fatura durumu "Resmileştirildi" oluyor

---

## 🚀 PRODUCTION'A GEÇİŞ

Test başarılı olduktan sonra production'a geçmek için:

### 1. Production API Key Al
- https://portal.nilvera.com adresine git
- Gerçek firma bilgilerinizle giriş yap
- API Key oluştur

### 2. Environment Variables Güncelle
```bash
NILVERA_API_KEY="production-api-key"
NILVERA_ENVIRONMENT="production"
NILVERA_COMPANY_VKN="gerçek-vkn"
```

### 3. Base URL Değişir
- Test: `https://apitest.nilvera.com`
- Production: `https://api.nilvera.com`

Kod otomatik olarak environment'a göre doğru URL'i kullanır.

---

## 📞 DESTEK

### Nilvera Destek
- **E-posta:** destek@nilvera.com
- **Telefon:** +90 (212) XXX XX XX
- **Dokümantasyon:** https://developer.nilvera.com

### Uygulama İçi Destek
- Entegrasyonlar sayfasında "Test Et" butonu
- Console loglarını kontrol edin (F12)
- `src/lib/nilvera.ts` dosyasında detaylı hata mesajları

---

## ✅ KONTROL LİSTESİ

Test öncesi:
- [ ] API Key oluşturuldu
- [ ] .env dosyasına eklendi
- [ ] Bağlantı testi yapıldı
- [ ] Test VKN'leri hazır

Test sırasında:
- [ ] VKN sorgulama çalıştı
- [ ] e-Fatura gönderimi başarılı
- [ ] e-Arşiv gönderimi başarılı
- [ ] e-İrsaliye gönderimi başarılı
- [ ] UUID alındı

Test sonrası:
- [ ] Veritabanı kontrol edildi
- [ ] Fatura durumu güncellendi
- [ ] Nilvera portal'da belge görüldü

**Tüm testler başarılı olduğunda production'a geçilebilir!** ✅
