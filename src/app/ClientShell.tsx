"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { AppProvider, useApp } from "../contexts/AppContext";
import { useCRM } from "../contexts/CRMContext";
import { useInventory } from "../contexts/InventoryContext";
import { useFinancials } from "../contexts/FinancialContext";
import Sidebar from "../components/Sidebar";

import SalesMonitor from "../components/SalesMonitor";
import ChatWidget from "../components/ChatWidget";
import { MobileNav } from "../components/MobileNav";
import { GrowthBanner } from "../components/GrowthBanner";
import GlobalErrorScreen from "../components/GlobalErrorScreen";
import AppSkeleton from "../components/AppSkeleton";
import ThemeToggle from "../components/ThemeToggle";
import NotificationCenter from "../components/NotificationCenter";

const permMap: Record<string, { perm?: string, feature?: string }> = {
    '/': { perm: 'pos_access', feature: 'pos' },
    '/accounting': { perm: 'finance_view', feature: 'financials' },
    '/customers': { perm: 'customer_view', feature: 'current_accounts' },
    '/suppliers': { perm: 'supplier_view', feature: 'suppliers' },
    '/inventory': { perm: 'inventory_view', feature: 'inventory' },
    '/service': { perm: 'service_view', feature: 'service_desk' },
    '/sales': { perm: 'sales_archive', feature: 'sales' },
    '/field-sales/admin/routes': { perm: 'field_sales_admin', feature: 'field_sales' },
    '/field-mobile/routes': { perm: 'field_sales_access' },
    '/quotes': { perm: 'offer_create', feature: 'quotes' },
    '/reports': { perm: 'reports_view', feature: 'analytics' },
    '/reports/ceo': { perm: 'reports_view', feature: 'ceo_intel' },
    '/reports/daily': { perm: 'reports_view', feature: 'analytics' },
    '/reports/suppliers': { perm: 'reports_view', feature: 'analytics' },
    '/integrations': { perm: 'settings_manage', feature: 'e_invoice' },
    '/settings/branch': { perm: 'settings_manage' },
    '/settings': { perm: 'settings_manage' },
    '/staff': { perm: 'staff_manage', feature: 'team_management' },
    '/advisor': { perm: 'finance_view', feature: 'accountant' },
    '/admin/dashboard': { perm: 'admin_view' },
    '/admin/tenants': { perm: 'admin_view' },
    '/admin/website': { perm: 'admin_view' },
    '/admin/sales-radar': { perm: 'admin_view' },
    '/admin/plans': { perm: 'admin_view' },
    '/admin/transactions': { perm: 'admin_view' },
    '/admin/logs': { perm: 'admin_view' },
    '/admin/audit-logs': { perm: 'audit_view' },
    '/security/suspicious': { perm: 'security_access' },
    '/billing': { perm: 'settings_manage' },
    '/notifications': { perm: 'pos_access' },
};

function MobileHeader() {
    const { isSidebarOpen, setIsSidebarOpen } = useApp();
    const pathname = usePathname();

    const getTitle = (path: string) => {
        if (path === '/') return 'POS Terminal';
        if (path === '/dashboard') return 'POS Terminal';
        if (path === '/accounting') return 'Finans';
        if (path === '/inventory') return 'Envanter';
        if (path === '/customers') return 'Cariler';
        if (path === '/suppliers') return 'Tedarikçiler';
        if (path === '/sales') return 'Satışlar';
        if (path === '/service') return 'Servis';
        if (path === '/reports') return 'Raporlar';
        if (path === '/settings') return 'Ayarlar';
        return 'Periodya';
    };

    return (
        <header className="show-mobile" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '64px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            zIndex: 1500,
            gap: '15px'
        }}>
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                }}
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>
            <div style={{ fontWeight: '800', fontSize: '18px', flex: 1 }}>{getTitle(pathname || '')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NotificationCenter />
                <div style={{ fontSize: '20px' }}>⚡</div>
            </div>
        </header>
    );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const app = useApp();
    const crm = useCRM();
    const inventory = useInventory();
    const pathname = usePathname();

    const isAdminPage = pathname?.startsWith('/admin');

    // Financial Context is now safely provided by AppContext
    const financial = useFinancials();

    const isInitialLoading = app.isInitialLoading;

    // Global Error Gate
    const hasCriticalError = crm.error || inventory.error || (auth.isAuthenticated && !isAdminPage && financial.error);

    // Graceful Reveal State
    const [showContent, setShowContent] = useState(false);
    const [widgetsReady, setWidgetsReady] = useState(false);

    useEffect(() => {
        // Delay widgets to ensure main DOM and CSS are perfectly stable first
        const t = setTimeout(() => setWidgetsReady(true), 2500);
        return () => clearTimeout(t);
    }, []);

    // Route Change Cleanup & Protection
    const router = useRouter();
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }

        // Global Permission Check
        if (!app.isInitialLoading && auth.isAuthenticated && pathname) {
            // Absolute system admin bypasses all UI gates
            const isSuperAdmin = auth.user?.role === 'SUPER_ADMIN';
            const isAdmin = auth.user?.role === 'ADMIN';

            const config = permMap[pathname];
            if (config) {
                // 1. Feature Check
                if (config.feature && !app.hasFeature(config.feature)) {
                    router.push('/');
                    return;
                }

                // 2. Admin Bypass - ADMIN and SUPER_ADMIN bypass all permission checks
                if (isSuperAdmin || isAdmin) return;

                // 3. Permission Check (only for non-admin users)
                if (config.perm && !app.hasPermission(config.perm)) {
                    const targetFallback = app.hasPermission('pos_access') ? '/' : '/field-mobile/routes';
                    router.push(targetFallback);
                }
            }
        }
    }, [pathname, app.isInitialLoading, auth.isAuthenticated]);

    useEffect(() => {
        if (!isInitialLoading) {
            setShowContent(true);
        }
    }, [isInitialLoading]);


    useEffect(() => {
        if (showContent) {
            if (typeof window !== 'undefined') {
                try {
                    // performance marks if needed
                } catch (e) { }
            }
        }
    }, [showContent]);
    const showSidebar = auth.isAuthenticated && !isAdminPage;

    // Handle Global Errors
    if (hasCriticalError && !isAdminPage) {
        return <GlobalErrorScreen error={hasCriticalError} />;
    }

    if (auth.isLoading) {
        return (
            <div style={{ background: 'var(--bg-deep)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                <div style={{ fontSize: '24px', animation: 'spin 1s infinite' }}>⏳</div>
            </div>
        );
    }

    // APP LAYOUT WITH LOADING OVERLAY
    if (!showContent && !isAdminPage) {
        return <AppSkeleton />;
    }

    return (
        <div className={`main-shell ${app.isSidebarOpen ? 'sidebar-open' : ''}`}>
            {showSidebar && <Sidebar />}

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {showSidebar && <MobileHeader />}

                {showSidebar && app.isSidebarOpen && (
                    <div
                        onClick={() => app.setIsSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 1900
                        }}
                        className="show-mobile"
                    />
                )}

                <main
                    className="main-content flex-1 min-w-0"
                    onClick={() => {
                        if (app.isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
                            app.setIsSidebarOpen(false);
                        }
                    }}
                >
                    {showSidebar && <GrowthBanner />}
                    {children}

                    {auth.user && !isAdminPage && (
                        <>
                            {widgetsReady && (
                                <>
                                    <SalesMonitor
                                        userRole={auth.user.role}
                                        currentBranch={auth.user.branch}
                                        currentStaff={auth.user.name}
                                    />
                                    <ChatWidget />
                                    <div style={{ position: 'fixed', bottom: '20px', right: '80px', zIndex: 9999, display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <NotificationCenter />
                                        <ThemeToggle />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </main>
                {showSidebar && <MobileNav />}
            </div>
        </div>
    );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [cssReady, setCssReady] = useState(false);

    useEffect(() => {
        setReady(true);
        const checkStyles = () => {
            const styles = Array.from(document.styleSheets);
            if (styles.length > 0) {
                try {
                    const _ = styles[0].cssRules;
                    setCssReady(true);
                } catch (e) {
                    setCssReady(true);
                }
            }
        };
        const interval = setInterval(checkStyles, 50);
        const timeout = setTimeout(() => setCssReady(true), 1500);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, []);

    if (!ready || !cssReady) {
        return <div style={{ height: "100dvh", background: "var(--bg-deep)" }} />;
    }

    return (
        <LayoutContent>{children}</LayoutContent>
    );
}
