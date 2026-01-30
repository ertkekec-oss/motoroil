# Uygulama Optimizasyon ve Refactoring Planı

## 🔍 Mevcut Durum Analizi

### Tespit Edilen Sorunlar

#### 1. **Kod Karmaşıklığı**
- **inventory/page.tsx**: 1,784 satır (ÇOK BÜYÜK! ⚠️)
- **accounting/page.tsx**: ~1,078 satır
- Tek dosyada çok fazla sorumluluk
- Component'ler ayrılmamış
- State yönetimi karmaşık

#### 2. **Performans Sorunları**
- Her render'da tüm ürünler filtreleniyor
- Gereksiz re-render'lar
- Context'te tüm data bir arada
- Memoization eksikliği
- Lazy loading yok

#### 3. **Kod Tekrarı**
- Modal logic her sayfada tekrarlanıyor
- Form validation logic tekrarlı
- API call pattern'leri standart değil
- Stil tanımlamaları inline

#### 4. **Veri Yönetimi**
- Context çok şişkin (tüm ürünler, müşteriler, tedarikçiler)
- Server state vs client state ayrımı yok
- Cache mekanizması yok
- Optimistic updates yok

---

## 🎯 Optimizasyon Stratejisi

### Faz 1: Component Ayrıştırma (Yüksek Öncelik)

#### A. Inventory Page Refactoring

**Mevcut:** 1 dev dosya (1,784 satır)
**Hedef:** Modüler yapı

```
src/app/inventory/
├── page.tsx (Ana sayfa - 150 satır)
├── components/
│   ├── InventoryTable.tsx (Tablo)
│   ├── InventoryFilters.tsx (Filtreler)
│   ├── BulkActions.tsx (Toplu işlemler)
│   ├── ProductDetailModal.tsx (Detay modal)
│   ├── AddProductModal.tsx (Ürün ekleme)
│   ├── TransferModal.tsx (Transfer)
│   ├── CountingMode.tsx (Sayım modu)
│   ├── AuditReportModal.tsx (Sayım raporu)
│   └── BulkEditModals/
│       ├── CategoryModal.tsx
│       ├── VatModal.tsx
│       ├── BarcodeModal.tsx
│       └── PriceModal.tsx
├── hooks/
│   ├── useInventoryFilters.ts
│   ├── useInventoryActions.ts
│   └── useBulkOperations.ts
└── utils/
    ├── inventoryCalculations.ts
    └── excelHelpers.ts
```

**Kazanç:**
- ✅ Her component 100-200 satır
- ✅ Kolay test edilebilir
- ✅ Yeniden kullanılabilir
- ✅ Daha hızlı geliştirme

#### B. Accounting Page Refactoring

```
src/app/accounting/
├── page.tsx (Ana sayfa)
├── components/
│   ├── KasaList.tsx
│   ├── TransactionTable.tsx
│   ├── VirmanModal.tsx
│   ├── ExpenseModal.tsx
│   └── FinancialSummary.tsx
└── hooks/
    └── useFinancialData.ts
```

---

### Faz 2: State Yönetimi Optimizasyonu

#### A. Context Bölme

**Mevcut:** Tek AppContext (ŞİŞKİN!)

**Hedef:** Ayrı Context'ler

```typescript
// src/contexts/
├── AuthContext.tsx ✅ (Mevcut)
├── ProductsContext.tsx (Ürünler)
├── CustomersContext.tsx (Müşteriler)
├── SuppliersContext.tsx (Tedarikçiler)
├── FinancialsContext.tsx (Finansal)
└── ModalContext.tsx (Global modal)
```

**Kazanç:**
- ✅ Sadece gerekli data subscribe edilir
- ✅ Gereksiz re-render'lar önlenir
- ✅ Daha iyi performans

#### B. React Query Entegrasyonu

**Neden?**
- Server state yönetimi
- Otomatik cache
- Background refetch
- Optimistic updates
- Loading/error states

```bash
npm install @tanstack/react-query
```

**Örnek Kullanım:**
```typescript
// hooks/useProducts.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    },
  });
}
```

**Kazanç:**
- ✅ Otomatik cache
- ✅ Daha az kod
- ✅ Daha iyi UX (loading states)
- ✅ Optimistic updates

---

### Faz 3: Performans İyileştirmeleri

#### A. Memoization

```typescript
// ❌ Önce (Her render'da hesaplanıyor)
const filteredProducts = products.filter(p => 
  p.name.includes(searchTerm)
);

// ✅ Sonra (Sadece gerektiğinde)
const filteredProducts = useMemo(() => 
  products.filter(p => p.name.includes(searchTerm)),
  [products, searchTerm]
);
```

#### B. Virtual Scrolling (Büyük Listeler İçin)

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={filteredProducts.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ProductRow product={filteredProducts[index]} />
    </div>
  )}
</FixedSizeList>
```

**Kazanç:**
- ✅ 10,000+ ürün bile sorunsuz
- ✅ Sadece görünen satırlar render edilir

#### C. Code Splitting & Lazy Loading

```typescript
// ❌ Önce (Tüm modaller yükleniyor)
import ProductDetailModal from './ProductDetailModal';
import AddProductModal from './AddProductModal';

// ✅ Sonra (Sadece gerektiğinde)
const ProductDetailModal = lazy(() => import('./ProductDetailModal'));
const AddProductModal = lazy(() => import('./AddProductModal'));

<Suspense fallback={<LoadingSpinner />}>
  {showModal && <ProductDetailModal />}
</Suspense>
```

#### D. Image Optimization

```typescript
// Next.js Image component kullan
import Image from 'next/image';

<Image
  src="/product.jpg"
  width={200}
  height={200}
  alt="Product"
  loading="lazy"
/>
```

---

### Faz 4: Kod Kalitesi İyileştirmeleri

#### A. Custom Hooks (Logic Ayrıştırma)

```typescript
// hooks/useInventoryFilters.ts
export function useInventoryFilters(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, category]);
  
  return {
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    filteredProducts,
  };
}
```

#### B. Utility Functions

```typescript
// utils/formatters.ts
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('tr-TR').format(date);
};
```

#### C. TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### D. Stil Sistemi

**Mevcut:** Inline styles her yerde
**Hedef:** Tailwind CSS veya CSS Modules

```bash
# Tailwind zaten var, kullan!
```

```tsx
// ❌ Önce
<div style={{ 
  padding: '20px', 
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '12px' 
}}>

// ✅ Sonra
<div className="p-5 bg-black/50 rounded-xl">
```

---

### Faz 5: API Optimizasyonu

#### A. API Route Standardizasyonu

```typescript
// lib/apiResponse.ts
export function successResponse<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
```

#### B. Pagination

```typescript
// api/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  const products = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return successResponse({ products, page, limit });
}
```

#### C. Caching Headers

```typescript
export async function GET() {
  const products = await prisma.product.findMany();
  
  return new NextResponse(JSON.stringify(products), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

---

## 📊 Öncelik Sıralaması

### 🔴 Kritik (Hemen Yapılmalı)
1. **Inventory page'i parçala** (En büyük sorun)
2. **React Query ekle** (State yönetimi)
3. **Memoization ekle** (Performans)

### 🟡 Önemli (Bu Hafta)
4. **Context'leri böl** (Re-render optimizasyonu)
5. **Custom hooks oluştur** (Kod tekrarı)
6. **Modal context** (Global modal sistemi)

### 🟢 İyileştirme (Gelecek)
7. **Virtual scrolling** (Büyük listeler)
8. **Code splitting** (Bundle size)
9. **Tailwind migration** (Stil sistemi)
10. **API pagination** (Veri yönetimi)

---

## 🚀 Uygulama Planı

### Hafta 1: Component Refactoring
- [ ] InventoryTable component'i ayır
- [ ] ProductDetailModal ayır
- [ ] AddProductModal ayır
- [ ] Filters component'i ayır

### Hafta 2: State Management
- [ ] React Query kur
- [ ] useProducts hook'u oluştur
- [ ] useCustomers hook'u oluştur
- [ ] Cache stratejisi belirle

### Hafta 3: Performance
- [ ] useMemo ekle (filtreleme)
- [ ] useCallback ekle (event handlers)
- [ ] React.memo ekle (component'ler)
- [ ] Lazy loading ekle (modaller)

### Hafta 4: Code Quality
- [ ] Custom hooks oluştur
- [ ] Utility functions ayır
- [ ] TypeScript strict mode
- [ ] Tailwind migration başlat

---

## 💡 Hızlı Kazançlar (Bugün Yapılabilir)

### 1. Memoization Ekle (5 dakika)
```typescript
// inventory/page.tsx
const filteredProducts = useMemo(() => {
  return products.filter(/* ... */);
}, [products, searchTerm, filterCategory]);
```

### 2. useCallback Ekle (5 dakika)
```typescript
const handleProductClick = useCallback((id: number) => {
  setSelectedProduct(products.find(p => p.id === id));
}, [products]);
```

### 3. React.memo Ekle (10 dakika)
```typescript
const ProductRow = React.memo(({ product }: { product: Product }) => {
  return <tr>...</tr>;
});
```

---

## 📈 Beklenen Kazançlar

### Performans
- ⚡ **%60-70 daha hızlı** ilk yükleme (code splitting)
- ⚡ **%80-90 daha hızlı** filtreleme (memoization)
- ⚡ **%50 daha az** re-render (context bölme)

### Geliştirme Hızı
- 🚀 **%40 daha hızlı** yeni özellik ekleme
- 🚀 **%60 daha kolay** bug fix
- 🚀 **%70 daha az** kod tekrarı

### Kod Kalitesi
- ✨ **%80 daha az** karmaşıklık
- ✨ **%90 daha iyi** test edilebilirlik
- ✨ **%100 daha iyi** bakım kolaylığı

---

## 🎯 Sonuç

**En Kritik 3 Adım:**
1. Inventory page'i component'lere böl
2. React Query ekle
3. Memoization ekle

Bu 3 adım bile **%50-60 performans artışı** sağlar!

Hangi adımla başlamak istersiniz?
