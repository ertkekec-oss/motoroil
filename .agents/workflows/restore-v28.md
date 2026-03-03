---
description: Envanter Yönetimi (Autonomous Intelligence Suite) - Stabil Hal (3 Mart 2026)
---
# Envanter Yönetimi / Autonomous Intelligence Suite Modülü (V28)

Bu komut, **3 Mart 2026** tarihinde tamamlanan "Envanter Yönetimi - Autonomous Intelligence Suite" (Periodya Enterprise Inventory OS) güncellemesinin stabil halini tanımlar ve sistemi bu yedeğe döndürür.

## 🛠 Neler Yapıldı?

1. **InventoryTable.tsx (Spreadsheet Tablo Düzeni):**
   - Satır yüksekliği standart 48px/36px kompaktlığına çekilerek yüksek veri yoğunluklu Spreadsheet (Grid) tasarımı uygulandı.
   - Sol taraftaki checkbox ile ürün seçimleri gerçekleştirildiğinde üstte beliren z-50 absolute Mass-Action Bar (`Toplu Fiyat Güncelle`, `Toplu Transfer`, `B2B Ağına Gönder`, `Pasife Al` gibi özellikler) inşa edildi.

2. **TransferTabContent.tsx (Hızlı Sevkiyat 2 Kolon Yapısı):**
   - Ekranda aynı düzende, *sol tarafta* "Bekleyen ve Yoldaki Transferler" (mal kabul onay/red) görünür kılındı.
   - Otonom What-If analiz önerilerine göre otomatik transfer önerileri bloku eklendi.
   - *Sağ tarafta (Sticky)* Barkod / arama üzerinden Hızlı Sevkiyat Motoru tasarlandı, Çıkış-Varış deposu seçme ve anında transfer başlatma fonksiyonu oturtuldu.

3. **BulkPriceEntryContent.tsx (Sınıf Fiyatlandırma Aracı):**
   - Tamamen "Excel/Spreadsheet" deneyimine geçiş yapıldı.
   - KKM (Tahmini), Tavsiye Edilen Fiyat, Mevcut Fiyat ve Yeni Fiyat gibi stratejik özellikler eklendi.
   - Herhangi bir fiyata müdahale edildiğinde otomatik olarak checkbox seçimi aktifleştirildi ve alt kısımdaki kaydet barına işlendi.

4. **Sistem Genel: TypeScript / Build Fix:**
   - Ürün ID (`string | number`) yapılarındaki farklı tip gereksinimleri sebebiyle oluşan `tsc --noEmit` build hataları tamamen düzeltildi.
   - Vercel sunucusuna Deploy edilerek `main` branch güncellendi.

## 🚀 Yedekten Dönüş (Restore) Talimatı
// turbo-all
1. Veritabanının V28 noktasına geri dönmesi için yedek scriptini çalıştır (Zaten Backup alınmıştı).
```powershell
node scripts/restore-backup.js --latest
```
2. Build işleminin ve TypeScript doğrulamasının çalıştığını test et.
```powershell
npm run build:local
```
