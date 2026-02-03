---
description: Nilvera Entegrasyonu Stabil Haline Geri Dön (4 Şubat 2026)
---

Eğer faturadaki veya genel sistemdeki son stabil haline dönmek istersen şu adımları izle:

1. Mevcut değişiklikleri temizle:
```powershell
git reset --hard
```

2. Stabil etikete geç:
```powershell
git checkout stable-nilvera-integration-v1
```

3. Bağımlılıkları ve veritabanını tazele:
```powershell
npm install
npx prisma generate
```

Bu nokta; E-Fatura, E-Arşiv ve PDF görüntülemenin %100 çalıştığı andır.
