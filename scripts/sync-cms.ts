
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const page = await prisma.cmsPage.findUnique({
        where: { slug: 'index' },
        include: { sections: true }
    });

    if (!page) {
        console.log('Index page not found');
        return;
    }

    const heroSection = page.sections.find(s => s.type === 'HERO');
    if (heroSection) {
        await prisma.cmsSection.update({
            where: { id: heroSection.id },
            data: {
                content: {
                    title: 'Modern BI software for agencies <br />that need answers now',
                    subtitle: 'Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.',
                    badgeText: '⭐ 4.4 | G2 | ✨ 4.6 | CAPTERRA',
                    reviewsText: 'based on 1,000+ reviews',
                    primaryBtnText: 'Try It Free',
                    secondaryBtnText: 'Book a Demo',
                    noteText: 'No card required',
                    visualUrl: 'https://databox.com/wp-content/uploads/2023/04/databox-dashboards.png'
                }
            }
        });
        console.log('Hero section updated');
    }

    const navSection = page.sections.find(s => s.type === 'NAV');
    if (navSection) {
        await prisma.cmsSection.update({
            where: { id: navSection.id },
            data: {
                content: {
                    loginText: 'Login',
                    primaryBtnText: 'Try It Free',
                    secondaryBtnText: 'Book a Demo',
                    menuItems: [
                        { title: 'Products ⌵', url: '#' },
                        { title: 'Solutions ⌵', url: '#' },
                        { title: 'Resources ⌵', url: '#' },
                        { title: 'Pricing', url: '#' }
                    ]
                }
            }
        });
        console.log('NAV section updated');
    }

    // Update site title in settings
    await prisma.cmsGeneralSettings.updateMany({
        data: {
            siteTitle: 'databox'
        }
    });
    console.log('Settings updated');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
