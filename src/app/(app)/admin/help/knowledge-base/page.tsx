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
                                    <div className="p-4 sm:p-6">
                                        {cat.articles.length === 0 ? (
                                            <EnterpriseCard className="text-center py-8 text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/20 shadow-none border border-dashed border-slate-200 dark:border-slate-800/60" noPadding>
                                                Bu kategoride henüz makale yok.
                                            </EnterpriseCard>
                                        ) : (
                                            <div className="space-y-3">
                                                {cat.articles.map(art => (
                                                    <div key={art.id} className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border border-slate-100/50 dark:border-white/5 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-slate-700">
                                                                <FileText className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
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
                    <EnterpriseCard>
                        <h3 className="font-black text-sm mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100 tracking-tight">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <Folders className="w-4 h-4" /> 
                            </div>
                            Yeni Kategori Ekle
                        </h3>
                        <form action={addCategory} className="space-y-5">
                            <EnterpriseInput label="Kategori Adı" name="name" required placeholder="Örn: Başlangıç Kılavuzu" />
                            <EnterpriseInput label="Açıklama (Opsiyonel)" name="description" placeholder="Kategori ne hakkında?" />
                            <EnterpriseButton type="submit" className="w-full flex items-center justify-center gap-2 mt-2" variant="primary">
                                <Plus className="w-4 h-4" /> Kategori Oluştur
                            </EnterpriseButton>
                        </form>
                    </EnterpriseCard>

                    {/* Makale Ekleme Formu */}
                    <EnterpriseCard>
                        <h3 className="font-black text-sm mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-100 tracking-tight">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <FileText className="w-4 h-4" />
                            </div>
                            Yeni Makale Yaz
                        </h3>

                        {categories.length === 0 ? (
                            <div className="text-[11px] font-bold bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[16px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/5">
                                Makale ekleyebilmek için önce kategori oluşturmalısınız.
                            </div>
                        ) : (
                            <form action={addArticle} className="space-y-5">
                                <EnterpriseSelect label="Ait Olduğu Kategori" name="categoryId" required>
                                    <option value="">Kategori Seçin...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </EnterpriseSelect>
                                
                                <EnterpriseInput
                                    label="Makale Başlığı"
                                    name="title"
                                    required
                                    placeholder="Örn: Sistem nasıl kurulur?"
                                />
                                
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
                                        İçerik (Markdown)
                                    </label>
                                    <textarea
                                        name="content"
                                        required
                                        placeholder="# 1. Adım\nİçerik açıklaması buraya..."
                                        rows={8}
                                        className="w-full p-4 min-h-[140px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 focus:ring-indigo-500/50 focus:outline-none focus:ring-2 focus:border-indigo-500 rounded-[16px] text-sm font-bold text-slate-900 dark:text-white transition-all shadow-sm resize-none font-mono"
                                    />
                                </div>

                                <EnterpriseButton type="submit" variant="primary" className="w-full flex items-center justify-center gap-2 mt-2">
                                    <Plus className="w-4 h-4" /> Hemen Yayınla
                                </EnterpriseButton>
                            </form>
                        )}
                    </EnterpriseCard>

                </div>
            </div>
        </EnterprisePageShell>
    );
}
