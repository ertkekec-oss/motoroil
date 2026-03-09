import prisma from '@/lib/prisma';
import { HelpArticle, HelpArticleStatus, HelpCategory } from '@prisma/client';
import { HelpSearchService } from './HelpSearchService';

export class HelpArticleService {
    /**
     * Fetch a single article by its slug.
     * Increments the view count.
     */
    static async getArticleBySlug(slug: string, tenantId?: string | null): Promise<HelpArticle | null> {
        const article = await prisma.helpArticle.findFirst({
            where: {
                slug,
                OR: tenantId ? [{ tenantId: null }, { tenantId }] : [{ tenantId: null }]
            },
            include: {
                category: true
            }
        });

        if (article) {
            await prisma.helpArticle.update({
                where: { id: article.id },
                data: { viewCount: { increment: 1 } }
            });
        }

        return article;
    }

    /**
     * List generic and tenant-specific articles for a category
     */
    static async getArticlesByCategory(categoryId: string, tenantId?: string | null): Promise<HelpArticle[]> {
        return prisma.helpArticle.findMany({
            where: {
                categoryId,
                status: 'PUBLISHED',
                OR: tenantId ? [{ tenantId: null }, { tenantId }] : [{ tenantId: null }]
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Search interface wrapper
     */
    static async searchArticles(query: string, tenantId?: string | null): Promise<HelpArticle[]> {
        return HelpSearchService.search(query, tenantId);
    }

    /**
     * Admin Function: Create Article
     */
    static async createArticle(
        params: {
            categoryId: string;
            title: string;
            slug: string;
            summary?: string;
            content: string;
            tags?: string[];
            tenantId?: string | null;
            status?: HelpArticleStatus;
        }
    ): Promise<HelpArticle> {
        const article = await prisma.helpArticle.create({
            data: {
                categoryId: params.categoryId,
                title: params.title,
                slug: params.slug,
                summary: params.summary,
                content: params.content,
                tags: params.tags || [],
                tenantId: params.tenantId || null,
                status: params.status || 'DRAFT'
            }
        });

        await HelpSearchService.indexArticle(article.id);
        return article;
    }

    /**
     * Admin Function: Update Article
     */
    static async updateArticle(id: string, updates: Partial<HelpArticle>): Promise<HelpArticle> {
        const payload = { ...updates };
        // Remove unupdatable system logic
        delete payload.id;
        delete payload.viewCount;
        delete payload.helpfulCount;

        const updated = await prisma.helpArticle.update({
            where: { id },
            data: payload
        });

        await HelpSearchService.indexArticle(id);
        return updated;
    }

    /**
     * Publish an article
     */
    static async publishArticle(id: string): Promise<HelpArticle> {
        return prisma.helpArticle.update({
            where: { id },
            data: { status: 'PUBLISHED' }
        });
    }

    /**
     * Archive an article
     */
    static async archiveArticle(id: string): Promise<HelpArticle> {
        return prisma.helpArticle.update({
            where: { id },
            data: { status: 'ARCHIVED' }
        });
    }

    /**
     * Hard Delete an article
     */
    static async deleteArticle(id: string): Promise<void> {
        await prisma.helpArticle.delete({
            where: { id }
        });
    }

    /**
     * Increment helpful count
     */
    static async markHelpful(id: string): Promise<HelpArticle> {
        return prisma.helpArticle.update({
            where: { id },
            data: { helpfulCount: { increment: 1 } }
        });
    }
}
