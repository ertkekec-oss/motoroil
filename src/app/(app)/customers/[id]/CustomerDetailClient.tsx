
"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useModal } from '@/contexts/ModalContext';
import StatementModal from '@/components/modals/StatementModal';
import Pagination from '@/components/Pagination';

export default function CustomerDetailClient({ customer, historyList }: { customer: any, historyList: any[] }) {
    const router = useRouter();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'payments' | 'documents' | 'services' | 'warranties' | 'checks'>('all');
    const [documents, setDocuments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [qrPlate, setQrPlate] = useState<string | null>(null);
    const [docsLoading, setDocsLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    // PAGINATION
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Fetch documents on tab change
    const fetchDocuments = async () => {
        setDocsLoading(true);
        try {
            const res = await fetch(`/api/customers/${customer.id}/documents`);
            const data = await res.json();
            if (data.success) {
                setDocuments(data.documents);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDocsLoading(false);
        }
    };

    const fetchServices = async () => {
        setServicesLoading(true);
        try {
            const res = await fetch(`/api/services?customerId=${customer.id}`);
            const data = await res.json();
            if (data.success) {
                setServices(data.services);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setServicesLoading(false);
        }
    };

    // Auto-fetch services to get plate info for Header Buttons
    useEffect(() => {
        fetchServices();
    }, []);

    const handleFileUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            showError('Hata', 'Sadece PDF, PNG ve JPEG dosyaları yüklenebilir.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            setUploading(true);
            try {
                const res = await fetch(`/api/customers/${customer.id}/documents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileData: base64
                    })
                });
                const data = await res.json();
                if (data.success) {
                    await fetchDocuments();
                    showSuccess('Başarılı', 'Dosya yüklendi.');
                } else {
                    showError('Hata', 'Yükleme hatası: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                showError('Hata', 'Yükleme sırasında hata oluştu.');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDoc = async (docId: string) => {
        showConfirm('Dosyayı Sil', 'Dosyayı silmek istediğinize emin misiniz?', async () => {
            try {
                await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
                setDocuments(prev => prev.filter(d => d.id !== docId));
                showSuccess('Başarılı', 'Dosya silindi.');
            } catch (e) {
                showError('Hata', 'Silinemedi.');
            }
        });
    };

    const handleViewDoc = async (docId: string, type: string) => {
        try {
            const res = await fetch(`/api/documents/${docId}`);
            const data = await res.json();
            if (data.success && data.document) {
                const win = window.open("");
                if (win) {
                    if (type === 'application/pdf') {
                        win.document.write(`<iframe width="100%" height="100%" src="${data.document.fileData}"></iframe>`);
                    } else {
                        win.document.write(`<img src="${data.document.fileData}" style="max-width:100%"/>`);
                    }
                }
            }
        } catch (e) { console.error(e); }
    };

    const { showSuccess, showError, showConfirm, showWarning } = useModal();
    const { currentUser } = useApp();
    const { refreshCustomers } = useCRM();
    const { refreshTransactions, collectCheck, kasalar } = useFinancials();
    const { products } = useInventory();
    const { warranties: warrantyPeriods } = useSettings();

    // Statement Modal State
    const [statementOpen, setStatementOpen] = useState(false);
    const [statementType, setStatementType] = useState<'summary' | 'detailed'>('summary');

    // Invoice Conversion State
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isConverting, setIsConverting] = useState(false);

    // Invoice Share State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<any>(null);

    // Check Collection State
    const [showCheckCollectModal, setShowCheckCollectModal] = useState(false);
    const [activeCheck, setActiveCheck] = useState<any>(null);
    const [targetKasaId, setTargetKasaId] = useState('');
    const [isProcessingCollection, setIsProcessingCollection] = useState(false);

    // PLAN MODAL STATE
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planData, setPlanData] = useState({
        title: '', totalAmount: '', installmentCount: '3', startDate: new Date().toISOString().split('T')[0],
        type: 'Kredi', direction: 'IN', customerId: '', supplierId: '', isExisting: true
    });

    const handleOpenPlanModal = (item: any) => {
        setPlanData({
            title: item.desc || 'Vadeli Satış Planı',
            totalAmount: Math.abs(item.amount).toString(),
            installmentCount: '3',
            startDate: new Date().toISOString().split('T')[0],
            type: 'Kredi',
            direction: 'IN', // Müşteri için
            customerId: customer.id,
            supplierId: '',
            isExisting: true // Default: Mevcut bakiyeden
        });
        setShowPlanModal(true);
    };

    const handleSavePlan = async () => {
        if (!planData.title || !planData.totalAmount || !planData.installmentCount) return;

        try {
            const res = await fetch('/api/financials/payment-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...planData, branch: 'Merkez' })
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Başarılı', 'Ödeme planı oluşturuldu.');
                setShowPlanModal(false);
                refreshTransactions(); // Refresh history
            } else {
                showError('Hata', data.error || 'Plan oluşturulamadı');
            }
        } catch (e) { showError('Hata', 'İşlem sırasında hata oluştu'); }
    };

    const handleExecuteCheckCollect = async () => {
        if (!activeCheck || !targetKasaId) return;
        setIsProcessingCollection(true);
        try {
            const res = await collectCheck(activeCheck.id, targetKasaId);
            if (res?.success) {
                showSuccess("Başarılı", `${activeCheck.type.includes('Alınan') ? 'Tahsilat' : 'Ödeme'} işlemi tamamlandı.`);
                setShowCheckCollectModal(false);
                setActiveCheck(null);
                router.refresh(); // Refresh page to update balances and history
            } else {
                showError("Hata", res?.error || "İşlem başarısız.");
            }
        } catch (e) {
            showError("Hata", "Bir hata oluştu.");
        } finally {
            setIsProcessingCollection(false);
        }
    };

    // Editable Items State
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [taxEditIndex, setTaxEditIndex] = useState<number | null>(null);
    const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
    const [discountValue, setDiscountValue] = useState(0);

    // RETURN LOGIC STATES
    const [processingIds, setProcessingIds] = useState<string[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);

    const handleReturnTransaction = (id: string) => {
        showConfirm("İade/İptal Onayı", "Bu işlemi iptal etmek ve iade almak istediğinize emin misiniz?\n\nBu işlem:\n• Stokları geri yükler\n• Bakiyeyi günceller\n• Kasa işlemini tersine çevirir", async () => {
            setProcessingIds(prev => [...prev, id]);
            try {
                const res = await fetch(`/api/financials/transactions?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess("Başarılı", "İşlem iade alındı/iptal edildi.");
                    setCompletedIds(prev => [...prev, id]);
                    // Don't refresh immediately to show locked state
                    // router.refresh();
                } else {
                    showError("Hata", data.error || "İşlem yapılamadı.");
                }
            } catch (e) {
                showError("Hata", "Bağlantı hatası.");
            } finally {
                setProcessingIds(prev => prev.filter(pid => pid !== id));
            }
        });
    };

    // Warranty State
    const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
    const [warranties, setWarranties] = useState<any[]>(customer.warranties || []);
    const [newWarranty, setNewWarranty] = useState({
        invoiceId: '',
        productId: '',
        productName: '',
        serialNo: '',
        period: '2 Yıl', // 6 Ay, 1 Yıl, 2 Yıl
        startDate: new Date().toISOString().split('T')[0]
    });

    // Use real invoices from history for warranty selection
    const customerInvoices = useMemo(() => {
        return historyList
            .filter(item => item.type === 'Fatura')
            .map(inv => ({
                id: inv.id,
                number: (inv.desc || '').split(' - ')[0] || 'Fatura',
                date: (inv.date || '').split(' ')[0] || 'Bilinmiyor',
                total: inv.amount,
                items: inv.items || []
            }));
    }, [historyList]);

    const handleStartWarranty = async () => {
        if (!newWarranty.invoiceId || !newWarranty.productId || !newWarranty.serialNo) {
            showWarning('Eksik Bilgi', 'Lütfen tüm alanları doldurunuz.');
            return;
        }

        const selectedInv = customerInvoices.find(i => i.id.toString() === newWarranty.invoiceId);

        // Calculate End Date
        let months = 24;
        if (newWarranty.period.includes('Ay')) {
            months = parseInt(newWarranty.period.split(' ')[0]);
        } else if (newWarranty.period.includes('Yıl')) {
            months = parseInt(newWarranty.period.split(' ')[0]) * 12;
        }

        const start = new Date(newWarranty.startDate);
        const endDateObj = new Date(start);
        endDateObj.setMonth(endDateObj.getMonth() + months);
        const endDate = endDateObj.toISOString().split('T')[0];

        const warrantyRecord = {
            productName: newWarranty.productName,
            serialNo: newWarranty.serialNo,
            startDate: newWarranty.startDate,
            endDate: endDate,
            period: newWarranty.period,
            invoiceNo: selectedInv?.number || '-'
        };

        try {
            const res = await fetch(`/api/customers/${customer.id}/warranties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(warrantyRecord)
            });

            const savedWarranty = await res.json();

            if (res.ok) {
                setWarranties([savedWarranty, ...warranties]);
                setWarrantyModalOpen(false);
                showSuccess('Garanti Başlatıldı', 'Ürün dijital karneye işlendi.');

                // Reset form
                setNewWarranty({
                    invoiceId: '',
                    productId: '',
                    productName: '',
                    serialNo: '',
                    period: '2 Yıl',
                    startDate: new Date().toISOString().split('T')[0]
                });
            } else {
                showError('Hata', 'Hata: ' + (savedWarranty.error || 'Garanti kaydedilemedi.'));
            }
        } catch (e) {
            console.error(e);
            showError('Hata', 'Bir bağlantı hatası oluştu.');
        }
    };


    // Product Picker State
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const handleOpenInvoicing = async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            const data = await res.json();
            if (data.success) {
                const order = data.order;
                console.log('📦 Order data:', order);
                console.log('📦 Order items (raw):', order.items);

                setSelectedOrder(order);

                // Initialize editable items
                let initialItems = [];
                try {
                    initialItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                } catch (e) {
                    console.error('❌ Failed to parse order items:', e);
                    initialItems = [];
                }

                console.log('📦 Parsed items:', initialItems);

                if (initialItems.length === 0) {
                    showError("Hata", "Bu siparişte ürün bulunamadı. Sipariş detaylarını kontrol edin.");
                    return;
                }

                const mappedItems = initialItems.map((it: any) => {
                    const qty = Number(it.qty || it.quantity || 1);

                    // Look up actual product to get real pricing/vat/otv if possible
                    const realProduct = products.find(p => String(p.id) === String(it.productId) || p.name === it.name);

                    const vatRate = realProduct ? Number(realProduct.salesVat || 20) : Number(it.vat || 20);
                    const otvType = realProduct ? (realProduct.otvType || 'Ö.T.V yok') : 'Ö.T.V yok';
                    const otvRate = realProduct ? Number(realProduct.salesOtv || 0) : 0;
                    const oivRate = realProduct ? Number(realProduct.salesOiv || 0) : 0;

                    // PRICE RESOLUTION LOGIC
                    // 1. Try to get price from order item (it.price or it.unitPrice)
                    // 2. If 0 and we found the product, use current product list price (realProduct.price)
                    let grossPrice = Number(it.price || it.unitPrice || 0);

                    if (grossPrice === 0 && realProduct) {
                        grossPrice = Number(realProduct.price || 0);
                        console.log(`⚠️ Price missing in order for ${it.name}, using list price: ${grossPrice}`);
                    }

                    // Net Price calculation (Gross -> Net)
                    let netPrice = grossPrice;
                    if (otvType === 'yüzdesel Ö.T.V') {
                        netPrice = grossPrice / ((1 + otvRate / 100) * (1 + vatRate / 100));
                    } else if (otvType === 'maktu Ö.T.V') {
                        netPrice = (grossPrice / (1 + vatRate / 100)) - otvRate;
                    } else {
                        netPrice = grossPrice / (1 + vatRate / 100);
                    }

                    return {
                        ...it,
                        productId: realProduct?.id || it.productId, // Ensure we map to the correct product ID if found
                        name: it.name || it.productName || realProduct?.name || 'Ürün',
                        qty,
                        price: netPrice,
                        vat: vatRate,
                        otv: otvRate,
                        otvType: otvType,
                        oiv: oivRate
                    };
                });

                console.log('✅ Mapped invoice items:', mappedItems);

                setInvoiceItems(mappedItems);
                setDiscountValue(0);
                setDiscountType('percent');

                // Open modal after state is set
                setTimeout(() => {
                    setInvoiceModalOpen(true);
                }, 100);
            } else {
                showError("Hata", data.error || "Sipariş detayları alınamadı.");
            }
        } catch (e: any) {
            console.error("handleOpenInvoicing failed:", e);
            showError("Hata", "Bağlantı sorunu veya veri hatası: " + (e.message || "Bilinmeyen hata"));
        }
    };

    const handleConvertToInvoice = async (invoiceData: any) => {
        setIsConverting(true);
        try {
            const res = await fetch('/api/sales/invoices/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    customerId: customer.id,
                    items: invoiceItems,
                    discount: { type: discountType, value: discountValue },
                    ...invoiceData
                })
            });
            const data = await res.json();
            if (data.success) {
                // If it's formal, we need to call the "formal-send" action
                if (invoiceData.isFormal) {
                    try {
                        const formalRes = await fetch('/api/sales/invoices', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'formal-send',
                                invoiceId: data.invoice.id
                            })
                        });
                        const formalData = await formalRes.json();
                        if (formalData.success) {
                            setLastInvoice({ ...data.invoice, ...formalData });
                            setShareModalOpen(true);
                            setInvoiceModalOpen(false);
                            showSuccess("Başarılı", "Resmi fatura oluşturuldu ve GİB sistemine gönderildi.");
                        } else {
                            showError("Hata", "Fatura oluşturuldu ancak gönderilemedi: " + formalData.error);
                        }
                    } catch (err) {
                        showError("Hata", "Gönderim sırasında hata oluştu.");
                    }
                } else {
                    showSuccess("Başarılı", "Fatura başarıyla oluşturuldu.");
                    setInvoiceModalOpen(false);
                }

                router.refresh();
                // Refresh data
                await Promise.all([refreshCustomers(), refreshTransactions()]);
            } else {
                showError("Hata", data.error || "Fatura oluşturulamadı.");
            }
        } catch (e) {
            showError("Hata", "İşlem sırasında bir hata oluştu.");
        } finally {
            setIsConverting(false);
        }
    };

    // Safe Access Helper
    const val = (v: any, def: any = '') => v !== null && v !== undefined ? v : def;

    // Calculate effective balance including portfolio checks
    const portfolioChecks = (customer.checks || [])
        .filter((c: any) => c.type.includes('Alınan') && ['Portföyde', 'Beklemede'].includes(c.status))
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

    const rawBalance = Number(val(customer?.balance, 0));
    const balance = rawBalance + (rawBalance >= 0 ? portfolioChecks : portfolioChecks);
    // Wait, if balance is negative (Customer Credited), adding check (Asset) should reduce the credit?
    // No. 
    // Scenario 1: Customer owes 1000. Balance = 1000. Check 1000 received. Balance becomes 0.
    // Display should be 1000 (Risk/Open). So 0 + 1000 = 1000. Correct.
    // Scenario 2: Customer balance 0. Check 1000 received. Balance = -1000 (Creditor)? No, usually Check receipt credits the customer account.
    // If I invoice 1000, 120 Debt 1000. Balance 1000.
    // Receive Check 1000. 120 Credit 1000. Balance 0.
    // I want to see 1000. So Net Balance (0) + Portfolio Check (1000) = 1000. Correct.

    const balanceColor = balance > 0 ? '#ef4444' : '#10b981'; // Borçlu: Red, Alacaklı: Green

    // Filter History
    const filteredHistory = historyList.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'sales') return item.type === 'Fatura' || item.type === 'Satış';
        if (activeTab === 'payments') return item.type === 'Tahsilat' || item.type === 'Ödeme' || item.type === 'Gider';
        return true;
    });

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="container" style={{ padding: '30px 20px', maxWidth: '1400px', margin: '0 auto' }}>

            {/* --- HEADER SECTION --- */}
            <div style={{ marginBottom: '30px' }}>
                <Link href="/customers" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>←</span> Müşteri Listesine Dön
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginTop: '20px' }} className="responsive-grid">

                    {/* PROFILE CARD */}
                    <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '20px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '32px', fontWeight: 'bold', color: 'white',
                                boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
                            }}>
                                {val(customer.name, '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: 'white' }}>{val(customer.name)}</h1>
                                <span style={{ color: '#888', fontSize: '14px', marginTop: '4px', display: 'block' }}>{val(customer.category?.name, 'Genel Müşteri')}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '13px' }}>
                                <span style={{ opacity: 0.5 }}>📱</span> {val(customer.phone, 'Telefon Girilmemiş')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '13px' }}>
                                <span style={{ opacity: 0.5 }}>📧</span> {val(customer.email, 'E-posta Girilmemiş')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc', fontSize: '13px' }}>
                                <span style={{ opacity: 0.5 }}>📍</span>
                                <span>
                                    {(() => {
                                        let addr = customer.address;
                                        // Priority 1: New fields (city/district)
                                        if (customer.city || customer.district) {
                                            return `${addr ? addr + ' ' : ''}${customer.district ? customer.district + ' / ' : ''}${customer.city || ''}`;
                                        }
                                        // Priority 2: Legacy JSON parsing
                                        try {
                                            if (addr && typeof addr === 'string' && addr.trim().startsWith('{')) {
                                                const parsed = JSON.parse(addr);
                                                return `${parsed.address || ''} ${parsed.district ? '- ' + parsed.district : ''} ${parsed.city ? '/' + parsed.city : ''}`;
                                            }
                                        } catch (e) { }
                                        return val(addr, 'Adres Girilmemiş');
                                    })()}
                                </span>
                            </div>

                            {/* --- Quick Actions (WhatsApp & QR) --- */}
                            {services.length > 0 && services[0].plate && (
                                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setQrPlate(services[0].plate)}
                                        className="btn btn-outline"
                                        style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(255,255,255,0.2)', color: '#ccc' }}
                                    >
                                        📱 Dijital Karne
                                    </button>
                                    <button
                                        onClick={() => {
                                            const plate = services[0].plate;
                                            const msg = `Sayın ${customer.name}, ${plate} plakalı aracınızın servis işlemleri Periodya güvencesiyle kayıt altına alınmıştır. Dijital karnenize buradan ulaşabilirsiniz: https://www.periodya.com/vehicle/${plate}`;
                                            window.open(`https://wa.me/${customer.phone?.replace(/\s/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="btn btn-primary"
                                        style={{ background: '#25D366', border: 'none', fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        💬 WhatsApp
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTIONS & BALANCE CARD */}
                    <div className="glass" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.0) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: '#888', letterSpacing: '1px', fontWeight: 'bold' }}>TOPLAM BAKİYE</div>
                                <div style={{ fontSize: '42px', fontWeight: 'bold', color: balanceColor, marginTop: '5px' }}>
                                    {Math.abs(balance).toLocaleString()} ₺
                                    <span style={{ fontSize: '16px', fontWeight: 'normal', opacity: 0.7, marginLeft: '10px' }}>
                                        {balance > 0 ? '(Borçlu)' : balance < 0 ? '(Alacaklı)' : '(Dengeli)'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => router.push(`/customers?edit=${customer.id}`)}
                                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                    ✏️ Düzenle
                                </button>
                                <button
                                    onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                                    📄 Özet Ekstre
                                </button>
                                <button
                                    onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                                    📑 Detaylı Ekstre
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                            <Link href={`/payment?amount=${Math.abs(balance)}&title=Tahsilat-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}&type=collection`}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#3b82f6', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', transition: '0.2s', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
                                💰 Tahsilat Al
                            </Link>

                            <Link href={`/payment?type=payment&title=Ödeme-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}`}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }}>
                                💸 Ödeme Yap
                            </Link>

                            <button
                                onClick={() => router.push(`/?selectedCustomer=${encodeURIComponent(val(customer.name, ''))}`)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                            >
                                🛒 Satış Yap
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', display: 'flex', gap: '30px' }}>
                <button onClick={() => setActiveTab('all')} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'all' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'all' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>Tüm Hareketler</button>
                <button onClick={() => setActiveTab('sales')} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'sales' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'sales' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>Satışlar & Faturalar</button>
                <button onClick={() => setActiveTab('payments')} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'payments' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'payments' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>Finansal İşlemler</button>
                <button onClick={() => { setActiveTab('documents'); fetchDocuments(); }} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'documents' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'documents' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>📁 Dosyalar & Evraklar</button>
                <button onClick={() => { setActiveTab('services'); fetchServices(); }} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'services' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'services' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>🔧 Servis Geçmişi</button>
                <button onClick={() => setActiveTab('warranties')} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'warranties' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'warranties' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>🛡️ Garantiler</button>
                <button onClick={() => setActiveTab('checks')} style={{ padding: '15px 0', background: 'none', border: 'none', borderBottom: activeTab === 'checks' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'checks' ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>📑 Çek & Senetler</button>
            </div>

            {/* --- CONTENT --- */}
            <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                {activeTab === 'services' ? (
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>Servis Kayıtları</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Link
                                    href={`/service/new?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`}
                                    className="btn btn-primary"
                                    style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    🛠️ Servis Başlat
                                </Link>

                                {services.length > 0 && services[0].plate && (
                                    <>
                                        <button
                                            onClick={() => setQrPlate(services[0].plate)}
                                            className="btn btn-outline"
                                            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            📱 Dijital Karne (QR)
                                        </button>
                                        <button
                                            onClick={() => {
                                                const plate = services[0].plate;
                                                const msg = `Sayın ${customer.name}, ${plate} plakalı aracınızın servis işlemleri Periodya güvencesiyle kayıt altına alınmıştır. Dijital karnenize buradan ulaşabilirsiniz: https://www.periodya.com/vehicle/${plate}`;
                                                window.open(`https://wa.me/${customer.phone?.replace(/\s/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            className="btn btn-primary"
                                            style={{ background: '#25D366', border: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            💬 WhatsApp Bildirim
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* QR MODAL */}
                        {qrPlate && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.8)', zIndex: 9999,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} onClick={() => setQrPlate(null)}>
                                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', maxWidth: '300px' }}>
                                    <h3 style={{ color: '#000', margin: '0 0 10px 0' }}>Dijital Servis Karnesi</h3>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Müşteriniz bu QR kodunu okutarak servis geçmişini görebilir.</div>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.periodya.com/vehicle/${qrPlate}`}
                                        alt="QR"
                                        style={{ width: '100%', borderRadius: '10px' }}
                                    />
                                    <div style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '20px', color: '#333' }}>{qrPlate}</div>
                                    <button onClick={() => setQrPlate(null)} style={{ marginTop: '20px', padding: '10px 30px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Kapat</button>
                                </div>
                            </div>
                        )}

                        {servicesLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
                        ) : services.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                <div style={{ marginBottom: '16px' }}>Kayıtlı servis işlemi yok.</div>
                                <button
                                    onClick={() => router.push(`/service/new?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`)}
                                    className="btn btn-primary"
                                    style={{ padding: '10px 20px', fontSize: '14px' }}
                                >
                                    ➕ Servis Kaydı Oluştur
                                </button>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '12px' }}>Tarih</th>
                                        <th>Marka / Model</th>
                                        <th>Plaka</th>
                                        <th>KM</th>
                                        <th>Yapılan İşlemler</th>
                                        <th style={{ textAlign: 'right' }}>Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((svc: any, i: number) => {
                                        let itemsStr = '';
                                        try {
                                            // Handle items whether they are string or object
                                            const items = typeof svc.items === 'string' ? JSON.parse(svc.items) : svc.items;
                                            if (Array.isArray(items) && items.length > 0) {
                                                itemsStr = items.map((p: any) => p.name).join(', ');
                                            }
                                        } catch (e) { console.error('Error parsing items', e); }

                                        // Fallback date if date is missing (e.g. use createdAt)
                                        const displayDate = svc.date ? svc.date : svc.createdAt;

                                        return (
                                            <tr key={svc.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', cursor: 'pointer' }} onClick={() => router.push(`/service/${svc.id}`)}>
                                                <td style={{ padding: '16px' }}>{displayDate ? new Date(displayDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                <td><span style={{ fontWeight: '500' }}>{svc.vehicleBrand || '-'}</span></td>
                                                <td><span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontWeight: 'bold' }}>{svc.plate || '-'}</span></td>
                                                <td>{svc.km ? svc.km.toLocaleString() : '-'} km</td>
                                                <td style={{ color: '#aaa' }}>
                                                    {itemsStr ? (
                                                        <span title={itemsStr}>{itemsStr.length > 50 ? itemsStr.substring(0, 50) + '...' : itemsStr}</span>
                                                    ) : (
                                                        <span>{svc.description || svc.notes || '-'}</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                                                    {Number(svc.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody></table>
                        )}
                    </div>
                ) : activeTab === 'documents' ? (
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>Müşteri Dosyaları</h3>
                            <label className="btn btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                {uploading ? 'Yükleniyor...' : '⬆️ Dosya Yükle'}
                                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg" />
                            </label>
                        </div>

                        {docsLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
                        ) : documents.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Henüz dosya yüklenmemiş.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                {documents.map(doc => (
                                    <div key={doc.id} className="glass" style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                                        <div style={{ fontSize: '40px', marginBottom: '10px', textAlign: 'center' }}>
                                            {doc.fileType?.includes('pdf') ? '📄' : '🖼️'}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>
                                            {doc.fileName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '15px' }}>
                                            {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleViewDoc(doc.id, doc.fileType)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Aç</button>
                                            <button onClick={() => handleDeleteDoc(doc.id)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>Sil</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'warranties' ? (
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Dijital Garanti Karnesi & Takip</h3>
                                <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Müşteriye satılan ürünlerin garanti süreçlerini yönetin.</p>
                            </div>
                            <button
                                onClick={() => setWarrantyModalOpen(true)}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px' }}
                            >
                                🛡️ Garanti Başlat
                            </button>
                        </div>

                        {warranties.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛡️</div>
                                <div>Henüz kayıtlı garanti bulunmuyor.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                {warranties.map(w => (
                                    <div key={w.id} className="glass" style={{
                                        padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '50px', height: '50px', borderRadius: '12px',
                                                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                                            }}>
                                                🚲
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{w.productName}</div>
                                                <div style={{ fontSize: '13px', color: '#888', marginTop: '2px', display: 'flex', gap: '10px' }}>
                                                    <span>Seri No: <span style={{ color: '#ccc' }}>{w.serialNo}</span></span>
                                                    <span>•</span>
                                                    <span>Fatura: {w.invoiceNo}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>BAŞLANGIÇ</div>
                                                <div style={{ color: 'white', fontWeight: '500' }}>{new Date(w.startDate).toLocaleDateString()}</div>
                                            </div>

                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>BİTİŞ</div>
                                                <div style={{ color: '#ef4444', fontWeight: '500' }}>{new Date(w.endDate).toLocaleDateString()}</div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    padding: '6px 12px', borderRadius: '20px',
                                                    background: w.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: w.status === 'Active' ? '#34d399' : '#f87171',
                                                    fontSize: '12px', fontWeight: 'bold'
                                                }}>
                                                    {w.status === 'Active' ? 'Garantisi Devam Ediyor' : 'Süresi Doldu'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                                    Süre: {w.period}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'checks' ? (
                    <div style={{ padding: '24px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>Müşteri Çek & Senetleri</h3>
                        </div>
                        {!customer.checks || customer.checks.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Kayıtlı evrak bulunmuyor.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '12px' }}>Tür</th>
                                        <th>Vade</th>
                                        <th>Banka / No</th>
                                        <th>Durum</th>
                                        <th style={{ textAlign: 'right', paddingRight: '20px' }}>Tutar</th>
                                        <th style={{ textAlign: 'right' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customer.checks.map((c: any) => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                                            <td style={{ padding: '16px' }}><b>{c.type}</b></td>
                                            <td>{new Date(c.dueDate).toLocaleDateString('tr-TR')}</td>
                                            <td style={{ color: '#aaa' }}>{c.bank} - {c.number}</td>
                                            <td><span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px' }}>{c.status}</span></td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '20px' }}>{Number(c.amount).toLocaleString()} ₺</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {(c.status === 'Portföyde' || c.status === 'Beklemede') && (
                                                    <button
                                                        onClick={() => {
                                                            setActiveCheck(c);
                                                            setTargetKasaId(String(kasalar[0]?.id || ''));
                                                            setShowCheckCollectModal(true);
                                                        }}
                                                        style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        {c.type.includes('Alınan') ? 'Tahsil Et' : 'Öde'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', color: '#888', fontSize: '12px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '20px' }}>Tarih</th>
                                <th>Tür</th>
                                <th>Açıklama</th>
                                <th style={{ textAlign: 'right' }}>Tutar</th>
                                <th style={{ textAlign: 'right', width: '130px' }}>Fatura</th>
                                <th style={{ padding: '20px', textAlign: 'center', width: '80px' }}>Detay</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredHistory.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '50px', textAlign: 'center', color: '#666', fontSize: '14px' }}>Bu kategoride kayıt bulunamadı.</td></tr>
                            ) : (
                                paginatedHistory.map((item, idx) => (
                                    <Fragment key={item.id || idx}>
                                        <tr
                                            onClick={() => item.items && setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                cursor: item.items ? 'pointer' : 'default',
                                                background: expandedRowId === item.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                transition: '0.2s'
                                            }}
                                            className="hover:bg-white/5"
                                        >
                                            <td style={{ padding: '20px', fontSize: '14px', color: '#ddd' }}>{item.date}</td>
                                            <td>
                                                <span style={{
                                                    padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                                                    background: item.color + '20', color: item.color, border: '1px solid ' + item.color + '40'
                                                }}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '14px', opacity: 0.8 }}>{item.desc}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color: item.amount > 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                                                {Math.abs(item.amount).toLocaleString()} ₺
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                                {item.type === 'Satış' && (
                                                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'nowrap', alignItems: 'center' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!completedIds.includes(item.id) && !processingIds.includes(item.id)) {
                                                                    handleReturnTransaction(item.id);
                                                                }
                                                            }}
                                                            disabled={completedIds.includes(item.id) || processingIds.includes(item.id)}
                                                            style={{
                                                                padding: '6px 8px',
                                                                background: completedIds.includes(item.id) ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                                                color: completedIds.includes(item.id) ? '#666' : '#ef4444',
                                                                border: completedIds.includes(item.id) ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239, 68, 68, 0.3)',
                                                                borderRadius: '8px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                cursor: completedIds.includes(item.id) ? 'default' : 'pointer',
                                                                whiteSpace: 'nowrap',
                                                                opacity: processingIds.includes(item.id) ? 0.7 : 1
                                                            }}
                                                            title="İade Al / İptal Et"
                                                        >
                                                            {processingIds.includes(item.id) ? '⏳ İşleniyor...' : (completedIds.includes(item.id) ? '✅ İade Edildi' : '↩️ İade')}
                                                        </button>
                                                        {item.orderId && (
                                                            item.isFormal ? (
                                                                // Already invoiced — show locked badge + print button
                                                                <>
                                                                    <span style={{
                                                                        padding: '6px 8px',
                                                                        background: 'rgba(16,185,129,0.1)',
                                                                        color: '#10b981',
                                                                        border: '1px solid rgba(16,185,129,0.3)',
                                                                        borderRadius: '8px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        whiteSpace: 'nowrap',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        ✅ Faturalandı
                                                                    </span>
                                                                    {item.formalInvoiceId && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${item.formalInvoiceId}`, '_blank');
                                                                            }}
                                                                            style={{ padding: '6px 8px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                        >
                                                                            🖨️ Yazdır
                                                                        </button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenInvoicing(item.orderId); }}
                                                                    style={{ padding: '6px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                >
                                                                    🧾 Faturalandır
                                                                </button>
                                                            )
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenPlanModal(item); }}
                                                            style={{ padding: '6px 8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                        >
                                                            📅 Vadelendir
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#666' }}>{item.items ? (expandedRowId === item.id ? '▲' : '▼') : ''}</td>
                                        </tr>
                                        {expandedRowId === item.id && item.items && (
                                            <tr style={{ background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                                                <td colSpan={6} style={{ padding: '20px 40px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        <h4 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>Fatura İçeriği</h4>
                                                        {item.items.map((sub: any, sIdx: number) => (
                                                            <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)', fontSize: '13px' }}>
                                                                <span style={{ color: '#ddd' }}>{sub.name || sub.productName} <span style={{ color: '#666', marginLeft: '10px' }}>x {sub.qty || sub.quantity}</span></span>
                                                                <span style={{ fontFamily: 'monospace' }}>{((sub.price || 0) * (sub.qty || sub.quantity || 1)).toLocaleString()} ₺</span>
                                                            </div>
                                                        ))}
                                                        <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '15px', fontWeight: 'bold', color: '#3b82f6' }}>
                                                            Toplam: {Math.abs(item.amount).toLocaleString()} ₺
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                <div style={{ padding: '20px' }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* INVOICE MODAL - PROFESSIONAL E-FATURA STYLE */}
            {
                invoiceModalOpen && selectedOrder && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                        <div className="card glass animate-in" style={{ width: '1200px', maxWidth: '98vw', padding: 0, border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '24px', overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ padding: '8px', background: '#3b82f6', borderRadius: '10px', fontSize: '18px' }}>📄</span>
                                        RESMİ FATURALANDIRMA SİSTEMİ
                                    </h2>
                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px' }}>E-ARŞİV / E-FATURA TASLAĞI</div>
                                </div>
                                <button onClick={() => setInvoiceModalOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                            </div>

                            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', maxHeight: '80vh', overflowY: 'auto' }}>

                                {/* Section: Buyer Information */}
                                <div>
                                    <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#3b82f6', marginBottom: '16px', borderLeft: '3px solid #3b82f6', paddingLeft: '10px' }}>ALICI BİLGİLERİ</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                        <div className="flex-col gap-1">
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ÜNVAN / AD SOYAD</label>
                                            <input id="inv_name" defaultValue={customer.name} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }} />
                                        </div>
                                        <div className="flex-col gap-1">
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>V.N. / T.C. KİMLİK NO</label>
                                            <input id="inv_tax_no" defaultValue={customer.taxNumber} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }} />
                                        </div>
                                        <div className="flex-col gap-1">
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>VERGİ DAİRESİ</label>
                                            <input id="inv_tax_office" defaultValue={customer.taxOffice} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }} />
                                        </div>
                                        <div className="flex-col gap-1">
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>TELEFON</label>
                                            <input id="inv_phone" defaultValue={customer.phone} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }} />
                                        </div>
                                        <div className="flex-col gap-1" style={{ gridColumn: 'span 4' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#888' }}>ADRES</label>
                                            <textarea id="inv_address" defaultValue={customer.address} style={{ width: '100%', minHeight: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 16px', fontWeight: '500', resize: 'vertical' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Items Table */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#3b82f6', margin: 0, borderLeft: '3px solid #3b82f6', paddingLeft: '10px' }}>FATURA KALEMLERİ</h3>
                                        <button
                                            onClick={() => setIsProductPickerOpen(true)}
                                            style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            ➕ Envanterden Ürün Ekle
                                        </button>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)', color: '#666', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>NO</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', minWidth: '220px' }}>MALZEME / HİZMET</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>MİKTAR</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', width: '130px' }}>BİRİM FİYAT</th>

                                                    <th style={{ padding: '12px', textAlign: 'center', width: '70px' }}>KDV %</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', width: '100px' }}>KDV TUTAR</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>TOPLAM</th>
                                                    <th style={{ width: '40px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceItems.map((it: any, i: number) => {
                                                    const qty = Number(it.qty || 1);
                                                    const netPrice = Number(it.price || 0);
                                                    const vatRate = Number(it.vat || 20);
                                                    const otvRate = Number(it.otv || 0);

                                                    // Formula: (Net * Qty * (1 + OTV)) * (1 + VAT)
                                                    const lineNetTotal = qty * netPrice;
                                                    const otvAmount = lineNetTotal * (otvRate / 100);
                                                    const vatMatrah = lineNetTotal + otvAmount;
                                                    const vatAmount = vatMatrah * (vatRate / 100);
                                                    const lineGrossTotal = vatMatrah + vatAmount;

                                                    const updateItem = (field: string, val: any) => {
                                                        const newItems = [...invoiceItems];
                                                        newItems[i][field] = val;
                                                        setInvoiceItems(newItems);
                                                    };

                                                    const handleGrossChange = (newGross: number) => {
                                                        if (qty === 0) return;
                                                        // newGross = (netPrice * qty * (1 + OTV)) * (1 + VAT)
                                                        // netPrice = newGross / (qty * (1 + OTV) * (1 + VAT))
                                                        const calculatedNet = newGross / (qty * (1 + otvRate / 100) * (1 + vatRate / 100));
                                                        updateItem('price', calculatedNet);
                                                    };

                                                    return (
                                                        <tr key={it.id || i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                                                            <td style={{ padding: '12px', textAlign: 'center', color: '#888' }}>{i + 1}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                <div className="flex-col">
                                                                    <select
                                                                        value={it.productId || ''}
                                                                        onChange={(e) => {
                                                                            const selectedProduct = products.find(p => String(p.id) === e.target.value);
                                                                            console.log('🔍 Selected product ID:', e.target.value);
                                                                            console.log('🔍 Found product:', selectedProduct);
                                                                            if (selectedProduct) {
                                                                                // Create a deep copy to force React re-render
                                                                                const currentItems = JSON.parse(JSON.stringify(invoiceItems));

                                                                                // Update the specific item
                                                                                currentItems[i] = {
                                                                                    ...currentItems[i],
                                                                                    productId: selectedProduct.id,
                                                                                    name: selectedProduct.name,
                                                                                    price: Number(selectedProduct.price || 0),
                                                                                    vat: Number(selectedProduct.salesVat || 20),
                                                                                    otv: Number(selectedProduct.salesOtv || 0),
                                                                                    otvType: selectedProduct.otvType || 'Ö.T.V yok',
                                                                                    oiv: Number(selectedProduct.salesOiv || 0)
                                                                                };

                                                                                console.log('✅ Updated item:', currentItems[i]);
                                                                                console.log('📦 Setting new items array');

                                                                                // Force update with new reference
                                                                                setInvoiceItems(currentItems);

                                                                                // Verify after a tick
                                                                                setTimeout(() => {
                                                                                    console.log('🔄 State should be updated now');
                                                                                }, 100);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            background: 'rgba(255,255,255,0.05)',
                                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                                            color: 'white',
                                                                            fontWeight: '600',
                                                                            padding: '8px',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <option value="">Ürün seçiniz...</option>
                                                                        {products.map(p => (
                                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    {it.name && it.name !== 'Ürün' && (
                                                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', paddingLeft: '4px' }}>
                                                                            Seçili: {it.name}
                                                                        </div>
                                                                    )}
                                                                    <div style={{ paddingLeft: '4px', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                        {(it.otvType && it.otvType !== 'Ö.T.V yok') && (
                                                                            <span style={{ fontSize: '9px', background: 'rgba(255,100,0,0.15)', color: '#fdba74', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(255,100,0,0.2)' }}>
                                                                                {it.otvType === 'yüzdesel Ö.T.V' ? `ÖTV %${it.otv}` : `ÖTV ${it.otv}₺`}
                                                                            </span>
                                                                        )}
                                                                        {(Number(it.oiv || 0) > 0) && (
                                                                            <span style={{ fontSize: '9px', background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                                                ÖİV %${it.oiv}
                                                                            </span>
                                                                        )}
                                                                        <button
                                                                            onClick={() => setTaxEditIndex(i)}
                                                                            style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px dashed rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: '0.2s' }}
                                                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                                                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#aaa'; }}
                                                                        >
                                                                            ⚙️ Diğer Vergiler
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    value={it.qty}
                                                                    onChange={(e) => updateItem('qty', Number(e.target.value))}
                                                                    style={{ width: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'center', borderRadius: '4px' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                                    <input
                                                                        type="number"
                                                                        step="0.0001"
                                                                        value={netPrice > 0 ? Number(netPrice.toFixed(4)) : ''}
                                                                        placeholder="0.00"
                                                                        onChange={(e) => updateItem('price', Number(e.target.value))}
                                                                        style={{ width: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'right', borderRadius: '4px' }}
                                                                    />
                                                                    <span style={{ color: '#888', fontSize: '10px' }}>₺+KDV</span>
                                                                </div>
                                                            </td>

                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    value={it.vat}
                                                                    onChange={(e) => updateItem('vat', Number(e.target.value))}
                                                                    style={{ width: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textAlign: 'center', borderRadius: '4px' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#888', fontFamily: 'monospace' }}>
                                                                {vatAmount.toFixed(2)} ₺
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                                <input
                                                                    type="number"
                                                                    value={lineGrossTotal.toFixed(2)}
                                                                    onChange={(e) => handleGrossChange(Number(e.target.value))}
                                                                    style={{ width: '110px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', textAlign: 'right', borderRadius: '4px', fontWeight: '800', fontFamily: 'monospace' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>trash</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section: Totals Summary */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '400px', background: 'rgba(59, 130, 246, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                        {(() => {
                                            const subtotal = invoiceItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);

                                            let totalOtv = 0;
                                            let totalOiv = 0;
                                            let totalVat = 0;

                                            invoiceItems.forEach(it => {
                                                const lineQty = Number(it.qty || 1);
                                                const lineNet = lineQty * Number(it.price || 0);
                                                let lineOtv = 0;
                                                if (it.otvType === 'yüzdesel Ö.T.V') {
                                                    lineOtv = lineNet * (Number(it.otv || 0) / 100);
                                                } else if (it.otvType === 'maktu Ö.T.V') {
                                                    lineOtv = Number(it.otv || 0) * lineQty;
                                                }
                                                const matrah = lineNet + lineOtv;
                                                totalOtv += lineOtv;
                                                totalOiv += matrah * (Number(it.oiv || 0) / 100);
                                                totalVat += matrah * (Number(it.vat || 20) / 100);
                                            });

                                            let discAmount = 0;
                                            if (discountType === 'percent') {
                                                discAmount = subtotal * (discountValue / 100);
                                            } else {
                                                discAmount = discountValue;
                                            }

                                            const finalTotal = subtotal + totalOtv + totalOiv + totalVat - discAmount;

                                            return (
                                                <>
                                                    <div className="flex-between" style={{ marginBottom: '10px' }}>
                                                        <span style={{ fontSize: '13px', color: '#888' }}>Ara Toplam (Net)</span>
                                                        <span style={{ fontWeight: 'bold' }}>{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    {totalOtv > 0 && (
                                                        <div className="flex-between" style={{ marginBottom: '10px' }}>
                                                            <span style={{ fontSize: '13px', color: '#888' }}>ÖTV Toplam</span>
                                                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{totalOtv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                        </div>
                                                    )}

                                                    <div className="flex-between" style={{ marginBottom: '10px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '13px', color: '#888' }}>İskonto</span>
                                                            <select
                                                                value={discountType}
                                                                onChange={(e: any) => setDiscountType(e.target.value)}
                                                                style={{ padding: '2px 4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px' }}
                                                            >
                                                                <option value="percent">%</option>
                                                                <option value="amount">₺</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={discountValue}
                                                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                                style={{ width: '60px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px', padding: '2px 4px' }}
                                                            />
                                                        </div>
                                                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>- {discAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div className="flex-between" style={{ marginBottom: '10px' }}>
                                                        <span style={{ fontSize: '13px', color: '#888' }}>KDV Toplam</span>
                                                        <span style={{ fontWeight: 'bold' }}>{totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>
                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }}></div>
                                                    <div className="flex-between">
                                                        <span style={{ fontSize: '15px', fontWeight: '900' }}>GENEL TOPLAM</span>
                                                        <span style={{ fontSize: '24px', fontWeight: '950', color: '#3b82f6' }}>{finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                            </div>

                            {/* Footer Actions */}
                            <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setInvoiceModalOpen(false)} className="btn btn-outline" style={{ minWidth: '150px', height: '54px', borderRadius: '16px', fontWeight: '700' }}>İPTAL ET</button>
                                <button
                                    disabled={isConverting}
                                    onClick={() => {
                                        const data = {
                                            taxNumber: (document.getElementById('inv_tax_no') as HTMLInputElement).value,
                                            taxOffice: (document.getElementById('inv_tax_office') as HTMLInputElement).value,
                                            address: (document.getElementById('inv_address') as HTMLTextAreaElement).value,
                                            phone: (document.getElementById('inv_phone') as HTMLInputElement).value,
                                            name: (document.getElementById('inv_name') as HTMLInputElement).value,
                                            isFormal: true
                                        };
                                        handleConvertToInvoice(data);
                                    }}
                                    style={{ minWidth: '220px', height: '54px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)', fontSize: '16px' }}
                                >
                                    {isConverting ? 'İŞLENİYOR...' : 'FATURAYI ONAYLA'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* INVOICE SUCCESS & SHARE MODAL */}
            {shareModalOpen && lastInvoice && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }}>
                    <div className="card glass animate-in" style={{ width: '450px', padding: '40px', borderRadius: '32px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', margin: '0 auto 24px' }}>✅</div>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>Fatura Hazır!</h2>
                        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>Resmi faturanız başarıyla oluşturuldu ve GİB sistemine iletildi.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => {
                                    const msg = `Sayın ${customer.name}, ${lastInvoice.invoiceNo} numaralı faturanızı bu bağlantıdan görüntüleyebilirsiniz: https://www.periodya.com/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`;
                                    window.open(`https://wa.me/${customer.phone?.replace(/\s/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="btn btn-primary"
                                style={{ background: '#25D366', border: 'none', height: '56px', borderRadius: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <span style={{ fontSize: '18px' }}>💬</span> WhatsApp ile Gönder
                            </button>
                            <button
                                onClick={() => {
                                    window.location.href = `mailto:${customer.email || ''}?subject=Faturanız Hazır - ${lastInvoice.invoiceNo}&body=Sayın ${customer.name}, %0D%0A%0D%0A${lastInvoice.invoiceNo} numaralı faturanız ekte yer almaktadır. %0D%0A%0D%0AFaturayı görüntülemek için tıkla: https://www.periodya.com/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`;
                                }}
                                className="btn btn-outline"
                                style={{ height: '56px', borderRadius: '16px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <span style={{ fontSize: '18px' }}>📧</span> E-Posta ile Gönder
                            </button>
                            <button
                                onClick={() => window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`, '_blank')}
                                style={{ marginTop: '12px', background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Faturayı PDF olarak Görüntüle
                            </button>
                        </div>

                        <button
                            onClick={() => setShareModalOpen(false)}
                            style={{ marginTop: '40px', width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Bilgilendirmeyi Kapat
                        </button>
                    </div>
                </div>
            )}


            {/* ADDITIONAL TAX MODAL */}
            {
                taxEditIndex !== null && invoiceItems[taxEditIndex] && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                        <div className="card glass animate-in" style={{ width: '450px', padding: '32px', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--primary)' }}>
                            <div className="flex-between mb-6">
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>⚙️ Ek Vergi Ayarları</h3>
                                <button onClick={() => setTaxEditIndex(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>×</button>
                            </div>

                            <div className="flex-col gap-6">
                                <div className="flex-col gap-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>Ö.T.V TİPİ</label>
                                    <select
                                        value={invoiceItems[taxEditIndex].otvType || 'Ö.T.V yok'}
                                        onChange={(e) => {
                                            const newItems = [...invoiceItems];
                                            newItems[taxEditIndex].otvType = e.target.value;
                                            if (e.target.value === 'Ö.T.V yok') newItems[taxEditIndex].otv = 0;
                                            setInvoiceItems(newItems);
                                        }}
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }}
                                    >
                                        <option value="Ö.T.V yok">Ö.T.V yok</option>
                                        <option value="yüzdesel Ö.T.V">Yüzdesel Ö.T.V (%)</option>
                                        <option value="maktu Ö.T.V">Maktu Ö.T.V (₺)</option>
                                    </select>
                                </div>

                                {invoiceItems[taxEditIndex].otvType !== 'Ö.T.V yok' && (
                                    <div className="flex-col gap-2 animate-in">
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)' }}>Ö.T.V {invoiceItems[taxEditIndex].otvType === 'yüzdesel Ö.T.V' ? 'ORANI (%)' : 'TUTARI (₺)'}</label>
                                        <input
                                            type="number"
                                            value={invoiceItems[taxEditIndex].otv || 0}
                                            onChange={(e) => {
                                                const newItems = [...invoiceItems];
                                                newItems[taxEditIndex].otv = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }}
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255, 100, 0, 0.05)', border: '1px solid rgba(255, 100, 0, 0.2)', color: 'white', fontWeight: '900', fontSize: '18px' }}
                                        />
                                    </div>
                                )}

                                <div className="flex-col gap-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', opacity: 0.6 }}>Ö.İ.V ORANI (%)</label>
                                    <input
                                        type="number"
                                        value={invoiceItems[taxEditIndex].oiv || 0}
                                        onChange={(e) => {
                                            const newItems = [...invoiceItems];
                                            newItems[taxEditIndex].oiv = Number(e.target.value);
                                            setInvoiceItems(newItems);
                                        }}
                                        placeholder="0"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600' }}
                                    />
                                    <span style={{ fontSize: '10px', opacity: 0.4 }}>Özel İletişim Vergisi</span>
                                </div>

                                <button
                                    onClick={() => setTaxEditIndex(null)}
                                    style={{ width: '100%', marginTop: '10px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,100,0,0.2)' }}
                                >
                                    SEÇİMİ KAYDET ✅
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .glass { backdrop-filter: blur(10px); }
                @media (max-width: 768px) {
                    .responsive-grid { grid-template-columns: 1fr !important; }
                }
                tr:hover { background-color: rgba(255,255,255,0.02); }
            `}</style>

            {/* WARRANTY START MODAL */}
            {warrantyModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass animate-fade-in" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', background: '#1e1e1e' }}>
                        <div className="flex-between mb-6">
                            <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '5px' }}>🛡️ Garanti Başlat</h3>
                            <button onClick={() => setWarrantyModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>

                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>FATURA SEÇİNİ (Satın Alma Kaydı)</label>
                                <select
                                    value={newWarranty.invoiceId}
                                    onChange={(e) => {
                                        const inv = customerInvoices.find(i => i.id.toString() === e.target.value);
                                        setNewWarranty({ ...newWarranty, invoiceId: e.target.value, productId: '', productName: '' });
                                    }}
                                    style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--border-light)' }}
                                >
                                    <option value="">Seçiniz...</option>
                                    {customerInvoices.map(inv => (
                                        <option key={inv.id} value={inv.id}>{inv.number} - {inv.date} ({inv.total} ₺)</option>
                                    ))}
                                </select>
                            </div>

                            {newWarranty.invoiceId && (
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>ÜRÜN SEÇİNİ</label>
                                    <select
                                        value={newWarranty.productId}
                                        onChange={(e) => {
                                            const inv = customerInvoices.find(i => i.id.toString() === newWarranty.invoiceId);
                                            const prodItem = inv?.items.find((p: any) => (p.productId || p.id || '').toString() === e.target.value);

                                            // Find real product name from Inventory if missing in Item
                                            let pName = prodItem?.name || '';
                                            if (!pName && prodItem?.productId) {
                                                const realProd = products.find(p => p.id === prodItem.productId);
                                                if (realProd) pName = realProd.name;
                                            }

                                            setNewWarranty({ ...newWarranty, productId: e.target.value, productName: pName });
                                        }}
                                        style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--border-light)' }}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {customerInvoices.find(i => i.id.toString() === newWarranty.invoiceId)?.items.map((p: any) => {
                                            let displayName = p.name;
                                            if (!displayName && p.productId) {
                                                const realProd = products.find((prod: any) => prod.id === p.productId);
                                                if (realProd) displayName = realProd.name;
                                            }
                                            return (
                                                <option key={p.productId || p.id || Math.random()} value={p.productId || p.id}>
                                                    {displayName || 'İsimsiz Ürün'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}

                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>SERİ NO (KADRO NO)</label>
                                <input
                                    type="text"
                                    placeholder="Örn: CR12345678"
                                    value={newWarranty.serialNo}
                                    onChange={(e) => setNewWarranty({ ...newWarranty, serialNo: e.target.value })}
                                    style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--border-light)' }}
                                />
                            </div>

                            <div className="grid-cols-2 gap-4">
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>GARANTİ SÜRESİ</label>
                                    <select
                                        value={newWarranty.period}
                                        onChange={(e) => setNewWarranty({ ...newWarranty, period: e.target.value })}
                                        style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--border-light)' }}
                                    >
                                        {(warrantyPeriods && warrantyPeriods.length > 0 ? warrantyPeriods : ['6 Ay', '1 Yıl', '2 Yıl', '3 Yıl', '5 Yıl']).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-2">
                                    <label className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>BAŞLANGIÇ TARİHİ</label>
                                    <input
                                        type="date"
                                        value={newWarranty.startDate}
                                        onChange={(e) => setNewWarranty({ ...newWarranty, startDate: e.target.value })}
                                        style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--border-light)' }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleStartWarranty}
                                className="btn btn-primary"
                                style={{ marginTop: '20px', padding: '14px' }}
                            >
                                Garanti Başlat ✅
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT PICKER MODAL */}
            {
                isProductPickerOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                        <div className="card glass animate-in" style={{ width: '650px', maxWidth: '95vw', padding: '32px', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(15, 23, 42, 0.95)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>Envanterden Ürün Seçin</h3>
                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', marginTop: '4px' }}>ENVANTER LİSTESİNDEN SEÇİM YAPIN</div>
                                </div>
                                <button onClick={() => setIsProductPickerOpen(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                                <input
                                    autoFocus
                                    placeholder="Ürün adı, barkod veya kod ile ara..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '14px 16px 14px 45px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px' }}>
                                {products
                                    .filter(p => !productSearchTerm || p.name.toLocaleLowerCase('tr').includes(productSearchTerm.toLocaleLowerCase('tr')) || p.barcode?.includes(productSearchTerm) || p.code?.includes(productSearchTerm))
                                    .slice(0, 50)
                                    .map(p => {
                                        const grossPrice = Number(p.price || 0);
                                        const vatRate = Number(p.salesVat || 20);
                                        const otvType = p.otvType || 'Ö.T.V yok';
                                        const otvRate = Number(p.salesOtv || 0);
                                        const oivRate = Number(p.salesOiv || 0);
                                        const effectiveVatOiv = (1 + (vatRate + oivRate) / 100);

                                        let netPrice = 0;
                                        if (otvType === 'yüzdesel Ö.T.V') {
                                            netPrice = grossPrice / ((1 + otvRate / 100) * effectiveVatOiv);
                                        } else if (otvType === 'maktu Ö.T.V') {
                                            netPrice = (grossPrice / effectiveVatOiv) - otvRate;
                                        } else {
                                            netPrice = grossPrice / effectiveVatOiv;
                                        }

                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => {
                                                    const existingIndex = invoiceItems.findIndex(item => item.productId === p.id);
                                                    if (existingIndex !== -1) {
                                                        const newItems = [...invoiceItems];
                                                        newItems[existingIndex].qty = (Number(newItems[existingIndex].qty) || 0) + 1;
                                                        setInvoiceItems(newItems);
                                                    } else {
                                                        setInvoiceItems([...invoiceItems, {
                                                            name: p.name,
                                                            qty: 1,
                                                            price: netPrice,
                                                            vat: vatRate,
                                                            otv: otvRate,
                                                            otvType: otvType,
                                                            oiv: oivRate,
                                                            productId: p.id
                                                        }]);
                                                    }
                                                    setIsProductPickerOpen(false);
                                                    setProductSearchTerm('');
                                                }}
                                                style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' }}
                                                className="hover:border-primary/50 hover:bg-white/5"
                                            >
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#3b82f6', fontWeight: 'bold' }}>
                                                        {p.category?.charAt(0) || '📦'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#eee' }}>{p.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Stok: <span style={{ color: p.stock > 0 ? '#10b981' : '#ef4444' }}>{p.stock}</span> | Barkod: {p.barcode || 'Yok'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '900', color: '#fff', fontSize: '15px' }}>{grossPrice.toLocaleString()} ₺</div>
                                                    <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>%{vatRate} KDV DAHİL</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        setInvoiceItems([...invoiceItems, { name: 'Yeni Hizmet/Ürün', qty: 1, price: 0, vat: 20 }]);
                                        setIsProductPickerOpen(false);
                                    }}
                                    style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px dashed rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    ➕ Manuel Hizmet/Boş Satır Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* CHECK COLLECT MODAL */}
            {showCheckCollectModal && activeCheck && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>{activeCheck.type.includes('Alınan') ? '📥 Tahsilat Onayı' : '📤 Ödeme Onayı'}</h3>
                            <button onClick={() => setShowCheckCollectModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>{activeCheck.type}</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{Number(activeCheck.amount).toLocaleString()} ₺</div>
                                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{activeCheck.bank} - {activeCheck.number}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', color: '#bbb' }}>{activeCheck.type.includes('Alınan') ? 'Tahsilatın Aktarılacağı' : 'Ödemenin Çıkacağı'} Hesap</label>
                                <select
                                    value={targetKasaId}
                                    onChange={(e) => setTargetKasaId(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none' }}
                                >
                                    <option value="">Seçiniz...</option>
                                    {kasalar.filter((k: any) => k.name !== 'ÇEK / SENET PORTFÖYÜ').map((k: any) => (
                                        <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString()} ₺)</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleExecuteCheckCollect}
                                disabled={isProcessingCollection || !targetKasaId}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px', background: '#3b82f6', color: '#fff',
                                    border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
                                    opacity: (isProcessingCollection || !targetKasaId) ? 0.5 : 1, transition: '0.2s',
                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                                }}
                            >
                                {isProcessingCollection ? 'İŞLENİYOR...' : 'İŞLEMİ TAMAMLA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAN MODAL */}
            {showPlanModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div className="card glass animate-in" style={{ width: '500px', maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Vadeli Satış Planı Oluştur</h3>
                            <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '5px' }}>Plan Başlığı</label>
                                <input
                                    value={planData.title}
                                    onChange={e => setPlanData({ ...planData, title: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '5px' }}>Toplam Tutar</label>
                                    <input
                                        type="number"
                                        value={planData.totalAmount}
                                        onChange={e => setPlanData({ ...planData, totalAmount: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '5px' }}>Taksit Sayısı</label>
                                    <input
                                        type="number"
                                        value={planData.installmentCount}
                                        onChange={e => setPlanData({ ...planData, installmentCount: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '5px' }}>Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={planData.startDate}
                                    onChange={e => setPlanData({ ...planData, startDate: e.target.value })}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                                    className="input-date-dark"
                                />
                            </div>

                            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#10b981', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={planData.isExisting}
                                        onChange={e => setPlanData({ ...planData, isExisting: e.target.checked })}
                                        style={{ accentColor: '#10b981' }}
                                    />
                                    <span><b>Mevcut Bakiyeden Dönüştür</b></span>
                                </label>
                                <div style={{ fontSize: '11px', color: '#888', marginTop: '5px', marginLeft: '24px' }}>
                                    Bu seçenek aktifken cari bakiyesine ekstra borç eklenmez, sadece ödeme planı oluşturulur.
                                </div>
                            </div>

                            <button
                                onClick={handleSavePlan}
                                className="btn btn-primary"
                                style={{ marginTop: '10px', padding: '12px', width: '100%', justifyContent: 'center' }}
                            >
                                Planı Oluştur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STATEMENT MODAL */}
            <StatementModal
                isOpen={statementOpen}
                onClose={() => setStatementOpen(false)}
                title={statementType === 'detailed' ? 'Detaylı Cari Hesap Ekstresi' : 'Özet Cari Hesap Ekstresi'}
                entity={{
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
                    taxNumber: customer.taxNumber,
                    taxOffice: customer.taxOffice,
                    balance: balance
                }}
                transactions={historyList}
                type={statementType}
                entityType="CUSTOMER"
            />
        </div >
    );
}

