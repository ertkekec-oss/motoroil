
export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink href="/admin/dashboard" icon="dashboard">🧭 Executive Dashboard</NavLink>
                    <NavLink href="/admin/tenants" icon="users">Müşteriler (Tenants)</NavLink>
                    <NavLink href="/admin/website" icon="globe">Website Yönetimi (CMS)</NavLink>
                    <NavLink href="/admin/sales-radar" icon="radar">Satış Radarı (Upsell)</NavLink>
                    <NavLink href="/admin/plans" icon="tag">Paketler & Fiyatlar</NavLink>
                    <NavLink href="/admin/transactions" icon="credit-card">Ödemeler</NavLink>
                    <NavLink href="/admin/audit-logs" icon="activity">Denetim Kayıtları</NavLink>
                    <NavLink href="/admin/support/tickets" icon="inbox">Destek Talepleri</NavLink>
                    <NavLink href="/admin/tenants/PLATFORM_ADMIN/help" icon="help">Yardım Merkezi</NavLink>
                    <NavLink href="/admin/marketplace/ops" icon="radar">Pazaryeri Operasyonları</NavLink>

                    <div className="pt-4 mt-4 font-semibold text-xs text-slate-500 uppercase tracking-wider px-3 mb-1">B2B Ağ Yönetimi</div>
                    <NavLink href="/admin/catalog/categories" icon="dashboard">Kategoriler</NavLink>
                    <NavLink href="/admin/products" icon="shield">Onay Masası</NavLink>
                    <NavLink href="/admin/companies" icon="users">Firmalar</NavLink>
                    <NavLink href="/admin/ops/providers" icon="globe">Altyapı</NavLink>
                    <NavLink href="/admin/ops/orders" icon="radar">Ağ Siparişleri</NavLink>
                    <NavLink href="/admin/ops/payments" icon="credit-card">Finans & Escrow</NavLink>
                    <NavLink href="/admin/ops/shipments" icon="globe">Lojistik & Kargo</NavLink>
                    <NavLink href="/admin/ops/ledgers" icon="activity">Sistem Ledger (Audit)</NavLink>
                    <NavLink href="/admin/platform-finance" icon="credit-card">Platform Finans</NavLink>
                    <NavLink href="/admin/trust-monitor" icon="activity">Trust Monitor</NavLink>
                    <NavLink href="/admin/payouts" icon="credit-card">Payout Kontrol</NavLink>

                    <div className="pt-4 mt-4 font-semibold text-xs text-slate-500 uppercase tracking-wider px-3 mb-1">Payments & Escrow Governance</div>
                    <NavLink href="/admin/payments-escrow/policies" icon="shield">Escrow Policies</NavLink>
                    <NavLink href="/admin/payments-escrow/commissions" icon="tag">Commission Rules</NavLink>
                    <NavLink href="/admin/payments-escrow/providers" icon="globe">Payment Providers</NavLink>
                    <NavLink href="/admin/payments-escrow/audit" icon="activity">Governance Audit</NavLink>

                    <div className="pt-4 mt-4 font-semibold text-xs text-slate-500 uppercase tracking-wider px-3 mb-1">🛡 Risk & Resolution</div>
                    <NavLink href="/admin/disputes" icon="radar">Dispute Queue</NavLink>
                    <NavLink href="/admin/disputes/policies" icon="shield">Resolution Policies</NavLink>

                    <div className="pt-4 mt-4 font-semibold text-xs text-slate-500 uppercase tracking-wider px-3 mb-1">📣 Growth & Monetization</div>
                    <NavLink href="/admin/growth/boost-rules" icon="tag">Boost Rules</NavLink>
                    <NavLink href="/admin/growth/subscriptions" icon="users">Hub Subscriptions</NavLink>
                    <NavLink href="/admin/growth/billing-health" icon="activity">Billing Health</NavLink>
                    <NavLink href="/admin/growth/revenue" icon="dashboard">Revenue Analytics</NavLink>
                    <NavLink href="/admin/growth/audit" icon="shield">Growth Audit</NavLink>

                    <div className="pt-4 mt-4 font-semibold text-xs text-slate-500 uppercase tracking-wider px-3 mb-1">Sistem & Güvenlik</div>
                    <NavLink href="/admin/security" icon="shield">Operasyonel Güvenlik</NavLink>
                    <NavLink href="/admin/logs" icon="terminal">Sistem Logları</NavLink>

                    <div className="pt-4 mt-4 border-t border-slate-700">
                        <NavLink href="/" icon="terminal">POS Terminaline Dön</NavLink>
                    </div>
                </nav>

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

function NavLink({ href, children, icon }: { href: string, children: React.ReactNode, icon: string }) {
    // Basic Icon map
    const icons: any = {
        dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
        users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
        tag: <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />,
        'credit-card': <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />,
        radar: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
        activity: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M6 16.5v2.25a2.25 2.25 0 01-2.25 2.25H3.75m11.25-18v11.25c0 1.242.504 2.375 1.314 3.214C16.89 15.65 17.5 16.023 18 16.5m-2.25-2.25v2.25a2.25 2.25 0 01-2.25 2.25H12.75m6-4.5V3" />,
        globe: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0112 13.5c-2.998 0-5.74-1.1-7.843-2.918m0 0A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253" />,
        terminal: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />,
        inbox: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-2.24-1.815-4.055-4.055-4.055H4.055A4.055 4.055 0 000 13.838z" />,
        help: <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />,
        shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
    };

    return (
        <Link href={href} className="group flex items-center px-3 py-2.5 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-all">
            <svg className="mr-3 h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                {icons[icon]}
            </svg>
            {children}
        </Link>
    );
}
