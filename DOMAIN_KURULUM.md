# 🌎 KENDİ DOMAINİNİZİ BAĞLAMA REHBERİ

Vercel üzerindeki uygulamanızı (`motoroil.vercel.app`) kendi domaininizde (`motoroil.com` vb.) kullanmak için aşağıdaki adımları izleyin.

---

## 🚀 ADIM 1: VERCEL PANELİNDEN DOMAIN EKLEME

1. [Vercel Dashboard](https://vercel.com/dashboard) adresine gidin.
2. **motoroil** projesine tıklayın.
3. Üst menüden **Settings** sekmesine gelin.
4. Sol menüden **Domains** seçeneğine tıklayın.
5. Domain adınızı girin (örn: `sirketim.com`) ve **Add** butonuna basın.
6. Size önerilen yönlendirme seçeneğini kabul edin (Recommended).

---

## 🛠️ ADIM 2: DNS AYARLARI (DOMAIN FİRMASI)

Domaininizi nereden aldıysanız (Natro, GoDaddy, İsimtescil vb.) oranın paneline girip **DNS Yönetimi** sayfasına gitmelisiniz.

Aşağıdaki **2 kaydı** eklemeniz yeterlidir:

### 1. Ana Domain İçin (A Record)
Domainin `www` olmadan çalışması için (örn: `sirketim.com`):

| Kayıt Tipi | Host / Ad / Ön Ek | Değer / IP Adresi |
|------------|-------------------|-------------------|
| **A**      | `@` (veya boş)    | `76.76.21.21`     |

### 2. Alt Domain İçin (CNAME Record)
Domainin `www` ile çalışması için (örn: `www.sirketim.com`):

| Kayıt Tipi | Host / Ad / Ön Ek | Değer / Hedef     |
|------------|-------------------|-------------------|
| **CNAME**  | `www`             | `cname.vercel-dns.com` |

---

## ⏳ ADIM 3: DOĞRULAMA

1. DNS kayıtlarını girdikten sonra Vercel paneline geri dönün.
2. Vercel domaini kontrol edecek. Başta "Invalid Configuration" diyebilir, panik yapmayın.
3. DNS'lerin dünya geneline yayılması **15 dakika ile 24 saat** arasında sürebilir (Genelde 1 saatte biter).
4. İşlem tamamlandığında domaininizin yanında **iki tane mavi tık** ✅ göreceksiniz.

---

## 🔒 SSL SERTİFİKASI (HTTPS)

Ekstra bir şey yapmanıza gerek yok!
Vercel, domain doğrulandıktan hemen sonra **otomatik olarak** ücretsiz SSL sertifikasını oluşturur ve siteniz `https://` ile güvenli açılır.

---

## ❓ SIK SORULAN SORULAR

**S: Domainim Natro'da, yine de çalışır mı?**
C: Evet! Domaininiz nerede olursa olsun, sadece yukarıdaki DNS kayıtlarını girmeniz yeterli. Hosting'in Natro'da olmasına gerek yok, sadece domain yönetimi yeterli.

**S: Eski siteme ne olacak?**
C: Eğer o domainde eski bir site varsa, DNS'leri değiştirdiğiniz an o siteye erişim kesilir ve yeni MotorOil uygulaması açılır.

**S: Subdomain kullanabilir miyim? (örn: `erp.sirketim.com`)**
C: Evet!
1. Vercel'de domain eklerken `erp.sirketim.com` yazın.
2. Domain firmanızda sadece CNAME kaydı ekleyin:
   - Host: `erp`
   - Değer: `cname.vercel-dns.com`
