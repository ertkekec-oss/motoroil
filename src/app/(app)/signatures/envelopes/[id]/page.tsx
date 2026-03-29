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
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white pb-24">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 animate-in fade-in duration-500">
                <EnvelopeDetailClient envelope={envelope} currentUserEmail={session.user?.email || ''} />
            </div>
        </div>
    );
}
