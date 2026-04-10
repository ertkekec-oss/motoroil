
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';


import { authorize, verifyWriteAccess } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { trackOnboardingStep } from '@/lib/onboarding';
import { logActivity } from '@/lib/audit';

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const user = auth.user;
        const isStaff = user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN';
        const assignedCategoryIds = user.assignedCategoryIds || [];

        // Parse search params
        const url = new URL(request.url);
        const searchQuery = url.searchParams.get('search');

        // Resolve company
        const company = await prisma.company.findFirst({
            where: { tenantId: user.tenantId }
        });
        
        const where: any = { deletedAt: null };
        let defaultBranchString = 'Merkez';
        if (company) {
            const defBranchSetting = await prisma.appSettings.findFirst({ where: { companyId: company.id, key: 'company_default_branch' }});
            if (defBranchSetting && defBranchSetting.value) {
                defaultBranchString = defBranchSetting.value;
            }
        }
        if (company) {
            where.companyId = company.id;
        } else if (user.tenantId !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ success: false, customers: [] });
        }

        // Apply Search Filtering
        if (searchQuery) {
            where.OR = [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { phone: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } },
                { city: { contains: searchQuery, mode: 'insensitive' } },
                { district: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }

        // Apply Category Filter Explicitly (Smart Map string vs UUID)
        const categoryIdParam = url.searchParams.get('categoryId');
        if (categoryIdParam) {
            try {
                const cat = await prisma.customerCategory.findUnique({ where: { id: categoryIdParam } });
                if (cat) {
                    const catCondition = {
                        OR: [
                            { categoryId: categoryIdParam },
                            { customerClass: { contains: cat.name, mode: 'insensitive' } },
                            { supplierClass: { contains: cat.name, mode: 'insensitive' } }
                        ]
                    };
                    if (where.AND) {
                        where.AND.push(catCondition);
                    } else {
                        where.AND = [catCondition];
                    }
                } else {
                    where.categoryId = categoryIdParam;
                }
            } catch (e) {
                // Not a valid UUID or DB error
                where.customerClass = categoryIdParam;
            }
        }

        // Apply Customer Class Filter
        const customerClassParam = url.searchParams.get('customerClass');
        if (customerClassParam) {
            where.customerClass = customerClassParam;
        }

        // Apply Category Isolation if staff has assignments
        if (isStaff && assignedCategoryIds.length > 0) {
            where.categoryId = { in: assignedCategoryIds };
        }

        // Apply Branch Isolation / Context
        // Priority 1: Use active branch from header/context (Manager selection)
        // Priority 2: Use user's permanent branch (Staff assignment)
        const effectiveBranch = user.activeBranch || user.branch;

        if (effectiveBranch && effectiveBranch !== 'all' && effectiveBranch !== 'Tümü' && effectiveBranch !== 'Global' && effectiveBranch !== 'TÜM ŞUBELER') {
            const branchCond = effectiveBranch === 'Merkez' 
                ? { OR: [{ branch: { equals: 'Merkez', mode: 'insensitive' } }, { branch: null }, { branch: '' }, { branch: 'Global' }, { branch: 'Ortak' }] }
                : { OR: [{ branch: { equals: effectiveBranch, mode: 'insensitive' } }, { branch: 'Global' }, { branch: 'Ortak' }] };
                
            if (where.AND) {
                where.AND.push(branchCond);
            } else {
                where.AND = [branchCond];
            }
        }

        // Optimize: Use select to fetch only necessary fields instead of full include
        const customers = await prisma.customer.findMany({
            where: where,
            take: 500, // Optimize memory consumption by preventing unbounded row retrieval
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
                    select: { name: true, priceListId: true }
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
            branch: c.branch || defaultBranchString,
            balance: Number(c.balance || 0),
            category: c.category?.name || c.customerClass || 'Genel',
            priceListId: c.category?.priceListId || null,
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


export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const { user } = auth;

    const writeCheck = verifyWriteAccess(user);
    if (!writeCheck.authorized) return writeCheck.response;

    try {
        const body = await req.json();
        const { name, phone, email: rawEmail, address, city, district, taxNumber, taxOffice, categoryId, contactPerson, iban, branch, supplierClass, customerClass, referredByCode, companyId: explicitCompanyId } = body;

        // Boş string email'i null'a çevir — yoksa unique constraint (email, companyId) çakışır
        const email = (rawEmail && rawEmail.trim() !== '') ? rawEmail.trim() : null;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Müşteri adı zorunludur.' }, { status: 400 });
        }

        // Get the default company for this tenant
        const company = await prisma.company.findFirst({
            where: { tenantId: user.tenantId }
        });

        // Determine effective company ID
        let targetCompanyId = company?.id;

        // If no company found automatically, check if explicit ID is allowed and provided
        if (!targetCompanyId) {
            const isPlatformAdmin = user.tenantId === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN';

            if (isPlatformAdmin && explicitCompanyId) {
                targetCompanyId = explicitCompanyId;
            } else if (!isPlatformAdmin) {
                return NextResponse.json({ success: false, error: 'Firma kaydı bulunamadı. Lütfen önce Firma Profilini oluşturun.' }, { status: 404 });
            } else {
                // Platform admin but no ID provided
                // Try to find ANY company to attach to (fallback) or fail
                const firstCompany = await prisma.company.findFirst();
                if (firstCompany) {
                    targetCompanyId = firstCompany.id;
                } else {
                    return NextResponse.json({ success: false, error: 'Sistemde kayıtlı firma bulunamadı.' }, { status: 400 });
                }
            }
        }

        // Final safety check
        if (!targetCompanyId) {
            return NextResponse.json({ success: false, error: 'İşlem için geçerli bir Firma ID (Company ID) bulunamadı.' }, { status: 400 });
        }

        let defaultBranchString = 'Merkez';
        if (targetCompanyId) {
            const defBranchSetting = await prisma.appSettings.findFirst({ where: { companyId: targetCompanyId, key: 'company_default_branch' }});
            if (defBranchSetting && defBranchSetting.value) {
                defaultBranchString = defBranchSetting.value;
            }
        }
        
        // Genel kategori otomatik seçilsin mi? Eğer categoryId gönderilmezse:
        let targetCategoryId = categoryId;
        if (!targetCategoryId) {
            const generalCat = await prisma.customerCategory.findFirst({
                where: {
                    name: 'Genel',
                    companyId: targetCompanyId
                }
            });
            if (generalCat) targetCategoryId = generalCat.id;
        }

        // Generate a referral code for this new customer
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const result = await prisma.$transaction(async (tx) => {
            const newCustomer = await (tx as any).customer.create({
                data: {
                    name, phone, email, address, city, district, taxNumber, taxOffice, contactPerson, iban,
                    branch: branch || defaultBranchString,
                    categoryId: targetCategoryId,
                    companyId: targetCompanyId, // Use valid ID
                    supplierClass,
                    customerClass,
                    referralCode: myReferralCode
                }
            });

            if (referredByCode) {
                const searchCode = referredByCode.trim().toUpperCase();
                const referrer = await tx.customer.findUnique({ where: { referralCode: searchCode } });

                if (referrer) {
                    const settings = await tx.appSettings.findUnique({
                        where: {
                            companyId_key: {
                                companyId: targetCompanyId,
                                key: 'referralSettings'
                            }
                        }
                    });
                    const s = (settings?.value as any) || { referrerDiscount: 10, refereeGift: 50 };

                    await tx.coupon.create({
                        data: {
                            code: `REF-${referrer.id.substring(0, 4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                            type: s.referrerRewardType || 'percent',
                            value: Number(s.referrerDiscount || 10),
                            customerId: referrer.id,
                            isUsed: false,
                            usageLimit: 1
                        }
                    });

                    await tx.coupon.create({
                        data: {
                            code: `WELCOME-${newCustomer.id.substring(0, 4)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
                            type: s.refereeGiftType || 'amount',
                            value: Number(s.refereeGift || 50),
                            customerId: newCustomer.id,
                            isUsed: false,
                            usageLimit: 1
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
            userAgent: req.headers.get('user-agent') || undefined,
            ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0'
        });

        // Trigger onboarding tracking asynchronously without blocking the request
        trackOnboardingStep(user.tenantId, 'firstCustomer');

        return NextResponse.json({ success: true, customer: result }, { status: 201 });
    } catch (error: any) {
        // Unique constraint hatası için anlaşılır mesaj
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return NextResponse.json({
                success: false,
                error: 'Bu e-posta adresi bu firmada zaten kayıtlı. Lütfen farklı bir e-posta girin veya e-posta alanını boş bırakın.'
            }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
