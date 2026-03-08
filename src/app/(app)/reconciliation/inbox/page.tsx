import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function ReconciliationInboxPage() {
    const session = await getSession();
    if (!session) return notFound();

    const userEmail = session.user?.email || '';

    // Inbox shows reconciliations where current user is a counterparty
    const counterparties = await prisma.reconciliationCounterparty.findMany({
        where: { email: userEmail },
        include: {
            reconciliation: {
                include: { customer: true, counterparties: true }
            }
        },
        orderBy: { reconciliation: { createdAt: 'desc' } }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <Link href="/reconciliation" style={{ color: '#888', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Panoya Dön
                        </Link>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Gelen Mutabakatlar
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Diğer firmalardan size (veya firmanıza) gönderilen mutabakat talepleri.</p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 150px 150px 150px 100px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Gönderen Firma & Zarf</div>
                        <div>Dönem / Tür</div>
                        <div>Talep Edilen Net Bakiye</div>
                        <div>Sizin Durumunuz</div>
                        <div style={{ textAlign: 'center' }}>Aksiyon</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {counterparties.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Henüz size gelen bir mutabakat talebi yok.
                            </div>
                        ) : (
                            counterparties.map((cp: any, i) => {
                                const recon = cp.reconciliation;
                                const isPending = cp.status === 'PENDING' || cp.status === 'VIEWED';
                                const isDisputed = cp.status === 'DISPUTED';
                                const isOk = cp.status === 'APPROVED';

                                return (
                                    <div key={cp.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 150px 150px 150px 100px', gap: '16px', padding: '16px 24px', borderBottom: i !== counterparties.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>
                                                {/* In a real app we'd map tenantId to Tenant name, but here we show Zarf ID as reference */}
                                                Gelen Zarf: {recon.id.substring(0, 8).toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                Gönderildi: {new Date(recon.createdAt).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                                {new Date(recon.periodEnd).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {((recon.metaJson as any)?.type) || 'Mutabakat'}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: Number(recon.balance) > 0 ? '#ef4444' : '#10b981' }}>
                                                {Math.abs(Number(recon.balance))} {recon.currency}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {Number(recon.balance) > 0 ? 'Borçlu Görünüyorsunuz' : 'Alacaklı Görünüyorsunuz'}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: isOk ? 'rgba(16,185,129,0.1)' : isDisputed ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: isOk ? '#10b981' : isDisputed ? '#ef4444' : '#3b82f6' }}>
                                                {cp.status}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <Link href={`/reconciliation/${recon.id}`} style={{ padding: '6px 16px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', textDecoration: 'none', border: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} className="hover:bg-blue-500/20">
                                                Yanıtla
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
