import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const auth = await authorize();
    if (!auth.authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { query } = await req.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // Search Help Topics
        const articles = await prisma.helpTopic.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { excerpt: { contains: query, mode: 'insensitive' } },
                    { body: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 3,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true
            }
        });

        // AI Suggestion mocking logic based on keyword matching (Since AI depends on an external LLM call not provided)
        let suggestion = null;

        const q = query.toLowerCase();
        if (q.includes("fatura") && q.includes("gönderemiyorum")) {
            suggestion = "Fatura gönderimi sırasında yaşanan hataların çoğu entegratör (NİLVERA, UYUMSOFT vb.) kaynaklı geçici erişim sorunlarıdır.\n1. Öncelikle Ayarlar > Entegrasyonlar sekmesinden E-Fatura portalı bağlantınızın aktif olduğunu doğrulayın.\n2. Seçili faturanın durumu 'HATA ALDI' ise detaylarda belirtilen kodu inceleyin.\n3. Tekrar göndermeyi deneyin veya aşağıda size önerdiğimiz makaleleri adım adım takip edin.";
        } else if (q.includes("şifre") || q.includes("password")) {
            suggestion = "Şifrenizi unuttuysanız giriş sayfasından 'Şifremi Unuttum' butonuna tıklayarak sıfırlama bağlantısı talep edebilirsiniz. Sistem yöneticisiyseniz Kullanıcılar bölümünden personellerin şifrelerini silebilirsiniz.";
        } else if (q.includes("stok") && q.includes("eksi")) {
            suggestion = "Negatif stok düşümü (eksiye düşme) ayarlarınızı 'Ayarlar > Depo & Envanter' menüsünden yönetebilirsiniz. Otonom fiyatlama asistanı eksi stoka düşmeyi önleyecek şekilde konfigüre edilebilir.";
        } else if (articles.length === 0) {
            suggestion = "Aramanızla eşleşen doğrudan bir makale bulamadık. Lütfen farklı kelimelerle arama yapmayı deneyin veya sayfanın altındaki butondan doğrudan bir Destek Talebi (Ticket) oluşturarak bizimle iletişime geçin.";
        } else {
            suggestion = `İşte "${query}" konusunda bulduğum bazı yardımcı makaleler. Lütfen ilgili makaleyi seçerek detayları inceleyin. Sorununuz çözülmezse alt taraftaki AI destek butonunu kullanarak Destek Ekibimize ulaşabilirsiniz.`;
        }

        return NextResponse.json({
            articles,
            suggestion
        });

    } catch (e: any) {
        console.error("AI Assistant Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
