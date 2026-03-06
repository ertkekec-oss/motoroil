import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'accounting_manage') && !hasPermission(session, 'reconciliation_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const reconciliationId = (await params).id;
        const tenantId = (session as any).tenantId;

        if (!tenantId || !reconciliationId) {
            return storageError('Geçersiz parametreler', 400);
        }

        // Verify reconciliation tenant scope
        const recon = await prisma.reconciliation.findFirst({
            where: {
                id: reconciliationId,
                tenantId: tenantId
            }
        });

        if (!recon) {
            return storageError('Mutabakat bulunamadı veya erişim reddedildi', 404);
        }

        const docs = await prisma.reconciliationDocument.findMany({
            where: {
                reconciliationId: reconciliationId,
                tenantId: tenantId
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
        console.error('[Storage Error] Reconciliation docs list:', error);
        return storageError('Belgeler alınamadı', 500);
    }
}
