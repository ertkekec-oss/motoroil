import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = { title: 'Yardım Merkezi Yönetimi' };

export default async function AdminTenantHelpPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        redirect('/login');
    }

    const tenantId = params.id;
    const isGlobal = tenantId === 'global'; // using 'global' as keyword to manage global topics

    const categories = await prisma.helpCategory.findMany({
        orderBy: { order: 'asc' },
        include: {
            topics: {
                where: isGlobal ? { tenantId: null } : { tenantId },
                orderBy: { order: 'asc' }
            }
        }
    });

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white">Yardım Konuları ({isGlobal ? 'Global' : 'Kiracı Özel'})</h1>
                    <p className="text-gray-400 text-sm mt-1">Bu alandan destek merkezi dokümanlarınızı (Knowledge Base) yönetebilirsiniz.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all">
                        + Kategori Ekle
                    </button>
                    <button className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all">
                        + Konu Ekle (Makale)
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-[#0f111a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                📚 {cat.name}
                            </h2>
                            <div className="flex gap-2 text-xs">
                                <button className="text-gray-400 hover:text-white transition-colors">Düzenle</button>
                                <button className="text-red-400 hover:text-red-300 transition-colors">Sil</button>
                            </div>
                        </div>
                        <div className="p-0">
                            {cat.topics.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500">Bu kategoride henüz makale oluşturmamışsınız.</div>
                            ) : (
                                <ul className="divide-y divide-white/5">
                                    {cat.topics.map(topic => (
                                        <li key={topic.id} className="px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="font-bold text-gray-300 mb-1">{topic.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xl">{topic.excerpt || 'Özet girilmedi.'}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${topic.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                    {topic.status}
                                                </span>
                                                <div className="flex gap-2 text-xs font-bold">
                                                    <span className="text-green-500">👍 {topic.upvotes}</span>
                                                    <span className="text-red-500">👎 {topic.downvotes}</span>
                                                </div>
                                                <div className="flex gap-3 text-sm ml-4 border-l border-white/10 pl-4">
                                                    <Link href={`/help/${topic.slug}`} target="_blank" className="text-blue-400 hover:text-blue-300 transition-colors">İzle</Link>
                                                    <button className="text-orange-400 hover:text-orange-300 transition-colors">Düzenle</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}

                {categories.length === 0 && (
                    <div className="p-12 bg-[#0f111a] border border-white/5 rounded-2xl text-center shadow-xl">
                        <span className="text-4xl mb-4 block">📝</span>
                        <h3 className="text-white font-bold text-lg">Kayıtlı Kategori Yok</h3>
                        <p className="text-sm text-gray-500 mt-2">Makale oluşturabilmek için önce bir Kategori eklemelisiniz.</p>
                    </div>
                )}
            </div>

            <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">ℹ️ MVP Bilgilendirmesi</h4>
                <p className="text-xs text-blue-400/80 leading-relaxed">
                    Şu anda MVP aşamasındasınız. Butonlar (Yeni Ekle, Düzenle) arayüz tasarımı (Mockup) olarak yerleştirilmiştir. Modal açılışları ve API-POST işlemleri "Gelecek Geliştirmeler (Faz 2)" kapsamında, doğrudan Markdown Editor komponenti entegre edilerek tamamlanacaktır. Veritabanı (Prisma) altyapısı mevcuttur.
                </p>
            </div>
        </div>
    );
}
