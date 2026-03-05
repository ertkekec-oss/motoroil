import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
    const sessionResult = await getSession();
    const session = sessionResult?.user || sessionResult;

    const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN' || session?.role === 'ADMIN';
    if (!session || !isPlatformAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminCompany = await prisma.company.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!adminCompany) {
            return NextResponse.json({ error: 'System admin company not found' }, { status: 500 });
        }

        const settings = await prisma.appSettings.findUnique({
            where: {
                companyId_key: {
                    companyId: adminCompany.id,
                    key: 'smtp_settings'
                }
            }
        });
        return NextResponse.json(settings?.value || {});
    } catch (error: any) {
        console.error("GET /api/admin/settings/mail Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const sessionResult = await getSession();
    const session = sessionResult?.user || sessionResult;

    const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN' || session?.role === 'ADMIN';
    if (!session || !isPlatformAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();

        const adminCompany = await prisma.company.findFirst({
            orderBy: { createdAt: 'asc' }
        });

        if (!adminCompany) {
            return NextResponse.json({ error: 'System admin company not found' }, { status: 500 });
        }

        // data format: { email, password, host, port, etc }
        const settings = await prisma.appSettings.upsert({
            where: {
                companyId_key: {
                    companyId: adminCompany.id,
                    key: 'smtp_settings'
                }
            },
            create: {
                companyId: adminCompany.id,
                key: 'smtp_settings',
                value: data
            },
            update: {
                value: data
            }
        });

        return NextResponse.json({ success: true, data: settings });
    } catch (error: any) {
        console.error("POST /api/admin/settings/mail Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
