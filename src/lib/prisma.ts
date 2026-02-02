
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Prisma Decimal to Number Transformer
// Bu ayar sayesinde veritabanındaki Decimal alanları, kod içerisinde otomatik olarak Number'a dönüşür.
// Böylece frontend tarafında herhangi bir kod değişikliği yapmamıza gerek kalmaz.

const prismaClientSingleton = () => {
    return new PrismaClient().$extends({
        result: {
            product: {
                price: {
                    needs: { price: true },
                    compute(product) {
                        return Number(product.price);
                    },
                },
                buyPrice: {
                    needs: { buyPrice: true },
                    compute(product) {
                        return Number(product.buyPrice);
                    },
                },
            },
            order: {
                totalAmount: {
                    needs: { totalAmount: true },
                    compute(order) {
                        return Number(order.totalAmount);
                    },
                },
            },
            transaction: {
                amount: {
                    needs: { amount: true },
                    compute(transaction) {
                        return Number(transaction.amount);
                    },
                },
            },
            kasa: {
                balance: {
                    needs: { balance: true },
                    compute(kasa) {
                        return Number(kasa.balance);
                    },
                },
            },
            purchaseInvoice: {
                amount: {
                    needs: { amount: true },
                    compute(invoice) {
                        return Number(invoice.amount);
                    },
                },
                taxAmount: {
                    needs: { taxAmount: true },
                    compute(invoice) {
                        return Number(invoice.taxAmount);
                    },
                },
                totalAmount: {
                    needs: { totalAmount: true },
                    compute(invoice) {
                        return Number(invoice.totalAmount);
                    },
                },
            },
            salesInvoice: {
                amount: {
                    needs: { amount: true },
                    compute(invoice) {
                        return Number(invoice.amount);
                    },
                },
                taxAmount: {
                    needs: { taxAmount: true },
                    compute(invoice) {
                        return Number(invoice.taxAmount);
                    },
                },
                totalAmount: {
                    needs: { totalAmount: true },
                    compute(invoice) {
                        return Number(invoice.totalAmount);
                    },
                },
            },
            supplier: {
                balance: {
                    needs: { balance: true },
                    compute(supplier) {
                        return Number(supplier.balance);
                    },
                },
            },
            customer: {
                balance: {
                    needs: { balance: true },
                    compute(customer) {
                        return Number(customer.balance);
                    },
                },
                points: {
                    needs: { points: true },
                    compute(customer) {
                        return Number(customer.points);
                    },
                },
            },
            serviceRecord: {
                totalAmount: {
                    needs: { totalAmount: true },
                    compute(record) {
                        return Number(record.totalAmount);
                    },
                },
            },
            check: {
                amount: {
                    needs: { amount: true },
                    compute(check) {
                        return Number(check.amount);
                    },
                },
            },
            coupon: {
                minPurchaseAmount: {
                    needs: { minPurchaseAmount: true },
                    compute(coupon) {
                        return Number(coupon.minPurchaseAmount);
                    },
                },
            },
            suspendedSale: {
                total: {
                    needs: { total: true },
                    compute(sale) {
                        return Number(sale.total);
                    },
                },
            },
            paymentPlan: {
                totalAmount: {
                    needs: { totalAmount: true },
                    compute(plan) {
                        return Number(plan.totalAmount);
                    },
                },
            },
            installment: {
                amount: {
                    needs: { amount: true },
                    compute(inst) {
                        return Number(inst.amount);
                    },
                },
            },
            account: {
                balance: {
                    needs: { balance: true },
                    compute(acc) {
                        return Number(acc.balance);
                    },
                },
            },
            journal: {
                totalDebt: {
                    needs: { totalDebt: true },
                    compute(j) { return Number(j.totalDebt); },
                },
                totalCredit: {
                    needs: { totalCredit: true },
                    compute(j) { return Number(j.totalCredit); },
                },
            },
            journalItem: {
                debt: {
                    needs: { debt: true },
                    compute(i) { return Number(i.debt); },
                },
                credit: {
                    needs: { credit: true },
                    compute(i) { return Number(i.credit); },
                },
            },
        },
    });
};

type PrismaClientType = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientType | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
