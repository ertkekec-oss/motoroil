---
description: Vercel Build Lambda Hatası Düzeltmesi & Enterprise UI Hardening - Stabil Hal (2 Mart 2026)
---

### Dönüş Noktası: v27 - Vercel Deploy Fix & Enterprise UI Hardening

Bu yedek noktası, Vercel production deployment'larındaki sistematik "Unable to find lambda" ve "Internal Error" hatalarının kök nedeninin teşhis edilip çözüldüğü oturumu kapsar.

---

#### 🎯 Bu Oturumda Neler Yapıldı?

---

### 1. Enterprise UI Hardening (Firma Profili & Settings Yeniden Tasarım)

**settings/page.tsx** ve tüm alt panel componentleri kurumsal (enterprise corporate) tasarım diline geçirildi:

- `CompanyProfileForm.tsx` → 12 sütunluk kurumsal grid layout'a alındı
- `BranchesPanel.tsx`, `TaxesPanel.tsx`, `InvoiceSettingsPanel.tsx`, vb. → Enterprise primitives'e geçirildi
- **`EnterpriseCard`, `EnterpriseSectionHeader`, `EnterpriseField`, `EnterpriseInput`, `EnterpriseButton`, `EnterpriseSwitch`, `EnterpriseTable`** komponentleri `src/components/ui/enterprise/index.tsx` dosyasında merkezi olarak oluşturuldu
- Cam efektleri, gradyanlar, blur, büyük gölgeler kaldırıldı; yerine düz border'lı, `shadow-sm` yapılar geldi

---

### 2. Vercel Build Lambda Hatası - Kök Neden & Çözüm

#### ❌ Sorun

Vercel production deployment'ları "Dahili bir hata oluştu" (Internal Error) ile sonlanıyordu. Local `npx vercel build` çalıştırıldığında ise:

```
Error: Unable to find lambda for route: /billing/boost-invoices
Error: Unable to find lambda for route: /field-sales/admin/config
```

Hataları görülüyordu.

#### 🔍 Teşhis

| İpucu | Anlam |
|---|---|
| Build süresi ~1m 40s, ardından Internal Error | Build başarılı, DEPLOY aşaması başarısız |
| İlk başarısız commit: `2601cbd` (CompanyProfileForm redesign) | Force-dynamic **değil**, Turbopack uyumsuzluğu |
| `billing/boost-invoices/page.tsx` = `"use client"` | Vercel lambda'ları SSC (Server Side) page bekliyor |
| Local build output: `○` (static) ama adapter lambda arıyor | **Turbopack + `@vercel/next` adapter** format uyumsuzluğu |

#### ✅ Uygulanan Çözümler

**1. `billing/boost-invoices/page.tsx` → Server Component yapıldı**

```tsx
// ÖNCE (sorunlu):
"use client";
export default function BoostInvoicesPage() { ... }

// SONRA (çözüm):
export const dynamic = "force-dynamic";
import { BoostInvoicesClient } from "./BoostInvoicesClient";
export default function BoostInvoicesPage() {
    return <BoostInvoicesClient />;
}
```

Client logic ayrı `BoostInvoicesClient.tsx` dosyasına taşındı.

**2. `vercel-build` scripti düzeltildi**

```json
// ÖNCE (sorunlu):
"vercel-build": "prisma generate && prisma db push --accept-data-loss && next build"
// → prisma db push --accept-data-loss production'da tehlikeli
// → DATABASE_URL yokken Internal Error veriyor

// SONRA:
"vercel-build": "prisma generate && NEXT_EXPERIMENTAL_TURBO=0 next build"
// → Turbopack devre dışı, @vercel/next adapter uyumlu webpack mode
// → Migration Vercel build'inde çalışmaz, ayrı pipeline'da yapılmalı
```

**3. `billing/boost-invoices/layout.tsx` silindi**
- `export const dynamic = "force-dynamic"` layout'a konulamaz, sadece server page/API route'a konulabilir

**4. API route'ta `dynamic` → `revalidate = 0` çevrildi**
```ts
// ÖNCE: export const dynamic = "force-dynamic";
// SONRA: export const revalidate = 0; 
```

**5. `.gitignore` güncellendi**
- `vercel_build_errors.txt`, `git_log.txt`, `build.log`, vb. debug dosyaları artık commit edilmeyecek

---

### 3. Veritabanı Yedeği

```
checkpoints/backup_2026-03-02T15-33-31.json
```

---

#### 🔄 Geri Yükleme Talimatı

Bu stabil hale geri dönmek için:

```bash
# Son commit hash
git checkout 124889e

# Veya branch olarak
git checkout -b restore-v27 124889e
```

Vercel deploy etmek için:
```bash
git push origin main
# Vercel otomatik deploy tetiklenir (GitHub entegrasyonu)
```

---

#### ⚠️ Önemli Notlar

1. **`prisma db push --accept-data-loss` kullanılmamalı** — production'da veri kaybına yol açabilir. Schema değişiklikleri için `prisma migrate dev` (local) → `prisma migrate deploy` (CI/CD, ayrı pipeline) akışı kullanılmalı.

2. **Turbopack + @vercel/next** uyumsuzluğu Next.js 16'da bilinen bir sorun — `NEXT_EXPERIMENTAL_TURBO=0` ile devre dışı bırakılmalı.

3. **Client Component page'ler** Vercel adapter'ında `○` (static) olarak üretilir, lambda gerektirmez. Eğer lambda gerekiyorsa page.tsx'in server component olması zorunlu.
