
"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { AppProvider, useApp } from "../contexts/AppContext";
import Sidebar from "../components/Sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ModalProvider } from "../contexts/ModalContext";
import "./globals.css";

import SalesMonitor from "../components/SalesMonitor";
import ChatWidget from "../components/ChatWidget";
import { MobileNav } from "../components/MobileNav";
import { GrowthBanner } from "../components/GrowthBanner";

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const app = useApp();
  const crm = useCRM();
  const inventory = useInventory();
  const financials = useFinancials(); // Financials might be null if no branch selected
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isResetPage = pathname.startsWith('/reset-password');
  const isAdminPage = pathname.startsWith('/admin');
  const isPublicPage = isLoginPage || isRegisterPage || isResetPage || isAdminPage || (!isAuthenticated && pathname === '/');

  // Unified loading state
  const isInitialLoading = app.isInitialLoading || crm.isInitialLoading || inventory.isInitialLoading || (isAuthenticated && !isAdminPage && !app.activeBranchName) || (app.activeBranchName && (financials as any)?.isInitialLoading);

  if (authLoading && !isResetPage) {
    return (
      <div style={{ background: 'var(--bg-deep)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated && !isPublicPage) {
    // Redirection is handled in AuthContext
    return null;
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  // GLOBAL LOADING GATE for operational pages
  if (isInitialLoading && !isAdminPage) {
    return (
      <div style={{
        background: 'var(--bg-deep)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Verileriniz Hazırlanıyor</div>
        <div style={{ fontSize: '14px', opacity: 0.6 }}>Lütfen bekleyin, şube ve personel ayarları senkronize ediliyor...</div>
        <div style={{
          marginTop: '30px',
          width: '200px',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '40%',
            height: '100%',
            background: 'var(--primary)',
            animation: 'loading-bar 2s infinite ease-in-out'
          }}></div>
        </div>
        <style jsx>{`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); width: 30%; }
            50% { width: 60%; }
            100% { transform: translateX(330%); width: 30%; }
          }
        `}</style>
      </div>
    );
  }

  return (
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
        {user && (
          <>
            <SalesMonitor
              userRole={user.role}
              currentBranch={user.branch}
              currentStaff={user.name}
            />
            <ChatWidget />
          </>
        )}
      </main>
      <MobileNav />
    </div>
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
