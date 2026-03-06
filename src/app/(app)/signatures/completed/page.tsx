import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CompletedSignaturesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    const envelopes = await prisma.signatureEnvelope.findMany({
        where: { tenantId, status: 'COMPLETED' },
        orderBy: { updatedAt: 'desc' },
        include: { recipients: true }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/signatures" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Panoya Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Tamamlananlar
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Tüm imza katılımcıları tarafından imzalanmış geçerli sözleşmeler.</p>
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tarih</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Zarf Başlığı</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {envelopes.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Tamamlanmış zarar bulunmuyor.</td>
                                </tr>
                            ) : envelopes.map((env: any) => (
                                <tr key={env.id} className="hover:bg-slate-800/20" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>{new Date(env.updatedAt).toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 'bold' }}>{env.title}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Link href={`/signatures/envelopes/${env.id}`} style={{ padding: '6px 16px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }} className="hover:bg-blue-500/20">
                                            İmzalı Dosyayı İncele
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
