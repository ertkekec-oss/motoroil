import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');
        
        let where: any = { deletedAt: null, companyId: (session as any).companyId };
        
        if (customerId) {
            where.customerId = customerId;
        }

        const rawServices = await prisma.serviceOrder.findMany({
            where,
            include: { 
                asset: true,
                items: {
                    include: { technician: true }
                },
                tasks: {
                    include: { assignee: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Translate English statuses to Turkish for frontend display if needed, or frontend handles it
        // The frontend expects the status text directly or processes it
        const statusMap: Record<string, string> = {
            'PENDING': 'Beklemede',
            'IN_PROGRESS': 'İşlemde',
            'WAITING_APPROVAL': 'Beklemede',
            'WAITING_PART': 'Beklemede',
            'QUALITY_CONTROL': 'İşlemde',
            'READY': 'Beklemede', // Or 'Hazır' if frontend supports it
            'COMPLETED': 'Tamamlandı',
            'CANCELLED': 'İptal'
        };

        const formattedServices = rawServices.map(svc => {
            let vehicleType = 'Cihaz';
            let vehicleBrand = '-';
            let plate = '-';
            
            if (svc.asset) {
                plate = svc.asset.primaryIdentifier;
                vehicleBrand = svc.asset.brand || '-';
                
                if (svc.asset.metadata) {
                    try {
                        const meta = typeof svc.asset.metadata === 'string' ? JSON.parse(svc.asset.metadata as string) : svc.asset.metadata;
                        if (meta.type) vehicleType = meta.type;
                    } catch (e) {}
                }
            }

            // try to get technician from tasks first
            let technician = '-';
            const techTask = svc.tasks.find(t => t.assignedRole === 'TECHNICIAN' || t.type === 'SERVICE_APPOINTMENT');
            if (techTask && techTask.assignee) {
                technician = techTask.assignee.firstName + ' ' + techTask.assignee.lastName;
            } else if (svc.items && svc.items.length > 0) {
                // Try from items
                const laborItem = svc.items.find((i: any) => i.technician);
                if (laborItem && (laborItem as any).technician) {
                    technician = (laborItem as any).technician.firstName + ' ' + (laborItem as any).technician.lastName;
                }
            }

            // Check if status is English, then map it
            let finalStatus = svc.status;
            if (statusMap[svc.status]) {
                finalStatus = statusMap[svc.status];
            }

            return {
                id: svc.id,
                date: svc.createdAt,
                createdAt: svc.createdAt,
                appointmentDate: svc.appointmentDate,
                status: finalStatus,
                totalAmount: svc.totalAmount,
                vehicleType,
                vehicleBrand,
                plate,
                items: svc.items || [],
                technicianName: technician,
                technician: technician,
                description: svc.complaint || ''
            };
        });

        return NextResponse.json({ success: true, services: formattedServices });

    } catch (error: any) {
        console.error('Services GET API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
