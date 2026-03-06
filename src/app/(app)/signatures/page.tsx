import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SignaturesDashboardPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const userEmail = session.user?.email || '';

    // Calculate real stats
    const totalEnvelopes = await prisma.signatureEnvelope.count({ where: { tenantId } });
    const pendingEnvelopes = await prisma.signatureEnvelope.count({ where: { tenantId, status: { in: ['PENDING', 'IN_PROGRESS'] } } });
    const completedEnvelopes = await prisma.signatureEnvelope.count({ where: { tenantId, status: 'COMPLETED' } });
    const inboxCount = await prisma.signatureRecipient.count({
        where: {
            envelope: { tenantId },
            email: userEmail,
            status: { in: ['PENDING', 'VIEWED'] }
        }
    });

    const recentEvents = await prisma.signatureAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { envelope: true }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            İmza Panosu
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Tüm dijital sözleşme ve mutabakat imza süreçleri.</p>
                    </div>
                    <Link href="/signatures/envelopes" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                        Zarflara Git
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {[
                        { title: 'Tümü', route: '/signatures/envelopes', val: totalEnvelopes, color: '#3b82f6' },
                        { title: 'Bana Gelenler', route: '/signatures/inbox', val: inboxCount, color: '#10b981' },
                        { title: 'Bekleyenler (Zarflar)', route: '/signatures/pending', val: pendingEnvelopes, color: '#f59e0b' },
                        { title: 'Tamamlananlar', route: '/signatures/completed', val: completedEnvelopes, color: '#8b5cf6' }
                    ].map((c, i) => (
                        <Link href={c.route} key={i} style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="hover:border-white/20 transition-all">
                            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.title}</span>
                            <span style={{ fontSize: '36px', fontWeight: '800', color: c.color, lineHeight: 1 }}>{c.val}</span>
                        </Link>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Son Sistem Hareketleri</h2>
                    {recentEvents.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Henüz kayıt yok.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentEvents.map(a => (
                                <Link href={`/signatures/envelopes/${a.envelopeId}`} key={a.id} style={{ textDecoration: 'none', display: 'flex', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'center' }} className="hover:bg-white/5 cursor-pointer">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                        {a.action.includes('VIEWED') ? '👁️' : a.action.includes('SIGNED') ? '✅' : a.action.includes('REJECTED') ? '❌' : a.action.includes('COMPLETED') ? '🎉' : '📝'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{a.action.replace(/_/g, ' ')}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleString()}</div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            Belge: <span style={{ color: '#3b82f6', fontWeight: '600' }}>{a.envelope.title}</span> • {a.envelope.documentFileName}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
