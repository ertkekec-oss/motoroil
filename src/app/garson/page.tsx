"use client";

import React, { useState, useEffect } from 'react';
import { 
    Grid2X2, 
    BellRing, 
    User, 
    UtensilsCrossed, 
    Search,
    ChevronLeft,
    Plus,
    Minus,
    CheckCircle2,
    Clock,
    Flame,
    Coffee,
    Pizza,
    IceCream,
    Send,
    Trash2
} from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

// --- MOCK DATA ---
const ZONES = ['Tümü', 'Salon', 'Teras', 'Bahçe'];

const INITIAL_TABLES = [
    { id: 'S-01', name: 'Masa 1', zone: 'Salon', status: 'occupied', total: 450, time: 25 },
    { id: 'S-02', name: 'Masa 2', zone: 'Salon', status: 'empty', total: 0, time: 0 },
    { id: 'S-03', name: 'Masa 3', zone: 'Salon', status: 'occupied', total: 1250, time: 80 },
    { id: 'S-04', name: 'VIP 1', zone: 'Salon', status: 'empty', total: 0, time: 0 },
    { id: 'T-01', name: 'Teras 1', zone: 'Teras', status: 'empty', total: 0, time: 0 },
    { id: 'T-02', name: 'Teras 2', zone: 'Teras', status: 'occupied', total: 280, time: 10 },
    { id: 'B-01', name: 'Bahçe 1', zone: 'Bahçe', status: 'empty', total: 0, time: 0 },
];

const MENU_CATEGORIES = [
    { id: 'all', name: 'Tümü', icon: UtensilsCrossed },
    { id: 'hot', name: 'Sıcaklar', icon: Flame },
    { id: 'cold', name: 'İçecekler', icon: Coffee },
    { id: 'main', name: 'Ana Yemek', icon: Pizza },
    { id: 'dessert', name: 'Tatlı', icon: IceCream },
];

const MOCK_PRODUCTS = [
    { id: 1, name: 'İskender', price: 450, category: 'main', image: '🥩' },
    { id: 2, name: 'Adana Dürüm', price: 250, category: 'main', image: '🌯' },
    { id: 3, name: 'Mercimek Çorbası', price: 90, category: 'hot', image: '🥣' },
    { id: 4, name: 'Kola', price: 60, category: 'cold', image: '🥤' },
    { id: 5, name: 'Ayran', price: 45, category: 'cold', image: '🥛' },
    { id: 6, name: 'Künefe', price: 200, category: 'dessert', image: '🍮' },
    { id: 7, name: 'Türk Kahvesi', price: 70, category: 'hot', image: '☕' },
];

export default function WaiterApp() {
    const { showSuccess, showWarning, showConfirm } = useModal();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Routing State
    const [view, setView] = useState<'tables' | 'order' | 'notifications'>('tables');
    
    // Data State
    const [tables, setTables] = useState(INITIAL_TABLES);
    const [activeZone, setActiveZone] = useState('Tümü');
    const [selectedTable, setSelectedTable] = useState<any>(null);
    const [cart, setCart] = useState<{product: any, qty: number}[]>([]);
    
    // Menu State
    const [activeCategory, setActiveCategory] = useState('all');
    const [menuSearch, setMenuSearch] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // --- HANDLERS ---
    const handleTableClick = (table: any) => {
        setSelectedTable(table);
        setCart([]); // Clear cart for new table draft
        setView('order');
    };

    const handleAddToCart = (product: any) => {
        setCart(prev => {
            const exists = prev.find(item => item.product.id === product.id);
            if (exists) {
                return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const handleUpdateQty = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const handleSendOrderToKitchen = () => {
        if (cart.length === 0) return showWarning("Hata", "Sipariş listesi boş!");
        
        showConfirm("Siparişi İlet", "Siparişleri mutfağa göndermek istiyor musunuz?", () => {
            // Optimistic update
            setTables(prev => prev.map(t => {
                if (t.id === selectedTable.id) {
                    const newTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);
                    return { ...t, status: 'occupied', total: t.total + newTotal, time: t.time === 0 ? 1 : t.time };
                }
                return t;
            }));
            
            showSuccess("Sipariş İletildi", "Sipariş mutfağa başarılı şekilde gönderildi.");
            setView('tables');
            setSelectedTable(null);
            setCart([]);
        });
    };

    const handleCloseTable = () => {
        showConfirm("Hesabı Kapat", `${selectedTable.name} için hesabı kapatmak istediğinize emin misiniz?`, () => {
             setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'empty', total: 0, time: 0 } : t));
             showSuccess("Hesap Kapatıldı", "Masa başarıyla boşaltıldı.");
             setView('tables');
             setSelectedTable(null);
        });
    };


    // --- VIEWS ---
    const renderHeader = () => (
        <header className="px-5 pt-12 pb-4 bg-gradient-to-b from-[#0B1220] to-transparent shrink-0 flex items-center justify-between z-10 relative">
            <div>
                <h1 className="text-white font-black tracking-tighter text-2xl flex items-center gap-2">
                    <span className="text-blue-500">Peri</span>Waiter <span className="text-blue-500/20">|</span>
                </h1>
                <p className="text-slate-400 text-xs font-medium mt-0.5">Ali Yılmaz • {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center relative shadow-lg shadow-black/50">
                <User size={18} className="text-blue-400" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
            </div>
        </header>
    );

    const renderBottomNav = () => (
        <div className="bg-[#0B1220]/90 backdrop-blur-2xl border-t border-white/5 p-4 pb-8 shrink-0 flex justify-around items-center absolute bottom-0 w-full z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <button onClick={() => setView('tables')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'tables' ? 'text-blue-500 scale-110' : 'text-slate-500'}`}>
                <Grid2X2 size={24} strokeWidth={view === 'tables' ? 2.5 : 2} />
                <span className="text-[10px] font-black tracking-wider uppercase">Masalar</span>
            </button>
            
            {/* Super Button for QR Scan / Quick Action could go here */}
            <div className="relative -top-6">
                <button className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border-4 border-[#070b14] active:scale-95 transition-transform">
                    <Search size={28} strokeWidth={2.5} />
                </button>
            </div>

            <button onClick={() => setView('notifications')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'notifications' ? 'text-blue-500 scale-110' : 'text-slate-500'}`}>
                <div className="relative">
                    <BellRing size={24} strokeWidth={view === 'notifications' ? 2.5 : 2} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0B1220]"></span>
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase">Mutfak</span>
            </button>
        </div>
    );

    const renderTablesView = () => {
        const filteredTables = tables.filter(t => activeZone === 'Tümü' || t.zone === activeZone);

        return (
            <div className="flex-1 flex flex-col min-h-0 relative">
                {renderHeader()}
                
                {/* Zones Filter */}
                <div className="px-5 flex gap-3 overflow-x-auto custom-scrollbar pb-2 shrink-0">
                    {ZONES.map(z => (
                        <button 
                            key={z} 
                            onClick={() => setActiveZone(z)}
                            className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black tracking-wider uppercase transition-all duration-300 ${
                                activeZone === z 
                                ? 'bg-white text-[#0B1220] shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                                : 'bg-[#131b2c] text-slate-400 border border-white/5 active:bg-[#1c263d]'
                            }`}
                        >
                            {z}
                        </button>
                    ))}
                </div>

                {/* Table Grid */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {filteredTables.map(table => (
                            <div 
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`relative rounded-[1.5rem] p-5 flex flex-col justify-between aspect-square transition-all active:scale-95 overflow-hidden ${
                                    table.status === 'occupied' 
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-800 border bg-blue-500 border-white/10 shadow-xl shadow-blue-500/20' 
                                        : 'bg-[#131b2c] border border-white/5'
                                }`}
                            >
                                {/* Glow Effect for occupied */}
                                {table.status === 'occupied' && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
                                )}

                                <div>
                                    <h3 className={`font-black tracking-tight text-xl mb-1 ${table.status === 'occupied' ? 'text-white' : 'text-slate-200'}`}>
                                        {table.name}
                                    </h3>
                                    <p className={`text-[10px] font-bold tracking-widest uppercase ${table.status === 'occupied' ? 'text-blue-200' : 'text-slate-500'}`}>
                                        {table.zone}
                                    </p>
                                </div>
                                
                                {table.status === 'occupied' && (
                                    <div>
                                        <div className="text-white text-2xl font-black tracking-tighter shadow-sm mb-1">{table.total.toLocaleString()} ₺</div>
                                        <div className="flex items-center gap-1 text-blue-200 text-[10px] font-bold uppercase tracking-wider bg-black/20 w-max px-2 py-1 rounded-lg">
                                            <Clock size={10} /> {table.time} DK
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {renderBottomNav()}
            </div>
        );
    };

    const renderOrderView = () => {
        if (!selectedTable) return null;

        const filteredMenu = MOCK_PRODUCTS.filter(p => 
            (activeCategory === 'all' || p.category === activeCategory) &&
            p.name.toLowerCase().includes(menuSearch.toLowerCase())
        );

        const cartTotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.qty), 0);
        const isCartEmpty = cart.length === 0;

        return (
            <div className="flex-1 flex flex-col min-h-0 bg-[#070b14] relative z-20">
                {/* Header Navbar */}
                <div className="px-4 pt-12 pb-4 bg-[#0B1220] border-b border-white/5 flex items-center justify-between shrink-0">
                    <button onClick={() => { setView('tables'); setSelectedTable(null); }} className="w-10 h-10 rounded-2xl bg-[#131b2c] flex items-center justify-center text-slate-300">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-white font-black text-xl tracking-tight">{selectedTable.name}</h2>
                        <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Adisyon & Menü</p>
                    </div>
                    {/* Ghost button to balance flex layout */}
                    <div className="w-10"></div>
                </div>

                {/* Left/Right Split Layout in Mobile context? No, Stacked layout is better.
                    Top half: Menu, Bottom Half: Cart Panel sliding up */}
                
                <div className="flex-1 overflow-y-auto pb-48">
                    {/* Search Bar */}
                    <div className="px-4 mt-4 mb-4 relative">
                        <input 
                            type="text" 
                            placeholder="Ürün Ara..."
                            value={menuSearch}
                            onChange={(e) => setMenuSearch(e.target.value)}
                            className="w-full h-12 bg-[#131b2c] text-white rounded-2xl pl-12 pr-4 border border-white/5 focus:border-blue-500 focus:outline-none placeholder:text-slate-500 font-medium"
                        />
                        <Search className="absolute left-8 top-3.5 text-slate-500" size={20} />
                    </div>

                    {/* Category Tabs */}
                    <div className="px-4 flex gap-2 overflow-x-auto custom-scrollbar mb-6 snap-x">
                        {MENU_CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <button 
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`snap-start shrink-0 flex items-center gap-2 px-4 py-3 rounded-[1rem] border font-bold text-xs uppercase tracking-wider transition-all
                                        ${activeCategory === cat.id 
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                            : 'bg-[#131b2c] border-white/5 text-slate-400'
                                        }`}
                                >
                                    <Icon size={16} /> {cat.name}
                                </button>
                            )
                        })}
                    </div>

                    {/* Menu Grid */}
                    <div className="px-4 grid grid-cols-2 gap-3">
                        {filteredMenu.map(prod => (
                            <button 
                                key={prod.id}
                                onClick={() => handleAddToCart(prod)}
                                className="bg-[#131b2c] border border-white/5 p-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <div className="text-4xl">{prod.image}</div>
                                <div className="text-center">
                                    <div className="text-white font-bold text-sm mb-1 line-clamp-1">{prod.name}</div>
                                    <div className="text-blue-400 font-black">{prod.price} ₺</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sliding Cart Panel Overlay */}
                <div className="absolute bottom-0 w-full bg-[#0B1220] border-t border-white/10 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pb-8 pt-2 px-5 max-h-[60vh] flex flex-col">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4"></div>
                    
                    <div className="flex justify-between items-end mb-4 shrink-0">
                        <h3 className="text-white font-black text-xl tracking-tighter">İlave Edilecekler</h3>
                        <span className="text-slate-400 text-xs font-bold bg-[#131b2c] px-3 py-1 rounded-full">{cart.reduce((a,b)=>a+b.qty,0)} Ürün</span>
                    </div>

                    {isCartEmpty ? (
                        <div className="py-6 text-center text-slate-500 text-sm font-medium">Listede yeni ürün yok. Menüden ürün seçin.</div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                            {cart.map(item => (
                                <div key={item.product.id} className="flex justify-between items-center bg-[#131b2c] rounded-2xl p-3 border border-white/5">
                                    <div>
                                        <div className="text-white font-bold text-sm">{item.product.name}</div>
                                        <div className="text-slate-400 text-xs font-medium">{item.product.price} ₺</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-[#070b14] rounded-full px-2 py-1 border border-white/5">
                                        <button onClick={() => handleUpdateQty(item.product.id, -1)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white active:bg-white/20"><Minus size={14} strokeWidth={3}/></button>
                                        <span className="text-white font-black w-4 text-center">{item.qty}</span>
                                        <button onClick={() => handleUpdateQty(item.product.id, 1)} className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 active:bg-blue-500"><Plus size={14} strokeWidth={3}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-auto shrink-0 flex items-center gap-3">
                        <button 
                            onClick={handleCloseTable}
                            disabled={selectedTable.status === 'empty' && isCartEmpty}
                            className="bg-[#131b2c] text-white border border-rose-500/30 w-16 h-16 rounded-2xl flex items-center justify-center hover:bg-rose-500/10 active:scale-95 transition-all text-rose-500 disabled:opacity-30"
                        >
                            <Trash2 size={24} />
                        </button>
                        
                        <button 
                            onClick={handleSendOrderToKitchen}
                            disabled={isCartEmpty}
                            className={`flex-1 h-16 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-95 ${
                                isCartEmpty ? 'bg-[#131b2c] border border-white/5 text-slate-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                            }`}
                        >
                            <span className="font-black tracking-wider uppercase text-sm flex items-center gap-2">
                                <Send size={18} /> {isCartEmpty ? 'SEPET BOŞ' : 'SİPARİŞİ YAZDIR'}
                            </span>
                            {!isCartEmpty && <span className="font-black text-lg">{cartTotal.toLocaleString()} ₺</span>}
                        </button>
                    </div>
                </div>
            </div>
        )
    };

    return (
        <>
            {view === 'tables' && renderTablesView()}
            {view === 'order' && renderOrderView()}
            {view === 'notifications' && (
                <div className="flex-1 flex flex-col min-h-0 items-center justify-center">
                    {renderHeader()}
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 pb-32">
                        <BellRing size={48} className="mb-4 opacity-50 text-blue-500" />
                        <h2 className="font-black text-xl text-white">Bildirim Yok</h2>
                        <p className="text-sm mt-2">Mutfaktan gelen mesajlar burada görünür.</p>
                    </div>
                    {renderBottomNav()}
                </div>
            )}
        </>
    );
}
