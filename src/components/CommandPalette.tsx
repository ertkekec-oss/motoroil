"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useApp } from '@/contexts/AppContext';
import { tenantRoutes, tenantActions, adminRoutes, adminActions, NavRoute } from '@/lib/nav/catalog';
import { Search, Compass, Zap, ArrowRight, Home, ShoppingCart, ShoppingBag, Package, DollarSign, CreditCard, FileText, Activity, ShieldCheck, FileSignature, LifeBuoy, PlusCircle, Eye, BarChart, AlertTriangle, CheckCircle, Building, Server, FileSearch, Camera } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className="w-4 h-4" />,
    ShoppingCart: <ShoppingCart className="w-4 h-4" />,
    ShoppingBag: <ShoppingBag className="w-4 h-4" />,
    Package: <Package className="w-4 h-4" />,
    Search: <Search className="w-4 h-4" />,
    DollarSign: <DollarSign className="w-4 h-4" />,
    CreditCard: <CreditCard className="w-4 h-4" />,
    FileText: <FileText className="w-4 h-4" />,
    Activity: <Activity className="w-4 h-4" />,
    ShieldCheck: <ShieldCheck className="w-4 h-4" />,
    Zap: <Zap className="w-4 h-4" />,
    FileSignature: <FileSignature className="w-4 h-4" />,
    LifeBuoy: <LifeBuoy className="w-4 h-4" />,
    PlusCircle: <PlusCircle className="w-4 h-4" />,
    ArrowRight: <ArrowRight className="w-4 h-4" />,
    Eye: <Eye className="w-4 h-4" />,
    BarChart: <BarChart className="w-4 h-4" />,
    AlertTriangle: <AlertTriangle className="w-4 h-4" />,
    CheckCircle: <CheckCircle className="w-4 h-4" />,
    Building: <Building className="w-4 h-4" />,
    Server: <Server className="w-4 h-4" />,
    FileSearch: <FileSearch className="w-4 h-4" />,
    Camera: <Camera className="w-4 h-4" />,
};

interface CommandPaletteProps {
    isAdmin?: boolean;
}

export default function CommandPalette({ isAdmin = false }: CommandPaletteProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [apiResults, setApiResults] = useState<{ type: string; id: string; title: string; subtitle?: string; href: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { currentUser, isSystemAdmin, hasPermission } = useApp();

    const isBuyer = isSystemAdmin || hasPermission('supplier_view') || currentUser?.type === 'buying';
    const isSeller = isSystemAdmin || hasPermission('sales_archive') || currentUser?.type === 'selling';
    const userRoles = [
        ...(isBuyer ? ['BUYER'] : []),
        ...(isSeller ? ['SELLER'] : []),
        isAdmin ? 'ADMIN' : ''
    ].filter(Boolean);

    // Filter routes by role constraints
    const hasRoleAccess = (route: NavRoute) => {
        if (!route.roles || route.roles.length === 0) return true;
        return route.roles.some(r => userRoles.includes(r));
    };

    const navRoutes = (isAdmin ? adminRoutes : tenantRoutes).filter(hasRoleAccess);
    const actionRoutes = (isAdmin ? adminActions : tenantActions).filter(hasRoleAccess);

    // Keyboard shortcut to open Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Debounced API Search
    useEffect(() => {
        if (search.length < 2) {
            setApiResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const endpoint = isAdmin ? '/api/admin/search' : '/api/search';
                const res = await fetch(`${endpoint}?q=${encodeURIComponent(search)}&take=5`);
                if (res.ok) {
                    const data = await res.json();
                    setApiResults(data.items || []);
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, isAdmin]);

    const handleSelectNavigation = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    const handleSelectAction = async (action: string) => {
        setOpen(false);
        if (action.startsWith('/')) {
            // It's just a shortcut router push
            router.push(action);
        } else {
            // It's a real API call action like 'SNAPSHOT_BILLING'
            alert(`Executing action: ${action} - Requires Idempotency Configured API Route`);
        }
    };

    const handleSelectEntity = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
                <Command
                    className="w-full h-full"
                    label="Command Menu"
                    shouldFilter={false} // We handle filtering via groups and local matching
                    onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
                >
                    <div className="flex items-center border-b border-slate-100 px-3" cmdk-input-wrapper="">
                        <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                        <Command.Input
                            className="flex-1 h-14 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-lg"
                            placeholder="Type a command or search entities..."
                            value={search}
                            onValueChange={setSearch}
                            autoFocus
                        />
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">ESC</div>
                    </div>

                    <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
                        <Command.Empty className="py-12 px-4 text-center text-sm text-slate-500">
                            {loading ? 'Searching in network...' : 'No results found.'}
                        </Command.Empty>

                        {/* Local Navigation Matching */}
                        {search.length === 0 && (
                            <div className="text-xs font-semibold text-slate-500 px-2 py-1 mb-1">Quick Navigation</div>
                        )}

                        {(search.length === 0 || navRoutes.some(r => r.label.toLowerCase().includes(search.toLowerCase()) || r.keywords.some(k => k.includes(search.toLowerCase())))) && (
                            <Command.Group heading="Navigate">
                                {navRoutes
                                    .filter(r => search.length === 0 || r.label.toLowerCase().includes(search.toLowerCase()) || r.keywords.some(k => k.includes(search.toLowerCase())))
                                    .slice(0, search.length === 0 ? 5 : 10)
                                    .map((route, i) => (
                                        <Command.Item
                                            key={`nav-${i}`}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-700 cursor-pointer data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 select-none outline-none"
                                            onSelect={() => handleSelectNavigation(route.href!)}
                                        >
                                            <div className="text-slate-400 p-1.5 rounded-md bg-white border border-slate-100 shadow-sm">
                                                {route.icon ? iconMap[route.icon] : <Compass className="w-4 h-4" />}
                                            </div>
                                            {route.label}
                                        </Command.Item>
                                    ))}
                            </Command.Group>
                        )}

                        {/* Database Search Results */}
                        {search.length >= 2 && apiResults.length > 0 && (
                            <Command.Group heading="Global Search Results">
                                {apiResults.map((item, i) => (
                                    <Command.Item
                                        key={`api-${i}`}
                                        className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-slate-50 select-none outline-none"
                                        onSelect={() => handleSelectEntity(item.href)}
                                    >
                                        <div className="flex items-center">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-2 uppercase">{item.type}</span>
                                            <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                                        </div>
                                        {item.subtitle && <div className="text-xs text-slate-500 pl-2">{item.subtitle}</div>}
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {/* Local Action Matching */}
                        {(search.length === 0 || actionRoutes.some(r => r.label.toLowerCase().includes(search.toLowerCase()) || r.keywords.some(k => k.includes(search.toLowerCase())))) && (
                            <Command.Group heading="Quick Actions">
                                {actionRoutes
                                    .filter(r => search.length === 0 || r.label.toLowerCase().includes(search.toLowerCase()) || r.keywords.some(k => k.includes(search.toLowerCase())))
                                    .slice(0, search.length === 0 ? 3 : 5)
                                    .map((action, i) => (
                                        <Command.Item
                                            key={`act-${i}`}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 cursor-pointer data-[selected=true]:bg-slate-100 select-none outline-none"
                                            onSelect={() => handleSelectAction(action.action!)}
                                        >
                                            <div className="text-slate-500">
                                                {action.icon ? iconMap[action.icon] : <Zap className="w-4 h-4" />}
                                            </div>
                                            {action.label}
                                        </Command.Item>
                                    ))}
                            </Command.Group>
                        )}

                    </Command.List>

                    <div className="bg-slate-50 border-t border-slate-100 p-2 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center font-sans tracking-tight">↑</kbd><kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center font-sans tracking-tight">↓</kbd> Gezin</span>
                            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1 min-w-[20px] text-center font-sans tracking-tight">↵</kbd> Seç</span>
                        </div>
                        <div className="font-semibold text-slate-300">Periodya OS</div>
                    </div>
                </Command>
            </div>
            {/* Backdrop click to close */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
        </div>
    );
}
