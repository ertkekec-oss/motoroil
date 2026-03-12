---
description: Hepsiburada Stabil Sipariş Senkronizasyonu & Otonom Tamir (12 Mart 2026)
---

# Hepsiburada Stabil Sipariş Senkronizasyonu ve Auto-Heal

Bu geri dönüş noktası, Hepsiburada entegrasyonunda yaşanan veri doğruluğu ve istikrar sorunlarının kalıcı olarak çözüldüğü ve otonom bir hata onarım sisteminin (Auto-Heal) devreye alındığı stabil versiyonu temsil eder.

## Çözülen Temel Sorunlar:

1. **Eksik Müşteri Detayları ("Müşteri" Hatası):**
   - Hepsiburada OMS API'sindeki yeni veri şeması (`deliveryAddress` ve `invoice` alanları) sisteme tanıtıldı.
   - API limitlerine takılan "Gönderildi" veya "İptal Edildi" paket listelerinden dönen eksik verilerin (sadece "Müşteri" ve eksik adres içeren), daha önce başarıyla kaydedilmiş olan orijinal detaylı sipariş verilerinin üzerine yazması engellendi.

2. **Hatalı Sipariş Tarihleri (Bugünün Tarihi Hatası):**
   - Hepsiburada listeleme API'leri siparişin asıl tarihini vermediğinde (limit nedeniyle), sistemin `Date.now()` ile sipariş tarihini bugün olarak kaydetmesi engellendi. Gerçek sipariş tarihleri güvence altına alındı.

3. **Gönderime Hazır (PACKED) Endpoint Hatası:**
   - Hepsiburada tarafından iptal edilen `packages/.../packed` adresi yerine, orijinal ana `packages/...` adresi kullanılarak 404 hataları önlendi ve kargoya verilmek üzere bekleyen siparişler başarıyla Periodya'ya çekildi.

4. **Kayıp Data Onarımı (Deep Sync & Auto-Heal):**
   - Geçmişte bozulan veya eksik çekilmiş ("Müşteri" veya "0 TRY" olan, tarihi yanlış olan) siparişler tespit edildi (`fix-hb-missing.ts`).
   - `route.ts` API uç noktası, eksik veriye sahip bir kargo ile karşılaştığında arka planda Hepsiburada sipariş detay (`/ordernumber/`) adresine istek atıp eksikleri kapatacak ve tarihleri otomatik düzeltecek (Auto-Heal) şekilde geliştirildi.
   - Manuel senkronizasyonlarda son 3 gün yerine istenen derinlikte (`gün` parametresi ile) geçmiş taranabilecek şekilde Deep Sync kapasitesi eklendi.

## İlişkili Dosyalar:
* `src/services/marketplaces/hepsiburada.ts`: Orijinal şema adaptasyonu ve veri modeli çıkarımı.
* `src/app/api/integrations/marketplace/sync/route.ts`: Database Upsert, Deep Sync ve Auto-Heal mantığı.

## Komutlar:

// turbo-all

1. Sistemi V39 stabil konumuna çekmek için:
```bash
git checkout . && git clean -fd
git fetch --all
git reset --hard origin/main
npm install
npm run build
```
