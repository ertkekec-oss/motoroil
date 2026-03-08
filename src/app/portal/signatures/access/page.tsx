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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center border">
                    <div className="text-4xl mb-4 opacity-50">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">Bağlantı Geçersiz</h2>
                    <p className="text-gray-500">Bu imza veya onay bağlantısının süresi dolmuş, iptal edilmiş veya hatalı olabilir.</p>
                </div>
            </div>
        );
    }

    const env = session.envelope;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full">

                {/* Branding/Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Güvenli Belge Onayı</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {env.title} ({env.documentFileName})
                    </p>
                </div>

                <SignClient
                    token={token}
                    envelope={{
                        id: env.id,
                        title: env.title,
                        status: env.status,
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
