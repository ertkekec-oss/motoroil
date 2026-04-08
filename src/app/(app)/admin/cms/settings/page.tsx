import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { ArrowLeft, Save, Globe, Shield, Database } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CMSSettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const site = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
  });

  if (!site) redirect("/admin/cms");
  
  // Safe extraction of query parameters
  const tabParam = searchParams?.tab;
  const activeTab = (Array.isArray(tabParam) ? tabParam[0] : tabParam) || "general";

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
        <Link href="/admin/cms" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#0E1528] text-sm font-semibold rounded-lg transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mt-6">
        
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
           <Link href="?tab=general" className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border transition-all ${activeTab === 'general' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}>
             <Globe className={`w-5 h-5 ${activeTab === 'general' ? '' : 'opacity-50'}`} />
             <span className="text-sm">Genel Ayarlar</span>
           </Link>
           <Link href="?tab=seo" className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border transition-all ${activeTab === 'seo' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}>
             <Shield className={`w-5 h-5 ${activeTab === 'seo' ? '' : 'opacity-50'}`} />
             <span className="text-sm">SEO & Meta</span>
           </Link>
           <Link href="?tab=data" className={`w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl border transition-all ${activeTab === 'data' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}>
             <Database className={`w-5 h-5 ${activeTab === 'data' ? '' : 'opacity-50'}`} />
             <span className="text-sm">Veri ve Bakım</span>
           </Link>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
              <h3 className="text-xl font-bold text-[#0E1528] mb-6 pb-4 border-b border-slate-100">Genel Yapılandırma</h3>
              
              <form action={updateGeneralSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#0E1528] mb-2">Site Adı</label>
                  <input 
                    name="name" 
                    defaultValue={site.name}
                    required 
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                  <p className="text-xs text-slate-500 font-medium mt-2">Bu isim CMS panelinde ve tarayıcı başlığında kullanılacaktır.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#0E1528] mb-2">Varsayılan Domain</label>
                  <input 
                    name="domain" 
                    defaultValue={site.domain}
                    required 
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md">
                    <Save className="w-5 h-5" />
                    <span>Ayarları Kaydet</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
              <h3 className="text-xl font-bold text-[#0E1528] mb-6 pb-4 border-b border-slate-100">SEO & Meta Etiketleri</h3>
              
              <form action={updateSEOSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#0E1528] mb-2">Varsayılan Sayfa Başlığı (Title)</label>
                  <input 
                    name="title" 
                    defaultValue={seoData.title || "Periodya Enterprise | Türkiye'nin En Kapsamlı ERP Yazılımı | Periodya"}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#0E1528] mb-2">Meta Açıklaması (Description)</label>
                  <textarea 
                    name="description" 
                    rows={3}
                    defaultValue={seoData.description || "Finans, Stok, Satış ve Saha Operasyonları tek bir platformda."}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0E1528] mb-2">Anahtar Kelimeler (Keywords)</label>
                  <input 
                    name="keywords" 
                    defaultValue={seoData.keywords || "erp, b2b, b2c, muhasebe, finans"}
                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                  <p className="text-xs text-slate-500 font-medium mt-2">Kelimeleri virgül ile ayırarak yazın.</p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md">
                    <Save className="w-5 h-5" />
                    <span>Ayarları Kaydet</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
              <h3 className="text-xl font-bold text-[#0E1528] mb-6 pb-4 border-b border-slate-100">Veri ve Bakım</h3>
              
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                   <h4 className="font-bold text-slate-800 mb-2">Sistem Önbelleğini Temizle</h4>
                   <p className="text-sm text-slate-600 mb-4">CMS değişikliklerinin canlıya yansıması için sistem önbelleğini temizleyin.</p>
                   {searchParams.cache === "cleared" && (
                     <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-lg">
                       Sistem önbelleği başarıyla temizlendi!
                     </div>
                   )}
                   <form action={clearSystemCache}>
                     <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition-all shadow-sm">
                       Önbelleği Temizle
                     </button>
                   </form>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                   <h4 className="font-bold text-red-800 mb-2">Tehlikeli Alan</h4>
                   <p className="text-sm text-red-600 mb-4">Bu işlemler geri alınamaz. Lütfen dikkatli kullanın.</p>
                   <button disabled className="px-4 py-2 bg-red-600 opacity-50 cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-all shadow-sm">
                     Veritabanını Yeniden Yapılandır
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </EnterprisePageShell>
  );
}
