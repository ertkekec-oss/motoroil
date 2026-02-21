
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CustomerDetailClient from './CustomerDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Deeply convert Prisma Decimals to Numbers for safe serialization to Client Components
function serializeData(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serializeData);

    // Prisma Decimal check (if it has d and s properties or is explicitly from @prisma/client/runtime)
    if (obj.constructor && obj.constructor.name === 'Decimal') return Number(obj);

    const newObj: any = {};
    for (const key in obj) {
        newObj[key] = serializeData(obj[key]);
    }
    return newObj;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    let customerId = "";
    try {
        const { id } = await params;
        customerId = id;

        if (!id) {
            return (
                <div style={{ padding: '40px', background: '#0f0f12', height: '100vh', color: '#ff4444' }}>
                    <h1>Hata: Müşteri Kimliği Eksik</h1>
                </div>
            );
        }

        const customer: any = await prisma.customer.findUnique({
            where: { id },
            include: {
                transactions: {
                    where: { deletedAt: null },
                    orderBy: { date: 'desc' },
                    take: 50
                },
                invoices: {
                    where: { deletedAt: null },
                    orderBy: { invoiceDate: 'desc' },
                    take: 50
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
            return notFound();
        }

        // Fetch category separately and resiliently
        if (customer.categoryId) {
            try {
                // Using prismaBase to avoid isolation middleware if it's the one causing issues
                // Also caught in try/catch to prevent page crash if column is missing
                const cat = await (prisma as any).customerCategory.findUnique({
                    where: { id: customer.categoryId }
                });
                customer.category = cat;
            } catch (e) {
                console.warn("Failed to fetch customer category (likely schema mismatch):", e);
                customer.category = null;
            }
        }

        // Build a map: orderId -> invoice, for quickly checking if a sale already has a formal invoice
        const formalInvoiceByOrderId = new Map<string, any>();
        (customer.invoices || []).forEach((inv: any) => {
            if (inv.orderId && inv.isFormal) {
                formalInvoiceByOrderId.set(inv.orderId, inv);
            }
        });

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
                    amount: isCollection ? -Number(t.amount || 0) : Number(t.amount || 0),
                    color: isCollection ? '#10b981' : (t.type === 'Payment' ? '#3b82f6' : (t.type === 'Sales' ? '#10b981' : '#ef4444')),
                    items: null,
                    orderId: orderId,
                    // If an orderId exists and a formal invoice was created for it, mark as invoiced
                    isFormal: orderId ? (formalInvoiceByOrderId.has(orderId) ? true : false) : false,
                    formalUuid: orderId ? (formalInvoiceByOrderId.get(orderId)?.formalUuid || null) : null,
                    formalInvoiceId: orderId ? (formalInvoiceByOrderId.get(orderId)?.id || null) : null
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
                amount: Number(inv.totalAmount || 0),
                color: '#3b82f6',
                items: safeItems,
                isFormal: inv.isFormal || false,
                formalUuid: inv.formalUuid || null,
                formalType: inv.formalType || null
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

        // Use deep serialization for safety
        return <CustomerDetailClient customer={serializeData(customer)} historyList={serializeData(historyList)} />;
    } catch (err: any) {
        // If notFound() was called, its error should bubble up to Next.js handled properly
        if (err.digest === 'NEXT_NOT_FOUND' || err.message?.includes('NEXT_NOT_FOUND')) {
            throw err;
        }

        console.error("PAGE_CRASH_INFO:", err);
        return (
            <div style={{ padding: '40px', background: '#0f0f12', minHeight: '100vh', color: '#ff4444', fontFamily: 'sans-serif' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️ Sunucu Hatası (Render)</h1>
                    <p style={{ color: '#888', marginBottom: '20px' }}>Müşteri verisi işlenirken bir hata oluştu. Lütfen teknik ekibe hata mesajını iletin.</p>

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

                        <div style={{ marginTop: '16px', fontSize: '11px', opacity: 0.4 }}>
                            <strong>ID:</strong> {customerId} | <strong>Digest:</strong> {err.digest || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
