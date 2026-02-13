import { NextRequest } from 'next/server';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';
import prisma from '@/lib/prisma';
import Redis from 'ioredis';
import { logger } from '@/lib/observability';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {

    let ctx;
    try {
        ctx = await getRequestContext(req);
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // CIRCUIT BREAKER CHECK
        const breakerKey = `breaker:bank:${ctx.tenantId}`;
        const isBroken = await redis.get(breakerKey);
        if (isBroken) {
            return apiError({ message: 'Banka servisi geçici olarak devre dışı (Circuit Breaker)', status: 503, code: 'SERVICE_DEGRADED' }, ctx.requestId);
        }

        const where: any = {};
        if (ctx.tenantId !== 'PLATFORM_ADMIN') {
            if (!ctx.companyId) {
                const defaultCompany = await (prisma as any).company.findFirst({ where: { tenantId: ctx.tenantId } });
                if (!defaultCompany) return apiResponse({ transactions: [] }, { requestId: ctx.requestId });
                where.companyId = defaultCompany.id;
            } else {
                where.companyId = ctx.companyId;
            }
        } else if (ctx.companyId) {
            where.companyId = ctx.companyId;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const transactions = await (prisma as any).bankTransaction.findMany({
                where,
                include: { connection: true, matches: true },
                orderBy: { transactionDate: 'desc' },
                take: limit
            });
            clearTimeout(timeoutId);
            return apiResponse({ transactions }, { requestId: ctx.requestId });
        } catch (dbError: any) {
            clearTimeout(timeoutId);

            // TRACK FAILURES
            const failCount = await redis.incr(`fails:bank:${ctx.tenantId}`);
            await redis.expire(`fails:bank:${ctx.tenantId}`, 60);

            if (failCount >= 5) {
                await redis.set(breakerKey, 'TRUE', 'EX', 60); // Break for 60s
                logger.warn(`Circuit Breaker Tripped for Tenant ${ctx.tenantId}`, { tenantId: ctx.tenantId });
            }

            if (dbError.name === 'AbortError') {
                return apiError({ message: 'Banka verileri zaman aşımı.', status: 504, code: 'TIMEOUT' }, ctx.requestId);
            }
            throw dbError;
        }

    } catch (error: any) {
        console.error('Fetch Bank Transactions Error:', error);
        return apiError(error, ctx?.requestId);
    }
}




