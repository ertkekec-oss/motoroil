import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseButton } from '@/components/ui/enterprise';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';

export const metadata = {
    title: 'Onboarding Akışı Yönetimi - Periodya Admin'
};

export default async function OnboardingAdminPage() {
    const session = await getSession();
    if (!session || (session.role?.toUpperCase() !== 'SUPER_ADMIN' && session.role?.toUpperCase() !== 'PLATFORM_ADMIN')) {
        redirect('/');
    }

    const steps = await prisma.onboardingStep.findMany({
        orderBy: { order: 'asc' }
    });

    async function addStep(formData: FormData) {
        'use server';
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const href = formData.get('href') as string;
        const actionKey = formData.get('actionKey') as string;

        if (!title || !href || !actionKey) return;

        const count = await prisma.onboardingStep.count();
        await prisma.onboardingStep.create({
            data: {
                title,
                description,
                href,
                actionKey,
                order: count,
                isActive: true
            }
        });

        revalidatePath('/admin/settings/onboarding');
    }

    async function toggleStep(id: string, currentStatus: boolean) {
        'use server';
        await prisma.onboardingStep.update({
            where: { id },
            data: { isActive: !currentStatus }
        });
        revalidatePath('/admin/settings/onboarding');
    }

    async function deleteStep(id: string) {
        'use server';
        await prisma.onboardingStep.delete({ where: { id } });
        revalidatePath('/admin/settings/onboarding');
    }

    return (
        <EnterprisePageShell
            title="Onboarding / Ürün Keşfi Widget Yönetimi"
            description="Müşteri Paneli 'Periodya'yı Keşfedin' widget adımlarını ve API aksiyonlarını buradan yönetebilirsiniz."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">

                {/* Sol Taraf: Mevcut Adımlar */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseSectionHeader title="Aktif Widget Adımları" subtitle="Bütün müşterilerde sıralı olarak görünecek olan keşif görevleri." />

                    {steps.length === 0 ? (
                        <EnterpriseCard className="p-8 text-center text-slate-500 border-dashed">
                            Henüz ekli bir onboarding adımı yok. Lütfen sağ panelden bir görev ekleyin.
                        </EnterpriseCard>
                    ) : (
                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <EnterpriseCard key={step.id} className={`p-4 flex items-center justify-between transition-colors ${!step.isActive ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="cursor-grab text-slate-400 hover:text-slate-600">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100">{step.title}</h4>
                                            <p className="text-xs text-slate-500">{step.description} • Yol: {step.href}</p>
                                            <p className="text-[10px] font-mono mt-1 text-blue-500 bg-blue-50 px-2 py-0.5 rounded w-max">Aksiyon: {step.actionKey}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <form action={toggleStep.bind(null, step.id, step.isActive)}>
                                            <button type="submit" className={`p-2 rounded-md ${step.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`} title={step.isActive ? "Pasife Al" : "Aktif Et"}>
                                                {step.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                            </button>
                                        </form>
                                        <form action={deleteStep.bind(null, step.id)}>
                                            <button type="submit" className="p-2 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200" title="Sil">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </EnterpriseCard>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sağ Taraf: Yeni Adım Ekleme */}
                <div>
                    <EnterpriseCard className="p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">Yeni Adım Ekle</h3>
                        <form action={addStep} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Görünür Başlık</label>
                                <EnterpriseInput name="title" required placeholder="Örn: İlk Ürünü Ekle" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Kısa Açıklama (Opsiyonel)</label>
                                <EnterpriseInput name="description" placeholder="Örn: Kataloga yeni ürün ekleyin" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Yönlendirilecek URL</label>
                                <EnterpriseInput name="href" required placeholder="Örn: /products/new" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Tetikleyici Anahtar (Action Key)</label>
                                <EnterpriseInput name="actionKey" required placeholder="Örn: PRODUCT_ADDED" />
                                <p className="text-[10px] text-slate-400 mt-1 leading-tight">Bu anahtar, müşteri başarılı aksiyonu aldığında sistem tarafından `ProductOnboardingProgress` üzerine eklenecektir. Daha önceden tanımlanmış keyler kullanılabilir.</p>
                            </div>

                            <EnterpriseButton type="submit" className="w-full mt-4 flex items-center justify-center gap-2" variant="primary">
                                <Plus className="w-4 h-4" /> Sisteme Kaydet
                            </EnterpriseButton>
                        </form>
                    </EnterpriseCard>

                    <EnterpriseCard className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
                        <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300 mb-2">Varsayılan Anahtarlar (Action Keys)</h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5 list-disc pl-4">
                            <li><code>firstInvoice</code> : Fatura oluşturunca otomatik tetiklenir.</li>
                            <li><code>firstCustomer</code> : Cari ekleyince otomatik tetiklenir.</li>
                            <li><code>inventoryViewed</code> : Stok sayfasına girince otomatik tetiklenir.</li>
                            <li><code>salesXViewed</code> : Saha satışa girince otomatik tetiklenir.</li>
                            <li><code>b2bHubViewed</code> : B2B paneline girince otomatik tetiklenir.</li>
                        </ul>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
