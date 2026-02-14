---
description: Onboarding, Pricing, CMS & API Context Session Fixes stabil hale getirildi (14 Şubat 2026)
---
1.  **Authentication & Session Fixes**: Resolved `SECURITY_ERROR: Tenant context missing` by updating `auth.ts`, `prisma.ts` (legacy support), and introducing `prismaBase` for auth flows.
2.  **API Context Standardization**: Updated `api-context.ts` to use `prismaBase` for user lookup (bypassing tenant guard) and handle new `session.user` structure.
3.  **Public & Pricing API Fixes**: Fixed 500/400 errors in CMS, Pricing, and Onboarding APIs by ensuring robust company resolution and tenant bypass where appropriate.
4.  **Onboarding Auto-Recovery**: Added auto-creation of Company in onboarding flow if missing, resolving 400 Bad Request errors for new tenants.
5.  **Verified**: Login, Dashboard, POS, and Pricing features are fully functional.

## Restore Steps
1.  Git checkout to this commit.
2.  Ensure `prismaBase.ts` and `api-context.ts` are using the updated logic.
3.  Run `npm install` and `prisma generate`.
4.  Deploy to Vercel.
