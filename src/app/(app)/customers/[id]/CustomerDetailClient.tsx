
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
import EnterpriseCommandCenter from '@/components/ui/EnterpriseCommandCenter';
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

const formatCurrencyInput = (val: string | number): string => {
    if (val === undefined || val === null || val === '') return '';
    let stringVal = val.toString();
    let clean = stringVal.replace(/[^0-9,]/g, '');
    const parts = clean.split(',');
    if (parts.length > 2) {
        clean = parts[0] + ',' + parts.slice(1).join('');
    }
    const [intPart, decPart] = clean.split(',');
    if (!intPart && clean.includes(',')) return '0,';
    if (!intPart) return '';
    const formattedInt = parseInt(intPart, 10).toLocaleString('tr-TR');
    return decPart !== undefined ? `${formattedInt},${decPart.slice(0, 2)}` : formattedInt;
};

const parseCurrencyToFloat = (val: string | number): number => {
    if (val === undefined || val === null || val === '') return 0;
    let str = val.toString();
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
};

export default function CustomerDetailClient({ customer, historyList }: { customer: any, historyList: any[] }) {
    const router = useRouter();
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'payments' | 'documents' | 'services' | 'warranties' | 'checks' | 'reconciliations' | 'offers'>('all');
    const [documents, setDocuments] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);

    const [qrPlate, setQrPlate] = useState<string | null>(null);
    const [docsLoading, setDocsLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const [priceMap, setPriceMap] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchPricing = async () => {
            if (!customer?.id) return;
            try {
                const res = await fetch('/api/pricing/resolve-customer', {
                    method: 'POST',
                    body: JSON.stringify({ customerId: customer.id })
                });
                const data = await res.json();
                const resolvedList = data.priceList || data.data?.priceList;
                if (data.success && resolvedList) {
                    const listId = resolvedList.id;
                    const pRes = await fetch(`/api/pricing/lists/${listId}/prices`);
                    const pData = await pRes.json();
                    if (pData.success || pData.ok) {
                        setPriceMap(pData.priceMap || pData.data?.priceMap || {});
                    }
                }
            } catch (e) {
                console.error("Fiyat listesi çekilemedi:", e);
            }
        };
        fetchPricing();
    }, [customer?.id]);

    // PAGINATION
    const ITEMS_PER_PAGE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    
    // UI State for instantaneous UI update after converting to installment
    const [vadelenenIds, setVadelenenIds] = useState<string[]>([]);
    
    // UI State for instantaneous UI update after creating an invoice
    const [invoicedOrderIds, setInvoicedOrderIds] = useState<string[]>([]);

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

    const fetchAssets = async () => {
        try {
            const res = await fetch(`/api/customers/${customer.id}/assets`);
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-fetch services to get plate info for Header Buttons
    useEffect(() => {
        fetchServices();
        fetchAssets();
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
    const [proformaOrderIds, setProformaOrderIds] = useState<string[]>([]);
    const [formalOrderIds, setFormalOrderIds] = useState<string[]>([]);

    // Invoice Share State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<any>(null);

    // Check Collection State
    const [showCheckCollectModal, setShowCheckCollectModal] = useState(false);
    const [activeCheck, setActiveCheck] = useState<any>(null);
    const [targetKasaId, setTargetKasaId] = useState('');
    const [isProcessingCollection, setIsProcessingCollection] = useState(false);

    // REMOVED DEAD PLAN MODAL CODE

    // REMOVED DEAD PLAN MODAL CODE

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

    const handleReturnTransaction = (id: string, type: string) => {
        showConfirm("İade/İptal Onayı", "Bu işlemi iptal etmek ve iade almak istediğinize emin misiniz?\n\nBu işlem:\n• Stokları geri yükler\n• Bakiyeyi günceller\n• Kasa işlemini tersine çevirir", async () => {
            setProcessingIds(prev => [...prev, id]);
            try {
                const endpoint = type === 'Satış' ? `/api/orders/${id}` : `/api/financials/transactions?id=${id}`;
                const res = await fetch(endpoint, { method: 'DELETE' });
                const data = await res.json();
                
                if (data.success) {
                    showSuccess("Başarılı", "İşlem iade alındı/iptal edildi.");
                    setCompletedIds(prev => [...prev, id]);
                    // Don't refresh immediately to show locked state
                    // router.refresh();
                } else if (data.askForLocalCancel) {
                    // Formal invoice cancellation failed or it's e-Fatura, offer forced local deletion
                    showConfirm("Sadece Yerel (Muhasebe) İptali", `${data.error}\n\ne-Belge iptali yapılamadı. İsterseniz faturanın sadece sistemimizdeki (Periodya'daki) stok/bakiye etkilerini geri alabilirsiniz. Bu işlemi yapmak istediğinize emin misiniz?`, async () => {
                        try {
                            const forceRes = await fetch(endpoint, { 
                                method: 'DELETE', 
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ forceLocalCancel: true }) 
                            });
                            const forceData = await forceRes.json();
                            if (forceData.success) {
                                showSuccess("Başarılı", "Sistem içi yerel iade/iptal tamamlandı.");
                                setCompletedIds(prev => [...prev, id]);
                            } else {
                                showError("Hata", forceData.error || "İşlem yapılamadı.");
                            }
                        } catch (e) {
                            showError("Hata", "Bağlantı hatası.");
                        }
                    });
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

    const handleCancelPlan = (id: string) => {
        showConfirm("Vadelendirme İptali", "Bu vadelendirme planını iptal etmek istediğinize emin misiniz?\n\nNot: Bu işlem taksitleri iptal eder ancak önceden alınmış fatura veya siparişi geri almaz.", async () => {
            setProcessingIds(prev => [...prev, id]);
            try {
                const res = await fetch(`/api/financials/payment-plans/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess("Başarılı", "Vadelendirme planı iptal edildi.");
                    setCompletedIds(prev => [...prev, id]);
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

    // Use real invoices and sales records from history for warranty selection
    const customerInvoices = useMemo(() => {
        return historyList
            .filter((item: any) => (item.type === 'Fatura' || item.type === 'Satış' || item.type === 'İrsaliye') && item.items && item.items.length > 0)
            .map((inv: any) => ({
                id: inv.formalInvoiceId || inv.id, // Prefer the real invoice ID if merged, else fallback to the order/transaction ID
                number: (inv.desc || '').split(' - ')[0] || inv.type,
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

                // Check if already deferred
                const alreadyDeferred = vadelenenIds.includes(order.id) || customer?.paymentPlans?.some((p: any) => p.description === order.id && p.status !== 'İptal' && p.status !== 'Cancelled');
                if (alreadyDeferred) {
                    setIsInstallmentInvoice(false);
                }


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
                    const isPromo = String(it.name || '').includes('(Bedelsiz Promosyon)') || it.isPromo;

                    if (grossPrice === 0 && realProduct && !isPromo) {
                        grossPrice = Number(realProduct.price || 0);
                        console.log(`⚠️ Price missing in order for ${it.name}, using list price: ${grossPrice}`);
                    }
                    if (isPromo) {
                        grossPrice = 0;
                    }

                    // Net Price calculation (Gross -> Net)
                    let netPrice = grossPrice;
                    if (otvType === 'Yüzdesel') {
                        netPrice = grossPrice / ((1 + otvRate / 100) * (1 + vatRate / 100));
                    } else if (otvType === 'Birim Başına') {
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
                setInvoiceItems(mappedItems);

                // Map order discounts and campaign discounts
                let mappedDiscount = 0;
                let rawData = order.rawData;
                if (typeof rawData === 'string') {
                    try { rawData = JSON.parse(rawData); } catch(e){}
                }

                if (order.discountAmount) {
                    mappedDiscount += Number(order.discountAmount);
                }
                if (rawData && rawData.dynamicEarnedPoints) {
                    // This is not a discount, points are earned, but we shouldn't necessarily deduct it here unless they used points.
                }

                // Actually, the terminal sends discountAmount: totalDiscount. Let's see if we store it.
                // In API route, Order doesn't have discountAmount natively, it's stored in rawData or not at all?
                // Wait, Terminal sends discountAmount. If the user used a discount, it should be mapped to the order natively or rawData.
                let inferredDiscount = (Number(order.totalAmount || 0) < Number(order.items?.reduce?.((a:any, b:any)=>a+(b.price*b.qty),0) || order.totalAmount)) 
                 ? (mappedItems.reduce((acc:number, item:any) => acc + (item.price * item.qty), 0) - Number(order.totalAmount || 0)) 
                 : 0;

                // Let's just safely map any valid discount difference if there is one
                // The safest is if we can't find it directly, just leave discount at 0 to not mess up the math, but the user explicitly requested it.
                // Terminal payload has: `discountAmount: totalDiscount`. Is it saved in `rawData` in `api/sales/create/route.ts`? No, it wasn't.
                
                if (inferredDiscount > 1) { // 1 TL buffer
                    setDiscountValue(Number(inferredDiscount.toFixed(2)));
                    setDiscountType('amount');
                } else {
                    setDiscountValue(0);
                    setDiscountType('percent');
                }

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

    const handleCancelInvoice = async (invoiceId: string, isFormal: boolean) => {
        const title = isFormal ? 'Resmi Fatura İptali' : 'Fatura İptal Edilecek';
        const msg = isFormal 
            ? 'DİKKAT: Bu resmi bir faturadır! İptal ederseniz GİB portalından veya e-Logo üzerinden de faturayı resmen iptal veya iade etmelisiniz. Bu işlem stokları ve bakiyeyi geri alacaktır. Onaylıyor musunuz?'
            : 'Bu faturayı iptal etmek istediğinize emin misiniz? Bu işlem bakiye ve stokları GERİ ALACAKTIR.';

        showConfirm(title, msg, async () => {
            try {
                const res = await fetch(`/api/sales/invoices/${invoiceId}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', data.message || 'Fatura iptal edildi.');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showError('Hata', data.error);
                }
            } catch (err) {
                showError('Hata', 'Bağlantı hatası.');
            }
        });
    };

    const handlePrintInvoice = (invoiceId: string) => {
        window.open(`/api/sales/invoices?action=get-pdf&invoiceId=${invoiceId}`, '_blank');
    };

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
            if (it.otvType === 'Yüzdesel') {
                lineOtv = lineNet * (Number(it.otv || 0) / 100);
            } else if (it.otvType === 'Birim Başına') {
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
                setCustomInstallAmount(formatCurrencyInput(newTotalAmount.toFixed(2).replace('.', ',')));
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
                        const ppRes = await fetch('/api/financials/payment-plans', {
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
                        const ppData = await ppRes.json();
                        if (ppData.success) {
                            setVadelenenIds(prev => [...prev, data.invoice?.id, selectedOrder?.id].filter(Boolean) as string[]);
                        } else {
                            showError('Vadelendirme Hatası', ppData.error || 'Vadelendirme sırasında bilinmeyen bir hata oluştu');
                        }
                    } catch (e: any) {
                        console.error('Payment plan auto-creation failed', e);
                        showError('Bağlantı Hatası', 'Vadelendirme servisine ulaşılamadı. Fatura oluşturuldu ancak vadelendirme eksik.');
                    }
                }

                // OPTIMISTIC UI UPDATES
                if (!invoiceData.isFormal) {
                    setProformaOrderIds(prev => [...prev, selectedOrder.id]);
                } else {
                    setFormalOrderIds(prev => [...prev, selectedOrder.id]);
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

                setInvoicedOrderIds(prev => [...prev, selectedOrder?.id].filter(Boolean) as string[]);
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
    const balance = rawBalance;

    const balanceColor = balance > 0 ? '#ef4444' : '#10b981'; // Borçlu: Red, Alacaklı: Green

    const filteredHistory = historyList.filter(item => {
        if (item.type === 'Vadelendirme') return false;
        if (activeTab === 'all') return true;
        if (activeTab === 'sales') return item.type === 'Fatura' || item.type === 'Satış' || item.type === 'İrsaliye';
        if (activeTab === 'payments') return item.type === 'Tahsilat' || item.type === 'Ödeme' || item.type === 'Gider';
        return true;
    });

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const todayStr = new Date().toISOString().split('T')[0];
    const next30DaysDate = new Date();
    next30DaysDate.setDate(next30DaysDate.getDate() + 30);
    const next30DaysStr = next30DaysDate.toISOString().split('T')[0];

    const validPaymentPlans = customer?.paymentPlans?.filter((p: any) => p.status !== 'İptal' && p.status !== 'İptal Edildi' && p.status !== 'Cancelled' && p.status !== 'Draft') || [];

    const todayInstallments = validPaymentPlans.flatMap((p: any) => p.installments || []).filter((i: any) => i.dueDate && i.dueDate.split('T')[0] === todayStr && i.status !== 'Paid' && i.status !== 'Ödendi') || [];
    const overdueInstallments = validPaymentPlans.flatMap((p: any) => p.installments || []).filter((i: any) => i.dueDate && i.dueDate.split('T')[0] < todayStr && i.status !== 'Paid' && i.status !== 'Ödendi') || [];
    const upcomingInstallments = validPaymentPlans.flatMap((p: any) => p.installments || []).filter((i: any) => i.dueDate && i.dueDate.split('T')[0] > todayStr && i.dueDate.split('T')[0] <= next30DaysStr && i.status !== 'Paid' && i.status !== 'Ödendi') || [];

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
                    <Link href={`/payment?amount=${overdueAmount + todayAmount}&title=Tahsilat-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}&type=collection`} style={{ marginLeft: '12px', padding: '6px 12px', background: 'var(--bg-panel, rgba(0,0,0,0.2))', color: 'white', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textDecoration: 'none' }}>Tahsil Et</Link>
                </div>
            )}

                                    {/* --- CARI COMMAND CENTER (STICKY) --- */}
            <EnterpriseCommandCenter 
                title={val(customer.name)}
                titleSuffix={services.length > 0 && services[0].plate ? (
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[8px] text-[13px] font-black tracking-widest uppercase border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1.5">
                        <span className="opacity-50">🚗</span> {services[0].plate}
                    </span>
                ) : undefined}
                backLink="/customers"
                backLabel="Müşteri Merkezi"
                avatarInitials={val(customer.name, '?').charAt(0).toUpperCase()}
                avatarGradient="from-blue-900 to-blue-500"
                contact={{
                    phone: customer.phone,
                    email: customer.email,
                    address: (() => {
                        if (customer.city || customer.district) {
                            return `${customer.district ? customer.district + ' / ' : ''}${customer.city || ''}`;
                        }
                        return customer.address || 'Adres Yok';
                    })()
                }}
                balance={{
                    value: balance,
                    positiveLabel: 'Borç',
                    negativeLabel: 'Alacak',
                    neutralLabel: 'Dengeli',
                    positiveColor: 'text-red-600 dark:text-red-400',
                    negativeColor: 'text-emerald-600 dark:text-emerald-400'
                }}
                metrics={[
                    ...(overdueInstallments.length > 0 ? [{
                        label: 'Vadesi Geçen',
                        value: `${overdueAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
                        icon: '⏳',
                        colorClass: 'bg-red-50 dark:bg-red-500/10 text-red-500'
                    }] : []),
                    ...(portfolioChecks > 0 ? [{
                        label: 'Açık Çek/Senet',
                        value: `${portfolioChecks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`,
                        icon: '🧾',
                        colorClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                    }] : [])
                ]}
                tabs={[
                    { group: 'İŞLEMLER', items: [{ id: 'all', label: 'Tümü' }, { id: 'sales', label: 'Satış/Fatura' }, { id: 'payments', label: 'Finans' }] },
                    { group: 'RİSK & ONAY', items: [{ id: 'checks', label: 'Vadeler' }, { id: 'reconciliations', label: 'Mutabakat' }, { id: 'offers', label: 'Teklifler' }] },
                    { group: 'SERVİS & VARLIKLAR', items: [{ id: 'services', label: 'Servis & Varlıklar' }, { id: 'documents', label: 'Dosyalar' }] }
                ]}
                activeTab={activeTab}
                onTabChange={(id) => { 
                    setActiveTab(id as any); 
                    if (id === 'documents') fetchDocuments(); 
                    if (id === 'services') fetchServices(); 
                }}
                tabRightElement={
                    <div className="relative w-full lg:w-[260px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Satır ve işlemlerde ara..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[8px] h-[36px] pl-9 pr-3 text-[12px] font-semibold outline-none focus:border-blue-500 shadow-sm transition-all text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                }
                actions={
                    <>
                        <Link 
                            href={`/payment?amount=${Math.abs(balance)}&title=Tahsilat-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}&type=collection`}
                            className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                            <span>+</span> Tahsilat Al
                        </Link>
                        <Link 
                            href={`/payment?type=payment&title=Ödeme-${encodeURIComponent(val(customer.name))}&ref=CUST-${customer.id}`}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden sm:flex"
                        >
                            Ödeme Yap
                        </Link>
                        <Link 
                            href={`/?selectedCustomer=${encodeURIComponent(val(customer.name, ''))}`}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden md:flex"
                        >
                            Satış Yap (POS)
                        </Link>
                        <button
                            onClick={() => setReconWizardOpen(true)}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            🤝 Mutabakat
                        </button>
                        <button
                            onClick={() => { setStatementType('summary'); setStatementOpen(true); }}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            📄 Özet Ekstre
                        </button>
                        <button
                            onClick={() => { setStatementType('detailed'); setStatementOpen(true); }}
                            className="h-[36px] px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm hidden lg:flex"
                        >
                            📑 Detaylı Ekstre
                        </button>
                        <button
                            onClick={() => router.push(`/customers?edit=${customer.id}`)}
                            className="w-[36px] h-[36px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 rounded-[8px] flex items-center justify-center transition-colors shadow-sm hover:text-blue-600 hover:border-blue-200"
                            title="Düzenle"
                        >
                            ✏️
                        </button>
                    </>
                }
            />

            <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">
{/* CONTENT AREA */}
                <div className="w-full">

                                        {activeTab === 'services' ? (
                        <div className="p-4 sm:p-6">
                            
                            {/* --- VARLIKLAR VE GARANTİLER BÖLÜMÜ --- */}
                            <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Cihazlar, Varlıklar ve Garantiler</h3>
                                        <p style={{ color: 'var(--text-muted, #888)', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>Müşteriye ait tüm cihaz sicilleri ve garanti karneleri.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => setWarrantyModalOpen(true)}
                                            className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            🛡️ Garanti Karnesi Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {/* CİHAZLAR KUTUSU */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[20px] p-5 shadow-sm">
                                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">📱 Kayıtlı Cihaz Sicilleri</h4>
                                        {assets.length === 0 ? (
                                            <div className="text-[12px] text-slate-500 font-medium py-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">Kayıtlı cihaz sicili bulunmuyor. Servis anında oluşturulur.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                                {assets.map(a => (
                                                    <div key={a.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl flex justify-between items-center hover:border-emerald-500/30 transition-all">
                                                        <div className="min-w-0 pr-4">
                                                            <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{a.primaryIdentifier} {a.secondaryIdentifier ? `(${a.secondaryIdentifier})` : ''}</div>
                                                            <div className="text-[11px] text-slate-500 mt-1 truncate">
                                                                {a.brand || 'Diğer'} {a.model ? ` - ${a.model}` : ''}
                                                                {a.productionYear ? ` • Model: ${a.productionYear}` : ''}
                                                                {a.metadata?.currentKm ? ` • KM: ${a.metadata.currentKm.toLocaleString()}` : ''}
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase whitespace-nowrap shrink-0">Cihaz Sicili</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* GARANTİLER KUTUSU */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[20px] p-5 shadow-sm">
                                        <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">🛡️ Garanti Karneleri</h4>
                                        {warranties.length === 0 ? (
                                            <div className="text-[12px] text-slate-500 font-medium py-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">Kayıtlı garanti karnesi bulunmuyor.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                                {warranties.map(w => (
                                                    <div key={w.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl flex justify-between items-center hover:border-blue-500/30 transition-all">
                                                        <div className="min-w-0 pr-4">
                                                            <div className="font-bold text-[13px] text-slate-900 dark:text-white flex items-center gap-1.5 truncate"><div className={`w-2 h-2 rounded-full shrink-0 ${w.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div> <span className="truncate">{w.productName}</span></div>
                                                            <div className="text-[11px] text-slate-500 mt-1 truncate">S. No: {w.serialNo} • Fatura: {w.invoiceNo || '-'}</div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${w.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                                                {w.status === 'Active' ? 'Devam Ediyor' : 'Süresi Doldu'}
                                                            </span>
                                                            <div className="text-[10px] font-bold text-slate-400 mt-1">Bitiş: {new Date(w.endDate).toLocaleDateString('tr-TR')}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <hr className="border-slate-200 dark:border-white/10 mb-8" />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Servis Geçmişi & İş Emri Yönetimi</h3>
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
                                <div className="p-10 text-center bg-slate-50 dark:bg-[#0f172a] rounded-[16px] border border-dashed border-slate-200 dark:border-white/10">
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
                                <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Tarih / Randevu</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Kategori / Marka</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Plaka</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Durum</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Teknisyen</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">İşlemler</th>
                                                <th className="px-5 py-4 font-bold text-right whitespace-nowrap">Tutar</th>
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
                                                    <tr key={svc.id || i} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <div className="font-bold text-slate-900 dark:text-white">{displayDate ? new Date(displayDate).toLocaleDateString('tr-TR') : '-'}</div>
                                                            {svc.status === 'Beklemede' && svc.appointmentDate && (
                                                                <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', marginTop: '4px' }}>
                                                                    🕒 Randevu: {new Date(svc.appointmentDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#3b82f6' }}>{svc.vehicleType || 'Motor'}</span>
                                                                <span className="font-bold text-slate-900 dark:text-white">{svc.vehicleBrand || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <span style={{ padding: '4px 10px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '6px', fontWeight: '800', color: '#3b82f6', letterSpacing: '1px' }}>
                                                                {svc.plate || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <span style={{
                                                                padding: '6px 10px',
                                                                borderRadius: '8px',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                textTransform: 'uppercase',
                                                                background: svc.status === 'Tamamlandı' ? 'rgba(16, 185, 129, 0.1)' : svc.status === 'İşlemde' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                                color: svc.status === 'Tamamlandı' ? '#10b981' : svc.status === 'İşlemde' ? '#3b82f6' : '#f59e0b',
                                                                border: `1px solid ${svc.status === 'Tamamlandı' ? 'rgba(16, 185, 129, 0.2)' : svc.status === 'İşlemde' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                                            }}>
                                                                {svc.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ color: 'var(--text-main, #fff)', fontWeight: '600' }}>
                                                            {svc.technician?.name || svc.technician || 'Atanmadı'}
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                            <Link href={`/service/${svc.id}`} style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textDecoration: 'none' }}>
                                                                Servis Kokpiti ↗
                                                            </Link>
                                                        </td>
                                                        <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ textAlign: 'right', fontWeight: '800', color: '#3b82f6', fontSize: '14px' }}>
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
                    ) : activeTab === 'offers' ? (
                        <div className="p-4 sm:p-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Teklifler</h3>
                                <Link href={`/offers?customerId=${customer.id}`} className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm">Yeni Teklif</Link>
                            </div>
                            <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Tarih / No</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Açıklama</th>
                                                <th className="px-5 py-4 font-bold text-right whitespace-nowrap">Tutar</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Durum</th>
                                                <th className="px-5 py-4 font-bold whitespace-nowrap">Detay</th>
                                            </tr>
                                        </thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">

{(!customer.offers || customer.offers.length === 0) && (
    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Teklif Bulunamadı. Müşteriye henüz bir teklif oluşturulmamış.</td></tr>
)}
{customer.offers && customer.offers.length > 0 && customer.offers.map((offer: any) => (

                                                <tr key={offer.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                                                        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-main, #fff)', marginBottom: '4px' }}>
                                                            {new Date(offer.issueDate).toLocaleDateString('tr-TR')}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', fontWeight: '600' }}>{offer.offerNumber}</div>
                                                    </td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main, #e2e8f0)', whiteSpace: 'pre-wrap' }}>
                                                            {(offer.terms && offer.terms[0]?.notes) || 'TEKLİF'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ verticalAlign: 'middle', textAlign: 'right', fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #fff)', letterSpacing: '0.5px' }}>
                                                        {Number(offer.grandTotal || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                                    </td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                                                        <span style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase',
                                                            background: offer.status === 'ACCEPTED' || offer.status === 'CONVERTED_TO_ORDER' ? 'rgba(16, 185, 129, 0.1)' : offer.status === 'REJECTED' || offer.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                            color: offer.status === 'ACCEPTED' || offer.status === 'CONVERTED_TO_ORDER' ? '#10b981' : offer.status === 'REJECTED' || offer.status === 'CANCELLED' ? '#ef4444' : '#3b82f6',
                                                            border: `1px solid ${offer.status === 'ACCEPTED' || offer.status === 'CONVERTED_TO_ORDER' ? 'rgba(16, 185, 129, 0.2)' : offer.status === 'REJECTED' || offer.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                                                        }}>
                                                            {offer.status === 'DRAFT' ? 'TASLAK' : offer.status === 'PENDING_APPROVAL' ? 'ONAY BEKLİYOR' : offer.status === 'APPROVED' ? 'ONAYLANDI' : offer.status === 'SENT' ? 'GÖNDERİLDİ' : offer.status === 'VIEWED' ? 'GÖRÜNTÜLENDİ' : offer.status === 'NEGOTIATING' ? 'PAZARLIK' : offer.status === 'ACCEPTED' ? 'KABUL EDİLDİ' : offer.status === 'REJECTED' ? 'REDDEDİLDİ' : offer.status === 'EXPIRED' ? 'SÜRESİ DOLDU' : offer.status === 'CONVERTED_TO_ORDER' ? 'FATURALANDIRILDI' : 'İPTAL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ verticalAlign: 'middle' }}>
                                                        <Link href={`/offers?activeId=${offer.id}`} style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', color: 'var(--text-main, #fff)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', textDecoration: 'none' }}>
                                                            İncele
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                        </div>
                    ) : activeTab === 'reconciliations' ? (
                        <div className="p-12 text-center text-slate-500 rounded-[20px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5">
                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🤝</div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Mutabakatlar</h4>
                            <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '13px' }}>
                                Cari hesap mutabakat işlemleri bu alandan yönetilecektir. Yeni e-mutabakat sistemi yakında eklenecektir.
                            </p>
                        </div>
                    ) : activeTab === 'documents' ? (
                        <div className="p-4 sm:p-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Müşteri Dosyaları</h3>
                                <label className="h-[36px] px-4 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                                    {uploading ? 'Yükleniyor...' : '⬆️ Dosya Yükle'}
                                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg" />
                                </label>
                            </div>

                            {docsLoading ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Dosyalar getiriliyor...
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm">
                                    Henüz dosyası yüklenmemiş. (Maks 5MB PDF, PNG, JPEG)
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
                    ) : activeTab === 'checks' ? (
                        <div className="p-4 sm:p-6">
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Evraklar & Vadeler</h3>
                                <button
                                    onClick={() => setCheckAddModalOpen(true)}
                                    className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                >
                                    ➕ Yeni Evrak Ekle
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* CHECK PORTFOLIO COLUMN */}
                                <div>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-muted, #aaa)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>📥</span> Çek & Senet Portföyü
                                    </h4>
                                    <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                        <th className="px-5 py-4 font-bold whitespace-nowrap">EVRAK DESTEĞİ & TARİH</th>
                                                        <th className="px-5 py-4 font-bold text-right whitespace-nowrap">TUTAR & DURUM</th>
                                                    </tr>
                                                </thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">
{(!customer.checks || customer.checks.length === 0) ? (<tr><td colSpan={2} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Kayıtlı evrak bulunmuyor.</td></tr>) : customer.checks.map((c: any) => (
                                                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group border-b border-slate-100 dark:border-white/5">
                                                            <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                                <div style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)', marginBottom: '4px' }}>{c.type} - {c.bank}</div>
                                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: '500', fontSize: '12px' }}>
                                                                    🔖 {c.number} • 🕒 {new Date(c.dueDate).toLocaleDateString('tr-TR')}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400 text-right">
                                                                <div style={{ fontWeight: '800', color: '#3b82f6', fontSize: '14px', marginBottom: '6px' }}>
                                                                    {Number(c.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                    <span style={{ padding: '4px 8px', background: 'var(--bg-panel, rgba(255,255,255,0.05))', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{c.status}</span>
                                                                    {(c.status === 'Portföyde' || c.status === 'Beklemede') && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setActiveCheck(c);
                                                                                setTargetKasaId(String(kasalar[0]?.id || ''));
                                                                                setShowCheckCollectModal(true);
                                                                            }}
                                                                            style={{ padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                                                            className="hover:bg-blue-500 hover:text-white"
                                                                        >
                                                                            Tahsil
                                                                        </button>
                                                                    )}
                                                                    {(c.status === 'Portföyde' || c.status === 'Beklemede') && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (!processingIds.includes(c.id)) {
                                                                                    showConfirm("Çek İptali", "Bu çeki/seneti silmek ve iptal etmek istediğinize emin misiniz? Bakiye düzeltilecektir.", async () => {
                                                                                        setProcessingIds(prev => [...prev, c.id]);
                                                                                        try {
                                                                                            const res = await fetch(`/api/financials/checks/${c.id}`, { method: 'DELETE' });
                                                                                            if (res.ok) {
                                                                                                showSuccess("Başarılı", "Çek iptal edildi.");
                                                                                                window.location.reload();
                                                                                            } else {
                                                                                                const data = await res.json();
                                                                                                showError("Hata", data.error || "İşlem yapılamadı.");
                                                                                            }
                                                                                        } catch (e) {
                                                                                            showError("Hata", "Bağlantı hatası.");
                                                                                        } finally {
                                                                                            setProcessingIds(prev => prev.filter(pid => pid !== c.id));
                                                                                        }
                                                                                    });
                                                                                }
                                                                            }}
                                                                            disabled={processingIds.includes(c.id)}
                                                                            style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: processingIds.includes(c.id) ? 'default' : 'pointer', transition: 'all 0.2s' }}
                                                                            className="hover:bg-red-500 hover:text-white"
                                                                        >
                                                                            {processingIds.includes(c.id) ? '⏳' : 'İptal'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                </div>

                                {/* PAYMENT PLANS COLUMN */}
                                <div>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-muted, #aaa)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>📅</span> Taksit & Vadelendirme Planları
                                    </h4>
                                    <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                        <th className="px-5 py-4 font-bold whitespace-nowrap">SATIŞ/KONU & TARİH</th>
                                                        <th className="px-5 py-4 font-bold text-right whitespace-nowrap">TUTAR & İŞLEM</th>
                                                    </tr>
                                                </thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">
{(!customer.paymentPlans || customer.paymentPlans.length === 0) ? (<tr><td colSpan={2} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Aktif vadelendirme planı bulunmuyor.</td></tr>) : customer.paymentPlans.filter((p:any)=>p.status!=='İptal'&&p.status!=='Cancelled').map((p: any) => (
                                                        <Fragment key={p.id}>
                                                        <tr onClick={() => setExpandedRowId(expandedRowId === p.id ? null : p.id)} style={{ borderBottom: expandedRowId === p.id ? 'none' : '1px solid var(--border-color, rgba(255,255,255,0.05))', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s', background: expandedRowId === p.id ? 'var(--bg-card, rgba(255,255,255,0.03))' : 'transparent' }} className="hover:bg-white/5">
                                                            <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                                <div style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)', marginBottom: '4px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '180px' }}>{p.title}</div>
                                                                <div style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: '500', fontSize: '12px' }}>
                                                                    🗓 {new Date(p.createdAt).toLocaleDateString('tr-TR')} • {p.installments?.length || 0} Taksit
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400 text-right">
                                                                <div style={{ fontWeight: '800', color: '#f59e0b', fontSize: '14px', marginBottom: '6px' }}>
                                                                    {Number(p.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                    <span style={{ padding: '4px 8px', background: p.status === 'Ödendi' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-panel, rgba(255,255,255,0.05))', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: p.status === 'Ödendi' ? '#10b981' : 'var(--text-main, #e2e8f0)' }}>{p.status}</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (!completedIds.includes(p.id) && !processingIds.includes(p.id)) {
                                                                                handleCancelPlan(p.id);
                                                                            }
                                                                        }}
                                                                        disabled={completedIds.includes(p.id) || processingIds.includes(p.id)}
                                                                        style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '11px', fontWeight: '800', cursor: processingIds.includes(p.id) ? 'default' : 'pointer', transition: 'all 0.2s' }}
                                                                        className="hover:bg-red-500 hover:text-white"
                                                                        title="Vadelendirmeyi İptal Et"
                                                                    >
                                                                        {processingIds.includes(p.id) ? '⏳' : 'İptal'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {expandedRowId === p.id && p.installments && p.installments.length > 0 && (
                                                            <tr style={{ background: 'var(--bg-card, rgba(255,255,255,0.01))', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                                                                <td colSpan={2} style={{ padding: '0 20px 20px 20px' }}>
                                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #888)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taksit Detayları</div>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                                                            {p.installments.map((inst: any) => {
                                                                                const isPaid = inst.status === 'Ödendi' || inst.status === 'Paid';
                                                                                const isOverdue = !isPaid && inst.dueDate && new Date(inst.dueDate) < new Date(new Date().setHours(0,0,0,0));
                                                                                return (
                                                                                    <div key={inst.id} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-panel, rgba(255,255,255,0.03))', border: isOverdue ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #94a3b8)' }}>{inst.installmentNo}. Taksit</span>
                                                                                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', background: isPaid ? 'rgba(16,185,129,0.1)' : isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: isPaid ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b' }}>{isPaid ? 'Ödendi' : isOverdue ? 'Gecikti' : 'Bekliyor'}</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main, #fff)' }}>{Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
                                                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><span>🗓</span> {new Date(inst.dueDate).toLocaleDateString('tr-TR')}</div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        </Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                </div>
                            </div>
                        </div>
                    ) : (activeTab as any) === 'reconciliations' ? (
                        <div className="p-4 sm:p-6">
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: 'var(--text-main, #fff)', fontSize: '20px', fontWeight: '800' }}>Cari Mutabakatlar</h3>
                                <button
                                    onClick={() => setReconWizardOpen(true)}
                                    className="h-[36px] px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                >
                                    🤝 Mutabakat Başlat
                                </button>
                            </div>

                            <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col mb-4">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b]">
                                                <th style={{ padding: '16px 20px' }}>DÖNEM</th>
                                                <th style={{ padding: '16px 20px' }}>TARİH</th>
                                                <th style={{ padding: '16px 20px' }}>DURUM</th>
                                                <th className="px-5 py-4 font-bold text-right whitespace-nowrap">BAKİYE</th>
                                            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(!customer.reconciliations || customer.reconciliations.length === 0) ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Bu cariyle henüz mutabakat yapılmamış.</td></tr>
                ) : customer.reconciliations.map((r: any) => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', fontSize: '13px', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => router.push('/reconciliation')} className="hover:bg-white/5">
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{new Date(r.periodStart).toLocaleDateString('tr-TR')} - {new Date(r.periodEnd).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400" style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>{new Date(r.createdAt || r.date).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                                                        <span style={{ padding: '6px 12px', background: 'var(--bg-card, rgba(255,255,255,0.05))', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-main, #e2e8f0)' }}>{r.status || 'Bekliyor'}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: '800', padding: '20px', color: '#3b82f6', fontSize: '14px' }}>{Number(r.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                </tr>
                                            ))}
                                        </tbody></table></div></div>) : ( <div className="overflow-auto max-h-[calc(100vh-270px)] custom-scroll bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex flex-col">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-[#1e293b] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-20">
                                    <tr>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Tarih</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 whitespace-nowrap">Hareket Türü</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 min-w-[200px]">Açıklama</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-right whitespace-nowrap">Tutar</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-right whitespace-nowrap">Aksiyonlar</th>
                                        <th className="px-5 py-4 font-bold border-b border-slate-200 dark:border-white/5 text-center w-[40px]"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {filteredHistory.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400 font-semibold text-[14px]">Bu kategoride kayıt veya işlem bulunamadı.</td></tr>
                                    ) : (
                                        paginatedHistory.map((item, idx) => (
                                            <Fragment key={item.id || idx}>
                                                <tr
                                                    onClick={() => item.items && setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                                                    className={`hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[48px] group ${expandedRowId === item.id ? "bg-slate-50 dark:bg-white/[0.02]" : ""} ${item.items ? "cursor-pointer" : ""}`}
                                                >
                                                    <td className="px-5 py-3 align-middle text-[12px] font-bold text-slate-700 dark:text-slate-300">{item.date}</td>
                                                    <td className="px-5 py-3 align-middle">
                                                        <span style={{ background: item.color + "15", color: item.color, border: "1px solid " + item.color + "30" }} className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest">
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 align-middle text-[12px] font-semibold text-slate-500 dark:text-slate-400">{item.desc}</td>
                                                    <td className={`px-5 py-3 align-middle text-right text-[14px] font-black font-mono whitespace-nowrap ${item.amount > 0 ? "text-red-500" : item.amount < 0 ? "text-emerald-500" : "text-slate-500"}`}>
                                                        {Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </td>
                                                    <td className="px-5 py-3 align-middle text-right pr-6">
                                                        {item.type === 'Satış' && (
                                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                {item.orderId && (
                                                                    (() => {
                                                                        const hasInvoice = item.isFormal || invoicedOrderIds.includes(item.orderId) || formalOrderIds.includes(item.orderId);
                                                                        const isReallyFormal = item.realIsFormal || invoicedOrderIds.includes(item.orderId) || formalOrderIds.includes(item.orderId);
                                                                        const isProforma = ['Proforma', 'Taslak'].includes(item.linkedInvoiceStatus) || proformaOrderIds.includes(item.orderId);
                                                                        const statusLabel = isProforma && !isReallyFormal ? 'Taslak (Proforma)' : (item.linkedInvoiceStatus === 'İrsaliye' ? 'İrsaliye' : 'Faturalandı');
                                                                        const statusIcon = isProforma && !isReallyFormal ? '📝' : (item.linkedInvoiceStatus === 'İrsaliye' ? '🚚' : '✅');
                                                                        const statusColor = isProforma && !isReallyFormal ? '#f59e0b' : (item.linkedInvoiceStatus === 'İrsaliye' ? '#8b5cf6' : '#10b981');
                                                                        const statusBg = isProforma && !isReallyFormal ? 'rgba(245, 158, 11, 0.1)' : (item.linkedInvoiceStatus === 'İrsaliye' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)');
                                                                        
                                                                        const isVadelendi = vadelenenIds.includes(item.orderId) || customer?.paymentPlans?.some((p: any) => (p.description === item.orderId || p.description === item.id || (item.formalInvoiceId && p.description === item.formalInvoiceId)) && p.status !== 'İptal' && p.status !== 'Cancelled');
                                                                        const vadelendiBadge = isVadelendi ? (
                                                                            <span style={{
                                                                                padding: '6px 10px',
                                                                                background: 'rgba(139, 92, 246, 0.1)',
                                                                                color: '#8b5cf6',
                                                                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                                                                borderRadius: '8px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '800',
                                                                                whiteSpace: 'nowrap',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '4px'
                                                                            }}>
                                                                                📅 Vadelendi
                                                                            </span>
                                                                        ) : null;

                                                                        return hasInvoice ? (
                                                                            <>
                                                                                <span style={{
                                                                                    padding: '6px 10px',
                                                                                    background: statusBg,
                                                                                    color: statusColor,
                                                                                    border: `1px solid ${statusBg.replace('0.1', '0.2')}`,
                                                                                    borderRadius: '8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '800',
                                                                                    whiteSpace: 'nowrap',
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '6px'
                                                                                }}>
                                                                                    {statusIcon} {statusLabel}
                                                                                </span>
                                                                                {vadelendiBadge}
                                                                                {isProforma && !isReallyFormal && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleOpenInvoicing(item.orderId); }}
                                                                                        style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                                                                                        className="hover:bg-blue-500 hover:text-white box-shadow-blue"
                                                                                        title="Proformayı Düzenle ve Resmileştir"
                                                                                    >
                                                                                        📝 Dönüştür
                                                                                    </button>
                                                                                )}
                                                                                {item.formalInvoiceId && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handlePrintInvoice(item.formalInvoiceId);
                                                                                        }}
                                                                                        style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                                        className="hover:bg-indigo-500 hover:text-white transition-colors"
                                                                                        title="Faturayı veya İrsaliyeyi Görüntüle / Yazdır"
                                                                                    >
                                                                                        🖨️ Yazdır
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                {vadelendiBadge}
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); handleOpenInvoicing(item.orderId); }}
                                                                                    style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                                                                                    className="hover:bg-blue-500 hover:text-white box-shadow-blue"
                                                                                >
                                                                                    🧾 Faturalandır
                                                                                </button>
                                                                            </>
                                                                        );
                                                                    })()
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!completedIds.includes(item.id) && !processingIds.includes(item.id)) {
                                                                            handleReturnTransaction(item.id, item.type);
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
                                                        {(item.type === 'Fatura' || item.type === 'İrsaliye') && (
                                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                {(() => {
                                                                    const isVadelendi = vadelenenIds.includes(item.id) || customer?.paymentPlans?.some((p: any) => (p.description === item.id || (item.orderId && p.description === item.orderId)) && p.status !== 'İptal' && p.status !== 'Cancelled');
                                                                    if (isVadelendi) {
                                                                        return (
                                                                            <span style={{
                                                                                padding: '6px 10px',
                                                                                background: 'rgba(139, 92, 246, 0.1)',
                                                                                color: '#8b5cf6',
                                                                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                                                                borderRadius: '8px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '800',
                                                                                whiteSpace: 'nowrap',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '4px'
                                                                            }}>
                                                                                📅 Vadelendi
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                                {(item.status === 'Proforma' || item.status === 'Taslak') && !item.isFormal && item.orderId && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenInvoicing(item.orderId); }}
                                                                        style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                                                                        className="hover:bg-blue-500 hover:text-white box-shadow-blue"
                                                                        title="Proformayı Düzenle ve Resmileştir"
                                                                    >
                                                                        📝 Dönüştür
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePrintInvoice(item.id);
                                                                    }}
                                                                    style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                                    className="hover:bg-indigo-500 hover:text-white transition-colors"
                                                                >
                                                                    📄 PDF
                                                                </button>
                                                                {item.status !== 'İptal Edildi' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCancelInvoice(item.id, item.isFormal);
                                                                        }}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                                            color: '#ef4444',
                                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                            borderRadius: '8px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '800',
                                                                            cursor: 'pointer',
                                                                            whiteSpace: 'nowrap',
                                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        className="hover:bg-red-500 hover:text-white"
                                                                        title="Faturayı veya İrsaliyeyi İptal Et"
                                                                    >
                                                                        İptal Et
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {(item.type === 'Tahsilat' || item.type === 'Ödeme' || item.type === 'Gider') && (
                                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!completedIds.includes(item.id) && !processingIds.includes(item.id) && item.status !== 'İptal Edildi' && item.desc?.indexOf('İptal') === -1) {
                                                                            handleReturnTransaction(item.id, item.type);
                                                                        }
                                                                    }}
                                                                    disabled={completedIds.includes(item.id) || processingIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        background: (completedIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1) ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                                                        color: (completedIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1) ? 'var(--text-muted, #666)' : '#ef4444',
                                                                        border: (completedIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1) ? '1px solid var(--border-color, rgba(255,255,255,0.1))' : '1px solid rgba(239, 68, 68, 0.3)',
                                                                        borderRadius: '8px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '800',
                                                                        cursor: (completedIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1) ? 'default' : 'pointer',
                                                                        whiteSpace: 'nowrap',
                                                                        opacity: processingIds.includes(item.id) ? 0.5 : 1,
                                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    className={!(completedIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1) && !processingIds.includes(item.id) ? "hover:bg-red-500 hover:text-white" : ""}
                                                                    title="İşlemi İade Al / İptal Et"
                                                                >
                                                                    {processingIds.includes(item.id) ? '⏳' : ((completedIds.includes(item.id) || item.status === 'İptal Edildi' || item.desc?.indexOf('İptal') !== -1) ? '✅ İptal Edildi' : '✖️ İptal Et')}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {item.type === 'Vadelendirme' && (
                                                            <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!completedIds.includes(item.id) && !processingIds.includes(item.id) && item.status !== 'İptal' && item.status !== 'Cancelled') {
                                                                            handleCancelPlan(item.id);
                                                                        }
                                                                    }}
                                                                    disabled={completedIds.includes(item.id) || processingIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled'}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        background: (completedIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled') ? 'transparent' : 'rgba(239, 68, 68, 0.1)',
                                                                        color: (completedIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled') ? 'var(--text-muted, #666)' : '#ef4444',
                                                                        border: (completedIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled') ? '1px solid var(--border-color, rgba(255,255,255,0.1))' : '1px solid rgba(239, 68, 68, 0.3)',
                                                                        borderRadius: '8px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '800',
                                                                        cursor: (completedIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled') ? 'default' : 'pointer',
                                                                        whiteSpace: 'nowrap',
                                                                        opacity: processingIds.includes(item.id) ? 0.5 : 1,
                                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    className={!(completedIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled') && !processingIds.includes(item.id) ? "hover:bg-red-500 hover:text-white" : ""}
                                                                    title="Vadelendirme Planını İptal Et"
                                                                >
                                                                    {processingIds.includes(item.id) ? '⏳' : ((completedIds.includes(item.id) || item.status === 'İptal' || item.status === 'Cancelled') ? '✅ İptal Edildi' : '✖️ İptal Et')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #666)' }}>{item.items ? (expandedRowId === item.id ? '▲' : '▼') : ''}</td>
                                                </tr>
                                                {expandedRowId === item.id && item.items && (
                                                    <tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5">
                                                        <td colSpan={6} style={{ padding: '24px 32px' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                                                                {/* Sol Taraf: Kalemler (Order Summary) ve Ödeme Planı */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                                    <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-[20px] p-6 border border-slate-200 dark:border-white/5">
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', paddingBottom: '16px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                                                📦
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="m-0 text-[14px] font-extrabold text-slate-800 dark:text-white tracking-wide">SATIŞ ÖZETİ</h4>
                                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>{item.items.length} Kalem Listeleniyor</div>
                                                                            </div>
                                                                        </div>
                                                                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', background: ['Proforma', 'Taslak'].includes(item.linkedInvoiceStatus) ? 'rgba(245, 158, 11, 0.1)' : (item.linkedInvoiceStatus === 'İrsaliye' ? 'rgba(139, 92, 246, 0.1)' : (item.isFormal ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.1)')), color: ['Proforma', 'Taslak'].includes(item.linkedInvoiceStatus) ? '#f59e0b' : (item.linkedInvoiceStatus === 'İrsaliye' ? '#8b5cf6' : (item.isFormal ? '#10b981' : '#aaa')) }}>
                                                                            {['Proforma', 'Taslak'].includes(item.linkedInvoiceStatus) ? 'Taslak (Proforma)' : (item.linkedInvoiceStatus === 'İrsaliye' ? 'İrsaliye' : (item.isFormal ? 'Faturalandı' : 'Sipariş'))}
                                                                        </span>
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
                                                                                <div className="font-extrabold text-slate-800 dark:text-white font-mono text-[15px]">
                                                                                    {((sub.price || 0) * (sub.qty || sub.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {(() => {
                                                                    const attachedPlan = customer?.paymentPlans?.find((p: any) => p.title === item.desc || p.description === item.id || (item.orderId && p.description === item.orderId) || (item.formalInvoiceId && p.description === item.formalInvoiceId));
                                                                    if (!attachedPlan) return null;
                                                                    return (
                                                                        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-[20px] p-6 border border-slate-200 dark:border-white/5">
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                                                <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#f59e0b', letterSpacing: '1px' }}>ÖDEME PLANI DETAYI</h4>
                                                                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '8px' }}>{attachedPlan.installments?.length || attachedPlan.installmentCount} Taksit</span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                                {attachedPlan.installments?.map((inst: any) => (
                                                                                    <div key={inst.id} className="flex justify-between p-3 bg-white dark:bg-[#0f172a]/50 rounded-[8px] border border-slate-200/50 dark:border-white/5 shadow-sm" style={{ opacity: inst.status === 'Cancelled' ? 0.5 : 1 }}>
                                                                                        <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px', fontWeight: '600', textDecoration: inst.status === 'Cancelled' ? 'line-through' : 'none' }}>
                                                                                            {inst.installmentNo}. Taksit ({new Date(inst.dueDate).toLocaleDateString('tr-TR')})
                                                                                            {inst.status === 'Cancelled' && <span style={{ color: '#ef4444', marginLeft: '6px' }}>(İptal Edildi)</span>}
                                                                                        </span>
                                                                                        <span className="text-slate-800 dark:text-white text-[14px] font-extrabold font-mono" style={{ textDecoration: inst.status === 'Cancelled' ? 'line-through' : 'none' }}>{Number(inst.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                </div>

                                                                {/* Sağ Taraf: Payment Breakdown & Timeline */}
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                                                    <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-[20px] p-6 border border-slate-200 dark:border-white/5">
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
                                                                                <span className="text-[12px] font-bold text-slate-800 dark:text-white">GENEL TOPLAM</span>
                                                                                <span style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6', fontFamily: 'monospace' }}>
                                                                                    {Math.abs(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>



                                                                    <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-[20px] p-6 border border-slate-200 dark:border-white/5">
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
                                                                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.linkedInvoiceStatus === 'Proforma' ? '#f59e0b' : '#10b981', border: '4px solid #080a0f', flexShrink: 0, marginTop: '2px' }}></div>
                                                                                    <div>
                                                                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>
                                                                                            {item.linkedInvoiceStatus === 'Proforma' ? 'Taslak (Proforma Oluşturuldu)' : 'Resmileştirildi (Faturalandı)'}
                                                                                        </div>
                                                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                                                                                            {item.linkedInvoiceStatus === 'Proforma' ? 'Taslak olarak sisteme eklendi' : 'Sistem tarafından E-Arşive eklendi'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {(() => {
                                                                                const attachedPlan = customer?.paymentPlans?.find((p: any) => p.title === item.desc || p.description === item.id || (item.orderId && p.description === item.orderId) || (item.formalInvoiceId && p.description === item.formalInvoiceId));
                                                                                if (attachedPlan && attachedPlan.status !== 'İptal' && attachedPlan.status !== 'Cancelled') {
                                                                                    return (
                                                                                        <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, marginTop: '16px' }}>
                                                                                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#8b5cf6', border: '4px solid #080a0f', flexShrink: 0, marginTop: '2px' }}></div>
                                                                                            <div>
                                                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #fff)' }}>Vadelendirme Yapıldı</div>
                                                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)' }}>
                                                                                                    Ödeme planı oluşturuldu ({attachedPlan.installments?.length || attachedPlan.installmentCount} Taksit)
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            })()}
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
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-[1200px] max-w-[98vw] flex flex-col h-[90vh] overflow-hidden bg-white dark:bg-[#080a0f] rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl">
                            {/* Header */}
                            <div className="px-6 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl text-blue-500">📄</span>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">RESMİ FATURALANDIRMA SİSTEMİ</h2>
                                        <p className="text-xs font-semibold text-slate-500 tracking-wide">E-ARŞİV / E-FATURA TASLAĞI</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-4">
                                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            id="inv_create_wayslip"
                                            className="w-3.5 h-3.5 rounded text-emerald-500 accent-emerald-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">İrsaliye Ekle</span>
                                    </label>

                                    {(() => {
                                        const pmRaw = selectedOrder?.rawData ? (typeof selectedOrder.rawData === 'string' ? JSON.parse(selectedOrder.rawData)?.paymentMode : selectedOrder.rawData.paymentMode) : null;
                                        const isVeresiye = !pmRaw || ['account', 'veresiye'].includes(pmRaw);
                                        if (!isVeresiye) return null;

                                        const invoiceIdsForOrder = (customer?.invoices || [])
                                            .filter((inv: any) => inv.orderId === selectedOrder?.id)
                                            .map((inv: any) => inv.id);

                                        const isAlreadyVadelendi = selectedOrder && (
                                            vadelenenIds.includes(selectedOrder.id) || 
                                            invoiceIdsForOrder.some((id: string) => vadelenenIds.includes(id)) ||
                                            customer?.paymentPlans?.some((p: any) => 
                                                (
                                                    p.description === selectedOrder.id || 
                                                    (lastInvoice && p.description === lastInvoice.id) || 
                                                    (lastInvoice && p.description === lastInvoice.orderId) ||
                                                    invoiceIdsForOrder.includes(p.description)
                                                ) && 
                                                p.status !== 'İptal' && p.status !== 'Cancelled'
                                            )
                                        );

                                        return (
                                            <div className="relative group/vadewrap">
                                                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-[24px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer transition-colors ${isAlreadyVadelendi ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        disabled={isAlreadyVadelendi}
                                                        checked={isAlreadyVadelendi ? false : isInstallmentInvoice}
                                                        onChange={(e) => setIsInstallmentInvoice(e.target.checked)}
                                                        className="w-3.5 h-3.5 rounded text-blue-500 accent-blue-500 disabled:opacity-50"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Vadelendir (Plan)</span>
                                                </label>
                                                
                                                {isInstallmentInvoice && !isAlreadyVadelendi && (
                                                    <div className="absolute right-0 top-[120%] z-50 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500">Taksit Türü</label>
                                                            <select id="inv_installment_type" defaultValue="Açık Hesap" className="p-2 text-xs rounded-[24px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                                                <option value="Açık Hesap">Açık Hesap / Cari</option>
                                                                <option value="Çek">Çek Alınacak</option>
                                                                <option value="Senet">Senet / Promissory Note</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-slate-500">Ödeme Vadesi (Düzen)</label>
                                                            <select value={invoiceInstallmentCount} onChange={e => setInvoiceInstallmentCount(Number(e.target.value))} className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] outline-none font-bold">
                                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n} Ay Seç</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <button onClick={() => setInvoiceModalOpen(false)} className="ml-2 w-8 h-8 flex items-center justify-center rounded-[24px] hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                                        &times;
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Section: Buyer Information */}
                                    <EnterpriseCard borderLeftColor="#3b82f6" className="space-y-4 lg:col-span-2 !p-4">
                                        <h3 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">ALICI BİLGİLERİ</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <EnterpriseInput id="inv_name" label="ÜNVAN / AD SOYAD" defaultValue={customer.name} />
                                            <EnterpriseInput id="inv_tax_no" label="V.N. / T.C. KİMLİK NO" defaultValue={customer.taxNumber} />
                                            <EnterpriseInput id="inv_tax_office" label="VERGİ DAİRESİ" defaultValue={customer.taxOffice} />
                                            <EnterpriseInput id="inv_phone" label="TELEFON" defaultValue={customer.phone} />
                                            <div className="md:col-span-2">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ADRES</label>
                                                    <textarea id="inv_address" defaultValue={customer.address} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-[24px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all min-h-[50px] resize-y" />
                                                </div>
                                            </div>
                                        </div>
                                    </EnterpriseCard>

                                    {/* Section: Finansal Özet */}
                                    <EnterpriseCard borderLeftColor="#10b981" className="space-y-4 lg:col-span-1 !p-4 bg-emerald-50/10 dark:bg-emerald-900/5 flex flex-col">
                                        <h3 className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">FİNANSAL ÖZET</h3>
                                        <div className="flex-1 flex flex-col justify-end">
                                        {(() => {
                                            const subtotal = invoiceItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.price)), 0);

                                            let totalOtv = 0;
                                            let totalOiv = 0;
                                            let totalVat = 0;

                                            invoiceItems.forEach(it => {
                                                const lineQty = Number(it.qty || 1);
                                                const lineNetBase = lineQty * Number(it.price || 0);
                                                const lineDiscount = lineNetBase * (Number(it.discountRate || 0) / 100);
                                                const lineNet = lineNetBase - lineDiscount;
                                                
                                                let lineOtv = 0;
                                                if (it.otvType === 'Yüzdesel') {
                                                    lineOtv = lineNet * (Number(it.otv || 0) / 100);
                                                } else if (it.otvType === 'Birim Başına') {
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
                                                <div className="flex flex-col gap-3 py-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-slate-500">Ara Toplam (Net)</span>
                                                        <span className="font-mono font-bold text-[14px]">{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    {totalOtv > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-semibold text-slate-500">ÖTV Toplam</span>
                                                            <span className="font-mono font-bold text-[14px] text-amber-500">{totalOtv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-slate-500">İskonto</span>
                                                            <select
                                                                value={discountType}
                                                                onChange={(e: any) => setDiscountType(e.target.value)}
                                                                className="px-1 py-0.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none"
                                                            >
                                                                <option value="percent">%</option>
                                                                <option value="amount">₺</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={discountValue}
                                                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                                                className="w-14 px-1 py-0.5 text-center text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none"
                                                            />
                                                        </div>
                                                        <span className="font-mono font-bold text-[14px] text-red-500">- {discAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-slate-500">KDV Katkısı</span>
                                                            {invoiceItems.length > 0 && invoiceItems.every((it: any) => it.vat === invoiceItems[0].vat) && (
                                                                <span className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                                                                    %{invoiceItems[0].vat || 20}
                                                                </span>
                                                            )}
                                                        </div>                                                        
                                                        <span className="font-mono font-bold text-[14px]">{totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                                    </div>

                                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold tracking-widest text-slate-900 dark:text-white">GENEL TOPLAM</span>
                                                        <span className="text-2xl font-mono font-black text-blue-600 dark:text-blue-500 tracking-tight">
                                                            {finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm opacity-80">₺</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        </div>
                                    </EnterpriseCard>
                                </div>

                                {/* Section: Items Table */}
                                <EnterpriseCard borderLeftColor="#3b82f6" className="space-y-4 !p-4">
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
                                            { label: 'İND. %', alignRight: true },
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
                                            const discountRate = Number(it.discountRate || 0);

                                            const lineNetBase = qty * netPrice;
                                            const discountAmount = lineNetBase * (discountRate / 100);
                                            const lineNetTotal = lineNetBase - discountAmount;

                                            let otvAmount = 0;
                                            if (it.otvType === 'Yüzdesel') {
                                                otvAmount = lineNetTotal * (otvRate / 100);
                                            } else if (it.otvType === 'Birim Başına') {
                                                otvAmount = otvRate * qty;
                                            }
                                            const vatMatrah = lineNetTotal + otvAmount;
                                            const vatAmount = vatMatrah * (vatRate / 100);
                                            const oivAmount = vatMatrah * (Number(it.oiv || 0) / 100);
                                            const lineGrossTotal = vatMatrah + vatAmount + oivAmount;

                                            const updateItem = (field: string, val: any) => {
                                                const newItems = [...invoiceItems];
                                                newItems[i][field] = val;
                                                setInvoiceItems(newItems);
                                            };

                                            const handleGrossChange = (newGross: number) => {
                                                if (qty === 0) return;
                                                const oivR = Number(it.oiv || 0);
                                                const factor = (1 - discountRate / 100);
                                                if (factor <= 0) return; // avoid division by zero or negative discount inversions
                                                
                                                let calculatedNet = 0;
                                                if (it.otvType === 'Yüzdesel') {
                                                    calculatedNet = newGross / (qty * factor * (1 + otvRate / 100) * (1 + (vatRate + oivR) / 100));
                                                } else if (it.otvType === 'Birim Başına') {
                                                    calculatedNet = ((newGross / (1 + (vatRate + oivR) / 100)) - (otvRate * qty)) / (qty * factor);
                                                } else {
                                                    calculatedNet = newGross / (qty * factor * (1 + (vatRate + oivR) / 100));
                                                }
                                                updateItem('price', calculatedNet);
                                            };

                                            return (
                                                <tr key={it.id || i}>
                                                    <td className="h-14 px-4 text-sm font-semibold text-slate-500">{i + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-col gap-2 min-w-[250px]">
                                                            <select
                                                                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-medium focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none"
                                                                value={it.productId || ''}
                                                                onChange={(e) => {
                                                                    const selectedProduct = products.find(p => String(p.id) === e.target.value);
                                                                    if (selectedProduct) {
                                                                        const rawPrice = priceMap[selectedProduct.id] ?? Number(selectedProduct.price || 0);
                                                                        const vatRate = Number(selectedProduct.salesVat || 20);
                                                                        const oivRate = Number(selectedProduct.salesOiv || 0);
                                                                        const otvType = selectedProduct.otvType || 'Ö.T.V yok';
                                                                        const otvRate = Number(selectedProduct.salesOtv || 0);
                                                                        const effectiveVatOiv = (1 + (vatRate + oivRate) / 100);
                                                                        
                                                                        let netPrice = 0;
                                                                        if (otvType === 'Yüzdesel') {
                                                                            netPrice = rawPrice / ((1 + otvRate / 100) * effectiveVatOiv);
                                                                        } else if (otvType === 'Birim Başına') {
                                                                            netPrice = (rawPrice / effectiveVatOiv) - otvRate;
                                                                        } else {
                                                                            netPrice = rawPrice / effectiveVatOiv;
                                                                        }

                                                                        const currentItems = JSON.parse(JSON.stringify(invoiceItems));
                                                                        currentItems[i] = {
                                                                            ...currentItems[i],
                                                                            productId: selectedProduct.id,
                                                                            name: selectedProduct.name,
                                                                            price: netPrice,
                                                                            vat: Number(selectedProduct.salesVat || 20),
                                                                            otv: Number(selectedProduct.salesOtv || 0),
                                                                            otvCode: selectedProduct.otvCode || '0071',
                                                                            otvType: selectedProduct.otvType || 'Ö.T.V yok',
                                                                            oiv: Number(selectedProduct.salesOiv || 0),
                                                                            discountRate: Number(selectedProduct.campaignDiscountRate || selectedProduct.discountRate || 0),
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
                                                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                                    KDV %{it.vat ?? 20}
                                                                </span>
                                                                {(it.otvType && it.otvType !== 'Ö.T.V yok') && (
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 shadow-sm border border-amber-200 dark:border-amber-500/20">
                                                                        {it.otvType === 'Yüzdesel' ? `ÖTV %${it.otv}` : `ÖTV ${it.otv} ₺`}
                                                                    </span>
                                                                )}
                                                                {(Number(it.oiv || 0) > 0) && (
                                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500 shadow-sm border border-blue-200 dark:border-blue-500/20">
                                                                        ÖİV %{it.oiv}
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
                                                                        className="w-full min-h-[60px] p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] outline-none focus:ring-1 focus:ring-blue-500/30 resize-y"
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
                                                            className="w-[70px] h-9 px-2 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-1 focus:ring-slate-300 ml-auto"
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
                                                                className="w-[100px] h-9 px-2 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-mono font-semibold outline-none focus:ring-1 focus:ring-slate-300"
                                                            />
                                                            <span className="text-xs font-semibold text-slate-500">₺ + KDV</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="relative inline-block ml-auto w-[64px]">
                                                            <input
                                                                type="number"
                                                                value={it.discountRate || 0}
                                                                onChange={(e) => updateItem('discountRate', Number(e.target.value))}
                                                                className="w-full h-9 pl-2 pr-6 text-center bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-[24px] text-sm text-rose-600 dark:text-rose-400 font-semibold outline-none focus:ring-1 focus:ring-rose-300"
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-rose-400 pointer-events-none">%</span>
                                                        </div>
                                                        {discountAmount > 0 && (
                                                            <div className="text-[10px] font-bold text-rose-500 mt-1">-{discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="relative inline-block ml-auto w-[64px]">
                                                            <input
                                                                type="number"
                                                                value={it.vat}
                                                                onChange={(e) => updateItem('vat', Number(e.target.value))}
                                                                className="w-full h-9 pl-2 pr-6 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] text-sm font-semibold outline-none focus:ring-1 focus:ring-slate-300"
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
                                                            className="w-[110px] h-9 px-2 text-right bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-[24px] text-sm font-mono font-bold outline-none ml-auto"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button
                                                            onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i))}
                                                            className="w-8 h-8 flex items-center justify-center rounded-[24px] bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 transition-colors mx-auto"
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
                                {/* Finansal Özet sağ üst alana taşındı */}

                            </div>

                            <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 mt-auto shrink-0">
                                <EnterpriseButton variant="secondary" onClick={() => setInvoiceModalOpen(false)} className="w-32">
                                    İPTAL
                                </EnterpriseButton>
                                <EnterpriseButton
                                    variant="secondary"
                                    disabled={isConverting}
                                    onClick={() => {
                                        const data = {
                                            taxNumber: (document.getElementById('inv_tax_no') as HTMLInputElement).value,
                                            taxOffice: (document.getElementById('inv_tax_office') as HTMLInputElement).value,
                                            address: (document.getElementById('inv_address') as HTMLTextAreaElement).value,
                                            phone: (document.getElementById('inv_phone') as HTMLInputElement).value,
                                            name: (document.getElementById('inv_name') as HTMLInputElement).value,
                                            isFormal: false,
                                            status: 'Proforma',
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
                                        <><div className="w-4 h-4 border-2 border-slate-600 border-t-slate-800 rounded-full animate-spin"></div></>
                                    ) : (
                                        <>PROFORMA OLUŞTUR</>
                                    )}
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
                        </div>
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
                                    className="w-full h-14 rounded-[24px] flex items-center justify-center gap-3 font-semibold text-white bg-green-500 hover:bg-green-600 shadow-sm shadow-green-500/30 transition-all hover:-translate-y-0.5"
                                >
                                    <span className="text-2xl">💬</span> Müşteriye WhatsApp&apos;tan İlet
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
                                        className="w-full h-14 rounded-[24px] flex items-center justify-center gap-3 font-semibold text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/20"
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
                                className="mt-8 w-full p-4 rounded-[24px] font-bold tracking-wide text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 transition-colors"
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
                                <p className="text-[15px] text-amber-700 dark:text-amber-500 font-semibold p-4 bg-amber-50 dark:bg-amber-500/10 rounded-[24px] border border-amber-200 dark:border-amber-500/20">
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
                                    className="p-4 rounded-[24px] text-left flex flex-col gap-1 border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors"
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
                                    className="p-4 rounded-[24px] text-left flex flex-col gap-1 border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
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
                                            type="text"
                                            value={customInstallAmount}
                                            onChange={e => setCustomInstallAmount(formatCurrencyInput(e.target.value))}
                                            className="w-full p-4 rounded-[24px] bg-slate-50 dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-white text-lg font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow pr-10"
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
                                            const parsedAmount = parseCurrencyToFloat(customInstallAmount);
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
                                    <option value="Yüzdesel">🔵 Yüzde Oranlı (%)</option>
                                    <option value="Birim Başına">🟠 Sabit Tutarlı (₺)</option>
                                </EnterpriseSelect>

                                {invoiceItems[taxEditIndex].otvType !== 'Ö.T.V yok' && (
                                    <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
                                        <EnterpriseSelect
                                            label="Ö.T.V KODU (LİSTE)"
                                            value={invoiceItems[taxEditIndex].otvCode || '0071'}
                                            onChange={(e) => {
                                                const newItems = [...invoiceItems];
                                                newItems[taxEditIndex].otvCode = e.target.value;
                                                setInvoiceItems(newItems);
                                            }}
                                        >
                                            <option value="0071">0071 - Petrol ve doğalgaz ürünleri (ÖTV 1. Liste)</option>
                                            <option value="0073">0073 - Motorlu taşıt araçları (ÖTV 2. Liste)</option>
                                            <option value="0074">0074 - Kolalı gazoz, alkollü içecekler (ÖTV 3. Liste)</option>
                                            <option value="0075">0075 - Dayanıklı tüketim ve diğer mallar (ÖTV 4. Liste)</option>
                                            <option value="0076">0076 - Alkollü içecekler (ÖTV 3A Liste)</option>
                                            <option value="0077">0077 - Tütün mamülleri (ÖTV 3B Liste)</option>
                                            <option value="0078">0078 - Kolalı gazozlar (ÖTV 3C Liste)</option>
                                        </EnterpriseSelect>

                                        <EnterpriseInput
                                            label={`BELİRLENEN Ö.T.V ${invoiceItems[taxEditIndex].otvType === 'Yüzdesel' ? 'ORANI (%)' : 'TUTARI (₺)'}`}
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
            {warrantyModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scroll animate-in zoom-in-95 duration-200 shadow-2xl border-blue-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">🛡️</span> Garanti Başlat
                            </h3>
                            <button
                                onClick={() => setWarrantyModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <EnterpriseSelect
                                label="FATURA SEÇİMİ (SATIN ALMA KAYDI)"
                                value={newWarranty.invoiceId}
                                onChange={(e) => setNewWarranty({ ...newWarranty, invoiceId: e.target.value, productId: '', productName: '' })}
                            >
                                <option value="">İlgili faturayı seçiniz...</option>
                                {customerInvoices.map((inv: any) => (
                                    <option key={inv.id} value={inv.id}>{inv.number} - {inv.date} ({inv.total} ₺)</option>
                                ))}
                            </EnterpriseSelect>

                            {newWarranty.invoiceId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <EnterpriseSelect
                                        label="ÜRÜN SEÇİMİ"
                                        value={newWarranty.productId}
                                        onChange={(e) => {
                                            const inv = customerInvoices.find((i: any) => i.id.toString() === newWarranty.invoiceId);
                                            const prodItem = inv?.items.find((p: any) => (p.productId || p.id || '').toString() === e.target.value);
                                            let pName = prodItem?.name || '';
                                            if (!pName && prodItem?.productId) {
                                                const realProd = products.find((p: any) => p.id === prodItem.productId);
                                                if (realProd) pName = realProd.name;
                                            }
                                            setNewWarranty({ ...newWarranty, productId: e.target.value, productName: pName });
                                        }}
                                    >
                                        <option value="">Garanti tanımlanacak ürünü seçin...</option>
                                        {customerInvoices.find((i: any) => i.id.toString() === newWarranty.invoiceId)?.items.map((p: any) => {
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
                                    </EnterpriseSelect>
                                </div>
                            )}

                            <EnterpriseInput
                                label="SERİ NO (KADRO / ŞASİ NO)"
                                placeholder="Örn: CR12345678"
                                value={newWarranty.serialNo}
                                onChange={(e: any) => setNewWarranty({ ...newWarranty, serialNo: e.target.value })}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EnterpriseSelect
                                    label="GARANTİ SÜRESİ"
                                    value={newWarranty.period}
                                    onChange={(e) => setNewWarranty({ ...newWarranty, period: e.target.value })}
                                >
                                    {(warrantyPeriods && warrantyPeriods.length > 0 ? warrantyPeriods : ['6 Ay', '1 Yıl', '2 Yıl', '3 Yıl', '5 Yıl']).map((p: any) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </EnterpriseSelect>

                                <EnterpriseInput
                                    label="BAŞLANGIÇ TARİHİ"
                                    type="date"
                                    value={newWarranty.startDate}
                                    onChange={(e: any) => setNewWarranty({ ...newWarranty, startDate: e.target.value })}
                                />
                            </div>

                            <EnterpriseButton
                                onClick={handleStartWarranty}
                                disabled={!newWarranty.invoiceId || !newWarranty.productId || !newWarranty.serialNo}
                                className="w-full h-14 mt-4 font-bold text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                SİSTEME KAYDET VE BAŞLAT
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>
            )}
\n            {/* CHECK / SENET ADD MODAL */}
            {checkAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-xl animate-in zoom-in-95 duration-200 shadow-2xl border-emerald-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">📑</span> Yeni Evrak Ekle
                            </h3>
                            <button
                                onClick={() => setCheckAddModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-5">
                            <EnterpriseSelect
                                label="EVRAK TÜRÜ"
                                value={newCheckData.type}
                                onChange={(e) => setNewCheckData({ ...newCheckData, type: e.target.value })}
                            >
                                <option value="Alınan Çek">Müşteriden Alınan Çek</option>
                                <option value="Alınan Senet">Müşteriden Alınan Senet</option>
                                <option value="Müşteri Çeki / Cirolu">Müşteri Tarafından Cirolu Çek</option>
                            </EnterpriseSelect>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <EnterpriseInput
                                    label="TUTAR (₺)"
                                    placeholder="0,00"
                                    value={newCheckData.amount}
                                    onChange={(e: any) => setNewCheckData({ ...newCheckData, amount: formatCurrencyInput(e.target.value) })}
                                />
                                <EnterpriseInput
                                    label="VADE TARİHİ"
                                    type="date"
                                    value={newCheckData.dueDate}
                                    onChange={(e: any) => setNewCheckData({ ...newCheckData, dueDate: e.target.value })}
                                />
                            </div>

                            <EnterpriseInput
                                label="BANKA & ŞUBE (Senet ise boş bırakın)"
                                placeholder="Örn: Garanti Bankası / Beşiktaş Şb."
                                value={newCheckData.bank}
                                onChange={(e: any) => setNewCheckData({ ...newCheckData, bank: e.target.value })}
                            />

                            <EnterpriseInput
                                label="EVRAK/SERİ NO"
                                placeholder="Seri veya Fiş Numarası"
                                value={newCheckData.number}
                                onChange={(e: any) => setNewCheckData({ ...newCheckData, number: e.target.value })}
                            />

                            <EnterpriseInput
                                label="AÇIKLAMA (Opsiyonel)"
                                placeholder="Ek detay veya borçlu bilgisi"
                                value={newCheckData.description}
                                onChange={(e: any) => setNewCheckData({ ...newCheckData, description: e.target.value })}
                            />

                            <div className="flex flex-col gap-2 mt-2 p-5 border border-slate-200 dark:border-white/5 rounded-[20px] bg-slate-50 dark:bg-slate-800/30">
                                <label className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-lg">📸</span> EVRAK GÖRSELİ
                                </label>
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    Evrakın ön yüzünün fotoğrafı.
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e: any) => {
                                        if (e.target.files?.[0]) setNewCheckData({ ...newCheckData, file: e.target.files[0] });
                                    }}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 cursor-pointer mt-2"
                                />
                            </div>

                            <EnterpriseButton
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
                                                amount: parseCurrencyToFloat(newCheckData.amount),
                                                customerId: customer.id,
                                                description: newCheckData.description,
                                                branch: 'Merkez'
                                            })
                                        });

                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || "Hata oluştu");
                                        if (data.check?.id && newCheckData.file) {
                                            const formData = new FormData();
                                            formData.append('file', newCheckData.file);
                                            await fetch(`/api/financials/checks/${data.check.id}/image`, { method: 'POST', body: formData });
                                        }

                                        showSuccess("Evrak Kaydedildi", "Yeni çek/senet başarıyla portföye eklendi.");
                                        setCheckAddModalOpen(false);
                                        setNewCheckData({ type: 'Alınan Çek', number: '', bank: '', dueDate: '', amount: '', description: '', branch: 'Merkez', file: null });
                                        router.refresh();
                                    } catch (err: any) {
                                        showError("Hata", err.message);
                                    } finally {
                                        setIsSavingCheck(false);
                                    }
                                }}
                                disabled={isSavingCheck}
                                className="w-full h-14 mt-2 font-bold text-base bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {isSavingCheck ? 'KAYDEDİLİYOR...' : 'ONAYLA VE PORTFÖYE EKLE'}
                            </EnterpriseButton>
                        </div>
                    </EnterpriseCard>
                </div>
            )}
\n            {/* OTP COMPLIANCE MODAL */}
            {otpModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <EnterpriseCard className="w-full max-w-lg animate-in zoom-in-95 duration-200 shadow-2xl border-amber-500/30 text-left">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                <span className="text-2xl">✍️</span> Trust & Compliance
                            </h3>
                            <button
                                onClick={() => setOtpModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed m-0 px-2 lg:px-0">
                                Müşteriye senet onayı için OTP (Tek Kullanımlık Şifre) bağlantısı gönderebilir veya doğrudan senedi yazdırabilirsiniz.
                            </p>
                            
                            <div className="flex items-center gap-4 p-4 rounded-[16px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                <span className="text-3xl shrink-0">🛡️</span>
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-[14px] text-amber-700 dark:text-amber-500">Güvenli E-İmza (OTP)</span>
                                    <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400/80 leading-relaxed">
                                        Sistem alıcının iletişim adresine imza linki iletecektir.
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-2">
                                <button
                                    onClick={async () => {
                                        setIsSendingOtp(true);
                                        try {
                                            const res = await fetch(`/api/documents/senet?action=send-otp&invoiceId=${lastInvoice?.id || ''}`);
                                            const data = await res.json();
                                            if (data.success) {
                                                showSuccess("Başarılı", "Müşteriye bağlantılar iletildi.");
                                                setOtpModalOpen(false);
                                            } else {
                                                showError("Hata", data.error || "Oluşturulamadı.");
                                            }
                                        } catch (err: any) {
                                            showError("Hata", err.message);
                                        } finally {
                                            setIsSendingOtp(false);
                                        }
                                    }}
                                    disabled={isSendingOtp}
                                    className="w-full h-14 rounded-[20px] font-black tracking-wide text-[14px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-amber-500/30 shadow-lg disabled:opacity-70 hover:-translate-y-1 transition-all duration-300 flex justify-center items-center"
                                >
                                    {isSendingOtp ? 'GÖNDERİLİYOR...' : 'SMS & E-POSTA İLE ONAYA SUN'}
                                </button>

                                <button
                                    onClick={() => {
                                        window.open(`/api/documents/senet?action=get-pdf&invoiceId=${lastInvoice?.id || ''}`, '_blank');
                                        setOtpModalOpen(false);
                                    }}
                                    className="w-full h-14 rounded-[20px] font-bold text-[14px] text-slate-600 dark:text-slate-300 bg-transparent border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    🖨️ PDF OLARAK YAZDIR / GÖRÜNTÜLE
                                </button>
                            </div>
                        </div>
                    </EnterpriseCard>
                </div>
            )}\n
        </div >
    );
}
