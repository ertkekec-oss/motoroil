
export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const sessionResult: any = await getSession();
    // Support new structure (session.user) or fallback to flat structure
    const session = sessionResult?.user || sessionResult;

    // 1. Role Gate - Allow platform owner OR super admins
    const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN';

    if (!session || !isPlatformAdmin) {
        redirect('/login?error=unauthorized_admin');
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-inter">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Masaüstü Admin
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">SaaS Kontrol Kulesi</p>
                </div>

                <AdminSidebar userRole={session.role || 'USER'} />

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                            {session.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{session.username}</p>
                            <p className="text-xs text-slate-400">{session.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
