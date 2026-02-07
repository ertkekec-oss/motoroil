
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';

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
        let trialPlan = await (prisma as any).plan.findFirst({
            where: { price: 0, isActive: true }
        });

        // Eğer ücretsiz plan yoksa oluştur (FK hatasını önlemek için)
        if (!trialPlan) {
            trialPlan = await (prisma as any).plan.create({
                data: {
                    id: 'trial-default',
                    name: 'Free Trial',
                    price: 0,
                    isActive: true,
                    description: '14 Günlük Ücretsiz Deneme'
                }
            });
        }

        const now = new Date();
        const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

        await (prisma as any).subscription.create({
            data: {
                tenantId: tenant.id,
                planId: trialPlan.id,
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

        // 6. Send Welcome Email
        try {
            const origin = req.headers.get('origin') || 'https://kech.tr';
            await sendMail({
                to: email,
                subject: '🌸 Periodya\'ya Hoş Geldiniz!',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 30px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 15px; background: #fff;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #446ee7; margin: 0;">PERIOD<span style="color: #E64A00;">YA</span></h1>
                        </div>
                        <h2 style="color: #333;">Merhaba ${name},</h2>
                        <p><b>${companyName}</b> firması için Periodya hesabınız başarıyla oluşturuldu!</p>
                        <p>14 günlük ücretsiz deneme süreniz şimdi başladı. Bu süreçte tüm özellikleri sınırsızca deneyimleyebilirsiniz.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${origin}/login" style="background: #446ee7; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Hemen Giriş Yap</a>
                        </div>
                        <p style="font-size: 14px; color: #666;">Herhangi bir sorunuz olursa bu e-postayı yanıtlayarak bize ulaşabilirsiniz.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #999; text-align: center;">© 2026 Periodya Teknolojileri</p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.error("Welcome email failed:", mailErr);
            // Don't fail registration if email fails
        }

        return NextResponse.json({ success: true, userId: user.id });

    } catch (error: any) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
