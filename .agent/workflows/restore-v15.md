---
description: Saha Satış & Kampanya Modülü Stabil Hali - Rota/Şablon Yönetimi (23 Şubat 2026)
---
1. **Kampanya Modülü**: Yeni kampanya tipleri devreye alındı: `buy_x_get_discount`, `buy_x_get_free`, `loyalty_points`, `payment_method_discount`. Müşteri kategorisi hedefleme ve marka/kategori bazlı koşullar eklendi.
2. **Saha Satış Paneli** (`/field-sales`): Bugünün rota bilgisi (durak sayısı, durum) ve aktif kampanyalar kart olarak gösteriliyor.
3. **Saha Planlama Panosu** (`/field-sales/admin/routes`): Rota şablonları üzerinde ✏️ yeniden adlandırma ve ✕ silme eklendi. Rota kartları üzerinde ✕ silme butonu, tıklayınca detay sayfasına yönlendirme eklendi. Takvimi kapatan `absolute inset-0` overlay butonu kaldırıldı.
4. **Rota Detay Sayfası** (`/field-sales/admin/routes/[id]`): ✏️ Rota adı/tarih/durum düzenleme, + Durak ekleme, ✕ Durak kaldırma, 🗑️ Rotayı tamamen silme özellikleri çalışır hale getirildi.
5. **Ziyaret Geçmişi** (`/field-mobile/visits`): Filtreler (Tümü/Bugün/Bu Hafta), ziyaret sonucu etiketleri ve ✏️ düzenleme modalı (not + sonuç) eklendi.
6. **API Güncellemeleri**: `PUT /api/field-sales/visits`, `PUT /api/field-sales/routes/[id]`, `DELETE /api/field-sales/templates/[id]` endpoint'leri eklendi.
7. **Prisma Schema**: `SalesVisit` modeline `result` alanı eklendi ve `db push` ile veritabanına uygulandı.

## Restore Steps
1. Git checkout: `cc0106ed78c35ec2c493be7f99a8a2260b5e338ea`
2. Bağımlılıklar: `npm install` ve `npx prisma generate`
3. Veritabanı: `npx prisma db push` (SalesVisit.result alanı eklenecek)
4. Deploy: `git push origin main` ile Vercel'e gönder
