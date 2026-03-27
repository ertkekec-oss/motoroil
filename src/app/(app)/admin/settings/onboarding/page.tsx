import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseInput, EnterpriseButton, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { Plus, Trash2, GripVertical, Check, X, ShieldCheck, ListChecks, Hash, Link as LinkIcon, Settings } from 'lucide-react';

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
            title="Onboarding / Keşif Widget Yönetimi"
            description="Müşteri Paneli 'Periodya'yı Keşfedin' widget adımlarını ve evrensel API aksiyonlarını yöneteceğiniz kontrol paneli."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Side: Existing Steps */}
                <div className="lg:col-span-2 space-y-6">
                    <EnterpriseCard noPadding>
                        <EnterpriseSectionHeader 
                            title="Aktif Navigasyon Adımları" 
                            subtitle="Bütün müşterilerde sıralı olarak görünecek olan keşif görevleri." 
                            icon={<ListChecks className="w-5 h-5" />}
                            className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20"
                        />
                        
                        <div className="p-6 md:p-8">
                            {steps.length === 0 ? (
                                <EnterpriseEmptyState 
                                    icon={<ListChecks className="w-10 h-10" />}
                                    title="Kayıt Bulunamadı"
                                    description="Sistem üzerinde aktif bir onboarding adımı yoktur."
                                />
                            ) : (
                                <div className="space-y-4">
                                    {steps.map((step, index) => (
                                        <div key={step.id} className={`p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border transition-all gap-4 ${step.isActive ? 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 opacity-60'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="mt-2.5 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors hidden sm:block">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="mt-1 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm border border-indigo-100 dark:border-indigo-500/20 shrink-0 shadow-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        {step.title}
                                                        {!step.isActive && <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded tracking-widest uppercase font-black">Pasif</span>}
                                                    </h4>
                                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 max-w-sm line-clamp-1">{step.description || 'Açıklama girilmemiş'}</p>
                                                    
                                                    <div className="flex flex-wrap items-center gap-3 mt-3">
                                                        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200 dark:border-white/5 truncate max-w-[200px]">
                                                            <LinkIcon className="w-3 h-3 text-slate-400" /> {step.href}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                                                            <Hash className="w-3 h-3 text-indigo-400" /> {step.actionKey}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-white/5">
                                                <form action={toggleStep.bind(null, step.id, step.isActive)} className="flex-1 sm:flex-none">
                                                    <EnterpriseButton type="submit" variant="secondary" className="w-full sm:w-auto h-10 px-4 flex justify-center text-slate-600 dark:text-slate-400">
                                                        {step.isActive ? <X className="w-4 h-4 mr-1.5" /> : <Check className="w-4 h-4 mr-1.5 text-emerald-500" />}
                                                        {step.isActive ? "Pasife Al" : "Aktif Et"}
                                                    </EnterpriseButton>
                                                </form>
                                                <form action={deleteStep.bind(null, step.id)} className="flex-none">
                                                    <EnterpriseButton type="submit" variant="secondary" className="h-10 px-4 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                                                        <Trash2 className="w-4 h-4" />
                                                    </EnterpriseButton>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Right Side: Add New Step */}
                <div className="lg:col-span-1 space-y-6">
                    <EnterpriseCard className="sticky top-8 lg:order-2">
                        <EnterpriseSectionHeader title="Yeni Adım Ekle" icon={<Plus className="w-4 h-4" />} />
                        
                        <form action={addStep} className="space-y-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                            <EnterpriseInput 
                                label="Görünür Başlık"
                                name="title" 
                                required 
                                placeholder="Örn: İlk Ürünü Ekle" 
                            />
                            
                            <EnterpriseInput 
                                label="Kısa Açıklama (Opsiyonel)"
                                name="description" 
                                placeholder="Örn: Kataloga yeni ürün ekleyin" 
                            />
                            
                            <EnterpriseInput 
                                label="Yönlendirilecek URL"
                                name="href" 
                                required 
                                placeholder="Örn: /products/new" 
                            />
                            
                            <EnterpriseInput 
                                label="Tetikleyici Anahtar (Action Key)"
                                hint="OnboardingProgress modeli için benzersiz takip anahtarı."
                                name="actionKey" 
                                required 
                                placeholder="Örn: PRODUCT_ADDED" 
                            />

                            <EnterpriseButton type="submit" variant="primary" className="w-full mt-4 h-12 flex justify-center text-[10px] uppercase tracking-widest px-0">
                                <ShieldCheck className="w-4 h-4 mr-2" /> Sisteme Kaydet
                            </EnterpriseButton>
                        </form>
                    </EnterpriseCard>

                    <EnterpriseCard className="bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20 lg:order-3">
                        <h4 className="text-[11px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Varsayılan Anahtarlar
                        </h4>
                        <ul className="text-[11px] font-bold text-slate-600 dark:text-slate-400 space-y-3">
                            <li className="flex gap-2 items-center"><code className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-white/5">firstInvoice</code> <span>Fatura oluşturunca.</span></li>
                            <li className="flex gap-2 items-center"><code className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-white/5">firstCustomer</code> <span>Cari ekleyince.</span></li>
                            <li className="flex gap-2 items-center"><code className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-white/5">inventoryViewed</code> <span>Stok sayfasına girince.</span></li>
                            <li className="flex gap-2 items-center"><code className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-white/5">salesXViewed</code> <span>Saha satışa girince.</span></li>
                            <li className="flex gap-2 items-center"><code className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-white/5">b2bHubViewed</code> <span>B2B paneline girince.</span></li>
                        </ul>
                    </EnterpriseCard>
                </div>

            </div>
        </EnterprisePageShell>
    );
}
