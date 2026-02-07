
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';


import { authorize, verifyWriteAccess } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        // Optimize: Use select to fetch only necessary fields instead of full include
        const customers = await prisma.customer.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                name: true,
                phone: true,
                branch: true,
                balance: true,
                email: true,
                address: true,
                city: true,
                district: true,
                supplierClass: true,
                customerClass: true,
                points: true,
                referralCode: true,
                updatedAt: true,
                category: {
                    select: { name: true }
                },
                // Fetch open checks only (lighter query)
                checks: {
                    where: { status: { in: ['Portföyde', 'Beklemede', 'Karşılıksız'] } },
                    select: { id: true, amount: true, dueDate: true, status: true }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Frontend ile uyumlu formata dönüştür
        const formattedCustomers = customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            branch: c.branch || 'Merkez',
            balance: Number(c.balance || 0),
            category: c.category?.name || 'Genel',
            email: c.email || '',
            address: c.address || '',
            city: c.city || '',
            district: (c as any).district || '',
            supplierClass: c.supplierClass || '',
            customerClass: c.customerClass || '',
            points: Number(c.points || 0),
            referralCode: c.referralCode || '',
            lastVisit: c.updatedAt.toISOString().split('T')[0],
            checks: c.checks || []
        }));

        return NextResponse.json({ success: true, customers: formattedCustomers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    const writeCheck = verifyWriteAccess(user);
    if (!writeCheck.authorized) return writeCheck.response;

    try {
        const body = await request.json();
        const { name, phone, email, address, city, district, taxNumber, taxOffice, categoryId, contactPerson, iban, branch, supplierClass, customerClass, referredByCode } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Müşteri adı zorunludur.' }, { status: 400 });
        }

        // Get the default company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: user.tenantId }
        });

        if (!company && user.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı.' }, { status: 404 });
        }

        // Genel kategori otomatik seçilsin mi? Eğer categoryId gönderilmezse:
        let targetCategoryId = categoryId;
        if (!targetCategoryId) {
            const generalCat = await prisma.customerCategory.findFirst({ where: { name: 'Genel' } });
            if (generalCat) targetCategoryId = generalCat.id;
        }

        // Generate a referral code for this new customer
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const result = await prisma.$transaction(async (tx) => {
            const newCustomer = await (tx as any).customer.create({
                data: {
                    name, phone, email, address, city, district, taxNumber, taxOffice, contactPerson, iban,
                    branch: branch || 'Merkez',
                    categoryId: targetCategoryId,
                    companyId: company?.id, // Added companyId
                    supplierClass,
                    customerClass,
                    referralCode: myReferralCode
                }
            });

            if (referredByCode) {
                const searchCode = referredByCode.trim().toUpperCase();
                const referrer = await tx.customer.findUnique({ where: { referralCode: searchCode } });
                if (referrer) {
                    const settings = await tx.appSettings.findUnique({ where: { key: 'referralSettings' } });
                    const s = (settings?.value as any) || { referrerDiscount: 10, refereeGift: 50 };

                    await tx.coupon.create({
                        data: {
                            code: `REF-FOR-${referrer.id.substring(0, 4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                            type: 'percent',
                            value: Number(s.referrerDiscount || 10),
                            customerId: referrer.id,
                            isUsed: false
                        }
                    });
                    await tx.coupon.create({
                        data: {
                            code: `WELCOME-${newCustomer.id.substring(0, 4)}`,
                            type: 'amount',
                            value: Number(s.refereeGift || 50),
                            customerId: newCustomer.id,
                            isUsed: false
                        }
                    });
                }
            }
            return newCustomer;
        });

        // AUDIT LOG
        await logActivity({
            tenantId: (user as any).tenantId,
            userId: (user as any).id,
            userName: (user as any).username,
            action: 'CREATE_CUSTOMER',
            entity: 'Customer',
            entityId: result.id,
            after: result,
            details: `${result.name} isimli müşteri oluşturuldu.`,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0'
        });

        return NextResponse.json({ success: true, customer: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
