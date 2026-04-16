import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell, EnterpriseCard, EnterpriseInput, EnterpriseTextarea, EnterpriseButton } from "@/components/ui/enterprise";
import { ArrowLeft, Save, Globe, Shield, Database, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CMSSettingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }}) {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const sp: any = await searchParams;
  const activeTab = sp?.tab || 'general';

  const site = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
  });

  if (!site) redirect("/admin/cms");

  async function updateGeneralSettings(formData: FormData) {
    "use server";
    const sessionRes: any = await getSession();
    if (!sessionRes) return;
    
    const name = formData.get("name") as string;
    const domain = formData.get("domain") as string;
    
    const currentSite = await prisma.cmsSite.findFirst({ where: { tenantId: null } });
    if (!currentSite) return;

    await prisma.cmsSite.update({
      where: { id: currentSite.id },
      data: { name, domain }
    });

    revalidatePath("/admin/cms/settings");
    redirect("/admin/cms/settings?tab=general");
  }

  async function updateSEOSettings(formData: FormData) {
    "use server";
    const sessionRes: any = await getSession();
    if (!sessionRes) return;
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const keywords = formData.get("keywords") as string;

    const currentSite = await prisma.cmsSite.findFirst({ where: { tenantId: null } });
    if (!currentSite) return;

    const currentSettings = (currentSite.settings as any) || {};

    await prisma.cmsSite.update({
      where: { id: currentSite.id },
      data: { 
        settings: {
          ...currentSettings,
          seo: { title, description, keywords }
        }
      }
    });

    revalidatePath("/admin/cms/settings");
    redirect("/admin/cms/settings?tab=seo");
  }

  async function clearSystemCache() {
    "use server";
    const sessionRes: any = await getSession();
    if (!sessionRes) return;
    
    revalidatePath("/", "layout");
    redirect("/admin/cms/settings?tab=data&cache=cleared");
  }

  const settings: any = site.settings || {};
  const seoData = settings.seo || {};

  return (
    <EnterprisePageShell
      title="Site Ayarları"
      description="Genel site yapılandırması ve meta bilgileri"
      actions={
        <Link href="/admin/cms">
          <EnterpriseButton variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> GERİ DÖN
          </EnterpriseButton>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mt-6">
        
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
           <Link href="?tab=general" className={`w-full flex items-center gap-3 px-5 py-4 font-black tracking-widest uppercase text-[11px] rounded-[16px] border transition-all ${activeTab === 'general' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-sm' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
             <Globe className={`w-5 h-5 ${activeTab === 'general' ? '' : 'opacity-50'}`} />
             GENEL AYARLAR
           </Link>
           <Link href="?tab=seo" className={`w-full flex items-center gap-3 px-5 py-4 font-black tracking-widest uppercase text-[11px] rounded-[16px] border transition-all ${activeTab === 'seo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-sm' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
             <Shield className={`w-5 h-5 ${activeTab === 'seo' ? '' : 'opacity-50'}`} />
             SEO & META
           </Link>
           <Link href="?tab=data" className={`w-full flex items-center gap-3 px-5 py-4 font-black tracking-widest uppercase text-[11px] rounded-[16px] border transition-all ${activeTab === 'data' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 shadow-sm' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
             <Database className={`w-5 h-5 ${activeTab === 'data' ? '' : 'opacity-50'}`} />
             VERİ VE BAKIM
           </Link>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <EnterpriseCard title="Genel Yapılandırma" icon={<Globe className="w-5 h-5 text-indigo-500" />}>
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sitenizin temel yayın kimlik bilgileri.</p>
              </div>
              <form action={updateGeneralSettings} className="space-y-6">
                <EnterpriseInput 
                  name="name" 
                  label="SİTE ADI"
                  defaultValue={site.name}
                  required 
                  hint="Bu isim CMS panelinde ve tarayıcı başlığında kullanılacaktır."
                />
                
                <EnterpriseInput 
                  name="domain" 
                  label="VARSAYILAN DOMAIN"
                  defaultValue={site.domain}
                  required 
                />

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                  <EnterpriseButton type="submit" variant="primary" className="gap-2">
                    <Save className="w-4 h-4" /> AYARLARI KAYDET
                  </EnterpriseButton>
                </div>
              </form>
            </EnterpriseCard>
          )}

          {activeTab === 'seo' && (
            <EnterpriseCard title="SEO & Meta Etiketleri" icon={<Shield className="w-5 h-5 text-indigo-500" />}>
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Arama motorları için standart yapılandırmalar.</p>
              </div>

              <form action={updateSEOSettings} className="space-y-6">
                <EnterpriseInput 
                  name="title" 
                  label="VARSAYILAN SAYFA BAŞLIĞI (TITLE)"
                  defaultValue={seoData.title || "Periodya Enterprise | Türkiye'nin En Kapsamlı ERP Yazılımı | Periodya"}
                />
                
                <EnterpriseTextarea 
                  name="description" 
                  label="META AÇIKLAMASI (DESCRIPTION)"
                  rows={3}
                  defaultValue={seoData.description || "Finans, Stok, Satış ve Saha Operasyonları tek bir platformda."}
                />

                <EnterpriseInput 
                  name="keywords" 
                  label="ANAHTAR KELİMELER (KEYWORDS)"
                  defaultValue={seoData.keywords || "erp, b2b, b2c, muhasebe, finans"}
                  hint="Kelimeleri virgül ile ayırarak yazın."
                />

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                  <EnterpriseButton type="submit" variant="primary" className="gap-2">
                    <Save className="w-4 h-4" /> AYARLARI KAYDET
                  </EnterpriseButton>
                </div>
              </form>
            </EnterpriseCard>
          )}

          {activeTab === 'data' && (
            <EnterpriseCard title="Veri ve Bakım" icon={<Database className="w-5 h-5 text-indigo-500" />}>
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Önbellek (Cache) temizliği ve riskli operasyonlar.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                   <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[13px] mb-2">SİSTEM ÖNBELLEĞİNİ TEMİZLE</h4>
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6">CMS değişikliklerinin canlıya yansıması için sistem önbelleğini (cache) temizleyin.</p>
                   {sp.cache === "cleared" && (
                     <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest rounded-xl">
                       SİSTEM ÖNBELLEĞİ BAŞARIYLA TEMİZLENDİ!
                     </div>
                   )}
                   <form action={clearSystemCache}>
                     <EnterpriseButton type="submit" variant="secondary" className="gap-2">
                       <RefreshCw className="w-4 h-4" /> ÖNBELLEĞİ TEMİZLE
                     </EnterpriseButton>
                   </form>
                </div>

                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-6">
                   <h4 className="font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest text-[13px] mb-2 flex items-center gap-2"><Shield className="w-4 h-4"/> TEHLİKELİ ALAN</h4>
                   <p className="text-xs font-bold text-rose-600/80 dark:text-rose-400/80 mb-6">Bu işlemler geri alınamaz. Lütfen dikkatli kullanın.</p>
                   <EnterpriseButton disabled variant="danger" className="gap-2">
                     <Trash2 className="w-4 h-4" /> VERİTABANINI SİL
                   </EnterpriseButton>
                </div>
              </div>
            </EnterpriseCard>
          )}
        </div>

      </div>
    </EnterprisePageShell>
  );
}
