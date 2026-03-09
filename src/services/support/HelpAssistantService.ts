import prisma from '@/lib/prisma';
import { HelpConversation, HelpConversationMessage, HelpRecommendation } from '@prisma/client';
import { HelpSearchService } from './HelpSearchService';

export class HelpAssistantService {
    /**
     * 1. Start a new AI Support conversation
     */
    static async startConversation(params: {
        tenantId: string;
        userId: string;
        sessionId: string;
        question: string;
    }): Promise<HelpConversation> {
        const conversation = await prisma.helpConversation.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                sessionId: params.sessionId,
                question: params.question,
            }
        });

        // Add initial user question as the first message
        await this.addUserMessage({
            conversationId: conversation.id,
            content: params.question
        });

        return conversation;
    }

    /**
     * 2. Add User Message
     */
    static async addUserMessage(params: {
        conversationId: string;
        content: string;
    }): Promise<HelpConversationMessage> {
        return prisma.helpConversationMessage.create({
            data: {
                conversationId: params.conversationId,
                content: params.content,
                role: 'USER'
            }
        });
    }

    /**
     * 3. Add AI Assistant Message
     */
    static async addAssistantMessage(params: {
        conversationId: string;
        content: string;
    }): Promise<HelpConversationMessage> {
        return prisma.helpConversationMessage.create({
            data: {
                conversationId: params.conversationId,
                content: params.content,
                role: 'ASSISTANT'
            }
        });
    }

    /**
     * 4. Find Relevant Articles
     * Reuses the Knowledge Base Engine search
     */
    static async findRelevantArticles(question: string, tenantId: string) {
        // Uses the relevance scoring engine from Phase 1
        const articles = await HelpSearchService.search(question, tenantId);
        return articles.slice(0, 3); // Take top 3 recommendations
    }

    /**
     * 5. Recommend Articles and Store the Recommendations
     */
    static async recommendArticles(conversationId: string, articleIdsWithScores: { articleId: string, score: number }[]): Promise<HelpRecommendation[]> {
        const recommendations = [];
        for (const rec of articleIdsWithScores) {
            const recommendation = await prisma.helpRecommendation.create({
                data: {
                    conversationId,
                    articleId: rec.articleId,
                    score: rec.score
                }
            });
            recommendations.push(recommendation);
        }
        return recommendations;
    }

    /**
     * 6. Generate AI Answer (Business Logic Layer)
     * Analyzes question, pulls articles, builds a semantic rich text response
     */
    static async generateAnswer(conversationId: string, tenantId: string): Promise<string> {
        const conversation = await prisma.helpConversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!conversation) {
            throw new Error(`Conversation not found: ${conversationId}`);
        }

        const lastMessage = conversation.messages[conversation.messages.length - 1];

        // Find relevant articles
        const articles = await this.findRelevantArticles(lastMessage.content, tenantId);

        // Track Recommendations
        if (articles.length > 0) {
            // Mock score logic since findRelevantArticles returns HelpArticle array
            // In a real scenario HelpSearchService would output scores alongside articles
            const scoredArticles = articles.map((article, index) => ({
                articleId: article.id,
                score: 100 - (index * 10) // Mock score fallback
            }));
            await this.recommendArticles(conversationId, scoredArticles);
        }

        // Response formatting (Mock LLM response for now)
        let aiResponse = `**Problem Analizi:**\n${lastMessage.content} ile ilgili bir sorun yaşadığınızı anlıyorum. `;

        if (articles.length > 0) {
            aiResponse += `Muhtemelen sistemsel veya konfigürasyonel bir durum olabilir.\n\n`;
            aiResponse += `**Önerilen Çözüm:**\nAşağıdaki rehberleri inceleyerek sorunu hızlıca çözebilirsiniz:\n\n`;
            articles.forEach(article => {
                aiResponse += `• [${article.title}](/help/${article.slug})\n`;
            });
        } else {
            aiResponse += `Maalesef bilgi bankasında bu soruya tam uyan bir sonuç bulamadım. Ekibimiz size memnuniyetle yardımcı olacaktır.\n\n`;
        }

        // Save AI response
        await this.addAssistantMessage({
            conversationId,
            content: aiResponse
        });

        return aiResponse;
    }

    /**
     * 7. Suggest Ticket Creation (Deflection Mechanism)
     */
    static async suggestTicketCreation(conversationId: string): Promise<string> {
        const suggestion = `Bu çözüm sorununuzu çözdü mü?\n\n*Çözülmediyse destek talebi oluşturmak ister misiniz?*`;

        await prisma.helpConversationMessage.create({
            data: {
                conversationId,
                content: suggestion,
                role: 'SYSTEM'
            }
        });

        return suggestion;
    }
}
