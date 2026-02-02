import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const issues: any[] = [];

        // 1. CASH LIMIT CHECK (>7.000 TL)
        // According to tax laws, payments over 7000 TL must be via bank.
        const highCashItems = await prisma.journalItem.findMany({
            where: {
                account: { code: { startsWith: '100' } },
                OR: [
                    { debt: { gt: 7000 } },
                    { credit: { gt: 7000 } }
                ]
            },
            include: { account: true, journal: true },
            orderBy: { journal: { date: 'desc' } }
        });

        highCashItems.forEach(item => {
            issues.push({
                type: 'critical',
                category: 'Yasal Sınır',
                title: 'Kasa Tahsilat/Ödeme Sınırı Aşıldı',
                description: `7.000 TL üzeri işlemlerin banka yoluyla yapılması zorunludur. İşlem tutarı: ${Number(item.debt || item.credit).toLocaleString()} TL`,
                date: item.journal.date,
                fisNo: item.journal.fisNo,
                account: item.account.name
            });
        });

        // 2. WEEKEND TRANSACTIONS
        // Warning for official transactions on weekends
        const allJournals = await prisma.journal.findMany({
            where: {
                date: {
                    gt: new Date(new Date().getFullYear(), 0, 1) // This year
                }
            },
            select: { id: true, date: true, fisNo: true, description: true }
        });

        allJournals.forEach(j => {
            const day = new Date(j.date).getDay();
            if (day === 0 || day === 6) { // 0: Sunday, 6: Saturday
                issues.push({
                    type: 'warning',
                    category: 'Tarih Uygunluğu',
                    title: 'Hafta Sonu İşlem Kaydı',
                    description: `Resmi defterlerde hafta sonuna (${day === 0 ? 'Pazar' : 'Cumartesi'}) fiş kesilmesi dikkat çekebilir.`,
                    date: j.date,
                    fisNo: j.fisNo,
                    account: '-'
                });
            }
        });

        // 3. DUPLICATE CHECK (Potential)
        // Same Date, Same Amount, Same Description
        // This is tricky with Prisma groupBy on relations. We will do a raw query or smart fetch.
        // Let's fetch recent items and map them.
        const recentItems = await prisma.journalItem.findMany({
            where: {
                journal: { date: { gt: new Date(new Date().setMonth(new Date().getMonth() - 3)) } } // Last 3 months
            },
            include: { journal: true, account: true } // Need journal for date
        });

        const seen = new Map();
        recentItems.forEach(item => {
            const key = `${item.journal.date.toISOString().split('T')[0]}-${item.debt}-${item.credit}-${item.description}-${item.accountId}`;
            if (seen.has(key)) {
                issues.push({
                    type: 'info',
                    category: 'Mükerrer Kayıt',
                    title: 'Olası Mükerrer (Çift) Kayıt',
                    description: 'Aynı tarih, hesap, açıklama ve tutara sahip birden fazla kayıt tespit edildi.',
                    date: item.journal.date,
                    fisNo: item.journal.fisNo,
                    account: item.account.name
                });
            } else {
                seen.set(key, true);
            }
        });

        return NextResponse.json({
            success: true,
            issues: issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
