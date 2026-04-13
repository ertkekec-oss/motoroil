"use client";

import React, { useState } from 'react';
import { MapPin, Phone, CheckCircle2, ChevronRight, Navigation, Package, ShieldAlert } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function CourierApp() {
    const { showConfirm, showSuccess } = useModal();
    const [orderState, setOrderState] = useState<'WAITING' | 'PICKED_UP' | 'ON_WAY' | 'ARRIVED'>('WAITING');

    const handleAction = () => {
        if (orderState === 'WAITING') {
            setOrderState('PICKED_UP');
            showSuccess('Sipariş Alındı', 'Paketi teslim aldınız. Güvenli sürüşler!');
        } else if (orderState === 'PICKED_UP') {
            setOrderState('ON_WAY');
        } else if (orderState === 'ON_WAY') {
            setOrderState('ARRIVED');
        } else if (orderState === 'ARRIVED') {
            showConfirm('Müşteriye Teslim', 'Siparişi müşteriye sağlam teslim ettiğinizi onaylıyor musunuz?', () => {
                setOrderState('WAITING');
                showSuccess('Tebrikler!', 'Teslimat başarıyla tamamlandı. Yenisi bekleniyor...');
            });
        }
    };

    const getPrimaryActionText = () => {
        switch (orderState) {
            case 'WAITING': return 'SİPARİŞİ TESLİM AL';
            case 'PICKED_UP': return 'YOLA ÇIK (GPS BAŞLAT)';
            case 'ON_WAY': return 'ADRESE VARDIM';
            case 'ARRIVED': return 'MÜŞTERİYE TESLİM ET';
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-900 text-white font-sans overflow-hidden">
            
            {/* ÜST BİLGİ BANDI */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 shrink-0 bg-slate-900 z-10 shadow-sm relative">
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-500"></span> 
                        Kurye Panosu
                    </h1>
                    <span className="text-sm font-medium text-slate-400">Can Özkan (Motosiklet)</span>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <ShieldAlert size={20} className="text-white"/>
                </div>
            </div>

            {/* ANA İÇERİK - TAM EKRAN KART */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                {orderState === 'WAITING' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                        <Package size={64} className="mb-4 text-slate-600 outline-none" strokeWidth={1} />
                        <h2 className="text-2xl font-black text-slate-400 mb-2">Sipariş Bekleniyor...</h2>
                        <p className="text-slate-500 font-medium px-8">Dispatch merkezinin sana yeni bir paket atamasını bekliyorsun.</p>
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-800 rounded-3xl p-6 flex flex-col relative overflow-hidden border border-white/5 shadow-2xl">
                        
                        {orderState === 'ON_WAY' && (
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400 animate-pulse"></div>
                        )}

                        <div className="flex items-center justify-between mb-8">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-black text-sm rounded-lg uppercase tracking-widest">
                                #ONL-9842
                            </span>
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                {orderState === 'PICKED_UP' ? 'Paket Sizde' : orderState === 'ON_WAY' ? 'Yoldasınız' : 'Adreste'}
                            </span>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Teslimat Adresi</h3>
                                <p className="text-2xl font-black leading-tight border-l-4 border-emerald-500 pl-4 py-1">
                                    Kozyatağı Mah, Bayar Cd.
                                    Gül Apt. No: 3 Daire: 12
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 bg-emerald-500/20 text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-emerald-500/20 active:scale-95 transition-transform">
                                    <Navigation size={18} /> Harita
                                </button>
                                <button className="flex-1 bg-blue-500/20 text-blue-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-blue-500/20 active:scale-95 transition-transform">
                                    <Phone size={18} /> Müşteri
                                </button>
                            </div>

                            <div className="bg-slate-900 rounded-2xl p-4 border border-white/5">
                                <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Sipariş Notu</h3>
                                <p className="text-slate-300 font-medium italic">"Zili çalmayın, bebek uyuyor. Kapıya bırakıp arayabilirsiniz."</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <span className="text-sm font-bold text-slate-400">Tahsilat:</span>
                                <span className="text-2xl font-black text-rose-400">ONLINE ÖDENDİ</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ALT SABİT AKSİYON BUTONU (Swipe hissiyatlı) */}
            <div className="p-4 bg-slate-900 border-t border-white/10 shrink-0 pb-8">
                <button 
                    onClick={handleAction}
                    className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-2xl
                    ${orderState === 'WAITING' ? 'bg-indigo-600 text-white' : 
                      orderState === 'PICKED_UP' ? 'bg-yellow-500 text-black' : 
                      orderState === 'ON_WAY' ? 'bg-orange-500 text-white' : 
                      'bg-emerald-500 text-white'}`}
                >
                    {orderState === 'ARRIVED' && <CheckCircle2 size={24} />}
                    {orderState === 'ON_WAY' && <MapPin size={24} />}
                    {getPrimaryActionText()}
                    {orderState !== 'ARRIVED' && orderState !== 'ON_WAY' && <ChevronRight size={24} />}
                </button>
            </div>
        </div>
    );
}
