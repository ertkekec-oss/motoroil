import { NextResponse } from 'next/server';
import { prismaRaw as prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const getJWTSecret = () => process.env.JWT_SECRET || 'dev-only-secret-key-change-in-production';
const getJWTAscii = () => new TextEncoder().encode(getJWTSecret());

const getAuthTenantId = async () => {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session')?.value;
        if (!sessionToken) return null;
        const { payload } = await jwtVerify(sessionToken, getJWTAscii());
        return payload.tenantId as string;
    } catch {
        return null;
    }
};

export async function GET() {
    const tenantId = await getAuthTenantId();
    if (!tenantId) {
        return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { tenantSlug: true, b2bCustomDomain: true }
        });

        let config = await prisma.tenantPortalConfig.findUnique({
            where: { tenantId: tenantId }
        });

        if (!config) {
            config = await prisma.tenantPortalConfig.create({
                data: {
                    tenantId: tenantId,
                    primaryColor: '#2563EB',
                    dealerAuthMode: 'PASSWORD_ONLY'
                }
            });
        }

        return NextResponse.json({
            tenantSlug: tenant?.tenantSlug || '',
            b2bCustomDomain: tenant?.b2bCustomDomain || '',
            primaryColor: config.primaryColor || '#2563EB',
            logoUrl: config.logoUrl || ''
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Config yüklenemedi' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const tenantId = await getAuthTenantId();
    if (!tenantId) {
        return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tenantSlug, b2bCustomDomain, primaryColor, logoUrl } = body;

        // 1. Update Tenant
        const updateData: any = {};
        if (tenantSlug !== undefined) {
            // Check if slug is taken and not ours
            if (tenantSlug) {
                 const existing = await prisma.tenant.findUnique({ where: { tenantSlug } });
                 if (existing && existing.id !== tenantId) {
                     return NextResponse.json({ error: 'Bu bayilik portal uzantısı (slug) başka bir firma tarafından kullanılıyor!' }, { status: 400 });
                 }
            }
            updateData.tenantSlug = tenantSlug || null;
        }

        if (b2bCustomDomain !== undefined) {
             if (b2bCustomDomain) {
                 const existing = await prisma.tenant.findUnique({ where: { b2bCustomDomain } });
                 if (existing && existing.id !== tenantId) {
                     return NextResponse.json({ error: 'Bu özel alan adı (domain) başka bir firma tarafından kullanılıyor!' }, { status: 400 });
                 }
             }
             updateData.b2bCustomDomain = b2bCustomDomain || null;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.tenant.update({
                where: { id: tenantId },
                data: updateData
            });
        }

        // 2. Update Portal Config
        const configData: any = {};
        if (primaryColor !== undefined) configData.primaryColor = primaryColor;
        if (logoUrl !== undefined) configData.logoUrl = logoUrl;

        if (Object.keys(configData).length > 0) {
            await prisma.tenantPortalConfig.upsert({
                where: { tenantId: tenantId },
                update: configData,
                create: {
                    tenantId: tenantId,
                    ...configData
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Config güncellenemedi' }, { status: 500 });
    }
}
