import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const limit = parseFloat(searchParams.get('limit') || '5000');

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // --- FORM BS (BİLDİRİM SATIŞ) ---
        // 120'li hesapların Borç hareketleri (Satışlar)
        const bsRaw = await prisma.journalItem.groupBy({
            by: ['accountId'],
            where: {
                account: { code: { startsWith: '120' } },
                journal: { date: { gte: startDate, lte: endDate } },
                debt: { gt: 0 } // Borç kaydı = Satış faturası
            },
            _sum: { debt: true },
            _count: { id: true } // Belge sayısı
        });

        // --- FORM BA (BİLDİRİM ALIŞ) ---
        // 320'li hesapların Alacak hareketleri (Alışlar)
        const baRaw = await prisma.journalItem.groupBy({
            by: ['accountId'],
            where: {
                account: { code: { startsWith: '320' } },
                journal: { date: { gte: startDate, lte: endDate } },
                credit: { gt: 0 } // Alacak kaydı = Alış faturası
            },
            _sum: { credit: true },
            _count: { id: true }
        });

        // Fetch Account Names & format
        // Use 'any' to bypass strict typing on aggregations if needed for quick iteration, or rely on correct inference
        const accountIds = [...new Set([...bsRaw.map((i: any) => i.accountId), ...baRaw.map((i: any) => i.accountId)])];
        const accounts = await prisma.account.findMany({
            where: { id: { in: accountIds } },
            select: { id: true, code: true, name: true }
        });

        // Process BS
        const formBS = bsRaw
            .map((item: any) => {
                const total = Number(item._sum.debt || 0);
                const acc = accounts.find(a => a.id === item.accountId);
                return {
                    id: item.accountId,
                    code: acc?.code || '?',
                    name: acc?.name || 'Bilinmeyen Cari',
                    count: item._count.id,
                    total
                };
            })
            .filter(item => item.total >= limit)
            .sort((a, b) => b.total - a.total);

        // Process BA
        const formBA = baRaw
            .map((item: any) => {
                const total = Number(item._sum.credit || 0);
                const acc = accounts.find(a => a.id === item.accountId);
                return {
                    id: item.accountId,
                    code: acc?.code || '?',
                    name: acc?.name || 'Bilinmeyen Cari',
                    count: item._count.id,
                    total
                };
            })
            .filter(item => item.total >= limit)
            .sort((a, b) => b.total - a.total);

        return NextResponse.json({
            success: true,
            period: { month, year },
            limit,
            formBS, // Satışlar
            formBA  // Alışlar
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
