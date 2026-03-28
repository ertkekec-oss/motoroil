
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileRoutesPage() {
    const router = useRouter();
    const [routes, setRoutes] = useState<any[]>([]);
    const [targets, setTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'routes' | 'orders'>('routes');
    const [orders, setOrders] = useState<any[]>([]);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [routesRes, targetsRes, ordersRes] = await Promise.all([
                    fetch('/api/field-sales/routes?mine=true'),
                    fetch('/api/staff/targets?mine=true'),
                    fetch('/api/field-sales/orders/today')
                ]);

                if (routesRes.ok) {
                    const data = await routesRes.json();
                    setRoutes(Array.isArray(data) ? data : []);
                }

                if (targetsRes.ok) {
                    const data = await targetsRes.json();
                    setTargets(Array.isArray(data) ? data : []);
                }

                if (ordersRes.ok) {
                    const data = await ordersRes.json();
                    setOrders(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const today = new Date().toISOString().split('T')[0];
    const todayRoutes = routes.filter(r => new Date(r.date).toISOString().split('T')[0] === today);
    const otherRoutes = routes.filter(r => new Date(r.date).toISOString().split('T')[0] !== today);

    if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="p-4 space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-black text-white px-2">Rotalarım & İşlemler</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] px-2 mt-1">Saha Personel Paneli</p>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-[#161b22] p-1.5 rounded-xl border border-white/5 mx-2">
                <button
                    onClick={() => setActiveTab('routes')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === 'routes' ? 'bg-blue-600 shadow-md text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Rotalar
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
                        activeTab === 'orders' ? 'bg-blue-600 shadow-md text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Bugünün Siparişleri ({orders.length})
                </button>
            </div>

            {activeTab === 'routes' ? (
                <>
                    {/* Performance Targets */}
                    {targets.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="text-4xl">📊</span>
                            </div>
                            <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">HEDEFLERİM</h2>
                            <div className="space-y-4">
                                {targets.map(t => {
                                    const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                    return (
                                        <div key={t.id} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div className="text-sm font-bold text-white/90">
                                                    {t.type === 'TURNOVER' ? '💰 Satış Hedefi' : '📍 Ziyaret Hedefi'}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-white">%{progress}</div>
                                                    <div className="text-[10px] text-white/40">
                                                        {t.type === 'TURNOVER' ? `₺${t.currentValue.toLocaleString()}` : `${t.currentValue} / ${t.targetValue}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Today's Highlight */}
                    {todayRoutes.length > 0 && (
                        <div>
                            <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                BUGÜN
                            </h2>
                            <div className="space-y-3">
                                {todayRoutes.map(route => (
                                    <RouteCard key={route.id} route={route} onClick={() => router.push(`/field-mobile/routes/${route.id}`)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Routes */}
                    {otherRoutes.length > 0 && (
                        <div>
                            <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 px-2">DİĞER GÜNLER</h2>
                            <div className="space-y-3">
                                {otherRoutes.map(route => (
                                    <RouteCard key={route.id} route={route} onClick={() => router.push(`/field-mobile/routes/${route.id}`)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {routes.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <div className="text-4xl mb-4">📭</div>
                            <div>Size atanmış bir rota bulunmuyor.</div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-3">
                    {orders.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="text-4xl mb-4">🛒</div>
                            <div>Bugün alınmış siparişiniz bulunmuyor.</div>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                                <div 
                                    className="p-5 flex justify-between items-center cursor-pointer active:bg-white/5 transition-colors"
                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                >
                                    <div className="flex-1 pr-4">
                                        <div className="font-bold text-sm text-white mb-1 truncate leading-tight">
                                            {order.customer?.name || order.customerName || 'Bilinmeyen Müşteri'}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 font-bold tracking-widest uppercase">
                                            <span>📅 {new Date(order.orderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span>•</span>
                                            <span className={order.status === 'Sipariş Alındı' || order.status === 'PENDING' ? 'text-orange-400' : 'text-blue-400'}>{order.status}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-lg text-emerald-400 tracking-tight">₺{Number(order.totalAmount).toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-600 font-bold uppercase mt-1 flex items-center justify-end gap-1">
                                            DETAY {expandedOrderId === order.id ? '▲' : '▼'}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Collapsible Order Details */}
                                {expandedOrderId === order.id && (
                                    <div className="bg-black/20 border-t border-white/5 p-4 animate-in slide-in-from-top-2 duration-200">
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Sipariş İçeriği</h3>
                                        <div className="space-y-2.5">
                                            {(() => {
                                                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                                return items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-start text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                        <div className="flex-1 pr-3">
                                                            <div className="text-gray-300 font-bold mb-0.5">{item.name || item.productName || 'Ürün'}</div>
                                                            <div className="text-gray-600">{item.qty || item.quantity} x ₺{Number(item.price || item.unitPrice || 0).toLocaleString()}</div>
                                                        </div>
                                                        <div className="font-black text-white">
                                                            ₺{((item.qty || item.quantity || 1) * (item.price || item.unitPrice || 0)).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                                            <button 
                                                onClick={() => router.push(`/field-mobile/collection/create?visitId=${order.rawData?.visitId || ''}&customerId=${order.customerId}&customerName=${encodeURIComponent(order.customerName || '')}&orderId=${order.id}&amount=${order.totalAmount}`)}
                                                className="flex-1 py-2 bg-emerald-600/20 text-emerald-500 font-black text-[10px] uppercase tracking-widest rounded-lg border border-emerald-500/20 hover:bg-emerald-600/40"
                                            >
                                                TAHSİLAT AL
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function RouteCard({ route, onClick }: { route: any, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-[#161b22] border border-white/5 p-5 rounded-2xl active:scale-95 transition-transform flex justify-between items-center"
        >
            <div>
                <div className="font-bold text-lg text-white mb-1">{route.name}</div>
                <div className="text-xs text-gray-400 flex gap-3">
                    <span>📅 {new Date(route.date).toLocaleDateString('tr-TR')}</span>
                    <span>📍 {route._count?.stops || 0} Durak</span>
                </div>
            </div>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${route.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
                route.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-600'
                }`}></div>
        </div>
    );
}
