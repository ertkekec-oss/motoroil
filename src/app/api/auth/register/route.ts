
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, phone, companyName, password } = body;

        if (!email || !password || !name || !companyName) {
            return NextResponse.json({ error: 'Eksik bilgiler var' }, { status: 400 });
        }

        // 1. Check if email exists
        const existingUser = await (prisma as any).user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Bu e-posta adresi zaten kullanımda' }, { status: 400 });
        }

        // 2. Create Tenant
        const tenant = await (prisma as any).tenant.create({
            data: {
                name: companyName,
                ownerEmail: email,
                phone: phone,
                status: 'TRIAL'
            }
        });

        // 3. Create Subscription (Trial Plan)
        // Find a trial plan or just create with default values
        const trialPlan = await (prisma as any).plan.findFirst({
            where: { price: 0, isActive: true }
        });

        const now = new Date();
        const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

        await (prisma as any).subscription.create({
            data: {
                tenantId: tenant.id,
                planId: trialPlan?.id || 'default_trial_id',
                status: 'ACTIVE',
                period: 'TRIAL',
                startDate: now,
                endDate: endDate
            }
        });

        // 4. Create User (Admin of Tenant)
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await (prisma as any).user.create({
            data: {
                email,
                username: email.split('@')[0],
                password: hashedPassword,
                role: 'ADMIN',
                name: name,
                tenantId: tenant.id
            }
        });

        // 5. Create Default Company for Tenant
        await (prisma as any).company.create({
            data: {
                tenantId: tenant.id,
                name: companyName,
                vkn: '9999999999' // Placeholder
            }
        });

        return NextResponse.json({ success: true, userId: user.id });

    } catch (error: any) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
