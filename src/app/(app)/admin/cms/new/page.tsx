import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell } from "@/components/ui/enterprise";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewCMSPage() {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const mainSite = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
  });

  if (!mainSite) redirect("/admin/cms");

  async function createPage(formData: FormData) {
    "use server";
    const sessionRes: any = await getSession();
    if (!sessionRes) return;
    
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const locale = formData.get("locale") as string;
    
    const site = await prisma.cmsSite.findFirst({ where: { tenantId: null } });
    if (!site) return;

    const newPage = await prisma.cmsPageV2.create({
      data: {
        title,
        slug,
        locale: locale || "tr",
        status: "DRAFT",
        siteId: site.id
      }
    });

    redirect(`/admin/cms/editor/${newPage.id}`);
  }

  return (
    <EnterprisePageShell
      title="Yeni Sayfa Oluştur"
      description="Yapay Zeka destekli boş bir şablon ile hemen vizyonunuzu koda dökün."
      actions={
        <Link href="/admin/cms" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#0E1528] text-sm font-semibold rounded-lg transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
          <form action={createPage} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#0E1528] mb-2">Sayfa Başlığı</label>
              <input 
                name="title" 
                required 
                placeholder="Örn: Hakkımızda" 
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#0E1528] mb-2">URL (Slug)</label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                  periodya.com/
                </span>
                <input 
                  name="slug" 
                  required 
                  placeholder="hakkimizda" 
                  className="flex-1 min-w-0 block w-full px-4 py-3 border border-slate-200 rounded-none rounded-r-lg text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0E1528] mb-2">Sayfa Dili</label>
              <select name="locale" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-[#0E1528] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm">
                <option value="tr">Türkçe (TR)</option>
                <option value="en">İngilizce (EN)</option>
                <option value="de">Almanca (DE)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md">
                <Plus className="w-5 h-5" />
                <span>Oluştur ve Editöre Git</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </EnterprisePageShell>
  );
}
