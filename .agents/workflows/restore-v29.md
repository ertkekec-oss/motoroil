---
description: Settings Dark Mode Fixes - Stabil Hal (5 Mart 2026)
---
# Ayarlar Panelleri & Dark Mode Standardizasyonu (V29)

Bu komut, **5 Mart 2026** tarihinde tamamlanan "Settings & Profile Dark Mode Form Fixes" (Ayarlar Panellerinde form ve tasarım güncellemeleri) işleminin stabil halini tanımlar ve sistemi bu yedeğe döndürür.

## 🛠 Neler Yapıldı?

1. **Enterprise Layout & Padding Düzeltmesi (`max-w-5xl mx-auto w-full p-8 pt-10`)**:
   - `/settings` altındaki, sağda açılan panellerin (`SystemResetPanel`, `AccountPanel`, `InvoiceSettingsPanel`, `BranchesPanel`, `CompanyProfileForm` vb.) genişlik dengesizlikleri giderildi. Merkezlenmiş ve tam `max-w-5xl` genişliğinde form yapıları oturtuldu.

2. **Koyu Tema Zıtlıkları (Dark Contrast Layers)**:
   - Panel (`ERPBlock`, vb.) arka planları ve giriş elemanları (Input, Textarea, Select) arasındaki zıtlık (`#0f172a` ve `#020617` renkleri) Enterprise standartlarınca netleştirildi.
   - Disabled (kilitli) veri hücrelerinde yazılanların ve kutuların okunaklılığı artırıldı (`dark:disabled:text-slate-400`).

3. **Sistem Genel**:
   - `tsc` hataları denetlenip üretim (Production) paketlenmesi ve Vercel `main` dalı üzerine deploy (`npx vercel --prod`) başarılı bir biçimde yapıldı.

## 🚀 Yedekten Dönüş (Restore) Talimatı
// turbo-all
1. Veritabanının V29 noktasına geri dönmesi için yedek scriptini çalıştır (Zaten Backup alınmıştı).
```powershell
node scripts/restore-backup.js --latest
```
2. Build işleminin ve TypeScript doğrulamasının çalıştığını test et.
```powershell
npm run build:local
```
