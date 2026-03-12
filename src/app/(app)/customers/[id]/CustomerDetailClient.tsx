
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
import ReconciliationWizard from '@/components/modals/ReconciliationWizard';

export default function CustomerDetailClient({ customer, historyList }: { customer: any, historyList: any[] }) {
    const router = useRouter();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'payments' | 'documents' | 'services' | 'warranties' | 'checks' | 'reconciliations'>('all');
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

    // Reconciliation State
    const [reconWizardOpen, setReconWizardOpen] = useState(false);

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
        type: 'Kredi', direction: 'IN', customerId: '', supplierId: '', isExisting: true, description: ''
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
            isExisting: true, // Default: Mevcut bakiyeden
            description: item.orderId || item.id
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

    const [isInstallmentInvoice, setIsInstallmentInvoice] = useState(false);
    const [invoiceInstallmentCount, setInvoiceInstallmentCount] = useState(3);

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
                    const otvCode = realProduct ? (realProduct.otvCode || '0071') : '0071';
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
                        otvCode: otvCode,
                        otvType: otvType,
                        oiv: oivRate,
                        description: it.description || (realProduct && realProduct.showDescriptionOnInvoice ? realProduct.description : ''),
                        showDesc: !!(it.description || (realProduct && realProduct.showDescriptionOnInvoice))
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
                if (invoiceData.isInstallment) {
                    try {
                        await fetch('/api/financials/payment-plans', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: `Vadeli Satış: ${invoiceData.name}`,
                                totalAmount: data.invoice.totalAmount,
                                installmentCount: invoiceData.installments.toString(),
                                startDate: new Date().toISOString().split('T')[0],
                                type: invoiceData.installmentType || 'Açık Hesap',
                                direction: 'IN',
                                customerId: customer.id,
                                supplierId: '',
                                isExisting: true, 
                                description: data.invoice?.id || selectedOrder?.id || ''
                            })
                        });
                    } catch (e) {
                        console.error('Payment plan auto-creation failed', e);
                    }
                }

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

    const todayStr = new Date().toISOString().split('T')[0];
    const next30DaysDate = new Date();
    next30DaysDate.setDate(next30DaysDate.getDate() + 30);
    const next30DaysStr = next30DaysDate.toISOString().split('T')[0];

    const todayInstallments = customer?.paymentPlans?.flatMap((p: any) => p.installments || []).filter((i: any) => i.dueDate && i.dueDate.split('T')[0] === todayStr && i.status !== 'Paid' && i.status !== 'Ödendi') || [];
    const overdueInstallments = customer?.paymentPlans?.flatMap((p: any) => p.installments || []).filter((i: any) => i.dueDate && i.dueDate.split('T')[0] < todayStr && i.status !== 'Paid' && i.status !== 'Ödendi') || [];
    const upcomingInstallments = customer?.paymentPlans?.flatMap((p: any) => p.installments || []).filter((i: any) => i.dueDate && i.dueDate.split('T')[0] > todayStr && i.dueDate.split('T')[0] <= next30DaysStr && i.status !== 'Paid' && i.status !== 'Ödendi') || [];

    const overdueAmount = overdueInstallments.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const upcomingAmount = upcomingInstallments.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const todayAmount = todayInstallments.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

    return (
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>

            {/* UPCOMING / OVERDUE BANNER */}
            {(todayInstallments.length > 0 || overdueInstallments.length > 0) && (
                <div style={{ background: overdueInstallments.length > 0 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.2) 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%)', borderBottom: overdueInstallments.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <span style={{ color: 'var(--text-main, #fff)', fontWeight: '800', fontSize: '14px', letterSpacing: '0.5px' }}>
                        {overdueInstallments.length > 0 ? `${overdueInstallments.length} adet gecikmiş taksit ödemesi bulunmaktadır (Toplam: ${overdueAmount.toLocaleString('tr-TR')} ₺). ` : ''}
                        {todayInstallments.length > 0 ? `BUGÜN VADE GÜNÜ olan ${todayInstallments.length} adet ödeme var (Toplam: ${todayAmount.toLocaleString('tr-TR')} ₺).` : ''}
                    </span>
                    <button style={{ marginLeft: '12px', padding: '6px 12px', background: 'var(--bg-panel, rgba(0,0,0,0.2))', color: 'white', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>Detayları İncele</button>
                </div>
            )}

            {/* EXECUTIVE HEADER STRIP */}
            <div style={{
                background: 'var(--bg-panel, rgba(15, 23, 42, 0.6))',
                borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                padding: '24px 40px',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Top Row: Back link & Title */}
                    <div className="flex-between">
                        <Link href="/customers" style={{ color: 'var(--text-muted, #888)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'color 0.2s' }} className="hover:text-blue-500">
                            <span style={{ fontSize: '16px' }}>←</span> Müşteri Merkezi
                        </Link>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setReconWizardOpen(true)}
                                className="btn"
                                style={{ background: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                            >
                                🤝 Mutabakat
                            </button>
                            <button
                                onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                📄 Özet Ekstre
                            </button>
                            <button
                                onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                                className="btn"
                                style={{ background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                📑 Detaylı Ekstre
                            </button>
                            <button
                                onClick={() => router.push(`/customers?edit=${customer.id}`)}
                                className="btn"
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                ✏️ Düzenle
                            </button>
                        </div>
                    </div>

                    {/* Business/Profile Row */}
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        {/* Left: Avatar + Details */}
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '18px',
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', fontWeight: '800', color: 'white',
                                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {val(customer.name, '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-main, #fff)', letterSpacing: '-0.5px' }}>
                                    {val(customer.name)}
                                </h1>
                                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted, #888)', fontSize: '13px', fontWeight: '500' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🏷️</span> {val(customer.category?.name, 'Genel Müşteri')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📱</span> {val(customer.phone, 'Telefon Yok')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📧</span> {val(customer.email, 'E-posta Yok')}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>📍</span>
                                        {(() => {
                                            let addr = customer.address;
                                            if (customer.city || customer.district) {
                                                return `${customer.district ? customer.district + ' / ' : ''}${customer.city || ''}`;
                                            }
                                            try {
                                                if (addr && typeof addr === 'string' && addr.trim().startsWith('{')) {
                                                    const parsed = JSON.parse(addr);
                                                    return `${parsed.district ? parsed.district : ''} ${parsed.city ? '/' + parsed.city : ''}`;
                                                }
                                            } catch (e) { }
                                            return 'Adres Yok';
                                        })()}
                                    </span>
                                </div>
                                {services.length > 0 && services[0].plate && (
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setQrPlate(services[0].plate)}
                                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            📱 Dijital Karne Müşteri Linki (QR)
                                        </button>
                                        <button
                                            onClick={() => {
                                                const plate = services[0].plate;
                                                const msg = `Sayın ${customer.name}, ${plate} plakalı aracınızın servis işlemleri Periodya güvencesiyle kayıt altına alınmıştır. Dijital karnenize buradan ulaşabilirsiniz: https://www.periodya.com/vehicle/${plate}`;
                                                window.open(`https://wa.me/${customer.phone?.replace(/\s/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}`, '_blank');
                                            }}
                                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.3)', color: '#25D366', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            💬 WhatsApp'tan Karne Gönder
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Balance & Financial Health */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                FİNANSAL DURUM (NET BAKİYE)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <div style={{ fontSize: '36px', fontWeight: '900', color: balanceColor, lineHeight: '1', letterSpacing: '-1px' }}>
                                    {Math.abs(balance).toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.8 }}>₺</span>
                                </div>
                                <div style={{
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: balance > 0 ? 'rgba(239, 68, 68, 0.1)' : balance < 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card, rgba(255,255,255,0.05))',
                                    color: balanceColor,
                                    border: `1px solid ${balance > 0 ? 'rgba(239, 68, 68, 0.3)' : balance < 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color, rgba(255,255,255,0.1))'}`,
                                    textTransform: 'uppercase'
                                }}>
                                    {balance > 0 ? 'Borçlu (Risk)' : balance < 0 ? 'Alacaklı' : 'Kapalı (Dengeli)'}
                                </div>
                            </div>

                            {/* DUE INSTALLMENTS SUMMARY */}
                            {(overdueInstallments.length > 0 || upcomingInstallments.length > 0) && (
                                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {overdueInstallments.length > 0 && (
                                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase' }}>VADESİ GEÇEN</span>
                                            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '900', fontFamily: 'monospace' }}>{overdueAmount.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    )}
                                    {upcomingInstallments.length > 0 && (
                                        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '8px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase' }}>YAKLAŞAN VADE (30 GÜN)</span>
                                            <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '900', fontFamily: 'monospace' }}>{upcomingAmount.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {portfolioChecks > 0 && (
                                <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', marginTop: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span>⚠️</span> Portföyde {portfolioChecks.toLocaleString()} ₺ değerinde aktif çek/senet var.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* PREMIUM ACTION BAR */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <Link href={`/payment?amount=${Math.abs(balance)}&title=Tahsilat-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}&type=collection`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-blue-500/10 hover:border-blue-500/40"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💰</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>TAHSİLAT AL</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Cari hesaptan nakit / kk ile ödeme al</div>
                        </div>
                    </Link>

                    <Link href={`/payment?type=payment&title=Ödeme-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.02)', color: '#ef4444', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        className="hover:-translate-y-1 hover:bg-red-500/5 hover:border-red-500/40"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💸</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>ÖDEME YAP</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Firmadan nakit / kk ile ödeme çıkışı yap</div>
                        </div>
                    </Link>
                    <Link href={`/?selectedCustomer=${encodeURIComponent(val(customer.name, ''))}`}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'var(--bg-card, rgba(255,255,255,0.02))', color: 'var(--text-main, white)', padding: '24px', borderRadius: '20px', textDecoration: 'none', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)' }}
                        className="hover:-translate-y-1 hover:bg-white/5 hover:border-white/20"
                    >
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--bg-panel, rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛒</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', marginBottom: '4px', color: 'var(--text-main, #e2e8f0)' }}>SATIŞ YAP (POS)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>Bu müşteriye terminalde yeni satış başlat</div>
                        </div>
                    </Link>
                </div>

                {/* GROUPED NAVIGATION & FILTERS (HR MODULE STYLE) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        {[
                            { group: 'HAREKETLER', items: [{ id: 'all', label: 'Tüm Hareketler' }, { id: 'sales', label: 'Satışlar & Faturalar' }, { id: 'payments', label: 'Finansal İşlemler' }] },
                            { group: 'EVRAKLAR', items: [{ id: 'documents', label: 'Dosyalar & Evraklar' }, { id: 'warranties', label: 'Garantiler' }] },
                            { group: 'SERVİS', items: [{ id: 'services', label: 'Servis Geçmişi' }] },
                            { group: 'FİNANS', items: [{ id: 'checks', label: 'Çek & Senetler' }, { id: 'reconciliations', label: 'Mutabakatlar' }] },
                        ].map((grp, i) => (
                            <div key={grp.group} className="flex items-center gap-3">
                                {i !== 0 && <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>}
                                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                                    {grp.items.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id as any);
                                                if (tab.id === 'documents') fetchDocuments();
                                                if (tab.id === 'services') fetchServices();
                                            }}
                                            className={activeTab === tab.id
                                                ? "px-3 py-1.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0f172a] shadow-sm border border-slate-200/50 dark:border-white/10 rounded-[6px] transition-all"
                                                : "px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-[6px]"}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div style={{
                    background: 'var(--bg-panel, rgba(15, 23, 42, 0.4))',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
                }}>

                    {activeTab === 'services' ? (
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Servis Kayıtları</h3>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Link
                                        href={`/service/new?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`}
                                        className="btn btn-primary"
                                        style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', color: 'white', fontWeight: '800' }}
                                    >
                                        🛠️ Servis Başlat
                                    </Link>

                                    {services.length > 0 && services[0].plate && (
                                        <>
                                            <button
                                                onClick={() => setQrPlate(services[0].plate)}
                                                className="btn btn-outline"
                                                style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', fontWeight: '600' }}
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
                                                style={{ background: '#25D366', border: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', color: 'white', fontWeight: '800' }}
                                            >
                                                💬 WhatsApp Bildirim
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* QR MODAL (Services Tab Inline) */}
                            {qrPlate && (
                                <div style={{
                                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(15, 23, 42, 0.85)', zIndex: 9999,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }} onClick={() => setQrPlate(null)}>
                                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card, #1e293b)', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '360px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }} className="animate-scale-in">
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                                        <h3 style={{ color: 'var(--text-main, #fff)', margin: '0 0 12px 0', fontSize: '20px', fontWeight: '800' }}>Dijital Servis Karnesi</h3>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)', marginBottom: '24px', lineHeight: '1.6' }}>Müşteriniz bu QR kodunu okutarak veya linke tıklayarak servis geçmişine ulaşabilir.</div>
                                        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block' }}>
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://www.periodya.com/vehicle/${qrPlate}`}
                                                alt="QR"
                                                style={{ width: '220px', height: '220px', borderRadius: '8px' }}
                                            />
                                        </div>
                                        <div style={{ marginTop: '24px', fontWeight: '900', fontSize: '24px', color: '#3b82f6', letterSpacing: '2px' }}>{qrPlate}</div>
                                        <button onClick={() => setQrPlate(null)} style={{ marginTop: '24px', padding: '14px 0', width: '100%', background: 'var(--bg-panel, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>Kapat</button>
                                    </div>
                                </div>
                            )}

                            {servicesLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                                    <div className="loader" style={{ margin: '0 auto 16px', width: '24px', height: '24px', border: '3px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    Servis verileri getiriliyor...
                                </div>
                            ) : services.length === 0 ? (
                                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px dashed var(--border-color, rgba(255,255,255,0.1))' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔧</div>
                                    <div style={{ marginBottom: '24px', color: 'var(--text-main, #fff)', fontSize: '16px', fontWeight: '600' }}>Bu müşteriye ait servis kaydı yok.</div>
                                    <button
                                        onClick={() => router.push(`/service/new?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`)}
                                        className="btn btn-primary"
                                        style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', background: '#3b82f6', color: 'white', fontWeight: '800', border: 'none' }}
                                    >
                                        ➕ İlk Servis Kaydını Oluştur
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted, #888)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                <th style={{ padding: '16px 20px' }}>TARİH</th>
                                                <th style={{ padding: '16px 20px' }}>MARKA / MODEL</th>
                                                <th style={{ padding: '16px 20px' }}>PLAKA</th>
                                                <th style={{ padding: '16px 20px' }}>KİLOMETRE</th>
                                                <th style={{ padding: '16px 20px' }}>YAPILAN İŞLEMLER</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'right' }}>TUTAR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {services.map((svc: any, i: number) => {
                                                let itemsStr = '';
                                                try {
                                                    const items = typeof svc.items === 'string' ? JSON.parse(svc.items) : svc.items;
                                                    if (Array.isArray(items) && items.length > 0) {
                                                        itemsStr = items.map((p: any) => p.name).join(', ');
                                                    }
                                                } catch (e) { console.error('Error parsing items', e); }

                                                const displayDate = svc.date ? svc.date : svc.createdAt;

                                                return (
                                                    <tr key={svc.id || i} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => router.push(`/service/${svc.id}`)} className="hover:bg-white/5">
                                                        <td style={{ padding: '20px', color: 'var(--text-main, #e2e8f0)', fontWeight: '500' }}>{displayDate ? new Date(displayDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                        <td style={{ padding: '20px' }}><span style={{ fontWeight: '600', color: 'var(--text-main, #fff)' }}>{svc.vehicleBrand || '-'}</span></td>
                                                        <td style={{ padding: '20px' }}>
                                                            <span style={{ padding: '4px 10px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '6px', fontWeight: '800', color: '#3b82f6', letterSpacing: '1px' }}>
                                                                {svc.plate || '-'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '20px', color: 'var(--text-muted, #94a3b8)' }}>{svc.km ? svc.km.toLocaleString() : '-'} km</td>
                                                        <td style={{ padding: '20px', color: 'var(--text-muted, #94a3b8)' }}>
                                                            {itemsStr ? (
                                                                <span title={itemsStr} style={{ display: 'inline-block', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemsStr}</span>
                                                            ) : (
                                                                <span style={{ display: 'inline-block', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.description || svc.notes || '-'}</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: '800', color: '#3b82f6', fontSize: '14px' }}>
                                                            {Number(svc.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'documents' ? (
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Müşteri Dosyaları</h3>
                                <label className="btn btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: uploading ? 'var(--bg-card)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white', fontWeight: '800' }}>
                                    {uploading ? 'Yükleniyor...' : '⬆️ Dosya Yükle'}
                                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg" />
                                </label>
                            </div>

                            {docsLoading ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                                    <div className="loader" style={{ margin: '0 auto 16px', width: '24px', height: '24px', border: '3px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    Dosyalar getiriliyor...
                                </div>
                            ) : documents.length === 0 ? (
                                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px dashed var(--border-color, rgba(255,255,255,0.1))' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📁</div>
                                    <div style={{ color: 'var(--text-muted, #888)', fontSize: '15px', fontWeight: '500' }}>Henüz dosyası yüklenmemiş. (Maks 5MB PDF, PNG, JPEG)</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                                    {documents.map(doc => (
                                        <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-sm" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', background: 'var(--bg-card, rgba(255,255,255,0.03))', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
                                                {doc.fileType?.includes('pdf') ? '📄' : '🖼️'}
                                            </div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', marginBottom: '8px' }}>
                                                {doc.fileName}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', marginBottom: '20px', fontWeight: '500' }}>
                                                {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                <button onClick={() => handleViewDoc(doc.id, doc.fileType)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.15))', background: 'var(--bg-panel, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }} className="hover:bg-white/10 hover:border-white/30">Aç</button>
                                                <button onClick={() => handleDeleteDoc(doc.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }} className="hover:bg-red-500/20">Sil</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'warranties' ? (
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Dijital Garanti Karnesi & Takip</h3>
                                    <p style={{ color: 'var(--text-muted, #888)', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>Müşteriye satılan ürünlerin garanti süreçlerini yönetin.</p>
                                </div>
                                <button
                                    onClick={() => setWarrantyModalOpen(true)}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                >
                                    🛡️ Garanti Başlat
                                </button>
                            </div>

                            {warranties.length === 0 ? (
                                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px dashed var(--border-color, rgba(255,255,255,0.1))' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🛡️</div>
                                    <div style={{ color: 'var(--text-main, #fff)', fontSize: '16px', fontWeight: '600' }}>Henüz kayıtlı garanti karnesi bulunmuyor.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                    {warranties.map(w => (
                                        <div key={w.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/30" style={{
                                            padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: 'linear-gradient(90deg, var(--bg-card, rgba(255,255,255,0.03)) 0%, rgba(255,255,255,0) 100%)',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '16px',
                                                    background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                                }}>
                                                    🛡️
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main, white)' }}>{w.productName}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #888)', marginTop: '4px', display: 'flex', gap: '12px', fontWeight: '500' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🏷</span> S. No: <span style={{ color: 'var(--text-main, #ccc)' }}>{w.serialNo}</span></span>
                                                        <span>•</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.6 }}>🧾</span> Fatura: <span style={{ color: 'var(--text-main, #ccc)' }}>{w.invoiceNo}</span></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px' }}>BAŞLANGIÇ</div>
                                                    <div style={{ color: 'var(--text-main, white)', fontWeight: '700', fontSize: '14px' }}>{new Date(w.startDate).toLocaleDateString()}</div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '4px' }}>BİTİŞ</div>
                                                    <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>{new Date(w.endDate).toLocaleDateString()}</div>
                                                </div>

                                                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                                                    <div style={{
                                                        padding: '8px 16px', borderRadius: '8px',
                                                        background: w.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: w.status === 'Active' ? '#10b981' : '#ef4444',
                                                        border: `1px solid ${w.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                        fontSize: '12px', fontWeight: '800',
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                                                    }}>
                                                        {w.status === 'Active' ? '✅ Garantisi Devam Ediyor' : '❌ Süresi Doldu'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #666)', marginTop: '8px', fontWeight: '600' }}>
                                                        G. Süresi: {w.period}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'checks' ? (
                        <div style={{ padding: '32px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Müşteri Çek & Senetleri</h3>
                            </div>
                            {!customer.checks || customer.checks.length === 0 ? (
                                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px dashed var(--border-color, rgba(255,255,255,0.1))' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📑</div>
                                    <div style={{ color: 'var(--text-main, #fff)', fontSize: '16px', fontWeight: '600' }}>Kayıtlı evrak bulunmuyor.</div>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted, #888)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                <th style={{ padding: '16px 20px' }}>EVRAK TÜRÜ</th>
                                                <th style={{ padding: '16px 20px' }}>VADE TARİHİ</th>
                                                <th style={{ padding: '16px 20px' }}>BANKA / NO</th>
                                                <th style={{ padding: '16px 20px' }}>DURUM</th>
                                                <th style={{ textAlign: 'right', padding: '16px 20px' }}>TUTAR</th>
                                                <th style={{ textAlign: 'right', padding: '16px 20px' }}>İŞLEM</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customer.checks.map((c: any) => (
                                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', fontSize: '13px', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                                    <td style={{ padding: '20px', fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{c.type}</td>
                                                    <td style={{ padding: '20px', color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>{new Date(c.dueDate).toLocaleDateString('tr-TR')}</td>
                                                    <td style={{ padding: '20px', color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>{c.bank} - <span style={{ fontFamily: 'monospace' }}>{c.number}</span></td>
                                                    <td style={{ padding: '20px' }}>
                                                        <span style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{c.status}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '800', padding: '20px', color: '#3b82f6', fontSize: '14px' }}>{Number(c.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                    <td style={{ textAlign: 'right', padding: '20px' }}>
                                                        {(c.status === 'Portföyde' || c.status === 'Beklemede') && (
                                                            <button
                                                                onClick={() => {
                                                                    setActiveCheck(c);
                                                                    setTargetKasaId(String(kasalar[0]?.id || ''));
                                                                    setShowCheckCollectModal(true);
                                                                }}
                                                                style={{ padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                className="hover:bg-blue-500 hover:text-white"
                                                            >
                                                                {c.type.includes('Alınan') ? '💰 Tahsil Et' : '💸 Öde'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'reconciliations' ? (
                        <div style={{ padding: '32px' }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Cari Mutabakatlar</h3>
                                <button
                                    onClick={() => setReconWizardOpen(true)}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                >
                                    🤝 Mutabakat Başlat
                                </button>
                            </div>

                            {(!customer.reconciliations || customer.reconciliations.length === 0) ? (
                                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '16px', border: '1px dashed var(--border-color, rgba(255,255,255,0.1))' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🤝</div>
                                    <div style={{ color: 'var(--text-main, #fff)', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Bu cariyle henüz mutabakat yapılmamış.</div>
                                    <button
                                        onClick={() => router.push('/reconciliation/list')}
                                        style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                        className="hover:bg-blue-500 hover:text-white"
                                    >
                                        Mevcut İşlemleri Gör
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                        <thead>
                                            <tr style={{ color: 'var(--text-muted, #888)', fontSize: '11px', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                <th style={{ padding: '16px 20px' }}>DÖNEM</th>
                                                <th style={{ padding: '16px 20px' }}>TARİH</th>
                                                <th style={{ padding: '16px 20px' }}>DURUM</th>
                                                <th style={{ textAlign: 'right', padding: '16px 20px' }}>BAKİYE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customer.reconciliations.map((r: any) => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', fontSize: '13px', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => router.push('/reconciliation')} className="hover:bg-white/5">
                                                    <td style={{ padding: '20px', fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{new Date(r.periodStart).toLocaleDateString('tr-TR')} - {new Date(r.periodEnd).toLocaleDateString('tr-TR')}</td>
                                                    <td style={{ padding: '20px', color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>{new Date(r.createdAt || r.date).toLocaleDateString('tr-TR')}</td>
                                                    <td style={{ padding: '20px' }}>
                                                        <span style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{r.status || 'Bekliyor'}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '800', padding: '20px', color: '#3b82f6', fontSize: '14px' }}>{Number(r.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', color: 'var(--text-muted, #888)', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                                        <th style={{ padding: '24px' }}>Tarih</th>
                                        <th style={{ padding: '24px' }}>Hareket Türü</th>
                                        <th style={{ padding: '24px' }}>Açıklama</th>
                                        <th style={{ padding: '24px', textAlign: 'right' }}>Tutar</th>
                                        <th style={{ padding: '24px', textAlign: 'right', width: '220px' }}>Aksiyonlar</th>
                                        <th style={{ padding: '24px', textAlign: 'center', width: '60px' }}></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredHistory.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted, #666)', fontSize: '15px', fontWeight: '500' }}>Bu kategoride kayıt veya işlem bulunamadı.</td></tr>
                                    ) : (
                                        paginatedHistory.map((item, idx) => (
                                            <Fragment key={item.id || idx}>
                                                <tr
                                                    onClick={() => item.items && setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                                                    style={{
                                                        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                                                        cursor: item.items ? 'pointer' : 'default',
                                                        background: expandedRowId === item.id ? 'var(--bg-card, rgba(255,255,255,0.03))' : 'transparent',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    className="hover:bg-white/5"
                                                >
                                                    <td style={{ padding: '24px', fontSize: '13px', color: 'var(--text-main, #ddd)', fontWeight: '600' }}>{item.date}</td>
                                                    <td style={{ padding: '24px' }}>
                                                        <span style={{
                                                            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '800',
                                                            background: item.color + '15', color: item.color, border: '1px solid ' + item.color + '30'
                                                        }}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '24px', fontSize: '13px', color: 'var(--text-muted, #aaa)', fontWeight: '500' }}>{item.desc}</td>
                                                    <td style={{ padding: '24px', textAlign: 'right', fontWeight: '800', fontSize: '15px', color: item.amount > 0 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                                                        {Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </td>
                                                    <td style={{ padding: '24px', textAlign: 'right' }}>
                                                        {item.type === 'Satış' && (
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap', alignItems: 'center' }}>
                                                                {item.orderId && (
                                                                    item.isFormal ? (
                                                                        <>
                                                                            <span style={{
                                                                                padding: '6px 10px',
                                                                                background: 'rgba(16,185,129,0.1)',
                                                                                color: '#10b981',
                                                                                border: '1px solid rgba(16,185,129,0.2)',
                                                                                borderRadius: '8px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '800',
                                                                                whiteSpace: 'nowrap',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px'
                                                                            }}>
                                                                                ✅ Faturalandı
                                                                            </span>
                                                                            {item.formalInvoiceId && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${item.formalInvoiceId}`, '_blank');
                                                                                    }}
                                                                                    style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                                    className="hover:bg-indigo-500 hover:text-white transition-colors"
                                                                                >
                                                                                    🖨️ Yazdır
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleOpenInvoicing(item.orderId); }}
                                                                            style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                                                                            className="hover:bg-blue-500 hover:text-white box-shadow-blue"
                                                                        >
                                                                            🧾 Faturalandır
                                                                        </button>
                                                                    )
                                                                )}
                                                                {(() => {
                                                                    const isVadelendi = customer?.paymentPlans?.some((p: any) => p.title === item.desc || p.description === item.id || (item.orderId && p.description === item.orderId));
                                                                    return (
                                                                        <button
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation(); 
                                                                                if (!isVadelendi) handleOpenPlanModal(item); 
                                                                            }}
                                                                            disabled={isVadelendi}
                                                                            style={{ padding: '6px 12px', background: isVadelendi ? 'var(--bg-card, rgba(255,255,255,0.05))' : 'rgba(245, 158, 11, 0.1)', color: isVadelendi ? 'var(--text-muted, #888)' : '#f59e0b', border: isVadelendi ? '1px solid var(--border-color, rgba(255,255,255,0.1))' : '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: isVadelendi ? 'default' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', opacity: isVadelendi ? 0.7 : 1 }}
                                                                            className={isVadelendi ? "" : "hover:bg-amber-500 hover:text-white"}
                                                                        >
                                                                            {isVadelendi ? '✅ Vadelendi' : '📅 Vadelendir'}
                                                                        </button>
                                                                    );
                                                                })()}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!completedIds.includes(item.id) && !processingIds.includes(item.id)) {
                                                                            handleReturnTransaction(item.id);
                                                                        }
                                                                    }}
                                                                    disabled={completedIds.includes(item.id) || processingIds.includes(item.id)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        background: completedIds.includes(item.id) ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                                                        color: completedIds.includes(item.id) ? 'var(--text-muted, #666)' : '#ef4444',
                                                                        border: completedIds.includes(item.id) ? '1px solid var(--border-color, rgba(255,255,255,0.1))' : '1px solid rgba(239, 68, 68, 0.3)',
                                                                        borderRadius: '8px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '800',
                                                                        cursor: completedIds.includes(item.id) ? 'default' : 'pointer',
                                                                        whiteSpace: 'nowrap',
                                                                        opacity: processingIds.includes(item.id) ? 0.5 : 1,
                                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    className={!completedIds.includes(item.id) && !processingIds.includes(item.id) ? "hover:bg-red-500 hover:text-white" : ""}
                                                                    title="İşlemi İade Al / İptal Et"
                                                                >
                                                                    {processingIds.includes(item.id) ? '⏳' : (completedIds.includes(item.id) ? '✅ İade Edildi' : '↩️ İptal')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #666)' }}>{item.items ? (expandedRowId === item.id ? '▲' : '▼') : ''}</td>
                                                </tr>
                                                {expandedRowId === item.id && item.items && (
                                                    <tr style={{ background: '#080a0f', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.03))' }}>
                                                        <td colSpan={6} style={{ padding: '24px 32px' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                                                                {/* Sol Taraf: Kalemler (Order Summary) */}
                                                                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', paddingBottom: '16px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                                                📦
                                                                            </div>
                                                                            <div>
                                                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-main, #fff)', letterSpacing: '0.5px' }}>SATIŞ ÖZETİ</h4>
                                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{item.items.length} Kalem Listeleniyor</div>
                                                                            </div>
                                                                        </div>
                                                                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{item.isFormal ? 'Faturalandı' : 'Sipariş'}</span>
                                                                    </div>

                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        {item.items.map((sub: any, sIdx: number) => (
                                                                            <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-panel, rgba(0,0,0,0.2))', borderRadius: '12px', border: '1px solid var(--border-color, rgba(255,255,255,0.02))' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-card, rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted, #888)', fontWeight: '800' }}>
                                                                                        {sIdx + 1}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div style={{ color: 'var(--text-main, #e2e8f0)', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{sub.name || sub.productName}</div>
                                                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #888)', background: 'var(--bg-card, rgba(255,255,255,0.05))', padding: '2px 6px', borderRadius: '4px' }}>x{sub.qty || sub.quantity}</span>
                                                                                            {sub.price && <span style={{ fontSize: '11px', color: 'var(--text-muted, #666)' }}>Birim: {Number(sub.price).toLocaleString('tr-TR')} ₺</span>}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ fontWeight: '800', color: 'var(--text-main, #fff)', fontFamily: 'monospace', fontSize: '15px' }}>
                                                                                    {((sub.price || 0) * (sub.qty || sub.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Sağ Taraf: Payment Breakdown & Timeline */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                                                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                        <h4 style={{ margin: '0 0 20px 0', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1px' }}>FİNANSAL ÖZET</h4>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted, #aaa)' }}>
                                                                                <span>Ara Toplam</span>
                                                                                <span>{Math.abs(item.amount * 0.8).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted, #aaa)' }}>
                                                                                <span>KDV (%20)</span>
                                                                                <span>{Math.abs(item.amount * 0.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                                            </div>
                                                                            <div style={{ height: '1px', background: 'var(--border-color, rgba(255,255,255,0.1))', margin: '8px 0' }}></div>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>GENEL TOPLAM</span>
                                                                                <span style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6', fontFamily: 'monospace' }}>
                                                                                    {Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {(() => {
                                                                        const attachedPlan = customer?.paymentPlans?.find((p: any) => p.title === item.desc || p.description === item.id || (item.orderId && p.description === item.orderId));
                                                                        if (!attachedPlan) return null;
                                                                        return (
                                                                            <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                                                    <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#f59e0b', letterSpacing: '1px' }}>ÖDEME PLANI DETAYI</h4>
                                                                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '8px' }}>{attachedPlan.installments?.length || attachedPlan.installmentCount} Taksit</span>
                                                                                </div>
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                                    {attachedPlan.installments?.map((inst: any) => (
                                                                                        <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-panel, rgba(0,0,0,0.2))', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                                            <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px', fontWeight: '600' }}>{inst.installmentNo}. Taksit ({new Date(inst.dueDate).toLocaleDateString('tr-TR')})</span>
                                                                                            <span style={{ color: 'var(--text-main, #fff)', fontSize: '14px', fontWeight: '800', fontFamily: 'monospace' }}>{Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()}

                                                                    <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                        <h4 style={{ margin: '0 0 20px 0', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '1px' }}>ZAMAN ÇİZELGESİ</h4>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                                                            <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color, rgba(255,255,255,0.05))' }}></div>

                                                                            <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6', border: '4px solid #080a0f', flexShrink: 0, marginTop: '2px' }}></div>
                                                                                <div>
                                                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Satış Oluşturuldu</div>
                                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{item.date} • İşlem No: #{item.id?.substring(0, 8)}</div>
                                                                                </div>
                                                                            </div>

                                                                            {item.isFormal && (
                                                                                <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '4px solid #080a0f', flexShrink: 0, marginTop: '2px' }}></div>
                                                                                    <div>
                                                                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Resmileştirildi (Faturalandı)</div>
                                                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>Sistem tarafından E-Arşive eklendi</div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

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
                        </div>
                    )}

                    {/* PAGINATION */}
                    <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>

            </div >

            {/* MODALS START HERE */}

            {/* INVOICE MODAL (Professional E-Fatura Style) */}
            {
                invoiceModalOpen && selectedOrder && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '1200px', maxWidth: '98vw', padding: 0, border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(59, 130, 246, 0.1)' }}>
                            {/* Header */}
                            <div style={{ padding: '24px 40px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ padding: '10px', background: '#3b82f6', borderRadius: '12px', fontSize: '20px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>📄</span>
                                        RESMİ FATURALANDIRMA SİSTEMİ
                                    </h2>
                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '800', letterSpacing: '2px', marginTop: '6px' }}>E-ARŞİV / E-FATURA TASLAĞI</div>
                                </div>
                                <button onClick={() => setInvoiceModalOpen(false)} style={{ width: '48px', height: '48px', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-white/10 hover:border-white/30">&times;</button>
                            </div>

                            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px', maxHeight: '80vh', overflowY: 'auto', background: 'var(--bg-panel, #0f172a)' }}>

                                {/* Section: Buyer Information */}
                                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#3b82f6', marginBottom: '24px', borderLeft: '4px solid #3b82f6', paddingLeft: '12px', letterSpacing: '1px' }}>ALICI BİLGİLERİ</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                        <div className="flex-col gap-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)' }}>ÜNVAN / AD SOYAD</label>
                                            <input id="inv_name" defaultValue={customer.name} style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '12px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontWeight: '700', fontSize: '14px' }} className="focus:border-blue-500 focus:bg-blue-500/5 transition-colors" />
                                        </div>
                                        <div className="flex-col gap-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)' }}>V.N. / T.C. KİMLİK NO</label>
                                            <input id="inv_tax_no" defaultValue={customer.taxNumber} style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '12px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontWeight: '700', fontSize: '14px' }} className="focus:border-blue-500 focus:bg-blue-500/5 transition-colors" />
                                        </div>
                                        <div className="flex-col gap-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)' }}>VERGİ DAİRESİ</label>
                                            <input id="inv_tax_office" defaultValue={customer.taxOffice} style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '12px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontWeight: '700', fontSize: '14px' }} className="focus:border-blue-500 focus:bg-blue-500/5 transition-colors" />
                                        </div>
                                        <div className="flex-col gap-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)' }}>TELEFON</label>
                                            <input id="inv_phone" defaultValue={customer.phone} style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '12px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontWeight: '700', fontSize: '14px' }} className="focus:border-blue-500 focus:bg-blue-500/5 transition-colors" />
                                        </div>
                                        <div className="flex-col gap-2" style={{ gridColumn: 'span 4' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)' }}>ADRES</label>
                                            <textarea id="inv_address" defaultValue={customer.address} style={{ width: '100%', minHeight: '80px', borderRadius: '14px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', padding: '16px 20px', fontWeight: '600', resize: 'vertical', fontSize: '14px' }} className="focus:border-blue-500 focus:bg-blue-500/5 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Ekstra Seçenekler */}
                                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', marginBottom: '40px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#10b981', marginBottom: '24px', borderLeft: '4px solid #10b981', paddingLeft: '12px', letterSpacing: '1px' }}>EKSTRA SEÇENEKLER</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <input type="checkbox" id="inv_create_wayslip" style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#10b981' }} />
                                        <label htmlFor="inv_create_wayslip" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, white)', cursor: 'pointer', userSelect: 'none' }}>
                                            Fatura ile birlikte Giden Sevk İrsaliyesi oluştur <span style={{color: '#94a3b8', fontWeight: '600', fontSize: '13px'}}>(İrsaliye numarası fatura üzerine yazılır)</span>
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input type="checkbox" id="inv_is_installment" checked={isInstallmentInvoice} onChange={(e) => setIsInstallmentInvoice(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                                        <label htmlFor="inv_is_installment" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main, white)', cursor: 'pointer', userSelect: 'none' }}>
                                            Vade Uygula ve Ödeme Planı Yarat <span style={{color: '#94a3b8', fontWeight: '600', fontSize: '13px'}}>(Fatura içeriğine otomatik eklenecektir)</span>
                                        </label>
                                    </div>
                                    {isInstallmentInvoice && (
                                        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main, white)' }}>Vade Sayısı:</span>
                                                <select value={invoiceInstallmentCount} onChange={e => setInvoiceInstallmentCount(Number(e.target.value))} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-panel, #0f172a)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '800', outline: 'none' }}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n} Ay Vade</option>)}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main, white)' }}>Ödeme Türü:</span>
                                                <select id="inv_installment_type" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--bg-panel, #0f172a)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '800', outline: 'none' }}>
                                                    <option value="Açık Hesap">Açık Hesap</option>
                                                    <option value="Çek">Çek Alınacak</option>
                                                    <option value="Senet">Senet (Periodya İmza)</option>
                                                </select>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', width: '100%', marginTop: '4px' }}>
                                                📝 Not: Sensiz (Çek/Senet) ödeme planları finansal hareketlerde o kategorilerde takip edilir. Senet seçeneği "Periodya Trust & Compliance Suite" (Dijital İmza) kullanılarak müşterinin e-onayına sunulur.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Items Table */}
                                <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#3b82f6', margin: 0, borderLeft: '4px solid #3b82f6', paddingLeft: '12px', letterSpacing: '1px' }}>FATURA KALEMLERİ</h3>
                                        <button
                                            onClick={() => setIsProductPickerOpen(true)}
                                            style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            className="hover:bg-blue-500 hover:text-white"
                                        >
                                            <span>➕</span> Envanterden Ürün Seç
                                        </button>
                                    </div>
                                    <div style={{ background: 'var(--bg-panel, rgba(0,0,0,0.2))', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', color: 'var(--text-muted, #666)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    <th style={{ padding: '16px 20px', textAlign: 'center', width: '50px' }}>NO</th>
                                                    <th style={{ padding: '16px 20px', textAlign: 'left', minWidth: '250px' }}>MALZEME / HİZMET</th>
                                                    <th style={{ padding: '16px 20px', textAlign: 'center', width: '90px' }}>MİKTAR</th>
                                                    <th style={{ padding: '16px 20px', textAlign: 'right', width: '150px' }}>BİRİM FİYAT (NET)</th>

                                                    <th style={{ padding: '16px 20px', textAlign: 'center', width: '90px' }}>KDV %</th>
                                                    <th style={{ padding: '16px 20px', textAlign: 'right', width: '120px' }}>KDV TUTARI</th>
                                                    <th style={{ padding: '16px 20px', textAlign: 'right', width: '160px' }}>BRÜT TOPLAM</th>
                                                    <th style={{ width: '60px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceItems.map((it: any, i: number) => {
                                                    const qty = Number(it.qty || 1);
                                                    const netPrice = Number(it.price || 0);
                                                    const vatRate = Number(it.vat || 20);
                                                    const otvRate = Number(it.otv || 0);

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
                                                        const calculatedNet = newGross / (qty * (1 + otvRate / 100) * (1 + vatRate / 100));
                                                        updateItem('price', calculatedNet);
                                                    };

                                                    return (
                                                        <tr key={it.id || i} style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', fontSize: '14px', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                                            <td style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted, #888)', fontWeight: '700' }}>{i + 1}</td>
                                                            <td style={{ padding: '20px' }}>
                                                                <div className="flex-col gap-2">
                                                                    <select
                                                                        value={it.productId || ''}
                                                                        onChange={(e) => {
                                                                            const selectedProduct = products.find(p => String(p.id) === e.target.value);
                                                                            if (selectedProduct) {
                                                                                const currentItems = JSON.parse(JSON.stringify(invoiceItems));
                                                                                currentItems[i] = {
                                                                                    ...currentItems[i],
                                                                                    productId: selectedProduct.id,
                                                                                    name: selectedProduct.name,
                                                                                    price: Number(selectedProduct.price || 0),
                                                                                    vat: Number(selectedProduct.salesVat || 20),
                                                                                    otv: Number(selectedProduct.salesOtv || 0),
                                                                                    otvCode: selectedProduct.otvCode || '0071',
                                                                                    otvType: selectedProduct.otvType || 'Ö.T.V yok',
                                                                                    oiv: Number(selectedProduct.salesOiv || 0),
                                                                                    description: selectedProduct.showDescriptionOnInvoice ? (selectedProduct.description || '') : '',
                                                                                    showDesc: selectedProduct.showDescriptionOnInvoice ? true : false
                                                                                };
                                                                                setInvoiceItems(currentItems);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            width: '100%',
                                                                            background: 'var(--bg-card, rgba(255,255,255,0.05))',
                                                                            border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                                                            color: 'var(--text-main, white)',
                                                                            fontWeight: '700',
                                                                            padding: '12px 16px',
                                                                            borderRadius: '12px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px'
                                                                        }}
                                                                    >
                                                                        <option value="">Ürün veya hizmet seçin...</option>
                                                                        {products.map(p => (
                                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    {it.name && it.name !== 'Ürün' && (
                                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', paddingLeft: '6px', fontWeight: '500' }}>
                                                                            Seçili: {it.name}
                                                                        </div>
                                                                    )}
                                                                    <div style={{ paddingLeft: '6px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                        {(it.otvType && it.otvType !== 'Ö.T.V yok') && (
                                                                            <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)', fontWeight: '800' }}>
                                                                                {it.otvType === 'yüzdesel Ö.T.V' ? `ÖTV %${it.otv}` : `ÖTV ${it.otv} ₺`}
                                                                            </span>
                                                                        )}
                                                                        {(Number(it.oiv || 0) > 0) && (
                                                                            <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.2)', fontWeight: '800' }}>
                                                                                ÖİV %${it.oiv}
                                                                            </span>
                                                                        )}
                                                                            <button
                                                                                onClick={() => updateItem('showDesc', !it.showDesc)}
                                                                                style={{ fontSize: '11px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: it.showDesc ? '#3b82f6' : 'var(--text-muted, #aaa)', border: `1px dashed ${it.showDesc ? '#3b82f6' : 'var(--border-color, rgba(255,255,255,0.2))'}`, padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontWeight: '700' }}
                                                                                className="hover:border-blue-500 hover:text-blue-500"
                                                                            >
                                                                                📝 {it.showDesc ? 'Açıklamayı Gizle' : 'Açıklama Ekle'}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setTaxEditIndex(i)}
                                                                                style={{ fontSize: '11px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-muted, #aaa)', border: '1px dashed var(--border-color, rgba(255,255,255,0.2))', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', fontWeight: '700' }}
                                                                                className="hover:border-blue-500 hover:text-blue-500"
                                                                            >
                                                                                ⚙️ Vergi Ayarı
                                                                            </button>
                                                                        </div>
                                                                        {it.showDesc && (
                                                                            <div style={{ marginTop: '12px' }} className="animate-in fade-in slide-in-from-top-1 duration-200">
                                                                                <textarea
                                                                                    placeholder="Malzeme / Hizmet Açıklaması (Örn: ŞASE NO: XYZ, Motor NO: 123...)"
                                                                                    value={it.description || ''}
                                                                                    onChange={(e) => updateItem('description', e.target.value)}
                                                                                    style={{ width: '100%', background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', resize: 'vertical', minHeight: '60px', outline: 'none' }}
                                                                                    className="focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all custom-scrollbar"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    value={it.qty}
                                                                    onChange={(e) => updateItem('qty', Number(e.target.value))}
                                                                    style={{ width: '70px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', textAlign: 'center', borderRadius: '10px', padding: '12px 8px', fontWeight: '700' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                                    <input
                                                                        type="number"
                                                                        step="0.0001"
                                                                        value={netPrice > 0 ? Number(netPrice.toFixed(4)) : ''}
                                                                        placeholder="0.00"
                                                                        onChange={(e) => updateItem('price', Number(e.target.value))}
                                                                        style={{ width: '120px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', textAlign: 'right', borderRadius: '10px', padding: '12px 10px', fontWeight: '700', fontFamily: 'monospace' }}
                                                                    />
                                                                    <span style={{ color: 'var(--text-muted, #888)', fontSize: '12px', fontWeight: '700' }}>₺ + KDV</span>
                                                                </div>
                                                            </td>

                                                            <td style={{ padding: '20px', textAlign: 'center' }}>
                                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                    <input
                                                                        type="number"
                                                                        value={it.vat}
                                                                        onChange={(e) => updateItem('vat', Number(e.target.value))}
                                                                        style={{ width: '64px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', textAlign: 'center', borderRadius: '10px', padding: '12px 20px 12px 8px', fontWeight: '700' }}
                                                                    />
                                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted, #888)', pointerEvents: 'none' }}>%</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'right', color: 'var(--text-muted, #888)', fontFamily: 'monospace', fontWeight: '700', fontSize: '15px' }}>
                                                                {vatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'right' }}>
                                                                <input
                                                                    type="number"
                                                                    value={lineGrossTotal.toFixed(2)}
                                                                    onChange={(e) => handleGrossChange(Number(e.target.value))}
                                                                    style={{ width: '130px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#3b82f6', textAlign: 'right', borderRadius: '10px', fontWeight: '900', fontFamily: 'monospace', padding: '12px 10px', fontSize: '15px' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '20px', textAlign: 'center' }}>
                                                                <button onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-red-500 hover:text-white">🗑️</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section: Totals Summary */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                    <div style={{ width: '480px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.1) 100%)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 12px 30px rgba(59, 130, 246, 0.15)' }}>
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
                                                <div className="flex-col gap-4">
                                                    <div className="flex-between">
                                                        <span style={{ fontSize: '14px', color: 'var(--text-muted, #888)', fontWeight: '700' }}>Ara Toplam (Net)</span>
                                                        <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #fff)', fontFamily: 'monospace' }}>{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    {totalOtv > 0 && (
                                                        <div className="flex-between">
                                                            <span style={{ fontSize: '14px', color: 'var(--text-muted, #888)', fontWeight: '700' }}>ÖTV Toplam</span>
                                                            <span style={{ fontWeight: '800', fontSize: '15px', color: '#f59e0b', fontFamily: 'monospace' }}>{totalOtv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                        </div>
                                                    )}

                                                    <div className="flex-between">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '14px', color: 'var(--text-muted, #888)', fontWeight: '700' }}>İskonto (İndirim)</span>
                                                            <select
                                                                value={discountType}
                                                                onChange={(e: any) => setDiscountType(e.target.value)}
                                                                style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, white)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '13px', fontWeight: '800' }}
                                                            >
                                                                <option value="percent">% Yüzde</option>
                                                                <option value="amount">₺ Tutar</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={discountValue}
                                                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                                style={{ width: '80px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, white)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '14px', padding: '6px 12px', fontWeight: '800', textAlign: 'center' }}
                                                            />
                                                        </div>
                                                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#ef4444', fontFamily: 'monospace' }}>- {discAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div className="flex-between">
                                                        <span style={{ fontSize: '14px', color: 'var(--text-muted, #888)', fontWeight: '700' }}>KDV Toplam</span>
                                                        <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #fff)', fontFamily: 'monospace' }}>{totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.4) 50%, transparent 100%)', margin: '20px 0' }}></div>

                                                    <div className="flex-between items-center">
                                                        <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>GENEL TOPLAM</span>
                                                        <span style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6', letterSpacing: '-1px', textShadow: '0 4px 12px rgba(59,130,246,0.3)', fontFamily: 'monospace' }}>{finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '20px', opacity: 0.8 }}>₺</span></span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                            </div>

                            {/* Footer Actions */}
                            <div style={{ padding: '24px 40px', background: 'var(--bg-panel, rgba(15, 23, 42, 0.95))', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setInvoiceModalOpen(false)} className="btn btn-outline" style={{ minWidth: '160px', height: '60px', borderRadius: '16px', fontWeight: '800', fontSize: '15px', border: '1px solid var(--border-color, rgba(255,255,255,0.15))', color: 'var(--text-main, #fff)', background: 'var(--bg-card, rgba(255,255,255,0.05))', letterSpacing: '1px' }}>İPTAL ET</button>
                                <button
                                    disabled={isConverting}
                                    onClick={() => {
                                        const data = {
                                            taxNumber: (document.getElementById('inv_tax_no') as HTMLInputElement).value,
                                            taxOffice: (document.getElementById('inv_tax_office') as HTMLInputElement).value,
                                            address: (document.getElementById('inv_address') as HTMLTextAreaElement).value,
                                            phone: (document.getElementById('inv_phone') as HTMLInputElement).value,
                                            name: (document.getElementById('inv_name') as HTMLInputElement).value,
                                            isFormal: true,
                                            createWayslip: (document.getElementById('inv_create_wayslip') as HTMLInputElement)?.checked || false,
                                            isInstallment: isInstallmentInvoice,
                                            installments: invoiceInstallmentCount,
                                            installmentType: (document.getElementById('inv_installment_type') as HTMLSelectElement)?.value || 'Açık Hesap',
                                            description: (() => {
                                                if (isInstallmentInvoice) {
                                                    const dates = [];
                                                    const baseDate = new Date();
                                                    for (let i = 1; i <= invoiceInstallmentCount; i++) {
                                                        const d = new Date(baseDate);
                                                        d.setMonth(d.getMonth() + i);
                                                        dates.push(d.toLocaleDateString('tr-TR'));
                                                    }
                                                    const instType = (document.getElementById('inv_installment_type') as HTMLSelectElement)?.value || 'Açık Hesap';
                                                    return `VADE SAYISI: ${invoiceInstallmentCount} | ÖDEME TİPİ: ${instType} | VADE TARİHLERİ: ${dates.join(', ')}`;
                                                }
                                                return '';
                                            })()
                                        };
                                        handleConvertToInvoice(data);
                                    }}
                                    style={{ minWidth: '260px', height: '60px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 12px 24px rgba(37, 99, 235, 0.4)', fontSize: '16px', letterSpacing: '1px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                                    className={isConverting ? "opacity-70" : "hover:-translate-y-1 hover:shadow-2xl"}
                                >
                                    {isConverting ? (
                                        <><div className="loader border-t-white w-5 h-5 rounded-full border-2 border-white/20 animate-spin"></div> İŞLENİYOR...</>
                                    ) : (
                                        <><span>✅</span> FATURAYI ONAYLA</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* INVOICE SUCCESS & SHARE MODAL */}
            {
                shareModalOpen && lastInvoice && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '480px', padding: '48px 40px', borderRadius: '32px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'var(--bg-panel, #0f172a)', boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(16, 185, 129, 0.15)' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', margin: '0 auto 32px', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.2)' }}>
                                🎉
                            </div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main, #fff)', marginBottom: '12px', letterSpacing: '-0.5px' }}>Fatura Hazır!</h2>
                            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6', fontWeight: '500' }}>Resmi faturanız başarıyla oluşturuldu ve GİB sistemine entegre edildi.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <button
                                    onClick={() => {
                                        const msg = `Sayın ${customer.name}, ${lastInvoice.invoiceNo} numaralı faturanızı bu bağlantıdan görüntüleyebilirsiniz: https://www.periodya.com/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`;
                                        window.open(`https://wa.me/${customer.phone?.replace(/\s/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="btn btn-primary hover:-translate-y-1"
                                    style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)', border: 'none', height: '64px', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s', width: '100%' }}
                                >
                                    <span style={{ fontSize: '24px' }}>💬</span> Müşteriye WhatsApp'tan İlet
                                </button>
                                <button
                                    onClick={() => {
                                        window.location.href = `mailto:${customer.email || ''}?subject=Faturanız Hazır - ${lastInvoice.invoiceNo}&body=Sayın ${customer.name}, %0D%0A%0D%0A${lastInvoice.invoiceNo} numaralı faturanız ekte yer almaktadır. %0D%0A%0D%0AFaturayı görüntülemek için tıkla: https://www.periodya.com/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`;
                                    }}
                                    className="btn btn-outline hover:bg-white/10"
                                    style={{ height: '64px', borderRadius: '20px', fontWeight: '800', border: '1px solid var(--border-color, rgba(255,255,255,0.15))', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s', width: '100%' }}
                                >
                                    <span style={{ fontSize: '24px' }}>📧</span> E-Posta ile Gönder
                                </button>
                                <button
                                    onClick={() => window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`, '_blank')}
                                    style={{ marginTop: '16px', background: 'none', border: 'none', color: '#3b82f6', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                                    className="hover:text-blue-400"
                                >
                                    <span>📄</span> PDF İndir / Görüntüle
                                </button>
                            </div>

                            <button
                                onClick={() => setShareModalOpen(false)}
                                style={{ marginTop: '48px', width: '100%', padding: '20px', background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', borderRadius: '20px', color: 'var(--text-muted, #888)', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '1px' }}
                                className="hover:bg-white/5 hover:text-white"
                            >
                                PENCEREYİ KAPAT
                            </button>
                        </div>
                    </div>
                )
            }


            {/* ADDITIONAL TAX MODAL */}
            {
                taxEditIndex !== null && invoiceItems[taxEditIndex] && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '480px', padding: '40px', borderRadius: '24px', background: 'var(--bg-panel, #0f172a)', border: '1px solid rgba(59, 130, 246, 0.4)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                            <div className="flex-between mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--text-main, white)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '24px' }}>⚙️</span> Ek Vergi Parametreleri
                                </h3>
                                <button onClick={() => setTaxEditIndex(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">&times;</button>
                            </div>

                            <div className="flex-col gap-6">
                                <div className="flex-col gap-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>Ö.T.V UYGULAMA TİPİ</label>
                                    <select
                                        value={invoiceItems[taxEditIndex].otvType || 'Ö.T.V yok'}
                                        onChange={(e) => {
                                            const newItems = [...invoiceItems];
                                            newItems[taxEditIndex].otvType = e.target.value;
                                            if (e.target.value === 'Ö.T.V yok') newItems[taxEditIndex].otv = 0;
                                            setInvoiceItems(newItems);
                                        }}
                                        style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontWeight: '700', fontSize: '15px' }}
                                    >
                                        <option value="Ö.T.V yok">🟢 Uygulanmasın (Yok)</option>
                                        <option value="yüzdesel Ö.T.V">🔵 Yüzde Oranlı (%)</option>
                                        <option value="maktu Ö.T.V">🟠 Sabit Tutarlı (₺)</option>
                                    </select>
                                </div>

                                {invoiceItems[taxEditIndex].otvType !== 'Ö.T.V yok' && (
                                    <div className="flex-col gap-2 animate-scale-in">
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', letterSpacing: '0.5px' }}>BELİRLENEN Ö.T.V {invoiceItems[taxEditIndex].otvType === 'yüzdesel Ö.T.V' ? 'ORANI (%)' : 'TUTARI (₺)'}</label>
                                        <input
                                            type="number"
                                            value={invoiceItems[taxEditIndex].otv || 0}
                                            onChange={(e) => {
                                                const newItems = [...invoiceItems];
                                                newItems[taxEditIndex].otv = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }}
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontWeight: '900', fontSize: '20px', textAlign: 'center' }}
                                        />
                                    </div>
                                )}

                                <div className="flex-col gap-2 pt-4" style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>ÖZEL İLETİŞİM VERGİSİ (Ö.İ.V %)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={invoiceItems[taxEditIndex].oiv || 0}
                                            onChange={(e) => {
                                                const newItems = [...invoiceItems];
                                                newItems[taxEditIndex].oiv = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }}
                                            placeholder="0"
                                            style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontWeight: '700', fontSize: '16px' }}
                                        />
                                        <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--text-muted, #888)' }}>%</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setTaxEditIndex(null)}
                                    style={{ width: '100%', marginTop: '24px', padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)', fontSize: '15px', letterSpacing: '1px', transition: 'all 0.2s' }}
                                    className="hover:-translate-y-1 hover:shadow-sm"
                                >
                                    AYARLARI ONAYLA ✅
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* WARRANTY START MODAL */}
            {
                warrantyModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-panel, #0f172a)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', }}>
                            <div className="flex-between mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--text-main, white)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '24px' }}>🛡️</span> Garanti Başlat
                                </h3>
                                <button onClick={() => setWarrantyModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">&times;</button>
                            </div>

                            <div className="flex-col gap-5">
                                <div className="flex-col gap-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>FATURA SEÇİMİ (Satın Alma Kaydı)</label>
                                    <select
                                        value={newWarranty.invoiceId}
                                        onChange={(e) => {
                                            setNewWarranty({ ...newWarranty, invoiceId: e.target.value, productId: '', productName: '' });
                                        }}
                                        style={{ padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, white)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '700', fontSize: '14px' }}
                                    >
                                        <option value="">İlgili faturayı seçiniz...</option>
                                        {customerInvoices.map(inv => (
                                            <option key={inv.id} value={inv.id}>{inv.number} - {inv.date} ({inv.total} ₺)</option>
                                        ))}
                                    </select>
                                </div>

                                {newWarranty.invoiceId && (
                                    <div className="flex-col gap-2 animate-scale-in">
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>ÜRÜN SEÇİMİ</label>
                                        <select
                                            value={newWarranty.productId}
                                            onChange={(e) => {
                                                const inv = customerInvoices.find(i => i.id.toString() === newWarranty.invoiceId);
                                                const prodItem = inv?.items.find((p: any) => (p.productId || p.id || '').toString() === e.target.value);
                                                let pName = prodItem?.name || '';
                                                if (!pName && prodItem?.productId) {
                                                    const realProd = products.find(p => p.id === prodItem.productId);
                                                    if (realProd) pName = realProd.name;
                                                }
                                                setNewWarranty({ ...newWarranty, productId: e.target.value, productName: pName });
                                            }}
                                            style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.05)', color: 'var(--text-main, white)', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: '700', fontSize: '14px' }}
                                        >
                                            <option value="">Garanti tanımlanacak ürünü seçin...</option>
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
                                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>SERİ NO (KADRO / ŞASİ NO)</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: CR12345678"
                                        value={newWarranty.serialNo}
                                        onChange={(e) => setNewWarranty({ ...newWarranty, serialNo: e.target.value })}
                                        style={{ padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, white)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '700', fontSize: '14px' }}
                                        className="focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="flex-col gap-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>GARANTİ SÜRESİ</label>
                                        <select
                                            value={newWarranty.period}
                                            onChange={(e) => setNewWarranty({ ...newWarranty, period: e.target.value })}
                                            style={{ padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, white)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '700', fontSize: '14px' }}
                                        >
                                            {(warrantyPeriods && warrantyPeriods.length > 0 ? warrantyPeriods : ['6 Ay', '1 Yıl', '2 Yıl', '3 Yıl', '5 Yıl']).map(p => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-col gap-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>BAŞLANGIÇ TARİHİ</label>
                                        <input
                                            type="date"
                                            value={newWarranty.startDate}
                                            onChange={(e) => setNewWarranty({ ...newWarranty, startDate: e.target.value })}
                                            style={{ padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, white)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '700', fontSize: '14px' }}
                                            className="input-date-dark"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartWarranty}
                                    className="btn btn-primary hover:-translate-y-1 hover:shadow-sm"
                                    style={{ marginTop: '24px', padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', border: 'none', color: 'white', fontWeight: '900', fontSize: '15px', letterSpacing: '1px', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)', transition: 'all 0.2s', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <span>✅</span> GARANTİYİ BAŞLAT VE ONAYLA
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* PRODUCT PICKER MODAL */}
            {
                isProductPickerOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '700px', maxWidth: '95vw', padding: '40px', borderRadius: '32px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'var(--bg-panel, #0f172a)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--text-main, white)' }}>Envanterden Ürün Seçimi</h3>
                                    <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '800', marginTop: '6px', letterSpacing: '1px' }}>GERÇEK ZAMANLI STOK & FİYAT BİLGİSİ</div>
                                </div>
                                <button onClick={() => setIsProductPickerOpen(false)} style={{ width: '48px', height: '48px', borderRadius: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-white/10">&times;</button>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '24px' }}>
                                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '20px' }}>🔍</span>
                                <input
                                    autoFocus
                                    placeholder="Ürün adı, barkod veya stok kodu ile arayın..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '18px 20px 18px 56px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', fontSize: '15px', fontWeight: '600' }}
                                    className="focus:border-blue-500 focus:bg-blue-500/5 transition-colors"
                                />
                            </div>

                            <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '12px' }} className="custom-scrollbar">
                                {products
                                    .filter(p => !productSearchTerm || p.name.toLocaleLowerCase('tr').includes(productSearchTerm.toLocaleLowerCase('tr')) || p.barcode?.includes(productSearchTerm) || p.code?.includes(productSearchTerm))
                                    .slice(0, 50)
                                    .map(p => {
                                        const grossPrice = Number(p.price || 0);
                                        const vatRate = Number(p.salesVat || 20);
                                        const otvType = p.otvType || 'Ö.T.V yok';
                                        const otvRate = Number(p.salesOtv || 0);
                                        const otvCode = p.otvCode || '0071';
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
                                                            otvCode: otvCode,
                                                            otvType: otvType,
                                                            oiv: oivRate,
                                                            productId: p.id,
                                                            description: p.showDescriptionOnInvoice ? (p.description || '') : '',
                                                            showDesc: p.showDescriptionOnInvoice ? true : false
                                                        }]);
                                                    }
                                                    setIsProductPickerOpen(false);
                                                    setProductSearchTerm('');
                                                }}
                                                style={{ padding: '20px', borderRadius: '20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                                                className="hover:border-blue-500/50 hover:bg-blue-500/5 hover:-translate-y-0.5 hover:shadow-sm"
                                            >
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div style={{ width: '52px', height: '52px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#3b82f6', fontWeight: '800', boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.2)' }}>
                                                        {p.category?.charAt(0) || '📦'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #eee)' }}>{p.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '4px', fontWeight: '500' }}>
                                                            Stok: <span style={{ color: p.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '800' }}>{p.stock}</span> <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span> Barkod: <span style={{ fontFamily: 'monospace' }}>{p.barcode || 'Yok'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '900', color: 'var(--text-main, #fff)', fontSize: '18px', fontFamily: 'monospace' }}>{grossPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '800', marginTop: '2px' }}>%{vatRate} KDV DAHİL (BRÜT)</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', gap: '16px' }}>
                                <button
                                    onClick={() => {
                                        setInvoiceItems([...invoiceItems, { name: 'Yeni Manuel Hizmet / Ürün', qty: 1, price: 0, vat: 20 }]);
                                        setIsProductPickerOpen(false);
                                    }}
                                    style={{ flex: 1, padding: '18px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.02))', color: 'var(--text-muted, #aaa)', border: '1px dashed var(--border-color, rgba(255,255,255,0.2))', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    className="hover:border-dashed hover:border-white/50 hover:bg-white/5 hover:text-white"
                                >
                                    <span>➕</span> Envanter Dışı Manuel Hizmet Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CHECK COLLECT MODAL */}
            {
                showCheckCollectModal && activeCheck && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.85)', zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ background: 'var(--bg-panel, #0f172a)', padding: '40px', borderRadius: '32px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', width: '100%', maxWidth: '440px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main, #fff)', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span>{activeCheck.type.includes('Alınan') ? '📥' : '📤'}</span>
                                    {activeCheck.type.includes('Alınan') ? 'Tahsilat Onayı' : 'Ödeme Çıkış Onayı'}
                                </h3>
                                <button onClick={() => setShowCheckCollectModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">&times;</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ padding: '24px', background: 'var(--bg-card, rgba(255,255,255,0.03))', borderRadius: '20px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '800', letterSpacing: '1px' }}>{activeCheck.type}</div>
                                    <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text-main, #fff)', fontFamily: 'monospace' }}>{Number(activeCheck.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '24px', opacity: 0.8 }}>₺</span></div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #aaa)', marginTop: '8px', fontWeight: '600' }}>{activeCheck.bank} - <span style={{ fontFamily: 'monospace' }}>{activeCheck.number}</span></div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted, #bbb)', fontWeight: '800', letterSpacing: '0.5px' }}>{activeCheck.type.includes('Alınan') ? 'TAHSİLATIN GEÇECEĞİ (GİRECEĞİ) HESAP' : 'ÖDEMENİN ÇIKACAĞI HESAP'}</label>
                                    <select
                                        value={targetKasaId}
                                        onChange={(e) => setTargetKasaId(e.target.value)}
                                        style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                                        className="focus:border-blue-500"
                                    >
                                        <option value="">İşlem yapılacak kasayı seçin...</option>
                                        {kasalar.filter((k: any) => k.name !== 'ÇEK / SENET PORTFÖYÜ').map((k: any) => (
                                            <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleExecuteCheckCollect}
                                    disabled={isProcessingCollection || !targetKasaId}
                                    style={{
                                        width: '100%', padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff',
                                        border: 'none', fontWeight: '900', fontSize: '15px', cursor: 'pointer',
                                        opacity: (isProcessingCollection || !targetKasaId) ? 0.6 : 1, transition: 'all 0.2s',
                                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)', letterSpacing: '1px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                    className={(!isProcessingCollection && targetKasaId) ? "hover:-translate-y-1 hover:shadow-sm" : ""}
                                >
                                    {isProcessingCollection ? (
                                        <><div className="loader border-t-white w-4 h-4 rounded-full border-2 border-white/20 animate-spin"></div> İŞLENİYOR...</>
                                    ) : (
                                        <><span>✅</span> İŞLEMİ TAMAMLA</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* PLAN MODAL */}
            {
                showPlanModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '520px', maxWidth: '90vw', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'var(--bg-panel, #0f172a)', padding: '0', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ padding: '8px', background: '#f59e0b', borderRadius: '12px', fontSize: '18px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}>📅</span>
                                    Vadeli Satış Planı Oluştur
                                </h3>
                                <button onClick={() => setShowPlanModal(false)} style={{ background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, #fff)', fontSize: '20px', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-white/10">&times;</button>
                            </div>
                            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted, #888)', fontSize: '11px', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>ÖDEME PLANI BAŞLIĞI</label>
                                    <input
                                        value={planData.title}
                                        onChange={e => setPlanData({ ...planData, title: e.target.value })}
                                        style={{ width: '100%', padding: '16px 20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', borderRadius: '16px', fontWeight: '700', fontSize: '14px' }}
                                        className="focus:border-amber-500 focus:bg-amber-500/5 transition-colors"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-muted, #888)', fontSize: '11px', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>TOPLAM TUTAR (₺)</label>
                                        <input
                                            type="number"
                                            value={planData.totalAmount}
                                            onChange={e => setPlanData({ ...planData, totalAmount: e.target.value })}
                                            style={{ width: '100%', padding: '16px 20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', borderRadius: '16px', fontWeight: '900', fontSize: '16px', fontFamily: 'monospace' }}
                                            className="focus:border-amber-500 focus:bg-amber-500/5 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-muted, #888)', fontSize: '11px', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>TAKSİT / VADE SAYISI</label>
                                        <input
                                            type="number"
                                            value={planData.installmentCount}
                                            onChange={e => setPlanData({ ...planData, installmentCount: e.target.value })}
                                            style={{ width: '100%', padding: '16px 20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', borderRadius: '16px', fontWeight: '700', fontSize: '14px', textAlign: 'center' }}
                                            className="focus:border-amber-500 focus:bg-amber-500/5 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted, #888)', fontSize: '11px', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>PLANI BAŞLATMA TARİHİ</label>
                                    <input
                                        type="date"
                                        value={planData.startDate}
                                        onChange={e => setPlanData({ ...planData, startDate: e.target.value })}
                                        style={{ width: '100%', padding: '16px 20px', background: 'var(--bg-card, rgba(255,255,255,0.03))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-main, white)', borderRadius: '16px', fontWeight: '700', fontSize: '14px' }}
                                        className="input-date-dark focus:border-amber-500 focus:bg-amber-500/5 transition-colors"
                                    />
                                </div>

                                <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', marginTop: '12px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#f59e0b', cursor: 'pointer', fontWeight: '800' }}>
                                        <input
                                            type="checkbox"
                                            checked={planData.isExisting}
                                            onChange={e => setPlanData({ ...planData, isExisting: e.target.checked })}
                                            style={{ accentColor: '#f59e0b', width: '20px', height: '20px' }}
                                        />
                                        <span>Mevcut Bakiyeden Dönüştür (Re-Scheduling)</span>
                                    </label>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #aaa)', marginTop: '8px', marginLeft: '32px', fontWeight: '500', lineHeight: '1.5' }}>
                                        Bu seçenek aktifken cari hesap bakiyesine ekstra borç eklenmez, işlemi mevcut açık risk üzerinden planlar.
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePlan}
                                    className="btn btn-primary hover:-translate-y-1 hover:shadow-sm"
                                    style={{ marginTop: '20px', padding: '18px', width: '100%', justifyContent: 'center', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', color: 'white', fontWeight: '900', fontSize: '15px', letterSpacing: '1px', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <span>✅</span> ÖDEME PLANINI OLUŞTUR
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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

            {reconWizardOpen && (
                <ReconciliationWizard
                    customer={customer}
                    onClose={() => setReconWizardOpen(false)}
                    onSuccess={() => {
                        // Refresh data after successful reconciliation mapping
                        router.refresh();
                    }}
                />
            )}
        </div >
    );
}
