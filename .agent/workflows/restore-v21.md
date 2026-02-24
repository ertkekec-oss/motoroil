---
description: "Unified Theme Toggles, fixed encoding issues, and resolved TSC errors - Stabil Hal (25 Şubat 2026)"
---

Bu yedekleme noktası, tema geçişlerinin POS ekranında merkezileştirilmesi, build hatalarının giderilmesi ve encoding sorunlarının çözülmesinden sonraki stabil haldir.

### Geri Yükleme Adımları:

1. Mevcut değişiklikleri temizleyin:
```bash
git reset --hard
git clean -fd
```

2. Bu versiyona geri dönün:
// turbo
```bash
git checkout 952011928a46eae721fdb7e694f5a77df0656c8b4
```

3. Bağımlılıkları kontrol edin ve build alın:
```bash
npm install
npm run build
```
