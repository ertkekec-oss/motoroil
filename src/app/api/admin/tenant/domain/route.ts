import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Required Vercel API credentials (store these in your environment variables)
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

// Example API endpoint to handle custom domains
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { tenantId, customDomain } = body;

        if (!tenantId || !customDomain) {
            return NextResponse.json({ error: 'Tenant ID AND Custom Domain are required.' }, { status: 400 });
        }

        if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
            // Note: Don't leak the exact reason to standard endpoints, but useful for logs
            console.error('Vercel API Token or Project ID is missing.');
            return NextResponse.json({ error: 'Server configuration error. Contact administrator.' }, { status: 500 });
        }

        // 1. Database level check
        const existingTenant = await prisma.tenant.findUnique({ where: { b2bCustomDomain: customDomain } });
        if (existingTenant && existingTenant.id !== tenantId) {
            return NextResponse.json({ error: 'This domain is already in use by another tenant.' }, { status: 400 });
        }

        // 2. Add domain to Vercel via Vercel REST API
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
            return NextResponse.json({ error: 'Failed to add domain to Vercel', details: errorData }, { status: vercelRes.status });
        }

        // 3. Update the tenant record in our DB
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { b2bCustomDomain: customDomain }
        });

        return NextResponse.json({
            success: true,
            message: 'Domain successfully added and linked to the tenant.',
            instructions: `Please point a CNAME for ${customDomain} to cname.vercel-dns.com`
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { tenantId, customDomain } = body;

        if (!tenantId || !customDomain) {
            return NextResponse.json({ error: 'Tenant ID AND Custom Domain are required.' }, { status: 400 });
        }

        if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        // Remove domain from Vercel Project
        const vercelRes = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${customDomain}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
        });

        // Ignore 404 from vercel if it's already removed
        if (!vercelRes.ok && vercelRes.status !== 404) {
             const errorData = await vercelRes.json();
             return NextResponse.json({ error: 'Failed to delete domain from Vercel', details: errorData }, { status: vercelRes.status });
        }

        // Unlink domain from Database
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { b2bCustomDomain: null }
        });

        return NextResponse.json({ success: true, message: 'Domain removed successfully.' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
