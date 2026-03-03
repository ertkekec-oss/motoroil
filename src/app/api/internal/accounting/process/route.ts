import { NextResponse } from "next/server"
import { processAccountingOutbox } from "@/lib/network/accounting/worker"

export async function POST(req: Request) {
    const url = new URL(req.url)
    const reqSecret = req.headers.get("x-internal-secret") || url.searchParams.get("key")
    const authHeader = req.headers.get("authorization")

    // Default Vercel CRON check OR custom INTERNAL_CRON_SECRET
    const isVercelCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isInternalCron = process.env.INTERNAL_CRON_SECRET && reqSecret === process.env.INTERNAL_CRON_SECRET

    if (!isVercelCron && !isInternalCron) {
        return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 })
    }

    await processAccountingOutbox()
    return NextResponse.json({ ok: true })
}
