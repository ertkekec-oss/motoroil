import prisma from '@/lib/prisma';
import {
    SupportTicket,
    SupportTicketStatus,
    SupportTicketPriority,
    SupportTicketCategory,
    SupportTicketAuthorType,
    SupportTicketComment,
    SupportTicketAttachment
} from '@prisma/client';
import { PlatformDoctorService } from '../infrastructure/PlatformDoctorService';
import { SupportRoutingService } from './SupportRoutingService';
import { SupportSLAService } from './SupportSLAService';

export class SupportTicketService {
    /**
     * User Function: Create a new support ticket
     */
    static async createTicket(params: {
        tenantId: string;
        createdByUserId: string;
        subject: string;
        description: string;
        category: SupportTicketCategory;
        priority?: SupportTicketPriority;
        currentPage?: string;
        browserInfo?: string;
        metadataJson?: any;
    }): Promise<SupportTicket> {

        // Auto-Enrich details from Platform Doctor
        const enrichment = await PlatformDoctorService.enrichSupportTicket(params.tenantId);

        const augmentedMetadata = {
            ...(params.metadataJson || {}),
            platformDoctor: enrichment
        };

        // Auto-Detection overrides if user didn't specify or we augment it
        const finalCategory = params.category || SupportRoutingService.detectCategory(params.subject, params.description);
        const finalPriority = params.priority || SupportRoutingService.detectPriority(params.subject, params.description);

        const ticket = await prisma.supportTicket.create({
            data: {
                tenantId: params.tenantId,
                createdByUserId: params.createdByUserId,
                subject: params.subject,
                description: params.description,
                category: finalCategory,
                priority: finalPriority,
                currentPage: params.currentPage,
                browserInfo: params.browserInfo,
                metadataJson: augmentedMetadata,
                status: 'OPEN'
            }
        });

        // 1. Post-creation Async Hook: Apply Tags
        await SupportRoutingService.applyTags(ticket.id, ticket.tenantId, ticket.subject, ticket.description);

        // 2. Post-creation Async Hook: Auto Route
        await SupportRoutingService.assignTicket(ticket.id, ticket.category);

        // 3. Bind SLA Tracking Engine
        await SupportSLAService.applySLA(ticket);

        return ticket;
    }

    /**
     * Update the status of a ticket with safe transition rules
     */
    static async updateTicketStatus(
        ticketId: string,
        newStatus: SupportTicketStatus,
        actorRole: 'USER' | 'ADMIN'
    ): Promise<SupportTicket> {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            throw new Error(`Ticket not found: ${ticketId}`);
        }

        // Role-based Transition Rules
        if (ticket.status === 'CLOSED' && actorRole !== 'ADMIN') {
            throw new Error('Closed tickets cannot be modified by users.');
        }

        if (actorRole === 'USER') {
            // Users can only resolve or reopen their tickets (if not closed)
            const allowedUserTransitions = ['RESOLVED', 'OPEN'];
            if (!allowedUserTransitions.includes(newStatus)) {
                throw new Error(`Users cannot transition ticket to status: ${newStatus}`);
            }
        }

        const updates: any = { status: newStatus };

        if (newStatus === 'RESOLVED' && ticket.status !== 'RESOLVED') {
            updates.resolvedAt = new Date();
            // Free SLAs
            await SupportSLAService.resolveSLA(ticketId);
        } else if (newStatus === 'CLOSED' && ticket.status !== 'CLOSED') {
            updates.closedAt = new Date();
            await SupportSLAService.resolveSLA(ticketId);
        } else if (newStatus !== 'RESOLVED' && newStatus !== 'CLOSED') {
            updates.resolvedAt = null;
        }

        return prisma.supportTicket.update({
            where: { id: ticketId },
            data: updates
        });
    }

    /**
     * Admin Function: Assign a ticket to a support agent
     */
    static async assignTicket(ticketId: string, assignedToUserId: string | null): Promise<SupportTicket> {
        return prisma.supportTicket.update({
            where: { id: ticketId },
            data: { assignedToUserId }
        });
    }

    /**
     * Add a comment to a ticket
     */
    static async addComment(params: {
        ticketId: string;
        userId: string;
        message: string;
        authorType: SupportTicketAuthorType;
    }): Promise<SupportTicketComment> {
        // Audit timeline rule: If USER comments on an IN_PROGRESS or WAITING_USER ticket, 
        // it automatically goes back to OPEN/IN_PROGRESS (logic depending on business requirement).
        // Usually WAITING_USER -> OPEN when user replies. Let's do that.

        if (params.authorType === 'USER') {
            const ticket = await prisma.supportTicket.findUnique({ where: { id: params.ticketId } });
            if (ticket?.status === 'WAITING_USER') {
                await prisma.supportTicket.update({
                    where: { id: params.ticketId },
                    data: { status: 'OPEN' }
                });
            }
        }

        return prisma.supportTicketComment.create({
            data: {
                ticketId: params.ticketId,
                userId: params.userId,
                message: params.message,
                authorType: params.authorType
            }
        });
    }

    /**
     * Add an attachment to a ticket
     */
    static async addAttachment(params: {
        ticketId: string;
        uploadedByUserId: string;
        fileName: string;
        fileUrl: string;
        mimeType?: string;
        size?: number;
    }): Promise<SupportTicketAttachment> {
        return prisma.supportTicketAttachment.create({
            data: {
                ticketId: params.ticketId,
                uploadedByUserId: params.uploadedByUserId,
                fileName: params.fileName,
                fileUrl: params.fileUrl,
                mimeType: params.mimeType,
                size: params.size
            }
        });
    }

    /**
     * Generic fetch by ID. Permission scoping should be done by the presentation layer.
     */
    static async getTicketById(ticketId: string) {
        return prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                comments: {
                    orderBy: { createdAt: 'asc' }
                },
                attachments: true
            }
        });
    }

    /**
     * Fetch all tickets for a specific tenant (user view)
     */
    static async getTicketsByTenant(tenantId: string) {
        return prisma.supportTicket.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Admin Function: Fetch tickets across all tenants with optional filters
     */
    static async getTicketsForAdmin(filters?: {
        status?: SupportTicketStatus;
        priority?: SupportTicketPriority;
        category?: SupportTicketCategory;
        assignedToUserId?: string;
        tenantId?: string;
    }) {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.priority) where.priority = filters.priority;
        if (filters?.category) where.category = filters.category;
        if (filters?.assignedToUserId !== undefined) where.assignedToUserId = filters.assignedToUserId;
        if (filters?.tenantId) where.tenantId = filters.tenantId;

        return prisma.supportTicket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                comments: {
                    take: 1, // Peek at last comment
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
}
