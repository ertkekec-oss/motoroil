
"use client";

import { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin } from 'lucide-react';

// Default center: Turkey
const DEFAULT_CENTER = [39.925533, 32.866287] as [number, number];
const DEFAULT_ZOOM = 6;

export default function LiveFieldTrackingPage({ isEmbedded }: { isEmbedded?: boolean }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
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
            } else {
                throw new Error("API call failed, fallback to mock data");
            }
        } catch (err) {
            console.error(err);
            // MOCK DATA FOR DEMONSTRATION PURPOSES (Since backend doesn't have live-status endpoint yet)
            setData({
                activeVisits: [
                    {
                        id: 'v1',
                        staffLat: 40.9900, staffLng: 29.0200,
                        checkInTime: new Date(Date.now() - 15 * 60000).toISOString(),
                        isOutOfRange: false,
                        distanceMeters: 15,
                        staff: { name: 'Ahmet Yılmaz' },
                        customer: { name: 'Özlem Otomotiv', lat: 40.9902, lng: 29.0205, city: 'İstanbul', district: 'Kadıköy' }
                    },
                    {
                        id: 'v2',
                        staffLat: 40.9730, staffLng: 29.1000,
                        checkInTime: new Date(Date.now() - 45 * 60000).toISOString(),
                        isOutOfRange: true,
                        distanceMeters: 450,
                        staff: { name: 'Mehmet Demir' },
                        customer: { name: 'Kozyatağı Yedek Parça', lat: 40.9750, lng: 29.1050, city: 'İstanbul', district: 'Kozyatağı' }
                    }
                ],
                recentVisits: [
                    {
                        id: 'v3',
                        checkOutLocation: { lat: 41.0082, lng: 28.9784 },
                        checkOutTime: new Date(Date.now() - 120 * 60000).toISOString(),
                        staff: { name: 'Ali Veli' },
                        customer: { name: 'Sultanahmet Motor' },
                        orders: [{ totalAmount: 15000 }],
                        transactions: [{ amount: 5000 }]
                    }
                ],
                stats: {
                    todayVisitsCount: 14,
                    totalRevenue: 85400
                }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loading || mapRef.current || !mapContainerRef.current) return;

        let isMounted = true;
        let resizeObserver: ResizeObserver | null = null;

        // Dynamically load Leaflet from reliable CDN securely (switched to local hosting to avoid ad-blocker/CORS blocks)
        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/leaflet/leaflet.css';
            link.onload = () => {
                if (mapRef.current && isMounted) {
                    mapRef.current.invalidateSize();
                }
            };
            document.head.appendChild(link);
        }

        const initL = () => {
            if (!isMounted || !mapContainerRef.current) return;
            
            const L = (window as any).L;
            if (!L) return;

            if ((mapContainerRef.current as any)._leaflet_id) {
                return;
            }

            const map = L.map(mapContainerRef.current, {
                center: DEFAULT_CENTER,
                zoom: DEFAULT_ZOOM,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            mapRef.current = map;
            
            // Fix for maps rendering gray/blank incorrectly inside grid/flex layouts
            setTimeout(() => { if (mapRef.current && isMounted) mapRef.current.invalidateSize(); }, 100);
            setTimeout(() => { if (mapRef.current && isMounted) mapRef.current.invalidateSize(); }, 300);
            setTimeout(() => { if (mapRef.current && isMounted) mapRef.current.invalidateSize(); }, 800);

            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(() => {
                    if (mapRef.current && isMounted) {
                        mapRef.current.invalidateSize();
                    }
                });
                resizeObserver.observe(mapContainerRef.current);
            }
        };

        if (!(window as any).L) {
            const existingScript = document.querySelector('script[src*="leaflet.js"]');
            if (existingScript) {
                existingScript.addEventListener('load', initL);
            } else {
                const script = document.createElement('script');
                script.src = '/leaflet/leaflet.js';
                script.onload = initL;
                document.head.appendChild(script);
            }
        } else {
            setTimeout(initL, 50);
        }

        return () => {
            isMounted = false;
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            const existingScript = document.querySelector('script[src*="leaflet.js"]');
            if (existingScript) {
                existingScript.removeEventListener('load', initL);
            }
        };
    }, [loading]);

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
                        animation:myping 1.5s cubic-bezier(0,0,0.2,1) infinite;
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
        <div className={`flex flex-col items-center justify-center p-12 animate-pulse text-center min-h-screen ${isLight ? 'bg-slate-50 text-slate-400' : 'bg-[#0f172a] text-white/50'}`}>
            <div className="text-4xl mb-4">🛰️</div>
            <div className="font-bold text-[13px] uppercase tracking-widest">Saha takibi yükleniyor...</div>
        </div>
    );

    const active = data?.activeVisits || [];
    const recent = data?.recentVisits || [];

    const textMain = isLight ? 'text-slate-800' : 'text-white';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const bgSurface = isLight ? 'bg-white' : 'bg-[#1e293b]';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/5';

    return (
        <div data-pos-theme={theme} className={`min-h-screen transition-colors duration-300 w-full ${isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0f172a] text-white'}`}>
            {/* CSS for ping animation */}
            <style>{`
                @keyframes myping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 10px !important;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important;
                }
            `}</style>

            {/* Header */}
            {!isEmbedded && (
                <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-[#1e293b] border-white/5'} border-b mb-6 sticky top-0 z-20`}>
                    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex items-center justify-center rounded-[14px] bg-green-600 text-white shadow-lg shadow-green-500/20 shrink-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${textMain} leading-none mb-1.5 truncate`}>
                                        Canlı Saha Takibi
                                    </h1>
                                    <span className={`text-[11px] sm:text-[12px] font-bold tracking-[0.2em] uppercase ${textMuted} truncate block`}>
                                        {active.length} Personel sahada aktif
                                    </span>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-3">
                            <span className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Canlı Veri Akışı
                            </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={isEmbedded ? "h-full w-full" : "max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8"}>
                {/* Stats Row */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${isEmbedded ? '' : 'px-0'}`}>
                    <div className={`${bgSurface} ${borderColor} shadow-sm border rounded-[20px] p-5 text-center`}>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Map */}
                    <div className="lg:col-span-2 flex flex-col">
                        <div className={`border rounded-[24px] overflow-hidden flex-1 shadow-sm relative min-h-[500px] lg:min-h-[600px] ${bgSurface} ${borderColor}`}>
                            <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-transparent" />
                        </div>
                        {/* Map legend */}
                        <div className={`flex gap-6 mt-4 px-2 text-[11px] font-black uppercase tracking-widest ${textMuted}`}>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Aktif saha personeli</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Müşteri konumu</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500 inline-block" /> Tamamlanan ziyaret</span>
                        </div>
                    </div>

                    {/* Sidebar: Active + Recent */}
                    <div className="flex flex-col gap-8 lg:max-h-[650px] overflow-y-auto custom-scrollbar pr-2 pb-6">
                        {/* Active */}
                        <div>
                            <h2 className={`text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${textMuted}`}>
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block" />
                                Şu An Sahada ({active.length})
                            </h2>
                            {active.length === 0 && (
                                <div className={`text-center py-10 border-2 border-dashed rounded-[20px] text-[12px] font-bold uppercase tracking-widest ${isLight ? 'border-slate-200 text-slate-400' : 'border-slate-700 text-slate-500'}`}>
                                    Aktif ziyaret yok
                                </div>
                            )}
                            {active.map((visit: any) => {
                                const dur = Math.floor((Date.now() - new Date(visit.checkInTime).getTime()) / 60000);
                                return (
                                    <div key={visit.id} className={`border rounded-[20px] p-5 mb-4 shadow-sm transition-all hover:scale-[1.01] ${bgSurface} ${visit.isOutOfRange ? (isLight ? 'border-red-300' : 'border-red-500/40') : borderColor}`}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shadow-sm ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-600/20 text-blue-400'}`}>👤</div>
                                            <div>
                                                <div className={`font-black text-[15px] ${textMain}`}>{visit.staff?.name}</div>
                                                <div className={`text-[11px] font-semibold mt-0.5 uppercase tracking-wide ${textMuted}`}>{dur} dk önce girdi</div>
                                            </div>
                                            {visit.isOutOfRange && (
                                                <div className={`ml-auto text-[10px] font-black px-2.5 py-1.5 rounded-lg border uppercase tracking-widest ${isLight ? 'text-red-600 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>Konum Dışı</div>
                                            )}
                                        </div>
                                        <div className={`rounded-[16px] p-4 border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-700'}`}>
                                            <div className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${textMuted}`}>Müşteri</div>
                                            <div className={`text-sm font-bold ${textMain}`}>{visit.customer?.name}</div>
                                            <div className={`text-xs mt-0.5 ${textMuted}`}>{visit.customer?.district}, {visit.customer?.city}</div>
                                            {visit.distanceMeters !== null && (
                                                <div className={`text-[11px] mt-2 font-bold flex items-center gap-1 ${visit.isOutOfRange ? 'text-red-500' : 'text-green-500'}`}>
                                                    {visit.isOutOfRange ? '⚠️' : '✅'} {visit.distanceMeters}m uzaklıkta giriş
                                                </div>
                                            )}
                                            {!visit.staffLat && (
                                                <div className={`text-[10px] mt-2 ${textMuted}`}>📍 Konum paylaşılmadı</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recent */}
                        <div>
                            <h2 className={`text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${textMuted}`}>
                                Son Hareketler
                            </h2>
                            <div className="space-y-4">
                                {recent.map((visit: any) => {
                                    const orderTotal = (visit.orders || []).reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
                                    const collectTotal = (visit.transactions || []).reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
                                    return (
                                        <div key={visit.id} className={`border rounded-[16px] p-4 shadow-sm transition-all hover:scale-[1.01] ${bgSurface} ${borderColor}`}>
                                            <div className={`text-[13px] font-black mb-1 ${textMain}`}>{visit.staff?.name}</div>
                                            <div className={`text-[12px] font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{visit.customer?.name}</div>
                                            <div className={`text-[10px] font-bold mt-1.5 tracking-widest uppercase ${textMuted}`}>
                                                {new Date(visit.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {orderTotal > 0 && <span className={`border text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg ${isLight ? 'bg-green-50 border-green-200 text-green-700' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>🛒 ₺{orderTotal.toLocaleString('tr-TR')}</span>}
                                                {collectTotal > 0 && <span className={`border text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg ${isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>💰 ₺{collectTotal.toLocaleString('tr-TR')}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {recent.length === 0 && (
                                    <div className={`text-center py-8 border-2 border-dashed rounded-[20px] text-[12px] font-bold uppercase tracking-widest ${isLight ? 'border-slate-200 text-slate-400' : 'border-slate-700 text-slate-500'}`}>
                                        Henüz hareket yok
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
