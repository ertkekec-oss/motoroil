import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId'); // Current logged in user ID
        const otherUserId = searchParams.get('otherUserId'); // The person they are chatting with
        const type = searchParams.get('type'); // 'list' to get recent conversations

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        }

        if (type === 'list') {
            // Get all messages where user is sender or receiver
            // We want to group by the 'other' person to show conversation list
            // Prisma doesn't support complex group by + relation easily, so we fetch recent messages and aggregate in code
            const recentMessages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { id: true, name: true, role: true, username: true } },
                    receiver: { select: { id: true, name: true, role: true, username: true } }
                },
                take: 100 // Last 100 messages to build the list
            });

            const conversations = new Map();

            recentMessages.forEach(msg => {
                const isMeSender = msg.senderId === userId;
                const otherUser = isMeSender ? msg.receiver : msg.sender;

                if (!otherUser) return; // Should not happen if data integrity is good

                if (!conversations.has(otherUser.id)) {
                    conversations.set(otherUser.id, {
                        userId: otherUser.id,
                        name: otherUser.name,
                        role: otherUser.role,
                        username: otherUser.username,
                        lastMessage: msg.content,
                        timestamp: msg.createdAt,
                        unreadCount: (!isMeSender && !msg.isRead) ? 1 : 0
                    });
                } else {
                    // Update unread count if applicable
                    if (!isMeSender && !msg.isRead) {
                        const existing = conversations.get(otherUser.id);
                        existing.unreadCount += 1;
                        conversations.set(otherUser.id, existing);
                    }
                }
            });

            return NextResponse.json({ success: true, conversations: Array.from(conversations.values()) });
        } else if (otherUserId) {
            // Get chat history with specific user
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId }
                    ]
                },
                orderBy: { createdAt: 'asc' }, // Oldest first for chat window
                take: 50 // Load last 50
            });

            // Mark as read
            await prisma.message.updateMany({
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    isRead: false
                },
                data: { isRead: true }
            });

            return NextResponse.json({ success: true, messages });
        } else {
            return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderId, receiverId, content } = body;

        if (!senderId || !receiverId || !content) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                content
            }
        });

        return NextResponse.json({ success: true, message });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
