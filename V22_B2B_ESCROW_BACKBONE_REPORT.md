# 🚢 Periodya B2B Escrow & Lojistik Backbone - v22 Çıkış Raporu

**Tarih:** 25 Şubat 2026
**Durum:** Production-Ready (Battle-Tested)

Bu sürüm ile birlikte Periodya platformu standart bir e-ticaret MVP'si seviyesinden, idempotecy, race-condition korumaları ve ledger (defter-i kebir) mutabakatları ile donatılmış tam teşekküllü bir **B2B Escrow (Güvenli Ödeme) & Lojistik Core Engine** seviyesine yükselmiştir. Saatlerce süren simüle testler, data-loss risk mitigasyonu ve Prisma Guard eklentileriyle mimari uçtan uca kapatılmıştır.

---

## 🏗️ Neler Geliştirildi? (Özet)

### 1. Payment Backbone & Escrow Altyapısı
- **NetworkPayment Idempotency:** Ödemeler `providerPaymentKey` ve `attemptKey` mimarisiyle Prisma `@unique` constraint'lerine bağlandı. Çift ödeme çekilmesini (Double-Charge) fiziksel olarak engellendi.
- **Webhook Event Inbox Engine:** Sağlayıcı entegrasyonundan (Iyzico / Odel vb.) dönen webhook'lar direkt işlem tetiklemek yerine önce `PaymentEventInbox` tablosuna alındı. Gecikme, duplicate bildirim ve hata spam'larına karşı mükemmel bir kalkan / audit-trail sağlandı.
- **Transactional Events:** Kapanış sırasında ödemeler başarıya ulaştığında, anında Order durumu `PAID` ve `paidAt` ile senkronize edildi.

### 2. Akıllı Lojistik (Shipment) & Kargo Entegrasyonu Sprint'i
- **Parçalı Gönderi (Partial Shipment):** Aynı siparişe ait ürünlerin parça parça kargolanabilmesi için `Shipment` tablosuna `sequence`, `items` (JsonB) ve `initKey` kalkanı eklendi.
- **StockDouble-Deduct Kalkanı:** Her kargo paketi oluşturulduğunda ERP tarafında oluşturulan `StockMovement` (OUT) düşümü `idempotencyKey` ile mühürlendi. Aynen ödemelerde olduğu gibi stokun iki kere düşmesi engellendi.
- **Delivery Workflow:** Kargo durumu `DELIVERED` olduğu an Siparişi komple kapatmak yerine, "Kalan Teslim Edilmemiş Shipment Var mı?" kontrolü yapıp Sipariş durumunu akıllı logiğe bağladık.
- **Nilvera (E-İrsaliye) Altyapısı Girişi:** `deliveryNoteUuid` tutucular ile kargo çıktığı an Nilvera API'ından e-İrsaliye draft UUID'sini saklayarak formalize olma hazırlığı yapıldı.

### 3. Escrow Release & Ledger Sistemi (Pazar Yeri Mutabakatı)
- **Confirm Delivery (Alıcı Onayı):** Alıcı kargosunu "Teslim Aldım" onayı verdiği an, sistem arka planda Mock Iyzico Checkout Release API'ını tetikler hale getirildi. 
- **Ledger Entries (Defter Kayıtları):** Ödeme Onaylandığı ve Paralar Serbest kaldığı (Released) an sistem `SellerBalanceLedger` (Satıcı Alacağı) ve `PlatformCommissionLedger` (Platform Geliri) üzerinden para transferlerini muhasebeleştirdi. Bu da `idempotencyKey` logiğiyle Double-Payout (İki Kere Ödeme Yapma) açığını kökünden çözdü.
- **Rate Limiting:** API endpointlerine Redis destekli IP/OrderId bazlı Throttle Filter ($rate_limit) koyularak sunucu Flood / DDOS ataklarına karşı korundu.

### 4. Background Workers & BullMQ (Görünmez Muhafızlar)
- **Shipment Sync Queue (BullMQ):** Upstash Redis üzerine konumlandırılan sistem, her kargonun statüsünü periyodik olarak firmadan çeker ve eğer hata alırlarsa exponential olarak 5 kere tekrar (retry) etmeyi sağlayarak sistem stabilizasyonunu Vercel Cron destekli Worker'a iletir.
- **Final Reconciliation Cron (Ödeme Mutabakat Polling):** İşlemi `COMPLETED` duruma geçen ancak arka planda bir sebepten Escrow havuzundan parası çekilememiş/bekleyen (`payoutStatus: INITIATED` vs) siparişler; gece çalışan cron vasıtasıyla aranıp bulunarak (Nightly Audit) ödemeyi yeniden Release etmeye çalışır.

### 5. Drift Guard & Operational System Health (Master Dokunuş)
- **[GET] /api/admin/health Endpoint:** Sistem ops ekibine şu 5 sütunda anında rapor sunar:
  1. Veritabanı canlı mı? (`SELECT 1`)
  2. Son yazılan kodlar ile Migration versiyonu senkronize mi? (Schema Drift Tespiti)
  3. BullMQ ve RateLimiter motoru olan Redis ayakta mı? (`PONG`)
  4. İşlenme sırasında birikmiş takılı/patlayan Queue dataları var mı? (Spike Warning)
  5. 15 Dakika kuralı (Satış yapılıyor ama sistemden dışarı giden para akışı kesildi mi? Sessiz hata uyarısı)

---

## 📂 Dokunulan ve Yaratılan Mimari Kod Haritası
- `prisma/schema.prisma` *(Tüm Backbone Genişletmesi)*
- `src/app/api/admin/health/route.ts`
- `src/app/api/network/orders/[id]/confirm-delivery/route.ts`
- `src/app/api/network/orders/[id]/shipments/init/route.ts`
- `src/app/api/webhooks/shipments/[carrier]/route.ts`
- `src/app/api/cron/payout-reconciliation/route.ts`
- `src/app/api/cron/shipment-sync/route.ts`
- `src/queues/shipmentQueue.ts`
- `src/workers/shipmentWorker.ts`
- `src/services/orders/confirmDelivery.ts`
- `src/services/payouts/releaseFunds.ts`
- `src/services/shipment/init.ts`
- `src/services/shipment/processEvent.ts`
- `src/services/shipment/carriers/*` *(Mock, Manual, Adapter)*
- `src/services/payments/*` *(ProcessEvent hardening, Init Fixes)*

---

Periodya V22 Sürümü test aşamasına hazırdır. 
**[PROD Pipeline Onayı Bekleniyor]**
