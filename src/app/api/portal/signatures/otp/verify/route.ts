import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyPortalRateLimit } from '@/lib/portal-security';
import { createHash } from 'crypto';

export async function POST(req: Request) {
    try {
        const { token, phone, code } = await req.json();

        if (!token || !phone || !code) {
            return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
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
            return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
        }

        const envelope = session.envelope;

        if (!envelope.otpRequired) {
            return NextResponse.json({ error: 'Bu zarf için OTP istenmiyor' }, { status: 400 });
        }

        const codeHash = createHash('sha256').update(code).digest('hex');

        // Look for verification record
        // Get latest unexpired record
        const verifyRecord = await prisma.otpVerification.findFirst({
            where: {
                tenantId: envelope.tenantId,
                phone: phone,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!verifyRecord) {
            return NextResponse.json({ error: 'Geçerli bir doğrulama kodu bulunamadı veya süresi dolmuş.' }, { status: 400 });
        }

        if (verifyRecord.attempts >= 5) {
            return NextResponse.json({ error: 'Çok fazla hatalı deneme yapıldı. Lütfen yeni bir kod isteyiniz.' }, { status: 429 });
        }

        if (verifyRecord.codeHash !== codeHash) {
            await prisma.otpVerification.update({
                where: { id: verifyRecord.id },
                data: { attempts: { increment: 1 } }
            });

            await prisma.signatureAuditEvent.create({
                data: {
                    tenantId: envelope.tenantId,
                    envelopeId: envelope.id,
                    action: 'OTP_VERIFICATION_FAILED',
                    actorId: session.recipientId,
                    metaJson: { phone, attempts: verifyRecord.attempts + 1 }
                }
            });

            return NextResponse.json({ error: 'Hatalı kod.' }, { status: 400 });
        }

        // Generate verified otp token to be passed back implicitly
        // Let's create an extra verification signature scoped to this specific session & verification
        const verifiedToken = createHash('sha256').update(`${token}-${verifyRecord.id}-verified-scope-1`).digest('hex');

        // Note: For true production grade, this verifiedToken should be stored on the DB.
        // We will store it in the `codeHash` or a JSON field? Wait, we have `usedAt` and `attempts`
        // Instead of adding a new field, let's mark it used! And token generation is deterministic based on id
        await prisma.otpVerification.update({
            where: { id: verifyRecord.id },
            data: { usedAt: new Date() }
        });

        await prisma.signatureAuditEvent.create({
            data: {
                tenantId: envelope.tenantId,
                envelopeId: envelope.id,
                action: 'OTP_VERIFIED',
                actorId: session.recipientId,
                metaJson: { phone }
            }
        });

        return NextResponse.json({ success: true, verifiedToken });
    } catch (e: any) {
        console.error('[OTP VERIFY ERR]', e);
        return NextResponse.json({ error: 'Server err' }, { status: 500 });
    }
}
