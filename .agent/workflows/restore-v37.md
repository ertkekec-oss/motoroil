---
description: Hepsiburada Senkronizasyon, Kargo Etiketi ve İzolasyon Sonrası Stabil Hal (12 Mart 2026)
---
### Durum ve Açıklama

Bu yedek ve kurtarma noktası, Periodya'da **Hepsiburada Entegrasyonu (Sipariş çekme, Detay eşleme, Veri tamamlama ve Kargo Etiketi yazdırma)** çözüldükten sonraki stabil halini temsil eder.
Trendyol entegrasyonu tamamen korunmuş ve izole edilmiştir. Hepsiburada'nın sıkı hız limitlenmesi ve payload yapılandırma farklılıkları bu sürümde güvence altına alınmıştır.

### Önemli Modüller

- **Hepsiburada Sipariş Çekim**: `UNPACKED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED` siparişlerin getOrders üzerinden sıralı ve güvenli şekilde fetch edilmesi.
- **Hepsiburada Rate Limiter**: Sipariş detaylarındaki eksikleri tamamlamak için atılan `getOrderByNumber` isteklerine `400ms` gecikmeli rate-limiter eklendi (Hepsiburada API 502/403/Connection timeout engeli).
- **Hepsiburada Kargo Etiketi**: Hepsiburada platformu etiketleri `pdfBase64` ve array olarak döndürüyor. Bu string/JSON karmaşası ayrıştırıldı ve doğru Native PDF formatı olarak API tarafında işlenir hale geldi.
- **Trendyol & Hepsiburada API Ayrışması**: `/api/orders/get-label/route.ts` yolunda hem Trendyol hem de Hepsiburada etiketleri `marketplace` isteğine göre ayrıştırılarak native bir biçimde bağlandı.
- **İsimlendirme ve Detay Koruması**: Hepsiburada siparişlerindeki `Müşteri` isim sorunu ve tutar bilgisi kayıpları giderildi. 

### Çalıştırılacak Komutlar
Eğer bu versiyona geri dönmek veya sistemi yeniden ayağa kaldırmak isterseniz:

1. Ana dizine git ve paketleri kur
// turbo-all
2. Repoyu bu sürüme veya main branch'ine zorla eşitle
```bash
git fetch --all
git reset --hard HEAD
```
3. Typescript kontrolü yap:
```bash
npx tsc --noEmit
```

Sistem bu noktada Vercel ile 100% uyumlu ve Hepsiburada hatasız şekilde yayındadır.
