# Periodya Security Architecture: Multi-Tenant Isolation

This document outlines how Periodya ensures strict data isolation between tenants (customers).

## 1. Implicit Tenant Filtering (The Gold Standard)

Periodya uses a **Prisma Query Extension** (`src/lib/prisma.ts`) to automatically enforce isolation at the Data Access Layer (DAL). This means developer error (forgetting a `where` clause) cannot lead to a data leak.

### How it Works
- **Read Operations:** Every query (`findMany`, `findFirst`, etc.) on operational models (Products, Customers, Invoices) is automatically wrapped with a filter: 
  `where: { company: { tenantId: session.tenantId } }`.
- **Write Operations:** `update` and `delete` operations are restricted to records belonging to the current tenant.
- **Create Assertions:** Creation of data without a valid `companyId` belonging to the tenant is blocked.

## 2. Session Context

- **JWT-Based Identity:** Upon login, the user's `tenantId` is embedded into the JWT payload (`src/lib/auth.ts`). 
- **Request Context:** The `tenantId` is retrieved once per request and stored in `AsyncLocalStorage` or passed through the Prisma extension to ensure consistent enforcement.

## 3. Administrative Bypass

Limited bypasses exist for system maintenance:
- **SUPER_ADMIN:** High-level platform administrators can access all data.
- **PLATFORM_ADMIN (Staff):** Internal staff members are granted platform-level access.
- **Audit Logging:** Every time a bypass occurs, it is logged with the prefix `[SECURITY]`, including the user's identity and the operation performed.

## 4. Cron & Automated Tasks

Automated tasks (like E-commerce synchronization) authenticate using a secure `x-cron-secret` header. 
- When a valid secret is provided, the task is granted a `PLATFORM_ADMIN` context.
- This allows cross-tenant synchronization while keeping the APIs secure from public access.

## 5. Database Enforcement

- **Mandatory Fields:** Core relations (`tenantId` in `User`, `companyId` in `Product`, etc.) are defined as non-nullable in the Prisma schema.
- **Cascading Deletes:** When a tenant is deleted, all associated companies, users, and operational data are automatically removed via database-level cascade.

---
*For questions regarding the security architecture, contact the development lead.*
