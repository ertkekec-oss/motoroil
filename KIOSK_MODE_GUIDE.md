# 🖥️ KIOSK MODU KULLANIM KILAVUZU

## Mikrofon İşaretini Gizleme

Personelin tarayıcı sekmesindeki mikrofon işaretini görmemesi için **Kiosk Modu** kullanın.

---

## 🚀 Hızlı Başlangıç

### Yöntem 1: Batch Dosyası ile (Kolay)

1. `start-kiosk.bat` dosyasına çift tıklayın
2. Uygulama tam ekranda açılacak
3. Sekme çubuğu gizli olacak
4. Mikrofon işareti görünmeyecek

**Çıkmak için:** `Alt + F4`

---

### Yöntem 2: Manuel Başlatma

**Chrome için:**
```cmd
chrome.exe --kiosk --app=http://localhost:3000
```

**Edge için:**
```cmd
msedge.exe --kiosk --app=http://localhost:3000
```

---

## ⚙️ Gelişmiş Ayarlar

### Otomatik Başlatma (Windows Başlangıcında)

1. `Win + R` tuşlarına basın
2. `shell:startup` yazın
3. Açılan klasöre `start-kiosk.bat` dosyasının kısayolunu atın
4. Bilgisayar her açıldığında otomatik başlayacak

### Tam Kilitli Mod

Daha güvenli bir kiosk için ek parametreler:

```cmd
chrome.exe --kiosk ^
  --app=http://localhost:3000 ^
  --disable-infobars ^
  --disable-session-crashed-bubble ^
  --disable-restore-session-state ^
  --no-first-run ^
  --disable-pinch ^
  --overscroll-history-navigation=0 ^
  --disable-features=TranslateUI
```

---

## 🔒 Güvenlik Önlemleri

### Personelin Çıkmasını Engellemek

**1. Klavye Kısayollarını Devre Dışı Bırak:**
- Windows Grup İlkesi ile F11, Alt+F4 devre dışı bırakılabilir

**2. Fiziksel Klavye Kilidi:**
- Kasada sadece numpad bırakın
- Fonksiyon tuşlarını kaldırın

**3. Yazılım Kilidi:**
- Windows'ta "Assigned Access" (Kiosk Mode) kullanın
- Sadece Chrome'a erişim verin

---

## 📋 Personel Eğitimi

### Personele Söylenecekler:

```
"Bu sistem müşteri hizmetleri kalite kontrolü için 
ses kaydı yapmaktadır. 

Tüm konuşmalar kalite kontrol amaçlı kaydedilir ve 
sadece yönetim tarafından dinlenebilir.

Bu yasal bir zorunluluktur ve iş sözleşmenizde belirtilmiştir."
```

### Kasaya Asılacak Levha:

```
┌─────────────────────────────────────┐
│  ⚠️ DİKKAT                          │
│                                     │
│  Bu alan ses kaydı altındadır.      │
│                                     │
│  Müşteri hizmetleri kalite kontrol │
│  amaçlı tüm konuşmalar kaydedilir.  │
│                                     │
│  Yönetim                            │
└─────────────────────────────────────┘
```

---

## 🎯 Önerilen Kurulum

### Şube Kasası İçin:

1. **Donanım:**
   - Dokunmatik ekran (sekme çubuğu olmadan)
   - USB mikrofon (kasaya yakın)
   - Klavye kilidi veya sadece numpad

2. **Yazılım:**
   - Windows Kiosk Mode
   - Chrome Kiosk Mode
   - Otomatik başlatma

3. **Eğitim:**
   - Personele "kalite kaydı" olarak açıklayın
   - İş sözleşmesine ekleyin
   - Kasaya levha asın

---

## ⚖️ Yasal Uyarı

**KVKK Uyumu İçin:**

1. ✅ Personeli bilgilendirin
2. ✅ İş sözleşmesine ekleyin
3. ✅ Yazılı onay alın
4. ✅ Kayıt süresini belirtin
5. ✅ Amaç ve kullanım şeklini açıklayın

**Gizli ses kaydı yapmayın!** Yasal sorun yaratır.

---

## 🔧 Sorun Giderme

### "Kiosk modundan çıkamıyorum"

**Çözüm:**
- `Alt + F4` tuşlarına basın
- `Ctrl + Alt + Del` ile Görev Yöneticisi açın
- Chrome/Edge işlemini sonlandırın

### "Otomatik başlatma çalışmıyor"

**Kontrol Edin:**
- Batch dosyası doğru konumda mı?
- Chrome/Edge yolu doğru mu?
- Dev server çalışıyor mu? (`npm run dev`)

### "Mikrofon işareti hala görünüyor"

**Nedeni:**
- Kiosk modu tam ekran değil
- Sekme çubuğu gizlenmemiş

**Çözüm:**
- `--kiosk` parametresini kontrol edin
- `--app=` parametresi olmalı

---

## 📞 Destek

Sorun yaşarsanız:
1. Konsolu açın (F12 - kiosk modunda çalışmaz)
2. Normal modda açın ve hataları kontrol edin
3. Batch dosyasını düzenleyin

---

**Başarılar!** 🎉
