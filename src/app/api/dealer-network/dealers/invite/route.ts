import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user || session;
        const tenantId = session.tenantId || user.tenantId;

        if (!user.permissions?.includes('b2b_manage') && !['TENANT_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz bulunmuyor (b2b_manage)' }, { status: 403 });
        }

        const body = await req.json();

        let targetEmail = body.email;
        let customerId = body.customerId;

        if (customerId && !targetEmail) {
            const customer = await prisma.customer.findUnique({
                where: { id: customerId }
            });

            if (!customer || !customer.email) {
                return NextResponse.json({ error: 'Seçilen carinin geçerli bir e-posta adresi bulunmuyor.' }, { status: 400 });
            }
            targetEmail = customer.email;
        }

        if (!targetEmail) {
            return NextResponse.json({ error: 'Davetiyeyi göndermek için geçerli bir e-posta adresi gereklidir.' }, { status: 400 });
        }

        // Tenant context operations would happen here...
        console.log(`[Invite] Inviting ${targetEmail} for tenant ${tenantId} by ${user.id}${customerId ? ` (Customer ID: ${customerId})` : ''}`);

        // ACTUALLY SEND THE EMAIL
        const inviteLink = `https://www.periodya.com/register?invite=${tenantId}`;
        const mailRes = await sendMail({
            to: targetEmail,
            subject: 'Periodya B2B Ağına Davet Edildiniz',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Periodya B2B Davetiyesi</h1>
                    </div>
                    <div style="padding: 32px; background-color: #ffffff;">
                        <h2 style="color: #334155; margin-top: 0; font-size: 20px;">Merhaba,</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                            Sizi <strong>Periodya Enterprise B2B Ağımıza</strong> katılmaya davet ediyoruz.
                            Şirketinizle dijital sözleşmeler, mutabakatlar ve B2B sipariş süreçlerini bu platform üzerinden yürütebilirsiniz.
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${inviteLink}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                Ağa Katıl ve Kayıt Ol
                            </a>
                        </div>
                        <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 0;">
                            Bu davet size ulaşmadıysa veya bir hata olduğunu düşünüyorsanız bu mesajı görmezden gelebilirsiniz.
                        </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #eaeaea;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Periodya Enterprise. Tüm hakları saklıdır.
                        </p>
                    </div>
                </div>
            `,
            companyId: user.companyId
        });

        if (!mailRes.success) {
            console.error("[Invite Route] Failed to send email:", mailRes.error);
            return NextResponse.json({ error: "E-posta gönderilirken bir hata oluştu: " + mailRes.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Davetiye gönderildi." });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
}
