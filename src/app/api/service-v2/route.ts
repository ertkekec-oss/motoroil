import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: List all Service Orders for the dashboard
export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const orders = await prisma.serviceOrder.findMany({
            where: { companyId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true, phone: true } },
                asset: true,
                items: { select: { technician: { select: { name: true } } } }
            }
        });

        // Format for UI (resolve technician from first item or null)
        const formatted = orders.map(o => ({
            id: o.id,
            status: o.status,
            complaint: o.complaint,
            totalAmount: o.totalAmount,
            createdAt: o.createdAt,
            technician: o.items[0]?.technician?.name || 'Atanmadı',
            customer: {
                name: o.customer.name,
                phone: o.customer.phone
            },
            asset: {
                primaryIdentifier: o.asset?.primaryIdentifier || 'Bilinmiyor',
                brand: o.asset?.brand || '',
                model: o.asset?.model || ''
            }
        }));

        return NextResponse.json({ success: true, orders: formatted });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Create a new Service Order & Customer Asset
export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const body = await request.json();
        const { customerId, assetType, primaryIdentifier, brand, model, complaint, currentKm, technicianId, customFields } = body;

        if (!customerId || !primaryIdentifier) {
             return NextResponse.json({ success: false, error: 'Müşteri ve Cihaz/Plaka zorunludur.' }, { status: 400 });
        }

        // 1. Find or Create Asset
        let asset = await prisma.customerAsset.findUnique({
            where: { companyId_primaryIdentifier: { companyId, primaryIdentifier } }
        });

        if (!asset) {
            asset = await prisma.customerAsset.create({
                data: {
                    companyId,
                    customerId,
                    assetType: assetType || 'VEHICLE',
                    primaryIdentifier,
                    brand,
                    model,
                    metadata: customFields || {},
                }
            });
        } else if (asset.customerId !== customerId) {
            // Update owner if asset switched hands, and merge custom fields metadata
            const mergedMetadata = { ...(asset.metadata as any || {}), ...(customFields || {}) };
            asset = await prisma.customerAsset.update({
                where: { id: asset.id },
                data: { customerId, metadata: mergedMetadata }
            });
        }

        // 2. Create Service Order
        const order = await prisma.serviceOrder.create({
            data: {
                companyId,
                customerId,
                assetId: asset.id,
                complaint,
                branch: auth.user.branch || 'Merkez',
                status: 'PENDING',
                currentKm_or_Use: currentKm ? parseInt(currentKm) : null,
            }
        });

        // 3. (Optional) Auto-assign technician via empty labor item to keep track
        if (technicianId) {
             await prisma.serviceOrderItem.create({
                 data: {
                     serviceOrderId: order.id,
                     name: 'Arıza Tespiti / Teşhis',
                     type: 'LABOR',
                     quantity: 1,
                     unitPrice: 0,
                     totalPrice: 0,
                     technicianId,
                 }
             });
        }

        return NextResponse.json({ success: true, orderId: order.id });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
