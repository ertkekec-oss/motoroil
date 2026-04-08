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
          badge: 'TECH SOLUTION',
          heading: '<span class="font-light">The</span> <span class="font-bold">CompletePlatform</span><span class="font-light">To</span><br/> <span class="font-bold">PowerYourOperations</span>',
          desc: "In today's competitive business, the demand for efficient and cost-effective IT solutions has never been more critical.",
          items: [
              {
                  title: "Kişiselleştirilmiş Çözüm", 
                  desc: "İşletmenizin spesifik ihtiyaçlarına ve hedeflerine uyacak şekilde teknolojimizi tamamen size özel hale getiriyoruz.", 
                  image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80"
              },
              {
                  title: "Öncü Teknoloji",
                  desc: "Sektördeki en son standartlarla inşa edilmiş entegrasyon sistemimiz sayesinde sınır tanımaz bir e-ticaret hızı sunar.",
                  image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80"
              },
              {
                  title: "Keşif ve Analiz",
                  desc: "Karmaşık verilerinizi sezgisel grafiklerle okuyun. Günlük kar zarar durumunuzu ve stratejilerinizi hızla analiz edin.",
                  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
              },
              {
                  title: "Dağıtım ve Destek",
                  desc: "Mükemmel sonuçları garanti eden kişiselleştirilmiş teknoloji optimizasyonu ve daima arkanızda duran 7/24 uzman desteği.",
                  image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
              }
          ]
      }},
      { id: "temp-integrations", pageId: page.id, type: "MODERN_INTEGRATIONS", content: {
          items: [
              {
                  title: "Başlarken",
                  contentTitle: "150,000+ Şirketin Güvendiği ERP",
                  descLine1: "",
                  descLine2: "Büyük hacimli e-ticaret siteleri Periodya ile çalışıyor — sizin de işinize yarayacak.",
                  logos: ["Trendyol", "Hepsiburada", "Akbank", "Garanti", "Gittigidiyor"]
              },
              {
                  title: "E-Ticaret",
                  contentTitle: "E-Ticaret Çözümleri",
                  descLine1: "Tüm pazaryeri satışlarınızı ve stoklarınızı tek bir merkezden kolayca yönetin.",
                  descLine2: "Siparişten kargoya, faturalandırmadan müşteri ilişkilerine kadar tam entegrasyon.",
                  logos: ["Trendyol", "Hepsiburada", "N11", "Çiçeksepeti", "Amazon", "PttAVM", "Shopify"]
              },
              {
                  title: "Banka",
                  contentTitle: "Banka Çözümleri",
                  descLine1: "Türkiye'nin önde gelen tüm bankalarıyla direkt API üzerinden çalışarak hesaplarınızı anında izleyin.",
                  descLine2: "Hesap hareketleri, otomatik virman ve bakiye mutabakatı artık saniyeler içinde.",
                  logos: ["Garanti BBVA", "Akbank", "İş Bankası", "Yapı Kredi", "Ziraat Bankası", "QNB Finans"]
              },
              {
                  title: "E-Fatura",
                  contentTitle: "E-Fatura Çözümleri",
                  descLine1: "Gelir İdaresi Başkanlığı onaylı operatörlerle saniyeler içinde e-fatura ve e-arşiv kesin.",
                  descLine2: "Maliyetlerinizi düşürün ve muhasebe süreçlerinizi dijitalin hızıyla kusursuzlaştırın.",
                  logos: ["QNB eFinans", "Digital Planet", "Sovos", "Uyumsoft", "GİB Portal", "Türkkep"]
              },
              {
                  title: "Ödeme",
                  contentTitle: "Ödeme Çözümleri",
                  descLine1: "B2B ve B2C müşterilerinizden dilediğiniz kredi kartıyla 7/24 güvenli online tahsilat yapın.",
                  descLine2: "Düşük komisyon oranları ve ertesi gün sanal POS aktarımıyla nakit akışınızı koruyun.",
                  logos: ["PayTR", "İyzico", "Param", "Ozan", "Sipay", "Moka"]
              },
              {
                  title: "Yazarkasa POS",
                  contentTitle: "Yazarkasa POS Çözümleri",
                  descLine1: "Mağazadaki fiziksel satışlarınızı ERP sisteminizle anlık senkronize eden akıllı altyapı.",
                  descLine2: "Yeni nesil ÖKC (Ödeme Kaydedici Cihaz) entegrasyonuyla stok ve maliye bildirim problemlerine son verin.",
                  logos: ["Beko", "Ingenico", "Profilo", "Hugin", "Vera", "Paygo"]
              }
          ]
      }},
      { id: "temp-why-us", pageId: page.id, type: "MODERN_WHY_US", content: {
          heading: '<span class="font-bold">Periodya</span> <span class="font-light">operasyonlarınızı optimize ederek ekibinizin performansını artırır ve</span> <span class="font-bold">Büyümeyi hızlandırır.</span>',
          desc: 'Günümüz rekabetçi e-ticaret pazarında, etkin ve düşük maliyetli yazılım çözümlerine olan talep hiç bu kadar kritik olmamıştı. Sizi bir adım öne taşıyoruz.',
          card1: { title: "Uzmanlık & Özelleştirme", desc: "Ekibimiz size özel tasarlanmış tam teşekküllü donanımlar ve büyüme planları sunar." },
          card2: { title: "Kesintisiz Entegrasyon", desc: "Sistemlerimiz her ay yeni pazar yeri standartlarına uygun olarak kesintisiz güncellenir." }
      }},
      { id: "temp-features", pageId: page.id, type: "MODERN_FEATURES", content: {
          heading: 'Bizi <span class="text-blue-600">Farklı Kılan</span> Özellikler.',
          desc: 'Sürekli yenilikçi teknolojilerle ön saflarda yer almaktan, sınırları yeniden tanımlamaktan ve e-ticaret dijital dünyasını birlikte şekillendirmekten gurur duyuyoruz.'
      }},
      { id: "temp-pricing", pageId: page.id, type: "MODERN_PRICING", content: {
          heading: 'Esnek Fiyatlandırma',
          desc: 'Büyüme hızınıza ayak uyduran paketler.'
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
