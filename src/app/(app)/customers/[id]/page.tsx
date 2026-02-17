
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CustomerDetailClient from './CustomerDetailClient';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                category: true,
                transactions: {
                    orderBy: { date: 'desc' }
                },
                invoices: {
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
            .filter((t: any) => t.type !== 'SalesInvoice') // Fatura listesinde zaten var, mükerrer gösterme
            .map((t: any) => {
                const isCollection = (t.type === 'income' || t.type === 'Collection');
                const typeLabel = isCollection ? 'Tahsilat' :
                    t.type === 'Payment' ? 'Ödeme' :
                        t.type === 'Sales' ? 'Satış' :
                            t.type === 'Expense' ? 'Gider' : t.type;

                // Extract Order REF and clean description
                let orderId = null;
                let displayDesc = t.description || '';
                if (displayDesc.includes('| REF:')) {
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
                safeItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (Array.isArray(inv.items) ? inv.items : []);
            } catch { safeItems = []; }

            return {
                id: inv.id,
                date: new Date(inv.invoiceDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: inv.invoiceDate,
                type: 'Fatura',
                desc: `${inv.invoiceNo} - ${inv.isFormal ? 'Resmi' : 'Taslak'}`,
                amount: (inv.totalAmount || 0),
                color: '#3b82f6',
                items: safeItems
            };
        });

        const chkList = (customer.checks || []).map((c: any) => {
            const isReceivable = c.type.includes('Alınan');
            return {
                id: c.id,
                date: new Date(c.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: c.createdAt,
                type: isReceivable ? 'Tahsilat' : 'Ödeme', // Map to standard types for filter compatibility
                desc: `${isReceivable ? 'Çek Alındı' : 'Çek Verildi'}: ${c.bank} - ${c.number} (${c.status})`,
                amount: isReceivable ? -Number(c.amount) : Number(c.amount), // Receivables reduce balance (Credit), Payables increase (Debit) of supplier... wait.
                color: isReceivable ? '#10b981' : '#ef4444',
                items: null,
                orderId: null,
                isCheck: true // Flag to identify if needed
            };
        });

        const historyList = [...txs, ...invs, ...chkList].sort((a: any, b: any) => {
            const tA = new Date(a.rawDate).getTime();
            const tB = new Date(b.rawDate).getTime();
            return (isNaN(tA) || isNaN(tB)) ? 0 : tB - tA;
        });

        return <CustomerDetailClient customer={customer} historyList={historyList} />;
    } catch (err: any) {
        console.error("PAGE_CRASH_INFO:", err);
        return (
            <div style={{ padding: '40px', background: '#0f0f12', height: '100vh', color: '#ff4444', fontFamily: 'monospace' }}>
                <h1 style={{ fontSize: '24px' }}>⚠️ Server Component Error</h1>
                <p style={{ color: '#888', marginBottom: '20px' }}>An error occurred while rendering the customer detail page.</p>
                <div style={{ padding: '20px', background: 'rgba(255,b,0,0.05)', border: '1px solid rgba(255,0,0,0.2)', borderRadius: '8px' }}>
                    <strong>Message:</strong> {err.message} <br />
                    <strong>Digest:</strong> {err.digest}
                </div>
                <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Retry
                </button>
            </div>
        );
    }
}

