import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { ArrowLeft, Save, Globe, Shield, Database } from "lucide-react";
import Link from "next/link";

export default async function CMSSettingsPage() {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const site = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
  });

  if (!site) redirect("/admin/cms");

  async function updateSettings(formData: FormData) {
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

    redirect("/admin/cms");
  }

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
           <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 transition-all">
             <Globe className="w-5 h-5" />
             <span className="text-sm">Genel Ayarlar</span>
           </button>
           <button disabled className="w-full flex items-center gap-3 px-4 py-3 bg-white text-slate-500 font-bold rounded-xl border border-transparent hover:bg-slate-50 transition-all cursor-not-allowed">
             <Shield className="w-5 h-5 opacity-50" />
             <span className="text-sm">SEO & Meta</span>
           </button>
           <button disabled className="w-full flex items-center gap-3 px-4 py-3 bg-white text-slate-500 font-bold rounded-xl border border-transparent hover:bg-slate-50 transition-all cursor-not-allowed">
             <Database className="w-5 h-5 opacity-50" />
             <span className="text-sm">Veri ve Bakım</span>
           </button>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
            <h3 className="text-xl font-bold text-[#0E1528] mb-6 pb-4 border-b border-slate-100">Genel Yapılandırma</h3>
            
            <form action={updateSettings} className="space-y-6">
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
        </div>

      </div>
    </EnterprisePageShell>
  );
}
