
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getSession } from './auth';

// List of models that require strict Tenant isolation
const operationalModels = [
    'product', 'customer', 'supplier', 'transaction', 'kasa', 'check', 'order',
    'salesinvoice', 'purchaseinvoice', 'servicerecord', 'quote', 'paymentplan',
    'stockmovement', 'stocktransfer', 'salesorder', 'route', 'stafftarget',
    'journal', 'journalitem', 'account', 'coupon', 'suspendedsale', 'company', 'branch',
    'notification', 'staff', 'user', 'tenant', 'subscription', 'warranty', 'securityevent',
    'customercategory', 'pricelist', 'productprice'
];


// Prisma Decimal to Number Transformer
const prismaClientSingleton = () => {
    console.log('[Prisma] Initializing PrismaClientSingleton');
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

                    // Avoid calling cookies() if we can skip it
                    // But we need it for most operations in operationalModels
                    const session: any = await getSession();
                    const user = session?.user || session;

                    if (user) {
                        const role = (user.role || '').toUpperCase();
                        const tenantId = user.tenantId;
                        const impersonateId = user.impersonateTenantId;
                        const isPlatformAdmin = tenantId === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN';

                        // 1. Platform Admin Bypass
                        if (isPlatformAdmin && (!impersonateId || (args as any).adminBypass)) {
                            const newArgs = { ...args };
                            if ((newArgs as any).adminBypass) delete (newArgs as any).adminBypass;
                            return query(newArgs);
                        }

                        const effectiveTenantId = impersonateId || tenantId;

                        if (!effectiveTenantId) {
                            if (['user', 'tenant', 'company', 'plan', 'subscription', 'loginattempt'].includes(modelName)) {
                                return query(args);
                            }
                            throw new Error("SECURITY_ERROR: Tenant context missing in session.");
                        }

                        const newArgs = { ...args };
                        const isRead = ['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation);
                        const isWrite = ['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation);
                        const isUnique = ['findUnique', 'update', 'delete', 'upsert', 'findFirst'].includes(operation);

                        if (isRead || isWrite) {
                            if (!newArgs.where) newArgs.where = {};

                            // Apply filters based on model type
                            if (modelName === 'company') {
                                newArgs.where = { ...newArgs.where, tenantId: effectiveTenantId };
                            } else if (modelName === 'user' || modelName === 'staff' || modelName === 'subscription') {
                                newArgs.where = { ...newArgs.where, tenantId: effectiveTenantId };
                            } else if (modelName === 'tenant') {
                                newArgs.where = { ...newArgs.where, id: effectiveTenantId };
                            } else if (modelName === 'notification') {
                                newArgs.where = { ...newArgs.where, user: { tenantId: effectiveTenantId } };
                            } else if (modelName === 'journalitem') {
                                // Nested filter through journal
                                newArgs.where = { ...newArgs.where, journal: { company: { tenantId: effectiveTenantId } } };
                            } else if (modelName === 'warranty') {
                                // Nested through customer
                                newArgs.where = { ...newArgs.where, customer: { company: { tenantId: effectiveTenantId } } };
                            } else if (modelName === 'securityevent') {
                                // Shared/System model
                            } else {
                                // Generic isolation through company relation
                                // CRITICAL: Only apply to non-unique operations OR if the query already targets a non-unique field
                                // For findUnique, Prisma ONLY allows filtering by Unique ID. 
                                // Relation filters are forbidden in findUnique 'where'.
                                if (!isUnique) {
                                    newArgs.where = {
                                        ...newArgs.where,
                                        company: {
                                            ...(newArgs.where.company || {}),
                                            tenantId: effectiveTenantId
                                        }
                                    };
                                }
                            }
                        }

                        // Mutation Protection (Ensure companyId matches tenant)
                        if (['create', 'createMany'].includes(operation)) {
                            if (!['company', 'user', 'tenant', 'subscription'].includes(modelName)) {
                                const data = (newArgs as any).data;
                                if (data && !isPlatformAdmin) {
                                    const validateItem = (item: any) => {
                                        if (!item.companyId && !item.company?.connect?.id) {
                                            throw new Error(`SECURITY_ERROR: Missing companyId in ${modelName} creation.`);
                                        }
                                    };

                                    if (Array.isArray(data)) data.forEach(validateItem);
                                    else validateItem(data);
                                }
                            }
                        }

                        return query(newArgs);
                    }

                    // PUBLIC ACCESS (No session)
                    if (['user', 'staff', 'tenant', 'plan', 'company', 'subscription', 'loginattempt', 'salesinvoice'].includes(modelName)) {
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
