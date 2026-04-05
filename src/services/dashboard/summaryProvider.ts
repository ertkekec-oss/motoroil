import { prisma } from "@/lib/prisma";

export interface DashboardSummary {
    gmvTotal: number;
    rfqActive: number;
    escrowPending: number;
    collectedThisMonth: number;
    rfqTrend: number[];
    boostClicks: number;
    boostDeltaPct: number;
    reconciliation: { matched: number; pending: number; disputed: number };
    dailyTxCount: number;
    setup: {
        hasCompanyProfile: boolean;
        hasAnyProduct: boolean;
        hasAnyRFQ: boolean;
        hasAtLeastOneOrder: boolean;
    };
    cashDetails: {
        creditCard: number;
        cash: number;
        wire: number;
    };
    stockHealth: {
        totalSku: number;
        lowStock: number;
        overStock: number;
        inShipment: number;
        noShipment: number;
    };
    invoiceStatus: {
        incoming: number;
        outgoing: number;
        pending: number;
    };
    serviceDesk: {
        enteredToday: number;
        currentlyInService: number;
    };
    pdksRules: {
        currentStaffCount: number;
        checkedInCount: number;
        notCheckedInCount: number;
        lateCount: number;
    };
    autonomous: {
        updatedProducts: number;
        avgMarginChange: number;
        riskyDeviation: number;
    };
    notificationsApp: {
        pendingApprovals: number;
        newNotifications: number;
        criticalAlerts: number;
    };
}

export function whereCompany(session: any, fieldName: string = "companyId") {
    // 2.1 API request company ID should be ignored. Only session is the source of truth.
    const companyId = session?.companyId || session?.user?.companyId || session?.settings?.companyId;
    if (!companyId) return { [fieldName]: "MISSING_COMPANY_ID_GUARD" }; // strict guard
    return { [fieldName]: companyId };
}

export interface IDashboardSummaryProvider {
    getSummary(session: any): Promise<DashboardSummary>;
}

export class PrismaSummaryProvider implements IDashboardSummaryProvider {
    async getSummary(session: any): Promise<DashboardSummary> {
        const companyIdGuard = whereCompany(session, "sellerCompanyId");
        const buyerGuard = whereCompany(session, "buyerCompanyId");
        const baseCompanyGuard = whereCompany(session, "companyId");

        // 1. GMV Total (TODO: Replace with ledger materialized view)
        const orders = await prisma.networkOrder.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...companyIdGuard,
                status: { in: ["PAID", "SHIPPED", "DELIVERED", "COMPLETED"] }
            }
        });
        const networkGmvTotal = Number(orders._sum.totalAmount || 0);

        const posOrders = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...baseCompanyGuard,
                status: { in: ["Tamamlandı", "Faturalandırıldı"] },
                marketplace: "POS"
            }
        });
        const posGmv = Number(posOrders._sum.totalAmount || 0);
        const gmvTotal = networkGmvTotal + posGmv;

        // 2. Active RFQ Count
        const activeRfqs = await prisma.rfq.count({
            where: {
                ...buyerGuard,
                status: { in: ["DRAFT", "SENT", "RESPONDED"] }
            }
        });

        // 3. Escrow Pending
        const pendingEscrow = await prisma.networkOrder.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...companyIdGuard,
                status: { in: ["PAID", "SHIPPED"] }
            }
        });
        const escrowPending = Number(pendingEscrow._sum.totalAmount || 0);

        // 4. Collected This Month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const collected = await prisma.networkOrder.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...companyIdGuard,
                status: "COMPLETED",
                updatedAt: { gte: startOfMonth }
            }
        });
        const networkCollected = Number(collected._sum.totalAmount || 0);

        const posCollectedQuery = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                ...baseCompanyGuard,
                status: { in: ["Tamamlandı", "Faturalandırıldı"] },
                marketplace: "POS",
                orderDate: { gte: startOfMonth }
            }
        });
        const posCollected = Number(posCollectedQuery._sum.totalAmount || 0);
        const collectedThisMonth = networkCollected + posCollected;

        // 5. Daily Tx Count
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const dailyTxCountNetwork = await prisma.networkOrder.count({
            where: {
                ...companyIdGuard,
                createdAt: { gte: startOfDay }
            }
        });

        const dailyTxCountPos = await prisma.order.count({
            where: {
                ...baseCompanyGuard,
                marketplace: "POS",
                orderDate: { gte: startOfDay }
            }
        });
        const dailyTxCount = dailyTxCountNetwork + dailyTxCountPos;

        // 6. Setup State
        let hasCompanyProfile = false;
        try {
            const company = await prisma.company.findUnique({
                where: { id: baseCompanyGuard.companyId },
                select: { id: true }
            });
            hasCompanyProfile = !!company;
        } catch { }

        let hasAnyProduct = false;
        try {
            const pc = await prisma.product.count({ where: baseCompanyGuard });
            hasAnyProduct = pc > 0;
        } catch { }

        let hasAnyRFQ = activeRfqs > 0;
        if (!hasAnyRFQ) {
            try {
                const rc = await prisma.rfq.count({ where: buyerGuard });
                hasAnyRFQ = rc > 0;
            } catch { }
        }

        let hasAtLeastOneOrder = gmvTotal > 0 || dailyTxCount > 0;
        if (!hasAtLeastOneOrder) {
            try {
                const oc = await prisma.networkOrder.count({ where: companyIdGuard });
                hasAtLeastOneOrder = oc > 0;
            } catch { }
        }

        // 7. Cash Details
        const kasalar = await prisma.kasa.findMany({ where: baseCompanyGuard });
        let creditCard = 0, cash = 0, wire = 0;
        for (const k of kasalar) {
            if (k.type === "Nakit") cash += Number(k.balance || 0);
            else if (k.type === "Kredi Kartı" || (k.type || "").includes("POS")) creditCard += Number(k.balance || 0);
            else if (k.type === "Banka" || k.type === "Havale") wire += Number(k.balance || 0);
        }

        // 8. Stock Health
        const totalSku = await prisma.product.count({ where: baseCompanyGuard });
        const lowStock = await prisma.product.count({ where: { ...baseCompanyGuard, stock: { lte: 5 } } });
        const overStock = await prisma.product.count({ where: { ...baseCompanyGuard, stock: { gte: 100 } } });

        // 9. Staff
        const currentStaffCount = await prisma.user.count({ where: { ...baseCompanyGuard, role: { notIn: ["B2B_CUSTOMER", "GUEST", "USER"] } } });

        return {
            gmvTotal,
            rfqActive: activeRfqs,
            escrowPending,
            collectedThisMonth,
            rfqTrend: [0, 0, 0, 0, 0, 0, activeRfqs || 0],
            boostClicks: 0,
            boostDeltaPct: 0,
            reconciliation: { matched: 0, pending: 0, disputed: 0 },
            dailyTxCount: dailyTxCount || 0,
            setup: {
                hasCompanyProfile,
                hasAnyProduct,
                hasAnyRFQ,
                hasAtLeastOneOrder
            },
            cashDetails: { creditCard, cash, wire },
            stockHealth: { totalSku, lowStock, overStock, inShipment: 0, noShipment: totalSku - lowStock - overStock },
            invoiceStatus: { incoming: 0, outgoing: 0, pending: 0 },
            serviceDesk: { enteredToday: 0, currentlyInService: 0 },
            pdksRules: { currentStaffCount, checkedInCount: 0, notCheckedInCount: 0, lateCount: 0 },
            autonomous: { updatedProducts: 0, avgMarginChange: 0, riskyDeviation: 0 },
            notificationsApp: { pendingApprovals: 0, newNotifications: 0, criticalAlerts: 0 }
        };
    }
}

export class LedgerSummaryProvider implements IDashboardSummaryProvider {
    async getSummary(session: any): Promise<DashboardSummary> {
        // Stub for Ledger view
        return {
            gmvTotal: 0,
            rfqActive: 0,
            escrowPending: 0,
            collectedThisMonth: 0,
            rfqTrend: [0, 0, 0, 0, 0, 0, 0],
            boostClicks: 0,
            boostDeltaPct: 0,
            reconciliation: { matched: 0, pending: 0, disputed: 0 },
            dailyTxCount: 0,
            setup: {
                hasCompanyProfile: true,
                hasAnyProduct: true,
                hasAnyRFQ: true,
                hasAtLeastOneOrder: true
            },
            cashDetails: { creditCard: 0, cash: 0, wire: 0 },
            stockHealth: { totalSku: 0, lowStock: 0, overStock: 0, inShipment: 0, noShipment: 0 },
            invoiceStatus: { incoming: 0, outgoing: 0, pending: 0 },
            serviceDesk: { enteredToday: 0, currentlyInService: 0 },
            pdksRules: { currentStaffCount: 0, checkedInCount: 0, notCheckedInCount: 0, lateCount: 0 },
            autonomous: { updatedProducts: 0, avgMarginChange: 0, riskyDeviation: 0 },
            notificationsApp: { pendingApprovals: 0, newNotifications: 0, criticalAlerts: 0 }
        };
    }
}

export function getDashboardSummaryProvider(): IDashboardSummaryProvider {
    return process.env.DASHBOARD_SUMMARY_SOURCE === "ledger"
        ? new LedgerSummaryProvider()
        : new PrismaSummaryProvider();
}
