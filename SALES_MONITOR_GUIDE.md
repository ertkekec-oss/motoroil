# 🎤 SES TABANLI KAÇAK SATIŞ TESPİT SİSTEMİ

## 📋 Genel Bakış

Bu sistem, satış personelinin nakit satışları kaydetmeden yapması durumunu tespit etmek için **ses tanıma teknolojisi** kullanır.

### Nasıl Çalışır?

1. **Sürekli Dinleme**: Uygulama açıkken arka planda mikrofon dinlenir
2. **Şüpheli Kelime Tespiti**: "Hayırlı olsun", "Kolay gelsin" gibi satış sonrası kullanılan kelimeler tespit edilir
3. **Satış Kontrolü**: Son 5 dakikada satış kaydı var mı kontrol edilir
4. **Uyarı**: Eğer satış kaydı yoksa, yöneticiye anında bildirim gönderilir

---

## 🎯 Şüpheli Kelimeler Listesi

Sistem şu kelimeleri tespit eder:

- ✅ "Hayırlı olsun"
- ✅ "Kolay gelsin"
- ✅ "Allah kabul etsin"
- ✅ "Güle güle kullan"
- ✅ "Sağlıklı günlerde kullan"
- ✅ "Geçmiş olsun"
- ✅ "Afiyet olsun"
- ✅ "Allah razı olsun"
- ✅ "Teşekkür ederim" / "Teşekkürler"
- ✅ "Sağ ol"
- ✅ "İyi günlerde kullan"
- ✅ "Hayırlı işler"

---

## 🚀 Kullanım Talimatları

### Admin İçin:

1. **Sistemi Başlatma:**
   - Sağ alt köşede "Satış Monitörü" panelini göreceksiniz
   - "▶ Başlat" butonuna tıklayın
   - Mikrofon izni verin
   - Bildirim izni verin (opsiyonel)

2. **Durum Takibi:**
   - 🔴 Kırmızı nokta = Aktif dinleniyor
   - ⚫ Siyah nokta = Kapalı
   - Panel'de tespit edilen son kelimeler görünür

3. **Şüpheli Olaylar:**
   - Tespit edilen her şüpheli durum panelde listelenir
   - Tarih, saat, şube, personel bilgisi gösterilir
   - Tarayıcı bildirimi gelir (izin verdiyseniz)

4. **Sistemi Durdurma:**
   - "⏸ Durdur" butonuna tıklayın

### Personel İçin:

- Sol alt köşede küçük bir durum göstergesi görünür
- 🔴 = Kalite kontrolü aktif
- ⚫ = Sistem kapalı
- Personel sadece durumu görebilir, kontrol edemez

---

## ⚙️ Teknik Gereksinimler

### Tarayıcı Desteği:
- ✅ **Google Chrome** (Önerilen)
- ✅ **Microsoft Edge**
- ❌ Firefox (Web Speech API desteği sınırlı)
- ❌ Safari (Desteklenmez)

### İzinler:
- 🎤 **Mikrofon İzni** (Zorunlu)
- 🔔 **Bildirim İzni** (Opsiyonel, sadece admin için)

### Donanım:
- Mikrofon (Dahili veya harici)
- İnternet bağlantısı (Ses tanıma için)

---

## 🔒 Gizlilik ve Yasal Uyarılar

### ⚠️ ÖNEMLİ:

1. **Çalışan Bilgilendirmesi:**
   - Personele ses kaydı yapıldığını bildirmelisiniz
   - "Kalite kontrol amaçlı" olduğunu açıklayın
   - İş sözleşmesine ekleyin

2. **Veri Saklama:**
   - Ses kayıtları **saklanmaz**
   - Sadece metin olarak tespit edilen kelimeler loglanır
   - Şüpheli olaylar max 50 adet tutulur

3. **KVKK Uyumu:**
   - Çalışanlardan yazılı onay alın
   - Amaç ve kullanım şeklini açıklayın
   - Veri saklama süresini belirtin

---

## 📊 Raporlama

### Şüpheli Olay Raporu İçeriği:

```json
{
  "timestamp": "2026-01-24 15:30:45",
  "detectedPhrase": "hayırlı olsun",
  "confidence": 0.87,
  "hasSaleInLast5Min": false,
  "branch": "Kadıköy Şube",
  "staff": "Ahmet Yılmaz"
}
```

### Bildirim Kanalları:

- ✅ Tarayıcı bildirimi (Anlık)
- ✅ Uygulama içi panel (Gerçek zamanlı)
- 🔜 Telegram bildirimi (Yakında)
- 🔜 WhatsApp bildirimi (Yakında)
- 🔜 Email raporu (Günlük özet)

---

## 🐛 Sorun Giderme

### "Mikrofon erişimi reddedildi" Hatası:

**Çözüm:**
1. Tarayıcı adres çubuğundaki kilit ikonuna tıklayın
2. "Mikrofon" iznini "İzin Ver" olarak ayarlayın
3. Sayfayı yenileyin

### Ses Tanıma Çalışmıyor:

**Kontrol Edin:**
- Chrome veya Edge kullanıyor musunuz?
- Mikrofon çalışıyor mu? (Ayarlar → Ses)
- İnternet bağlantınız var mı?
- Konsolu açın (F12) ve hata mesajlarını kontrol edin

### Yanlış Tespit (False Positive):

**Neden Olur:**
- Arka plan gürültüsü
- Benzer sesli kelimeler
- Düşük mikrofon kalitesi

**Çözüm:**
- Mikrofonu kasaya yakın yerleştirin
- Gürültülü ortamdan uzak tutun
- Güven eşiğini artırın (kod içinde `confidence > 0.6`)

---

## 🎓 En İyi Uygulamalar

1. **İlk Hafta:**
   - Sadece izleme modunda çalıştırın
   - Yanlış tespitleri not edin
   - Personeli bilgilendirin

2. **Optimizasyon:**
   - Hangi kelimelerin sık tespit edildiğini görün
   - Gereksiz kelimeleri listeden çıkarın
   - Güven eşiğini ayarlayın

3. **Düzenli Kontrol:**
   - Haftada bir şüpheli olayları inceleyin
   - Kamera kayıtlarıyla çapraz kontrol yapın
   - Stok sayımı ile doğrulayın

4. **Personel İletişimi:**
   - Ceza değil, sistem odaklı yaklaşın
   - Şeffaflığı ödüllendirin
   - Eğitim verin

---

## 📞 Destek

Sorun yaşarsanız:
1. Konsolu açın (F12) ve hata mesajlarını kontrol edin
2. Tarayıcı ve mikrofon ayarlarını kontrol edin
3. Sistem yöneticisine başvurun

---

## 🔄 Güncellemeler

### v1.0 (Mevcut)
- ✅ Temel ses tanıma
- ✅ Şüpheli kelime tespiti
- ✅ Admin paneli
- ✅ Tarayıcı bildirimleri

### v1.1 (Planlanan)
- 🔜 Telegram entegrasyonu
- 🔜 WhatsApp bildirimi
- 🔜 Günlük email raporu
- 🔜 Gelişmiş istatistikler
- 🔜 Personel bazlı analiz

---

## ⚡ Hızlı Başlangıç

1. Uygulamayı açın (Chrome/Edge)
2. Sağ alt köşede "▶ Başlat" butonuna tıklayın
3. Mikrofon iznini verin
4. 🔴 Kırmızı noktayı görünce sistem aktif!
5. Test edin: "Hayırlı olsun" deyin (satış yapmadan)
6. Panel'de uyarı görmelisiniz!

**Başarılar!** 🎉
