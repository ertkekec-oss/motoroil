# Quick Implementation Guide

## Immediate Next Steps (15 minutes)

### 1. Add React Query Provider to App (2 min)

Edit `src/app/layout.tsx`:

```tsx
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="tr">
      <body>
        <ReactQueryProvider>
          <AppProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </AppProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

### 2. Add Tailwind to Global CSS (1 min)

Add to the TOP of `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Rest of your existing CSS below */
```

### 3. Update Inventory Page to Use Components (5 min)

In `src/app/inventory/page.tsx`, add imports at the top:

```tsx
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { ProductTable } from '@/components/inventory/ProductTable';
```

Then replace the corresponding sections in the JSX with:

```tsx
{/* Replace stats section */}
<InventoryStats products={products} />

{/* Replace filters section */}
<InventoryFilters
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  filterCategory={filterCategory}
  setFilterCategory={setFilterCategory}
  filterBrand={filterBrand}
  setFilterBrand={setFilterBrand}
  stockSort={stockSort}
  setStockSort={setStockSort}
  specialFilter={specialFilter}
  setSpecialFilter={setSpecialFilter}
  categories={categories}
  brands={brands}
  isFilterOpen={isFilterOpen}
  setIsFilterOpen={setIsFilterOpen}
/>

{/* Replace product table */}
<ProductTable
  products={filteredProducts}
  selectedIds={selectedIds}
  setSelectedIds={setSelectedIds}
  onProductClick={setSelectedProduct}
  canEdit={canEdit}
/>
```

### 4. Test the Changes (2 min)

```bash
npm run dev
```

Visit:
- http://localhost:3000/inventory - Check components render
- http://localhost:3000/customers - Check formatCurrency
- http://localhost:3000/suppliers - Check formatCurrency

---

## Example: Creating a React Query Hook (Future)

```tsx
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
  });

  const addProduct = useMutation({
    mutationFn: async (product: NewProduct) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { products, isLoading, addProduct };
}
```

---

## Tailwind Migration Examples

### Before (Inline Styles):
```tsx
<div style={{ 
  padding: '20px', 
  background: 'var(--bg-card)', 
  borderRadius: '12px',
  display: 'flex',
  gap: '16px'
}}>
```

### After (Tailwind):
```tsx
<div className="p-5 bg-bg-card rounded-xl flex gap-4">
```

### Common Conversions:
- `padding: '20px'` → `p-5`
- `margin: '16px'` → `m-4`
- `display: 'flex'` → `flex`
- `gap: '16px'` → `gap-4`
- `borderRadius: '8px'` → `rounded-lg`
- `fontWeight: 'bold'` → `font-bold`
- `fontSize: '24px'` → `text-2xl`

---

## formatCurrency Usage Examples

### Basic Usage:
```tsx
import { formatCurrency } from '@/lib/utils';

// Simple amount
<div>{formatCurrency(1234.56)}</div>
// Output: ₺1.234,56

// With calculation
<div>{formatCurrency(product.price * quantity)}</div>

// Negative values
<div>{formatCurrency(-500)}</div>
// Output: -₺500,00
```

### In Tables:
```tsx
<td style={{ textAlign: 'right' }}>
  {formatCurrency(item.amount)}
</td>
```

### With Conditional Styling:
```tsx
<span style={{ 
  color: amount < 0 ? 'var(--danger)' : 'var(--success)' 
}}>
  {formatCurrency(Math.abs(amount))}
</span>
```

---

## Quick Reference: File Locations

### New Files Created:
- `src/providers/ReactQueryProvider.tsx`
- `src/components/inventory/InventoryStats.tsx`
- `src/components/inventory/InventoryFilters.tsx`
- `src/components/inventory/ProductTable.tsx`
- `tailwind.config.js`
- `postcss.config.js`
- `OPTIMIZATION_SUMMARY.md`
- `IMPLEMENTATION_GUIDE.md` (this file)

### Modified Files:
- `src/app/suppliers/page.tsx` - Added formatCurrency
- `src/app/customers/page.tsx` - Added formatCurrency
- `src/app/accounting/page.tsx` - Added formatCurrency import
- `package.json` - Added dependencies

### Utility Already Exists:
- `src/lib/utils.ts` - Contains formatCurrency and other helpers

---

## Troubleshooting

### If Tailwind classes don't work:
1. Make sure you added `@tailwind` directives to globals.css
2. Restart the dev server: `npm run dev`
3. Check tailwind.config.js has correct content paths

### If formatCurrency shows errors:
1. Make sure you imported it: `import { formatCurrency } from '@/lib/utils';`
2. Ensure you're passing a number: `formatCurrency(Number(value))`

### If React Query doesn't work:
1. Make sure ReactQueryProvider wraps your app in layout.tsx
2. Check that @tanstack/react-query is installed

---

**Ready to implement?** Start with steps 1-4 above! 🚀
