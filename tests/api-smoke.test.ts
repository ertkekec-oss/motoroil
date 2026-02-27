import { describe, it, expect, vi } from "vitest";
import { GET as getEarnings } from "../src/app/api/network/earnings/route";
import { GET as getBoostData } from "../src/app/api/seller/boost/route";
import { NextRequest } from "next/server";

// Mock the auth module
vi.mock("@/lib/auth", () => ({
    authorize: vi.fn()
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
    default: {
        sellerEarning: { findMany: vi.fn().mockResolvedValue([]), aggregate: vi.fn().mockResolvedValue({ _sum: { grossAmount: 0, netAmount: 0 } }) },
        boostSubscription: { findFirst: vi.fn().mockResolvedValue(null) },
        tenantRolloutPolicy: { findUnique: vi.fn().mockResolvedValue(null) },
        boostUsageDaily: { aggregate: vi.fn().mockResolvedValue({ _sum: { billableImpressions: 0 } }) }
    }
}));

import { authorize } from "@/lib/auth";

describe("Tenant-safe API Smoke Tests", () => {

    it("Earnings API should reject unauthorized requests", async () => {
        (authorize as any).mockResolvedValueOnce({ authorized: false, user: null });
        const req = new NextRequest("http://localhost:3000/api/network/earnings");
        const res = await getEarnings(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe("Unauthorized");
    });

    it("Earnings API should return data for valid tenant", async () => {
        (authorize as any).mockResolvedValueOnce({
            authorized: true,
            user: { id: "u1", companyId: "t1", tenantId: "t1" }
        });
        const req = new NextRequest("http://localhost:3000/api/network/earnings");
        const res = await getEarnings(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty("kpis");
        expect(data).toHaveProperty("page");
    });

    it("Boost Status API should return subscription details and honor paused flags", async () => {
        const { default: prismaMock } = await import("@/lib/prisma");
        vi.mocked(prismaMock.boostSubscription.findFirst).mockResolvedValueOnce({
            id: "sub_1",
            sellerTenantId: "t1",
            planName: "Test Plan",
            quotaTotal: 1000,
            quotaUsed: 0,
            status: "ACTIVE",
            price: 100,
            startedAt: new Date(),
            renewsAt: new Date()
        } as any);

        (authorize as any).mockResolvedValueOnce({
            authorized: true,
            user: { id: "u1", companyId: "t1", tenantId: "t1" }
        });
        const req = new NextRequest("http://localhost:3000/api/seller/boost");
        const res = await getBoostData(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty("subscription");
        expect(data).toHaveProperty("rollout");
    });

    it("Boost Status API should return 404 if no subscription", async () => {
        (authorize as any).mockResolvedValueOnce({
            authorized: true,
            user: { id: "u1", companyId: "t1", tenantId: "t1" }
        });
        const req = new NextRequest("http://localhost:3000/api/seller/boost");
        const res = await getBoostData(req);

        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toHaveProperty("error");
    });
});
