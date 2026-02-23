
"use client";

import { useEffect, useState, useRef } from 'react';

// Default center: Turkey
const DEFAULT_CENTER = [39.925533, 32.866287] as [number, number];
const DEFAULT_ZOOM = 6;

export default function LiveFieldTrackingPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any[]>([]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/field-sales/admin/live-status');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Init Leaflet map (CDN — no npm install needed)
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        // Dynamically load Leaflet from CDN
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
            const L = (window as any).L;
            const map = L.map(mapContainerRef.current!, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            mapRef.current = map;
        };
        document.head.appendChild(script);
    }, []);

    // Update markers when data changes
    useEffect(() => {
        if (!mapRef.current || !data) return;
        const L = (window as any).L;
        if (!L) return;

        // Clear old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const bounds: [number, number][] = [];

        // Active visits → green pulsing marker
        (data.activeVisits || []).forEach((visit: any) => {
            if (visit.staffLat && visit.staffLng) {
                const greenIcon = L.divIcon({
                    className: '',
                    html: `<div style="
                        width:16px;height:16px;border-radius:50%;
                        background:#22c55e;border:3px solid #fff;
                        box-shadow:0 0 0 4px rgba(34,197,94,0.4);
                        animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
                    "></div>`,
                    iconAnchor: [8, 8]
                });
                const m = L.marker([visit.staffLat, visit.staffLng], { icon: greenIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`
                        <div style="font-family:sans-serif;min-width:160px">
                            <div style="font-weight:800;font-size:13px;margin-bottom:4px">👤 ${visit.staff?.name}</div>
                            <div style="font-size:11px;color:#555;margin-bottom:2px">📍 ${visit.customer?.name}</div>
                            <div style="font-size:11px;color:#555">${visit.customer?.district || ''}, ${visit.customer?.city || ''}</div>
                            ${visit.distanceMeters ? `<div style="font-size:10px;margin-top:6px;color:${visit.isOutOfRange ? '#ef4444' : '#22c55e'}">
                                ${visit.isOutOfRange ? '⚠️' : '✅'} Mesafe: ${visit.distanceMeters}m
                            </div>` : ''}
                        </div>
                    `);
                markersRef.current.push(m);
                bounds.push([visit.staffLat, visit.staffLng]);

                // Also show customer location if available
                if (visit.customer?.lat && visit.customer?.lng) {
                    const custIcon = L.divIcon({
                        className: '',
                        html: `<div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid #fff;opacity:0.8"></div>`,
                        iconAnchor: [5, 5]
                    });
                    const cm = L.marker([visit.customer.lat, visit.customer.lng], { icon: custIcon })
                        .addTo(mapRef.current)
                        .bindPopup(`<div style="font-size:11px;font-weight:700">🏢 ${visit.customer.name}</div>`);
                    markersRef.current.push(cm);

                    // Line between staff and customer
                    const line = L.polyline([[visit.staffLat, visit.staffLng], [visit.customer.lat, visit.customer.lng]], {
                        color: visit.isOutOfRange ? '#ef4444' : '#22c55e',
                        weight: 2,
                        dashArray: '6 4',
                        opacity: 0.6
                    }).addTo(mapRef.current);
                    markersRef.current.push(line);
                    bounds.push([visit.customer.lat, visit.customer.lng]);
                }
            }
        });

        // Recent visits → gray markers
        (data.recentVisits || []).forEach((visit: any) => {
            const loc = visit.checkOutLocation && typeof visit.checkOutLocation === 'object' ? visit.checkOutLocation : {};
            if (loc.lat && loc.lng) {
                const grayIcon = L.divIcon({
                    className: '',
                    html: `<div style="width:10px;height:10px;border-radius:50%;background:#6b7280;border:2px solid #fff;opacity:0.6"></div>`,
                    iconAnchor: [5, 5]
                });
                const m = L.marker([loc.lat, loc.lng], { icon: grayIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`<div style="font-size:11px"><b>${visit.staff?.name}</b><br>${visit.customer?.name}</div>`);
                markersRef.current.push(m);
                bounds.push([loc.lat, loc.lng]);
            }
        });

        // Fit bounds if we have markers
        if (bounds.length > 0) {
            mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        }
    }, [data]);

    // Auto-refresh every 30s
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) return (
        <div className="p-12 text-white/50 animate-pulse text-center">
            <div className="text-4xl mb-3">🛰️</div>
            <div>Saha takibi yükleniyor...</div>
        </div>
    );

    const active = data?.activeVisits || [];
    const recent = data?.recentVisits || [];

    return (
        <div className="min-h-screen bg-[#0f111a] text-white">
            {/* CSS for ping animation */}
            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 10px !important;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important;
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center px-8 pt-8 pb-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">🛰️ Canlı Saha Takibi</h1>
                    <p className="text-gray-500 text-sm">Gerçek zamanlı konum ve ziyaret durumu</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Canlı · 30s</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 px-8 mb-6">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-black text-green-400">{active.length}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Aktif Ziyaret</div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                    <div className="text-3xl font-black text-blue-400">{data?.stats?.todayVisitsCount || 0}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Bugünkü Ziyaret</div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-center">
                    <div className="text-2xl font-black text-amber-400">
                        ₺{(data?.stats?.totalRevenue || 0).toLocaleString('tr-TR')}
                    </div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Bugünkü Ciro</div>
                </div>
            </div>

            {/* Main: Map + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-10">
                {/* Map */}
                <div className="lg:col-span-2">
                    <div className="bg-[#161b22] border border-white/5 rounded-3xl overflow-hidden" style={{ height: '520px' }}>
                        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '24px' }} />
                    </div>
                    {/* Map legend */}
                    <div className="flex gap-5 mt-3 px-2 text-[11px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Aktif saha personeli</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Müşteri konumu</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block" /> Tamamlanan ziyaret</span>
                    </div>
                </div>

                {/* Sidebar: Active + Recent */}
                <div className="flex flex-col gap-4 max-h-[560px] overflow-y-auto">
                    {/* Active */}
                    <div>
                        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                            Şu An Sahada ({active.length})
                        </h2>
                        {active.length === 0 && (
                            <div className="text-center text-gray-600 py-8 border border-dashed border-white/5 rounded-2xl text-sm">
                                Aktif ziyaret yok
                            </div>
                        )}
                        {active.map((visit: any) => {
                            const dur = Math.floor((Date.now() - new Date(visit.checkInTime).getTime()) / 60000);
                            return (
                                <div key={visit.id} className={`bg-[#161b22] border rounded-2xl p-4 mb-3 ${visit.isOutOfRange ? 'border-red-500/30' : 'border-blue-500/20'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center text-base">👤</div>
                                        <div>
                                            <div className="font-black text-sm text-white">{visit.staff?.name}</div>
                                            <div className="text-[10px] text-gray-500">{dur} dk önce girdi</div>
                                        </div>
                                        {visit.isOutOfRange && (
                                            <div className="ml-auto text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">⚠️ KONUM DIŞI</div>
                                        )}
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-3">
                                        <div className="text-[10px] text-gray-500 mb-1">MÜŞTERİ</div>
                                        <div className="text-sm font-bold">{visit.customer?.name}</div>
                                        <div className="text-xs text-gray-500">{visit.customer?.district}, {visit.customer?.city}</div>
                                        {visit.distanceMeters !== null && (
                                            <div className={`text-[10px] mt-1 font-bold ${visit.isOutOfRange ? 'text-red-400' : 'text-green-400'}`}>
                                                {visit.isOutOfRange ? '⚠️' : '✅'} {visit.distanceMeters}m uzaklıkta giriş
                                            </div>
                                        )}
                                        {!visit.staffLat && (
                                            <div className="text-[10px] mt-1 text-gray-600">📍 Konum paylaşılmadı</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Recent */}
                    <div>
                        <h2 className="text-xs font-black text-white/40 uppercase tracking-widest mb-3">Son Hareketler</h2>
                        <div className="space-y-3">
                            {recent.map((visit: any) => {
                                const orderTotal = (visit.orders || []).reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
                                const collectTotal = (visit.transactions || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
                                return (
                                    <div key={visit.id} className="bg-[#161b22] border border-white/5 rounded-xl p-3">
                                        <div className="text-xs font-black text-white mb-0.5">{visit.staff?.name}</div>
                                        <div className="text-[11px] text-blue-400">{visit.customer?.name}</div>
                                        <div className="text-[10px] text-gray-600 mb-1">
                                            {new Date(visit.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex gap-2">
                                            {orderTotal > 0 && <span className="bg-green-500/10 text-green-500 text-[9px] font-black px-2 py-0.5 rounded">🛒 ₺{orderTotal.toLocaleString()}</span>}
                                            {collectTotal > 0 && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-2 py-0.5 rounded">💰 ₺{collectTotal.toLocaleString()}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                            {recent.length === 0 && (
                                <div className="text-gray-600 text-center py-6 text-sm italic">Henüz hareket yok</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
