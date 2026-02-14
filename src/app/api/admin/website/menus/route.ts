
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    const sessionResult: any = await getSession();
    const session = sessionResult?.user || sessionResult;

    const isPlatformAdmin = session?.role === 'SUPER_ADMIN' || session?.tenantId === 'PLATFORM_ADMIN' || session?.role === 'ADMIN';

    if (!session || !isPlatformAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        // body bir array olabilir veya tek bir obje olabilir. Biz toplu güncelleme yapalım.
        // [{ id: "...", items: [...] }, { id: "...", items: [...] }]

        if (Array.isArray(body)) {
            for (const menu of body) {
                let existing = null;

                // Try to find by ID first if it's a valid ID
                if (menu.id && !menu.id.startsWith('new_')) {
                    existing = await (prisma as any).cmsMenu.findUnique({ where: { id: menu.id } });
                }

                // If not found by ID, try to find by Name
                if (!existing && menu.name) {
                    existing = await (prisma as any).cmsMenu.findFirst({ where: { name: menu.name } });
                }

                if (existing) {
                    await (prisma as any).cmsMenu.update({
                        where: { id: existing.id },
                        data: { items: menu.items }
                    });
                } else if (menu.name) {
                    await (prisma as any).cmsMenu.create({
                        data: {
                            name: menu.name,
                            items: menu.items
                        }
                    });
                }
            }
        } else {
            // Handle single object update similarly if needed, or keep simple
            await (prisma as any).cmsMenu.update({
                where: { id: body.id },
                data: { items: body.items }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Menu Update Error:', error);
        return NextResponse.json({ error: 'Failed to update menus' }, { status: 500 });
    }
}
