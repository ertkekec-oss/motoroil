import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { HelpAssistantService } from '@/services/support/HelpAssistantService';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const userId = auth.user?.id;

    if (!tenantId || !userId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    try {
        const { conversationId, content } = await req.json();

        // Verify tenant-isolation for conversation
        const conversation = await prisma.helpConversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation || conversation.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
        }

        // Add user message
        await HelpAssistantService.addUserMessage({
            conversationId,
            content
        });

        // Generate new AI answer
        const aiAnswer = await HelpAssistantService.generateAnswer(conversationId, tenantId);

        // Add deflection prompt if answer generated successfully
        await HelpAssistantService.suggestTicketCreation(conversationId);

        return NextResponse.json({ success: true, aiAnswer });
    } catch (error: any) {
        console.error('AI Add Message Error:', error);
        return NextResponse.json({ error: 'Failed to process AI message.' }, { status: 500 });
    }
}
