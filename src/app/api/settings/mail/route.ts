
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export async function GET() {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    let companyId = auth.user.companyId;
    if (!companyId) {
        companyId = await resolveCompanyId(auth.user);
    }

    if (!companyId) return NextResponse.json({ error: 'Firma ID bulunamadı' }, { status: 400 });

    try {
        const settings = await prisma.appSettings.findUnique({
            where: {
                companyId_key: {
                    companyId,
                    key: 'smtp_settings'
                }
            }
        });
        return NextResponse.json(settings?.value || {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    let companyId = auth.user.companyId;
    if (!companyId) {
        companyId = await resolveCompanyId(auth.user);
    }

    if (!companyId) return NextResponse.json({ error: 'Firma ID bulunamadı' }, { status: 400 });

    try {
        const data = await request.json();

        // data format: { email, password }
        const settings = await prisma.appSettings.upsert({
            where: {
                companyId_key: {
                    companyId,
                    key: 'smtp_settings'
                }
            },
            create: {
                companyId,
                key: 'smtp_settings',
                value: data
            },
            update: {
                value: data
            }
        });

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
