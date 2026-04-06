import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const sessionResult: any = await getSession();
    const session = sessionResult?.user || sessionResult;

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const integrations = await (prisma as any).systemIntegration.findMany();
        return NextResponse.json({ integrations });
    } catch (error) {
        console.error('Integrations GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const sessionResult: any = await getSession();
    const session = sessionResult?.user || sessionResult;

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { category, providerCode, name, credentials, settings, isActive, isGlobalDefault } = body;

        if (!category || !providerCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // If this is set as default shipping, optionally unset others
        if (category === 'SHIPPING' && isGlobalDefault) {
             await (prisma as any).systemIntegration.updateMany({
                 where: { category: 'SHIPPING' },
                 data: { isGlobalDefault: false }
             });
        }

        const integration = await (prisma as any).systemIntegration.upsert({
            where: {
                category_providerCode: {
                    category,
                    providerCode
                }
            },
            update: {
                name,
                credentials,
                settings,
                isActive,
                isGlobalDefault
            },
            create: {
                category,
                providerCode,
                name,
                credentials,
                settings,
                isActive,
                isGlobalDefault
            }
        });

        
        // --- BRIDGE TO LEGACY APIS TO PREVENT BACKEND BREAKAGE ---
        if (category === 'EMAIL' && providerCode === 'GMAIL') {
            const adminCompany = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
            if (adminCompany) {
                await prisma.appSettings.upsert({
                    where: { companyId_key: { companyId: adminCompany.id, key: 'smtp_settings' } },
                    create: { companyId: adminCompany.id, key: 'smtp_settings', value: credentials },
                    update: { value: credentials }
                });
            }
        }

        if (category === 'SMS' && providerCode === 'NETGSM') {
            const adminCompany = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
            if (adminCompany) {
                await (prisma as any).otpProviderConfig.upsert({
                    where: { companyId_provider: { companyId: adminCompany.id, provider: 'NETGSM' } },
                    create: { 
                        companyId: adminCompany.id, 
                        provider: 'NETGSM', 
                        isActive: isActive,
                        credentials: credentials,
                        settings: settings || {}
                    },
                    update: { 
                        isActive: isActive,
                        credentials: credentials,
                        settings: settings || {}
                    }
                });
            }
        }
        // ---------------------------------------------------------

        return NextResponse.json({ success: true, integration });

    } catch (error) {
        console.error('Integrations POST Error:', error);
        return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }
}
