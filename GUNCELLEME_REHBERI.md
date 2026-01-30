# 🔄 MOTOROIL ERP - GÜNCELLEME VE VERİ GÜVENLİĞİ REHBERİ

Bu rehber, canlıda (production) çalışan sisteminizi bozmadan ve verilerinizi kaybetmeden nasıl yeni özellikler ekleyebileceğinizi anlatır.

---

## 🛡️ 1. VERİ SAKLAMA PRENSİBİ
Uygulamanız iki ana parçadan oluşur:
1.  **Kod (Stateless)**: Değiştirilebilir, silinebilir, yeniden yüklenebilir (Next.js dosyalarınız).
2.  **Veri (Stateful)**: Asla silinmemeli, dikkatli güncellenmeli (MySQL/PostgreSQL veritabanınız ve `public/uploads` klasörü).

**Kural**: Güncelleme yaparken kodları değiştiririz, veritabanına dokunmayız.

---

## 🚀 2. GÜNCELLEME ADIMLARI (PROFESYONEL AKIŞ)

### Adım 1: Lokalde Geliştirme ve Test
Canlı sistemi riske atmamak için önce kendi bilgisayarınızda geliştirme yapın.
```bash
# Yeni özelliği ekle
#npm run dev ile test et
```

### Adım 2: Yedek Alın (KRİTİK!)
Herhangi bir güncellemeden önce canlı veritabanınızın yedeğini alın.
- **cPanel**: Veritabanları -> phpMyAdmin -> Dışa Aktar.
- **Vercel/PlanetScale**: Dashboard üzerinden "Backup" oluşturun.

### Adım 3: Kodları Gönderin (Git)
Kodları GitHub'a gönderdiğinizde deployment otomatik tetiklenir:
```bash
git add .
git commit -m "Özellik: Taksitli satış UI eklendi"
git push origin main
```

---

## 🏗️ 3. VERİTABANI ŞEMASI GÜNCELLEME (MIGRATION)
Eğer kod değişikliği veritabanında yeni bir tablo veya sütun gerektiriyorsa:

1.  **Geriye Dönük Uyumluluk**: Yeni eklediğiniz kodun eski verilerle de çalışabildiğinden emin olun.
2.  **Migration Çalıştırın**:
    - Eğer SQL kullanıyorsanız: `ALTER TABLE products ADD COLUMN barcode2 VARCHAR(255);`
    - Eğer Prisma kullanıyorsanız: `npx prisma migrate deploy`

---

## 📁 4. DOSYALARI EL İLE YÜKLÜYORSANIZ (FTP/CPANEL)

Eğer GitHub kullanmadan manuel dosya yüklüyorsanız şu klasörlere **DİKKAT EDİN**:

- ❌ **ASLA SİLMEYİN**: `.env` dosyası (veritabanı şifreleriniz buradadır).
- ❌ **ASLA SİLMEYİN**: `public/uploads` (yüklediğiniz ürün resimleri buradadır).
- ✅ **GÜNCELLEYİN**: `.next` klasörü (Build sonrası oluşan klasör).
- ✅ **GÜNCELLEYİN**: `package.json` (Yeni paket eklediyseniz).

---

## 🛠️ 5. GÜNCELLEME SONRASI KONTROL LİSTESİ

1.  **Build Başarılı mı?**: Dashboard üzerinden build loglarını kontrol edin.
2.  **Bağlantı Var mı?**: Sayfayı yenileyin, mevcut veriler geliyor mu?
3.  **Yeni Özellik Çalışıyor mu?**: Eklediğiniz yeni butonu/özelliği test edin.
4.  **Logları İzleyin**: Hata konsolunda (F12) kırmızı hatalar var mı?

---

## 🆘 6. HATA OLURSA: GERİ DÖNÜŞ (ROLLBACK)

Eğer bir güncelleme sistemi bozarsa:
1.  **Vercel/Netlify**: "Deployments" menüsünden bir önceki çalışan versiyona "Rollback" yapın (Tek tıkla eski koda döner).
2.  **Manuel**: Yedeklediğiniz veritabanını geri yükleyin ve eski dosya yedeğini sunucuya atın.

---

## 💡 İPUCU: "STAGING" ORTAMI KURUN
Gerçekten büyük güncellemeler yapacaksanız, ana sitenizin kopyası olan bir `test.motoroil.com` adresi kurun. Önce orada deneyin, çalışırsa ana siteye aktarın.

---

**Güvenlik Notu**: Canlı sistemde asla `npm run dev` çalıştırmayın. Her zaman `npm run build` ve ardından `npm start` (veya sunucunun otomatik start komutu) kullanın.
