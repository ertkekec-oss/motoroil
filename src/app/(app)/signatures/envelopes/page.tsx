import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function EnvelopesPage() {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;

    const envelopes = await prisma.signatureEnvelope.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        include: {
            recipients: true
        }
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
                            Belge ve Zarflar
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Tüm imza süreçlerinizin detaylı listesi.</p>
                    </div>

                    <button style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                        + Yeni Zarf Oluştur
                    </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Oluşturulma</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Başlık (Zarf ID)</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alıcı Sayısı</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durum</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {envelopes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Mevcut zarf bulunmuyor.</td>
                                </tr>
                            ) : envelopes.map((env: any) => (
                                <tr key={env.id} className="hover:bg-slate-800/20" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                        {new Date(env.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                        <div style={{ fontWeight: '700', color: 'white' }}>{env.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                                            Zarf: {env.id.substring(env.id.length - 8).toUpperCase()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: '13px' }}>
                                        <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>{env.recipients?.length || 0} Kişi</span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                                            background: env.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : env.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                                            color: env.status === 'PENDING' ? '#f59e0b' : env.status === 'COMPLETED' ? '#10b981' : 'var(--text-muted)'
                                        }}>
                                            {env.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Link href={`/signatures/envelopes/${env.id}`} style={{ display: 'inline-flex', padding: '6px 16px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }} className="hover:bg-white/10">
                                            Detay
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
