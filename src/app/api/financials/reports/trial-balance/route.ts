import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { authorized, user, response } = await authorize();
        if (!authorized) return response;

        const companyId = user.companyId;
        if (!companyId) throw new Error("Şirket kimliği bulunamadı.");

        // 1. Hareket Toplamlarını Al
        const groups = await prisma.journalItem.groupBy({
            by: ['accountId'],
            _sum: {
                debt: true,
                credit: true
            },
            where: {
                journal: {
                    companyId: companyId
                }
            }
        });

        // 2. Hesap Tanımlarını Al
        const accounts = await prisma.account.findMany({
            where: {
                companyId: companyId
            },
            orderBy: { code: 'asc' }
        });

        // 3. Mizan Satırlarını Oluştur
        const report = accounts.map((acc: any) => {
            const group = groups.find(g => g.accountId === acc.id);
            const totalDebt = Number(group?._sum.debt || 0);
            const totalCredit = Number(group?._sum.credit || 0);

            // Borç/Alacak Bakiyesi Hesabı (Standart Muhasebe Mantığı)
            // AKTIF ve GIDER için: Borç - Alacak
            // PASIF, OZKAYNAK ve GELIR için: Alacak - Borç
            const isDebitOriented = acc.accountClass === 'AKTIF' || acc.accountClass === 'GIDER';
            const rawBalance = isDebitOriented ? (totalDebt - totalCredit) : (totalCredit - totalDebt);

            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                accountClass: acc.accountClass,
                normalBalance: acc.normalBalance,
                reportGroup: acc.reportGroup,
                reportType: acc.reportType,
                parentCode: acc.parentCode,
                totalDebt,
                totalCredit,
                balance: Math.abs(rawBalance),
                balanceDirection: rawBalance > 0.009 ? (isDebitOriented ? 'Borç' : 'Alacak') : (rawBalance < -0.009 ? (isDebitOriented ? 'Alacak' : 'Borç') : '-')
            };
        });

        // 4. Ana Hesap Toplamlarını Hesapla (Opsiyonel ama Mizan için şık olur)
        // Şimdilik frontend tarafında veya basitçe tüm listeyi dönüyoruz.
        // Hiyerarşik toplam frontend'de de yapılabilir.

        return NextResponse.json({ success: true, report });

    } catch (error: any) {
        console.error('Mizan hatası:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
