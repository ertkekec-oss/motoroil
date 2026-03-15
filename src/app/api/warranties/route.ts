import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        }

        // Güvenlik: İlgili müşterinin yetkili firmaya ait olup olmadığını kontrol et
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, companyId }
        });
        if (!customer) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim veya müşteri bulunamadı.' }, { status: 403 });
        }

        const warranties = await prisma.warranty.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, warranties });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const body = await request.json();
        const { customerId, productName, serialNo, startDate, endDate, period, status, invoiceNo } = body;

        // Güvenlik:
        const customer = await prisma.customer.findFirst({
            where: { id: customerId, companyId }
        });
        if (!customer) {
            return NextResponse.json({ success: false, error: 'Yetkisiz erişim veya müşteri bulunamadı.' }, { status: 403 });
        }

        const warranty = await prisma.warranty.create({
            data: {
                customerId,
                productName,
                serialNo,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                period,
                status: status || 'Active',
                invoiceNo
            }
        });

        return NextResponse.json({ success: true, warranty });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
