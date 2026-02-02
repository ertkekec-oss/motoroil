# 📘 Periodya Muhasebe Sistemi - Kullanım Kılavuzu

## 1. Sistemin Çalışma Mantığı
Bu sistem, işletmenizde yaptığınız günlük ticari işlemleri (Satış, Tahsilat, Ödeme vb.) arka planda otomatik olarak **Resmi Muhasebe Fişlerine (Yevmiye Fişi)** dönüştürür.
Amacı, muhasebe bilgisine ihtiyaç duymadan **Resmi Standartlarda (Tek Düzen Hesap Planı)** kayıt tutmanızı sağlamaktır.

---

## 2. Günlük Operasyonlar (Otomatik Süreçler)

Aşağıdaki işlemleri yaptığınızda sistem sizin yerinize muhasebe fişini keser:

### A. Satış İşlemi
*   **Siz:** Hızlı Satış ekranından veya Servis'ten bir satış yaparsınız.
*   **Sistem:** 
    *   `100 KASA` (veya 108 Kredi Kartı) hesabına para girişi (Borç) yazar.
    *   `600 YURT İÇİ SATIŞLAR` hesabına gelir (Alacak) yazar.
    *   Varsa `391 HESAPLANAN KDV` hesabına vergi kaydeder.

### B. Tahsilat (Para Girişi)
*   **Siz:** Bir müşterinin bakiyesinden veya Finans sayfasından "Tahsilat Ekle" dersiniz.
*   **Sistem:**
    *   `100 KASA` hesabına para girişi (Borç) yazar.
    *   `120 ALICILAR` (ilgili müşterinin hesabı) hesabından düşüş (Alacak) yapar.

### C. Ödeme (Para Çıkışı)
*   **Siz:** Toptancıya ödeme yaparsınız veya "Gider Ekle" dersiniz.
*   **Sistem:**
    *   `320 SATICILAR` veya `770 GENEL GİDERLER` hesabına borç yazar.
    *   `100 KASA` hesabından para çıkışı (Alacak) yapar.

---

## 3. Raporlama ve Kontrol Ekranları

Muhasebe menüsü altında iki yeni sekme bulunmaktadır:

### ① Hesap Planı
Burası muhasebe defterinizin fihristidir.
*   **Görüntüleme:** Ana hesaplar (100, 120, 320) ve alt hesaplarını hiyerarşik olarak görürsünüz.
*   **Hesap Ekstresi (Muavin):** Herhangi bir hesabın satırındaki **📜 (Sarı Liste)** ikonuna tıklarsanız, o hesabın giren-çıkan tüm hareketlerini tarih sırasıyla görebilirsiniz.
*   **Yeni Hesap:** Genelde otomatik açılır ama isterseniz "+" butonuyla özel hesap açabilirsiniz.

### ② Genel Mizan
Burası işletmenizin sağlık raporudur.
*   **Kullanım:** Ay sonlarında veya gün sonunda "Neyimiz var, neyimiz yok?" diye bakacağınız tablodur.
*   **Sütunlar:**
    *   **Toplam Borç:** O hesaba giren toplam para/değer.
    *   **Toplam Alacak:** O hesaptan çıkan toplam para/değer.
    *   **Bakiye:** Şu an eldeki net durum.
*   **Denge Kontrolü:** Sayfanın en altında **"Mizan Dengeli"** yazısını görmelisiniz. Bu, "Verdiğimiz 1 kuruş ile Aldığımız 1 kuruş birbirini tutuyor" demektir.

---

## 4. Sıkça Sorulan Sorular

**Soru:** Yeni bir müşteri eklediğimde muhasebe hesabı açmam gerekir mi?
**Cevap:** Hayır. Siz Cari Kart oluşturduğunuzda, sistem otomatik olarak ona uygun bir muhasebe hesabı (Örn: `120.01.005`) tanımlar.

**Soru:** Bir işlemi silersem muhasebe fişi de silinir mi?
**Cevap:** Evet. Finansal Hareketler sayfasından bir tahsilatı silerseniz, sistem ilgili muhasebe fişini de iptal eder veya ters kayıt atar.

**Soru:** Manuel fiş kesebilir miyim?
**Cevap:** Şu an sistem tam otomatiktir. Manuel Yevmiye Fişi (Mahsup) özelliği gerekirse eklenebilir ancak günlük kullanımda ihtiyaç duymazsınız.
