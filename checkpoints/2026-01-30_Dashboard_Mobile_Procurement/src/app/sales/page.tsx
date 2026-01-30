
"use client";

import { useState, Fragment } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function SalesPage() {
    const { showSuccess, showError, showConfirm, showWarning } = useModal();
    const [activeTab, setActiveTab] = useState('online');

    // REAL DATA
    const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
    const [storeOrders, setStoreOrders] = useState<any[]>([]);
    const [realInvoices, setRealInvoices] = useState<any[]>([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
    const [isLoadingStore, setIsLoadingStore] = useState(false);

    const handleDeleteInvoice = async (id: string) => {
        showConfirm('Fatura Silinecek', 'Bu faturayı silmek istediğinize emin misiniz? Bu işlem bakiye ve stokları GERİ ALMAYABİLİR (Onaylanmış faturalar için manuel kontrol önerilir).', async () => {
            try {
                const res = await fetch(`/api/sales/invoices/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Fatura silindi.');
                    fetchInvoices();
                    if (activeTab === 'store') {
                        // Refresh store tab if we are there
                        fetch('/api/sales/history?source=POS').then(r => r.json()).then(d => {
                            if (d.success) setStoreOrders(d.orders);
                        });
                    }
                } else {
                    showError('Hata', data.error || 'Silinemedi.');
                }
            } catch (e) {
                showError('Hata', 'Bağlantı hatası.');
            }
        });
    };

    const handleDeleteStoreSale = async (id: string) => {
        showConfirm('Satış Silinecek', 'Bu mağaza satışını (POS) tamamen silmek ve stok/kasa/cari hareketlerini GERİ ALMAK istediğinize emin misiniz?', async () => {
            try {
                const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', 'Satış ve tüm etkileri geri alınarak silindi.');
                    // Refresh data
                    const res2 = await fetch('/api/sales/history?source=POS');
                    const data2 = await res2.json();
                    if (data2.success) setStoreOrders(data2.orders);
                } else {
                    showError('Hata', data.error || 'Silinemedi.');
                }
            } catch (e) {
                showError('Hata', 'Bağlantı hatası.');
            }
        });
    };

    // Fetch invoices
    const fetchInvoices = async () => {
        setIsLoadingInvoices(true);
        try {
            const res = await fetch('/api/sales/invoices');
            const data = await res.json();
            if (data.success) setRealInvoices(data.invoices);
        } catch (err) { console.error(err); }
        finally { setIsLoadingInvoices(false); }
    };

    useEffect(() => {
        if (activeTab === 'invoices') fetchInvoices();
    }, [activeTab]);

    const handleApproveInvoice = async (id: string) => {
        showConfirm('Onay', 'Bu faturayı resmileştirmek istiyor musunuz? Stoklar düşülecek ve cari bakiye güncellenecektir.', async () => {
            try {
                const res = await fetch(`/api/sales/invoices/${id}/approve`, { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', '✅ Fatura resmileştirildi.');
                    fetchInvoices();
                } else { showError('Hata', '❌ Hata: ' + data.error); }
            } catch (e) { showError('Hata', 'Hata oluştu.'); }
        });
    };

    // Fetch online orders
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Pazaryerinden gelen ve veritabanına kaydedilen siparişleri çek (status=Yeni vb.)
                const res = await fetch('/api/orders/pending');
                const data = await res.json();
                if (data.success && Array.isArray(data.orders)) {
                    // API'den gelen veriyi güvenli hale getir
                    const safeOrders = data.orders.map((o: any) => ({
                        ...o,
                        items: typeof o.items === 'string' ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : [])
                    }));
                    setOnlineOrders(safeOrders);
                }
            } catch (err) {
                console.error("Sipariş getirme hatası", err);
            }
        };

        fetchOrders();
        // Her 30 sn'de bir yenile
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch store orders AND invoices when tab is active
    useEffect(() => {
        if (activeTab === 'store') {
            setIsLoadingStore(true);

            Promise.all([
                fetch('/api/sales/history?source=POS').then(r => r.json()),
                fetch('/api/sales/invoices').then(r => r.json())
            ]).then(([ordersData, invoicesData]) => {
                let combined: any[] = [];

                // 1. Orders (Fiş/Nakit)
                if (ordersData.success) {
                    const safeOrders = ordersData.orders.map((o: any) => ({
                        ...o,
                        sourceType: 'ORDER',
                        items: typeof o.items === 'string' ? JSON.parse(o.items) : (Array.isArray(o.items) ? o.items : [])
                    }));
                    combined = [...combined, ...safeOrders];
                }

                // 2. Invoices (Cari/Fatura) -> Convert to Order format
                if (invoicesData.success) {
                    const safeInvoices = invoicesData.invoices.map((inv: any) => ({
                        id: inv.id,
                        orderNumber: inv.invoiceNo,
                        orderDate: inv.createdAt, // CreatedAt for sorting
                        customerName: inv.customer?.name || 'Bilinmeyen Cari',
                        totalAmount: inv.totalAmount,
                        status: inv.status,
                        sourceType: 'INVOICE',
                        rawData: { paymentMode: 'account' },
                        items: typeof inv.items === 'string' ? JSON.parse(inv.items) : (Array.isArray(inv.items) ? inv.items : [])
                    }));
                    combined = [...combined, ...safeInvoices];
                }

                // Sort by date descending
                combined.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
                setStoreOrders(combined);
            })
                .catch(err => console.error("Mağaza satışları hatası", err))
                .finally(() => setIsLoadingStore(false));
        }
    }, [activeTab]);

    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, NEW, SHIPPED, COMPLETED
    const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH, 3MONTHS, CUSTOM
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Turnover Filter States
    const [turnoverFilter, setTurnoverFilter] = useState('TODAY');
    const [turnoverCustomStart, setTurnoverCustomStart] = useState('');
    const [turnoverCustomEnd, setTurnoverCustomEnd] = useState('');

    const calculateTurnover = (orders: any[]) => {
        return orders.filter(o => {
            const d = new Date(o.orderDate || o.date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (turnoverFilter === 'TODAY') {
                return d.toDateString() === now.toDateString();
            } else if (turnoverFilter === 'WEEK') {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return d >= oneWeekAgo;
            } else if (turnoverFilter === 'MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return d >= startOfMonth;
            } else if (turnoverFilter === 'CUSTOM' && turnoverCustomStart && turnoverCustomEnd) {
                const start = new Date(turnoverCustomStart);
                const end = new Date(turnoverCustomEnd);
                end.setHours(23, 59, 59);
                return d >= start && d <= end;
            }
            return false;
        }).reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
    };

    const getTurnoverTitle = () => {
        switch (turnoverFilter) {
            case 'TODAY': return 'BUGÜNKÜ CİRO';
            case 'WEEK': return 'SON 1 HAFTA CİRO';
            case 'MONTH': return 'BU AY CİRO';
            case 'CUSTOM': return 'ÖZEL TARİH CİRO';
            default: return 'CİRO';
        }
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    // Tahsilat (Collection)
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isCollecting, setIsCollecting] = useState(false);

    const { products: mockInventory, processSale, currentUser, hasPermission } = useApp();

    // Yetki kontrolünü esnetelim (Debug için)
    // const filteredOnlineOrders = hasPermission('ecommerce_view') ? onlineOrders : [];
    const filteredOnlineOrders = onlineOrders.filter(order => {
        // Statü Filtresi
        let statusMatch = true;
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'NEW') statusMatch = ['Yeni', 'Created', 'Picking', 'WaitingForApproval'].includes(order.status);
            else if (statusFilter === 'SHIPPED') statusMatch = ['Kargolandı', 'Shipped', 'Hazırlanıyor'].includes(order.status);
            else if (statusFilter === 'COMPLETED') statusMatch = ['Tamamlandı', 'Delivered', 'Cancelled', 'Faturalandırıldı'].includes(order.status);
        }

        // Tarih Filtresi
        let dateMatch = true;
        if (dateFilter !== 'ALL') {
            // order.orderDate veya order.date alanını kullan
            const orderDate = new Date(order.orderDate || order.date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Saat 00:00:00

            if (dateFilter === 'TODAY') {
                dateMatch = orderDate >= today;
            } else if (dateFilter === 'WEEK') {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                dateMatch = orderDate >= oneWeekAgo;
            } else if (dateFilter === 'MONTH') {
                const oneMonthAgo = new Date(today);
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                dateMatch = orderDate >= oneMonthAgo;
            } else if (dateFilter === '3MONTHS') {
                const threeMonthsAgo = new Date(today);
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                dateMatch = orderDate >= threeMonthsAgo;
            } else if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59); // Bitiş gününün sonu
                dateMatch = orderDate >= start && orderDate <= end;
            }
        }

        return statusMatch && dateMatch;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredOnlineOrders.length / ordersPerPage);
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filteredOnlineOrders.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, dateFilter, customStartDate, customEndDate]);

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [mappedItems, setMappedItems] = useState<{ [key: string]: number }>({}); // orderItemName -> inventoryId

    // Store Sales Expansion
    const [expandedStoreOrderId, setExpandedStoreOrderId] = useState<string | null>(null);
    const toggleStoreExpand = (id: string) => {
        setExpandedStoreOrderId(expandedStoreOrderId === id ? null : id);
    };

    const invoices = [
        { id: 'FAT-2026-001', customer: 'Ahmet Yılmaz', type: 'e-Arşiv', total: 3200, status: 'GİB Onaylı' },
    ];

    const handlePrepare = (id: string) => {
        setOnlineOrders(onlineOrders.map(order => {
            if (order.id === id) {
                if (order.status === 'Yeni') return { ...order, status: 'Hazırlanıyor' };
                if (order.status === 'Hazırlanıyor') return { ...order, status: 'Kargolandı' };
            }
            return order;
        }));
    };

    // --- MAPPING LOGIC ---
    const [isLoadingMapping, setIsLoadingMapping] = useState(false);

    // Check mapping when order is selected
    useEffect(() => {
        if (!selectedOrder) return;

        const checkMapping = async () => {
            setIsLoadingMapping(true);
            try {
                // Get item codes from order
                // IMPORTANT: We need item codes. If item doesn't have code, fallback to name or ask user
                const payloadItems = selectedOrder.items.map((i: any) => ({
                    code: i.code || i.barcode || i.name, // Fallback to name as code if others missing (risky but needed)
                    name: i.name
                }));

                const res = await fetch('/api/integrations/marketplace/check-mapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        marketplace: selectedOrder.marketplace,
                        items: payloadItems
                    })
                });

                const data = await res.json();

                if (data.success) {
                    const newMappedItems: any = {};

                    // Process results
                    Object.keys(data.mappings).forEach(key => {
                        const map = data.mappings[key];
                        if (map.isMapped && map.internalProduct) {
                            // Find matching item in order to key by name (as existing logic uses name)
                            // Ideally we should use ID or Code, but UI uses name heavily.
                            // Let's map by item name for UI consistency
                            const item = selectedOrder.items.find((i: any) => (i.code || i.barcode || i.name) === key);
                            if (item) {
                                newMappedItems[item.name] = map.internalProduct.id;
                            }
                        }
                    });

                    setMappedItems(newMappedItems);
                }
            } catch (error) {
                console.error("Mapping check failed", error);
            } finally {
                setIsLoadingMapping(false);
            }
        };

        checkMapping();
    }, [selectedOrder]);

    const finalizeInvoice = async () => {
        setIsLoadingMapping(true);
        try {
            // 1. Save New Mappings
            // Identify which items were manually mapped by user vs auto-mapped?
            // Actually 'upsert' in backend handles it. We can just send all current mappings.

            const mappingPayload = selectedOrder.items.map((item: any) => ({
                marketplaceCode: item.code || item.barcode || item.name,
                productId: mappedItems[item.name]?.toString()
            })).filter((m: any) => m.productId); // Only send mapped ones

            if (mappingPayload.length > 0) {
                await fetch('/api/integrations/marketplace/save-mapping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        marketplace: selectedOrder.marketplace,
                        mappings: mappingPayload
                    })
                });
            }

            // 2. Process Sale & Invoice
            const saleItems = selectedOrder.items.map((item: any) => ({
                productId: mappedItems[item.name],
                qty: item.qty || 1
            }));

            await processSale({
                items: saleItems,
                total: selectedOrder.totalAmount || selectedOrder.total,
                kasaId: 1, // Varsayılan Merkez Kasa
                description: `Sipariş Faturalandırma: ${selectedOrder.orderNumber} - ${selectedOrder.marketplace}`
            });

            // Update local state
            setOnlineOrders(onlineOrders.map(o => o.id === selectedOrder.id ? { ...o, status: 'Faturalandırıldı' } : o));

            showSuccess('Fatura Oluşturuldu', '✅ FATURA OLUŞTURULDU!\n\nStoklar eşleştirildi ve güncellendi. Gelecek siparişlerde bu ürünler otomatik tanınacak.');
            setSelectedOrder(null);
            setMappedItems({});

        } catch (error: any) {
            showError("İşlem Başarısız", "Hata: " + error.message);
        } finally {
            setIsLoadingMapping(false);
            // ... (existing helper functions)



        }
    };

    // Tahsilat fonksiyonları
    const handleCollectSingle = async (orderId: string) => {
        showConfirm('Tahsilat Onayı', 'Bu siparişin tahsilatını yapmak istediğinizden emin misiniz?', async () => {
            setIsCollecting(true);
            try {
                const res = await fetch('/api/orders/collect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderIds: [orderId] })
                });

                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', `✅ Tahsilat başarılı!\n\n${data.message}`);
                    // Siparişleri yenile
                    const fetchRes = await fetch('/api/orders/pending');
                    const fetchData = await fetchRes.json();
                    if (fetchData.success) {
                        setOnlineOrders(fetchData.orders);
                    }
                } else {
                    showError('Hata', `❌ Hata: ${data.error}`);
                }
            } catch (error: any) {
                showError('Hata', `❌ Tahsilat hatası: ${error.message}`);
            } finally {
                setIsCollecting(false);
            }
        });
    };

    const handleCollectBulk = async () => {
        if (!hasPermission('finance_collect')) {
            showError('Yetkisiz İşlem', '⛔ YETKİSİZ İŞLEM!\n\nToplu tahsilat yapma yetkiniz bulunmamaktadır.');
            return;
        }

        if (selectedOrders.length === 0) {
            showWarning('Uyarı', 'Lütfen en az bir sipariş seçin!');
            return;
        }

        showConfirm('Toplu Tahsilat', `${selectedOrders.length} adet siparişin toplu tahsilatını yapmak istediğinizden emin misiniz?`, async () => {
            setIsCollecting(true);
            try {
                const res = await fetch('/api/orders/collect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderIds: selectedOrders })
                });

                const data = await res.json();
                if (data.success) {
                    showSuccess('Başarılı', `✅ Toplu tahsilat başarılı!\n\n${data.message}`);
                    setSelectedOrders([]);
                    // Siparişleri yenile
                    const fetchRes = await fetch('/api/orders/pending');
                    const fetchData = await fetchRes.json();
                    if (fetchData.success) {
                        setOnlineOrders(fetchData.orders);
                    }
                } else {
                    showError('Hata', `❌ Hata: ${data.error}`);
                }
            } catch (error: any) {
                showError('Hata', `❌ Toplu tahsilat hatası: ${error.message}`);
            } finally {
                setIsCollecting(false);
            }
        });
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === paginatedOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(paginatedOrders.map(o => o.id));
        }
    };

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        if (expandedOrderId === id) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(id);
        }
    };


    // Kargo özellikleri kaldırıldı - sadece faturalandırma kaldı

    const [isLoadingLabel, setIsLoadingLabel] = useState<string | null>(null);

    const handlePrintLabel = async (orderId: string, marketplace: string) => {
        console.log('🖨️ [FRONTEND] Etiket butonu tıklandı:', { orderId, marketplace });
        setIsLoadingLabel(orderId);

        try {
            if (marketplace !== 'Trendyol') {
                showError('Hata', `❌ Hata: Şu anda sadece Trendyol etiketleri destekleniyor.\n\nPlatform: ${marketplace}`);
                setIsLoadingLabel(null);
                return;
            }

            const apiUrl = `/api/orders/get-label?orderId=${orderId}&marketplace=${marketplace}`;
            console.log('📡 [FRONTEND] API isteği gönderiliyor:', apiUrl);

            const res = await fetch(apiUrl);
            console.log('📡 [FRONTEND] HTTP Status:', res.status, res.statusText);

            if (!res.ok) {
                let errorMessage = `Sunucu hatası (${res.status})`;
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.error || errorMessage;
                    console.error('❌ [FRONTEND] API Error:', errorData);
                } catch {
                    const errorText = await res.text();
                    console.error('❌ [FRONTEND] HTTP Error Text:', errorText);
                }
                showError('Etiket Alınamadı', `❌ Etiket alınamadı!\n\n${errorMessage}\n\nLütfen:\n1. Trendyol entegrasyonunun aktif olduğundan emin olun\n2. API bilgilerinin doğru girildiğini kontrol edin\n3. Siparişin Trendyol'da paketlenmiş olduğunu doğrulayın`);
                setIsLoadingLabel(null);
                return;
            }

            const data = await res.json();
            console.log('📦 [FRONTEND] API Yanıtı:', {
                success: data.success,
                hasContent: !!data.content,
                contentLength: data.content?.length || 0,
                format: data.format,
                error: data.error
            });

            if (data.success && data.content) {
                console.log('✅ [FRONTEND] Etiket verisi alındı, PDF oluşturuluyor...');
                try {
                    // Base64 decode
                    const byteCharacters = atob(data.content);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    console.log('📦 [FRONTEND] Blob oluşturuldu, boyut:', blob.size, 'bytes');

                    // PDF'i yeni sekmede aç
                    const url = window.URL.createObjectURL(blob);
                    const newWindow = window.open(url, '_blank');

                    if (!newWindow) {
                        showWarning('Popup Engellendi', '⚠️ Pop-up engelleyici PDF\'i engelledi!\n\nLütfen pop-up engelleyiciyi devre dışı bırakın.');
                    } else {
                        console.log('✅ [FRONTEND] Etiket PDF yeni sekmede açıldı!');
                    }

                    // Biraz bekle ve temizle
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                    }, 2000);

                } catch (decodeError: any) {
                    console.error('❌ [FRONTEND] Base64 decode hatası:', decodeError);
                    showError('Hata', `❌ Etiket decode edilemedi!\n\nHata: ${decodeError.message}\n\nFormat hatası olabilir.`);
                }
            } else {
                // Eğer API'den gelmediyse ve link varsa eski yöntemi dene (fallback)
                const order = onlineOrders.find(o => o.id === orderId);
                if (order?.cargoTrackingLink) {
                    console.log('📎 [FRONTEND] Fallback: cargoTrackingLink açılıyor');
                    window.open(order.cargoTrackingLink, '_blank');
                } else {
                    console.error('❌ [FRONTEND] Etiket alınamadı:', data.error);
                    showError('Etiket Alınamadı', `❌ Etiket alınamadı!\n\n${data.error || 'Sipariş henüz kargolanmamış olabilir.'}\n\nLütfen:\n1. Siparişin Trendyol'da onaylandığından emin olun\n2. Kargo firması seçilmiş olmalı\n3. Sipariş paketlenmiş durumda olmalı`);
                }
            }
        } catch (error: any) {
            console.error('❌❌❌ [FRONTEND] FATAL ERROR:', error);
            console.error('Error stack:', error.stack);
            showError('Kritik Hata', `❌ Beklenmeyen bir hata oluştu!\n\nHata: ${error.message}\n\nLütfen tarayıcı konsolunu kontrol edin (F12).`);
        } finally {
            setIsLoadingLabel(null);
        }
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">Satış Yönetimi</h1>
                    <p className="text-muted">E-Ticaret, Mağaza Satışları ve Faturalar</p>
                </div>
            </header>

            <div className="flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '8px' }}>
                <button onClick={() => setActiveTab('online')} style={{ padding: '12px 24px', background: activeTab === 'online' ? 'var(--bg-hover)' : 'transparent', border: 'none', color: 'white', borderBottom: activeTab === 'online' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>E-Ticaret</button>
                <button onClick={() => setActiveTab('store')} style={{ padding: '12px 24px', background: activeTab === 'store' ? 'var(--bg-hover)' : 'transparent', border: 'none', color: 'white', borderBottom: activeTab === 'store' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Mağaza Satışları</button>
                <button onClick={() => setActiveTab('invoices')} style={{ padding: '12px 24px', background: activeTab === 'invoices' ? 'var(--bg-hover)' : 'transparent', border: 'none', color: 'white', borderBottom: activeTab === 'invoices' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}>Faturalar</button>
            </div>

            <div className="card glass">
                {/* ONLINE ORDERS */}
                {activeTab === 'online' && (
                    <div>
                        {/* Stats Summary */}
                        <div className="grid-cols-4" style={{ marginBottom: '32px', gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="card glass">
                                <div className="text-muted" style={{ fontSize: '12px' }}>BEKLEYEN SİPARİŞ</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>
                                    {onlineOrders.filter(o => ['Yeni', 'Hazırlanıyor', 'WaitingForApproval', 'Picking'].includes(o.status)).length} Adet
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Hazırlanması gereken</div>
                            </div>
                            <div className="card glass" style={{ position: 'relative' }}>
                                <div className="flex-between">
                                    <div className="text-muted" style={{ fontSize: '12px' }}>{getTurnoverTitle()}</div>
                                    <select
                                        value={turnoverFilter}
                                        onChange={(e) => setTurnoverFilter(e.target.value)}
                                        style={{ fontSize: '10px', padding: '2px', background: 'var(--bg-deep)', color: 'white', border: 'none', borderRadius: '4px' }}
                                    >
                                        <option value="TODAY">Bugün</option>
                                        <option value="WEEK">1 Hafta</option>
                                        <option value="MONTH">Bu Ay</option>
                                        <option value="CUSTOM">Özel</option>
                                    </select>
                                </div>
                                {turnoverFilter === 'CUSTOM' && (
                                    <div className="flex-center gap-1 mt-1" style={{ fontSize: '10px' }}>
                                        <input type="date" value={turnoverCustomStart} onChange={e => setTurnoverCustomStart(e.target.value)} style={{ padding: '2px', width: '80px', background: 'var(--bg-deep)', color: 'white', border: 'none' }} />
                                        <span>-</span>
                                        <input type="date" value={turnoverCustomEnd} onChange={e => setTurnoverCustomEnd(e.target.value)} style={{ padding: '2px', width: '80px', background: 'var(--bg-deep)', color: 'white', border: 'none' }} />
                                    </div>
                                )}

                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)', marginTop: '8px' }}>
                                    ₺ {calculateTurnover(onlineOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Seçili dönem cirosu</div>
                            </div>
                            <div className="card glass">
                                <div className="text-muted" style={{ fontSize: '12px' }}>STOK HATA ORANI</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>%0.1</div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Senkronizasyon stabil</div>
                            </div>
                        </div>

                        <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                            <div className="flex-center gap-4">
                                <h3 className="text-gradient">E-Ticaret Siparişleri</h3>
                                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--primary)', color: 'white' }}>LIVE v1.4</span>
                                {selectedOrders.length > 0 && (
                                    <button
                                        onClick={handleCollectBulk}
                                        className="btn btn-success"
                                        style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        disabled={isCollecting}
                                    >
                                        <span>💰 Seçilenleri Tahsil Et ({selectedOrders.length})</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                                {/* Status Filters */}
                                <div className="flex-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                                    <button onClick={() => setStatusFilter('ALL')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'ALL' ? 'var(--primary)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Tümü</button>
                                    <button onClick={() => setStatusFilter('NEW')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'NEW' ? 'var(--primary)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Yeni</button>
                                    <button onClick={() => setStatusFilter('SHIPPED')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'SHIPPED' ? '#F59E0B' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Kargolandı</button>
                                    <button onClick={() => setStatusFilter('COMPLETED')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'COMPLETED' ? 'var(--success)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Tamamlandı</button>
                                </div>

                                {/* Date Filters */}
                                <div className="flex-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                                    <button onClick={() => setDateFilter('ALL')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'ALL' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'ALL' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>Tüm Zamanlar</button>
                                    <button onClick={() => setDateFilter('TODAY')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'TODAY' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'TODAY' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>Bugün</button>
                                    <button onClick={() => setDateFilter('WEEK')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'WEEK' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'WEEK' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>1 Hafta</button>
                                    <button onClick={() => setDateFilter('MONTH')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'MONTH' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'MONTH' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>1 Ay</button>
                                    <button onClick={() => setDateFilter('3MONTHS')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === '3MONTHS' ? 'var(--secondary)' : 'transparent', color: dateFilter === '3MONTHS' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>3 Ay</button>
                                    <button onClick={() => setDateFilter('CUSTOM')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'CUSTOM' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'CUSTOM' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>Özel</button>
                                </div>

                                {dateFilter === 'CUSTOM' && (
                                    <div className="flex-center gap-2" style={{ marginTop: '4px' }}>
                                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white', fontSize: '12px' }} />
                                        <span className="text-muted">-</span>
                                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white', fontSize: '12px' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {filteredOnlineOrders.length === 0 ? (
                            <div className="text-muted text-center py-8">
                                Bu filtreye uygun sipariş bulunamadı.
                            </div>
                        ) : (
                            <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead className="text-muted" style={{ fontSize: '12px' }}>
                                    <tr>
                                        <th style={{ padding: '12px', width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={paginatedOrders.length > 0 && selectedOrders.length === paginatedOrders.length}
                                                onChange={toggleSelectAll}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </th>
                                        <th style={{ padding: '12px' }}>Sipariş No</th>
                                        <th>Platform</th>
                                        <th>Müşteri</th>
                                        <th>Tutar</th>
                                        <th>Durum</th>
                                        <th>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.map(o => {
                                        const isExpanded = expandedOrderId === o.id;
                                        return (
                                            <Fragment key={o.id}>
                                                <tr style={{ borderTop: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }} onClick={() => toggleExpand(o.id)}>
                                                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrders.includes(o.id)}
                                                            onChange={() => toggleOrderSelection(o.id)}
                                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 'bold' }}>{o.orderNumber || o.id}</td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                                                            border: '1px solid var(--border-light)',
                                                            color: o.marketplace === 'Trendyol' ? '#F27A1A' :
                                                                o.marketplace === 'N11' ? '#5E17EB' :
                                                                    o.marketplace === 'Hepsiburada' ? '#FF6000' :
                                                                        'var(--secondary)'
                                                        }}>
                                                            {o.marketplace}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>{o.customerName}</div>
                                                        <div className="text-muted" style={{ fontSize: '11px' }}>{new Date(o.orderDate || o.date).toLocaleDateString('tr-TR')}</div>
                                                    </td>
                                                    <td style={{ fontWeight: 'bold' }}>{parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {o.currency}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                            background: ['Yeni', 'Created'].includes(o.status) ? 'var(--primary)' : ['Hazırlanıyor', 'Picking', 'Shipped', 'Kargolandı'].includes(o.status) ? '#F59E0B' : ['Faturalandırıldı', 'Tamamlandı'].includes(o.status) ? 'var(--success)' : 'var(--bg-hover)',
                                                            color: 'white'
                                                        }}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {['Faturalandırıldı', 'Delivered', 'Cancelled'].includes(o.status) ? (
                                                            <span style={{ color: 'var(--success)', fontSize: '12px' }}>✅ Tamamlandı</span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                                                                    className="btn btn-primary"
                                                                    style={{ fontSize: '11px', padding: '6px 12px' }}
                                                                    title="Faturalandır"
                                                                >
                                                                    📄 Faturalandır
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className="btn btn-ghost"
                                                            style={{ fontSize: '12px', padding: '4px 8px' }}
                                                        >
                                                            {isExpanded ? '▲' : '▼'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {
                                                    isExpanded && (
                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                                            <td colSpan={6} style={{ padding: '0 20px 20px 20px' }}>
                                                                <div style={{ padding: '20px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                                                    <div className="flex-between mb-4" style={{ alignItems: 'center' }}>
                                                                        <h4 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', margin: 0 }}>📦 Sipariş Detayı</h4>
                                                                    </div>
                                                                    <table style={{ width: '100%', fontSize: '13px', textAlign: 'left' }}>
                                                                        <thead style={{ color: 'var(--text-muted)' }}>
                                                                            <tr>
                                                                                <th style={{ paddingBottom: '8px' }}>Ürün Adı</th>
                                                                                <th>Adet</th>
                                                                                <th>Birim Fiyat</th>
                                                                                <th style={{ textAlign: 'right' }}>Tutar (KDV Dahil)</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {o.items && o.items.map((item: any, idx: number) => (
                                                                                <tr key={idx} style={{ borderTop: '1px solid var(--border-light)' }}>
                                                                                    <td style={{ padding: '8px 0' }}>{item.name || item.productName}</td>
                                                                                    <td>{item.qty || item.quantity}</td>
                                                                                    <td>
                                                                                        {item.unitPrice ? item.unitPrice.toFixed(2) :
                                                                                            item.price ? item.price.toFixed(2) : '0.00'} ₺
                                                                                    </td>
                                                                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                                                        {item.total ? item.total.toFixed(2) :
                                                                                            (item.price && item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'} ₺
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                    {(!o.items || o.items.length === 0) && (
                                                                        <div className="text-muted text-center" style={{ fontSize: '11px', padding: '10px' }}>Ürün detayı bulunamadı.</div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {/* Pagination */}
                        {filteredOnlineOrders.length > 0 && (
                            <div className="flex-between mt-4" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                    Toplam {filteredOnlineOrders.length} sipariş, {currentPage}. sayfa (Toplam {totalPages})
                                </div>
                                <div className="flex-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="btn btn-outline"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                    >
                                        &lt; Önceki
                                    </button>
                                    <span className="text-muted" style={{ fontSize: '12px' }}>
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-outline"
                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                    >
                                        Sonraki &gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }

                {/* INVOICES */}
                {activeTab === 'invoices' && (
                    <div>
                        <div className="flex-between mb-4">
                            <h3>📑 Kesilen Faturalar (Cariler)</h3>
                            <button onClick={fetchInvoices} className="btn btn-outline" style={{ fontSize: '12px' }}>🔄 Yenile</button>
                        </div>

                        {isLoadingInvoices ? <p>Yükleniyor...</p> : (
                            <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead className="text-muted" style={{ fontSize: '12px' }}>
                                    <tr>
                                        <th style={{ padding: '12px' }}>Fatura No</th>
                                        <th>Cari</th>
                                        <th>Tarih</th>
                                        <th>Tutar</th>
                                        <th>Durum</th>
                                        <th style={{ textAlign: 'center' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {realInvoices.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }} className="text-muted">Fatura bulunamadı.</td></tr>
                                    ) : realInvoices.map(inv => {
                                        const isExpanded = expandedOrderId === inv.id;
                                        return (
                                            <Fragment key={inv.id}>
                                                <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }} onClick={() => toggleExpand(inv.id)}>
                                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{inv.invoiceNo}</td>
                                                    <td>{inv.customer?.name}</td>
                                                    <td style={{ fontSize: '12px' }}>{new Date(inv.invoiceDate).toLocaleDateString('tr-TR')}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{inv.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                                            background: inv.isFormal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                            color: inv.isFormal ? 'var(--success)' : 'var(--warning)',
                                                            border: `1px solid ${inv.isFormal ? 'var(--success)' : 'var(--warning)'}`
                                                        }}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className="flex-center gap-2" onClick={e => e.stopPropagation()}>
                                                            {!inv.isFormal && (
                                                                <button
                                                                    onClick={() => handleApproveInvoice(inv.id)}
                                                                    className="btn btn-primary"
                                                                    style={{ fontSize: '11px', padding: '6px 12px', background: 'var(--success)', border: 'none' }}
                                                                >
                                                                    ✅ Onayla
                                                                </button>
                                                            )}
                                                            <button className="btn btn-outline" style={{ fontSize: '11px', padding: '6px 12px' }}>İndir</button>
                                                            <button onClick={() => handleDeleteInvoice(inv.id)} className="btn btn-outline" style={{ fontSize: '11px', padding: '6px 12px', border: '1px solid #ff4444', color: '#ff4444' }}>Sil</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                        <td colSpan={6} style={{ padding: '20px' }}>
                                                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                                                                <div className="flex-between mb-3">
                                                                    <h5 className="m-0">Fatura İçeriği</h5>
                                                                    <button onClick={() => alert('Düzenleme yakında eklenecek')} className="btn btn-outline btn-sm" style={{ fontSize: '11px' }}>✏️ İçeriği Düzenle</button>
                                                                </div>
                                                                <table style={{ width: '100%', fontSize: '13px' }}>
                                                                    <thead className="text-muted">
                                                                        <tr><th>Ürün</th><th>Miktar</th><th>Birim Fiyat</th><th style={{ textAlign: 'right' }}>Toplam</th></tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(inv.items as any[]).map((item, idx) => (
                                                                            <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                                <td style={{ padding: '8px 0' }}>{item.name}</td>
                                                                                <td>{item.qty}</td>
                                                                                <td style={{ textAlign: 'right' }}>{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                                <td style={{ textAlign: 'right' }}>{(item.qty * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                <div className="flex-end mt-4" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                                    TOPLAM: {inv.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* STORE SALES */}
                {
                    activeTab === 'store' && (
                        <div>
                            <div className="flex-between mb-4">
                                <h3>Mağaza Satış Geçmişi (POS)</h3>
                                <button onClick={() => {
                                    setIsLoadingStore(true);
                                    fetch('/api/sales/history?source=POS').then(r => r.json()).then(d => {
                                        if (d.success) setStoreOrders(d.orders);
                                        setIsLoadingStore(false);
                                    });
                                }} className="btn btn-outline" style={{ fontSize: '12px' }}>🔄 Yenile</button>
                            </div>

                            {/* Store Stats Summary */}
                            <div className="grid-cols-4" style={{ marginBottom: '32px', gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                <div className="card glass">
                                    <div className="text-muted" style={{ fontSize: '12px' }}>TOPLAM İŞLEM</div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>
                                        {storeOrders.length} Adet
                                    </div>
                                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Tüm zamanlar</div>
                                </div>
                                <div className="card glass" style={{ position: 'relative' }}>
                                    <div className="flex-between">
                                        <div className="text-muted" style={{ fontSize: '12px' }}>{getTurnoverTitle()}</div>
                                        <select
                                            value={turnoverFilter}
                                            onChange={(e) => setTurnoverFilter(e.target.value)}
                                            style={{ fontSize: '10px', padding: '2px', background: 'var(--bg-deep)', color: 'white', border: 'none', borderRadius: '4px' }}
                                        >
                                            <option value="TODAY">Bugün</option>
                                            <option value="WEEK">1 Hafta</option>
                                            <option value="MONTH">Bu Ay</option>
                                            <option value="CUSTOM">Özel</option>
                                        </select>
                                    </div>
                                    {turnoverFilter === 'CUSTOM' && (
                                        <div className="flex-center gap-1 mt-1" style={{ fontSize: '10px' }}>
                                            <input type="date" value={turnoverCustomStart} onChange={e => setTurnoverCustomStart(e.target.value)} style={{ padding: '2px', width: '80px', background: 'var(--bg-deep)', color: 'white', border: 'none' }} />
                                            <span>-</span>
                                            <input type="date" value={turnoverCustomEnd} onChange={e => setTurnoverCustomEnd(e.target.value)} style={{ padding: '2px', width: '80px', background: 'var(--bg-deep)', color: 'white', border: 'none' }} />
                                        </div>
                                    )}

                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)', marginTop: '8px' }}>
                                        ₺ {calculateTurnover(storeOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Mağaza cirosu</div>
                                </div>
                                <div className="card glass">
                                    <div className="text-muted" style={{ fontSize: '12px' }}>ORTALAMA SEPET</div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
                                        ₺ {storeOrders.length > 0 ? (storeOrders.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0) / storeOrders.length).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                                    </div>
                                    <div style={{ fontSize: '12px', marginTop: '4px' }}>İşlem başına</div>
                                </div>
                            </div>

                            {isLoadingStore ? (
                                <p className="text-muted mt-4">Yükleniyor...</p>
                            ) : storeOrders.length === 0 ? (
                                <p className="text-muted mt-4">Henüz kayıtlı mağaza satışı bulunmuyor.</p>
                            ) : (
                                <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead className="text-muted" style={{ fontSize: '12px' }}>
                                        <tr>
                                            <th style={{ padding: '12px' }}>Sipariş No</th>
                                            <th>Tarih</th>
                                            <th>Müşteri</th>
                                            <th>Tutar</th>
                                            <th>Ödeme</th>
                                            <th>Durum</th>
                                            <th style={{ textAlign: 'center' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {storeOrders.map(o => {
                                            const isExpanded = expandedStoreOrderId === o.id;
                                            return (
                                                <Fragment key={o.id}>
                                                    <tr
                                                        style={{ borderTop: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                                        onClick={() => toggleStoreExpand(o.id)}
                                                    >
                                                        <td style={{ padding: '16px' }}>{o.orderNumber || o.id.substring(0, 8)}</td>
                                                        <td>{new Date(o.orderDate || o.date).toLocaleString('tr-TR')}</td>
                                                        <td>{o.customerName || 'Davetsiz Müşteri'}</td>
                                                        <td style={{ fontWeight: 'bold' }}>{parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {o.currency || 'TL'}</td>
                                                        <td>
                                                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                                {o.sourceType === 'INVOICE' || o.rawData?.paymentMode === 'account' ? 'Cari / Veresiye' : (o.rawData?.paymentMode === 'cash' ? 'Nakit' : o.rawData?.paymentMode === 'credit_card' ? 'Kredi Kartı' : o.rawData?.paymentMode === 'bank_transfer' ? 'Havale/EFT' : (o.rawData?.paymentMode || 'Nakit').toUpperCase())}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                                background: 'var(--success)', color: 'white'
                                                            }}>
                                                                {o.status || 'Tamamlandı'}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div className="flex-center gap-2" onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => toggleStoreExpand(o.id)} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
                                                                    {isExpanded ? '▲' : 'v'}
                                                                </button>
                                                                <button onClick={() => handleDeleteStoreSale(o.id)} className="btn btn-outline" style={{ fontSize: '11px', padding: '6px 10px', color: '#ff4444', borderColor: '#ff4444' }}>Sil</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                                            <td colSpan={7} style={{ padding: '0 20px 20px 20px' }}>
                                                                <div style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>🛍️ Satış Detayları</h4>
                                                                    <table style={{ width: '100%', fontSize: '13px' }}>
                                                                        <thead className="text-muted">
                                                                            <tr>
                                                                                <th align="left">Ürün</th>
                                                                                <th align="center">Adet</th>
                                                                                <th align="right">Birim Fiyat</th>
                                                                                <th align="right">Toplam</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {o.items && Array.isArray(o.items) ? o.items.map((item: any, i: number) => (
                                                                                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                                    <td style={{ padding: '8px 0' }}>{item.name || item.productName || 'Ürün'}</td>
                                                                                    <td align="center">{item.qty || item.quantity || 1}</td>
                                                                                    <td align="right">{(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                                    <td align="right">{((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                                </tr>
                                                                            )) : (
                                                                                <tr><td colSpan={4} className="text-muted text-center py-2">Detay bulunamadı (Eski kayıt)</td></tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )
                }

                {/* INVOICE MAPPING MODAL */}
                {
                    selectedOrder && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="card glass" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)' }}>
                                <div className="flex-between mb-6">
                                    <h3>📑 Sipariş & Stok Eşleştirme</h3>
                                    <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px' }}>×</button>
                                </div>

                                {isLoadingMapping ? (
                                    <div className="flex-center p-8"><span className="loader"></span> Kontrol ediliyor...</div>
                                ) : (
                                    <div className="flex-col gap-4">
                                        <div className="alert alert-info py-2" style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            ℹ️ Eşleştirilmeyen ürünler için stok kartını seçiniz. Seçimleriniz kaydedilecek ve bir dahaki sefere otomatik tanınacaktır.
                                        </div>

                                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-light)' }}>
                                            <div className="grid-cols-3 text-muted mb-2 px-2" style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr' }}>
                                                <div>PAZARYERİ ÜRÜN</div>
                                                <div className="text-center">ADET</div>
                                                <div>STOK KARTI (ENVANTER)</div>
                                            </div>

                                            {selectedOrder.items.map((item: any, idx: number) => {
                                                const isMapped = !!mappedItems[item.name];
                                                return (
                                                    <div key={idx} className="flex-between py-3 px-2" style={{
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        display: 'grid',
                                                        gridTemplateColumns: '2fr 1fr 2fr',
                                                        gap: '10px',
                                                        alignItems: 'center',
                                                        background: isMapped ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                                                    }}>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                                                            <div className="text-muted" style={{ fontSize: '10px' }}>Kod: {item.code || item.barcode || '-'}</div>
                                                        </div>

                                                        <div className="text-center" style={{ fontWeight: '900', fontSize: '14px' }}>
                                                            x{item.qty || item.quantity}
                                                        </div>

                                                        <div style={{ width: '100%' }}>
                                                            {/* IF MAPPED, SHOW CHECKMARK AND NAME, ELSE SELECT */}
                                                            <select
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '8px',
                                                                    background: isMapped ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
                                                                    color: isMapped ? 'var(--success)' : 'var(--text-main)',
                                                                    border: isMapped ? '1px solid var(--success)' : '1px solid var(--warning)',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12px'
                                                                }}
                                                                value={mappedItems[item.name] || ''}
                                                                onChange={(e) => setMappedItems({ ...mappedItems, [item.name]: e.target.value })}
                                                            >
                                                                <option value="">-- Eşleştirme Seçin --</option>
                                                                {mockInventory.map(inv => (
                                                                    <option key={inv.id} value={inv.id}>
                                                                        {inv.name} ({inv.stock} Adet)
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex-col gap-2 mt-4">
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label className="text-muted" style={{ fontSize: '11px' }}>FATURA TİPİ</label>
                                                    <select style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                                                        <option>e-Arşiv Fatura</option>
                                                        <option>e-Fatura</option>
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label className="text-muted" style={{ fontSize: '11px' }}>KASA HESABI</label>
                                                    <select style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                                                        <option value="1">Merkez Kasa (Nakit)</option>
                                                        <option value="2">Banka Hesabı</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={finalizeInvoice}
                                            className="btn btn-primary w-full"
                                            style={{ padding: '16px', fontWeight: 'bold', marginTop: '20px', fontSize: '15px' }}
                                            disabled={selectedOrder.items.some((i: any) => !mappedItems[i.name])}
                                        >
                                            {selectedOrder.items.some((i: any) => !mappedItems[i.name]) ?
                                                '⚠️ Lütfen Eşleşmeyen Ürünleri Seçin' :
                                                '✅ KAYDET VE FATURAYI OLUŞTUR'
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
