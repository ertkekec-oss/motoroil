
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getSession } from './auth';

// List of models that require strict Tenant isolation
const operationalModels = [
    'product', 'customer', 'supplier', 'transaction', 'kasa', 'check', 'order',
    'salesinvoice', 'purchaseinvoice', 'servicerecord', 'quote', 'paymentplan',
    'stockmovement', 'variantattribute', 'stocktransfer', 'salesorder', 'route', 'stafftarget',
    'journal', 'journalitem', 'account', 'coupon', 'suspendedsale', 'company', 'branch',
    'notification', 'staff', 'user', 'tenant', 'subscription'
];


// Prisma Decimal to Number Transformer
const prismaClientSingleton = () => {
    return new PrismaClient().$extends({
        result: {
            product: {
                price: { needs: { price: true }, compute(product) { return Number(product.price); } },
                buyPrice: { needs: { buyPrice: true }, compute(product) { return Number(product.buyPrice); } },
            },
            order: {
                totalAmount: { needs: { totalAmount: true }, compute(order) { return Number(order.totalAmount); } },
            },
            transaction: {
                amount: { needs: { amount: true }, compute(transaction) { return Number(transaction.amount); } },
            },
            kasa: {
                balance: { needs: { balance: true }, compute(kasa) { return Number(kasa.balance); } },
            },
            purchaseInvoice: {
                amount: { needs: { amount: true }, compute(invoice) { return Number(invoice.amount); } },
                taxAmount: { needs: { taxAmount: true }, compute(invoice) { return Number(invoice.taxAmount); } },
                totalAmount: { needs: { totalAmount: true }, compute(invoice) { return Number(invoice.totalAmount); } },
            },
            salesInvoice: {
                amount: { needs: { amount: true }, compute(invoice) { return Number(invoice.amount); } },
                taxAmount: { needs: { taxAmount: true }, compute(invoice) { return Number(invoice.taxAmount); } },
                totalAmount: { needs: { totalAmount: true }, compute(invoice) { return Number(invoice.totalAmount); } },
            },
            supplier: {
                balance: { needs: { balance: true }, compute(supplier) { return Number(supplier.balance); } },
            },
            customer: {
                balance: { needs: { balance: true }, compute(customer) { return Number(customer.balance); } },
                points: { needs: { points: true }, compute(customer) { return Number(customer.points); } },
            },
            serviceRecord: {
                totalAmount: { needs: { totalAmount: true }, compute(record) { return Number(record.totalAmount); } },
            },
            check: {
                amount: { needs: { amount: true }, compute(check) { return Number(check.amount); } },
            },
            coupon: {
                minPurchaseAmount: { needs: { minPurchaseAmount: true }, compute(coupon) { return Number(coupon.minPurchaseAmount); } },
            },
            suspendedSale: {
                total: { needs: { total: true }, compute(sale) { return Number(sale.total); } },
            },
            paymentPlan: {
                totalAmount: { needs: { totalAmount: true }, compute(plan) { return Number(plan.totalAmount); } },
            },
            installment: {
                amount: { needs: { amount: true }, compute(inst) { return Number(inst.amount); } },
            },
            account: {
                balance: { needs: { balance: true }, compute(acc) { return Number(acc.balance); } },
            },
            journal: {
                totalDebt: { needs: { totalDebt: true }, compute(j) { return Number(j.totalDebt); } },
                totalCredit: { needs: { totalCredit: true }, compute(j) { return Number(j.totalCredit); } },
            },
            journalItem: {
                debt: { needs: { debt: true }, compute(i) { return Number(i.debt); } },
                credit: { needs: { credit: true }, compute(i) { return Number(i.credit); } },
            },
        },
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const modelName = model.toLowerCase();
                    if (!operationalModels.includes(modelName)) {
                        return query(args);
                    }

                    const session: any = await getSession();

                    if (session) {
                        const role = session.role?.toUpperCase() || '';
                        const isPlatformAdmin = session.tenantId === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN';

                        // --- 2. Platform Admin Bypass / Impersonation ---
                        if (isPlatformAdmin) {
                            // If NOT impersonating, allow full access (current behavior)
                            if (!session.impersonateTenantId) {
                                return query(args);
                            }
                            // If impersonating, we continue below but shift the tenantId context
                        }

                        // Determine which tenant's data we are looking at
                        const effectiveTenantId = session.impersonateTenantId || session.tenantId;

                        if (!effectiveTenantId) {
                            // BYPASS: Allow auth-related models even if tenant context is missing
                            // This prevents "Tenant context missing" errors during registration/login if a partial session exists
                            if (['user', 'tenant', 'company', 'plan', 'subscription', 'loginattempt'].includes(modelName)) {
                                return query(args);
                            }

                            throw new Error("SECURITY_ERROR: Tenant context missing in session.");
                        }

                        const a = args as any;

                        // READ FILTERING
                        if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                            if (modelName === 'company') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'user') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'tenant') {
                                // Platform Admins should always see all tenants to be able to switch between them
                                if (!isPlatformAdmin) {
                                    a.where = { ...a.where, id: effectiveTenantId };
                                }
                            }
                            else if (modelName === 'subscription') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'staff') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'notification') { a.where = { ...a.where, user: { tenantId: effectiveTenantId } }; }
                            else if (modelName === 'coupon') { a.where = { ...a.where, OR: [{ customer: { company: { tenantId: effectiveTenantId } } }, { customer: null }] }; }
                            else if (modelName === 'suspendedsale') { return query(args); }
                            else if (modelName === 'journalitem') { a.where = { ...a.where, journal: { company: { tenantId: effectiveTenantId } } }; }
                            else { a.where = { ...a.where, company: { tenantId: effectiveTenantId } }; }
                        }

                        // WRITE PROTECTION
                        if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
                            if (modelName === 'company') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'user') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'tenant') {
                                if (!isPlatformAdmin) {
                                    a.where = { ...a.where, id: effectiveTenantId };
                                }
                            }
                            else if (modelName === 'subscription') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'staff') { a.where = { ...a.where, tenantId: effectiveTenantId }; }
                            else if (modelName === 'notification') { a.where = { ...a.where, user: { tenantId: effectiveTenantId } }; }
                            else if (modelName === 'coupon') { a.where = { ...a.where, OR: [{ customer: { company: { tenantId: effectiveTenantId } } }, { customer: null }] }; }
                            else if (modelName === 'suspendedsale') { return query(args); }
                            else if (modelName === 'journalitem') { a.where = { ...a.where, journal: { company: { tenantId: effectiveTenantId } } }; }
                            else { a.where = { ...a.where, company: { tenantId: effectiveTenantId } }; }
                        }

                        // CREATE PROTECTION (Write-time Tenant Assertion)
                        if (['create', 'createMany'].includes(operation)) {
                            if (!['company', 'user', 'tenant', 'subscription'].includes(modelName)) {
                                const data = a.data;
                                if (data) {
                                    if (Array.isArray(data)) {
                                        data.forEach((item: any) => { if (!item.companyId && !isPlatformAdmin) throw new Error("SECURITY_ERROR: missing companyId"); });
                                    } else {
                                        if (!data.companyId && !data.company?.connect?.id && !isPlatformAdmin) throw new Error("SECURITY_ERROR: missing companyId");
                                    }
                                }
                            }
                        }

                        return query(args);
                    }

                    // PUBLIC ACCESS (Login/Register/Plans)
                    if (['user', 'staff', 'tenant', 'plan', 'company', 'subscription', 'loginattempt'].includes(modelName)) {
                        if (['findUnique', 'findFirst', 'findMany', 'create', 'update', 'count'].includes(operation)) {
                            return query(args);
                        }
                    }

                    throw new Error(`SECURITY_ERROR: Access to model '${model}' denied without active session.`);
                },
            },
        },
    });
};

type PrismaClientType = ReturnType<typeof prismaClientSingleton>;
const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined; };
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
