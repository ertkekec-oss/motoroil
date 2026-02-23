import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topic = await prisma.helpTopic.findUnique({ where: { slug } });
    return { title: topic?.title ? `${topic.title} - Yardım` : 'Yardım Detayı' };
}

export default async function HelpTopicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    const topic = await prisma.helpTopic.findUnique({
        where: { slug },
        include: { category: true }
    });

    if (!topic || topic.status !== 'PUBLISHED') {
        notFound();
    }

    if (topic.tenantId && topic.tenantId !== session.tenantId) {
        // Topic is tenant specific but doesnt match current tenant
        notFound();
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto font-sans">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/help" className="text-orange-500 hover:underline flex items-center gap-1 text-sm font-medium">
                    ← Tüm Konular
                </Link>
                <div className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {topic.category.name}
                </div>
            </div>

            <div className="bg-[#0f111a] border border-white/5 rounded-3xl p-8 md:p-12 shadow-xl shadow-black/50">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">{topic.title}</h1>

                {topic.excerpt && (
                    <p className="text-lg text-gray-400 mb-8 font-medium">
                        {topic.excerpt}
                    </p>
                )}

                <div className="prose prose-invert prose-orange max-w-none text-gray-300">
                    {/* Basic Markdown Rendering Placeholder - Using dangerouslySetInnerHTML assuming safe content from Admin */}
                    {/* In production, recommend using react-markdown or marked with DOMPurify */}
                    <div dangerouslySetInnerHTML={{ __html: topic.body }} />
                </div>

                <div className="mt-16 pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-white font-bold mb-2">Bu içerik yardımcı oldu mu?</h3>
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <button className="p-2 bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded-lg transition-colors border border-white/5">
                                    👍 Evet
                                </button>
                                <button className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors border border-white/5">
                                    👎 Hayır
                                </button>
                            </div>
                        </div>

                        <div className="text-center md:text-right bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10">
                            <p className="text-sm text-gray-400 mb-2">Sorun devam ediyor mu?</p>
                            <Link href={`/support/new?topicId=${topic.id}`} className="inline-block px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20">
                                Destek Talebi Oluştur →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
