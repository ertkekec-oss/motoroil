import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SignClient from './SignClient';

export const dynamic = 'force-dynamic';

export default async function SignPortalPage({ searchParams }: { searchParams: { token?: string } }) {
    const { token } = await searchParams;

    if (!token) {
        return <div className="p-8 text-center text-red-500">Erişim anahtarı geçersiz veya girilmemiş.</div>;
    }

    const session = await prisma.signatureSession.findUnique({
        where: { tokenHash: token },
        include: {
            envelope: { include: { recipients: { orderBy: { orderIndex: 'asc' } } } },
            recipient: true
        }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <div className="bg-[#1e293b] text-slate-100 p-8 rounded-2xl shadow-xl text-center border border-slate-700">
                    <div className="text-4xl mb-4 opacity-70">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">Bağlantı Geçersiz</h2>
                    <p className="text-slate-400 font-medium">Bu imza veya onay bağlantısının süresi dolmuş, iptal edilmiş veya hatalı olabilir.</p>
                </div>
            </div>
        );
    }

    const env = session.envelope;

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 sm:p-8 flex justify-center font-sans">
            <div className="max-w-5xl w-full">

                {/* Branding/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight uppercase">Güvenli Belge Onayı</h1>
                    <p className="mt-2 text-sm text-slate-400 font-medium">
                        {env.title} <span className="opacity-70">({env.documentFileName})</span>
                    </p>
                </div>

                <SignClient
                    token={token}
                    envelope={{
                        id: env.id,
                        title: env.title,
                        status: env.status,
                        otpRequired: env.otpRequired,
                        createdAt: env.createdAt.toISOString()
                    }}
                    recipient={{
                        id: session.recipient.id,
                        name: session.recipient.name,
                        email: session.recipient.email,
                        role: session.recipient.role,
                        status: session.recipient.status,
                        orderIndex: session.recipient.orderIndex
                    }}
                    allRecipients={env.recipients.map(r => ({
                        id: r.id,
                        name: r.name,
                        role: r.role,
                        status: r.status,
                        orderIndex: r.orderIndex
                    }))}
                />
            </div>
        </div>
    );
}
