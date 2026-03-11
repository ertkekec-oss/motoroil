import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function POST(req: NextRequest) {
    try {
        const { userId, tenantId } = await getRequestContext(req);
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        
        const data = await req.json();
        
        const contractId = data.contractId;
        const version = data.version;

        if (!contractId || !version) {
            return NextResponse.json({ success: false, error: 'Contract missing.' }, { status: 400 });
        }

        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Bilinmiyor';
        const userAgent = req.headers.get('user-agent') || 'Bilinmiyor';

        const signature = await prisma.tenantContractSignature.create({
            data: {
                tenantId,
                userId,
                contractId,
                version,
                ipAddress: ip,
                userAgent
            }
        });

        return NextResponse.json({ success: true, signature });
    } catch (error: any) {
        console.error('KYC Document Sign Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
