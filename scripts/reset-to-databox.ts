
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetToDatabox() {
    console.log('🗑️  Clearing all existing CMS content...');

    // Delete all existing content
    try {
        await (prisma as any).cmsSection.deleteMany({});
        await (prisma as any).cmsPage.deleteMany({});
        await (prisma as any).cmsMenu.deleteMany({});
        await (prisma as any).cmsGeneralSettings.deleteMany({});
    } catch (e) {
        console.warn('Error clearing content (tables might not exist yet):', e);
    }

    console.log('✅ All CMS content cleared!');
    console.log('📝 Creating Databox content...');

    // Create Settings
    await (prisma as any).cmsGeneralSettings.create({
        data: {
            siteTitle: 'databox',
            logoUrl: '',
            primaryColor: '#0f172a', // Databox dark theme color
            footerText: 'The #1 BI Software for Agencies and Businesses.',
            whatsappNumber: '',
            contactEmail: ''
        }
    });

    // Create Main Menu
    await (prisma as any).cmsMenu.create({
        data: {
            name: 'Main Menu',
            items: [
                { label: 'Product', link: '#' },
                { label: 'Solutions', link: '#' },
                { label: 'Resources', link: '#' },
                { label: 'Pricing', link: '#' }
            ]
        }
    });

    // Create Index Page
    await (prisma as any).cmsPage.create({
        data: {
            title: 'Home',
            slug: 'index',
            isActive: true,
            sections: {
                create: [
                    // NAV SECTION (If supported by schema, otherwise handled by layout)
                    // We'll skip explicit NAV section as it's usually handled by settings/menu

                    // HERO SECTION
                    {
                        type: 'HERO',
                        order: 0,
                        isActive: true,
                        content: {
                            title: 'Modern BI software for agencies <br />that need answers now',
                            subtitle: 'Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.',
                            desc: 'Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.',
                            badge: '⭐ 4.4 | G2 | ✨ 4.6 | CAPTERRA',
                            primaryBtnText: 'Try It Free',
                            primaryBtnUrl: '/register',
                            secondaryBtnText: 'Book a Demo',
                            secondaryBtnUrl: '#demo',
                            note: 'No credit card required',
                            visualUrl: 'https://databox.com/wp-content/uploads/2023/04/databox-dashboards.png'
                        }
                    },

                    // PARTNERS / TRUST SECTION
                    {
                        type: 'PARTNERS',
                        order: 1,
                        isActive: true,
                        content: {
                            title: 'TRUSTED BY 20,000+ BUSINESSES',
                            items: [
                                { name: 'Nike', url: 'https://databox.com/wp-content/uploads/2022/10/Nike-logo.png' },
                                { name: 'Cisco', url: 'https://databox.com/wp-content/uploads/2022/10/Cisco-logo.png' },
                                { name: 'Drift', url: 'https://databox.com/wp-content/uploads/2022/10/Drift-logo.png' },
                                { name: 'Campaign Monitor', url: 'https://databox.com/wp-content/uploads/2022/10/Campaign-Monitor-logo.png' }
                            ]
                        }
                    },

                    // FEATURES / GRID SECTION
                    {
                        type: 'GRID',
                        order: 2,
                        isActive: true,
                        content: {
                            title: 'All your data in one place',
                            cols: 3,
                            items: [
                                {
                                    title: 'Connect',
                                    desc: 'Connect your data from anywhere. SQL, Google Sheets, HubSpot, Google Analytics, and 70+ other integrations.',
                                    icon: '🔌'
                                },
                                {
                                    title: 'Visualize',
                                    desc: 'Build beautiful dashboards in minutes. No coding required.',
                                    icon: '📊'
                                },
                                {
                                    title: 'Report',
                                    desc: 'Automate your reporting and share insights with your team and clients.',
                                    icon: '📈'
                                }
                            ]
                        }
                    },

                    // CTA SECTION
                    {
                        type: 'CTA',
                        order: 3,
                        isActive: true,
                        content: {
                            title: 'Ready to get started?',
                            desc: 'Join 20,000+ businesses who use Databox to track performance.',
                            primaryBtnText: 'Get Started Free',
                            primaryBtnUrl: '/register'
                        }
                    },

                    // FOOTER
                    {
                        type: 'FOOTER',
                        order: 4,
                        isActive: true,
                        content: {
                            bg: '#0f172a',
                            text: '© 2026 Databox Inc.'
                        }
                    }
                ]
            }
        }
    });

    console.log('✅ Databox content created successfully!');
}

resetToDatabox()
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    })
    .finally(() => {
        (prisma as any).$disconnect();
    });
