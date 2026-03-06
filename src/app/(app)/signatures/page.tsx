import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SignaturesDashboardPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    const envelopes = await prisma.signatureEnvelope.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {[
                        { title: 'Tümü', route: '/signatures/envelopes', val: envelopes.length, color: '#3b82f6' },
                        { title: 'Bana Gelenler', route: '/signatures/inbox', val: 0, color: '#10b981' },
                        { title: 'Bekleyenler', route: '/signatures/pending', val: envelopes.filter(e => e.status === 'PENDING').length, color: '#f59e0b' },
                        { title: 'Tamamlananlar', route: '/signatures/completed', val: envelopes.filter(e => e.status === 'COMPLETED').length, color: '#8b5cf6' }
                    ].map((c, i) => (
                        <Link href={c.route} key={i} style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="hover:border-white/20 transition-all">
                            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>{c.title}</span>
                            <span style={{ fontSize: '36px', fontWeight: '800', color: c.color, lineHeight: 1 }}>{c.val}</span>
                        </Link>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Son Zarf Hareketleri</h2>
                    {envelopes.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz bir zarf oluşturulmadı.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {envelopes.map(e => (
                                <Link href={`/signatures/envelopes/${e.id}`} key={e.id} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid transparent' }} className="hover:border-white/10 hover:bg-white/5">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{e.title}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{e.id.substring(e.id.length - 8).toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(e.createdAt).toLocaleDateString()}</span>
                                        <span style={{ padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>{e.status}</span>
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
