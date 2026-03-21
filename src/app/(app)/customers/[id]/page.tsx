
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
                },
                offers: {
                    orderBy: { createdAt: 'desc' },
                    include: { lines: true, terms: true }
                }
            }
        });

        if (!customer) {
            return notFound();
        }

        try {
            customer.paymentPlans = await prisma.paymentPlan.findMany({
                where: { customerId: customer.id },
                include: { installments: true },
                orderBy: { createdAt: 'desc' }
            });
        } catch (e) {
            console.warn("Could not fetch payment plans:", e);
            customer.paymentPlans = [];
        }

        // Fetch Marketplace Orders specifically for this Customer
        // Since marketplace orders may not have direct relation, we match by email and name
        const marketplaceOrders = await prisma.order.findMany({
            where: {
                companyId: customer.companyId,
                deletedAt: null,
                OR: [
                    ...(customer.email ? [{ customerEmail: customer.email }] : []),
                    { customerName: customer.name }
                ]
            },
            orderBy: { orderDate: 'desc' },
            take: 50
        });

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

        // Build a map: orderId -> invoice, for quickly checking if a sale already has an invoice (draft or formal)
        const invoiceByOrderId = new Map<string, any>();
        (customer.invoices || []).forEach((inv: any) => {
            if (inv.orderId) {
                invoiceByOrderId.set(inv.orderId, inv);
            }
        });

        // Track fetched order IDs so we can merge their corresponding Transactions and Invoices into a single row
        const fetchedOrderIds = new Set(marketplaceOrders.map((o: any) => o.id));

        // Prepare history data on server to keep client component clean and fast
        const txs = (customer.transactions || [])
            .map((t: any) => {
                const isCollection = (t.type === 'income' || t.type === 'Collection' || t.type === 'Senet' || t.type === 'Check');
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
                    // If an orderId exists and ANY invoice was created for it, mark as invoiced
                    isFormal: orderId ? invoiceByOrderId.has(orderId) : false,
                    formalUuid: orderId ? (invoiceByOrderId.get(orderId)?.formalUuid || null) : null,
                    formalInvoiceId: orderId ? (invoiceByOrderId.get(orderId)?.id || null) : null
                };
            })
            .filter((t: any) => {
                // Remove duplicate 'Sales' transactions if we also have the Order row
                if (t.type === 'Satış' && t.orderId && fetchedOrderIds.has(t.orderId)) {
                    return false;
                }
                return true;
            });


        const invs = (customer.invoices || [])
            .map((inv: any) => {
                let safeItems = [];
            try {
                if (inv.items) {
                    safeItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (Array.isArray(inv.items) ? inv.items : []);
                }
            } catch { safeItems = []; }

            const isWayslip = inv.status === 'İrsaliye' || (inv.invoiceNo && inv.invoiceNo.startsWith('IRS'));
            const typeLabel = isWayslip ? 'İrsaliye' : 'Fatura';
            // Show status (İptal Edildi, İrsaliye, Proforma, Onaylandı, etc) or Fallback
            const statusLabel = inv.status || (inv.isFormal ? 'Resmi' : 'Taslak');

            return {
                id: inv.id,
                date: new Date(inv.invoiceDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: inv.invoiceDate,
                type: typeLabel,
                desc: `${inv.invoiceNo || typeLabel} - ${statusLabel}`,
                amount: Number(inv.totalAmount || 0),
                color: isWayslip ? '#8b5cf6' : '#3b82f6',
                items: safeItems,
                isFormal: inv.isFormal || false,
                formalUuid: inv.formalUuid || null,
                formalType: inv.formalType || null,
                orderId: inv.orderId || null,
                status: inv.status || ''
            };
        })
        .filter((inv: any) => {
            // Remove standalone invoice row if the parent Order row will be displayed (which has the Faturalandı badge + Print button)
            if (inv.orderId && fetchedOrderIds.has(inv.orderId)) {
                return false;
            }
            return true;
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

        const txsByOrderId = new Map<string, any>();
        txs.forEach((t: any) => {
            if (t.orderId) {
                txsByOrderId.set(t.orderId, t);
            }
        });

        const orderList = marketplaceOrders.map((o: any) => {
            let safeItems = [];
            try {
                if (o.items) {
                    safeItems = typeof o.items === 'string' ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : []);
                }
            } catch { safeItems = []; }

            const mplace = o.marketplace === 'B2B_NETWORK' ? 'B2B Ağı' : o.marketplace === 'trendyol' ? 'Trendyol' : o.marketplace === 'n11' ? 'N11' : o.marketplace === 'hepsiburada' ? 'Hepsiburada' : o.marketplace === 'pazarama' ? 'Pazarama' : (o.marketplace === 'POS' ? 'POS' : o.marketplace);
            let currentDesc = `${mplace} Siparişi - #${o.orderNumber || '-'} (${o.status || '-'})`;
            
            let paymentStr = "";
            let parsedRaw: any = {};
            try {
                parsedRaw = typeof o.rawData === 'string' ? JSON.parse(o.rawData) : (o.rawData || {});
            } catch(e) {}
            
            let pm = parsedRaw?.paymentMode;
            if (!pm) {
                const linkedTx = txsByOrderId.get(o.id);
                if (linkedTx) {
                    const d = linkedTx.desc || '';
                    if (d.includes('Kredi Kartı')) pm = 'card';
                    else if (d.includes('Nakit')) pm = 'cash';
                    else if (d.includes('Havale') || d.includes('EFT')) pm = 'transfer';
                    else if (d.includes('Veresiye') || d.includes('Cari Hesap')) pm = 'account';
                }
            }

            if (pm === 'cash') paymentStr = ' [Nakit]';
            else if (pm === 'card' || pm === 'credit_card') paymentStr = ' [Kredi Kartı]';
            else if (pm === 'transfer' || pm === 'bank_transfer') paymentStr = ' [Havale/EFT]';
            else if (pm === 'account' || pm === 'veresiye') paymentStr = ' [Veresiye]';

            currentDesc += paymentStr;

            const linkedInvoice = invoiceByOrderId.get(o.id);
            if (linkedInvoice) {
                currentDesc += ` | Fatura: ${linkedInvoice.invoiceNo || 'Taslak'}`;
            }

            return {
                id: o.id,
                date: new Date(o.orderDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: o.orderDate,
                type: 'Satış', // Puts it in "Satış ve Faturalar" and "Tüm Hareketler"
                desc: currentDesc,
                amount: Number(o.totalAmount || 0),
                color: '#f59e0b', // A different color for marketplace orders
                items: safeItems,
                orderId: o.id,
                isMarketplaceOrder: true,
                isFormal: !!linkedInvoice, // We keep this to indicate an invoice exists
                realIsFormal: linkedInvoice?.isFormal || false,
                formalUuid: linkedInvoice?.formalUuid || null,
                formalInvoiceId: linkedInvoice?.id || null,
                linkedInvoiceStatus: linkedInvoice?.status || null
            };
        });

        const planList = (customer.paymentPlans || []).map((p: any) => {
            const isCanceled = p.status === 'İptal' || p.status === 'Cancelled'; 
            return {
                id: p.id,
                date: new Date(p.createdAt || p.startDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                rawDate: p.createdAt || p.startDate,
                type: 'Vadelendirme',
                desc: `${p.title || 'Ödeme Planı'} ${isCanceled ? '(İptal Edildi)' : ''} - ${p.installmentCount || p.installments?.length || 0} Taksit`,
                amount: Number(p.totalAmount || 0),
                color: isCanceled ? '#ef4444' : '#8b5cf6', // purple 
                items: null,
                orderId: p.description || null,
                isPlan: true,
                status: p.status
            };
        });

        const historyList = [...txs, ...invs, ...orderList, ...planList]
            .sort((a: any, b: any) => {
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
