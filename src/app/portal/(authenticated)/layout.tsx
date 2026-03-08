
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { jwtVerify } from 'jose';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('portal_token');

    if (!token) {
        redirect('/portal/login');
    }

    let userPayload: any = {};
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me');
        const { payload } = await jwtVerify(token.value, secret);
        userPayload = payload;
    } catch (e) {
        redirect('/portal/login');
    }

    return (
        <div className="flex min-h-screen bg-[#0f111a] text-white font-sans selection:bg-blue-500 selection:text-white">
            {/* Simple Sidebar */}
            <aside className="w-64 bg-[#161b22] border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-50">
                <div className="p-8">
                    <div className="text-xs font-bold text-blue-500 tracking-widest mb-1 uppercase">Müşteri Portalı</div>
                    <div className="text-xl font-black tracking-tighter text-white">{userPayload.companyName || 'HOŞGELDİNİZ'}</div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <PortalLink href="/portal/dashboard" icon="📊" label="Genel Bakış" />
                    <PortalLink href="/portal/invoices" icon="🧾" label="Faturalarım" />
                    <PortalLink href="/portal/services" icon="🛠️" label="Servis Durumu" />
                    <PortalLink href="/portal/offers" icon="📋" label="Teklifler" />

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <PortalLink href="/portal/balance" icon="💰" label="Bakiye & Ödeme" />
                    </div>
                </nav>

                <div className="p-6 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                            {userPayload.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{userPayload.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">Müşteri Hesabı</div>
                        </div>
                    </div>
                    <form action="/api/portal/auth/logout" method="POST">
                        <button className="w-full bg-white/5 hover:bg-white/10 text-red-400 text-xs font-bold py-2 rounded transition-colors">
                            Güvenli Çıkış
                        </button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 pl-64 transition-all w-full">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function PortalLink({ href, icon, label }: { href: string, icon: string, label: string }) {
    return (
        <Link href={href} className="group flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
            <span className="font-bold text-sm tracking-wide">{label}</span>
        </Link>
    );
}
