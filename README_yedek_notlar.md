# Periodya Tedarikçi Borç İşlemleri Düzeltme Notları (28 Mart 2026)

Bu belge, tedarikçilere yapılan ödemelerin sistemde borcu yanlışlıkla arttırmasına yol açan ters mantık hatasının tespiti ve onarımı sırasındaki tüm adımları kayıt altına almaktadır.

## 📌 Problem Özeti
Sistem, "Eksi (-)" bakiyeyi "Bizim Tedarikçiye Olan Borcumuz" olarak kaydediyordu (Örn: `-10.000 ₺`). Ancak bir fatura ödemesi (Payment) veya tedarikçiye çek verilmesi (Out Check) durumunda, girilen miktar bu eksi bakiyeden *çıkarılarak* (decrement) hesaplanmaktaydı. `(-10.000) - (4.000) = (-14.000)`. Bu yüzden, ödeme yapılmasına rağmen arayüzde "14.000 ₺ Borçluyuz" olarak görülüyordu.

---

## 🛠️ Yapılan Teknik İşlemler (API Düzeltmeleri)

### 1. Finansal İşlemler (Transactions) Routelarının Düzeltilmesi
**Dosya:** `src/app/api/financials/transactions/route.ts`
*   **Hata:** `Payment` türü (tedarikçiye nakit ödeme vb.) işlemlerde `decrement` kullanılıyordu.
*   **Düzeltme:** Bakiyeyi sıfıra yaklaştırmak ve borcu kapatmak için `decrement` komutu `increment` ile değiştirildi.
*   **İptal İşlemi (DELETE):** Önceden yapılmış hatalı veya yanlış girilmiş ödemeler silinmek istendiğinde eski borcun yerine gelmesi gerekir. Bu senaryodaki `increment` mantığı da düzeltilerek `decrement` olarak değiştirildi. Böylece bir ödeme silindiğinde bakiye doğru şekilde eski eksisine (örneğin -10.000'e) dönecektir.

### 2. Çek / Senet İşlemlerinin (Checks) Düzeltilmesi
**Dosya:** `src/app/api/financials/checks/route.ts`
*   **Hata:** Çek kaydedilirken (Firmamızdan tedarikçiye çek çıkışı - `Out`), bakiye `decrement` yapılıyordu.
*   **Düzeltme:** Söz konusu işlem tedarikçiye yapılan bir ödeme vaadi / transferi olduğu için `increment` olarak düzeltilip borcun kapanması (veya azalması) sağlandı.

**Dosya:** `src/app/api/financials/checks/[id]/route.ts`
*   **Hata:** İşlem halindeki veya henüz portföyden devredilmiş bir çek iptal edildiğinde borcun azalması gerekiyordu. Fakat iptal durumunda `increment` verilmişti. 
*   **Düzeltme:** Tedarikçiye verilmiş bir çekin iptali durumunda bakiyeyi eski haline (daha fazla borca) taşımak için iptal işlemine `decrement` yazıldı.

### 3. Diğer Entegrasyon Kontrolleri
Aşağıdaki modüller kod seviyesinde incelendi ve bu modüllerdeki mantığın yeni güncellenen yapı ile (%100) uyuştuğu doğrulandı, ek bir değişikliğe gerek kalmadı:
*   **Vadeli Ödeme Planları (Payment Plans):** `src/app/api/financials/payment-plans/route.ts` dosyası kontrol edildi. Yeni borç (`Purchase`) yaratıldığında `decrement`, ödeme veya çek verildiğinde `increment` yapıldığı teyit edildi. İptal (`DELETE`) durumlarındaki ters işlemler (revert) doğru olarak kodlanmıştır.
*   **Ürün Alma (Purchasing Invoice):** `src/app/api/purchasing/[id]/approve/route.ts` ve `api/purchasing/create/route.ts` kodlarında alış faturası kaynaklı yeni borcun oluşması sırasında `decrement` uygulandığı ve bunun sistemin "Eksi bakiye borçtur" felsefesiyle uyuştuğu doğrulandı.
*   **Tedarikçi Sabit İşlemleri:** `api/suppliers/route.ts` ve diğer dosyalarda bakiye formülüne zıtlık bulunamadı. Müşteriler (`Customer`) için artı (+) bakiyenin "Bize Olan Borç" olduğu, tedarikçilerde ise eksi (-) bakiyenin "Bizim Olan Borç" olduğu teyitleşerek sorun nihayete erdirildi.

---

## 🔒 Yedekleme
Yedekleme komutuyla sistemin güncel, Node_modules ve cache dosyalarından arındırılmış temiz bir .zip arşivi doğrudan masaüstüne kopyalanmıştır. Kayıt tutarlılığını sağlamak için sistem Git altyapısına ("Fix supplier balance calculation logic across APIs" mesajı ile) commitlenmiştir.

*Tüm borç-alacak tabloları, kasalar arası hesap kapatımları ve iptal rotaları an itibariyle sorunsuz stabiliteye getirilmiştir. Hazırlayan: AI Asistanınız Antigravity*
