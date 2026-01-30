/**
 * Custom React Query Hooks for Data Fetching
 * 
 * These hooks provide a consistent interface for data fetching with:
 * - Automatic caching
 * - Background refetching
 * - Optimistic updates
 * - Loading and error states
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, Customer, Supplier } from '@/contexts/AppContext';

// ============================================================================
// PRODUCTS
// ============================================================================

export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json() as Promise<Product[]>;
        },
    });
}

export function useProduct(id: string | number) {
    return useQuery({
        queryKey: ['products', id],
        queryFn: async () => {
            const res = await fetch(`/api/products/${id}`);
            if (!res.ok) throw new Error('Failed to fetch product');
            return res.json() as Promise<Product>;
        },
        enabled: !!id, // Only run if id exists
    });
}

export function useAddProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: Omit<Product, 'id'>) => {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (!res.ok) throw new Error('Failed to add product');
            return res.json();
        },
        onSuccess: () => {
            // Invalidate and refetch products list
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...product }: Partial<Product> & { id: string | number }) => {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (!res.ok) throw new Error('Failed to update product');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
        },
    });
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export function useCustomers() {
    return useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await fetch('/api/customers');
            if (!res.ok) throw new Error('Failed to fetch customers');
            return res.json() as Promise<Customer[]>;
        },
    });
}

export function useCustomer(id: string | number) {
    return useQuery({
        queryKey: ['customers', id],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}`);
            if (!res.ok) throw new Error('Failed to fetch customer');
            return res.json() as Promise<Customer>;
        },
        enabled: !!id,
    });
}

export function useAddCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (customer: Omit<Customer, 'id'>) => {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customer),
            });
            if (!res.ok) throw new Error('Failed to add customer');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export function useSuppliers() {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const res = await fetch('/api/suppliers');
            if (!res.ok) throw new Error('Failed to fetch suppliers');
            return res.json() as Promise<Supplier[]>;
        },
    });
}

export function useSupplier(id: string | number) {
    return useQuery({
        queryKey: ['suppliers', id],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${id}`);
            if (!res.ok) throw new Error('Failed to fetch supplier');
            return res.json() as Promise<Supplier>;
        },
        enabled: !!id,
    });
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export function useTransactions(filters?: { startDate?: string; endDate?: string; type?: string }) {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => {
            const params = new URLSearchParams(filters as any);
            const res = await fetch(`/api/transactions?${params}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
        },
    });
}

export function useAddTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transaction: any) => {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction),
            });
            if (!res.ok) throw new Error('Failed to add transaction');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['kasalar'] });
        },
    });
}

// ============================================================================
// KASALAR (Cash Registers / Banks)
// ============================================================================

export function useKasalar() {
    return useQuery({
        queryKey: ['kasalar'],
        queryFn: async () => {
            const res = await fetch('/api/kasalar');
            if (!res.ok) throw new Error('Failed to fetch kasalar');
            return res.json();
        },
    });
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// In a component:

import { useProducts, useAddProduct } from '@/hooks/useData';

function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const addProduct = useAddProduct();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleAdd = async () => {
    await addProduct.mutateAsync({
      name: 'New Product',
      price: 100,
      // ... other fields
    });
  };

  return (
    <div>
      {products?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      <button onClick={handleAdd}>Add Product</button>
    </div>
  );
}

// With optimistic updates:

export function useUpdateProductOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string | number }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(['products']);

      // Optimistically update
      queryClient.setQueryData(['products'], (old: Product[] | undefined) => {
        if (!old) return old;
        return old.map(p => p.id === newProduct.id ? { ...p, ...newProduct } : p);
      });

      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      // Rollback on error
      queryClient.setQueryData(['products'], context?.previousProducts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
*/
