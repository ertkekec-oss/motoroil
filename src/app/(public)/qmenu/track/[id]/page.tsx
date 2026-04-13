"use client";

import React, { useState, useEffect } from 'react';
import { Map, Motorbike, MapPin, Navigation, Clock, CheckCircle2, Phone, AlertCircle, ChefHat, Salad } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function OrderTrackingPage() {
    const params = useParams();
    const orderId = params.id || 'ONL-9842';

    // Mock order tracking states
    // In reality this would poll the backend or use WebSocket (Pusher.js)
    const [progress, setProgress] = useState(0); 
    const [statusText, setStatusText] = useState('Sipariş Alındı');

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setProgress(25);
            setStatusText('Mutfakta Hazırlanıyor');
        }, 3000);
        
        const timer2 = setTimeout(() => {
            setProgress(50);
            setStatusText('Kuryeye Teslim Edildi');
        }, 8000);

        const timer3 = setTimeout(() => {
            setProgress(75);
            setStatusText('Kurye Yolda');
        }, 12000);

        const timer4 = setTimeout(() => {
            setProgress(100);
            setStatusText('Teslim Edildi');
        }, 20000);

        return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); };
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B1220] font-sans pb-10">
            
            {/* HERD HEADER */}
            <div className="bg-slate-900 border-b border-white/10 px-6 py-5 shrink-0 sticky top-0 z-50">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-white text-xl font-black flex items-center gap-2">
                            Canlı Takip
                        </h1>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5 inline-block">Sipariş: #{orderId}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-xl mx-auto w-full px-4 lg:px-0 pt-6 space-y-6">
                
                {/* DYNAMIC STATUS BAR */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
                    <div className="relative z-10 flex items-center justify-between mb-8">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-md transition-colors duration-500 z-10 
                            ${progress >= 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <CheckCircle2 size={24} />
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-md transition-colors duration-500 z-10
                            ${progress >= 25 ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <ChefHat size={24} />
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-md transition-colors duration-500 z-10
                            ${progress >= 50 ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <Salad size={24} />
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-md transition-colors duration-500 z-10
                            ${progress >= 75 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <MapPin size={24} />
                        </div>
                    </div>
                    
                    {/* Progress Track Background */}
                    <div className="absolute top-12 left-10 right-10 h-1 bg-slate-100 dark:bg-slate-800 -z-0"></div>
                    {/* Animated Progress Fill */}
                    <div 
                        className="absolute top-12 left-10 h-1 bg-indigo-600 transition-all duration-1000 ease-in-out -z-0"
                        style={{ width: `calc(${progress}% - 2.5rem)` }}
                    ></div>

                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-all duration-300">
                            {statusText}
                        </h2>
                        {progress < 100 && (
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Tahmini Teslimat: <strong className="text-slate-900 dark:text-white">15:45</strong></p>
                        )}
                    </div>
                </div>

                {/* THE MAP (Simulated) */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden relative">
                    <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                        {/* Fake map texture/placeholder */}
                        <div className="absolute inset-0 bg-[#e2e8f0]/40 dark:bg-[#020617]/50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cpath d=\'...\' fill=\'%239C92AC\' fill-opacity=\'0.1\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
                        
                        {progress >= 50 ? (
                            <div className="z-10 flex flex-col items-center animate-bounce duration-1000">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl border-4 border-blue-500">
                                    <MapPin size={24} className="fill-current text-white"/>
                                </div>
                                <span className="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-lg mt-1">Can (Kurye)</span>
                            </div>
                        ) : (
                            <div className="z-10 text-center opacity-50">
                                <Map size={48} className="mx-auto text-slate-400 mb-2" strokeWidth={1.5}/>
                                <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Kurye Atanması Bekleniyor</p>
                            </div>
                        )}
                    </div>
                    
                    {progress >= 50 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                                    C
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">Can Özkan</div>
                                    <div className="text-xs text-slate-500">Kurye (34 ABC 12)</div>
                                </div>
                            </div>
                            <button className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center shadow-sm text-slate-700 dark:text-slate-300 hover:scale-105 active:scale-95 transition-transform">
                                <Phone size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* ORDER DETAILS */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/5">
                    <h3 className="font-black text-slate-900 dark:text-white mb-4">Sipariş Detayı</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-700 dark:text-slate-300">1x Dana Antrikot Izgara</span>
                            <span className="font-black text-slate-900 dark:text-white">450 ₺</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-700 dark:text-slate-300">2x San Sebastian</span>
                            <span className="font-black text-slate-900 dark:text-white">320 ₺</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center mt-2">
                            <span className="font-bold text-slate-500">Toplam Ödenen (PayTR)</span>
                            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">770 ₺</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
