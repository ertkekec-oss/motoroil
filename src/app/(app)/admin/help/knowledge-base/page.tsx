import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseButton, EnterpriseSelect } from '@/components/ui/enterprise';
import { Plus, Trash2, FileText, Eye, AlertCircle, ListFilter, Folders } from 'lucide-react';

export const metadata = {
    title: 'Bilgi Bankası Merkezi - Admin'
};

export default async function KnowledgeHubPage() {
    const session = await getSession();
    if (!session || (session.role?.toUpperCase() !== 'SUPER_ADMIN' && session.role?.toUpperCase() !== 'PLATFORM_ADMIN')) {
        redirect('/');
    }

    const categories = await prisma.helpCategory.findMany({
        orderBy: { order: 'asc' },
        include: {
            _count: {
                select: { articles: true }
            },
            articles: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    async function addCategory(formData: FormData) {
        'use server';
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (!name) return;

        const count = await prisma.helpCategory.count();
        await prisma.helpCategory.create({
            data: {
                name,
                description,
                slug: `${slug}-${Date.now().toString().slice(-4)}`,
                order: count,
                tenantId: null // Global
            }
        });

        revalidatePath('/admin/help/knowledge-base');
    }

    async function deleteCategory(id: string) {
        'use server';
        await prisma.helpCategory.delete({ where: { id } });
        revalidatePath('/admin/help/knowledge-base');
    }

    async function addArticle(formData: FormData) {
        'use server';
        const title = formData.get('title') as string;
        const categoryId = formData.get('categoryId') as string;
        const content = formData.get('content') as string;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (!title || !categoryId || !content) return;

        await prisma.helpArticle.create({
            data: {
                title,
                categoryId,
                content,
                slug: `${slug}-${Date.now().toString().slice(-4)}`,
                status: 'PUBLISHED',
                tenantId: null
            }
        });

        revalidatePath('/admin/help/knowledge-base');
    }

    async function deleteArticle(id: string) {
        'use server';
        await prisma.helpArticle.delete({ where: { id } });
        revalidatePath('/admin/help/knowledge-base');
    }

    return (
        <EnterprisePageShell
            title="Bilgi Bankası Merkezi (Hub)"
            description="Tüm yardım kategorilerini ve çözüm makalelerini tek bir alandan yönetin."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">

                {/* SOL PANEL: KATEGORİLER VE İÇİNDEKİ MAKALELER */}
                <div className="lg:col-span-2 space-y-8">
                    {categories.length === 0 ? (
                        <EnterpriseCard className="p-8 text-center text-slate-500 border-dashed">
                            Henüz ekli kategori yok. Lütfen sağ panelden yeni bir kategori ekleyin.
                        </EnterpriseCard>
                    ) : (
                        <div className="space-y-6">
                            {categories.map((cat) => (
                                <EnterpriseCard key={cat.id} className="p-0 overflow-hidden group">
                                    {/* Kategori Başlığı ve Aksiyonları */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-100/50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                                                <Folders className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                                                <p className="text-[10px] text-slate-500">{cat.description || 'Açıklama yok'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                {cat._count.articles} İçerik
                                            </span>
                                            <form action={deleteCategory.bind(null, cat.id)}>
                                                <button type="submit" className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline" title="Sil">
                                                    Kategoriyi Sil
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Makale Listesi */}
                                    <div className="p-4">
                                        {cat.articles.length === 0 ? (
                                            <div className="text-center py-6 text-xs text-slate-400">
                                                Bu kategoride henüz makale yok.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {cat.articles.map(art => (
                                                    <div key={art.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-4 h-4 text-slate-400" />
                                                            <div className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                                {art.title}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <Link href={`/help/articles/${art.slug}`} target="_blank" className="text-slate-400 hover:text-blue-600 transition-colors">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <form action={deleteArticle.bind(null, art.id)}>
                                                                <button type="submit" className="text-slate-400 hover:text-rose-500 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </EnterpriseCard>
                            ))}
                        </div>
                    )}
                </div>

                {/* SAĞ PANEL: EKLEME FORMLARI */}
                <div className="space-y-6 sticky top-24">

                    {/* Kategori Ekleme Formu */}
                    <EnterpriseCard className="p-6">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Folders className="w-4 h-4 text-orange-500" /> Yeni Kategori Ekle
                        </h3>
                        <form action={addCategory} className="space-y-3">
                            <div>
                                <EnterpriseInput name="name" required placeholder="Kategori Adı..." />
                            </div>
                            <div>
                                <EnterpriseInput name="description" placeholder="Açıklama (Opsiyonel)" />
                            </div>
                            <EnterpriseButton type="submit" className="w-full flex items-center justify-center gap-2 text-xs" variant="secondary">
                                <Plus className="w-3 h-3" /> Ekle
                            </EnterpriseButton>
                        </form>
                    </EnterpriseCard>

                    {/* Makale Ekleme Formu */}
                    <EnterpriseCard className="p-6 bg-slate-900 text-white dark:bg-slate-950 border-none relative overflow-hidden">
                        {/* Arka plan süsü */}
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                            <FileText className="w-32 h-32" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                                <FileText className="w-4 h-4 text-blue-400" /> Yeni Makale Yaz
                            </h3>

                            {categories.length === 0 ? (
                                <div className="text-xs bg-slate-800 p-3 rounded-lg text-slate-400 leading-relaxed">
                                    Makale ekleyebilmek için önce yukarıdaki menüden en az 1 kategori eklemelisiniz.
                                </div>
                            ) : (
                                <form action={addArticle} className="space-y-4">
                                    <div>
                                        <select
                                            name="categoryId"
                                            required
                                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Kategori Seçin...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <input
                                            name="title"
                                            required
                                            placeholder="Makale Başlığı..."
                                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            name="content"
                                            required
                                            placeholder="# 1. Adım\nİçerik açıklaması buraya... (Markdown Destekler)"
                                            rows={6}
                                            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 resize-none font-mono"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Hemen Yayınla
                                    </button>
                                </form>
                            )}
                        </div>
                    </EnterpriseCard>

                </div>
            </div>
        </EnterprisePageShell>
    );
}
