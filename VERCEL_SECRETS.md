# 🔑 VERCEL ENVIRONMENT VARIABLES

**ACIL:** Bu değerleri Vercel Dashboard'a ekleyin!

---

## 📋 EKLENMESİ GEREKEN DEĞİŞKENLER

### 1. JWT_SECRET
```
aJ8I7w0m9VfDErdobyilutAYQK62CCcFSWvTRekUx
```

### 2. SESSION_SECRET
```
msfMb0hqv4AiXyWSgU8ptnj7CEJkNNZlYo5w91HQ2
```

---

## 🚀 VERCEL'E NASIL EKLENİR?

### Yöntem 1: Vercel Dashboard (ÖNERİLEN)

1. **Vercel Dashboard'a Git:**
   ```
   https://vercel.com/motoroils-projects/motoroil/settings/environment-variables
   ```

2. **JWT_SECRET Ekle:**
   - **Add New** butonuna tıkla
   - **Key:** `JWT_SECRET`
   - **Value:** `aJ8I7w0m9VfDErdobyilutAYQK62CCcFSWvTRekUx`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development (hepsini seç)
   - **Save** tıkla

3. **SESSION_SECRET Ekle:**
   - **Add New** butonuna tıkla
   - **Key:** `SESSION_SECRET`
   - **Value:** `msfMb0hqv4AiXyWSgU8ptnj7CEJkNNZlYo5w91HQ2`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development (hepsini seç)
   - **Save** tıkla

4. **Redeploy:**
   - **Deployments** sekmesine git
   - En son deployment'ın yanındaki **...** (3 nokta) menüsüne tıkla
   - **Redeploy** seç
   - **Redeploy** butonuna tıkla

### Yöntem 2: Vercel CLI (Terminal)

```bash
# JWT_SECRET ekle
vercel env add JWT_SECRET
# Değeri yapıştır: aJ8I7w0m9VfDErdobyilutAYQK62CCcFSWvTRekUx
# Environments: Production, Preview, Development (hepsini seç)

# SESSION_SECRET ekle
vercel env add SESSION_SECRET
# Değeri yapıştır: msfMb0hqv4AiXyWSgU8ptnj7CEJkNNZlYo5w91HQ2
# Environments: Production, Preview, Development (hepsini seç)

# Redeploy
vercel --prod
```

---

## ✅ KONTROL LİSTESİ

Deployment öncesi:
- [ ] `JWT_SECRET` Vercel'de eklendi
- [ ] `SESSION_SECRET` Vercel'de eklendi
- [ ] Her iki değişken de Production, Preview, Development için seçildi
- [ ] Değişkenler kaydedildi

Deployment sırasında:
- [ ] Redeploy başlatıldı
- [ ] Build başarılı oldu
- [ ] Deployment tamamlandı

Deployment sonrası:
- [ ] Site açılıyor: https://www.kech.tr
- [ ] Login sayfası çalışıyor
- [ ] Giriş yapılabiliyor

---

## 🔍 HATA AYIKLAMA

Eğer hala "JWT_SECRET must be set" hatası alıyorsanız:

1. **Environment Variables'ı Kontrol Et:**
   - Vercel Dashboard > Settings > Environment Variables
   - `JWT_SECRET` ve `SESSION_SECRET` listede görünüyor mu?
   - Production environment'ı seçili mi?

2. **Redeploy Yaptığınızdan Emin Olun:**
   - Environment variable ekledikten sonra mutlaka redeploy yapın
   - Mevcut deployment otomatik güncellenmez

3. **Build Loglarını İnceleyin:**
   - Vercel Dashboard > Deployments > Latest
   - "Building" sekmesinde hata mesajını okuyun

---

## 🎯 BEKLENEN SONUÇ

Başarılı deployment'ta:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (79/79)
✓ Finalizing page optimization

✅ Production: https://motoroil-xxx.vercel.app
🔗 Aliased: https://www.kech.tr

Deployment completed successfully!
```

---

## ⚠️ GÜVENLİK UYARISI

**ÖNEMLİ:** Bu değerler çok gizlidir!

- ❌ Git'e commit etmeyin
- ❌ Kimseyle paylaşmayın
- ❌ Public yerlere yazmayın
- ✅ Sadece Vercel Dashboard'da saklayın
- ✅ Bu dosyayı deployment sonrası silin

---

## 📞 SONRAKI ADIM

1. Yukarıdaki değerleri Vercel'e ekle
2. Redeploy yap
3. Site'yi test et
4. Bu dosyayı sil (güvenlik için)

**Başarılar!** 🚀
