import React, { useState } from 'react';
import { Search, Plus, Trash2, Printer, CheckCircle2, ChevronRight, X, Clock, Coffee, Utensils, UtensilsCrossed, Send, Users, Edit3 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function EAdisyonWorkspace({ products }: any) {
    const { showWarning, showSuccess } = useModal();

    const [activeZone, setActiveZone] = useState('salon');
    const [activeTable, setActiveTable] = useState<any>(null);
    const [invoiceStatus, setInvoiceStatus] = useState<'idle'|'processing'|'sent'>('idle');

    // MOCK TABLES
    const [tables, setTables] = useState([
        { id: 'S-01', name: 'Masa 1', zone: 'salon', capacity: 4, waiter: 'Ali', status: 'occupied', openTime: new Date(Date.now() - 45*60000), items: [{ id: 1, name: 'Karışık Izgara', quantity: 2, price: 350, vatRate: 10 }, { id: 2, name: 'Ayran', quantity: 2, price: 50, vatRate: 10 }] },
        { id: 'S-02', name: 'Masa 2', zone: 'salon', capacity: 2, waiter: null, status: 'empty', openTime: null, items: [] },
        { id: 'S-03', name: 'Masa 3', zone: 'salon', capacity: 6, waiter: 'Ayşe', status: 'occupied', openTime: new Date(Date.now() - 15*60000), items: [{ id: 3, name: 'Künefe', quantity: 1, price: 200, vatRate: 10 }] },
        { id: 'S-04', name: 'VIP 1', zone: 'salon', capacity: 8, waiter: null, status: 'empty', openTime: null, items: [] },
        { id: 'T-01', name: 'Teras 1', zone: 'teras', capacity: 4, waiter: null, status: 'empty', openTime: null, items: [] },
        { id: 'T-02', name: 'Teras 2', zone: 'teras', capacity: 4, waiter: 'Ali', status: 'occupied', openTime: new Date(Date.now() - 120*60000), items: [{ id: 4, name: 'Türk Kahvesi', quantity: 4, price: 70, vatRate: 10 }] },
        { id: 'B-01', name: 'Bahçe 1', zone: 'bahce', capacity: 10, waiter: null, status: 'empty', openTime: null, items: [] },
    ]);

    const calculateTotal = (items: any[]) => items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const handleSendAdisyon = async () => {
        if (!activeTable) return;
        if (activeTable.items.length === 0) {
            return showWarning("Adisyon Boş", "Masaya henüz ürün eklenmemiş.");
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
                showSuccess("E-Adisyon Başarıyla Yazdırıldı", `Belge GİB'e iletildi ve fiş çıkartılıyor.`);
                
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

    const MOCK_PRODUCTS = [
        { id: 101, name: 'Mercimek Çorbası', price: 90, category: 'Çorbalar' },
        { id: 102, name: 'İskender Kebap', price: 450, category: 'Ana Yemek' },
        { id: 103, name: 'Adana Dürüm', price: 250, category: 'Ana Yemek' },
        { id: 104, name: 'Kutu Kola', price: 60, category: 'İçecek' },
        { id: 105, name: 'Fırın Sütlaç', price: 120, category: 'Tatlı' },
        { id: 106, name: 'Sade Türk Kahvesi', price: 80, category: 'İçecek' },
    ];

    const handleAddItem = (prod: any) => {
        if (!activeTable) return;
        
        const updatedTable = { ...activeTable };
        if (updatedTable.status === 'empty') {
            updatedTable.status = 'occupied';
            updatedTable.openTime = new Date();
            updatedTable.waiter = 'Kasiyer M.';
        }

        const existingItem = updatedTable.items.find((i: any) => i.id === prod.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            updatedTable.items.push({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, vatRate: 10 });
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
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">E-Adisyon Yazdırıldı</h2>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-md">"{activeTable?.name}" hesabına ait elektronik adisyon başarıyla GİB'e iletildi ve mutfak fişi çıkarılıyor.</p>
                <div className="w-16 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F4F6F8] dark:bg-[#0B1220] p-4 lg:p-6 overflow-hidden">
            <div className="flex-1 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/50 dark:border-white/5 flex flex-row overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                
                {/* LEFT: TABLE GRID */}
                <div className="flex-1 flex flex-col relative z-10 transition-all duration-300">
                    
                    {/* Zone Selector - Sleek Pill Design */}
                    <div className="flex items-center gap-2 px-8 py-5 border-b border-slate-200/50 dark:border-white/5 shrink-0 bg-white/50 dark:bg-slate-900/50">
                        {['salon', 'teras', 'bahce'].map(zone => (
                            <button 
                                key={zone}
                                onClick={() => setActiveZone(zone)}
                                className={`px-6 py-2.5 rounded-full font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 whitespace-nowrap ${
                                    activeZone === zone 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                                    : 'bg-white/60 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm'
                                }`}
                            >
                                {zone === 'salon' ? 'SALON (İÇ MEKAN)' : zone === 'teras' ? 'TERAS' : 'BAHÇE'}
                            </button>
                        ))}
                    </div>

                    {/* Tables Grid */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {tables.filter(t => t.zone === activeZone).map(table => {
                                const isOccupied = table.status === 'occupied';
                                const isActive = activeTable?.id === table.id;
                                const total = calculateTotal(table.items);
                                
                                return (
                                    <div 
                                        key={table.id}
                                        onClick={() => setActiveTable(table)}
                                        className={`relative aspect-[4/3] rounded-3xl flex flex-col justify-between p-5 cursor-pointer transition-all duration-300 group overflow-hidden ${
                                            isActive 
                                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2 ring-offset-[#F4F6F8] dark:ring-offset-[#0B1220] scale-[0.98]' 
                                                : isOccupied 
                                                    ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1' 
                                                    : 'bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 hover:-translate-y-1 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-2 rounded-xl backdrop-blur-md ${isActive ? 'bg-white/20' : isOccupied ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                    <UtensilsCrossed size={18} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex space-x-0.5">
                                                    {[...Array(Math.min(table.capacity, 4))].map((_, i) => (
                                                        <Users key={i} size={8} className={isActive ? 'text-white/60' : isOccupied ? 'text-slate-400' : 'text-slate-300 opacity-50'} />
                                                    ))}
                                                </div>
                                            </div>

                                            {isOccupied ? (
                                                <span className="flex h-3 w-3 relative">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-white' : 'bg-blue-400'}`}></span>
                                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isActive ? 'bg-white' : 'bg-blue-500'}`}></span>
                                                </span>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-auto">
                                            <h3 className={`font-black text-lg tracking-tight leading-none mb-1 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                                {table.name}
                                            </h3>
                                            
                                            {isOccupied ? (
                                                <div className={`font-black text-sm flex items-center justify-between ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                                                    <span>{total.toLocaleString()} ₺</span>
                                                    {table.waiter && (
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                                            {table.waiter}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`text-[11px] uppercase font-black tracking-widest ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
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

                {/* RIGHT: ADISYON DETAILS & MENU */}
                {activeTable ? (
                    <div className="w-full lg:w-[420px] bg-white dark:bg-[#0B1220] flex flex-col border-l border-slate-200/50 dark:border-white/5 relative z-20 shrink-0 shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)]">
                        
                        {/* Header Details */}
                        <div className="p-6 pb-2 border-b border-slate-100 dark:border-white/5 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <Utensils size={24} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-2xl tracking-tighter text-slate-800 dark:text-white leading-none">{activeTable.name}</h2>
                                        <p className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mt-1">GİB E-Adisyon</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveTable(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X size={20} strokeWidth={2.5}/>
                                </button>
                            </div>
                            
                            {activeTable.status === 'occupied' && (
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-blue-500"/> 
                                        {activeTable.openTime ? Math.floor((Date.now() - activeTable.openTime.getTime()) / 60000) : 0} dk
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Coffee size={14} className="text-amber-500"/> 
                                        {activeTable.waiter || 'Belirsiz'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items List (The Bill) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 dark:bg-transparent">
                            {activeTable.items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-white/5">
                                        <Edit3 size={32} strokeWidth={1.5} className="text-slate-300" />
                                    </div>
                                    <p className="font-black text-base text-slate-500 dark:text-slate-400">Adisyon henüz boş</p>
                                    <p className="text-xs mt-1 font-medium max-w-[200px]">Aşağıdaki hızlı menüden ürün seçerek hesap oluşturmaya başlayın.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeTable.items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm group hover:border-blue-200 transition-colors">
                                            <div className="flex-1">
                                                <div className="font-black text-sm text-slate-800 dark:text-white mb-0.5">{item.name}</div>
                                                <div className="text-xs font-bold text-slate-400">{item.price} ₺ x {item.quantity}</div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="font-black text-lg text-slate-900 dark:text-white">{(item.price * item.quantity).toLocaleString()} <span className="text-sm text-slate-500">₺</span></div>
                                                <button onClick={() => handleRemoveItem(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={14} strokeWidth={2.5}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Menu (Bottom grid) */}
                        <div className="h-64 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800/50 p-5 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">HIZLI ÜRÜNLER</span>
                                <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-blue-700">Tüm Menü <ChevronRight size={12}/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {MOCK_PRODUCTS.map(prod => (
                                    <button 
                                        key={prod.id}
                                        onClick={() => handleAddItem(prod)}
                                        className="bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 rounded-2xl p-4 text-left transition-all active:scale-95 group flex flex-col justify-between min-h-[5rem]"
                                    >
                                        <span className="font-black text-xs text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 leading-tight">{prod.name}</span>
                                        <span className="font-black text-sm text-slate-900 dark:text-white mt-2">{prod.price} ₺</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Totals & Action */}
                        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-end mb-5">
                                <span className="font-black text-sm text-slate-500 uppercase tracking-widest">GENEL TOPLAM</span>
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                    {calculateTotal(activeTable.items).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} <span className="text-2xl text-slate-400">₺</span>
                                </span>
                            </div>
                            
                            <button 
                                onClick={handleSendAdisyon}
                                disabled={invoiceStatus === 'processing' || activeTable.items.length === 0}
                                className="w-full py-5 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {invoiceStatus === 'processing' ? (
                                    <>İŞLEM YAPILIYOR...</>
                                ) : (
                                    <><Send size={18} strokeWidth={2.5}/> E-ADİSYON OLUŞTUR VE YAZDIR</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex w-[420px] bg-slate-50/50 dark:bg-[#0B1220]/50 border-l border-slate-100 dark:border-white/5 items-center justify-center flex-col p-10 text-center shrink-0">
                        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 rounded-full border border-blue-500/20 scale-110"></div>
                            <div className="absolute inset-0 rounded-full border border-blue-500/10 scale-125"></div>
                            <Utensils size={48} strokeWidth={1} className="text-blue-300 dark:text-blue-500/50" />
                        </div>
                        <h3 className="font-black text-2xl text-slate-800 dark:text-white mb-3 tracking-tighter">Masa Seçimi</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[250px]">Sipariş girmek, adisyon detaylarını incelemek veya hesap yazdırmak için soldaki kareden güncel bir masa seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
