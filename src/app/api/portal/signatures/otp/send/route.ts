import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNetgsmOtp } from '@/lib/otp/netgsm';
import { applyPortalRateLimit } from '@/lib/portal-security';
import { createHash } from 'crypto';

export async function POST(req: Request) {
    try {
        const { token, phone } = await req.json();

        if (!token || !phone) {
            return NextResponse.json({ error: 'Token and phone are required' }, { status: 400 });
        }

        const security = await applyPortalRateLimit(req, token);
        if (!security.ok) {
            return NextResponse.json({ error: security.error }, { status: security.status });
        }

        const session = await prisma.signatureSession.findUnique({
            where: { tokenHash: token },
            include: { envelope: true }
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const envelope = session.envelope;

        if (!envelope.otpRequired) {
            return NextResponse.json({ error: 'Bu zarf için OTP istenmiyor' }, { status: 400 });
        }

        const config = await prisma.otpProviderConfig.findUnique({
            where: { tenantId_providerName: { tenantId: envelope.tenantId, providerName: 'NETGSM' } }
        });

        if (!config || !config.isEnabled) {
            return NextResponse.json({ error: 'OTP configuration disabled' }, { status: 500 });
        }

        // Cooldown and rate limit check
        const recentAttempts = await prisma.otpVerification.findMany({
            where: {
                tenantId: envelope.tenantId,
                sessionId: session.id,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            },
            orderBy: { createdAt: 'desc' }
        });

        if (recentAttempts.length >= config.maxDailyAttempts) {
            return NextResponse.json({ error: 'Günlük limit aşıldı.' }, { status: 429 });
        }

        const lastAttempt = recentAttempts[0];
        if (lastAttempt && (Date.now() - lastAttempt.createdAt.getTime()) < (config.cooldownSeconds * 1000)) {
            return NextResponse.json({ error: `Lütfen ${config.cooldownSeconds} saniye bekledikten sonra tekrar deneyiniz.` }, { status: 429 });
        }

        // Generate 6 digit pin
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeHash = createHash('sha256').update(code).digest('hex');

        // Expire in TTL
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + config.ttlSeconds);

        await prisma.otpVerification.create({
            data: {
                tenantId: envelope.tenantId,
                phone,
                codeHash,
                expiresAt,
                sessionId: session.id
            }
        });

        const sendResult = await sendNetgsmOtp(config, phone, code);

        await prisma.signatureAuditEvent.create({
            data: {
                tenantId: envelope.tenantId,
                envelopeId: envelope.id,
                action: 'OTP_SENT',
                actorId: session.recipientId,
                metaJson: { phone, success: sendResult.success }
            }
        });

        if (!sendResult.success) {
            return NextResponse.json({ error: 'SMS gönderimi başarısız: ' + sendResult.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Doğrulama kodu gönderildi.' });
    } catch (e: any) {
        console.error('[OTP SEND ERR]', e);
        return NextResponse.json({ error: 'Server err' }, { status: 500 });
    }
}
