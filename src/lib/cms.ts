
import { prisma } from '@/lib/prisma';

export async function getLandingProps() {
    try {
        const [settings, page] = await Promise.all([
            prisma.cmsGeneralSettings.findFirst(),
            prisma.cmsPage.findUnique({
                where: { slug: 'index' },
                include: { sections: { orderBy: { order: 'asc' }, where: { isActive: true } } }
            })
        ]);

        return {
            settings: settings || {
                siteTitle: 'Periodya',
                logoUrl: null,
                primaryColor: '#446ee7',
                whatsappNumber: ''
            },
            sections: page?.sections || []
        };
    } catch (error) {
        console.error('getLandingProps Error:', error);
        return { settings: { siteTitle: 'Periodya' }, sections: [] };
    }
}
