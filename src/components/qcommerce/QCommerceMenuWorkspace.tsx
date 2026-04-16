"use client";

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Minus, CreditCard, ChevronRight, Utensils, Clock, MapPin, Star, AlertCircle } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

type MenuItem = {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    popular?: boolean;
};

type Category = {
    id: string;
    name: string;
    icon: string;
};

const CATEGORIES: Category[] = [
    { id: 'c-1', name: 'Popüler', icon: '⭐' },
    { id: 'c-2', name: 'Ana Yemekler', icon: '🥩' },
    { id: 'c-3', name: 'Burgerler', icon: '🍔' },
    { id: 'c-4', name: 'Salatalar', icon: '🥗' },
    { id: 'c-5', name: 'Tatlılar', icon: '🍰' },
    { id: 'c-6', name: 'İçecekler', icon: '🥤' }
];

const MENU_ITEMS: MenuItem[] = [
    { id: 'm-1', categoryId: 'c-2', name: 'Dana Antrikot Izgara', description: 'Özel baharatlarla marine edilmiş 250gr ince dilim antrikot, patates püresi ve sote sebzeler ile.', price: 450, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400', popular: true },
    { id: 'm-2', categoryId: 'c-3', name: 'Smash Burger (Double)', description: 'Çift katlı özel kıyma, cheddar peyniri, karamelize soğan, patates kızartması ve trüflü mayonez.', price: 280, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400', popular: true },
    { id: 'm-3', categoryId: 'c-4', name: 'Kinoa & Peynir Salatası', description: 'Akdeniz yeşillikleri, haşlanmış kinoa, keçi peyniri, ceviz, çilek dilimleri ve balzamik sos.', price: 210, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400' },
    { id: 'm-4', categoryId: 'c-5', name: 'San Sebastian Cheesecake', description: 'Günlük taze üretilen, üstü yanık, içi akışkan İspanyol tarzı peynirli kek.', price: 160, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400', popular: true },
    { id: 'm-5', categoryId: 'c-6', name: 'Orman Meyveli Smoothie', description: 'Böğürtlen, yaban mersini, çilek, süt ve buz.', price: 120, image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=400' },
    { id: 'm-6', categoryId: 'c-2', name: 'Izgara Somon Dilimi', description: 'Kuşkonmaz yatağında, limon ve zeytinyağı soslu fırınlanmış Norveç somonu.', price: 520, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400' }
];

interface QCommerceMenuWorkspaceProps {
    tenantSlug?: string;
}

export default function QCommerceMenuWorkspace({ tenantSlug }: QCommerceMenuWorkspaceProps) {
    const { showSuccess, showConfirm } = useModal();
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<{item: MenuItem, qty: number}[]>([]);
    
    // Smooth payment state
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.item.id === item.id);
            if (existing) {
                return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { item, qty: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => {
            const existing = prev.find(i => i.item.id === itemId);
            if (!existing) return prev;
            if (existing.qty === 1) {
                return prev.filter(i => i.item.id !== itemId);
            }
            return prev.map(i => i.item.id === itemId ? { ...i, qty: i.qty - 1 } : i);
        });
    };

    const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + (i.item.price * i.qty), 0), [cart]);
    const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.qty, 0), [cart]);

    const filteredItems = useMemo(() => {
        let items = MENU_ITEMS;
        if (activeCategory === 'c-1') items = items.filter(i => i.popular);
        else if (activeCategory !== 'all') items = items.filter(i => i.categoryId === activeCategory);
        
        if (searchQuery) items = items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return items;
    }, [activeCategory, searchQuery]);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        // Simulate payment gateway delay
        setTimeout(() => {
            setOrderSuccess(true);
            setIsCheckingOut(false);
            setCart([]); // clear cart
            showSuccess('Sipariş Alındı!', 'Ödemeniz başarıyla gerçekleşti. Siparişiniz doğrudan mutfağa iletildi.');
        }, 2000);
    };

    if (orderSuccess) {
        return (
            <div className="flex-1 w-full h-full bg-[#f8fafc] dark:bg-[#0B1220] flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/5 text-center px-8">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Utensils size={48} strokeWidth={2.5}/>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Siparişiniz Yolda!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                        Siparişiniz başarıyla alındı ve mutfağa iletildi (Sipariş No: #ONL-9842). Kuryemiz yola çıktığında SMS ile takip linki gönderilecektir.
                    </p>
                    <button 
                        onClick={() => setOrderSuccess(false)}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                        Menüye Dön
                    </button>
                    <div className="mt-6 flex justify-center items-center gap-2 text-slate-400">
                        <Clock size={16} /> Yaklaşık Teslimat: <strong className="text-slate-900 dark:text-white">35-45 Dk</strong>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full min-h-full bg-slate-50 dark:bg-[#0B1220] flex flex-col font-sans transition-colors duration-300">
            {/* HERO HEADER - BORDERLESS */}
            <div className="w-full bg-white dark:bg-[#0f172a] pb-6 shrink-0 z-10 shadow-sm relative pt-6 lg:pt-10">
                <div className="absolute top-0 w-full h-full bg-gradient-to-r from-orange-500/5 to-rose-500/5 pointer-events-none"></div>
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 relative">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">MotorOil <span className="text-orange-500">Cafe.</span></h1>
                            <div className="flex items-center gap-4 text-[13px] font-bold text-slate-500">
                                <span className="flex items-center gap-1 text-emerald-600"><Star size={16} className="fill-current"/> 4.9 (24K+)</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1"><Clock size={16} /> 30-45 Dk</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="flex items-center gap-1"><MapPin size={16} /> Canlı Kurye</span>
                            </div>
                        </div>
                        <div className="hidden lg:flex relative w-80">
                            <input 
                                type="text"
                                placeholder="Pizzalar, burgerler..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl h-12 pl-12 pr-4 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                            />
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                        </div>
                    </div>

                    {/* CATEGORY PILLS */}
                    <div className="flex overflow-x-auto gap-3 custom-scrollbar pb-2 pt-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                        <button 
                            onClick={() => setActiveCategory('all')}
                            className={`shrink-0 h-10 lg:h-12 px-5 lg:px-6 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm
                            ${activeCategory === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-slate-300'}`}
                        >
                            Tümü
                        </button>
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`shrink-0 h-10 lg:h-12 px-5 lg:px-6 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-sm
                                ${activeCategory === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-slate-300'}`}
                            >
                                <span className="text-lg leading-none">{cat.icon}</span> {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 lg:px-8 py-6 lg:py-8 flex gap-8">
                
                {/* MENU GRID */}
                <div className="flex-1 min-w-0">
                    {searchQuery && (
                        <h3 className="text-lg font-bold mb-4 text-slate-500">"{searchQuery}" için sonuçlar ({filteredItems.length})</h3>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="group bg-white dark:bg-[#1e293b] rounded-[24px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer" onClick={() => addToCart(item)}>
                                {/* Image Area */}
                                <div className="h-48 w-full relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    {/* Use a real placeholder or external image. No layout shift. */}
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {item.popular && (
                                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                            <Star size={12} className="fill-current"/> Çok Satan
                                        </div>
                                    )}
                                    <button 
                                        className="absolute bottom-4 right-4 w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg text-slate-900 dark:text-white hover:scale-110 active:scale-95 transition-transform"
                                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                    >
                                        <Plus size={24} strokeWidth={3}/>
                                    </button>
                                </div>
                                {/* Content Area */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-4 mb-2">
                                        <h3 className="font-bold text-[17px] leading-snug text-slate-900 dark:text-white line-clamp-2">{item.name}</h3>
                                        <span className="font-black text-lg shrink-0 text-slate-900 dark:text-white">{item.price} ₺</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed font-medium">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredItems.length === 0 && (
                        <div className="text-center py-20">
                            <Utensils size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">Ürün bulunamadı</h3>
                        </div>
                    )}
                </div>

                {/* DESKTOP CART SIDEBAR */}
                <div className="hidden lg:flex w-[400px] shrink-0 flex-col gap-6 sticky top-8 h-[calc(100vh-140px)]">
                    <div className="bg-white dark:bg-[#1e293b] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col overflow-hidden w-full h-full">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/30">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <ShoppingBag size={24} className="text-orange-500"/>
                                Sepetim
                            </h2>
                            {cartCount > 0 && <span className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center text-sm">{cartCount}</span>}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                           {cart.length === 0 ? (
                               <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                                   <ShoppingBag size={64} className="text-slate-300 dark:text-slate-600 mb-4" strokeWidth={1}/>
                                   <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Sepetiniz Boş</p>
                                   <p className="text-xs text-slate-400 mt-2">Menüden muhteşem lezzetler eklemeye başlayın.</p>
                               </div>
                           ) : (
                               <div className="p-4 space-y-4">
                                   {cart.map((c, i) => (
                                       <div key={i} className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
                                           <div className="flex-1 flex flex-col">
                                               <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">{c.item.name}</h4>
                                               <span className="font-black text-orange-500 text-sm mb-3">{c.item.price} ₺</span>
                                               <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl w-fit p-1 border border-slate-200 dark:border-white/10 shadow-sm mt-auto">
                                                    <button onClick={() => removeFromCart(c.item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"><Minus size={16}/></button>
                                                    <span className="w-4 text-center font-bold text-sm dark:text-white">{c.qty}</span>
                                                    <button onClick={() => addToCart(c.item)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"><Plus size={16}/></button>
                                               </div>
                                           </div>
                                           <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 p-0">
                                                <img src={c.item.image} alt="" className="w-full h-full object-cover" />
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 shrink-0 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-slate-500 font-bold">
                                        <span>Ara Toplam</span>
                                        <span>{cartTotal} ₺</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-500 font-bold">
                                        <span>Gönderim Ücreti</span>
                                        <span>0 ₺</span>
                                    </div>
                                    <div className="w-full h-px border-t border-dashed border-slate-300 dark:border-slate-700 my-2"></div>
                                    <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white">
                                        <span>Toplam</span>
                                        <span>{cartTotal} ₺</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full py-4 rounded-[16px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                                >
                                    {isCheckingOut ? <span className="animate-pulse">ÖDEME ALINIYOR...</span> : <><CreditCard size={20}/> ÖDEMEYE GEÇ</>}
                                </button>
                                <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                    Güvenli Ödeme Altyapısı - PayTR
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* MOBILE FLOATING CART */}
            {cartCount > 0 && !isCheckingOut && (
                <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 fade-in">
                    <button 
                        onClick={handleCheckout}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-3xl shadow-2xl flex items-center justify-between font-black border border-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center">
                                {cartCount}
                            </div>
                            <span className="text-lg">Sepeti Onayla</span>
                        </div>
                        <span className="text-xl">{cartTotal} ₺</span>
                    </button>
                </div>
            )}
        </div>
    );
}
