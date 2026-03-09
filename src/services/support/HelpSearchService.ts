import prisma from '@/lib/prisma';
import { HelpArticle, HelpArticleStatus } from '@prisma/client';

export class HelpSearchService {
    /**
     * Builds the search vectors/index for an article
     * In a real TSVECTOR setup we'd update db directly natively,
     * but here we mock the vector string field and tag array logic.
     */
    static async indexArticle(articleId: string) {
        const article = await prisma.helpArticle.findUnique({ where: { id: articleId } });
        if (!article) return;

        // A simple text unification for manual weighted searching
        const titleVector = article.title.toLowerCase();
        const contentVector = `${article.summary || ''} ${article.content}`.toLowerCase();

        await prisma.helpSearchIndex.upsert({
            where: { articleId },
            update: {
                titleVector,
                contentVector,
                tags: article.tags
            },
            create: {
                articleId,
                titleVector,
                contentVector,
                tags: article.tags
            }
        });
    }

    /**
     * Search over knowledge base with relevance scoring.
     * Scans title, summary, content, and tags.
     */
    static async search(query: string, tenantId?: string | null): Promise<HelpArticle[]> {
        if (!query || query.trim() === '') return [];

        const qs = query.toLowerCase().trim();

        // In native PostgreSQL we would use `tsvector` and `@@ plainto_tsquery`.
        // Since we are building a standard Prisma engine, we do a multi-field contains.
        // For relevance scoring, we pull matching articles, score in TS, then sort.

        // 1. Fetch Candidates
        const candidates = await prisma.helpArticle.findMany({
            where: {
                status: 'PUBLISHED',
                OR: tenantId
                    ? [{ tenantId: null }, { tenantId }]
                    : [{ tenantId: null }],
                AND: [ // At least one match to pull early
                    {
                        OR: [
                            { title: { contains: qs, mode: 'insensitive' } },
                            { summary: { contains: qs, mode: 'insensitive' } },
                            { content: { contains: qs, mode: 'insensitive' } },
                            { tags: { hasSome: [qs] } }
                        ]
                    }
                ]
            },
            include: {
                category: true
            }
        });

        // 2. Compute Relevance Score
        const scored = candidates.map(article => {
            let score = 0;

            const t = article.title.toLowerCase();
            const s = article.summary?.toLowerCase() || '';
            const c = article.content.toLowerCase();

            // Exact phrase match in title (Highest Weight)
            if (t === qs) score += 100;
            else if (t.includes(qs)) score += 50;

            // Tag match
            if (article.tags.some(tag => tag.toLowerCase() === qs)) {
                score += 40;
            }

            // Summary exact/partial phrase match
            if (s.includes(qs)) score += 20;

            // Content match (occurrences based)
            const contentMatches = c.split(qs).length - 1;
            score += (contentMatches * 5); // 5 points per occurrence in content

            return { article, score };
        });

        // 3. Sort by Score descending and take top 10
        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, 10).map(s => s.article);
    }

    /**
     * Find Related Articles
     * Based on: Same Category, Similar Tags, Similar Title Keywords
     */
    static async getRelatedArticles(articleId: string, limit: number = 5): Promise<HelpArticle[]> {
        const article = await prisma.helpArticle.findUnique({
            where: { id: articleId }
        });

        if (!article) return [];

        // Find articles in the same category OR with matching tags
        const related = await prisma.helpArticle.findMany({
            where: {
                id: { not: article.id },
                status: 'PUBLISHED',
                OR: [
                    { categoryId: article.categoryId },
                    { tags: { hasSome: article.tags } }
                ]
            },
            include: {
                category: true
            },
            take: 20 // Pull a reasonable set to score
        });

        // Score relatedness
        const scored = related.map(rel => {
            let score = 0;

            // Category match
            if (rel.categoryId === article.categoryId) score += 30;

            // Tags intersection
            const commonTags = rel.tags.filter(t => article.tags.includes(t));
            score += (commonTags.length * 20);

            // Title keyword intersection (simple overlap)
            const aWords = article.title.toLowerCase().split(' ');
            const relWords = rel.title.toLowerCase().split(' ');
            const commonWords = relWords.filter(w => w.length > 3 && aWords.includes(w));
            score += (commonWords.length * 10);

            return { article: rel, score };
        });

        // Sort by relevance score
        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, limit).map(s => s.article);
    }
}
