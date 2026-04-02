import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ApprovalClient from './ApprovalClient';

export default async function ApprovalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const order = await prisma.serviceOrder.findUnique({
        where: { id },
        include: { customer: true, asset: true, company: true, items: true }
    });

    if (!order) {
        return notFound();
    }

    const data = {
        companyName: order.company.name,
        customerName: order.customer.name,
        phone: order.customer.phone,
        complaint: order.complaint,
        technicianNotes: order.technicianNotes,
        assetTitle: order.asset ? `${order.asset.brand} - ${order.asset.primaryIdentifier}` : 'Genel Servis Bakımı',
        date: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items
    };

    return <ApprovalClient orderId={id} data={data} />;
}
