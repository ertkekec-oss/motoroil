
import { notFound } from 'next/navigation';
import { prismaBase as prisma } from '@/lib/prismaBase';
import CustomerDetailClient from './CustomerDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return (
                <div style={{ padding: '40px', background: '#0f0f12', height: '100vh', color: '#ff4444' }}>
                    <h1>Hata: Müşteri Kimliği Eksik</h1>
                </div>
            );
        }

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                category: true,
                transactions: {
                    where: { deletedAt: null },
                    orderBy: { date: 'desc' }
                },
                invoices: {
                    where: { deletedAt: null },
                    orderBy: { invoiceDate: 'desc' }
                },
                warranties: {
                    orderBy: { createdAt: 'desc' }
                },
                checks: {
                    orderBy: { dueDate: 'asc' }
                }
            }
        });

        if (!customer) {
            notFound();
        }

        // Prepare history data on server to keep client component clean and fast
        const txs = (customer.transactions || [])
            .map((t: any) => {
                const isCollection = (t.type === 'income' || t.type === 'Collection');
                const typeLabel = isCollection ? 'Tahsilat' :
                    t.type === 'Payment' ? 'Ödeme' :
                        t.type === 'Sales' ? 'Satış' :
                            t.type === 'Expense' ? 'Gider' : t.type;

                // Extract Order REF and clean description
                let orderId = null;
                let displayDesc = t.description || '';
                if (displayDesc && displayDesc.includes('| REF:')) {
                    const parts = displayDesc.split('| REF:');
                    displayDesc = parts[0].trim();
                    orderId = parts[1]?.trim();
                }

                return {
                    id: t.id,
                    date: new Date(t.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    rawDate: t.date,
                    type: typeLabel,
                    desc: displayDesc,
                    amount: isCollection ? -(t.amount || 0) : (t.amount || 0),
                    color: isCollection ? '#10b981' : (t.type === 'Payment' ? '#3b82f6' : (t.type === 'Sales' ? '#10b981' : '#ef4444')),
                    items: null,
                    orderId: orderId
                };
            });

        const invs = (customer.invoices || []).map((inv: any) => {
            let safeItems = [];
            try {
                if (inv.items) {
                    safeItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (Array.isArray(inv.items) ? inv.items : []);
                }
            } catch { safeItems = []; }

            return {
                id: inv.id,
                date: new Date(inv.invoiceDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: inv.invoiceDate,
                type: 'Fatura',
                desc: `${inv.invoiceNo || 'Fatura'} - ${inv.isFormal ? 'Resmi' : 'Taslak'}`,
                amount: (inv.totalAmount || 0),
                color: '#3b82f6',
                items: safeItems
            };
        });

        const chkList = (customer.checks || []).map((c: any) => {
            const isReceivable = (c.type || '').includes('Alınan');
            return {
                id: c.id,
                date: new Date(c.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: c.createdAt,
                type: isReceivable ? 'Tahsilat' : 'Ödeme',
                desc: `${isReceivable ? 'Çek Alındı' : 'Çek Verildi'}: ${c.bank || '-'} - ${c.number || '-'} (${c.status || '-'})`,
                amount: isReceivable ? -Number(c.amount || 0) : Number(c.amount || 0),
                color: isReceivable ? '#10b981' : '#ef4444',
                items: null,
                orderId: null,
                isCheck: true
            };
        });

        const historyList = [...txs, ...invs, ...chkList].sort((a: any, b: any) => {
            const tA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
            const tB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
            return (isNaN(tA) || isNaN(tB)) ? 0 : tB - tA;
        });

        return <CustomerDetailClient customer={customer} historyList={historyList} />;
    } catch (err: any) {
        console.error("PAGE_CRASH_INFO:", err);
        return (
            <div style={{ padding: '40px', background: '#0f0f12', minHeight: '100vh', color: '#ff4444', fontFamily: 'sans-serif' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Sunucu Hatası</h1>
                    <p style={{ color: '#888', marginBottom: '20px' }}>Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin veya desteğe başvurun.</p>

                    <div style={{
                        padding: '24px',
                        background: 'rgba(255,0,0,0.05)',
                        border: '1px solid rgba(255,0,0,0.2)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        lineHeight: '1.6'
                    }}>
                        <strong style={{ color: '#fff' }}>Hata Mesajı:</strong><br />
                        <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', display: 'block', marginTop: '8px' }}>
                            {err.message || "Bilinmeyen hata"}
                        </code>

                        {err.digest && (
                            <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.6 }}>
                                <strong>Digest:</strong> {err.digest}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '24px',
                            padding: '12px 30px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            </div>
        );
    }
}

