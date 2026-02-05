---
description: Bildirim ve Firma Profili Düzeltmeleri Sonrası Stabil Hal (5 Şubat 2026)
---

Bu geri yükleme noktası; bildirim merkezinin tam fonksiyonel olduğu ve firma profili ayarlarının sorunsuz çalıştığı andır.

Eğer bu stabil hale dönmek istersen şu adımları izle:

1. Mevcut tüm yerel değişiklikleri temizle:
```powershell
git reset --hard
git clean -fd
```

2. 5 Şubat Stabil Etiketine Geç:
```powershell
git checkout stable-v2-notifications-settings-5feb26
```

3. Bağımlılıkları ve Veritabanını Güncelle:
```powershell
npm install
npx prisma generate
```

Bu noktada sistem; Bildirim Merkezi, Firma Ayarları ve Nilvera Entegrasyonu ile birlikte %100 stabil çalışmaktadır.
