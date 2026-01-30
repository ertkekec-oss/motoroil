
"use client";

import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp, Product } from '@/contexts/AppContext';
import { useDebounce } from '@/hooks';
import { useModal } from '@/contexts/ModalContext';
import InventoryTable from './components/InventoryTable';
import InventoryTransferModal from './components/InventoryTransferModal';
import InventoryBulkEditModal from './components/InventoryBulkEditModal';
import InventoryFilterBar from './components/InventoryFilterBar';
import TransferTabContent from './components/TransferTabContent';
import InventoryDetailModal from './components/InventoryDetailModal';


export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState('all');
    const { products, setProducts, currentUser, hasPermission, requestProductCreation, branches: contextBranches } = useApp();
    const { showSuccess, showError, showWarning, showConfirm } = useModal();
    const isSystemAdmin = currentUser === null || currentUser.role === 'ADMIN';
    const canEdit = hasPermission('inventory_edit');
    const canDelete = hasPermission('delete_records');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- COUNTING STATES ---
    const [isCounting, setIsCounting] = useState(false);
    const [countValues, setCountValues] = useState<Record<string | number, number>>({});
    const [auditReport, setAuditReport] = useState<any>(null);

    // --- TRANSFER STATES ---
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({ productId: 0, from: 'Merkez Depo', to: 'Kadıköy Şube', qty: 0 });
    const branches = contextBranches?.length > 0 ? contextBranches.map(b => b.name) : ['Merkez Depo', 'Kadıköy Şube', 'Beşiktaş Şube', 'E-Ticaret Depo'];

    // --- PRODUCT DETAIL STATES ---
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [detailTab, setDetailTab] = useState('general'); // general, pricing

    // --- ADD PRODUCT STATES ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        code: '', productCode: '', barcode: '', name: '', brand: '', category: 'Motosiklet', type: 'Diğer',
        stock: 0, price: 0, buyPrice: 0, status: 'ok', supplier: '', gtip: '', gtin: '',
        salesVat: 20, salesVatIncluded: true, purchaseVat: 20, purchaseVatIncluded: true,
        salesOiv: 0, salesOtv: 0, otvType: 'Ö.T.V yok'
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ADVANCED FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterBrand, setFilterBrand] = useState('all');
    const [stockSort, setStockSort] = useState<'none' | 'asc' | 'desc'>('none');
    const [specialFilter, setSpecialFilter] = useState<'none' | 'no-move' | 'top-seller'>('none');

    // --- BULK ACTION STATES ---
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [showBulkModal, setShowBulkModal] = useState<'category' | 'vat' | 'barcode' | 'price' | null>(null);
    const [bulkValues, setBulkValues] = useState<any>({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Adjustment states
    const [adjType, setAdjType] = useState<'percent' | 'amount'>('percent');
    const [adjTarget, setAdjTarget] = useState<'buy' | 'sell' | 'both'>('sell');
    const [adjValue, setAdjValue] = useState<number>(0);
    const [showCloseWarning, setShowCloseWarning] = useState(false);
    const [showValueModal, setShowValueModal] = useState(false);

    const inventoryValueResult = () => {
        let buyExt = 0;
        let buyInc = 0;
        let sellExt = 0;
        let sellInc = 0;

        products.forEach(p => {
            const qty = p.stock || 0;
            const bVat = p.purchaseVat || 20;
            const sVat = p.salesVat || 20;

            let bExt, bInc, sExt, sInc;

            if (p.purchaseVatIncluded) {
                bInc = p.buyPrice || 0;
                bExt = (p.buyPrice || 0) / (1 + bVat / 100);
            } else {
                bExt = p.buyPrice || 0;
                bInc = (p.buyPrice || 0) * (1 + bVat / 100);
            }

            if (p.salesVatIncluded) {
                sInc = p.price || 0;
                sExt = (p.price || 0) / (1 + sVat / 100);
            } else {
                sExt = p.price || 0;
                sInc = (p.price || 0) * (1 + sVat / 100);
            }

            buyExt += bExt * qty;
            buyInc += bInc * qty;
            sellExt += sExt * qty;
            sellInc += sInc * qty;
        });

        return { buyExt, buyInc, sellExt, sellInc };
    };

    const brands = Array.from(new Set(products.map(p => p.brand || 'Belirtilmemiş')));
    const categories = Array.from(new Set(products.map(p => p.category)));

    // Debounced search for better performance
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Memoized filtering
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' ? true :
                (filterCategory === 'uncategorized' ? !p.category : p.category === filterCategory);
            const matchesBrand = filterBrand === 'all' ? true : p.brand === filterBrand;

            let matchesSpecial = true;
            if (specialFilter === 'top-seller') matchesSpecial = p.stock < 10;
            if (specialFilter === 'no-move') matchesSpecial = p.stock > 100;

            return matchesSearch && matchesCategory && matchesBrand && matchesSpecial;
        }).sort((a, b) => {
            if (stockSort === 'asc') return a.stock - b.stock;
            if (stockSort === 'desc') return b.stock - a.stock;
            return 0;
        });
    }, [products, debouncedSearchTerm, filterCategory, filterBrand, specialFilter, stockSort]);

    // --- ACTIONS ---
    // --- COUNTING PERSISTENCE ---
    useEffect(() => {
        if (isCounting) {
            const branch = currentUser?.branch || 'Merkez';
            fetch(`/api/inventory/audit?branch=${branch}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'in_progress' && data.items) {
                        const savedCounts: Record<string | number, number> = {};
                        data.items.forEach((item: any) => {
                            savedCounts[item.productId] = item.countedStock;
                        });
                        setCountValues(savedCounts);
                    }
                });
        }
    }, [isCounting, currentUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isCounting && Object.keys(countValues).length > 0) {
                const branch = currentUser?.branch || 'Merkez';
                const items = Object.entries(countValues).map(([id, counted]) => {
                    const p = products.find(prod => String(prod.id) === String(id));
                    return {
                        productId: id,
                        productName: p?.name || 'Bilinmiyor',
                        systemStock: p?.stock || 0,
                        countedStock: counted
                    };
                });
                fetch('/api/inventory/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        branch,
                        items,
                        reportedBy: currentUser?.name || 'Sistem'
                    })
                });
            }
        }, 3000); // 3 sec debounce
        return () => clearTimeout(timer);
    }, [countValues, isCounting, currentUser, products]);

    // --- COUNTING & TRANSFER FUNCTIONS (Restored) ---
    const startCount = () => {
        setIsCounting(true);
        setCountValues({});
        setAuditReport(null);
        showSuccess('Sayım Başlatıldı', 'Lütfen listedeki ürünlerin sayım değerlerini girin.');
    };

    const cancelReport = () => {
        if (Object.keys(countValues).length > 0) {
            showConfirm('İptal Edilsin mi?', 'Girilen sayım verileri kaybolacak.', () => {
                setIsCounting(false);
                setCountValues({});
                setAuditReport(null);
            });
        } else {
            setIsCounting(false);
            setCountValues({});
            setAuditReport(null);
        }
    };

    const finishCount = () => {
        const reportItems: any[] = [];

        // Only verify items that have a count value entered
        Object.entries(countValues).forEach(([id, val]) => {
            const product = products.find(p => String(p.id) === String(id));
            if (product) {
                const diff = val - product.stock;
                // Include in report if there is a difference OR if we want to confirm the count
                if (diff !== 0) {
                    reportItems.push({
                        id: product.id,
                        name: product.name,
                        stock: product.stock,
                        counted: val,
                        diff: diff,
                        costDiff: diff * (product.buyPrice || 0)
                    });
                }
            }
        });

        if (reportItems.length === 0) {
            showWarning('Fark Bulunamadı', 'Girilen değerlerde sistem stoğundan farklı bir durum tespit edilmedi.');
            return;
        }

        setAuditReport({ items: reportItems });
    };

    const applyCountResults = async () => {
        if (!auditReport || !auditReport.items) return;
        setIsProcessing(true);
        try {
            // Update items sequentially
            for (const item of auditReport.items) {
                await fetch(`/api/products/${item.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: item.counted })
                });
            }

            // Use local user branch or default
            const branch = currentUser?.branch || 'Merkez';

            // Finalize audit record status
            await fetch('/api/inventory/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branch,
                    status: 'completed',
                    items: auditReport.items,
                    reportedBy: currentUser?.name || 'Sistem'
                })
            });

            // Refresh products
            const pRes = await fetch('/api/products');
            const pData = await pRes.json();
            if (pData.success) setProducts(pData.products);

            setIsCounting(false);
            setCountValues({});
            setAuditReport(null);
            showSuccess('Stoklar Güncellendi', 'Sayım sonuçları başarıyla işlendi ve stoklar güncellendi.');

        } catch (err) {
            console.error('Audit apply error:', err);
            showError('Hata', 'Stok güncelleme sırasında bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };

    const approveTransferDirectly = async (data: any) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                showSuccess('Transfer Başarılı', 'Ürün transferi başarıyla gerçekleştirildi.');
                const pRes = await fetch('/api/products');
                const pData = await pRes.json();
                if (pData.success) setProducts(pData.products);
            } else {
                showError('Transfer Başarısız', result.error || 'Bilinmeyen hata');
            }
        } catch (error) {
            showError('Hata', 'Transfer işlemi sırasında bir hata oluştu.');
        } finally {
            setIsProcessing(false);
        }
    };


    const handleSaveProduct = async (e: any) => {
        if (!canEdit) return;
        if (e && e.preventDefault) e.preventDefault();
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const validFields = [
                'name', 'code', 'barcode', 'price', 'buyPrice', 'stock', 'category',
                'description', 'imageUrl', 'minStock', 'brand', 'type', 'supplier', 'branch',
                'salesVat', 'salesVatIncluded', 'purchaseVat', 'purchaseVatIncluded',
                'salesOiv', 'salesOtv', 'otvType'
            ];
            const updateData: any = {};
            validFields.forEach(field => {
                if (selectedProduct[field] !== undefined) {
                    updateData[field] = selectedProduct[field];
                }
            });

            const res = await fetch(`/api/products/${selectedProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await res.json();
            if (data.success) {
                const pRes = await fetch('/api/products');
                const pData = await pRes.json();
                if (pData.success) setProducts(pData.products);
                setIsEditing(false);
                showSuccess('Güncelleme Başarılı', 'Ürün bilgileri ve fiyatlandırma başarıyla güncellendi.');
            } else {
                showError('Hata', data.error || 'Güncelleme başarısız');
            }
        } catch (err) {
            console.error('Update product error:', err);
            showError('Sistem Hatası', 'Güncelleme sırasında bir hata oluştu');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveNewProduct = async (e: any) => {
        e.preventDefault();
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const mandatoryFields = [
                { field: 'name', label: 'Ürün Adı' },
                { field: 'code', label: 'Stok Kodu' },
                { field: 'buyPrice', label: 'Alış Fiyatı' },
                { field: 'price', label: 'Satış Fiyatı' },
                { field: 'stock', label: 'Stok Miktarı' }
            ];

            for (const item of mandatoryFields) {
                if (!newProduct[item.field as keyof typeof newProduct] && newProduct[item.field as keyof typeof newProduct] !== 0) {
                    showError('Zorunlu Alan', `${item.label} alanı zorunludur!`);
                    setIsProcessing(false);
                    return;
                }
            }

            const prodToAdd = {
                ...newProduct,
                status: (newProduct.stock <= 0 ? 'out' : (newProduct.stock <= 5 ? 'low' : 'ok')) as 'ok' | 'low' | 'out' | 'warning'
            };

            if (!hasPermission('approve_products')) {
                requestProductCreation(prodToAdd);
                setShowAddModal(false);
                setNewProduct({
                    code: '', productCode: '', barcode: '', name: '', brand: '', category: 'Motosiklet', type: 'Diğer',
                    stock: 0, price: 0, buyPrice: 0, status: 'ok', supplier: '', gtip: '', gtin: '',
                    salesVat: 20, salesVatIncluded: true, purchaseVat: 20, purchaseVatIncluded: true,
                    salesOiv: 0, salesOtv: 0, otvType: 'Ö.T.V yok'
                });
                showSuccess('Ürün Talebi Oluşturuldu', 'Yönetici onayı bekleniyor.');
            } else {
                try {
                    const res = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(prodToAdd)
                    });
                    const data = await res.json();
                    if (data.success) {
                        const pRes = await fetch('/api/products');
                        const pData = await pRes.json();
                        if (pData.success) setProducts(pData.products);
                        setShowAddModal(false);
                        setNewProduct({
                            code: '', productCode: '', barcode: '', name: '', brand: '', category: 'Motosiklet', type: 'Diğer',
                            stock: 0, price: 0, buyPrice: 0, status: 'ok', supplier: '', gtip: '', gtin: '',
                            salesVat: 20, salesVatIncluded: true, purchaseVat: 20, purchaseVatIncluded: true,
                            salesOiv: 0, salesOtv: 0, otvType: 'Ö.T.V yok'
                        });
                        showSuccess('Yeni Ürün Eklendi', 'Ürün başarıyla eklendi.');
                    } else {
                        showError('Kayıt Hatası', `Ürün kaydedilirken bir hata oluştu: ${data.error || 'Bilinmeyen hata'}`);
                    }
                } catch (err: any) {
                    console.error('Create product error:', err);
                    showError('Sistem Hatası', 'Ürün kaydedilirken bir sistem hatası oluştu. Lütfen tekrar deneyin.');
                }
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const applyAdjustmentRule = () => {
        if (!adjValue) return;
        const newBulkValues = { ...bulkValues };
        selectedIds.forEach(id => {
            const product = products.find(p => p.id === id);
            if (!product) return;
            const current = newBulkValues[id] || { buyPrice: product.buyPrice, price: product.price };
            if (adjTarget === 'buy' || adjTarget === 'both') {
                const diff = adjType === 'percent' ? (current.buyPrice * adjValue / 100) : adjValue;
                current.buyPrice = Math.max(0, current.buyPrice + diff);
            }
            if (adjTarget === 'sell' || adjTarget === 'both') {
                const diff = adjType === 'percent' ? (current.price * adjValue / 100) : adjValue;
                current.price = Math.max(0, current.price + diff);
            }
            newBulkValues[id] = current;
        });
        setBulkValues(newBulkValues);
        setAdjValue(0);
        showSuccess('Fiyat Kuralı Uygulandı', `Seçili ${selectedIds.length} ürüne fiyat kuralı uygulandı. Kaydetmeyi unutmayın.`);
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            const currentProducts = [...products];
            let updatedCount = 0;
            let addedCount = 0;
            data.forEach((row: any, index) => {
                if (!row['Ürün Adı']) { return; }
                let code = row['Stok Kodu'] ? String(row['Stok Kodu']).trim() : '';
                if (!code) {
                    let suffix = 1;
                    let candidateCode = '';
                    do {
                        candidateCode = `OTO-${(currentProducts.length + suffix).toString().padStart(5, '0')}`;
                        suffix++;
                    } while (currentProducts.some(p => p.code === candidateCode));
                    code = candidateCode;
                }
                const sVatInc = row['Satış Dahil']?.toString().toUpperCase() === 'E';
                const pVatInc = row['Alış Dahil']?.toString().toUpperCase() === 'E';
                const existingIndex = currentProducts.findIndex(p => p.code === code);
                const productData = {
                    name: row['Ürün Adı'],
                    code: code,
                    barcode: (row['Barkod'] || '').toString(),
                    category: row['Kategori'] || 'Genel',
                    brand: row['Marka'] || 'Bilinmiyor',
                    buyPrice: parseFloat(row['Alış Fiyatı']) || 0,
                    purchaseVat: parseInt(row['Alış KDV']) || 20,
                    purchaseVatIncluded: pVatInc,
                    price: parseFloat(row['Satış Fiyatı']) || 0,
                    salesVat: parseInt(row['Satış KDV']) || 20,
                    salesVatIncluded: sVatInc,
                    stock: parseInt(row['Stok']) || 0,
                    status: (parseInt(row['Stok']) || 0) <= 0 ? 'out' : ((parseInt(row['Stok']) || 0) <= 5 ? 'low' : 'ok'),
                    supplier: row['Tedarikçi'] || '',
                    branch: row['Şube'] || 'Merkez'
                };
                if (existingIndex > -1) {
                    currentProducts[existingIndex] = { ...currentProducts[existingIndex], ...(productData as any) };
                    updatedCount++;
                } else {
                    currentProducts.push({
                        ...productData,
                        id: Date.now() + index + Math.random(),
                        type: row['Tip'] || 'Diğer'
                    } as any);
                    addedCount++;
                }
            });
            if (updatedCount > 0 || addedCount > 0) {
                setProducts(currentProducts);
                showSuccess('Yükleme Tamamlandı', `${addedCount} yeni ürün eklendi.\n${updatedCount} mevcut ürün güncellendi.`);
            } else {
                showWarning('Geçerli Ürün Bulunamadı', 'Yüklenecek geçerli ürün bulunamadı. Lütfen sütun başlıklarını kontrol edin.');
            }
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const exportToExcel = () => {
        const data = filteredProducts.map(p => ({
            'Stok Kodu': p.code, 'Ürün Adı': p.name, 'Kategori': p.category, 'Marka': p.brand,
            'Stok': p.stock, 'Birim Fiyat': p.price, 'Alış Fiyatı': p.buyPrice, 'KDV (%)': p.salesVat
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Envanter");
        XLSX.writeFile(wb, `Envanter_Raporu_${new Date().toLocaleDateString()}.xlsx`);
        showSuccess('Excel İndiriliyor', 'Dosya indirme işlemi başlatıldı.');
    };

    const handleBulkAction = (mode: any) => { setShowBulkModal(mode); };

    return (
        <div className="p-6 pb-32 animate-fade-in relative">
            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
            {/* --- HEADER --- */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-white via-white to-white/30 bg-clip-text text-transparent mb-2">
                        {isCounting ? '🔍 Stok Sayımı & Denetim' : '📦 Envanter Yönetimi'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <p className="text-muted font-medium text-sm tracking-wide">
                            {isCounting ? 'Fiziksel sayım sonuçlarını girin.' : 'Ürün, stok ve fiyat yönetimi merkezi.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleExcelUpload}
                        accept=".xlsx, .xls"
                        className="hidden"
                    />

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm font-bold">
                            📤 Yükle
                        </button>
                        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm font-bold">
                            📥 İndir
                        </button>
                    </div>

                    {!isCounting && (
                        <button onClick={startCount} className="btn-secondary group">
                            <span className="group-hover:rotate-12 transition-transform">🔍</span> Sayım Başlat
                        </button>
                    )}
                    {isCounting && (
                        <>
                            <button onClick={cancelReport} className="btn-outline border-red-500/30 text-red-400 hover:bg-red-500/10">
                                İptal
                            </button>
                            <button onClick={finishCount} className="btn-primary">
                                Raporu Bitir
                            </button>
                        </>
                    )}
                    <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-primary/40 px-8">
                        + Yeni Ürün Ekle
                    </button>
                </div>
            </div>

            {/* --- FILTER BAR --- */}
            <InventoryFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterBrand={filterBrand}
                setFilterBrand={setFilterBrand}
                stockSort={stockSort}
                setStockSort={setStockSort}
                specialFilter={specialFilter}
                setSpecialFilter={setSpecialFilter}
                categories={categories}
                brands={brands}
            />

            {/* --- TABS --- */}
            {!isCounting && (
                <div className="flex gap-1 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl w-fit mb-8 border border-white/5">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'all' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-muted hover:text-white hover:bg-white/5'}`}
                    >
                        Tüm Ürünler
                    </button>
                    <button
                        onClick={() => setActiveTab('transfers')}
                        className={`px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'transfers' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-muted hover:text-white hover:bg-white/5'}`}
                    >
                        Transfer & Sevkiyat
                    </button>
                </div>
            )}

            {/* --- CONTENT --- */}
            <div className="relative">
                {activeTab === 'all' && (
                    <InventoryTable
                        products={filteredProducts}
                        allProducts={products}
                        isCounting={isCounting}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        countValues={countValues}
                        onCountChange={(id, val) => setCountValues({ ...countValues, [id]: val })}
                        onProductClick={(product) => { setSelectedProduct(product); setIsEditing(false); }}
                    />
                )}

                {activeTab === 'transfers' && (
                    <TransferTabContent
                        isSystemAdmin={isSystemAdmin}
                        products={products}
                        filteredProducts={filteredProducts}
                        branches={branches}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onApproveTransfer={approveTransferDirectly}
                    />
                )}
            </div>

            {/* --- BULK ACTION FLOATING BAR --- */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 2500, display: 'flex', alignItems: 'center', gap: '40px',
                    padding: '20px 40px', borderRadius: '30px',
                    background: 'rgba(8, 9, 17, 0.95)',
                    border: '1px solid var(--primary)',
                    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 40px rgba(255, 85, 0, 0.15)',
                    backdropFilter: 'blur(30px)',
                    animation: 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary tracking-widest uppercase mb-1">Seçim</span>
                        <div className="text-2xl font-black text-white leading-none">{selectedIds.length} <span className="text-xs font-normal opacity-50">Adet</span></div>
                    </div>

                    <div className="w-px h-12 bg-white/10"></div>

                    <div className="flex items-center gap-4">
                        {[
                            { id: 'category', icon: '🏷️', label: 'Kategori' },
                            { id: 'vat', icon: '🏛️', label: 'KDV' },
                            { id: 'barcode', icon: '🔍', label: 'Barkod' },
                            { id: 'price', icon: '💰', label: 'Fiyat' }
                        ].map(action => (
                            <button
                                key={action.id}
                                className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl hover:bg-white/5 transition-all text-white/70 hover:text-primary"
                                onClick={() => handleBulkAction(action.id as any)}
                            >
                                <span className="text-xl">{action.icon}</span>
                                <span className="text-[11px] font-bold uppercase tracking-tight">{action.label}</span>
                            </button>
                        ))}

                        {canDelete && (
                            <button className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl hover:bg-red-500/10 transition-all text-red-400/70 hover:text-red-400" onClick={() => handleBulkAction('delete')}>
                                <span className="text-xl">🗑️</span>
                                <span className="text-[11px] font-bold uppercase tracking-tight">SİL</span>
                            </button>
                        )}
                    </div>

                    <div className="w-px h-12 bg-white/10"></div>

                    <button
                        onClick={() => setSelectedIds([])}
                        className="bg-white/10 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary transition-colors text-xl font-light"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* --- MODALS --- */}
            <InventoryTransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                onSubmit={(data) => {
                    if (data.qty > 0) {
                        // Use existing logic for single transfer if needed, but transfer tab handles bulk
                        approveTransferDirectly({ ...data, id: Date.now() });
                        setShowTransferModal(false);
                    }
                }}
                product={selectedProduct}
                branches={branches}
            />

            <InventoryBulkEditModal
                isOpen={!!showBulkModal}
                mode={showBulkModal}
                onClose={() => setShowBulkModal(null)}
                selectedIds={selectedIds}
                products={products}
                categories={categories}
                isProcessing={isProcessing}
                onApply={async (data) => {
                    setIsProcessing(true);
                    try {
                        const payload: any = { mode: showBulkModal, ids: selectedIds };

                        if (showBulkModal === 'category' || showBulkModal === 'vat') {
                            payload.updates = data;
                        } else if (showBulkModal === 'barcode') {
                            payload.individualUpdates = {};
                            selectedIds.forEach(id => {
                                if (data[id]) payload.individualUpdates[id] = { barcode: data[id] };
                            });
                        } else if (showBulkModal === 'price') {
                            payload.individualUpdates = data;
                        }

                        const res = await fetch('/api/products/bulk', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        if (res.ok) {
                            const pRes = await fetch('/api/products');
                            const pData = await pRes.json();
                            if (pData.success) setProducts(pData.products);

                            showSuccess('Kayıt Başarılı', 'Toplu değişiklikler veritabanına işlendi.');
                            setShowBulkModal(null);
                            setSelectedIds([]);
                        } else {
                            throw new Error('Toplu kayıt hatası');
                        }
                    } catch (e) {
                        showError('Hata', 'Toplu güncelleme sırasında bir sorun oluştu.');
                    } finally {
                        setIsProcessing(false);
                    }
                }}
            />



            <InventoryDetailModal
                isOpen={!!selectedProduct}
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onSave={handleSaveProduct}
                canEdit={canEdit}
                canDelete={canDelete}
                onDelete={() => {
                    // Simple confirm and delete logic could be added here if needed, 
                    // or pass a handler that calls the API. For now, we will leave it hooked up loosely or implement:
                    showConfirm('Emin misiniz?', 'Bu ürün kalıcı olarak silinecek.', async () => {
                        try {
                            const res = await fetch(`/api/products/${selectedProduct.id}`, { method: 'DELETE' });
                            if (res.ok) {
                                setProducts(products.filter(p => p.id !== selectedProduct.id));
                                setSelectedProduct(null);
                                showSuccess('Silindi', 'Ürün başarıyla silindi.');
                            } else {
                                showError('Hata', 'Silinemedi.');
                            }
                        } catch (e) { showError('Hata', 'Bir sorun oluştu.'); }
                    });
                }}
                selectedProductState={[selectedProduct, setSelectedProduct]}
            />

            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white">&times;</button>
                        <h2 className="text-2xl font-black mb-6">✨ Yeni Ürün Ekle</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Ürün Adı</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Örn: Motul 7100 10w40" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Stok Kodu</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.code} onChange={e => setNewProduct({ ...newProduct, code: e.target.value })} placeholder="Örn: OTO-001" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Kategori</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                        <option value="Motosiklet">Motosiklet</option>
                                        <option value="Otomobil">Otomobil</option>
                                        <option value="Aksesuar">Aksesuar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Marka</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Barkod</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Alış Fiyatı (TL)</label>
                                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.buyPrice} onChange={e => setNewProduct({ ...newProduct, buyPrice: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Satış Fiyatı (TL)</label>
                                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Stok Miktarı</label>
                                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <button onClick={handleSaveNewProduct} className="w-full btn btn-primary py-4 mt-4 font-bold text-lg">
                                {isProcessing ? 'Kaydediliyor...' : '✨ Ürünü Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {auditReport && (
                <div className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center p-8">
                    <div className="bg-[#0f172a] rounded-3xl max-w-4xl w-full p-8 border border-white/20">
                        <h2 className="text-2xl font-black mb-4">Sayım Sonuç Raporu</h2>
                        <div className="max-h-[500px] overflow-y-auto mb-6">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-muted border-b border-white/10">
                                        <th className="p-3">Ürün</th>
                                        <th className="p-3">Sistem Stok</th>
                                        <th className="p-3">Sayılan</th>
                                        <th className="p-3">Fark</th>
                                        <th className="p-3">Maliyet Farkı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditReport.items.map((item: any) => (
                                        <tr key={item.id} className="border-b border-white/5">
                                            <td className="p-3 font-bold">{item.name}</td>
                                            <td className="p-3 text-muted">{item.stock}</td>
                                            <td className="p-3 font-bold">{item.counted}</td>
                                            <td className={`p-3 font-bold ${item.diff > 0 ? 'text-success' : 'text-red-400'}`}>{item.diff > 0 ? '+' : ''}{item.diff}</td>
                                            <td className="p-3">{item.costDiff.toFixed(2)} TL</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setAuditReport(null)} className="btn btn-ghost">Vazgeç</button>
                            <button onClick={applyCountResults} className="btn btn-primary">Sonuçları İşle ve Stokları Güncelle</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const style = `
@keyframes slide-up {
    from { transform: translate(-50%, 100px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}
`;
