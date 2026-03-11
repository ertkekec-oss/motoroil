---
description: N11 Entegrasyonu, Akıllı Kargo Etiketi (EAN-128 Çizim Motoru) ve Stabil Durum (12 Mart 2026)
---
### Durum ve Açıklama

Bu yedek ve kurtarma noktası, Periodya'da **N11 Entegrasyonu (REST API getShipmentPackages) ve Kargo Etiketi** süreçleri tamamlandıktan sonraki stabil halini temsil eder.
N11'in kendi tarafında (Trendyol'daki gibi doğrudan PDF veya bir barkod linki veren) native bir `GET /label` servisi bulunmadığı için Periodya'nın geliştirmiş olduğu HTML / SVG tabanlı akıllı etiket yedekleme motoru (Fallback Engine) N11'e tanımlanmıştır.

### Önemli Modüller

- **N11 REST API Entegrasyonu**: API Key ve Secret kullanılarak `shipmentPackages` endpointinden statü bazlı güvenli veri gönderimi ve çekimi.
- **N11 Kargo Etiketi Fallback Engine**: Herhangi bir kargo entegratörü yazılımına (3. parti firmalar vs.) ihtiyaç duyulmadan N11'den gelen kargo barkod (Takip/Kampanya) numarasının anlık olarak JsBarcode (EAN-128 / CODE128) yapısı ile oluşturulması ve Müşteri, Adres, Teslimat Birimi gibi formatlanmış verilerin basımı.
- **Sipariş İzleme Ayrıştırması**: Trendyol ve Hepsiburada'ya ek olarak N11 isteklerinin kendi kod izole bölgesinde native olarak yönetilmesi (`/api/marketplaces/[marketplace]/orders/[orderId]/label/route.ts`).
- **Veri Düzeltmeleri**: Sipariş adresi birleştirme `(Adres + İl + İlçe)` eksiklerinin N11 schema'sı olan `shippingAddress / billingAddress` mapping yapısına uydurulması.

### Çalıştırılacak Komutlar
Eğer bu versiyona geri dönmek veya sistemi yeniden ayağa kaldırmak isterseniz:

1. Ana dizine git ve bağımlılıkları yükle:
// turbo-all
2. Repoyu bu sürüme veya main branch'ine zorla eşitle
```bash
git fetch --all
git reset --hard HEAD
```
3. Typescript doğrulama kontrolü (No-Emit):
```bash
npx tsc --noEmit
```

Sistem bu noktada Vercel ile 100% uyumlu ve N11 (Sipariş + Etiket) stabil şekilde çalışmaktadır.
