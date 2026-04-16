import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnterprisePageShell, EnterpriseCard, EnterpriseButton, EnterpriseSectionHeader, EnterpriseEmptyState } from "@/components/ui/enterprise";
import { Plus, FileText, Globe, MonitorSmartphone, Settings, Zap, History, MousePointerClick, Users, Edit3, Trash2, Languages, Link as LinkIcon, Image as ImageIcon, UploadCloud, ChevronRight } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function CMSDashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }}) {
  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const sp: any = await searchParams;
  const activeTab = sp?.tab || 'pages';

  // Fetch or Auto-create the main site
  let mainSite = await prisma.cmsSite.findFirst({
    where: { tenantId: null },
    include: { pages: { include: { blocks: true } } }
  });

  if (!mainSite) {
    mainSite = await prisma.cmsSite.create({
      data: {
        domain: "periodya.com",
        name: "Periodya Global Network",
        defaultLanguage: "tr",
        pages: {
          create: [
            { slug: "index", title: "Ana Sayfa", locale: "tr", status: "DRAFT" },
            { slug: "features", title: "Özellikler", locale: "tr", status: "DRAFT" }
          ]
        }
      },
      include: { pages: { include: { blocks: true } } }
    });
  }

  // Calculate totals
  const totalBlocks = mainSite.pages.reduce((acc, p) => acc + (p.blocks?.length || 0), 0);

  async function deletePage(formData: FormData) {
    "use server"
    const pageId = formData.get("pageId") as string;
    if(!pageId) return;
    
    await prisma.cmsBlock.deleteMany({ where: { pageId } });
    await prisma.cmsPageV2.delete({ where: { id: pageId } });
    revalidatePath("/admin/cms");
  }

  return (
    <EnterprisePageShell
      title="İçerik Stüdyosu (CMS V2)"
      description="Yapay Zeka Destekli Büyüme ve İçerik Motoru"
      actions={
        <div className="flex gap-3">
          <Link href="/admin/cms/settings">
            <EnterpriseButton variant="secondary" className="gap-2">
              <Globe className="w-4 h-4" /> Site Ayarları
            </EnterpriseButton>
          </Link>
          <Link href="/admin/cms/new">
            <EnterpriseButton variant="primary" className="gap-2">
              <Plus className="w-4 h-4" /> Yeni Sayfa Oluştur
            </EnterpriseButton>
          </Link>
        </div>
      }
    >
      <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto">
        
        {/* KPI Dashboard - High Density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Aktif A/B Testleri", value: "0", sub: "Gelişim Bekleniyor", icon: <Zap className="w-5 h-5 text-amber-500" /> },
            { label: "Kişiselleştirilmiş Bloklar", value: totalBlocks.toString(), sub: "Aktif Yapılar", icon: <Users className="w-5 h-5 text-indigo-500" /> },
            { label: "Toplam Sayfa", value: mainSite.pages.length.toString(), sub: "Yayınlananlar", icon: <FileText className="w-5 h-5 text-blue-500" /> },
            { label: "Son Revizyon", value: "Bugün", sub: "Oto-Yedekleme", icon: <History className="w-5 h-5 text-emerald-500" /> }
          ].map((stat, i) => (
            <EnterpriseCard key={i} className="flex gap-4 items-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 shrink-0">
                {stat.icon}
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{stat.sub}</span>
                </div>
              </div>
            </EnterpriseCard>
          ))}
        </div>

        {/* Global Site Selector & Server-Side Tabs */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{mainSite.name}</h2>
              <p className="text-sm text-slate-500 font-medium">{mainSite.domain} • Ana Yapı</p>
            </div>
          </div>
          
          <div className="flex bg-white dark:bg-[#1e293b] rounded-full border border-slate-200 dark:border-white/5 p-1.5 shrink-0 shadow-sm">
            <Link href="?tab=pages" className={`px-6 py-2 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full flex items-center gap-2 ${activeTab === 'pages' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Sayfalar</Link>
            <Link href="?tab=i18n" className={`px-6 py-2 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full flex items-center gap-2 ${activeTab === 'i18n' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Çoklu Dil</Link>
            <Link href="?tab=assets" className={`px-6 py-2 text-[11px] font-bold tracking-widest uppercase transition-all rounded-full flex items-center gap-2 ${activeTab === 'assets' ? 'bg-slate-900 dark:bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Medya</Link>
          </div>
        </div>

        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainSite.pages.map((page) => (
              <EnterpriseCard key={page.id} noPadding className="group flex flex-col hover:border-indigo-500 transition-all duration-300">
                <Link href={`/admin/cms/editor/${page.id}`}>
                  <div className="h-32 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 flex items-center justify-center p-6 relative cursor-pointer group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-500/5 transition-colors">
                    <Globe className="w-12 h-12 text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" />
                    
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/5">
                      <div className={`w-2 h-2 rounded-full ${page.status === 'PUBLISHED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black text-slate-900 dark:text-white tracking-widest">
                        {page.status === 'PUBLISHED' ? 'CANLI' : 'TASLAK'}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link href={`/admin/cms/editor/${page.id}`}>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {page.title}
                        </h3>
                      </Link>
                      <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Path: /{page.slug === 'index' ? '' : page.slug}
                      </p>
                    </div>
                    
                    {page.slug !== 'index' && (
                       <form action={deletePage}>
                         <input type="hidden" name="pageId" value={page.id} />
                         <button type="submit" className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-lg transition-all" title="Sayfayı Sil">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </form>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-auto text-[11px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                      <MonitorSmartphone className="w-4 h-4 text-indigo-500" />
                      <span className="text-slate-900 dark:text-white">{page.blocks?.length || 0}</span> BLOK
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 px-2.5 py-1.5 rounded-lg text-slate-900 dark:text-white flex items-center gap-1.5 uppercase">
                      <Languages className="w-4 h-4 text-slate-400" />
                      {page.locale}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-white/5 px-6 py-4 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Son Güncelleme: Az Önce</span>
                    <Link href={`/admin/cms/editor/${page.id}`} className="flex items-center gap-1 text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      EDİTÖR <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
              </EnterpriseCard>
            ))}

            {/* New Page Button inside Grid */}
            <Link href="/admin/cms/new" className="bg-slate-50 dark:bg-[#1e293b] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl hover:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 flex flex-col items-center justify-center p-10 min-h-[300px] group cursor-pointer text-center">
               <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-center mb-6 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                 <Plus className="w-8 h-8 stroke-[2.5]" />
               </div>
               <h3 className="text-slate-900 dark:text-white font-black mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-xl">YENİ SAYFA</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium px-4">Sitenize yeni bir alan eklemek için boş bir sayfa opsiyonu.</p>
            </Link>
          </div>
        )}

        {/* Tab Placeholders - Improved and Functional Mocks */}
        {activeTab === 'i18n' && (
           <EnterpriseCard title="Çoklu Dil Yönetimi" icon={<Globe className="w-6 h-6 text-indigo-500" />}>
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-white/10">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sitenizin dil seçeneklerini yapılandırın ve çevirileri yönetin.</p>
                <EnterpriseButton variant="primary">
                  <Plus className="w-4 h-4" /> YENİ DİL
                </EnterpriseButton>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Existing Locale Card */}
                 <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e293b] rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-6">
                       <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                         🇹🇷 TÜRKÇE
                         <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Varsayılan</span>
                       </h4>
                       <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-white/5">TR-TR</span>
                    </div>
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Ana Sayfa:</span>
                         <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-1 rounded">100%</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Özellikler:</span>
                         <span className="text-[11px] font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-1 rounded">25%</span>
                       </div>
                    </div>
                    <EnterpriseButton variant="secondary" className="w-full">ÇEVİRİLERİ YÖNET</EnterpriseButton>
                 </div>
                 
                 {/* Empty / Setup Locale Card */}
                 <div className="border border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Globe className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">🇬🇧 İNGİLİZCE (EN)</p>
                    <p className="text-[11px] font-bold text-slate-500 mb-6 max-w-[200px]">Global ağınız için İngilizce alt yapısı henüz aktif değil.</p>
                    <EnterpriseButton variant="secondary" className="gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 w-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                      <Zap className="w-4 h-4" /> KURULUM YAP
                    </EnterpriseButton>
                 </div>
              </div>
           </EnterpriseCard>
        )}

        {activeTab === 'assets' && (
           <EnterpriseCard title="Medya Kütüphanesi" icon={<ImageIcon className="w-6 h-6 text-indigo-500" />} noPadding>
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sitende kullanılan tüm görseller, dökümanlar ve statik dosyalar.</p>
                <EnterpriseButton variant="primary">
                  <UploadCloud className="w-4 h-4" /> YÜKLE
                </EnterpriseButton>
              </div>
              
              <div className="p-6 bg-slate-50/50 dark:bg-transparent min-h-[400px]">
                 <div className="grid grid-cols-2 lg:grid-cols-5 md:grid-cols-4 gap-6">
                    {/* Simulated Images */}
                    {[
                      { url: "https://images.unsplash.com/photo-1542596594-649edbc13630", name: "eticaret-yonetimi.jpg", size: "1.2 MB", type: "IMAGE" },
                      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2", name: "focus-bg.png", size: "840 KB", type: "IMAGE" },
                      { url: "https://flagcdn.com/w160/tr.png", name: "tr-flag.png", size: "12 KB", type: "IMAGE" },
                      { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158", name: "hero-dashboard.jpg", size: "2.1 MB", type: "IMAGE" },
                      { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71", name: "data-chart.jpg", size: "450 KB", type: "IMAGE" },
                    ].map((asset, i) => (
                      <div key={i} className="group border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-500">
                         <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 flex items-center justify-center">
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <button className="bg-white text-slate-900 p-2.5 rounded-xl shadow-lg hover:scale-110 transition-transform"><LinkIcon className="w-4 h-4"/></button>
                            </div>
                         </div>
                         <div className="p-4">
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-widest mb-1" title={asset.name}>{asset.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.size}</p>
                         </div>
                      </div>
                    ))}
                    
                    {/* Upload Placeholder Tile */}
                    <div className="border-2 border-dashed border-slate-200 dark:border-white/10 bg-transparent rounded-2xl aspect-square flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-all">
                       <UploadCloud className="w-8 h-8 mb-3" />
                       <span className="text-[10px] font-black uppercase tracking-widest">YENİ YÜKLE</span>
                    </div>
                 </div>
              </div>
           </EnterpriseCard>
        )}

      </div>
    </EnterprisePageShell>
  );
}
