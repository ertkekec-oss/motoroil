"use server";

import { GET as getHealthNative } from "@/app/api/admin/health/route"; // reusing the router logic or a shared service
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function getSystemHealth() {
    const session = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "admin")) {
        throw new Error("Unauthorized");
    }

    const req = new Request("http://localhost/api/admin/health", {
        headers: {
            authorization: `Bearer ${process.env.ADMIN_TOKEN || process.env.CRON_SECRET}`
        }
    });

    try {
        const res = await getHealthNative(req as any);
        return await res.json();
    } catch (e: any) {
        return { ok: false, warnings: ['Action fetch failed'], components: {} };
    }
}
