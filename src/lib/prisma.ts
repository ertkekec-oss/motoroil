
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getSession } from './auth';

// List of models that require strict Tenant isolation
const operationalModels = [
    'product', 'customer', 'supplier', 'transaction', 'kasa', 'check', 'order',
    'salesInvoice', 'purchaseInvoice', 'serviceRecord', 'quote', 'paymentPlan',
    'stockMovement', 'variantAttribute',
    'journal', 'coupon', 'suspendedSale', 'company', 'branch',
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

                        // --- 2. Logging for SUPER_ADMIN / PLATFORM_ADMIN Bypass ---
                        if (role === 'SUPER_ADMIN' || session.tenantId === 'PLATFORM_ADMIN') {
                            if (operation !== 'findUnique' && operation !== 'findFirst') { // Avoid spamming common lookups
                                console.log(`[SECURITY] ${role} (${session.username}) bypassed tenant isolation for ${model}.${operation}`);
                            }
                            return query(args);
                        }

                        const tenantId = session.tenantId;
                        if (!tenantId) {
                            throw new Error("SECURITY_ERROR: Tenant context missing in session.");
                        }

                        const a = args as any;

                        // --- 1. Create-time Assertion (Write-time Tenant Assertion) ---
                        if (['create', 'createMany'].includes(operation)) {
                            // If it's not a special model like 'company' or 'user' themselves
                            if (!['company', 'user', 'tenant', 'subscription'].includes(modelName)) {
                                const data = a.data;
                                if (data) {
                                    // Multiple records (createMany)
                                    if (Array.isArray(data)) {
                                        for (const item of data) {
                                            if (!item.companyId) {
                                                throw new Error(`SECURITY_ERROR: companyId is mandatory for ${model} creation.`);
                                            }
                                        }
                                    } else {
                                        // Single record (create)
                                        if (!data.companyId && !data.company?.connect?.id) {
                                            throw new Error(`SECURITY_ERROR: companyId is mandatory for ${model} creation.`);
                                        }
                                    }
                                }
                            }
                        }

                        // READ FILTERING
                        if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                            if (modelName === 'company') { a.where = { ...a.where, tenantId }; }
                            else if (modelName === 'user') { a.where = { ...a.where, tenantId }; }
                            else if (modelName === 'tenant') { a.where = { ...a.where, id: tenantId }; }
                            else if (modelName === 'subscription') { a.where = { ...a.where, tenantId }; }
                            else if (modelName === 'staff') { return query(args); }
                            else { a.where = { ...a.where, company: { tenantId: tenantId } }; }
                        }

                        // WRITE PROTECTION
                        if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
                            if (modelName === 'company') { a.where = { ...a.where, tenantId }; }
                            else if (modelName === 'user') { a.where = { ...a.where, tenantId }; }
                            else if (modelName === 'tenant') { a.where = { ...a.where, id: tenantId }; }
                            else if (modelName === 'subscription') { a.where = { ...a.where, tenantId }; }
                            else { a.where = { ...a.where, company: { tenantId: tenantId } }; }
                        }

                        return query(args);
                    }

                    // PUBLIC ACCESS (Login/Register/Plans)
                    if (['user', 'staff', 'tenant', 'plan', 'company', 'subscription'].includes(modelName)) {
                        if (['findUnique', 'findFirst', 'findMany', 'create'].includes(operation)) {
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
