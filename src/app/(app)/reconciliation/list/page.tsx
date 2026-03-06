import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function ReconciliationListPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
    const session = await getSession();
    if (!session) return notFound();

    const tenantId = session.companyId || (session as any).tenantId;
    const { category } = await searchParams;

    const whereClause: any = { tenantId };
    if (category) {
        whereClause.documentCategory = category;
    }

    // Fetch latest 50 reconciliations for simplicity in V1
    const recons = await prisma.reconciliation.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
            account: { select: { name: true, phone: true } },
            items: true // For balance overview if needed, or we just rely on `reconciliationType`
        }
    });

    return (
        <div className="flex flex-col flex-1" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', padding: '40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            Mutabakat Listesi
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Firmalara gönderilen tüm mutabakatların (BA/BS, Cari Hesap) güncel durumu.</p>
                    </div>
                    <div>
                        <Link href="/accounting" style={{ padding: '10px 16px', borderRadius: '8px', background: '#3b82f6', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }} className="hover:bg-blue-600">
                            + Yeni Oluştur (Muhasebe)
                        </Link>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    {/* Filters */}
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filtrele:</div>
                        <form method="GET" style={{ margin: 0, padding: 0, display: 'flex', gap: '16px' }}>
                            <select
                                name="category"
                                defaultValue={category || ''}
                                onChange={(e) => e.target.form?.submit()}
                                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', fontSize: '12px' }}>
                                <option value="" style={{ color: 'black' }}>Tüm Kategoriler</option>
                                <option value="RECONCILIATION" style={{ color: 'black' }}>Mutabakatlar</option>
                                <option value="CONTRACT" style={{ color: 'black' }}>Sözleşmeler</option>
                                <option value="AGREEMENT" style={{ color: 'black' }}>Sözleşme & Anlaşma</option>
                                <option value="OTHER" style={{ color: 'black' }}>Diğer</option>
                            </select>
                            <select style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px' }}>
                                <option>Tüm Durumlar</option>
                                <option>Bekleyenler (SENT/VIEWED)</option>
                                <option>Onaylananlar (SIGNED)</option>
                                <option>İtiraz Edilenler (DISPUTED)</option>
                            </select>
                            <input type="text" placeholder="Firma Adı veya Zarf ID..." style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '12px', width: '250px' }} />
                            <button style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                Uygula
                            </button>
                        </form>
                    </div>

                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '150px minmax(200px, 2fr) 150px 150px 100px', gap: '16px', background: 'rgba(255,255,255,0.01)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        <div>Dönem / Tür</div>
                        <div>Firma (Cari)</div>
                        <div>Durum</div>
                        <div>Son İşlem</div>
                        <div style={{ textAlign: 'center' }}>Aksiyon</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {recons.length === 0 ? (
                            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Henüz mutabakat kaydı bulunamadı.
                            </div>
                        ) : (
                            recons.map((recon, i) => {
                                const isDisputed = recon.status === 'DISPUTED';
                                const isOk = recon.status === 'SIGNED';
                                const isPending = recon.status === 'SENT' || recon.status === 'VIEWED' || recon.status === 'SIGNING';

                                return (
                                    <div key={recon.id} style={{ display: 'grid', gridTemplateColumns: '150px minmax(200px, 2fr) 150px 150px 100px', gap: '16px', padding: '16px 24px', borderBottom: i !== recons.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }} className="hover:bg-white/5 transition-colors">
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '4px' }}>
                                                {new Date(recon.periodEnd).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {recon.reconciliationType}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                                {recon.account ? recon.account.name : 'Silinmiş / Bilinmeyen Hesap'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                                                Zarf ID: {recon.id.substring(0, 8).toUpperCase()}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: isOk ? 'rgba(16,185,129,0.1)' : isDisputed ? 'rgba(239,68,68,0.1)' : isPending ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', color: isOk ? '#10b981' : isDisputed ? '#ef4444' : isPending ? '#3b82f6' : 'var(--text-muted)' }}>
                                                {recon.status}
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(recon.updatedAt).toLocaleDateString('tr-TR')}
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <Link href={`/reconciliation/${recon.id}`} style={{ padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', textDecoration: 'none', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold' }} className="hover:bg-white/10">
                                                Detay
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
