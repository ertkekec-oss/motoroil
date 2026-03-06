import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const tenantId = session.tenantId;

        const signers = await prisma.authorizedSigner.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, signers });
    } catch (error: any) {
        console.error('Error fetching signers:', error);
        return NextResponse.json({ error: error.message || 'Yetkililer getirilemedi.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
        }

        const tenantId = session.tenantId;
        const body = await req.json();

        // Ensure default logic
        if (body.defaultSigner) {
            await prisma.authorizedSigner.updateMany({
                where: { tenantId, defaultSigner: true },
                data: { defaultSigner: false }
            });
        }

        const newSigner = await prisma.authorizedSigner.create({
            data: {
                tenantId,
                name: body.name,
                title: body.title,
                email: body.email,
                phone: body.phone,
                isActive: body.isActive !== undefined ? body.isActive : true,
                defaultSigner: body.defaultSigner || false,
                allowedCategories: body.allowedCategories || []
            }
        });

        return NextResponse.json({ success: true, signer: newSigner });
    } catch (error: any) {
        console.error('Error creating signer:', error);
        return NextResponse.json({ error: error.message || 'Yetkili oluşturulamadı.' }, { status: 500 });
    }
}
