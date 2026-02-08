
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { AppProvider, useApp } from "../contexts/AppContext";
import { useCRM } from "../contexts/CRMContext";
import { useInventory } from "../contexts/InventoryContext";
import { useFinancials } from "../contexts/FinancialContext";
import Sidebar from "../components/Sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ModalProvider } from "../contexts/ModalContext";
import "./globals.css";

import SalesMonitor from "../components/SalesMonitor";
import ChatWidget from "../components/ChatWidget";
import { MobileNav } from "../components/MobileNav";
import { GrowthBanner } from "../components/GrowthBanner";
import GlobalErrorScreen from "../components/GlobalErrorScreen";
import AppSkeleton from "../components/AppSkeleton";

function MobileHeader() {
  const { isSidebarOpen, setIsSidebarOpen } = useApp();
  const pathname = usePathname();

  // Get page title from pathname
  const getTitle = (path: string) => {
    if (path === '/') return 'POS Terminal';
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
      <div style={{ fontWeight: '800', fontSize: '18px', flex: 1 }}>{getTitle(pathname)}</div>
      <div style={{ fontSize: '20px' }}>⚡</div>
    </header>
  );
}


function LayoutContent({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const app = useApp();
  const crm = useCRM();
  const inventory = useInventory();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isResetPage = pathname.startsWith('/reset-password');
  const isAdminPage = pathname.startsWith('/admin');
  const isPublicPage = isLoginPage || isRegisterPage || isResetPage || isAdminPage || (!auth.isAuthenticated && pathname === '/');

  // Financial Context is now safely provided by AppContext even without active branch
  const financial = useFinancials();

  // SEMANTIC READINESS: Data must be valid for current context, not just "loaded"
  const isInitialLoading =
    app.isInitialLoading ||
    crm.isInitialLoading ||
    inventory.isInitialLoading ||
    (auth.isAuthenticated && !isAdminPage && (financial.isInitialLoading || !financial.isDataValid));

  // Global Error Gate
  const hasCriticalError = crm.error || inventory.error || (auth.isAuthenticated && !isAdminPage && financial.error);

  // Graceful Reveal State
  const [showContent, setShowContent] = useState(false);

  // Route Change Cleanup & Reflow
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Reset scroll
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      // Force Reflow / Layout Recalculation
      window.dispatchEvent(new Event('resize'));
    }
  }, [pathname]);

  useEffect(() => {
    if (!isInitialLoading) {
      // Wait 800ms for the DOM to settle and CSS to apply fully
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('resize'));
        }
        setShowContent(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading]);

  // Performance Metrics
  useEffect(() => {
    if (typeof window !== 'undefined') {
      performance.mark("app_start");
    }
  }, []);

  useEffect(() => {
    if (showContent) {
      if (typeof window !== 'undefined') {
        performance.mark("app_ready");
        try {
          performance.measure("cold_start", "app_start", "app_ready");
          const measure = performance.getEntriesByName("cold_start")[0];
          console.log(`🚀 App Ready in ${measure.duration.toFixed(2)}ms`);
        } catch (e) { }
      }
    }
  }, [showContent]);

  // Handle Global Errors
  if (hasCriticalError && !isAdminPage) {
    return <GlobalErrorScreen error={hasCriticalError} />;
  }

  if (auth.isLoading && !isResetPage) {
    return (
      <div style={{ background: 'var(--bg-deep)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
        <div style={{ fontSize: '24px', animation: 'spin 1s infinite' }}>⏳</div>
      </div>
    );
  }

  if (!auth.isAuthenticated && !isPublicPage) {
    return null;
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  // APP LAYOUT WITH LOADING OVERLAY
  return (
    <>
      {/* GLOBAL LOADING OVERLAY - Keeps layout mounted underneath */}
      {(!showContent && !isAdminPage) && <AppSkeleton />}

      {/* MAIN APP STRUCTURE - Always rendered for auth pages */}
      <div className={app.isSidebarOpen ? 'sidebar-open' : ''} style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg-deep)', overflow: 'hidden' }}>
        <Sidebar />
        <MobileHeader />

        {/* Mobile Backdrop */}
        {app.isSidebarOpen && (
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
          className="main-content"
          onClick={() => {
            if (app.isSidebarOpen && window.innerWidth < 1024) app.setIsSidebarOpen(false);
          }}
        >
          <GrowthBanner />
          {children}

          {/* Global Security Monitor */}
          {auth.user && (
            <>
              <SalesMonitor
                userRole={auth.user.role}
                currentBranch={auth.user.branch}
                currentStaff={auth.user.name}
              />
              <ChatWidget />
            </>
          )}
        </main>
        <MobileNav />
      </div>
    </>
  );
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ModalProvider>
              <AppProvider>
                <LayoutContent>{children}</LayoutContent>
              </AppProvider>
            </ModalProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
