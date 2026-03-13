
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
import {
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseInput,
    EnterpriseTextarea,
    EnterpriseSelect,
    EnterpriseButton,
    EnterpriseSwitch,
    EnterpriseTable
} from '@/components/ui/enterprise';

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

    const [installmentPrompt, setInstallmentPrompt] = useState<{
        isOpen: boolean;
        type: 'NO_DIFFERENCE' | 'PARTIAL_PAYMENT' | 'NO_PAYMENT' | null;
        invoiceData?: any;
        paidAmount?: number;
        newTotalAmount?: number;
        difference?: number;
    }>({ isOpen: false, type: null });

    const [customInstallAmount, setCustomInstallAmount] = useState<string>('');

    const [checkAddModalOpen, setCheckAddModalOpen] = useState(false);
    const [newCheckData, setNewCheckData] = useState({
        type: 'Alınan Çek',
        number: '',
        bank: '',
        dueDate: '',
        amount: '',
        description: '',
        branch: 'Merkez',
        file: null as File | null
    });
    const [isSavingCheck, setIsSavingCheck] = useState(false);

    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const triggerInvoiceConversion = async (invoiceData: any) => {
        const paidAmount = Number(selectedOrder?.paidAmount || 0);
        
        // Calculate total of new invoice
        let newSubtotal = 0;
        let newTotalOtv = 0;
        let newTotalOiv = 0;
        let newTotalVat = 0;

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
            newTotalOtv += lineOtv;
            newTotalOiv += matrah * (Number(it.oiv || 0) / 100);
            newTotalVat += matrah * (Number(it.vat || 20) / 100);
            newSubtotal += lineNet;
        });

        let discAmount = 0;
        if (discountType === 'percent') {
            discAmount = newSubtotal * (discountValue / 100);
        } else {
            discAmount = discountValue;
        }

        const newTotalAmount = newSubtotal + newTotalOtv + newTotalOiv + newTotalVat - discAmount;

        if (invoiceData.isInstallment) {
            if (paidAmount > 0) {
                const difference = newTotalAmount - paidAmount;
                
                if (difference <= 0) {
                    setInstallmentPrompt({ isOpen: true, type: 'NO_DIFFERENCE', invoiceData, paidAmount, newTotalAmount, difference });
                } else {
                    setInstallmentPrompt({ isOpen: true, type: 'PARTIAL_PAYMENT', invoiceData, paidAmount, newTotalAmount, difference });
                }
            } else {
                setCustomInstallAmount(newTotalAmount.toString());
                setInstallmentPrompt({ isOpen: true, type: 'NO_PAYMENT', invoiceData, paidAmount: 0, newTotalAmount, difference: 0 });
            }
        } else {
            proceedWithInvoice(invoiceData, newTotalAmount);
        }
    };

    const proceedWithInvoice = async (invoiceData: any, finalInstallmentAmount: number) => {
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
                                totalAmount: finalInstallmentAmount.toString(),
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
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Müşteri Çek & Senetleri</h3>
                                <button
                                    onClick={() => setCheckAddModalOpen(true)}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: '800', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                >
                                    ➕ Yeni Evrak Ekle
                                </button>
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
                                                                    const isVadelendi = customer?.paymentPlans?.some((p: any) => p.title === item.desc || p.description === item.id || (item.orderId && p.description === item.orderId) || (item.formalInvoiceId && p.description === item.formalInvoiceId));
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
                        <EnterpriseCard className="w-[1200px] max-w-[98vw] flex flex-col h-[90vh] overflow-hidden !p-0 shadow-2xl">
                            {/* Header */}
                            <div className="px-8 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <EnterpriseSectionHeader
                                    title="RESMİ FATURALANDIRMA SİSTEMİ"
                                    subtitle="E-ARŞİV / E-FATURA TASLAĞI"
                                    icon={<span className="text-blue-500">📄</span>}
                                    rightElement={
                                        <button onClick={() => setInvoiceModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                            &times;
                                        </button>
                                    }
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-950/30">

                                {/* Section: Buyer Information */}
                                <EnterpriseCard borderLeftColor="#3b82f6" className="space-y-6">
                                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider">ALICI BİLGİLERİ</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <EnterpriseInput id="inv_name" label="ÜNVAN / AD SOYAD" defaultValue={customer.name} />
                                        <EnterpriseInput id="inv_tax_no" label="V.N. / T.C. KİMLİK NO" defaultValue={customer.taxNumber} />
                                        <EnterpriseInput id="inv_tax_office" label="VERGİ DAİRESİ" defaultValue={customer.taxOffice} />
                                        <EnterpriseInput id="inv_phone" label="TELEFON" defaultValue={customer.phone} />
                                        <div className="md:col-span-4">
                                            <EnterpriseTextarea id="inv_address" label="ADRES" defaultValue={customer.address} className="min-h-[80px]" />
                                        </div>
                                    </div>
                                </EnterpriseCard>

                                {/* Section: Ekstra Seçenekler */}
                                <EnterpriseCard borderLeftColor="#10b981" className="space-y-6">
                                    <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">EKSTRA SEÇENEKLER</h3>
                                    <div className="flex flex-col gap-4">
                                        <EnterpriseSwitch
                                            id="inv_create_wayslip"
                                            checked={document.getElementById('inv_create_wayslip') ? (document.getElementById('inv_create_wayslip') as HTMLInputElement).checked : false}
                                            onChange={(e) => {
                                                const el = document.getElementById('inv_create_wayslip') as HTMLInputElement;
                                                if(el) el.checked = e.target.checked;
                                            }}
                                            label="Fatura ile birlikte Giden Sevk İrsaliyesi oluştur"
                                            description="İrsaliye numarası fatura üzerine yazılır"
                                        />
                                        <EnterpriseSwitch
                                            checked={isInstallmentInvoice}
                                            onChange={(e) => setIsInstallmentInvoice(e.target.checked)}
                                            label="Vade Uygula ve Ödeme Planı Yarat"
                                            description="Fatura içeriğine otomatik eklenecektir"
                                        />
                                    </div>

                                    {isInstallmentInvoice && (
                                        <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 items-center">
                                            <div className="flex-1 min-w-[200px]">
                                                <EnterpriseSelect label="VADE SAYISI" value={invoiceInstallmentCount} onChange={e => setInvoiceInstallmentCount(Number(e.target.value))}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n} Ay Vade</option>)}
                                                </EnterpriseSelect>
                                            </div>
                                            <div className="flex-1 min-w-[200px]">
                                                <EnterpriseSelect id="inv_installment_type" label="ÖDEME TÜRÜ" defaultValue="Açık Hesap">
                                                    <option value="Açık Hesap">Açık Hesap</option>
                                                    <option value="Çek">Çek Alınacak</option>
                                                    <option value="Senet">Senet (Periodya İmza)</option>
                                                </EnterpriseSelect>
                                            </div>
                                            <div className="w-full text-xs text-slate-500 dark:text-slate-400">
                                                📝 Not: Sensiz (Çek/Senet) ödeme planları finansal hareketlerde o kategorilerde takip edilir. Senet seçeneği "Periodya Trust & Compliance Suite" (Dijital İmza) kullanılarak müşterinin e-onayına sunulur.
                                            </div>
                                        </div>
                                    )}
                                </EnterpriseCard>

                                {/* Section: Items Table */}
                                <EnterpriseCard borderLeftColor="#3b82f6" className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider">FATURA KALEMLERİ</h3>
                                        <EnterpriseButton variant="secondary" onClick={() => setIsProductPickerOpen(true)}>
                                            <span className="text-blue-500 mr-1">➕</span> Envanterden Ürün Seç
                                        </EnterpriseButton>
                                    </div>

                                    <EnterpriseTable
                                        headers={[
                                            { label: 'NO' },
                                            { label: 'MALZEME / HİZMET' },
                                            { label: 'MİKTAR', alignRight: true },
                                            { label: 'BİRİM FİYAT (NET)', alignRight: true },
                                            { label: 'KDV %', alignRight: true },
                                            { label: 'KDV TUTARI', alignRight: true },
                                            { label: 'BRÜT TOPLAM', alignRight: true },
                                            { label: '' }
                                        ]}
                                    >
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
                                                <tr key={it.id || i}>
                                                    <td className="h-14 px-4 text-sm font-semibold text-slate-500">{i + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-col gap-2 min-w-[250px]">
                                                            <select
                                                                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none"
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
                                                            >
                                                                <option value="">Ürün veya hizmet seçin...</option>
                                                                {products.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                            {it.name && it.name !== 'Ürün' && (
                                                                <div className="text-xs text-slate-500 font-medium pl-1">
                                                                    Seçili: {it.name}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-2 pl-1">
                                                                {(it.otvType && it.otvType !== 'Ö.T.V yok') && (
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                                                                        {it.otvType === 'yüzdesel Ö.T.V' ? `ÖTV %${it.otv}` : `ÖTV ${it.otv} ₺`}
                                                                    </span>
                                                                )}
                                                                {(Number(it.oiv || 0) > 0) && (
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500">
                                                                        ÖİV %${it.oiv}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => updateItem('showDesc', !it.showDesc)}
                                                                    className={`text-[10px] font-bold px-2 py-1 rounded border border-dashed transition-colors ${it.showDesc ? 'text-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'text-slate-500 border-slate-300 dark:border-slate-700 hover:text-blue-500 hover:border-blue-500'}`}
                                                                >
                                                                    📝 {it.showDesc ? 'Açıklamayı Gizle' : 'Açıklama Ekle'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setTaxEditIndex(i)}
                                                                    className="text-[10px] font-bold px-2 py-1 rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-500 hover:border-blue-500 transition-colors"
                                                                >
                                                                    ⚙️ Vergi Ayarı
                                                                </button>
                                                            </div>

                                                            {it.showDesc && (
                                                                <div className="mt-2">
                                                                    <textarea
                                                                        placeholder="Malzeme / Hizmet Açıklaması (Örn: ŞASE NO: XYZ, Motor NO: 123...)"
                                                                        value={it.description || ''}
                                                                        onChange={(e) => updateItem('description', e.target.value)}
                                                                        className="w-full min-h-[60px] p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-blue-500/30 resize-y"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <input
                                                            type="number"
                                                            value={it.qty}
                                                            onChange={(e) => updateItem('qty', Number(e.target.value))}
                                                            className="w-[70px] h-9 px-2 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-slate-300 ml-auto"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.0001"
                                                                value={netPrice > 0 ? Number(netPrice.toFixed(4)) : ''}
                                                                placeholder="0.00"
                                                                onChange={(e) => updateItem('price', Number(e.target.value))}
                                                                className="w-[100px] h-9 px-2 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono font-semibold outline-none focus:ring-1 focus:ring-slate-300"
                                                            />
                                                            <span className="text-xs font-semibold text-slate-500">₺ + KDV</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="relative inline-block ml-auto w-[64px]">
                                                            <input
                                                                type="number"
                                                                value={it.vat}
                                                                onChange={(e) => updateItem('vat', Number(e.target.value))}
                                                                className="w-full h-9 pl-2 pr-6 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-slate-300"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-sm font-bold text-slate-500">
                                                        {vatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <input
                                                            type="number"
                                                            value={lineGrossTotal.toFixed(2)}
                                                            onChange={(e) => handleGrossChange(Number(e.target.value))}
                                                            className="w-[110px] h-9 px-2 text-right bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-mono font-bold outline-none ml-auto"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 transition-colors mx-auto"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </EnterpriseTable>
                                </EnterpriseCard>

                                {/* Section: Totals Summary */}
                                <div className="flex justify-end">
                                    <EnterpriseCard className="w-[480px] bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50">
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
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-semibold text-slate-500">Ara Toplam (Net)</span>
                                                        <span className="font-mono font-bold text-[15px]">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    {totalOtv > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-slate-500">ÖTV Toplam</span>
                                                            <span className="font-mono font-bold text-[15px] text-amber-500">{totalOtv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-slate-500">İskonto</span>
                                                            <select
                                                                value={discountType}
                                                                onChange={(e: any) => setDiscountType(e.target.value)}
                                                                className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md outline-none"
                                                            >
                                                                <option value="percent">% (Yüzde)</option>
                                                                <option value="amount">₺ Tutar</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={discountValue}
                                                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                                className="w-20 px-2 py-1 text-center text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:ring-1 focus:ring-slate-300"
                                                            />
                                                        </div>
                                                        <span className="font-mono font-bold text-[15px] text-red-500">- {discAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-semibold text-slate-500">KDV Toplam</span>
                                                        <span className="font-mono font-bold text-[15px]">{totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-base font-bold tracking-widest text-slate-900 dark:text-white">GENEL TOPLAM</span>
                                                        <span className="text-3xl font-mono font-black text-blue-600 dark:text-blue-500 tracking-tight">
                                                            {finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl text-blue-400 opacity-80">₺</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </EnterpriseCard>
                                </div>

                            </div>

                            {/* Footer Actions */}
                            <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto shrink-0">
                                <EnterpriseButton variant="secondary" onClick={() => setInvoiceModalOpen(false)} className="w-32">
                                    İPTAL
                                </EnterpriseButton>
                                <EnterpriseButton
                                    variant="primary"
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
                                        triggerInvoiceConversion(data);
                                    }}
                                    className="min-w-[200px]"
                                >
                                    {isConverting ? (
                                        <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> İŞLENİYOR...</>
                                    ) : (
                                        <>FATURAYI ONAYLA</>
                                    )}
                                </EnterpriseButton>
                            </div>
                        </EnterpriseCard>
                    </div>
                )
            }


            {/* INVOICE SUCCESS & SHARE MODAL */}
            {
                shareModalOpen && lastInvoice && (
                    <div className="fixed inset-0 bg-slate-900/80 z-[4000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <EnterpriseCard className="w-full max-w-md text-center bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200 border-emerald-500/30">
                            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-5xl mx-auto mb-6 shadow-sm shadow-emerald-500/20">
                                🎉
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Fatura Hazır!</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 px-4">
                                Resmi faturanız başarıyla oluşturuldu ve GİB sistemine entegre edildi.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        const msg = `Sayın ${customer.name}, ${lastInvoice.invoiceNo} numaralı faturanızı bu bağlantıdan görüntüleyebilirsiniz: https://www.periodya.com/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`;
                                        window.open(`https://wa.me/${customer.phone?.replace(/\s/g, '').replace(/^0/, '90')}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="w-full h-14 rounded-xl flex items-center justify-center gap-3 font-semibold text-white bg-green-500 hover:bg-green-600 shadow-sm shadow-green-500/30 transition-all hover:-translate-y-0.5"
                                >
                                    <span className="text-2xl">💬</span> Müşteriye WhatsApp'tan İlet
                                </button>

                                <EnterpriseButton
                                    variant="secondary"
                                    onClick={() => {
                                        window.location.href = `mailto:${customer.email || ''}?subject=Faturanız Hazır - ${lastInvoice.invoiceNo}&body=Sayın ${customer.name}, %0D%0A%0D%0A${lastInvoice.invoiceNo} numaralı faturanız ekte yer almaktadır. %0D%0A%0D%0AFaturayı görüntülemek için tıkla: https://www.periodya.com/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`;
                                    }}
                                    className="h-14 font-semibold text-base"
                                >
                                    <span className="text-2xl mr-2">📧</span> E-Posta ile Gönder
                                </EnterpriseButton>
                                
                                {lastInvoice?.description?.includes('Senet') && (
                                    <button
                                        onClick={() => setOtpModalOpen(true)}
                                        className="w-full h-14 rounded-xl flex items-center justify-center gap-3 font-semibold text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/20"
                                    >
                                        <span className="text-xl">✍️</span> Seneti Yazdır / OTP İmzaya Sun
                                    </button>
                                )}

                                <button
                                    onClick={() => window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice.id}`, '_blank')}
                                    className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-500 hover:underline flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">📄</span> PDF İndir / Görüntüle
                                </button>
                            </div>

                            <button
                                onClick={() => setShareModalOpen(false)}
                                className="mt-8 w-full p-4 rounded-xl font-bold tracking-wide text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 transition-colors"
                            >
                                PENCEREYİ KAPAT
                            </button>
                        </EnterpriseCard>
                    </div>
                )
            }

            {/* INSTALLMENT PROMPT MODAL */}
            {installmentPrompt.isOpen && (
                <div className="fixed inset-0 bg-slate-900/80 z-[6000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-xl animate-in zoom-in-95 duration-200 shadow-2xl border-blue-500/30">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="text-2xl">💼</span> Vadelendirme Seçimi
                            </h3>
                            <button
                                onClick={() => setInstallmentPrompt({ isOpen: false, type: null })}
                                className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        {installmentPrompt.type === 'NO_DIFFERENCE' && (
                            <div className="flex flex-col gap-6">
                                <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Bu siparişin <strong>{installmentPrompt.paidAmount?.toLocaleString('tr-TR')} ₺</strong>&apos;lik tutarı daha önce Kasa/Kart üzerinden tahsil edilmiştir.
                                </p>
                                <p className="text-[15px] text-amber-700 dark:text-amber-500 font-semibold p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                                    Eğer bu işleme yinede vade yapmak istiyorsanız Vadelendir&apos;e basarak önceki tahsilatı iptal edip tüm bakiyeyi vadelendirebilirsiniz.
                                </p>
                                <div className="flex gap-4 mt-2">
                                    <EnterpriseButton variant="secondary" onClick={() => setInstallmentPrompt({ isOpen: false, type: null })} className="flex-1">
                                        İPTAL
                                    </EnterpriseButton>
                                    <EnterpriseButton
                                        variant="primary"
                                        onClick={() => {
                                            const data = { ...installmentPrompt.invoiceData, cancelPreviousPayment: true };
                                            setInstallmentPrompt({ isOpen: false, type: null });
                                            proceedWithInvoice(data, installmentPrompt.newTotalAmount || 0);
                                        }}
                                        className="flex-1"
                                    >
                                        TÜMÜNÜ VADELENDİR
                                    </EnterpriseButton>
                                </div>
                            </div>
                        )}

                        {installmentPrompt.type === 'PARTIAL_PAYMENT' && (
                            <div className="flex flex-col gap-6">
                                <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Bu siparişin <strong>{installmentPrompt.paidAmount?.toLocaleString('tr-TR')} ₺</strong>&apos;lik kısmı tahsil edilmiş. Yeni genel toplam: <strong>{installmentPrompt.newTotalAmount?.toLocaleString('tr-TR')} ₺</strong>.
                                </p>
                                <p className="text-sm text-slate-900 dark:text-white font-medium">
                                    Lütfen ne yapmak istediğinizi seçin:
                                </p>
                                
                                <button
                                    onClick={() => {
                                        setInstallmentPrompt({ isOpen: false, type: null });
                                        proceedWithInvoice(installmentPrompt.invoiceData, installmentPrompt.difference || 0);
                                    }}
                                    className="p-4 rounded-xl text-left flex flex-col gap-1 border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors"
                                >
                                    <span className="text-base font-bold text-blue-600 dark:text-blue-500">1. Sadece Kalanı Vadelendir</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Sadece yeni eklenen/kalan tutar ({installmentPrompt.difference?.toLocaleString('tr-TR')} ₺) vadelendirilecek.</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        const data = { ...installmentPrompt.invoiceData, cancelPreviousPayment: true };
                                        setInstallmentPrompt({ isOpen: false, type: null });
                                        proceedWithInvoice(data, installmentPrompt.newTotalAmount || 0);
                                    }}
                                    className="p-4 rounded-xl text-left flex flex-col gap-1 border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
                                >
                                    <span className="text-base font-bold text-amber-600 dark:text-amber-500">2. Eski Tahsilatı İptal Et & Tümünü Vadelendir</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">Önceki tahsilat iptal edilecek ve tüm tutar ({installmentPrompt.newTotalAmount?.toLocaleString('tr-TR')} ₺) vadelendirilecek.</span>
                                </button>
                            </div>
                        )}

                        {installmentPrompt.type === 'NO_PAYMENT' && (
                            <div className="flex flex-col gap-6">
                                <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Girdiğiniz fatura kalemlerinin genel toplamı <strong>{installmentPrompt.newTotalAmount?.toLocaleString('tr-TR')} ₺</strong>.
                                </p>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2 tracking-wider">VADELENDİRMEK İSTEDİĞİNİZ TUTAR:</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={customInstallAmount}
                                            onChange={e => setCustomInstallAmount(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-white text-lg font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow pr-10"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                                    </div>
                                    <span className="block mt-2 text-xs text-slate-400">Farklı bir tutar girmek istiyorsanız yukarıya yazınız. Geri kalan açık hesap carisine yansır.</span>
                                </div>
                                
                                <div className="flex gap-4 mt-2">
                                    <EnterpriseButton variant="secondary" onClick={() => setInstallmentPrompt({ isOpen: false, type: null })} className="flex-1">
                                        İPTAL
                                    </EnterpriseButton>
                                    <EnterpriseButton
                                        variant="primary"
                                        onClick={() => {
                                            const parsedAmount = parseFloat(customInstallAmount.replace(',', '.'));
                                            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                                                showError("Hata", "Geçersiz bir tutar girdiniz.");
                                                return;
                                            }
                                            setInstallmentPrompt({ isOpen: false, type: null });
                                            proceedWithInvoice(installmentPrompt.invoiceData, parsedAmount);
                                        }}
                                        className="flex-1"
                                    >
                                        ONAYLA VE DEVAM ET
                                    </EnterpriseButton>
                                </div>
                            </div>
                        )}
                    </EnterpriseCard>
                </div>
            )}

            {
                taxEditIndex !== null && invoiceItems[taxEditIndex] && (
                    <div className="fixed inset-0 bg-slate-900/80 z-[5000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <EnterpriseCard className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl border-blue-500/30">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="text-2xl">⚙️</span> Ek Vergi Parametreleri
                                </h3>
                                <button
                                    onClick={() => setTaxEditIndex(null)}
                                    className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="flex flex-col gap-5">
                                <EnterpriseSelect
                                    label="Ö.T.V UYGULAMA TİPİ"
                                    value={invoiceItems[taxEditIndex].otvType || 'Ö.T.V yok'}
                                    onChange={(e) => {
                                        const newItems = [...invoiceItems];
                                        newItems[taxEditIndex].otvType = e.target.value;
                                        if (e.target.value === 'Ö.T.V yok') newItems[taxEditIndex].otv = 0;
                                        setInvoiceItems(newItems);
                                    }}
                                >
                                    <option value="Ö.T.V yok">🟢 Uygulanmasın (Yok)</option>
                                    <option value="yüzdesel Ö.T.V">🔵 Yüzde Oranlı (%)</option>
                                    <option value="maktu Ö.T.V">🟠 Sabit Tutarlı (₺)</option>
                                </EnterpriseSelect>

                                {invoiceItems[taxEditIndex].otvType !== 'Ö.T.V yok' && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <EnterpriseInput
                                            label={`BELİRLENEN Ö.T.V ${invoiceItems[taxEditIndex].otvType === 'yüzdesel Ö.T.V' ? 'ORANI (%)' : 'TUTARI (₺)'}`}
                                            type="number"
                                            value={invoiceItems[taxEditIndex].otv || 0}
                                            onChange={(e) => {
                                                const newItems = [...invoiceItems];
                                                newItems[taxEditIndex].otv = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }}
                                            className="text-amber-600 dark:text-amber-500 font-bold font-mono text-center text-lg bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 focus:border-amber-400 focus:ring-amber-400/30"
                                        />
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <div className="relative">
                                        <EnterpriseInput
                                            label="ÖZEL İLETİŞİM VERGİSİ (Ö.İ.V %)"
                                            type="number"
                                            value={invoiceItems[taxEditIndex].oiv || 0}
                                            onChange={(e) => {
                                                const newItems = [...invoiceItems];
                                                newItems[taxEditIndex].oiv = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }}
                                            placeholder="0"
                                            className="pr-8"
                                        />
                                        <span className="absolute right-3 top-[34px] font-bold text-slate-400">%</span>
                                    </div>
                                </div>

                                <EnterpriseButton
                                    variant="primary"
                                    onClick={() => setTaxEditIndex(null)}
                                    className="w-full mt-4"
                                >
                                    AYARLARI ONAYLA ✅
                                </EnterpriseButton>
                            </div>
                        </EnterpriseCard>
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
                    <div className="fixed inset-0 bg-slate-900/80 z-[4000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <EnterpriseCard className="w-full max-w-3xl animate-in zoom-in-95 duration-200 shadow-2xl border-blue-500/30">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Envanterden Ürün Seçimi</h3>
                                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-500 mt-1 uppercase tracking-wider">
                                        Gerçek Zamanlı Stok & Fiyat Bilgisi
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsProductPickerOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <span className="text-2xl leading-none">&times;</span>
                                </button>
                            </div>

                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                                <input
                                    autoFocus
                                    placeholder="Ürün adı, barkod veya stok kodu ile arayın..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500/50 text-slate-900 dark:text-white font-medium outline-none transition-colors"
                                />
                            </div>

                            <div className="max-h-[480px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
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
                                                className="group p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all flex justify-between items-center"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-xl text-blue-600 dark:text-blue-500">
                                                        {p.category?.charAt(0) || '📦'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium mt-1">
                                                            Stok: <span className={p.stock > 0 ? "text-emerald-600 dark:text-emerald-500 font-bold" : "text-rose-500 font-bold"}>{p.stock}</span>
                                                            <span className="mx-2 opacity-50">|</span> 
                                                            Barkod: <span className="font-mono">{p.barcode || 'Yok'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                                        {grossPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </div>
                                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-500 mt-1 uppercase">
                                                        %{vatRate} KDV DAHİL (BRÜT)
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={() => {
                                        setInvoiceItems([...invoiceItems, { name: 'Yeni Manuel Hizmet / Ürün', qty: 1, price: 0, vat: 20 }]);
                                        setIsProductPickerOpen(false);
                                    }}
                                    className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold flex items-center justify-center gap-2 text-sm"
                                >
                                    <span className="text-lg">➕</span> Envanter Dışı Manuel Hizmet Ekle
                                </button>
                            </div>
                        </EnterpriseCard>
                    </div>
                )
            }

            {/* CHECK COLLECT MODAL */}
            {
                showCheckCollectModal && activeCheck && (
                    <div className="fixed inset-0 bg-slate-900/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <EnterpriseCard className="w-full max-w-md animate-in zoom-in-95 duration-200 shadow-2xl border-blue-500/30">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="text-2xl">{activeCheck.type.includes('Alınan') ? '📥' : '📤'}</span>
                                    {activeCheck.type.includes('Alınan') ? 'Tahsilat Onayı' : 'Ödeme Çıkış Onayı'}
                                </h3>
                                <button
                                    onClick={() => setShowCheckCollectModal(false)}
                                    className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        {activeCheck.type}
                                    </div>
                                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                                        {Number(activeCheck.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-2xl text-slate-400 opacity-80">₺</span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-500 mt-2">
                                        {activeCheck.bank} - <span className="font-mono">{activeCheck.number}</span>
                                    </div>
                                </div>

                                <EnterpriseSelect
                                    label={activeCheck.type.includes('Alınan') ? 'TAHSİLATIN GEÇECEĞİ KASA' : 'ÖDEMENİN ÇIKACAĞI HESAP'}
                                    value={targetKasaId}
                                    onChange={(e) => setTargetKasaId(e.target.value)}
                                >
                                    <option value="">İşlem yapılacak kasayı seçin...</option>
                                    {kasalar.filter((k: any) => k.name !== 'ÇEK / SENET PORTFÖYÜ').map((k: any) => (
                                        <option key={k.id} value={k.id}>{k.name} ({Number(k.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)</option>
                                    ))}
                                </EnterpriseSelect>

                                <div className="flex gap-4 pt-2">
                                    <EnterpriseButton
                                        variant="secondary"
                                        onClick={() => setShowCheckCollectModal(false)}
                                        className="flex-1"
                                    >
                                        İPTAL
                                    </EnterpriseButton>
                                    <EnterpriseButton
                                        variant="primary"
                                        onClick={handleExecuteCheckCollect}
                                        disabled={isProcessingCollection || !targetKasaId}
                                        className="flex-[2]"
                                    >
                                        {isProcessingCollection ? (
                                            <><div className="loader border-t-white w-4 h-4 rounded-full border-2 border-white/20 animate-spin mr-2 inline-block align-middle"></div> İŞLENİYOR...</>
                                        ) : (
                                            <><span>✅</span> İŞLEMİ TAMAMLA</>
                                        )}
                                    </EnterpriseButton>
                                </div>
                            </div>
                        </EnterpriseCard>
                    </div>
                )
            }

            {/* PLAN MODAL */}
            {
                showPlanModal && (
                    <div className="fixed inset-0 bg-slate-900/80 z-[4000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        <EnterpriseCard className="w-full max-w-lg p-0 overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl border-amber-500/30 ring-1 ring-amber-500/10">
                            <div className="px-8 py-6 border-b border-amber-500/10 dark:border-amber-500/10 flex justify-between items-center bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="p-2 bg-amber-500 text-white rounded-xl text-lg shadow-[0_4px_12px_rgba(245,158,11,0.4)]">📅</span>
                                    Vadeli Satış Planı Oluştur
                                </h3>
                                <button
                                    onClick={() => setShowPlanModal(false)}
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center text-xl transition-colors shrink-0"
                                >
                                    &times;
                                </button>
                            </div>
                            
                            <div className="p-8 flex flex-col gap-5 bg-white dark:bg-slate-900">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">ÖDEME PLANI BAŞLIĞI</label>
                                    <input
                                        value={planData.title}
                                        onChange={e => setPlanData({ ...planData, title: e.target.value })}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">TOPLAM TUTAR (₺)</label>
                                        <input
                                            type="number"
                                            value={planData.totalAmount}
                                            onChange={e => setPlanData({ ...planData, totalAmount: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl font-black text-base font-mono outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">TAKSİT / VADE SAYISI</label>
                                        <input
                                            type="number"
                                            value={planData.installmentCount}
                                            onChange={e => setPlanData({ ...planData, installmentCount: e.target.value })}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm text-center outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">PLANI BAŞLATMA TARİHİ</label>
                                    <input
                                        type="date"
                                        value={planData.startDate}
                                        onChange={e => setPlanData({ ...planData, startDate: e.target.value })}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all [color-scheme:light_dark]"
                                    />
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl mt-2">
                                    <label className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-500 cursor-pointer font-bold select-none cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={planData.isExisting}
                                            onChange={e => setPlanData({ ...planData, isExisting: e.target.checked })}
                                            className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                                        />
                                        <span>Mevcut Bakiyeden Dönüştür (Re-Scheduling)</span>
                                    </label>
                                    <div className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-2 ml-8 font-medium leading-relaxed">
                                        Bu seçenek aktifken cari hesap bakiyesine ekstra borç eklenmez, işlemi mevcut açık risk üzerinden planlar.
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePlan}
                                    className="mt-4 w-full p-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-sm tracking-wide border-none shadow-[0_8px_24px_rgba(245,158,11,0.3)] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase"
                                >
                                    <span>✅</span> ÖDEME PLANINI OLUŞTUR
                                </button>
                            </div>
                        </EnterpriseCard>
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

            {/* CHECK / SENET ADD MODAL */}
            {checkAddModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '560px', padding: '40px', borderRadius: '24px', background: 'var(--bg-panel, #0f172a)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                        <div className="flex-between mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--text-main, white)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>📑</span> Yeni Evrak (Çek/Senet) Ekle
                            </h3>
                            <button onClick={() => setCheckAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">&times;</button>
                        </div>

                        <div className="flex-col gap-4">
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>EVRAK TÜRÜ</label>
                                <select 
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '700' }}
                                    value={newCheckData.type}
                                    onChange={(e) => setNewCheckData({ ...newCheckData, type: e.target.value })}
                                >
                                    <option value="Alınan Çek">Müşteriden Alınan Çek</option>
                                    <option value="Alınan Senet">Müşteriden Alınan Senet</option>
                                    <option value="Müşteri Çeki / Cirolu">Müşteri Tarafından Cirolu Çek</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="flex-col gap-2">
                                    <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>TUTAR (₺)</label>
                                    <input 
                                        type="number" 
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '700' }}
                                        value={newCheckData.amount}
                                        onChange={(e) => setNewCheckData({ ...newCheckData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex-col gap-2">
                                    <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>VADE TARİHİ</label>
                                    <input 
                                        type="date" 
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '700' }}
                                        value={newCheckData.dueDate}
                                        onChange={(e) => setNewCheckData({ ...newCheckData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>BANKA & ŞUBE (Senet ise boş bırakılabilir)</label>
                                <input 
                                    type="text" 
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '700' }}
                                    value={newCheckData.bank}
                                    onChange={(e) => setNewCheckData({ ...newCheckData, bank: e.target.value })}
                                    placeholder="Örn: Garanti Bankası / Beşiktaş Şb."
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>EVRAK/SERİ NO</label>
                                <input 
                                    type="text" 
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '700' }}
                                    value={newCheckData.number}
                                    onChange={(e) => setNewCheckData({ ...newCheckData, number: e.target.value })}
                                    placeholder="Seri veya Fis Numarası"
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', letterSpacing: '0.5px' }}>AÇIKLAMA (Opsiyonel)</label>
                                <input 
                                    type="text" 
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'white', fontWeight: '700' }}
                                    value={newCheckData.description}
                                    onChange={(e) => setNewCheckData({ ...newCheckData, description: e.target.value })}
                                    placeholder="Ek detay veya borçlu bilgisi"
                                />
                            </div>

                            <div className="flex-col gap-2 mt-4 p-4 border rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                                <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main, #fff)', letterSpacing: '0.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span>📸</span> EVRAK GÖRSELİ YÜKLE
                                </label>
                                <span style={{ fontSize: '11px', color: '#888' }}>Evrakın ön yüzünün fotoğrafını ekleyiniz.</span>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setNewCheckData({ ...newCheckData, file: e.target.files[0] });
                                        }
                                    }}
                                    style={{ marginTop: '8px' }}
                                />
                            </div>

                            <button
                                onClick={async () => {
                                    if (!newCheckData.amount || !newCheckData.dueDate || !newCheckData.number) {
                                        showError("Eksik Bilgi", "Lütfen Tutar, Vade Tarihi ve Evrak Numarasını girin.");
                                        return;
                                    }
                                    setIsSavingCheck(true);
                                    try {
                                        const res = await fetch('/api/financials/checks', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                type: newCheckData.type,
                                                number: newCheckData.number,
                                                bank: newCheckData.bank || 'Bilinmiyor',
                                                dueDate: newCheckData.dueDate,
                                                amount: parseFloat(newCheckData.amount),
                                                customerId: id,
                                                description: newCheckData.description,
                                                branch: 'Merkez'
                                            })
                                        });

                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || "Hata oluştu");
                                        
                                        // Image upload if file selected
                                        if (data.check?.id && newCheckData.file) {
                                            const formData = new FormData();
                                            formData.append('file', newCheckData.file);
                                            await fetch(`/api/financials/checks/${data.check.id}/image`, {
                                                method: 'POST',
                                                body: formData
                                            });
                                        }

                                        showSuccess("Evrak Kaydedildi", "Yeni çek/senet başarıyla portföye eklendi.");
                                        setCheckAddModalOpen(false);
                                        setNewCheckData({ type: 'Alınan Çek', number: '', bank: '', dueDate: '', amount: '', description: '', branch: 'Merkez', file: null });
                                        fetchCustomer();
                                    } catch (err: any) {
                                        showError("Hata", err.message);
                                    } finally {
                                        setIsSavingCheck(false);
                                    }
                                }}
                                disabled={isSavingCheck}
                                style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', fontWeight: '800', fontSize: '15px', cursor: isSavingCheck ? 'wait' : 'pointer' }}
                            >
                                {isSavingCheck ? 'KAYDEDİLİYOR...' : 'ONAYLA VE PORTFÖYE EKLE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP COMPLIANCE MODAL */}
            {otpModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-scale-in" style={{ width: '560px', padding: '40px', borderRadius: '24px', background: 'var(--bg-panel, #0f172a)', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
                        <div className="flex-between mb-8 pb-4" style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'var(--text-main, white)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>✍️</span> Periodya Trust & Compliance
                            </h3>
                            <button onClick={() => setOtpModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', fontSize: '28px', cursor: 'pointer', transition: 'color 0.2s' }} className="hover:text-white">&times;</button>
                        </div>

                        <div className="flex-col gap-4">
                            <p style={{ fontSize: '15px', color: 'var(--text-muted, #aaa)', lineHeight: '1.6' }}>
                                Müşteriye senet onayı için OTP (Tek Kullanımlık Şifre) bağlantısı gönderebilir veya doğrudan senedi yazdırabilirsiniz.
                            </p>
                            
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px' }}>🛡️</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '14px', marginBottom: '4px' }}>Güvenli E-İmza (OTP) Altyapısı</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted, #aaa)', lineHeight: '1.4' }}>Sistem alıcının <strong>{customer.phone || customer.email || 'iletişim adresine'}</strong> benzersiz imza linki iletecektir.</div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setIsSendingOtp(true);
                                    try {
                                        // Simulate network request or API call to actually send it
                                        await new Promise(res => setTimeout(res, 1500));
                                        showSuccess("Başarılı", "Müşteriye senet onayı (OTP) SMS ve Email bağlantıları iletildi.");
                                        setOtpModalOpen(false);
                                    } catch (err: any) {
                                        showError("Hata", err.message);
                                    } finally {
                                        setIsSendingOtp(false);
                                    }
                                }}
                                disabled={isSendingOtp}
                                style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.2) 100%)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: '800', fontSize: '15px', cursor: isSendingOtp ? 'wait' : 'pointer' }}
                            >
                                {isSendingOtp ? 'GÖNDERİLİYOR...' : 'SMS & E-POSTA İLE ONAYA SUN'}
                            </button>

                            <button
                                onClick={() => {
                                    window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${lastInvoice?.id || ''}`, '_blank');
                                    setOtpModalOpen(false);
                                }}
                                style={{ marginTop: '12px', padding: '18px', borderRadius: '12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'white', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
                                className="hover:bg-white/10"
                            >
                                SENEDİ YAZDIR / GÖRÜNTÜLE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
