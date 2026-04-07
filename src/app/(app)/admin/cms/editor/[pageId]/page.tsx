import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import EditorClient from "./EditorClient"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CMSVisualEditor({ params }: { params: { pageId: string } }) {
  const session = await getServerSession(authOptions);
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
     initialBlocks = [
        {
           id: "temp-1",
           pageId: page.id,
           type: "Hero",
           order: 0,
           isActive: true,
           content: {
             title: "E-Ticaret ve Ön Muhasebede Üstün Sonuçlar",
             subtitle: "Sektörünüz ne olursa olsun, operasyonlarınızı Periodya'nın otonom altyapısı ile yönetin.",
             primaryButton: { label: "Hemen Başla", url: "/register" },
             secondaryButton: { label: "Sistemi İncele", url: "/features" },
           },
           personalizationRules: null
        } as any
     ];
  }

  return (
    <EditorClient initialPage={page as any} initialBlocks={initialBlocks as any} />
  )
}
