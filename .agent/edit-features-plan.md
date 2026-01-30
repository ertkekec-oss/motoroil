// Bu dosya tedarikçi ve müşteri düzenleme özelliklerini eklemek için bir plan içerir

## Tedarikçi Düzenleme & Silme Özellikleri

### 1. Tedarikçi Sayfası (suppliers/page.tsx)
- State ekle: `showEditModal`, `editSupplier`
- Handler ekle: `handleEditSupplier`, `handleDeleteSupplier`
- Grid ve List view'daki kartlara "DÜZENLE" ve "SİL" butonları ekle
- Edit modal ekle (Add modal'ın benzeri)

### 2. Müşteri Sayfası (customers/page.tsx)
- State ekle: `showEditModal`, `editCustomer`
- Handler ekle: `handleEditCustomer`
- Müşteri kartlarına "DÜZENLE" butonu ekle
- Edit modal ekle

### 3. API Routes
- `/api/suppliers` - PUT endpoint zaten var mı kontrol et
- `/api/suppliers` - DELETE endpoint ekle
- `/api/customers` - PUT endpoint zaten var mı kontrol et

## İlerleme
- [x] Personel Düzenleme Eklendi
- [ ] Tedarikçi Düzenleme
- [ ] Tedarikçi Silme
- [ ] Müşteri Düzenleme
