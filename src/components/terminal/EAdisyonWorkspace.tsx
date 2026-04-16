import React, { useState } from 'react';
import { Search, Plus, Trash2, Printer, CheckCircle2, ChevronRight, X, Clock, Coffee, Utensils, UtensilsCrossed, Send, Users, Edit3 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EAdisyonWorkspace({ products }: any) {
    const { showWarning, showSuccess } = useModal();
    const { t } = useLanguage();

    const [activeZone, setActiveZone] = useState('salon');
    const [activeTable, setActiveTable] = useState<any>(null);
    const [invoiceStatus, setInvoiceStatus] = useState<'idle'|'processing'|'sent'>('idle');
    const [activeCategory, setActiveCategory] = useState('hot'); // Selected category in quick menu

    const [kitchenStatus, setKitchenStatus] = useState<'idle' | 'printing'>('idle');

    // MOCK TABLES
    const [tables, setTables] = useState([
        { id: 'S-01', name: 'Masa 1', zone: 'salon', capacity: 4, waiter: 'Ali', status: 'occupied', openTime: new Date(Date.now() - 45*60000), items: [{ id: 1, name: 'Karışık Izgara', quantity: 2, price: 350, vatRate: 10, sent: true }, { id: 2, name: 'Ayran', quantity: 2, price: 50, vatRate: 10, sent: true }] },
        { id: 'S-02', name: 'Masa 2', zone: 'salon', capacity: 2, waiter: null, status: 'empty', openTime: null, items: [] },
        { id: 'S-03', name: 'Masa 3', zone: 'salon', capacity: 6, waiter: 'Ayşe', status: 'occupied', openTime: new Date(Date.now() - 15*60000), items: [{ id: 3, name: 'Künefe', quantity: 1, price: 200, vatRate: 10, sent: true }] },
        { id: 'S-04', name: 'VIP 1', zone: 'salon', capacity: 8, waiter: null, status: 'empty', openTime: null, items: [] },
        { id: 'T-01', name: 'Teras 1', zone: 'teras', capacity: 4, waiter: null, status: 'empty', openTime: null, items: [] },
        { id: 'T-02', name: 'Teras 2', zone: 'teras', capacity: 4, waiter: 'Ali', status: 'occupied', openTime: new Date(Date.now() - 120*60000), items: [{ id: 4, name: 'Türk Kahvesi', quantity: 4, price: 70, vatRate: 10, sent: true }] },
        { id: 'B-01', name: 'Bahçe 1', zone: 'bahce', capacity: 10, waiter: null, status: 'empty', openTime: null, items: [] },
    ]);

    const CATEGORIES = [
        { id: 'main', name: 'Ana Yemekler' },
        { id: 'hot', name: 'Sıcak İçecekler' },
        { id: 'cold', name: 'Soğuk İçecekler' },
        { id: 'dessert', name: 'Tatlılar' }
    ];

    const MOCK_PRODUCTS = [
        { id: 101, name: 'Mercimek Çorbası', price: 90, category: 'main' },
        { id: 102, name: 'İskender Kebap', price: 450, category: 'main' },
        { id: 103, name: 'Adana Dürüm', price: 250, category: 'main' },
        { id: 104, name: 'Kutu Kola', price: 60, category: 'cold' },
        { id: 107, name: 'Ayran', price: 40, category: 'cold' },
        { id: 105, name: 'Fırın Sütlaç', price: 120, category: 'dessert' },
        { id: 108, name: 'Künefe', price: 200, category: 'dessert' },
        { id: 106, name: 'Sade Türk Kahvesi', price: 80, category: 'hot' },
        { id: 109, name: 'Bardak Çay', price: 30, category: 'hot' },
    ];

    const calculateTotal = (items: any[]) => items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const handleSendAdisyon = async () => {
        if (!activeTable) return;
        if (activeTable.items.length === 0) {
            return showWarning(t('adission.emptyAdission'), t('adission.errEmpty'));
        }

        setInvoiceStatus('processing');
        
        try {
            const res = await fetch('/api/nilvera/eadisyon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableNo: activeTable.name,
                    waiterName: activeTable.waiter || "Kasiyer 1",
                    sessionStart: activeTable.openTime?.toISOString(),
                    lines: activeTable.items,
                    currency: "TRY"
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setInvoiceStatus('sent');
                showSuccess(t('adission.successTitle'), `Belge GİB'e iletildi ve fiş çıkartılıyor.`);
                
                setTables(tables.map(t => t.id === activeTable.id ? { ...t, status: 'empty', items: [], openTime: null, waiter: null } : t));
                
                setTimeout(() => {
                    setInvoiceStatus('idle');
                    setActiveTable(null);
                }, 3000);

            } else {
                setInvoiceStatus('idle');
                showWarning("Hata Oluştu", data.error || "E-Adisyon gönderilemedi.");
            }
        } catch (err: any) {
            setInvoiceStatus('idle');
            showWarning("Bağlantı Hatası", err.message);
        }
    };

    const handleSendToKitchen = () => {
        if (!activeTable) return;
        const unsentItems = activeTable.items.filter((i: any) => !i.sent);
        if (unsentItems.length === 0) {
            return showWarning("Uyarı", t('adission.errKitchenEmpty'));
        }
        
        setKitchenStatus('printing');
        
        // Şimule edilmiş yazıcı bağlantı gecikmesi
        setTimeout(() => {
            const updatedTable = { ...activeTable };
            // Tüm yeni ürünlerin "sent" (gönderildi) durumunu true yapıyoruz
            updatedTable.items = updatedTable.items.map((i: any) => ({ ...i, sent: true }));
            
            setActiveTable(updatedTable);
            setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
            
            setKitchenStatus('idle');
            showSuccess(t('adission.kitchenSuccess'), `${unsentItems.length}  {t('adission.kitchenSuccessDesc')}`);
        }, 800);
    };

    const handleAddItem = (prod: any) => {
        if (!activeTable) return;
        
        const updatedTable = { ...activeTable };
        if (updatedTable.status === 'empty') {
            updatedTable.status = 'occupied';
            updatedTable.openTime = new Date();
            updatedTable.waiter = 'Kasiyer M.';
        }

        const existingItem = updatedTable.items.find((i: any) => i.id === prod.id && !i.sent);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            updatedTable.items.push({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, vatRate: 10, sent: false });
        }
        
        setActiveTable(updatedTable);
        setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
    };

    const handleRemoveItem = (itemId: number) => {
        if (!activeTable) return;
        const updatedTable = { ...activeTable };
        updatedTable.items = updatedTable.items.filter((i: any) => i.id !== itemId);
        
        if (updatedTable.items.length === 0) {
            updatedTable.status = 'empty';
            updatedTable.openTime = null;
            updatedTable.waiter = null;
        }
        
        setActiveTable(updatedTable);
        setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
    };

    if (invoiceStatus === 'sent') {
         return (
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 h-full min-h-[500px]">
                <CheckCircle2 size={80} strokeWidth={1} className="text-blue-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t('adission.successTitle')}</h2>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-md">"{activeTable?.name}" hesabına ait elektronik adisyon başarıyla GİB'e iletildi ve mutfak fişi çıkarılıyor.</p>
                <div className="w-16 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F4F6F8] dark:bg-[#0B1220] p-4 overflow-hidden">
            <div className="flex-1 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 flex flex-row overflow-hidden bg-white dark:bg-slate-900">
                
                {/* LEFT: TABLE GRID */}
                <div className="flex-1 flex flex-col relative z-10">
                    
                    {/* Zone Selector - Square / Less Rounded Tabs */}
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-slate-900/50">
                        {['salon', 'teras', 'bahce'].map(zone => (
                            <button 
                                key={zone}
                                onClick={() => setActiveZone(zone)}
                                className={`px-5 py-2.5 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors ${
                                    activeZone === zone 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'bg-white dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                }`}
                            >
                                {zone === 'salon' ? 'SALON (İÇ MEKAN)' : zone === 'teras' ? 'TERAS' : 'BAHÇE'}
                            </button>
                        ))}
                    </div>

                    {/* Tables Grid */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {tables.filter(t => t.zone === activeZone).map(table => {
                                const isOccupied = table.status === 'occupied';
                                const isActive = activeTable?.id === table.id;
                                const total = calculateTotal(table.items);
                                
                                return (
                                    <div 
                                        key={table.id}
                                        onClick={() => setActiveTable(table)}
                                        className={`relative h-28 rounded-xl flex flex-col justify-between p-4 cursor-pointer transition-colors border group ${
                                            isActive 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' 
                                                : isOccupied 
                                                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-blue-300' 
                                                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <UtensilsCrossed size={14} strokeWidth={2.5} className={isActive ? 'text-blue-500' : isOccupied ? 'text-slate-600 dark:text-slate-300' : ''} />
                                                <div className="flex space-x-0.5">
                                                    {[...Array(Math.min(table.capacity, 4))].map((_, i) => (
                                                        <Users key={i} size={8} className={isActive ? 'text-blue-400/60' : isOccupied ? 'text-slate-300' : 'text-slate-200 opacity-50'} />
                                                    ))}
                                                </div>
                                            </div>

                                            {isOccupied ? (
                                                <span className="flex h-2.5 w-2.5 relative">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-blue-400' : 'bg-blue-400'}`}></span>
                                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-blue-500' : 'bg-blue-500'}`}></span>
                                                </span>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-auto">
                                            <h3 className={`font-black text-base tracking-tight leading-none mb-1 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                                                {table.name}
                                            </h3>
                                            
                                            {isOccupied ? (
                                                <div className={`font-bold text-xs flex items-center justify-between ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500'}`}>
                                                    <span>{total.toLocaleString()} ₺</span>
                                                    {table.waiter && (
                                                        <span className={`text-[9px] uppercase tracking-wider ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                                                            {table.waiter}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`text-[10px] uppercase font-bold tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                                                    UYGUN
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: COMPACT ADISYON DETAILS & MENU */}
                {activeTable ? (
                    <div className="w-full lg:w-[500px] bg-white dark:bg-[#0B1220] flex flex-col border-l border-slate-200 dark:border-white/5 relative z-20 shrink-0">
                        
                        {/* Compact Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="font-black text-xl text-slate-800 dark:text-white leading-none mb-1">{activeTable.name}</h2>
                                {activeTable.status === 'occupied' ? (
                                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={12}/> {activeTable.openTime ? Math.floor((Date.now() - activeTable.openTime.getTime()) / 60000) : 0} dk</span>
                                        <span className="flex items-center gap-1"><Coffee size={12}/> {activeTable.waiter || t('adission.unknown')}</span>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t('adission.emptyAdission')}</p>
                                )}
                            </div>
                            <button onClick={() => setActiveTable(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X size={18} strokeWidth={2}/>
                            </button>
                        </div>

                        {/* Top Half: Ordered Items (Limited Height) */}
                        <div className="h-[25vh] overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-transparent border-b border-slate-100 dark:border-white/5 shrink-0">
                            {activeTable.items.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400 font-medium text-sm">
                                    Sepette ürün yok.
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10 shadow-sm">
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-4 py-2">{t('adission.thProd')}</th>
                                            <th className="px-4 py-2 text-center">{t('adission.thQty')}</th>
                                            <th className="px-4 py-2 text-right">{t('adission.thTotal')}</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {activeTable.items.map((item: any, index: number) => (
                                            <tr key={`${item.id}-${index}`} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] group transition-all ${item.sent ? 'opacity-80' : 'bg-amber-50/50 dark:bg-amber-900/10'}`}>
                                                <td className="px-4 py-2.5 font-bold text-xs text-slate-700 dark:text-slate-200">
                                                    {item.name}
                                                    {!item.sent && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">{t('adission.statusNew')}</span>}
                                                </td>
                                                <td className={`px-4 py-2.5 text-center font-bold text-xs ${item.sent ? 'text-slate-500 dark:text-slate-400' : 'text-blue-600 dark:text-blue-400'}`}>{item.quantity}</td>
                                                <td className="px-4 py-2.5 text-right font-black text-xs text-slate-800 dark:text-white">{(item.price * item.quantity).toLocaleString()} ₺</td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Bottom Half: Split Menu Layout */}
                        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-900">
                            {/* Left: Category Tabs */}
                            <div className="w-32 border-r border-slate-200 dark:border-white/5 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800/50">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`w-full text-left px-3 py-4 border-b border-slate-100 dark:border-white/5 text-xs font-bold transition-colors ${
                                            activeCategory === cat.id 
                                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-600' 
                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Right: Products Grid */}
                            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-2">
                                    {MOCK_PRODUCTS.filter(p => p.category === activeCategory).map(prod => (
                                        <button 
                                            key={prod.id}
                                            onClick={() => handleAddItem(prod)}
                                            className="bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-white/5 hover:border-blue-300 rounded-lg p-3 text-left transition-all active:scale-95 flex flex-col justify-between h-20"
                                        >
                                            <span className="font-bold text-xs text-slate-700 dark:text-slate-300 leading-tight">{prod.name}</span>
                                            <span className="font-black text-sm text-blue-600 dark:text-blue-400">{prod.price} ₺</span>
                                        </button>
                                    ))}
                                    
                                    {MOCK_PRODUCTS.filter(p => p.category === activeCategory).length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-slate-400 text-xs font-medium">Bu kategoride ürün bulunamadı.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Totals & Action */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-xs text-slate-500 uppercase tracking-widest">{t('adission.generalTotal')}</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {calculateTotal(activeTable.items).toLocaleString()} ₺
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleSendToKitchen}
                                    disabled={kitchenStatus === 'printing' || !activeTable.items.some((i: any) => !i.sent)}
                                    className="flex-1 py-3 rounded-lg font-black bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 text-sm disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800"
                                >
                                    {kitchenStatus === 'printing' ? 'YAZDIRILIYOR...' : <><Printer size={16} strokeWidth={2.5}/> {t('adission.btnKitchen')}</>}
                                </button>
                                
                                <button 
                                    onClick={handleSendAdisyon}
                                    disabled={invoiceStatus === 'processing' || activeTable.items.length === 0}
                                    className="flex-1 py-3 rounded-lg font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                                >
                                    {invoiceStatus === 'processing' ? 'KAPATILIYOR...' : <><Send size={16} strokeWidth={2.5}/> {t('adission.btnCheckout')}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex w-[500px] bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-white/5 items-center justify-center flex-col p-10 text-center shrink-0">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mb-6">
                            <Utensils size={32} className="text-slate-300 dark:text-slate-500" />
                        </div>
                        <h3 className="font-black text-xl text-slate-700 dark:text-white mb-2 tracking-tight">{t('adission.standbyTitle')}</h3>
                        <p className="text-slate-500 text-sm">{t('adission.standbyDesc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
