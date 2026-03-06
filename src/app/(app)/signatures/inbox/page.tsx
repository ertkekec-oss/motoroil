import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function InboxSignaturesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const userEmail = session.user?.email || '';

    // fetch envelopes where the user is a recipient and their status is practically waiting on them
    const inboxItems = await prisma.signatureRecipient.findMany({
        where: {
            email: userEmail,
            envelope: { tenantId }
        },
        orderBy: { envelope: { createdAt: 'desc' } },
        include: { envelope: true }
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
                            Bana Gelenler (Inbox)
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Onayınıza veya imzanıza sunulan aktif tüm belgeler.</p>
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gönderim Tarihi</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Zarf Başlığı</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sizin Durumunuz</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inboxItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Gelen kutunda onay bekleyen imza yok.</td>
                                </tr>
                            ) : inboxItems.map((r: any) => (
                                <tr key={r.id} className="hover:bg-slate-800/20" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>{new Date(r.envelope.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 'bold' }}>
                                        {r.envelope.title}
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.envelope.documentFileName}</div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: r.status === 'SIGNED' ? 'rgba(16,185,129,0.1)' : r.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                            color: r.status === 'SIGNED' ? '#10b981' : r.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Link href={`/signatures/envelopes/${r.envelope.id}`} style={{ padding: '6px 16px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }} className="hover:bg-blue-500/20 transition-all">
                                            Zarf Detayına Git
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
