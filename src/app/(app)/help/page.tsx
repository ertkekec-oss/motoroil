import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
    title: 'Yardım Merkezi - Periodya',
};

export default async function HelpCenterPage() {
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    const categories = await prisma.helpCategory.findMany({
        orderBy: { order: 'asc' },
        include: {
            topics: {
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { tenantId: session.tenantId },
                        { tenantId: null }
                    ]
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto font-sans">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-white mb-4">Nasıl yardımcı olabiliriz?</h1>
                <p className="text-gray-400">Sistem kullanımı ve sıkça sorulan sorular için detaylı rehber.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl hover:border-orange-500/30 transition-all">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            📚 {cat.name}
                        </h2>
                        {cat.description && <p className="text-sm text-gray-500 mb-4">{cat.description}</p>}

                        <ul className="space-y-3">
                            {cat.topics.length === 0 ? (
                                <li className="text-xs text-gray-600">Bu kategoride henüz içerik yok.</li>
                            ) : (
                                cat.topics.map(topic => (
                                    <li key={topic.id}>
                                        <Link href={`/help/${topic.slug}`} className="text-sm text-gray-300 hover:text-orange-400 transition-colors flex items-center justify-between">
                                            <span>{topic.title}</span>
                                            <span className="text-gray-600">→</span>
                                        </Link>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Aradığınızı bulamadınız mı?</h3>
                <p className="text-gray-400 mb-6 text-sm">Destek ekibimiz size yardımcı olmaktan memnuniyet duyar.</p>
                <Link href="/support/new" className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 inline-block">
                    Destek Talebi Oluştur
                </Link>
                <Link href="/support" className="px-6 py-3 ml-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all inline-block">
                    Taleplerim
                </Link>
            </div>
        </div>
    );
}
