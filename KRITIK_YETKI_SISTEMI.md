
# Kritik Yetki Sistemi - Uygulama Özeti

## 🔐 Tamamlanan Güvenlik Katmanları

### 1. **Ürün Kartı Onay Sistemi**
- ✅ Personel ürün kartı açabilir ancak admin onayı gerekir
- ✅ Talepler "Güvenlik Masası → Onay Bekleyenler" sekmesinde görünür
- ✅ Admin onayladığında ürün envantere eklenir
- ✅ Admin reddettiğinde talep iptal olur
- **Kod Konumu**: 
  - `src/contexts/AppContext.tsx` - Onay sistemi mantığı
  - `src/app/inventory/page.tsx` - Talep oluşturma
  - `src/app/security/suspicious/page.tsx` - Onay paneli

### 2. **Kasa/Banka Hesabı Açma Kısıtı**
- ✅ Sadece `create_bank` yetkisi olanlar yeni hesap açabilir
- ✅ Personeller "Yeni Banka Hesabı" butonunu göremez
- **Kod Konumu**: `src/app/accounting/page.tsx` (satır ~779-787)

### 3. **Personel Ekleme Kısıtı**
- ✅ Sadece `create_staff` yetkisi olanlar personel ekleyebilir
- ✅ "+ Personel Ekle" butonu yetkisizlere gizli
- **Kod Konumu**: `src/app/staff/page.tsx` (satır ~117)

### 4. **Yeni Yetki Kategorisi: "Kritik Yetkiler"**
Aşağıdaki yetkiler eklendi ve varsayılan olarak **sadece admin**'e verilir:

| Yetki ID | Açıklama | Varsayılan |
|----------|----------|------------|
| `delete_records` | Fatura/Ürün/Gider silme | ❌ Kapalı |
| `create_staff` | Personel ekleme | ❌ Kapalı |
| `create_bank` | Kasa/Banka açma | ❌ Kapalı |
| `approve_products` | Ürün kartı onaylama | ❌ Kapalı |

**Kod Konumu**: `src/app/staff/page.tsx` (satır ~51-58)

---

## 📋 Kullanım Kılavuzu

### Admin Olarak Ürün Talebini Onaylama:
1. Güvenlik Masası sayfasına git
2. "Onay Bekleyenler" sekmesine tıkla
3. Talep kartında ürün detaylarını incele
4. "✅ Onayla" veya "❌ Reddet" butonuna tıkla

### Personele Kritik Yetki Verme:
1. Ekip Yönetimi sayfasına git
2. İlgili personeli seç
3. "Yetkileri Düzenle" butonuna tıkla
4. "Kritik Yetkiler" kategorisinden istenen yetkiyi işaretle
5. "Kaydet" butonuna tıkla

### Personel Olarak Ürün Kartı Talebi Oluşturma:
1. Envanter sayfasına git
2. "+ Yeni Ürün Ekle" butonuna tıkla
3. Ürün bilgilerini doldur
4. "Kaydet" butonuna tıkla
5. Sistem "📋 Ürün kartı talebi oluşturuldu. Yönetici onayı bekleniyor." mesajı gösterir

---

## 🔒 Güvenlik Garantileri

1. **Veri Silme**: `delete_records` yetkisi olmayan kullanıcılar hiçbir kaydı silemez
2. **Personel Yönetimi**: `create_staff` yetkisi olmadan personel eklenemez
3. **Finansal Hesaplar**: `create_bank` yetkisi olmadan kasa/banka açılamaz
4. **Envanter Kontrolü**: `approve_products` yetkisi olmadan ürün kartı doğrudan eklenemez
5. **Şube İzolasyonu**: Tüm yeni personeller varsayılan olarak kendi şubelerine kilitlidir

---

## 🎯 Sonraki Adımlar (Opsiyonel)

- [ ] Silme butonlarını UI'dan gizleme (envanter, muhasebe, cari)
- [ ] Toplu işlemlere yetki kontrolü ekleme
- [ ] Onay geçmişi ve log sistemi
- [ ] E-posta/bildirim sistemi (onay bekleyen talepler için)
- [ ] Yetki şablonları (Kasiyer, Depo Sorumlusu, vb.)

---

**Oluşturulma Tarihi**: 25 Ocak 2026, 02:58  
**Versiyon**: 3.0 - Kritik Yetki Sistemi
