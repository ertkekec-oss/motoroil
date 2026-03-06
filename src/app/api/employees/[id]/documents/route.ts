import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'hr_manage') && !hasPermission(session, 'staff_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const employeeId = (await params).id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !employeeId) {
            return storageError('Geçersiz parametreler', 400);
        }

        // Önce yetki ve tenant kontrolü için personelin bu tenanta ait olduğunu doğrulayalım
        const employee = await prisma.staff.findFirst({
            where: {
                id: employeeId,
                companyId: companyId,
                tenantId: tenantId
            }
        });

        if (!employee) {
            return storageError('Personel bulunamadı veya erişim reddedildi', 404);
        }

        // Sadece güvenli meta dataları çek (fileKey döndürülmüyor)
        const docs = await prisma.employeeDocument.findMany({
            where: {
                employeeId: employeeId,
                tenantId: tenantId,
                companyId: companyId
            },
            select: {
                id: true,
                name: true,
                fileName: true,
                mimeType: true,
                size: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            documents: docs
        });

    } catch (error: any) {
        console.error('[Storage Error] Employee docs list:', error);
        return storageError('Belgeler alınamadı', 500);
    }
}
