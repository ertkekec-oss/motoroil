import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const getJWTSecret = () => process.env.JWT_SECRET || 'dev-only-secret-key-change-in-production';
const getJWTAscii = () => new TextEncoder().encode(getJWTSecret());

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

const getAuthTenantId = async () => {
    try {
        // According to recent next.js, cookies() returns a Promise, so await it
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session')?.value;
        if (!sessionToken) return null;
        const { payload } = await jwtVerify(sessionToken, getJWTAscii());
        // Return tenantId based on payload depending on your authentication token structure
        return payload.tenantId as string;
    } catch {
        return null;
    }
};

export async function GET(req: Request) {
    try {
        const tenantId = await getAuthTenantId();
        if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const existingTenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { b2bCustomDomain: true }
        });

        return NextResponse.json({ domain: existingTenant?.b2bCustomDomain || null });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const tenantId = await getAuthTenantId();
        if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { customDomain } = body;

        if (!customDomain) {
            return NextResponse.json({ error: 'Alan adınız gerekli.' }, { status: 400 });
        }

        if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
            console.error('SERVER SETUP ERROR: Missing Vercel Env Vars');
            return NextResponse.json({ error: 'Sunucu iletişiminde hata. Lütfen yöneticiye başvurun (Vercel API Token eksik).' }, { status: 500 });
        }

        const existingTenant = await prisma.tenant.findUnique({ where: { b2bCustomDomain: customDomain } });
        if (existingTenant && existingTenant.id !== tenantId) {
            return NextResponse.json({ error: 'Bu alan adı sistemde kayıtlı.' }, { status: 400 });
        }

        const vercelRes = await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${VERCEL_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: customDomain }),
        });

        if (!vercelRes.ok) {
            const errorData = await vercelRes.json();
            return NextResponse.json({ error: 'Vercel API reddetti.', details: errorData }, { status: vercelRes.status });
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { b2bCustomDomain: customDomain }
        });

        return NextResponse.json({
            success: true,
            domain: customDomain
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const tenantId = await getAuthTenantId();
        if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { customDomain } = body;

        if (!customDomain) {
             return NextResponse.json({ error: 'Silinecek alan adı belirtilmedi.' }, { status: 400 });
        }

        if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
            return NextResponse.json({ error: 'Config Hatası' }, { status: 500 });
        }

        const vercelRes = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${customDomain}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
        });

        if (!vercelRes.ok && vercelRes.status !== 404) {
             const errorData = await vercelRes.json();
             return NextResponse.json({ error: 'Vercel üzerinden domain silinemedi.', details: errorData }, { status: vercelRes.status });
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { b2bCustomDomain: null }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
