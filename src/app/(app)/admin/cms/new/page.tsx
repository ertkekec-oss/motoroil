import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell, EnterpriseCard, EnterpriseInput, EnterpriseSelect, EnterpriseButton, EnterpriseField } from "@/components/ui/enterprise";
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
        <Link href="/admin/cms">
          <EnterpriseButton variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />GERİ DÖN
          </EnterpriseButton>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto mt-8">
        <EnterpriseCard noPadding>
          <div className="p-8">
            <form action={createPage} className="space-y-6">
              <EnterpriseInput 
                name="title" 
                label="SAYFA BAŞLIĞI"
                required 
                placeholder="Örn: Hakkımızda" 
              />
              
              <EnterpriseField label="URL (SLUG)">
                <div className="flex rounded-[16px] overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all group">
                  <span className="inline-flex items-center px-4 bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium text-[13px] border-r border-slate-200 dark:border-slate-700">
                    periodya.com/
                  </span>
                  <input 
                    name="slug" 
                    required 
                    placeholder="hakkimizda" 
                    className="flex-1 w-full h-11 px-4 bg-white dark:bg-[#0f172a] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                  />
                </div>
              </EnterpriseField>

              <EnterpriseSelect name="locale" label="SAYFA DİLİ">
                <option value="tr">🇹🇷 TÜRKÇE (TR)</option>
                <option value="en">🇬🇧 İNGİLİZCE (EN)</option>
                <option value="de">🇩🇪 ALMANCA (DE)</option>
              </EnterpriseSelect>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <EnterpriseButton type="submit" variant="primary" className="gap-2">
                  <Plus className="w-5 h-5" />
                  OLUŞTUR VE EDİTÖRE GİT
                </EnterpriseButton>
              </div>
            </form>
          </div>
        </EnterpriseCard>
      </div>
    </EnterprisePageShell>
  );
}
