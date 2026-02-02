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
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isResetPage = pathname.startsWith('/reset-password');

  if (isLoading && !isResetPage) {
    return (
      <div style={{ background: 'var(--bg-deep)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
        Yükleniyor...
      </div>
    );
  }

  if (!isAuthenticated && !isLoginPage && !isResetPage) {
    // Redirection is handled in AuthContext
    return null;
  }

  if (isLoginPage || isResetPage) {
    return <>{children}</>;
  }

  const { isSidebarOpen, setIsSidebarOpen } = useApp();

  return (
    <div className={isSidebarOpen ? 'sidebar-open' : ''} style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg-deep)', overflow: 'hidden' }}>
      <Sidebar />
      <MobileHeader />

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
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
          if (isSidebarOpen && window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
      >
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
