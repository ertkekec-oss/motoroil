import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnvelopeDetailClient from "./EnvelopeDetailClient";

export default async function EnvelopeDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const { id } = await params;

    const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id },
        include: {
            recipients: {
                orderBy: { orderIndex: 'asc' }
            },
            auditEvents: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!envelope || envelope.tenantId !== tenantId) {
        return notFound();
    }

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <EnvelopeDetailClient envelope={envelope} />
            </div>
        </div>
    );
}
