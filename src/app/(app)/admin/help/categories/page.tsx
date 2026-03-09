import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseButton } from '@/components/ui/enterprise';
import { Plus, Trash2, Tag, ListFilter } from 'lucide-react';

export const metadata = {
    title: 'Yardım Kategorileri - Admin'
};

export default async function HelpCategoriesPage() {
    const session = await getSession();
    if (!session || (session.role?.toUpperCase() !== 'SUPER_ADMIN' && session.role?.toUpperCase() !== 'PLATFORM_ADMIN')) {
        redirect('/');
    }

    const categories = await prisma.helpCategory.findMany({
        orderBy: { order: 'asc' },
        include: {
            _count: {
                select: { articles: true }
            }
        }
    });

    async function addCategory(formData: FormData) {
        'use server';
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const icon = formData.get('icon') as string;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (!name) return;

        const count = await prisma.helpCategory.count();
        await prisma.helpCategory.create({
            data: {
                name,
                description,
                icon,
                slug: `${slug}-${Date.now().toString().slice(-4)}`,
                order: count,
                tenantId: null // Global
            }
        });

        revalidatePath('/admin/help/categories');
    }

    async function deleteCategory(id: string) {
        'use server';
        await prisma.helpCategory.delete({ where: { id } });
        revalidatePath('/admin/help/categories');
    }

    return (
        <EnterprisePageShell
            title="Yardım Kategorileri"
            description="Bilgi Bankası için kullanılacak olan ana kategorileri buradan yönetebilirsiniz."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
                {/* Sol: Mevcut */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseSectionHeader title="Aktif Kategoriler" subtitle="Sistemde tanımlı global yardım kategorileri." />

                    {categories.length === 0 ? (
                        <EnterpriseCard className="p-8 text-center text-slate-500 border-dashed">
                            Henüz ekli kategori yok. Sağ panelden ekleyebilirsiniz.
                        </EnterpriseCard>
                    ) : (
                        <div className="space-y-3">
                            {categories.map((cat) => (
                                <EnterpriseCard key={cat.id} className="p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                            <ListFilter className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">{cat.name}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'Açıklama yok'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">/{cat.slug}</span>
                                                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                                    {cat._count.articles} Makale
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <form action={deleteCategory.bind(null, cat.id)}>
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

                {/* Sağ: Yeni */}
                <div>
                    <EnterpriseCard className="p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">Yeni Kategori Ekle</h3>
                        <form action={addCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori Adı</label>
                                <EnterpriseInput name="name" required placeholder="Örn: Finansal İşlemler" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Kısa Açıklama (Opsiyonel)</label>
                                <EnterpriseInput name="description" placeholder="Kategori ne hakkında?" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">İkon Adı (Opsiyonel)</label>
                                <EnterpriseInput name="icon" placeholder="Örn: CreditCard" />
                                <p className="text-[10px] text-slate-400 mt-1 leading-tight">İkonismi girilmezse varsayılan sistem simgesi gösterilir.</p>
                            </div>

                            <EnterpriseButton type="submit" className="w-full mt-4 flex items-center justify-center gap-2" variant="primary">
                                <Plus className="w-4 h-4" /> Kategoriyi Oluştur
                            </EnterpriseButton>
                        </form>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
