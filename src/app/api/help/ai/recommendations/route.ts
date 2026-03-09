import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    try {
        // Tenant-isolated check
        const conversation = await prisma.helpConversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation || conversation.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
        }

        const recommendations = await prisma.helpRecommendation.findMany({
            where: { conversationId },
            include: {
                article: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        summary: true
                    }
                }
            },
            orderBy: { score: 'desc' }
        });

        return NextResponse.json({ success: true, recommendations });
    } catch (error: any) {
        console.error('KB AI Recommendations Error:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}
