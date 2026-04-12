import React, { useState } from 'react';
import { Search, Plus, Trash2, Printer, CheckCircle2, ChevronRight, X, Clock, Coffee, Utensils, UtensilsCrossed, Send } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function EAdisyonWorkspace({ products }: any) {
    const { showWarning, showSuccess } = useModal();

    const [activeZone, setActiveZone] = useState('salon');
    const [activeTable, setActiveTable] = useState<any>(null);
    const [invoiceStatus, setInvoiceStatus] = useState<'idle'|'processing'|'sent'>('idle');

    // MOCK TABLES
    const [tables, setTables] = useState([
        { id: 'S-01', name: 'Masa 1', zone: 'salon', status: 'occupied', openTime: new Date(Date.now() - 45*60000), items: [{ id: 1, name: 'Karışık Izgara', quantity: 2, price: 350, vatRate: 10 }, { id: 2, name: 'Ayran', quantity: 2, price: 50, vatRate: 10 }] },
        { id: 'S-02', name: 'Masa 2', zone: 'salon', status: 'empty', openTime: null, items: [] },
        { id: 'S-03', name: 'Masa 3', zone: 'salon', status: 'occupied', openTime: new Date(Date.now() - 15*60000), items: [{ id: 3, name: 'Künesfe', quantity: 1, price: 200, vatRate: 10 }] },
        { id: 'S-04', name: 'Masa 4', zone: 'salon', status: 'empty', openTime: null, items: [] },
        { id: 'T-01', name: 'Teras 1', zone: 'teras', status: 'empty', openTime: null, items: [] },
        { id: 'T-02', name: 'Teras 2', zone: 'teras', status: 'occupied', openTime: new Date(Date.now() - 120*60000), items: [{ id: 4, name: 'Türk Kahvesi', quantity: 4, price: 70, vatRate: 10 }] },
        { id: 'B-01', name: 'Bahçe 1', zone: 'bahce', status: 'empty', openTime: null, items: [] },
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
                    waiterName: "Kasiyer 1",
                    sessionStart: activeTable.openTime?.toISOString(),
                    lines: activeTable.items,
                    currency: "TRY"
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setInvoiceStatus('sent');
                showSuccess("E-Adisyon Başarıyla Yazdırıldı", `Belge GİB'e iletildi ve fiş çıkartılıyor.`);
                
                // Masayı boşalt (veya adisyon kesildi durumuna al)
                setTables(tables.map(t => t.id === activeTable.id ? { ...t, status: 'empty', items: [], openTime: null } : t));
                
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
    ];

    const handleAddItem = (prod: any) => {
        if (!activeTable) return;
        
        const updatedTable = { ...activeTable };
        if (updatedTable.status === 'empty') {
            updatedTable.status = 'occupied';
            updatedTable.openTime = new Date();
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
        }
        
        setActiveTable(updatedTable);
        setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
    };


    if (invoiceStatus === 'sent') {
         return (
            <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 h-full min-h-[500px]">
                <CheckCircle2 size={80} strokeWidth={1} className="text-orange-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">E-Adisyon Yazdırıldı</h2>
                <p className="text-slate-500 font-medium mb-8 text-center max-w-md">"{activeTable?.name}" hesabına ait elektronik adisyon başarıyla GİB'e iletildi ve mutfak fişi çıkarılıyor.</p>
                <div className="w-16 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 animate-pulse w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F4F6F8] dark:bg-[#0B1220] p-2 lg:p-4 overflow-hidden">
            <div className="flex-1 bg-white dark:bg-[#0f172a] rounded-xl shadow border border-[#D6DAE1] dark:border-white/10 flex flex-row overflow-hidden">
                
                {/* LEFT: TABLE GRID */}
                <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-white/5 relative z-10 transition-all duration-300">
                    
                    {/* Zone Selector */}
                    <div className="flex items-center gap-2 p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 overflow-x-auto custom-scrollbar shrink-0">
                        {['salon', 'teras', 'bahce'].map(zone => (
                            <button 
                                key={zone}
                                onClick={() => setActiveZone(zone)}
                                className={`px-4 py-2 rounded-lg font-black text-xs tracking-widest uppercase transition-all whitespace-nowrap ${activeZone === zone ? 'bg-orange-500 text-white shadow-md' : 'bg-white dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-white/10'}`}
                            >
                                {zone === 'salon' ? 'Salon (İç Mekan)' : zone === 'teras' ? 'Teras' : 'Bahçe'}
                            </button>
                        ))}
                    </div>

                    {/* Tables */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                            {tables.filter(t => t.zone === activeZone).map(table => {
                                const isOccupied = table.status === 'occupied';
                                const isActive = activeTable?.id === table.id;
                                const total = calculateTotal(table.items);
                                
                                return (
                                    <div 
                                        key={table.id}
                                        onClick={() => setActiveTable(table)}
                                        className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-200 group ${
                                            isActive 
                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)] scale-[0.98]' 
                                                : isOccupied 
                                                    ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-orange-400' 
                                                    : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="absolute top-3 right-3">
                                            {isOccupied ? (
                                                <span className="flex h-2.5 w-2.5">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                                </span>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                            )}
                                        </div>

                                        <UtensilsCrossed size={32} strokeWidth={1.5} className={`mb-3 ${isActive ? 'text-orange-500' : isOccupied ? 'text-slate-700 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`} />
                                        
                                        <h3 className={`font-black text-sm tracking-tight mb-1 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-white'}`}>
                                            {table.name}
                                        </h3>
                                        
                                        {isOccupied && (
                                            <div className="font-bold text-xs text-slate-500 mb-2">
                                                {total.toLocaleString()} ₺
                                            </div>
                                        )}
                                        
                                        <div className={`text-[10px] uppercase font-bold tracking-widest ${isActive ? 'text-orange-500/70' : isOccupied ? 'text-orange-500' : 'text-slate-400'}`}>
                                            {isOccupied ? 'DOLU' : 'BOŞ'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: ADISYON DETAILS & MENU */}
                {activeTable ? (
                    <div className="w-full lg:w-[450px] bg-slate-50 dark:bg-[#0B1220] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-20 shrink-0">
                        {/* Selected Table Header */}
                        <div className="p-4 bg-orange-500 text-white flex justify-between items-center rounded-tr-xl">
                            <div>
                                <h2 className="font-black text-xl tracking-tight leading-none">{activeTable.name}</h2>
                                <p className="text-orange-100 text-[11px] font-bold uppercase tracking-widest mt-1">GİB E-Adisyon</p>
                            </div>
                            <button onClick={() => setActiveTable(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Items List (The Bill) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                            <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden min-h-[300px]">
                                {activeTable.items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                                        <Coffee size={40} strokeWidth={1} className="mb-4 opacity-50" />
                                        <p className="font-bold text-sm text-slate-500">Adisyon şu an boş.</p>
                                        <p className="text-xs mt-1">Lütfen alt kısımdan ürün ekleyiniz.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <th className="p-3">Ürün</th>
                                                <th className="p-3 text-center">Adet</th>
                                                <th className="p-3 text-right">Tutar</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {activeTable.items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                                                    <td className="p-3 font-bold text-xs text-slate-800 dark:text-white">{item.name}</td>
                                                    <td className="p-3 text-center font-bold text-orange-600 dark:text-orange-400 text-xs">{item.quantity}</td>
                                                    <td className="p-3 text-right font-black text-xs text-slate-800 dark:text-white">{(item.price * item.quantity).toLocaleString()} ₺</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Quick Menu (Bottom grid) */}
                        <div className="h-48 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-3 overflow-y-auto custom-scrollbar">
                            <div className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-2">HIZLI MENÜ (Örnek)</div>
                            <div className="grid grid-cols-3 gap-2">
                                {MOCK_PRODUCTS.map(prod => (
                                    <button 
                                        key={prod.id}
                                        onClick={() => handleAddItem(prod)}
                                        className="bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-slate-200 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30 rounded-lg p-2 text-left transition-colors flex flex-col justify-between h-16 group"
                                    >
                                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 leading-tight">{prod.name}</span>
                                        <span className="font-black text-xs text-slate-900 dark:text-white group-hover:text-orange-500">{prod.price} ₺</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Totals & Print Button */}
                        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 p-4 shrink-0">
                            <div className="flex justify-between items-end mb-4">
                                <span className="font-black text-sm text-slate-500 uppercase tracking-widest">TOPLAM</span>
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                    {calculateTotal(activeTable.items).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} <span className="text-xl">₺</span>
                                </span>
                            </div>
                            
                            <button 
                                onClick={handleSendAdisyon}
                                disabled={invoiceStatus === 'processing' || activeTable.items.length === 0}
                                className="w-full py-4 rounded-xl font-black bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                {invoiceStatus === 'processing' ? (
                                    <>LÜTFEN BEKLEYİNİZ...</>
                                ) : (
                                    <><Printer size={18} /> GİB ADİSYON YAZDIR (Hesap İste)</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:flex w-[450px] bg-slate-50/50 dark:bg-[#0B1220]/50 border-l border-slate-200 dark:border-white/5 items-center justify-center flex-col p-8 text-center shrink-0">
                        <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mb-6">
                            <Utensils size={40} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="font-black text-xl text-slate-800 dark:text-white mb-2 tracking-tight">Masa Seçilmedi</h3>
                        <p className="text-slate-500 text-sm font-medium">Adisyon detaylarını görmek veya hesap yazdırmak için soldaki plandan bir masa seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
