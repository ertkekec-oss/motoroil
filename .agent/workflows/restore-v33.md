---
description: Signature Module V1 Public Portal & Dispute Workflow Stabil Haline Geri Dön (6 Mart 2026)
---

# Signature Module V1 Public Portal & Dispute Workflow Stabil Haline Geri Dön

Bu workflow ile projeyi **Signature Module V1 Public Portal & Dispute Workflow** ile kurumsal portal tasarım güncellemelerinin tamamlandığı 6 Mart 2026 tarihindeki stabil hale döndürebilirsiniz.

// turbo-all

1. Çalışma dizinini temizle ve commit edilmemiş değişiklikleri at:
```powershell
git reset --hard HEAD
```

2. İzlenmeyen (untracked) dosyaları temizle:
```powershell
git clean -fd
```

3. Geri dönülecek olan commit hash'ine geç (53278cd52e994b9e8c48b155a6f50aabcf9dd43c5):
```powershell
git checkout 53278cd52e994b9e8c48b155a6f50aabcf9dd43c5
```

4. Prisma schema değişikliklerini senkronize et (Eğer veritabanında yapısal değişiklikler olmuşsa):
```powershell
npx prisma generate
```

5. Gerekli node_modules bağımlılıklarını ve Typescript durumlarını tazele:
```powershell
npm install
npx tsc --noEmit
```

6. Son durum testleri için Next.js build al (Opsiyonel ama önerilir):
```powershell
npm run build
```
