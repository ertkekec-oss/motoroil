# 🚀 ÜCRETSİZ CANLIYA ALMA REHBERİ (VERCEL)

Bu rehber ile uygulamanızı **Natro'ya para ödemeden**, Next.js'in yaratıcısı olan **Vercel** üzerinde ücretsiz olarak barındırabilirsiniz.

## 🌟 Neden Vercel?
- **%100 Ücretsiz** (Hobi planı)
- **Next.js için optimize edilmiş** (En performanslı platform)
- **Otomatik SSL** (Güvenli bağlantı)
- **Global CDN** (Dünyanın her yerinden hızlı açılır)
- **Kurulum gerektirmez** (Sunucu ayarı yok)

---

## 🛠️ YÖNTEM 1: EN KOLAY YOL (Komut Satırı ile)

GitHub ile uğraşmak istemiyorsanız, direkt bilgisayarınızdan yollayabilirsiniz.

### Adım 1: Vercel Hesabı Açın
1. [vercel.com/signup](https://vercel.com/signup) adresine gidin.
2. "Hobby" planını seçin.
3. E-posta veya Google ile giriş yapın.

### Adım 2: Vercel CLI Yükleyin
VS Code terminalini açın ve şu komutu yazın:

```bash
npm install -g vercel
```

### Adım 3: Giriş Yapın
Terminalde şu komutu yazın:

```bash
vercel login
```

- Klavye ok tuşları ile giriş yönteminizi seçin (Email, GitHub vs).
- Tarayıcı açılacak, onay verin.
- Terminalde "Success!" yazısını görün.

### Adım 4: Canlıya Alın (Deploy)
Proje klasörünüzde (`c:\Users\Life\Desktop\muhasebe app\motoroil`) şu komutu yazın:

```bash
vercel
```

Size birkaç soru soracak, hepsine **ENTER** diyerek geçin:
1. `Set up and deploy?` → **y** (Enter)
2. `Which scope?` → (Enter)
3. `Link to existing project?` → **n** (Enter)
4. `Project name?` → **motoroil** (Enter)
5. `In which directory?` → (Enter)
6. `Want to modify these settings?` → **n** (Enter)

🚀 **İşlem başlayacak!** 1-2 dakika içinde size bir link verecek.
Örn: `https://motoroil-xyz.vercel.app`

---

## 💾 VERİTABANI NE OLACAK?

Natro'da veritabanını sunucuya kuruyorduk. Vercel'de sunucu olmadığı için veritabanını da bulutta (cloud) tutmalıyız.

### En İyi Ücretsiz Seçenek: Neon (PostgreSQL)

1. [neon.tech](https://neon.tech) adresine gidin.
2. Ücretsiz hesap açın.
3. Yeni bir proje oluşturun.
4. Size vereceği bağlantı kodunu (connection string) kopyalayın.
   - Şuna benzer: `postgres://user:pass@ep-xyz.aws.neon.tech/neondb`

### Vercel'e Veritabanı Bilgisini Ekleme

1. Vercel panelinizde projenize gidin.
2. **Settings** → **Environment Variables** sekmesine gelin.
3. Yeni bir değişken ekleyin:
   - **Key:** `DATABASE_URL`
   - **Value:** (Neon'dan aldığınız bağlantı kodu)
4. `Save` deyin.
5. Değişikliğin etkili olması için tekrar deploy yapın:
   ```bash
   vercel --prod
   ```

---

## 🔄 GÜNCELLEME NASIL YAPILIR?

Kodda bir değişiklik yaptınız ve siteyi güncellemek mi istiyorsunuz?
Tek yapmanız gereken terminale şunu yazmak:

```bash
vercel --prod
```

Bitti! 30 saniye içinde siteniz güncellenir.

---

## ✅ NATRO vs VERCEL

| Özellik | Natro (Klasik Hosting) | Vercel (Modern Cloud) |
|---------|------------------------|-----------------------|
| 💰 **Maliyet** | Ücretli (Aylık/Yıllık) | **Ücretsiz** (Hobi) |
| 🚀 **Hız** | Sunucu konumuna bağlı | Global CDN (Çok Hızlı) |
| ⚙️ **Kurulum** | Zor (FTP, Node.js ayarı) | **Çok Kolay** (Tek komut) |
| 🔒 **SSL** | Kurulum gerekir | **Otomatik** |
| 💾 **Database** | İçinde gelir | Dışarıdan bağlanır (Neon vb.) |

---

## 🎯 TAVSİYEM

Eğer bu projeyi **kurumsal bir firmaya** satmayacaksanız veya çok büyük veriler tutmayacaksanız **kesinlikle Vercel kullanın.**

Kurulum ve bakım derdi yoktur. "Sunucu çöktü", "Node.js versiyonu uymadı" gibi sorunlar yaşamazsınız.
