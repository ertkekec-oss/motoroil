
# Saha Satış + Rota (Route) Yönetimi Mimarisi (PWA Module)

## 1. Genel Mimari
Bu modül, Periodya Enterprise SaaS ERP sisteminin bir parçası olarak çalışacak, **Offline-First PWA** prensiplerine tam uyumlu bir Saha Satış çözümüdür. Native uygulama gerektirmez, modern tarayıcı yeteneklerini (Service Workers, IndexedDB, Geolocation API) kullanır.

**Teknoloji Yığını:**
*   **İstemci:** Next.js (React) + TanStack Query (Data Synch) + Dexie.js (IndexedDB Wrapper)
*   **Sunucu:** Next.js API Routes (Edge uyumlu)
*   **Veritabanı:** PostgreSQL (Mevcut yapı üzerine ek tablolar)
*   **Durum Yönetimi:** `useSales` Context genişletilerek `useRoute` eklenecek.

**Temel Prensipler:**
1.  **Offline-Aware:** İnternet kopsa bile sipariş süreci kesilmez.
2.  **Location-Enforced:** Ziyaret başlatma/bitirme işlemleri GPS koordinatı olmadan yapılamaz.
3.  **Tenant-Isolated:** Tüm rota ve ziyaret verileri `companyId` seviyesinde izole edilir.

---

## 2. Mobil UX Akışı (SALES_REP)
Saha personeli için basitleştirilmiş, tek elle kullanıma uygun bir arayüz sunulur.

### Navigasyon Yapısı
Ekranın altında sabit bir "Bottom Navigation Bar" bulunur:
*   🏁 **Rotalar:** Günlük atanan müşteri listesi ve harita görünümü.
*   🛒 **Sipariş:** O anki aktif ziyaret içindeki sepet ve ürün kataloğu.
*   📝 **Ziyaretler:** Tamamlanan check-in/check-out geçmişi.
*   ⚙️ **Senkronizasyon:** Bekleyen işlemler ve manuel sync butonu.

### "Bugünkü Rotalarım" Ekranı
*   **Header:** Tarih, Toplam Durak, Tamamlanan.
*   **Liste:** Kart yapısında duraklar.
    *   🔴 **Bekliyor:** Henüz gidilmedi.
    *   🟡 **Yolda:** Navigasyon başlatıldı.
    *   🟢 **Ziyarette:** Şu an check-in yapılmış.
    *   ✅ **Tamamlandı:** Check-out yapılmış.
*   **Aksiyon:** Kart üzerinde kaydırma (swipe) ile "Navigasyonu Başlat" (Google Maps/Waze intent).

### Offline Göstergeleri
*   Network durumu `navigator.onLine` ile dinlenir.
*   Offline ise Header turuncuya döner: "⚠️ Çevrimdışı Mod - Veriler cihazda saklanıyor".

---

## 3. Rota & Ziyaret Yapısı (Core Logic)

### Rota Tipleri
1.  **Statik (Admin Atamalı):** Merkezden `SALES_MANAGER` tarafından belirli günler için oluşturulan sabit rotalar.
2.  **Dinamik (Phase 2):** Satışçının kendi eklediği veya sistemin önerdiği (ziyaret sıklığına göre) rotalar.

### Ziyaret Akışı (Check-in/Out Lifecycle)
Bu akış ERP veritabanında `SalesVisit` tablosuna anlık (veya sync sonrası) işlenir.

1.  **Route Selection:** Satışçı rotayı seçer.
2.  **Approach:** Durağa yaklaşınca "Check-in" butonu aktifleşir (opsiyonel geofencing).
3.  **Check-in:**
    *   GPS konumu alınır (`latitude`, `longitude`).
    *   Timestamp alınır.
    *   API'ye `visit_start` event gönderilir (Offline ise kuyruğa).
    *   **Kural:** Aktif bir ziyaret bitmeden yenisi başlatılamaz.
4.  **Action Phase:**
    *   Sipariş oluşturma.
    *   Tahsilat alma.
    *   Not/Fotoğraf ekleme.
5.  **Check-out:**
    *   Ziyaret sonlandırılır.
    *   GPS konumu doğrulanır (müşteriden çok uzaklaşılmış mı?).
    *   Ziyaret özeti gösterilir ve kaydedilir.

---

## 4. Offline-First Mimari
Tarayıcı tabanlı `IndexedDB` kullanılarak tam bir istemci tarafı veritabanı kurulur.

**Veri Saklama Stratejisi:**
*   **Master Data (Read-Only):** `Products`, `Customers`, `Prices`, `Discounts`.
    *   *Sync:* Uygulama açılışında veya "Sync" butonuna basıldığında sunucudan çekilir (Last-Modified head check ile).
*   **Transactional Data (Write):** `OfflineOrders`, `OfflineVisits`.
    *   *Queue:* Oluşturulan her sipariş ve ziyaret kaydı önce yerel DB'ye `pending` statüsünde yazılır.
    *   *Background Sync:* Service Worker veya `NetworkStatus` değişimi (online olma) anında kuyruk sunucuya gönderilir.

**Çatışma Çözümü (Conflict Resolution):**
*   Stok kontrolü "Optimistic" yapılır. Sunucuya gönderildiğinde stok yoksa, sipariş "Onay Bekliyor" veya "Kısmi Hata" statüsüne düşer ve satışçıya bildirim gider.

---

## 5. Veri Modeli
Mevcut PostgreSQL şemasına eklenecek tablolar:

### 1. Route (Rota Başlığı)
*   `id`: PK
*   `companyId`: Tenant FK
*   `staffId`: Satış Temsilcisi FK
*   `name`: "Pazartesi - Avrupa Yakası"
*   `date`: Atandığı tarih
*   `status`: Pending, Active, Completed

### 2. RouteStop (Rota Durağı)
*   `id`: PK
*   `routeId`: FK
*   `customerId`: FK
*   `sequence`: Sıra No (1, 2, 3...)
*   `status`: Pending, Skipped, Visited
*   `plannedTime`: Tahmini saat (Opsiyonel)

### 3. SalesVisit (Ziyaret Logu)
*   `id`: PK
*   `routeStopId`: FK (Opsiyonel, plansız ziyaretler için boş olabilir)
*   `customerId`: FK
*   `staffId`: FK
*   `checkInTime`: DateTime
*   `checkOutTime`: DateTime
*   `checkInLocation`: JSON {lat, lng, acc}
*   `checkOutLocation`: JSON {lat, lng, acc}
*   `notes`: Ziyaret notları
*   `isOutOfRange`: Boolean (Konum sapması var mı?)

---

## 6. Güvenlik & Denetim

### Yetkilendirme (RBAC)
*   `SALES_REP`: Sadece kendi rotalarını ve atanan müşterilerini görür.
*   `SALES_MANAGER`: Tüm ekibin rotalarını yönetir, konumlarını görür.

### Konum Doğrulama (Anti-Fraud)
*   Check-in sırasında cihazın GPS koordinatı, Müşteri kartındaki koordinat ile karşılaştırılır.
*   Fark > 100m ise `SalesVisit` tablosuna `flag: 'LOCATION_MISMATCH'` işlenir. Sipariş engellenmez ama merkeze "Şüpheli Ziyaret" bildirimi düşer.

### Kaçak Satış Tespiti
*   Ziyaret kaydı (`SalesVisit`) olmadan oluşturulan siparişler sistem tarafından `UNLINKED_ORDER` olarak işaretlenir.

---

## 7. MVP Roadmap

### Phase 1: MVP (The Foundation)
*   [x] DB Schema Update (Route, RouteStop, SalesVisit).
*   [ ] Admin Panel: Basit Rota Oluşturma (Müşteri Seç -> Personele Ata).
*   [ ] Mobil PWA: Rota Listeleme.
*   [ ] Mobil PWA: Check-in / Check-out (GPS'li).
*   [ ] Mobil PWA: Ziyaret esnasında basit sipariş (Mevcut sepeti bağlama).

### Phase 2: Enhanced Field Ops
*   [ ] Offline Mod: IndexedDB entegrasyonu (Ürün kataloğu cache).
*   [ ] Navigasyon Entegrasyonu (Google Maps API link).
*   [ ] Ziyaret Raporları (Fotoğraf ekleme).
*   [ ] Rota İstatistikleri (Admin Dashboard).

### Phase 3: AI & Optimization
*   [ ] Rota Optimizasyonu: En kısa yol hesaplama (Traveling Salesman Problem).
*   [ ] Ziyaret Önerileri: "Bu müşteriye 3 haftadır gidilmedi, rotaya ekle".
*   [ ] Tahsilat Modülü: Mobil POS / IBAN paylaşımı.
