
"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
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
    const { products, setProducts, currentUser, hasPermission, requestProductCreation, branches: contextBranches, brands: dbBrands, prodCats: dbCategories, refreshSettings } = useApp();
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

    // Modal açıldığında da verileri tazele
    useEffect(() => {
        if (showAddModal || !!selectedProduct) {
            refreshSettings();
        }
    }, [showAddModal, selectedProduct]);

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

        (products || []).forEach(p => {
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

    const brands = Array.from(new Set((products || []).map(p => p.brand || 'Belirtilmemiş')));
    const categories = Array.from(new Set((products || []).map(p => p.category)));

    // Debounced search for better performance
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Memoized filtering
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (p.code || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' ? true :
                (filterCategory === 'uncategorized' ? !p.category : p.category === filterCategory);
            const matchesBrand = filterBrand === 'all' ? true : p.brand === filterBrand;

            let matchesSpecial = true;
            if (specialFilter === 'top-seller') matchesSpecial = (p.stock || 0) < 10;
            if (specialFilter === 'no-move') matchesSpecial = (p.stock || 0) > 100;

            return matchesSearch && matchesCategory && matchesBrand && matchesSpecial;
        }).sort((a, b) => {
            if (stockSort === 'asc') return (a.stock || 0) - (b.stock || 0);
            if (stockSort === 'desc') return (b.stock || 0) - (a.stock || 0);
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
                        const defaultCat = dbCategories.length > 0 ? dbCategories[0] : 'Motosiklet';
                        setNewProduct({
                            code: '', productCode: '', barcode: '', name: '', brand: '', category: defaultCat, type: 'Diğer',
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
            const currentProducts = [...(products || [])];
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
                    {!isCounting ? (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">📦 Envanter Yönetimi</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                <p className="text-white/60 font-medium text-sm">Ürün, stok ve fiyat yönetimi merkezi.</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 py-2 px-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                            <div className="text-3xl animate-bounce">🔍</div>
                            <div>
                                <h1 className="text-xl font-black text-amber-500 uppercase tracking-tight">STOK SAYIM MODU AKTİF</h1>
                                <p className="text-xs text-amber-500/70 font-bold uppercase tracking-widest">Lütfen fiziksel stok miktarlarını "Sayılan" alanına girin.</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* --- DASHBOARD STATS (New Design) --- */}
            {!isCounting && activeTab === 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card glass p-5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div>
                            <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Toplam Ürün</div>
                            <div className="text-3xl font-black text-white">{(products || []).length}</div>
                        </div>
                        <div className="text-[10px] text-white/40 font-medium mt-4">
                            {(products || []).filter(p => !p.category).length} kategorisiz ürün
                        </div>
                    </div>

                    <div className="card glass p-5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div>
                            <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Depo Değeri (Alış)</div>
                            <div className="text-3xl font-black text-emerald-400">
                                {Number(inventoryValueResult().buyExt).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </div>
                        </div>
                        <div className="text-[10px] text-emerald-500/50 font-medium mt-4">
                            +KDV Dahil: {Number(inventoryValueResult().buyInc).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </div>
                    </div>

                    <div className="card glass p-5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div>
                            <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Satış Potansiyeli</div>
                            <div className="text-3xl font-black text-purple-400">
                                {Number(inventoryValueResult().sellInc).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </div>
                        </div>
                        <div className="text-[10px] text-purple-500/50 font-medium mt-4">
                            Tahmini Kâr: {Number(inventoryValueResult().sellInc - inventoryValueResult().buyInc).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                        </div>
                    </div>

                    <div className="card glass p-5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div>
                            <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Kritik Stok</div>
                            <div className="text-3xl font-black text-red-400">
                                {(products || []).filter(p => (p.stock || 0) <= 5).length}
                            </div>
                        </div>
                        <div className="text-[10px] text-red-500/50 font-medium mt-4">
                            {(products || []).filter(p => (p.stock || 0) <= 0).length} ürün tükendi
                        </div>
                    </div>
                </div>
            )}

            {/* --- UNIFIED TOOLBAR --- */}
            {/* --- UNIFIED TOOLBAR --- */}
            {!isCounting ? (
                <div className="flex items-center gap-3 mb-6 z-20 relative overflow-x-auto pb-2 scrollbar-none no-scrollbar flex-nowrap min-w-0">
                    <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 whitespace-nowrap">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>📦</span>
                            Envanter Listesi
                        </button>
                        <button
                            onClick={() => setActiveTab('transfers')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'transfers' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <span>🚛</span>
                            Transfer & Sevkiyat
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleExcelUpload}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />

                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                                <span className="text-sm">📤</span>
                                <span>Yükle</span>
                            </button>
                            <div className="w-px h-6 my-auto bg-white/10 mx-1"></div>
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                                <span className="text-sm">📥</span>
                                <span>İndir</span>
                            </button>
                        </div>

                        <button
                            onClick={startCount}
                            className="group relative px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative flex items-center gap-2 text-white/70 group-hover:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                                <span className="group-hover:rotate-12 transition-transform duration-300 transform origin-center text-sm">🔍</span>
                                <span>Stok Sayımı</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="group relative px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] overflow-hidden shadow-lg shadow-[#FF5500]/30 hover:shadow-[#FF5500]/50 hover:scale-[1.02] transition-all"
                        >
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                            <div className="relative flex items-center gap-2 text-white font-black text-xs uppercase tracking-wide">
                                <span className="text-sm leading-none">+</span>
                                <span>YENİ ÜRÜN</span>
                            </div>
                        </button>
                    </div>

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
                        categories={dbCategories.length > 0 ? dbCategories : categories}
                        brands={dbBrands.length > 0 ? dbBrands : brands}
                    />
                </div>
            ) : (
                <div className="flex items-center justify-between mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <input
                                type="text"
                                placeholder="Sayılacak ürünü ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none px-4 py-2 text-sm text-white w-64"
                            />
                        </div>
                        <div className="text-xs text-white/40 font-bold uppercase">
                            Sayım Başlangıcı: <span className="text-white/80">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={cancelReport}
                            className="px-8 py-3 rounded-xl border-2 border-red-500/20 text-red-500 hover:bg-red-500/10 font-black text-sm uppercase tracking-widest transition-all"
                        >
                            İPTAL ET
                        </button>
                        <button
                            onClick={finishCount}
                            className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>KONTROL ET & BİTİR</span>
                            <span className="text-lg">→</span>
                        </button>
                    </div>
                </div>
            )}



            {/* --- CONTENT --- */}
            <div className="relative">
                {activeTab === 'all' && (
                    <InventoryTable
                        products={filteredProducts}
                        allProducts={products || []}
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
                        products={products || []}
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
                products={products}
                filteredProducts={products}
                branches={branches}
                isSystemAdmin={isSystemAdmin}
                isProcessing={isProcessing}
                onTransfer={async (data) => {
                    const res = await fetch('/api/inventory/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (res.ok) {
                        const pRes = await fetch('/api/products');
                        const pData = await pRes.json();
                        if (pData.success) setProducts(pData.products);
                        showSuccess('Başarılı', 'Transfer işlemi tamamlandı.');
                        setShowTransferModal(false);
                    }
                }}
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
                categories={dbCategories}
            />

            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white">&times;</button>
                        <h2 className="text-2xl font-black mb-6">✨ Yeni Ürün Ekle</h2>

                        <div className="space-y-6">
                            {/* Temel Bilgiler */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Ürün Adı <span className="text-red-500">*</span></label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Örn: Motul 7100 10w40" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Stok Kodu <span className="text-red-500">*</span></label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.code} onChange={e => setNewProduct({ ...newProduct, code: e.target.value })} placeholder="Örn: OTO-001" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Kategori</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                        {(dbCategories.length > 0 ? dbCategories : ['Motosiklet', 'Otomobil', 'Aksesuar', 'Yedek Parça', 'Madeni Yağ']).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Marka</label>
                                    <div className="relative">
                                        <input type="text" list="brand-list" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} placeholder="Marka seçin veya yazın" />
                                        <datalist id="brand-list">
                                            {dbBrands.map(brand => (
                                                <option key={brand} value={brand} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted uppercase mb-1 block">Barkod</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                        value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                                </div>
                            </div>

                            {/* Fiyatlandırma & KDV */}
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="text-sm font-bold text-white/80 border-b border-white/10 pb-2">📦 Fiyatlandırma & Vergi Yönetimi</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Alış Fiyatı */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase block">Alış Fiyatı</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.buyPrice} onChange={e => setNewProduct({ ...newProduct, buyPrice: parseFloat(e.target.value) })} />
                                    </div>

                                    {/* Alış KDV */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase block">Alış KDV</label>
                                        <div className="flex gap-2">
                                            <select className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                                value={newProduct.purchaseVat} onChange={e => setNewProduct({ ...newProduct, purchaseVat: parseInt(e.target.value) })}>
                                                <option value="0">%0</option>
                                                <option value="1">%1</option>
                                                <option value="10">%10</option>
                                                <option value="20">%20</option>
                                            </select>
                                            <div className="flex items-center">
                                                <input type="checkbox" className="w-5 h-5 accent-primary"
                                                    checked={newProduct.purchaseVatIncluded}
                                                    onChange={e => setNewProduct({ ...newProduct, purchaseVatIncluded: e.target.checked })}
                                                    title="KDV Dahil mi?"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Satış Fiyatı */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase block">Satış Fiyatı</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} />
                                    </div>

                                    {/* Satış KDV */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase block">Satış KDV</label>
                                        <div className="flex gap-2">
                                            <select className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                                value={newProduct.salesVat} onChange={e => setNewProduct({ ...newProduct, salesVat: parseInt(e.target.value) })}>
                                                <option value="0">%0</option>
                                                <option value="1">%1</option>
                                                <option value="10">%10</option>
                                                <option value="20">%20</option>
                                            </select>
                                            <div className="flex items-center">
                                                <input type="checkbox" className="w-5 h-5 accent-primary"
                                                    checked={newProduct.salesVatIncluded}
                                                    onChange={e => setNewProduct({ ...newProduct, salesVatIncluded: e.target.checked })}
                                                    title="KDV Dahil mi?"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Alış İskonto (%)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={(newProduct as any).purchaseDiscount || 0} onChange={e => setNewProduct({ ...newProduct, purchaseDiscount: parseFloat(e.target.value) } as any)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Stok Miktarı</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            {/* Ek Vergiler & Detaylar */}
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="text-sm font-bold text-white/80 border-b border-white/10 pb-2">📑 Ek Vergiler & Gümrük</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Ö.T.V Türü</label>
                                        <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.otvType} onChange={e => setNewProduct({ ...newProduct, otvType: e.target.value })}>
                                            <option value="Ö.T.V yok">Ö.T.V Yok</option>
                                            <option value="Liste Fiyatından">Liste Fiyatından</option>
                                            <option value="Birim Başına">Birim Başına (Maktu)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Ö.T.V Tutarı</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.salesOtv} onChange={e => setNewProduct({ ...newProduct, salesOtv: parseFloat(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">Ö.İ.V Tutarı</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={newProduct.salesOiv} onChange={e => setNewProduct({ ...newProduct, salesOiv: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase mb-1 block">GTİP Kodu</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary outline-none"
                                            value={(newProduct as any).gtip || ''} onChange={e => setNewProduct({ ...newProduct, gtip: e.target.value } as any)} placeholder="12.34.56.78.90" />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSaveNewProduct} className="w-full btn btn-primary py-4 mt-4 font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
                                {isProcessing ? 'Kaydediliyor...' : '✨ Ürünü Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {auditReport && (
                <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] rounded-[32px] max-w-5xl w-full max-h-[90vh] flex flex-col border border-white/20 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden animate-in">
                        <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                            <div className="flex-between">
                                <div>
                                    <h2 className="text-3xl font-black text-white">Sayım Sonuç Raporu</h2>
                                    <p className="text-white/40 font-medium">{auditReport.items.length} kalemde fark tespit edildi.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">TOPLAM MALİYET ETKİSİ</div>
                                    <div className={`text-2xl font-black ${auditReport.items.reduce((a: any, b: any) => a + b.costDiff, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {Number(auditReport.items.reduce((a: any, b: any) => a + b.costDiff, 0)).toLocaleString('tr-TR')} ₺
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scroll">
                            <table className="w-full text-left">
                                <thead className="text-[10px] text-white/30 font-black uppercase tracking-wider sticky top-0 bg-[#0f172a] z-10">
                                    <tr>
                                        <th className="p-4">Ürün Detayı</th>
                                        <th className="p-4 text-center">Sistem</th>
                                        <th className="p-4 text-center">Fiziksel</th>
                                        <th className="p-4 text-center">Fark</th>
                                        <th className="p-4 text-right">Maliyet Etkisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {auditReport.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-white mb-0.5">{item.name}</div>
                                                <div className="text-[10px] text-white/30 font-mono">{item.id}</div>
                                            </td>
                                            <td className="p-4 text-center font-medium text-white/50">{item.stock}</td>
                                            <td className="p-4 text-center font-bold text-white">{item.counted}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-xs font-black ${item.diff > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {item.diff > 0 ? '+' : ''}{item.diff}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-bold tabular-nums ${item.costDiff >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                                                {item.costDiff.toLocaleString('tr-TR')} ₺
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                            <button onClick={() => setAuditReport(null)} className="px-8 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-bold transition-all">
                                Vazgeç
                            </button>
                            <button
                                onClick={applyCountResults}
                                disabled={isProcessing}
                                className="px-8 py-3 rounded-xl bg-primary hover:bg-[#FF6600] text-white font-black shadow-lg shadow-primary/20 transition-all hover:scale-105"
                            >
                                {isProcessing ? 'İŞLENİYOR...' : 'SONUÇLARI ONAYLA VE STOKLARI GÜNCELLE'}
                            </button>
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
