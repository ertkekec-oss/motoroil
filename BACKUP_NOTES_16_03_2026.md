# Periodya Uygulaması - Sistem Güncelleme ve Yedekleme Notları 
**Tarih:** 16 Mart 2026

## Yapılan Geliştirmeler ve Hata Çözümleri

### 1. SMS OTP Doğrulama Düzeltmesi (NetGSM)
- **Sorun:** İmza isteği gönderilen sözleşmeleri imzalarken SMS şifresi kullanıcılara iletilemiyordu.
- **Çözüm:** `src/app/api/portal/signatures/otp/send/route.ts` dosyası düzenlendi. Gelen isteğin gövdesinden (body) telefon numarası doğru şekilde okunacak şekilde ayarlandı ve eğer o anki kiracının (tenant) kendi özel mesaj atma ayarı yoksa, sistem bir **fallback** (geri dönüş) yaparak `PLATFORM_ADMIN` tabanlı NetGSM ayarlarını kullanacak şekilde güvenli hale getirildi. 

### 2. Şube - Müşteri (Cari) İzole Gösterim Problemi
- **Sorun:** Cariler ve tedarikçiler "Düzenle" butonundan güncellenirken şube verisi arka plana iletilmiyorduve/veya kayboluyordu, bu da görünürlük hatalarına yol açıyordu.
- **Çözüm:** `customers/page.tsx` ve benzer listelerdeki form alanlarındaki `Şube` veri bağlamaları düzeltildi. Zorunlu olarak varsayılan `-- Şube Seçiniz --` seçeneği eklendi. Böylece ekran açıldığında sanki bir şube kayıtlıymış gibi yanılması durduruldu. Veri karmaşası yaşanması kesin olarak engellendi.

### 3. PDKS ve İnsan Kaynakları (HR) Paneli Senkronizasyonu
- **Sorun:** Personel ekranından (Personel Portalı) GPS / QR ile yapılan PDKS girişleri başarılı olsa dahi, portalda hala "Durum Belirsiz" yazıyordu. Aynı zamanda personel Çıkış yapamıyordu (Çıkış butonu yoktu) ve İnsan Kaynakları tarafında bu giriş-çıkışlar Puantaj'a (Attendance tablosuna) eksik işleniyordu.
- **Çözüm:**
  - `src/app/api/staff/me/pdks-status/route.ts` isimli yepyeni bir API durumu oluşturuldu. Artık Personel paneli her açıldığında arka plandaki tümaktif giriş/çıkışlarını ve o güne atanmış olan vardiyasını (Shift) kontrol ediyor. Yükleme "Belirsiz" statüsünden çıkartıldı.
  - Personel Portalında (`staff/me/page.tsx`) personel içerdeyse dinamik olarak kırmızı bir `🏁 MESAİYİ BİTİR (ÇIKIŞ YAP)` butonu eklendi.
  - `src/app/api/v1/pdks/check-out/route.ts` güncellendi, tıpkı Check-in gibi Check-out olayı gerçekleştiğinde de `Attendance` (Puantaj) tablosundaki "checkOut" (Çıkış Saati) verisi eşzamanlı olarak dolduruldu. WorkingHours (Çalışılan Süre) otomatik matematiksel olarak saate dönüştürülüp HR loglarına işlenebilir hale getirildi.
  - Artık Personel portalı ve İnsan Kaynakları PDKS görünümü saniyesi saniyesine birebir aynı veriyi gösteriyor.
