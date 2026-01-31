"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { AppProvider, useApp } from "../contexts/AppContext";
import Sidebar from "../components/Sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { ModalProvider } from "../contexts/ModalContext";
import "./globals.css";

import SalesMonitor from "../components/SalesMonitor";

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

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg-deep)', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: '240px',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        background: 'var(--bg-deep)'
      }}>
        {children}
        <ThemeToggle />

        {/* Global Security Monitor */}
        {user && (
          <SalesMonitor
            userRole={user.role}
            currentBranch={user.branch}
            currentStaff={user.name}
          />
        )}
      </main>
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
