import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const categories = await prisma.globalCategory.findMany({
            include: {
                parent: {
                    include: {
                        parent: true
                    }
                }
            }
        });

        // Flatten hierarchical path
        const flatCategories = categories.map(c => {
            let path = c.name;
            if (c.parent) {
                path = `${c.parent.name} > ${path}`;
                if (c.parent.parent) {
                    path = `${c.parent.parent.name} > ${path}`;
                }
            }
            return {
                id: c.id,
                name: c.name,
                path: path
            };
        }).sort((a, b) => a.path.localeCompare(b.path));

        return NextResponse.json({ success: true, categories: flatCategories });

    } catch (e: any) {
        console.error('[GLOBAL_CATEGORIES_API_ERROR]', e.message);
        return NextResponse.json({ success: false, error: 'Server error fetching global categories' }, { status: 500 });
    }
}
