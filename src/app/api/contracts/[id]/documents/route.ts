import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, hasPermission } from '@/lib/auth';
import { storageError } from '@/lib/storage/security';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session) return storageError('Oturum gerekli', 401);

        if (!hasPermission(session, 'contract_manage') && session.role !== 'ADMIN') {
            return storageError('Bu işlem için yetkiniz yok', 403);
        }

        const contractId = (await params).id;
        const tenantId = (session as any).tenantId;
        const companyId = session.companyId;

        if (!tenantId || !companyId || !contractId) {
            return storageError('Geçersiz parametreler', 400);
        }

        const contract = await prisma.contract.findFirst({
            where: {
                id: contractId,
                OR: [
                    { buyerCompanyId: companyId },
                    { sellerCompanyId: companyId }
                ]
            }
        });

        if (!contract) {
            return storageError('Sözleşme bulunamadı veya erişim yetkiniz yok', 404);
        }

        // Fetch documents related to contract (Both parties can see documents, regardless of uploader, as contracts are shared entities)
        const docs = await prisma.contractDocument.findMany({
            where: {
                contractId: contractId
            },
            select: {
                id: true,
                companyId: true, // Identify who uploaded
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
        console.error('[Storage Error] Contract docs list:', error);
        return storageError('Belgeler alınamadı', 500);
    }
}
