import { PrismaClient } from '@prisma/client';
import { getSession } from './auth';

// List of models that require strict Tenant isolation
const operationalModels = [
    'product', 'customer', 'supplier', 'transaction', 'kasa', 'check', 'order',
    'salesinvoice', 'purchaseinvoice', 'servicerecord', 'quote', 'paymentplan',
    'stockmovement', 'stocktransfer', 'salesorder', 'route', 'stafftarget',
    'journal', 'journalitem', 'account', 'coupon', 'suspendedsale', 'company', 'branch',
    'notification', 'staff', 'user', 'tenant', 'subscription', 'warranty', 'securityevent',
    'customercategory', 'pricelist', 'productprice',
    'ticket', 'ticketmessage', 'ticketattachment', 'helpcategory', 'helptopic',
    'appsettings', 'campaign', 'expense', 'marketplaceconfig', 'marketplacesettlement',
    'marketplaceorderfinance', 'marketplaceproductmap', 'marketplaceproductpnl',
    'marketplacetransactionledger', 'smartpricingrule', 'pricingautopilotconfig',
    'bankconnection', 'banktransaction', 'bankstatement', 'cashflowforecast',
    'inventorylayer', 'matchingrule', 'externalrequest', 'fintechaudit', 'stock'
];

const prismaClientSingleton = () => {
    console.log('[Prisma] Initializing PrismaClientSingleton v2 (Robust Isolation)');
    return new PrismaClient().$extends({
        result: {
            // ... (keep numerical transformers for decimals if needed, but let's focus on isolation first)
            product: {
                price: { needs: { price: true }, compute(product: any) { return Number(product.price); } },
                buyPrice: { needs: { buyPrice: true }, compute(product: any) { return Number(product.buyPrice); } },
            },
            order: {
                totalAmount: { needs: { totalAmount: true }, compute(order: any) { return Number(order.totalAmount); } },
            },
            transaction: {
                amount: { needs: { amount: true }, compute(transaction: any) { return Number(transaction.amount); } },
            },
            kasa: {
                balance: { needs: { balance: true }, compute(kasa: any) { return Number(kasa.balance); } },
            },
            purchaseInvoice: {
                amount: { needs: { amount: true }, compute(invoice: any) { return Number(invoice.amount); } },
                taxAmount: { needs: { taxAmount: true }, compute(invoice: any) { return Number(invoice.taxAmount); } },
                totalAmount: { needs: { totalAmount: true }, compute(invoice: any) { return Number(invoice.totalAmount); } },
            },
            salesInvoice: {
                amount: { needs: { amount: true }, compute(invoice: any) { return Number(invoice.amount); } },
                taxAmount: { needs: { taxAmount: true }, compute(invoice: any) { return Number(invoice.taxAmount); } },
                totalAmount: { needs: { totalAmount: true }, compute(invoice: any) { return Number(invoice.totalAmount); } },
            },
            supplier: {
                balance: { needs: { balance: true }, compute(supplier: any) { return Number(supplier.balance); } },
            },
            customer: {
                balance: { needs: { balance: true }, compute(customer: any) { return Number(customer.balance); } },
                points: { needs: { points: true }, compute(customer: any) { return Number(customer.points); } },
            },
            serviceRecord: {
                totalAmount: { needs: { totalAmount: true }, compute(record: any) { return Number(record.totalAmount); } },
            },
            check: {
                amount: { needs: { amount: true }, compute(check: any) { return Number(check.amount); } },
            },
            coupon: {
                minPurchaseAmount: { needs: { minPurchaseAmount: true }, compute(coupon: any) { return Number(coupon.minPurchaseAmount); } },
            },
            suspendedSale: {
                total: { needs: { total: true }, compute(sale: any) { return Number(sale.total); } },
            },
            paymentPlan: {
                totalAmount: { needs: { totalAmount: true }, compute(plan: any) { return Number(plan.totalAmount); } },
            },
            installment: {
                amount: { needs: { amount: true }, compute(inst: any) { return Number(inst.amount); } },
            },
            account: {
                balance: { needs: { balance: true }, compute(acc: any) { return Number(acc.balance); } },
            },
            journal: {
                totalDebt: { needs: { totalDebt: true }, compute(j: any) { return Number(j.totalDebt); } },
                totalCredit: { needs: { totalCredit: true }, compute(j: any) { return Number(j.totalCredit); } },
            },
            journalItem: {
                debt: { needs: { debt: true }, compute(i: any) { return Number(i.debt); } },
                credit: { needs: { credit: true }, compute(i: any) { return Number(i.credit); } },
            },
            staff: {
                salary: { needs: { salary: true }, compute(s: any) { return Number(s.salary); } },
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
                    const user = session?.user || session;

                    if (user) {
                        const role = (user.role || '').toUpperCase();
                        const tenantId = user.tenantId;
                        const impersonateId = user.impersonateTenantId;
                        const isPlatformAdmin = tenantId === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN';

                        // 1. Platform Admin Bypass (Global view)
                        if (isPlatformAdmin && (!impersonateId || (args as any).adminBypass)) {
                            const newArgs = { ...(args as any) };
                            if (newArgs.adminBypass) delete newArgs.adminBypass;
                            return query(newArgs);
                        }

                        const effectiveTenantId = impersonateId || tenantId;
                        if (!effectiveTenantId) {
                            // Public-safe models within operational list
                            if (['user', 'tenant', 'company', 'plan', 'subscription', 'loginattempt', 'helpcategory', 'helptopic'].includes(modelName)) {
                                return query(args);
                            }
                            throw new Error("SECURITY_ERROR: Tenant context missing in session.");
                        }

                        const newArgs = { ...(args as any) };

                        // Create operations do NOT take a where clause. 
                        const isNoWhereOp = ['create', 'createMany'].includes(operation);
                        const isStrictMutation = ['update', 'delete', 'upsert'].includes(operation);
                        const isUniqueRead = operation === 'findUnique';

                        if (!isNoWhereOp) {
                            if (!newArgs.where) newArgs.where = {};

                            const applyFilter = (target: any) => {
                                if (modelName === 'company') {
                                    target.tenantId = effectiveTenantId;
                                } else if (modelName === 'user' || modelName === 'staff' || modelName === 'subscription') {
                                    target.tenantId = effectiveTenantId;
                                } else if (modelName === 'tenant') {
                                    target.id = effectiveTenantId;
                                } else if (modelName === 'notification') {
                                    target.user = { tenantId: effectiveTenantId };
                                } else if (modelName === 'helptopic') {
                                    target.OR = [{ tenantId: effectiveTenantId }, { tenantId: null }];
                                } else if (modelName === 'ticket') {
                                    target.tenantId = effectiveTenantId;
                                } else if (modelName === 'ticketmessage' || modelName === 'ticketattachment') {
                                    target.ticket = { tenantId: effectiveTenantId };
                                } else if (modelName === 'journalitem') {
                                    target.journal = { company: { tenantId: effectiveTenantId } };
                                } else if (modelName === 'warranty') {
                                    target.customer = { company: { tenantId: effectiveTenantId } };
                                } else if (modelName === 'stock') {
                                    target.product = { company: { tenantId: effectiveTenantId } };
                                } else if ([
                                    'product', 'customer', 'supplier', 'transaction', 'kasa', 'check', 'order', 'salesinvoice', 'purchaseinvoice',
                                    'servicerecord', 'quote', 'paymentplan', 'stockmovement', 'stocktransfer', 'salesorder', 'route', 'stafftarget',
                                    'journal', 'account', 'coupon', 'suspendedsale', 'branch', 'securityevent',
                                    'appsettings', 'campaign', 'expense', 'marketplaceconfig', 'marketplacesettlement',
                                    'marketplaceorderfinance', 'marketplaceproductmap', 'marketplaceproductpnl',
                                    'marketplacetransactionledger', 'smartpricingrule', 'pricingautopilotconfig',
                                    'bankconnection', 'banktransaction', 'bankstatement', 'cashflowforecast',
                                    'inventorylayer', 'matchingrule', 'externalrequest', 'fintechaudit'
                                ].includes(modelName)) {
                                    target.company = {
                                        ...(target.company || {}),
                                        tenantId: effectiveTenantId
                                    };
                                }
                            };

                            // Security Rule: Rewrite findUnique to findFirst to allow relation filters (tenant isolation)
                            if (isUniqueRead || isStrictMutation) {
                                if (operation === 'findUnique') {
                                    applyFilter(newArgs.where);
                                    return (prisma as any)[model].findFirst(newArgs);
                                }
                                applyFilter(newArgs.where);
                            } else {
                                applyFilter(newArgs.where);
                            }
                        }

                        // Mutation Protection for creation
                        if (['create', 'createMany'].includes(operation)) {
                            const bypass = ['company', 'user', 'tenant', 'subscription', 'ticket', 'ticketmessage', 'ticketattachment', 'helpcategory', 'helptopic', 'loginattempt'];
                            if (!bypass.includes(modelName)) {
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
                    const publicSafe = ['user', 'staff', 'tenant', 'plan', 'company', 'subscription', 'loginattempt', 'salesinvoice', 'appsettings', 'helpcategory', 'helptopic'];
                    if (publicSafe.includes(modelName)) {
                        return query(args);
                    }

                    throw new Error(`SECURITY_ERROR: Access to model '${model}' denied without active session.`);
                },
            },
        },
    });
};

// Use a global variable to store the singleton to avoid circularity and hot-reload issues
const globalForPrisma = globalThis as unknown as {
    prisma: any;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
