---
description: Fiş ve Taksitli Satış Kararlılık Güncellemesi Sonrası Stabil Hal (10 Şubat 2026)
---
# Restore to version: a028b543919e04957ba9669d7afef5e82a71a9dc

Bu sürümde:
1.  **POS Komisyon Mantığı İyileştirildi:** Taksitli satışlarda komisyon hesaplama hatası giderildi. Komisyon hesabı, satış işleminden ayrılarak (decouple) bağımsız bir transaction içinde yürütülüyor.
2.  **Satış Garantisi:** Komisyon hesabında sorun çıksa bile (yanlış taksit sayısı, hesap planı hatası vs.) müşteri satışı ve stok düşümü başarıyla tamamlanıyor.
3.  **Hata Dayanıklılığı:** Taksit sayısı ("3 Taksit", "3" vb.) okuma hataları için güvenli sayısal dönüşüm (parseInt) eklendi.
4.  **Arayüz Güncellemesi:** POS ekranında Insights ve Forecast widget'ları sepetin altına taşındı, satış özeti scrollbar'ı gizlendi.

Geri dönmek için aşağıdaki komutu çalıştırın:

```bash
git reset --hard a028b543919e04957ba9669d7afef5e82a71a9dc
// turbo
```
