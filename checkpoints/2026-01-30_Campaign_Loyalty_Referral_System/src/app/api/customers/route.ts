
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                category: true,
                transactions: true
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
            supplierClass: c.supplierClass || '',
            customerClass: c.customerClass || '',
            points: Number(c.points || 0),
            referralCode: c.referralCode || '',
            lastVisit: c.updatedAt.toISOString().split('T')[0]
        }));

        return NextResponse.json({ success: true, customers: formattedCustomers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, address, taxNumber, taxOffice, categoryId, contactPerson, iban, branch, supplierClass, customerClass, referredByCode } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Müşteri adı zorunludur.' }, { status: 400 });
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
            const newCustomer = await tx.customer.create({
                data: {
                    name, phone, email, address, taxNumber, taxOffice, contactPerson, iban,
                    branch: branch || 'Merkez',
                    categoryId: targetCategoryId,
                    supplierClass,
                    customerClass,
                    referralCode: myReferralCode
                }
            });

            if (referredByCode) {
                const referrer = await tx.customer.findUnique({ where: { referralCode: referredByCode } });
                if (referrer) {
                    // Award coupon to Referrer (e.g. 10% discount)
                    await tx.coupon.create({
                        data: {
                            code: `REF-FOR-${referrer.id.substring(0, 4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                            type: 'percent',
                            value: 10,
                            customerId: referrer.id,
                            isUsed: false
                        }
                    });
                    // Award coupon to New Customer
                    await tx.coupon.create({
                        data: {
                            code: `WELCOME-${newCustomer.id.substring(0, 4)}`,
                            type: 'amount',
                            value: 50, // 50 TL welcome gift
                            customerId: newCustomer.id,
                            isUsed: false
                        }
                    });
                }
            }
            return newCustomer;
        });

        return NextResponse.json({ success: true, customer: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
