import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { reportsQueue } from '@/lib/queue';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'reports_manage') && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId) {
            return NextResponse.json({ error: 'Geçersiz oturum' }, { status: 400 });
        }

        const body = await req.json();
        const { reportType, name, filters } = body;

        if (!reportType || !name) {
            return NextResponse.json({ error: 'Eksik rapor tipi veya ismi' }, { status: 400 });
        }

        // 1. Create DB Record as PENDING
        const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`;
        
        const exportReq = await prisma.exportReport.create({
            data: {
                tenantId,
                companyId,
                name: name,
                reportType: reportType,
                fileName: fileName,
                mimeType: 'text/csv',
                status: 'PENDING',
                size: 0
            }
        });

        // 2. Push to BullMQ Generator Pool
        if (reportsQueue && typeof reportsQueue.add === 'function') {
            await reportsQueue.add('generate-csv', {
                exportReportId: exportReq.id,
                tenantId,
                companyId,
                reportType,
                filters,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Rapor sıraya alındı, arka planda hazırlanıyor.',
            reportId: exportReq.id
        });

    } catch (err: any) {
        console.error('[API Error] Generate Report:', err);
        return NextResponse.json({ error: 'Rapor isteği oluşturulamadı' }, { status: 500 });
    }
}
