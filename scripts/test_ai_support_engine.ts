import { HelpAssistantService } from '../src/services/support/HelpAssistantService';
import { HelpSearchService } from '../src/services/support/HelpSearchService';
import { KnowledgeBaseInit } from '../src/services/support/KnowledgeBaseInit';
import prisma from '../src/lib/prisma';

async function main() {
    console.log('--- STARTING AI SUPPORT ENGINE SMOKE TEST ---\n');

    try {
        // 1. Ensure minimal knowledge base is seeded
        console.log('[1/4] Seeding Default Categories...');
        await KnowledgeBaseInit.seedDefaultCategories();

        // Check if we have an article
        const category = await prisma.helpCategory.findFirst({ where: { slug: 'erp' } });
        if (!category) throw new Error('Category missing');

        console.log('[2/4] Upserting MOCK Help Article...');
        let article = await prisma.helpArticle.findFirst({
            where: { title: 'Fatura İptali Nasıl Yapılır?' }
        });

        if (!article) {
            article = await prisma.helpArticle.create({
                data: {
                    categoryId: category.id,
                    title: 'Fatura İptali Nasıl Yapılır?',
                    slug: 'fatura-iptali-nasil-yapilir',
                    summary: 'Kestiğiniz e-faturaları iptal etme adımları',
                    content: 'Faturanızı iptal kapalı portalı üzerinden yapabilirsiniz. Hata oluşuyorsa entegratör kontrolü sağlanmalıdır.',
                    tags: ['fatura', 'iptal', 'e-fatura'],
                    status: 'PUBLISHED'
                }
            });
            await HelpSearchService.indexArticle(article.id);
        }

        // 2. Start Conversation
        console.log('[3/4] Starting AI Conversation (Question: Faturamı nasıl iptal ederim?)...');

        const tenantId = 'test-tenant-123';
        const userId = 'test-user-123';

        const conversation = await HelpAssistantService.startConversation({
            tenantId,
            userId,
            sessionId: 'test-session-xyz',
            question: 'Faturamı nasıl iptal ederim?'
        });

        // 3. Generate Answer
        console.log(`[4/4] Generating AI Suggestion for Conversation: ${conversation.id}...`);
        const aiAnswer = await HelpAssistantService.generateAnswer(conversation.id, tenantId);

        console.log('\n--- AI RESPONSE OUTPUT ---\n');
        console.log(aiAnswer);

        // 4. Verify Recommendations
        const recommendations = await prisma.helpRecommendation.findMany({
            where: { conversationId: conversation.id },
            include: { article: true }
        });

        console.log(`\nFound ${recommendations.length} recommendations!`);
        if (recommendations.length > 0) {
            console.log(`Top Recommendation: [${recommendations[0].article.title}] -> Score: ${recommendations[0].score}`);
        }

        console.log('\n✅ AI Support Engine Tests Passed Successfully.\n');
    } catch (error) {
        console.error('❌ AI Support Engine Test FAILED:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
