
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me');

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email ve şifre zorunludur.' }, { status: 400 });
        }

        // Find customer with active portal access
        const customer = await (prisma as any).customer.findFirst({
            where: {
                email,
                isPortalActive: true
            },
            include: {
                company: { select: { name: true, tenantId: true } }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı veya portala erişimi yok.' }, { status: 401 });
        }

        if (!customer.portalPassword) {
            return NextResponse.json({ error: 'Hesabınız için şifre oluşturulmamış.' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, customer.portalPassword);
        if (!isValid) {
            return NextResponse.json({ error: 'Hatalı şifre.' }, { status: 401 });
        }

        // Update last login
        await (prisma as any).customer.update({
            where: { id: customer.id },
            data: { lastPortalLogin: new Date() }
        });

        // Create JWT
        const token = await new SignJWT({
            id: customer.id,
            role: 'CUSTOMER',
            tenantId: customer.company?.tenantId,
            companyName: customer.company?.name,
            name: customer.name
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        const response = NextResponse.json({ success: true });

        response.cookies.set('portal_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;

    } catch (error: any) {
        console.error('Portal Login Error:', error);
        return NextResponse.json({ error: 'Giriş yapılamadı.' }, { status: 500 });
    }
}
