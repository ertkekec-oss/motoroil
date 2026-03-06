import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import crypto from "crypto";
import Link from "next/link";
import { headers } from "next/headers";
import MutabakatClientUI from "./MutabakatClientUI";

export const metadata: Metadata = {
    title: "Mutabakat Portalı | Periodya",
    description: "Cari hesap mutabakat işlemleriniz için güvenli erişim portalı.",
};

export default async function ReconciliationPortalAccessPage({
    searchParams,
}: {
    searchParams: { token?: string };
}) {
    // 1. Validate Token format
    const token = await searchParams.token;
    if (!token || typeof token !== "string" || token.length !== 64) {
        return <InvalidTokenView message="Geçersiz veya eksik bağlantı." />;
    }

    // Rate Limiting Hook Placeholder
    // TODO: Implement token/IP based rate limiting here
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    // 2. Hash token and verify
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const portalToken = await prisma.reconciliationPortalToken.findUnique({
        where: { tokenHash },
        include: {
            reconciliation: {
                include: {
                    company: true,
                    account: true
                }
            }
        }
    });

    if (!portalToken) {
        return <InvalidTokenView message="Erişim izni bulunamadı." />;
    }

    if (portalToken.revokedAt) {
        return <InvalidTokenView message="Bu bağlantı iptal edilmiştir. Lütfen yeni bağlantı talep ediniz." />;
    }

    if (portalToken.expiresAt < new Date()) {
        return <InvalidTokenView message="Bu bağlantının süresi dolmuştur. Lütfen yeni bağlantı talep ediniz." />;
    }

    const recon = portalToken.reconciliation;

    // 3. Mark as used if first time and log audit
    if (!portalToken.usedAt) {
        await prisma.$transaction([
            prisma.reconciliationPortalToken.update({
                where: { id: portalToken.id },
                data: { usedAt: new Date() }
            }),
            prisma.reconciliationAuditEvent.create({
                data: {
                    tenantId: recon.tenantId,
                    reconciliationId: recon.id,
                    action: "VIEWED",
                    metaJson: { source: "PUBLIC_PORTAL", ip }
                }
            })
        ]);
    } else {
        // Just log the view
        await prisma.reconciliationAuditEvent.create({
            data: {
                tenantId: recon.tenantId,
                reconciliationId: recon.id,
                action: "VIEWED",
                metaJson: { source: "PUBLIC_PORTAL", note: "Subsequent view", ip }
            }
        });
    }

    // 4. Render UI depending on status
    const isCompleted = ['SIGNED', 'DISPUTED', 'VOID'].includes(recon.status);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Mutabakat Portalı</h1>
                        <p className="text-slate-400 text-sm mt-1">{recon.company.name}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        🤝
                    </div>
                </div>

                <MutabakatClientUI recon={recon} token={token} />

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500 rounded-b-2xl">
                    <div>
                        Güvenli Bağlantı ID: <span className="font-mono">{portalToken.id.substring(0, 8)}</span>
                    </div>
                    <div>
                        Periodya B2B Mutabakat Altyapısı
                    </div>
                </div>
            </div>
        </div>
    );
}

function InvalidTokenView({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center border border-slate-200 dark:border-slate-700">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Güvenli Erişim Hatası</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
                <Link href="/" className="inline-block px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
