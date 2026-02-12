---
description: Feature Flag & Access Control Standardization (Fixing Financials, CRM, Service & Analytics keys)
---
# Restore Point v8 - Feature Flags Fixed

This restore point marks the comprehensive fix of feature flag inconsistencies between Frontend and Backend.

**Changes:**
1.  **Backend Migration (`api/admin/features/route.ts`)**:
    *   Added migration logic to rename legacy keys:
        *   `finance` / `accounting` -> `financials`
        *   `crm` -> `current_accounts`
        *   `reporting` -> `analytics`
        *   `service` -> `service_desk`
    *   Standardized the master feature list.

2.  **Frontend Access Control**:
    *   Updated `ClientShell.tsx`: `permMap` uses correct keys.
    *   Updated `Sidebar.tsx`: Navigation menu uses correct keys.
    *   Updated `AppContext.tsx`: `featurePathMap` uses correct keys.
    *   Updated Page-level checks in:
        *   `service/page.tsx` (`service_desk`)
        *   `reports/page.tsx` (`analytics`)
        *   `inventory/page.tsx` (`inventory`)
        *   `sales/page.tsx` (`sales`)

**Verification:**
- Admin panel > Features now correctly lists standardized features.
- Routing via `AppContext` correctly gates access based on the new keys.
- Feature names in plans match the app requirements.
