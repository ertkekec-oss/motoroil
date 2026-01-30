# 🔄 Yedekleme ve Geri Yükleme Kılavuzu

**Oluşturulma Tarihi**: 30 Ocak 2026  
**Versiyon**: 1.0

---

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Yedekleme İşlemleri](#yedekleme-işlemleri)
3. [Geri Yükleme İşlemleri](#geri-yükleme-işlemleri)
4. [Otomatik Yedekleme](#otomatik-yedekleme)
5. [Sorun Giderme](#sorun-giderme)

---

## 🚀 Hızlı Başlangıç

### Yedek Oluşturma (1 dakika)
```bash
npm run backup
```

### Yedekten Geri Yükleme (2-3 dakika)
```bash
npm run restore checkpoints/backup_2026-01-30T20-12-00.json
```

---

## 💾 Yedekleme İşlemleri

### Manuel Yedekleme

#### 1. NPM Script ile (Önerilen)
```bash
cd "c:\Users\ertke\OneDrive\Masaüstü\periodya\muhasebeapp\motoroil"
npm run backup
```

**Çıktı:**
```
🔄 Veritabanı yedekleme başlatılıyor...
📁 Yedek dosyası: checkpoints/backup_2026-01-30T20-12-00.json

✅ Yedekleme tamamlandı!

📊 İstatistikler:
──────────────────────────────────────────────────
  users                     :      5 kayıt
  staff                     :     12 kayıt
  branches                  :      3 kayıt
  products                  :    450 kayıt
  customers                 :    120 kayıt
  ...
──────────────────────────────────────────────────

💾 Dosya boyutu: 2.45 MB
📁 Konum: checkpoints/backup_2026-01-30T20-12-00.json

🎉 İşlem başarıyla tamamlandı!
```

#### 2. Node Script ile
```bash
node scripts/create-backup.js
```

#### 3. API Endpoint ile
```bash
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"type": "full", "includeData": true}'
```

### Yedekleme İçeriği

Yedek dosyası şunları içerir:
- ✅ Tüm kullanıcılar ve personel
- ✅ Tüm ürünler ve stok bilgileri
- ✅ Tüm müşteriler ve tedarikçiler
- ✅ Tüm finansal işlemler (kasalar, işlemler, faturalar)
- ✅ Tüm siparişler ve servis kayıtları
- ✅ Tüm kampanyalar, kuponlar, garantiler
- ✅ Tüm audit log ve güvenlik olayları
- ✅ Tüm ayarlar ve konfigürasyonlar

### Yedek Dosya Formatı

```json
{
  "metadata": {
    "timestamp": "2026-01-30T20:12:00.000Z",
    "version": "4.2.0",
    "checkpointId": "BACKUP_2026-01-30T20-12-00",
    "stats": {
      "users": 5,
      "products": 450,
      "customers": 120,
      ...
    }
  },
  "data": {
    "users": [...],
    "products": [...],
    "customers": [...],
    ...
  }
}
```

---

## 🔄 Geri Yükleme İşlemleri

### ⚠️ ÖNEMLİ UYARILAR

1. **Geri yükleme mevcut tüm verileri SİLER!**
2. **İşlem geri alınamaz!**
3. **Önce mevcut durumun yedeğini alın!**
4. **Production ortamında çok dikkatli olun!**

### Manuel Geri Yükleme

#### 1. NPM Script ile (Önerilen)
```bash
# Önce mevcut durumu yedekle
npm run backup

# Sonra geri yükle
npm run restore checkpoints/backup_2026-01-30T20-12-00.json
```

**Çıktı:**
```
🔄 Veritabanı geri yükleme başlatılıyor...
📁 Yedek dosyası: checkpoints/backup_2026-01-30T20-12-00.json

📊 Yedek Bilgileri:
  Tarih: 2026-01-30T20:12:00.000Z
  Versiyon: 4.2.0
  Checkpoint ID: BACKUP_2026-01-30T20-12-00

⚠️  UYARI: Bu işlem mevcut tüm verileri silecek!
⚠️  Devam etmek için 10 saniye bekleniyor...
⚠️  İptal etmek için Ctrl+C yapın.

🗑️  Mevcut veriler temizleniyor...
✅ Temizleme tamamlandı

📥 Veriler geri yükleniyor...
  ✓ Users: 5 kayıt
  ✓ Staff: 12 kayıt
  ✓ Branches: 3 kayıt
  ✓ Products: 450 kayıt
  ...

✅ Geri yükleme tamamlandı!
🎉 Veritabanı başarıyla geri yüklendi.
```

#### 2. Node Script ile
```bash
node scripts/restore-backup.js checkpoints/backup_2026-01-30T20-12-00.json
```

### Geri Yükleme Adımları

1. **Yedek Dosyasını Bul**
   ```bash
   ls checkpoints/
   ```

2. **Yedek Bilgilerini Kontrol Et**
   - Dosya adından tarihi kontrol edin
   - Dosya boyutunu kontrol edin
   - JSON formatını doğrulayın

3. **Mevcut Durumu Yedekle**
   ```bash
   npm run backup
   ```

4. **Geri Yükleme Başlat**
   ```bash
   npm run restore checkpoints/backup_TARIH.json
   ```

5. **10 Saniye İçinde İptal Edebilirsiniz**
   - Ctrl+C ile iptal edin
   - Devam etmek için bekleyin

6. **Doğrulama**
   ```bash
   npm run dev
   # http://localhost:3000 adresine gidin
   # Verileri kontrol edin
   ```

---

## ⏰ Otomatik Yedekleme

### Günlük Otomatik Yedekleme (Windows)

#### 1. Task Scheduler ile

**Görev Oluşturma:**
1. Task Scheduler'ı açın
2. "Create Basic Task" seçin
3. İsim: "MOTOROIL Daily Backup"
4. Trigger: Daily, 02:00 AM
5. Action: Start a program
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `scripts/create-backup.js`
   - Start in: `c:\Users\ertke\OneDrive\Masaüstü\periodya\muhasebeapp\motoroil`

#### 2. PowerShell Script ile

**Dosya:** `scripts/auto-backup.ps1`
```powershell
cd "c:\Users\ertke\OneDrive\Masaüstü\periodya\muhasebeapp\motoroil"
node scripts/create-backup.js
```

**Task Scheduler'a Ekle:**
- Action: `powershell.exe -File "scripts/auto-backup.ps1"`

### Haftalık Yedekleme

Aynı şekilde ama trigger'ı "Weekly" yapın.

### Eski Yedekleri Temizleme

**Manuel:**
```bash
# 30 günden eski yedekleri sil
cd checkpoints
# Windows PowerShell
Get-ChildItem -Filter "backup_*.json" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

---

## 🔍 Yedek Dosyalarını Yönetme

### Yedekleri Listeleme
```bash
cd checkpoints
dir backup_*.json
```

### Yedek Bilgilerini Görüntüleme
```bash
# PowerShell
Get-Content checkpoints/backup_2026-01-30T20-12-00.json | ConvertFrom-Json | Select-Object -ExpandProperty metadata
```

### Yedek Boyutlarını Kontrol Etme
```bash
# PowerShell
Get-ChildItem checkpoints/backup_*.json | Select-Object Name, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}} | Sort-Object Name -Descending
```

### Yedekleri Arşivleme
```bash
# ZIP olarak sıkıştır
Compress-Archive -Path checkpoints/backup_2026-01-30T20-12-00.json -DestinationPath archives/backup_2026-01-30.zip
```

---

## 🛡️ Güvenlik ve En İyi Uygulamalar

### Yedekleme Stratejisi

#### 3-2-1 Kuralı
- **3** kopya: Orijinal + 2 yedek
- **2** farklı ortam: Lokal + Cloud
- **1** off-site: Uzak lokasyon

#### Önerilen Yedekleme Planı
- **Günlük**: Otomatik lokal yedek (son 7 gün sakla)
- **Haftalık**: Cloud yedek (son 4 hafta sakla)
- **Aylık**: Arşiv yedek (1 yıl sakla)

### Yedek Güvenliği

#### 1. Şifreleme (Önerilen)
```bash
# 7-Zip ile şifreli arşiv
7z a -p -mhe=on backup_encrypted.7z checkpoints/backup_2026-01-30T20-12-00.json
```

#### 2. Cloud Yedekleme
```bash
# Google Drive, OneDrive, Dropbox vb.
# Manuel veya rclone ile otomatik
```

#### 3. Erişim Kontrolü
- Yedek dosyalarına sadece admin erişsin
- Şifre koruması kullanın
- Audit log tutun

---

## 🚨 Sorun Giderme

### Yedekleme Hataları

#### Hata: "Cannot connect to database"
**Çözüm:**
```bash
# Database bağlantısını kontrol et
npx prisma db pull

# .env dosyasını kontrol et
cat .env | grep DATABASE_URL
```

#### Hata: "Out of memory"
**Çözüm:**
```bash
# Node memory limitini artır
node --max-old-space-size=4096 scripts/create-backup.js
```

#### Hata: "Permission denied"
**Çözüm:**
```bash
# Klasör izinlerini kontrol et
mkdir -p checkpoints
chmod 755 checkpoints
```

### Geri Yükleme Hataları

#### Hata: "Backup file not found"
**Çözüm:**
```bash
# Dosya yolunu kontrol et
ls checkpoints/
# Tam yol kullan
npm run restore "c:\Users\...\checkpoints\backup_2026-01-30T20-12-00.json"
```

#### Hata: "Foreign key constraint failed"
**Çözüm:**
```bash
# Database'i sıfırla
npx prisma migrate reset
# Tekrar dene
npm run restore checkpoints/backup_2026-01-30T20-12-00.json
```

#### Hata: "Invalid JSON"
**Çözüm:**
```bash
# JSON formatını kontrol et
node -e "JSON.parse(require('fs').readFileSync('checkpoints/backup_2026-01-30T20-12-00.json'))"
```

---

## 📊 Yedekleme İstatistikleri

### Tipik Yedek Boyutları

| Veri Miktarı | Yedek Boyutu | Süre |
|--------------|--------------|------|
| Küçük (100 ürün) | ~500 KB | 5 sn |
| Orta (1,000 ürün) | ~2 MB | 15 sn |
| Büyük (10,000 ürün) | ~20 MB | 1 dk |
| Çok Büyük (100,000 ürün) | ~200 MB | 5 dk |

### Geri Yükleme Süreleri

| Yedek Boyutu | Geri Yükleme Süresi |
|--------------|---------------------|
| 500 KB | 10 sn |
| 2 MB | 30 sn |
| 20 MB | 2 dk |
| 200 MB | 10 dk |

---

## 📞 Destek

### Yardım Komutları
```bash
# Yedekleme yardımı
npm run backup -- --help

# Geri yükleme yardımı
npm run restore -- --help
```

### Loglar
```bash
# Yedekleme logları
cat logs/backup.log

# Hata logları
cat logs/error.log
```

---

## ✅ Kontrol Listesi

### Yedekleme Öncesi
- [ ] Database çalışıyor mu?
- [ ] Yeterli disk alanı var mı?
- [ ] Önceki yedek başarılı mı?

### Geri Yükleme Öncesi
- [ ] Mevcut durum yedeklendi mi?
- [ ] Yedek dosyası doğru mu?
- [ ] Production ortamında mısınız? (Dikkat!)
- [ ] Kullanıcılar bilgilendirildi mi?

### Geri Yükleme Sonrası
- [ ] Veriler doğru mu?
- [ ] Tüm özellikler çalışıyor mu?
- [ ] Kullanıcılar giriş yapabiliyor mu?
- [ ] Raporlar doğru mu?

---

**Son Güncelleme**: 30 Ocak 2026  
**Versiyon**: 1.0  
**Hazırlayan**: Antigravity AI
