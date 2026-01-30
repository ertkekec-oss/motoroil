# 🔧 Scripts Klasörü

Bu klasör, MOTOROIL ERP uygulaması için yardımcı script'leri içerir.

## 📁 Mevcut Script'ler

### 1. create-backup.js
**Amaç**: Veritabanının tam yedeğini alır  
**Kullanım**: `npm run backup` veya `node scripts/create-backup.js`  
**Çıktı**: `checkpoints/backup_TARIH.json`

**Özellikler**:
- Tüm 27 tabloyu yedekler
- JSON formatında export eder
- İstatistik raporu oluşturur
- Dosya boyutunu gösterir

### 2. restore-backup.js
**Amaç**: Yedekten veritabanını geri yükler  
**Kullanım**: `npm run restore checkpoints/backup_TARIH.json`

**Özellikler**:
- 10 saniye güvenlik bekleme süresi
- Mevcut verileri temizler
- Yedekten verileri geri yükler
- İlerleme raporu gösterir

**⚠️ UYARI**: Bu işlem mevcut tüm verileri SİLER!

## 🚀 Hızlı Kullanım

### Yedek Alma
```bash
npm run backup
```

### Geri Yükleme
```bash
npm run restore checkpoints/backup_2026-01-30T20-12-00.json
```

## 📖 Detaylı Dokümantasyon

Daha fazla bilgi için:
- `YEDEKLEME_KILAVUZU.md` - Kapsamlı kullanım kılavuzu
- `checkpoints/RESTORE_POINT_2026_01_30.md` - Geri yükleme noktası dokümantasyonu

## 🔜 Gelecek Script'ler

Planlanmış script'ler:
- [ ] `migrate-data.js` - Veri migrasyonu
- [ ] `seed-demo.js` - Demo veri oluşturma
- [ ] `cleanup-old-backups.js` - Eski yedekleri temizleme
- [ ] `export-excel.js` - Excel export
- [ ] `import-excel.js` - Excel import
- [ ] `generate-reports.js` - Otomatik rapor oluşturma

## 📝 Script Oluşturma Kuralları

Yeni script oluştururken:
1. Açıklayıcı dosya adı kullanın (kebab-case)
2. Başında yorum bloğu ekleyin (amaç, kullanım)
3. Error handling ekleyin
4. Console output'u anlamlı yapın
5. Module export ekleyin (diğer script'lerden kullanılabilir)
6. package.json'a npm script ekleyin

## 🛡️ Güvenlik

- Script'ler sadece admin tarafından çalıştırılmalı
- Production ortamında dikkatli kullanın
- Önemli işlemler öncesi yedek alın
- Logları kontrol edin

---

**Son Güncelleme**: 30 Ocak 2026  
**Toplam Script**: 2
