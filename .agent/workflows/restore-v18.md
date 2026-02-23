---
description: Homepage SEO Overhaul - SSR, Metadata, Schema, Sitemap & Robots.txt implemented (23 Şubat 2026)
---

### Periodya SEO Overhaul (Geri Dönüş Noktası)
Bu geri dönüş noktası, Periodya.com ana sayfasının SEO performansını artırmak amacıyla yapılan teknik ve içerik tabanlı iyileştirmeleri içerir. Mevcut UI/UX korunarak SSR altyapısı kurulmuştur.

**Kapsam:**
1. **SSR Entegrasyonu:** `app/(app)/page.tsx` sunucu bileşeni yapılarak meta veriler ve şemalar SSR olarak basıldı.
2. **Meta Veriler:** Title, Description, Open Graph ve Twitter kartları ERP odaklı güncellendi.
3. **SeoContent:** ~800 kelimelik "visually hidden" SEO içeriği ve FAQ eklendi.
4. **SeoSchema:** Organization, SoftwareApplication ve FAQPage JSON-LD şemaları eklendi.
5. **SEO Teknik:** `robots.txt` (`robots.ts`) ve `sitemap.xml` (`sitemap.ts`) yapılandırıldı.

**Geri Dönme Talimatı:**
Eğer ana sayfa yapısında veya render aşamasında bir sorun oluşursa, aşağıdaki komutu terminalde çalıştırarak bu değişiklikleri geri alabilirsiniz:

```bash
git revert 5b6bdc9
```

*Not: Revert sonrası src/app/(app)/HomeClient.tsx'in tekrar page.tsx olarak isimlendirilmesi gerekebilir.*
