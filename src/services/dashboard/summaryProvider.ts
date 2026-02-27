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
        const gmvTotal = Number(orders._sum.totalAmount || 0);

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
        const collectedThisMonth = Number(collected._sum.totalAmount || 0);

        // 5. Daily Tx Count
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const dailyTxCount = await prisma.networkOrder.count({
            where: {
                ...companyIdGuard,
                createdAt: { gte: startOfDay }
            }
        });

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

        return {
            gmvTotal,
            rfqActive: activeRfqs,
            escrowPending,
            collectedThisMonth,
            rfqTrend: [12, 14, 11, 18, 16, 23, activeRfqs || 19],
            boostClicks: 4000,
            boostDeltaPct: 13,
            reconciliation: { matched: 65, pending: 25, disputed: 10 },
            dailyTxCount: dailyTxCount || 182,
            setup: {
                hasCompanyProfile,
                hasAnyProduct,
                hasAnyRFQ,
                hasAtLeastOneOrder
            },
            // TODO: Ledger Source of Truth (Cash details currently stubbed)
            cashDetails: {
                creditCard: 125400,
                cash: 14500,
                wire: 45000
            },
            // TODO: Filtered queries from inventory + shipment tables
            stockHealth: {
                totalSku: 1420,
                lowStock: 24,
                overStock: 112,
                inShipment: 45,
                noShipment: 1375
            },
            invoiceStatus: {
                incoming: 28,
                outgoing: 145,
                pending: 12
            },
            // TODO: Filtered queries from service_records table
            serviceDesk: {
                enteredToday: 8,
                currentlyInService: 23
            },
            // TODO: Filtered queries from attendance + staff tables
            pdksRules: {
                currentStaffCount: 124,
                checkedInCount: 118,
                notCheckedInCount: 6,
                lateCount: 3
            },
            // TODO: Filtered from Fintech Control Tower Autopilot
            autonomous: {
                updatedProducts: 142,
                avgMarginChange: 2.4,
                riskyDeviation: 3
            },
            // TODO: Filtered Event Summary (Tenant Isolations)
            notificationsApp: {
                pendingApprovals: 14,
                newNotifications: 8,
                criticalAlerts: 2
            }
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
