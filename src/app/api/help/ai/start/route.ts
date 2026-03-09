import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { HelpAssistantService } from '@/services/support/HelpAssistantService';

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenantId = auth.user?.tenantId;
    const userId = auth.user?.id;

    if (!tenantId || !userId) {
        return NextResponse.json({ error: 'Tenant context required' }, { status: 400 });
    }

    try {
        const { question, sessionId } = await req.json();

        const conversation = await HelpAssistantService.startConversation({
            tenantId,
            userId,
            sessionId,
            question
        });

        const aiAnswer = await HelpAssistantService.generateAnswer(conversation.id, tenantId);

        // Add deflection prompt if answer generated successfully
        await HelpAssistantService.suggestTicketCreation(conversation.id);

        return NextResponse.json({ success: true, conversationId: conversation.id, aiAnswer });
    } catch (error: any) {
        console.error('AI Start Conversation Error:', error);
        return NextResponse.json({ error: 'Failed to start AI Support.' }, { status: 500 });
    }
}
