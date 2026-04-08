import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import EditorClient from "./EditorClient"
import { getSession } from "@/lib/auth";

export default async function CMSVisualEditor(props: { params: Promise<{ pageId: string }> | { pageId: string } }) {
  const params = await Promise.resolve(props.params);

  const sessionResult: any = await getSession();
  const session = sessionResult?.user || sessionResult;
  if (!session) redirect("/auth/login");

  const page = await prisma.cmsPageV2.findUnique({
    where: { id: params.pageId },
    include: {
      site: true,
      blocks: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!page) {
    notFound();
  }

  // Pre-fill default empty blocks if none exist to make it friendly
  let initialBlocks = page.blocks;
  
  if (initialBlocks.length === 0) {
     initialBlocks = [];
  }

  // Define the ordered template of standard blocks
  const orderedTemplates = [
      { id: "temp-hero", pageId: page.id, type: "MODERN_HERO", content: {
          title: '<span class="font-light">E-Ticaret</span> <span class="font-bold">ve</span><br/><span class="font-bold">Ön Muhasebede</span><br/><span class="font-bold text-[#2563EB]">Üstün</span> <span class="font-light whitespace-nowrap">Sonuçlar</span>',
          subtitle: 'Günümüzün rekabetçi ticaretinde etkili çözümler.',
          primaryBtnText: 'Ücretsiz Başla',
          visualUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
      }},
      { id: "temp-tabs", pageId: page.id, type: "MODERN_TABS", content: {
          items: [{ title: "Sipariş Yönetimi", desc: "Tüm pazaryerlerinden...", image: "" }]
      }},
      { id: "temp-integrations", pageId: page.id, type: "MODERN_INTEGRATIONS", content: {
          items: [{ title: "Pazaryerleri", contentTitle: "Trendyol & Hepsiburada", descLine1: "...", descLine2: "...", logos: [] }]
      }},
      { id: "temp-why-us", pageId: page.id, type: "MODERN_WHY_US", content: {
          heading: '<span class="font-bold">Periodya</span> <span class="font-light">ile operasyonlarınızı kolaylaştırın.</span>',
          desc: 'Günümüz e-ticaret dünyasında düşük maliyetli hızlı çözümler.',
          card1: { title: "Hızlı Entegrasyon", desc: "1 saatte tüm ürünlerinizi aktarın." },
          card2: { title: "Sürekli Destek", desc: "7/24 uzman kadromuz yanınızda." }
      }},
      { id: "temp-features", pageId: page.id, type: "MODERN_FEATURES", content: {
          heading: 'Bizi <span class="text-blue-600">Özel Kılan</span> Detaylar.',
          desc: 'Ön saflarda yer alan teknolojimizle büyüyün.'
      }},
      { id: "temp-pricing", pageId: page.id, type: "MODERN_PRICING", content: {
          heading: 'Esnek Paket Seçenekleri',
          desc: 'Sürpriz ödemeler olmadan işletmenizle büyüyen modeller.'
      }}
  ];

  // Auto-inject missing blocks from the template
  const existingTypes = new Set(initialBlocks.map((b: any) => b.type));
  // Allow fallback mapping "Hero" -> "MODERN_HERO"
  if (existingTypes.has("Hero")) existingTypes.add("MODERN_HERO");

  orderedTemplates.forEach((template, index) => {
      if (!existingTypes.has(template.type)) {
          initialBlocks.push({
              ...template,
              order: initialBlocks.length,
              isActive: true
          } as any);
      }
  });

  // Sort blocks exactly by their template order (approximate mapping)
  initialBlocks.sort((a: any, b: any) => {
     let iA = orderedTemplates.findIndex(t => t.type === a.type || (t.type === 'MODERN_HERO' && a.type === 'Hero'));
     let iB = orderedTemplates.findIndex(t => t.type === b.type || (t.type === 'MODERN_HERO' && b.type === 'Hero'));
     if (iA === -1) iA = 999;
     if (iB === -1) iB = 999;
     return iA - iB;
  });

  // Sanitize Prisma objects for Client Component serialization
  const sanitizedPage = JSON.parse(JSON.stringify(page));
  const sanitizedBlocks = JSON.parse(JSON.stringify(initialBlocks));

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-60px)]">
      <EditorClient initialPage={sanitizedPage} initialBlocks={sanitizedBlocks} />
    </div>
  )
}
