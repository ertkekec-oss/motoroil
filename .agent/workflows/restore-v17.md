---
description: Yardım Merkezi / Destek Sistemi UI Fix ve Modernizasyon - Stabil Hal (23 Şubat 2026)
---

Bu kayıt noktası, Admin Panel'deki Destek Masası ve Yardım Merkezi sayfalarının açık tema (light mode) uyumsuzluklarını ve kategori ekleme akışındaki iyileştirmeleri içerir.

### Yapılan Değişiklikler:
1. **Admin UI Fix**: Karanlık tema çakışmaları (beyaz üstüne beyaz yazılar) düzeltildi.
2. **Modernizasyon**: Sayfalar Admin panelinin genel `light-mode` yapısına uygun hale getirildi.
3. **Usability**: Kategori olmayan durumlarda "Konu Ekle" butonunun neden çalışmadığına dair bilgilendirme eklendi.
4. **Stabilite**: Destek biletleri ve makale yönetim akışı stabil hale getirildi.

### Geri Dönerken Çalıştırılacak Komutlar:
// turbo
1. Bu versiyona geri dönmek için:
```powershell
git checkout 311d91663bd54fa8a492d6a45332f888e41b0a550
```
