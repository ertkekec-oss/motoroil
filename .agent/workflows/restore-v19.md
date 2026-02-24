---
description: Saha Satış Cari Entegrasyonu, Görünürlük ve Müşteri Listesi Fixleri - Stabil Hal (24 Şubat 2026)
---

### Saha Satış Modülü İyileştirmeleri (Geri Dönüş Noktası - V19)
Bu yedek noktası, saha satış operasyonlarının ERP geri ofis (muhasebe/cari) ile tam entegre çalışmasını sağlayan ve kullanıcı hatalarını/eksikliklerini gideren geliştirmeleri içerir.

**Kapsam:**
1. **Cari & Bakiye Entegrasyonu:** `SalesOrder` oluşturulduğunda otomatik müşteri bakiyesi güncelleme ve `Transaction` kaydı oluşturma.
2. **Satış Geçmişi Senkronizasyonu:** Saha satışlarının "Mağaza Satışları" sekmesinde süzülebilmesi için `sales/history` API'sine `SalesOrder` desteği eklendi.
3. **Müşteri Listesi Erişimi:** Saha personeli için "Müşterilerim" sayfasında atama yoksa tüm firma müşterilerini görme yeteneği eklendi.
4. **Hesap Ekstresi Fixleri:** Saha satışlarının ekstrede doğru yön (BORÇ) ve açıklama ile görünmesi sağlandı.
5. **Düzenlenebilir Sipariş Altyapısı:** Tamamlanan saha satışlarının düzeltilebilmesi için PUT metodu ile bakiye ve stokları geri alan/yenileyen API endpoint'i (`orders/[id]`) eklendi.

**Geri Dönme Talimatı:**
Eğer bu muhasebe entegrasyonu veya listeleme mantığı sistemde bir tutarsızlık yaratırsa, aşağıdaki komutla bu commit'e geri dönebilirsiniz:

```bash
git revert 52051e2
```

*Not: Revert durumunda, yeni oluşturulan `/api/field-sales/orders/[id]/route.ts` dosyasının manuel olarak da silinmesi gerekebilir (e-commerce view güvenliği için).*
