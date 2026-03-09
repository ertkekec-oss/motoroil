import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { HelpSearchService } from '@/services/support/HelpSearchService';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    try {
        const articles = await HelpSearchService.search(query, tenantId);
        return NextResponse.json({
            success: true,
            results: articles.map(a => ({
                id: a.id,
                title: a.title,
                slug: a.slug,
                summary: a.summary,
                relevanceScore: 100 // We mocked relevance sorting inside HelpSearchService
            }))
        });
    } catch (error: any) {
        console.error('KB API Search Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
