
import { getPortalUser } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function PortalDashboard() {
    const user = await getPortalUser();
    if (!user) redirect('/portal/login');

    const customer = await (prisma as any).customer.findUnique({
        where: { id: user.id },
        include: {
            invoices: {
                where: { status: { not: 'Cancelled' } },
                orderBy: { invoiceDate: 'desc' },
                take: 5
            },
            services: {
                where: { status: { not: 'Completed' } },
                orderBy: { createdAt: 'desc' },
                take: 3
            },
            quotes: {
                where: { status: 'Sent' },
                orderBy: { createdAt: 'desc' },
                take: 3
            }
        }
    });

    if (!customer) redirect('/portal/login');

    const totalSpent = customer.invoices.reduce((acc: number, inv: any) => acc + Number(inv.totalAmount), 0);
    const balance = Number(customer.balance || 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black mb-1 tracking-tight">Merhaba, {customer.name} 👋</h1>
                <p className="text-gray-400 text-sm">Finansal durumunuz ve servisleriniz aşağıdadır.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Balance Card */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 text-6xl opacity-10">💰</div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">GÜNCEL BAKİYE</div>
                    <div className={`text-3xl font-black ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {balance > 0 ? '-' : ''}₺{Math.abs(balance).toLocaleString()}
                    </div>
                    <div className="text-xs mt-2 opacity-50">
                        {balance > 0 ? 'Ödenmesi gereken tutar.' : 'Alacaklı veya sıfır bakiye.'}
                    </div>
                    {balance > 0 && (
                        <button className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs transition-colors">
                            HEMEN ÖDE ➔
                        </button>
                    )}
                </div>

                {/* Active Services */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 text-6xl opacity-10">🛠️</div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">AKTİF SERVİSLER</div>
                    <div className="text-3xl font-black text-amber-500">
                        {customer.services.length}
                    </div>
                    <div className="text-xs mt-2 opacity-50">
                        {customer.services.length > 0 ? 'İşlem gören cihazlarınız var.' : 'Şu an serviste cihazınız yok.'}
                    </div>
                </div>

                {/* Pending Offers */}
                <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 text-6xl opacity-10">📋</div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">BEKLEYEN TEKLİFLER</div>
                    <div className="text-3xl font-black text-purple-400">
                        {customer.quotes.length}
                    </div>
                    <div className="text-xs mt-2 opacity-50">Onay bekleyen teklifleriniz.</div>
                </div>
            </div>

            {/* Content Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Recent Invoices */}
                <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Son Faturalar</h3>
                        <a href="/portal/invoices" className="text-xs text-blue-400 font-bold hover:underline">TÜMÜNÜ GÖR</a>
                    </div>
                    <div className="divide-y divide-white/5">
                        {customer.invoices.length === 0 ? (
                            <div className="p-8 text-center opacity-30 text-sm">Fatura bulunamadı.</div>
                        ) : (
                            customer.invoices.map((inv: any) => (
                                <div key={inv.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                    <div>
                                        <div className="font-bold text-sm">#{inv.invoiceNo}</div>
                                        <div className="text-xs opacity-50">{new Date(inv.invoiceDate).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">₺{Number(inv.totalAmount).toLocaleString()}</div>
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${inv.status === 'Ödendi' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {inv.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Active Services Detail */}
                <div className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Servis Durumu</h3>
                        <a href="/portal/services" className="text-xs text-amber-400 font-bold hover:underline">DETAYLAR</a>
                    </div>
                    <div className="divide-y divide-white/5">
                        {customer.services.length === 0 ? (
                            <div className="p-8 text-center opacity-30 text-sm">Aktif servis kaydı yok.</div>
                        ) : (
                            customer.services.map((srv: any) => (
                                <div key={srv.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between mb-2">
                                        <div className="font-bold text-sm">{srv.vehicleBrand || 'Cihaz'} {srv.vehicleSerial || ''}</div>
                                        <div className="text-xs font-bold text-amber-500 animate-pulse">İŞLEMDE</div>
                                    </div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                                        <div className="bg-amber-500 h-full w-[60%] animate-pulse"></div>
                                    </div>
                                    <div className="text-xs opacity-50">{srv.notes || 'İşlem devam ediyor...'}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
