# Refactor Plan: Context Splitting & Modularization

## Current Status
- `AppContext.tsx` is ~1600 lines long.
- It manages everything from auth logic (partially), products, customers, suppliers, financial transactions, checks, settings, and notifications.
- Performance: Any update to any state causes a re-render of almost the entire application.
- Maintenance: Extremely difficult to navigate and prone to side effects.

## Objective
Split `AppContext` into 4-5 focused contexts to improve performance, maintainability, and code clarity.

## Proposed Strategy

### 1. Create `FinancialContext.tsx`
- **State**: `kasalar`, `transactions`, `checks`, `paymentMethods`, `kasaTypes`, `salesExpenses` (POS commissions etc).
- **Actions**: `refreshKasalar`, `refreshTransactions`, `refreshChecks`, `addFinancialTransaction`, `addCheck`, `collectCheck`, `updatePaymentMethods`, `updateSalesExpenses`.

### 2. Create `InventoryContext.tsx`
- **State**: `products`, `pendingProducts`, `pendingTransfers`, `stockTransfers`, `brands`, `prodCats`.
- **Actions**: `refreshProducts`, `requestProductCreation`, `approveProduct`, `rejectProduct`, `requestTransfer`, `finalizeTransfer`, `startStockTransfer`, `approveTransfer`, `rejectTransfer`.

### 3. Create `CRMContext.tsx`
- **State**: `customers`, `suppliers`, `custClasses`, `suppClasses`, `campaigns`, `coupons`.
- **Actions**: `refreshCustomers`, `refreshSuppliers`, `refreshCampaigns`, `refreshCoupons`.

### 4. Create `SettingsContext.tsx`
- **State**: `serviceSettings`, `invoiceSettings`, `referralSettings`, `warranties`.
- **Actions**: `updateServiceSettings`, `updateInvoiceSettings`, `updateReferralSettings`, `updateWarranties`.

### 5. Transition `AppContext.tsx`
- Will remain for **Global/Shared** state:
    - `activeBranchId`, `activeBranchName`, `branches`.
    - `currentUser`.
    - `notifications` (though this could be its own `NotificationContext`).
    - `suspendedSales`.

## Execution Steps

1.  **Phase 1: Financial Context** (Current Task)
    -   Create `src/contexts/FinancialContext.tsx`.
    -   Move types and logic.
    -   Expose as a provider in `layout.tsx`.
    -   Update components (e.g., `AccountPlanContent`, `CheckModule`, `Payment`) to use `useFinancials()`.

2.  **Phase 2: CRM & Inventory Contexts**
    -   Follow similar steps for Müşteri/Tedarikçi and Ürün/Stok logic.

3.  **Phase 3: Cleanup & Optimization**
    -   Remove redundant logic from `AppContext`.
    -   Implement memoization where necessary to prevent unnecessary re-renders.

4.  **Phase 4: Error Boundaries**
    -   Add `ErrorBoundary` components around these context-heavy sections.
