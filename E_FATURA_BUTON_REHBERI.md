# 🧪 E-FATURA GÖNDER BUTONU TEST REHBERİ

## 📍 BUTONUN KONUMU

**Yol:** Sol Menü > 💰 Satış > Faturalar sekmesi > Fatura listesi > İşlem sütunu

## 🎯 ADIM ADIM TEST

### 1. Satış Sayfasına Git
- Sol menüden **"💰 Satış"** tıkla
- Veya URL: `https://www.periodya.com/sales`

### 2. Faturalar Sekmesine Geç
- Üstteki sekmelerde **"Faturalar"** tıkla
- Alt sekmede **"📑 Kesilen Satış Faturaları"** seçili olmalı

### 3. Yeni Fatura Oluştur (Eğer yoksa)
```
a) "Yeni Fatura" butonuna tıkla
b) Müşteri bilgileri:
   - Ad: Test Müşteri
   - VKN: 1234567801
   - Vergi Dairesi: Test VD
   - Adres: Test Adres
c) Ürün ekle:
   - Ürün seç
   - Miktar: 1
   - Fiyat: 100
d) "Kaydet" butonuna tıkla
```

### 4. Fatura Listesinde Butonu Bul
```
Fatura listesinde yeni oluşturduğunuz fatura görünecek:

┌──────────────────────────────────────────────────────────┐
│ Fatura No: F-XXX                                         │
│ Cari: Test Müşteri                                       │
│ Tarih: 02.02.2026                                        │
│ Tutar: 120.00 ₺                                          │
│ Durum: [Taslak] ← Sarı renkte                           │
│ İşlem:                                                   │
│   [✅ Onayla]           ← Yeşil buton                    │
│   [🧾 e-Arşiv/Fatura]  ← MAVİ BUTON (BURADA!)          │
│   [🚚 İrsaliye]         ← Sarı buton                    │
│   [İndir]               ← Gri buton                     │
│   [Sil]                 ← Kırmızı buton                 │
└──────────────────────────────────────────────────────────┘
```

### 5. Butona Tıkla
```
a) "🧾 e-Arşiv/Fatura" butonuna tıkla
b) Onay popup'ı açılır:
   "Bu faturayı e-Fatura/e-Arşiv olarak resmileştirmek 
    istiyor musunuz? Müşteri VKN durumuna göre otomatik 
    belirlenecektir."
c) "Evet" butonuna tıkla
d) Bekle...
```

### 6. Sonuç
```
✅ BAŞARILI:
   "✅ e-Fatura başarıyla gönderildi
    UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    Tip: E_FATURA"

❌ HATA:
   "❌ Nilvera entegrasyonu yapılandırılmamış"
   → Ayarlar > Entegrasyonlar > e-Fatura'ya git
   → API Key gir
```

## 🔍 SORUN GİDERME

### Buton Görünmüyor
**Neden:** Fatura zaten resmileştirilmiş
**Çözüm:** Yeni fatura oluştur

### Buton Gri (Disabled)
**Neden:** e-İrsaliye butonu zaten kullanılmış
**Çözüm:** Normal, e-Fatura butonu aktif olmalı

### Buton Tıklanmıyor
**Neden:** JavaScript hatası
**Çözüm:** F12 > Console'u kontrol et

### "Entegrasyon yapılandırılmamış" Hatası
**Neden:** Nilvera API Key girilmemiş
**Çözüm:** 
1. Ayarlar > Entegrasyonlar > e-Fatura
2. API Key: 3FD25E965BF02DFCA23B32FAE73D2E96D27758789A68CFE0EFB13128D029E301
3. API Secret: (aynı key)
4. VKN: 1234567801
5. Ünvan: Test Kurum 01
6. Kaydet

### "VKN bulunamadı" Hatası
**Neden:** Müşteri kartında VKN yok
**Çözüm:**
1. Müşteriler > Müşteri bul
2. Düzenle
3. VKN alanına: 1234567801
4. Kaydet

## 📸 EKRAN GÖRÜNTÜLERİ

Eğer hala bulamıyorsanız, şu ekran görüntülerini atın:

1. **Satış sayfası** - Hangi sekmede olduğunuzu görmek için
2. **Fatura listesi** - Faturaların durumunu görmek için
3. **Console (F12)** - Hata varsa görmek için

## ✅ BAŞARI KRİTERLERİ

Buton doğru çalışıyorsa:
- ✅ Mavi renkte
- ✅ "🧾 e-Arşiv/Fatura" yazıyor
- ✅ Tıklanabiliyor
- ✅ Onay popup'ı açılıyor
- ✅ Başarılı mesajı geliyor
- ✅ Fatura durumu "Resmileştirildi" oluyor
- ✅ UUID görünüyor

**İyi testler!** 🚀
