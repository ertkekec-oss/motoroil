# Altyapı ve Sunucu Gereksinimleri

Bu döküman, uygulamanın sağlıklı çalışması için gerekli olan sunucu ve ağ konfigürasyonlarını içerir.

## 1. Sabit IP (Static IP) Gereksinimi

Uygulamanın dış servislerle güvenli bir şekilde entegre olabilmesi için sunucunun **Sabit IP** üzerinden çıkış yapması gerekmektedir.

### Kullanım Alanları:

1.  **Banka Entegrasyonları (Açık Bankacılık):**
    *   Bankalar, güvenlik protokolleri gereği sadece beyaz listeye (whitelist) alınmış IP adreslerinden gelen API isteklerini kabul etmektedir.
    *   Sabit IP olmadan API bağlantısı kurulamaz veya bağlantı sık sık kesilir.

2.  **Trendyol Pazaryeri Entegrasyonu:**
    *   Trendyol'un `/common-label` (kargo etiketi) endpoint'i, Cloudflare WAF (Web Application Firewall) tarafından korunmaktadır.
    *   Vercel veya benzeri bulut sağlayıcıların değişken IP havuzları genellikle "şüpheli datacenter IP" olarak işaretlendiği için 403 Forbidden hatasına neden olmaktadır.
    *   Kargo etiketlerinin sorunsuz üretilebilmesi için kurumsal repütasyona sahip bir sabit IP üzerinden istek atılması şarttır.

## 2. Mevcut Durum Notları
*   **Tarih:** 16 Şubat 2026
*   **Sorun:** Vercel IP'leri Trendyol Cloudflare tarafından bloklanıyor (Ray ID örnekleri mevcuttur).
*   **Çözüm:** Sabit IP tanımlanması ve ilgili servis sağlayıcılara (Banka/Trendyol) bu IP'nin bildirilmesi.
