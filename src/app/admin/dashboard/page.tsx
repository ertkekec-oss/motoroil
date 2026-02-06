
import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
    // Top level stats for SaaS
    const [tenantsCount, activeSubscriptions, dailyRevenue] = await Promise.all([
        (prisma as any).tenant.count(),
        (prisma as any).subscription.count({ where: { status: 'ACTIVE' } }),
        (prisma as any).transaction.aggregate({
            _sum: { amount: true },
            where: {
                type: 'Sales',
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        })
    ]);

    const stats = [
        { name: 'Toplam Müşteri (Tenants)', value: tenantsCount, icon: 'Users', color: 'bg-blue-500' },
        { name: 'Aktif Abonelikler', value: activeSubscriptions, icon: 'Check', color: 'bg-green-500' },
        { name: 'Bugünkü Toplam İşlem', value: `₺${Number(dailyRevenue._sum?.amount || 0).toLocaleString()}`, icon: 'CreditCard', color: 'bg-indigo-500' },
        { name: 'Sistem Sağlığı', value: '100%', icon: 'Activity', color: 'bg-emerald-500' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kontrol Kulesi Özeti</h1>
                <p className="text-slate-500 text-sm">Sistem genelindeki güncel durum ve metrikler.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                                <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                        <div className="text-sm font-medium text-slate-500 mt-1">{stat.name}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Tenants */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Son Kayıt Olan Müşteriler</h3>
                        <button className="text-sm text-blue-600 font-semibold hover:underline">Tümünü Gör</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {/* Placeholder for real tenant list */}
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1 text-ellipsis overflow-hidden">Müşteri #{i}</p>
                                        <p className="text-xs text-slate-500">TRIAL Plan • Merkez Şube</p>
                                    </div>
                                </div>
                                <div className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-[10px] font-bold">DENEME</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Activity Log */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Sistem Aktivite Akışı</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 relative">
                                <div className="z-10 w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                {i < 3 && <div className="absolute left-1 top-4 w-px h-full bg-slate-100"></div>}
                                <div>
                                    <p className="text-xs font-semibold text-slate-900">Fatura Oluşturuldu</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Müşteri #{i} tarafından yeni bir e-fatura kesildi.</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">12 dakika önce</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
