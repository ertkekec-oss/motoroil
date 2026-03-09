import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseButton, EnterpriseSelect } from '@/components/ui/enterprise';
import { Plus, Trash2, FileText, Eye, AlertCircle } from 'lucide-react';

export const metadata = {
    title: 'Makale Kütüphanesi - Admin'
};

export default async function HelpArticlesPage() {
    const session = await getSession();
    if (!session || (session.role?.toUpperCase() !== 'SUPER_ADMIN' && session.role?.toUpperCase() !== 'PLATFORM_ADMIN')) {
        redirect('/');
    }

    const categories = await prisma.helpCategory.findMany({
        orderBy: { name: 'asc' }
    });

    const articles = await prisma.helpArticle.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            category: true
        }
    });

    async function addArticle(formData: FormData) {
        'use server';
        const title = formData.get('title') as string;
        const categoryId = formData.get('categoryId') as string;
        const summary = formData.get('summary') as string;
        const content = formData.get('content') as string;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (!title || !categoryId || !content) return;

        await prisma.helpArticle.create({
            data: {
                title,
                categoryId,
                summary,
                content,
                slug: `${slug}-${Date.now().toString().slice(-4)}`,
                status: 'PUBLISHED',
                tenantId: null // Global
            }
        });

        revalidatePath('/admin/help/articles');
    }

    async function deleteArticle(id: string) {
        'use server';
        await prisma.helpArticle.delete({ where: { id } });
        revalidatePath('/admin/help/articles');
    }

    return (
        <EnterprisePageShell
            title="Makale Kütüphanesi"
            description="Bilgi bankasında müşterilerin aradığı konulardaki çözüm içerikleri."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
                {/* Sol: Mevcut Makaleler */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseSectionHeader title="Yayınlanan Makaleler" subtitle={`Toplam ${articles.length} makale yayında.`} />

                    {articles.length === 0 ? (
                        <EnterpriseCard className="p-8 text-center text-slate-500 border-dashed">
                            Henüz yazılmış bir makale yok.
                        </EnterpriseCard>
                    ) : (
                        <div className="space-y-3">
                            {articles.map((art) => (
                                <EnterpriseCard key={art.id} className="p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{art.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded whitespace-nowrap">
                                                    {art.category?.name || 'Kategorisiz'}
                                                </span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> {art.viewCount} okunma
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/help/articles/${art.slug}`} target="_blank" className="p-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" title="Görüntüle">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <form action={deleteArticle.bind(null, art.id)}>
                                            <button type="submit" className="p-2 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-900/60" title="Sil">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </EnterpriseCard>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sağ: Yeni Ekle */}
                <div>
                    <EnterpriseCard className="p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">Hızlı Makale Ekle</h3>

                        {categories.length === 0 ? (
                            <div className="text-sm border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 p-3 rounded-lg flex gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <div>
                                    Önce en az bir kategori eklemelisiniz.
                                    <Link href="/admin/help/categories" className="underline block mt-1 font-bold">Kategori Ekle</Link>
                                </div>
                            </div>
                        ) : (
                            <form action={addArticle} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori Seçin</label>
                                    <EnterpriseSelect name="categoryId" required>
                                        <option value="">Kategori Seçiniz</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </EnterpriseSelect>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Makale Başlığı</label>
                                    <EnterpriseInput name="title" required placeholder="Sık Sorulan Sorular" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Özet Açıklama</label>
                                    <EnterpriseInput name="summary" placeholder="Kısa bir özet yazın" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">İçerik (Markdown Destekli)</label>
                                    <textarea
                                        name="content"
                                        required
                                        className="w-full flex min-h-[120px] rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-600 dark:focus:ring-slate-700"
                                        placeholder="# Ana Başlık&#10;&#10;Metin içeriği buraya..."
                                        rows={8}
                                    />
                                </div>

                                <EnterpriseButton type="submit" className="w-full mt-4 flex items-center justify-center gap-2" variant="primary">
                                    <Plus className="w-4 h-4" /> Yayına Al
                                </EnterpriseButton>
                            </form>
                        )}

                        <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-400 mb-2">Kurulum Notları:</h4>
                            <p className="text-[10px] text-slate-500">
                                Makale arkaplanda otomatik yayınlanır. Markdown formatını destekler. Gelişmiş içerik düzenleyici (WYSIWYG) yakında eklenecektir.
                            </p>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
