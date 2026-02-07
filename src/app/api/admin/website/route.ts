
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get CMS data (Settings + Pages + Menus)
export async function GET() {
    const session: any = await getSession();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let [settings, pages, menus] = await Promise.all([
            (prisma as any).cmsGeneralSettings.findFirst(),
            (prisma as any).cmsPage.findMany({ include: { sections: { orderBy: { order: 'asc' } } } }),
            (prisma as any).cmsMenu.findMany()
        ]);

        // Varsayılan menüleri oluştur
        if (menus.length === 0) {
            await (prisma as any).cmsMenu.create({
                data: {
                    name: 'Header',
                    items: [
                        { label: 'Özellikler', link: '/#features' },
                        { label: 'Fiyatlandırma', link: '/#pricing' },
                        { label: 'S.S.S', link: '/#faq' }
                    ]
                }
            });
            await (prisma as any).cmsMenu.create({
                data: {
                    name: 'Footer',
                    items: [
                        { label: 'Gizlilik', link: '/privacy' },
                        { label: 'Kullanım Koşulları', link: '/terms' }
                    ]
                }
            });
            menus = await (prisma as any).cmsMenu.findMany();
        }

        // Eğer hiç sayfa yoksa varsayılan bir index sayfası oluştur (Profesyonel Databox Yapısı)
        if (pages.length === 0) {
            const defaultPage = await (prisma as any).cmsPage.create({
                data: {
                    title: 'Ana Sayfa',
                    slug: 'index',
                    isActive: true,
                    sections: {
                        create: [
                            {
                                type: 'BANNER',
                                order: 0,
                                content: {
                                    text: 'Use AI to <strong>talk to your data</strong> and move from insights to action faster. 👆',
                                    linkText: 'Read the blog.',
                                    linkUrl: '#'
                                }
                            },
                            {
                                type: 'HERO',
                                order: 1,
                                content: {
                                    title: 'Modern BI software for agencies <br />that need answers now',
                                    subtitle: 'Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.',
                                    badgeText: '⭐ 4.4 | G2 ✨ 4.6 | CAPTERRA',
                                    reviewsText: 'based on 1,000+ reviews',
                                    primaryBtnText: 'Try It Free',
                                    secondaryBtnText: 'Book a Demo',
                                    noteText: 'No card required',
                                    visualUrl: 'https://databox.com/wp-content/uploads/2023/04/databox-dashboards.png',
                                    showFloatingCard: true,
                                    floatingCardTitle: 'Explore Features'
                                }
                            },
                            {
                                type: 'PARTNERS',
                                order: 2,
                                content: {
                                    items: ['toast', 'bambooHR', 'SmartBug', 'CONAIR', 'dentsu', 'wistia', 'AVIDLY', 'NEW BREED+']
                                }
                            },
                            {
                                type: 'COMPARISON',
                                order: 3,
                                content: {
                                    title: 'Business intelligence, <span class="grad-text">without the baggage</span>',
                                    subtitle: 'Databox removes the complicated setup, steep price, and long learning curve. Your data finally works at the speed of your business.',
                                    beforeTitle: 'BEFORE DATABOX',
                                    beforeList: [
                                        'Per-seat licenses and consulting fees put BI out of reach.',
                                        'ETL projects, custom code, and IT backlogs stall momentum.',
                                        'You submit tickets and wait days for new metrics.',
                                        'Fragmented tools lead to silos and more questions.'
                                    ],
                                    afterTitle: 'AFTER DATABOX',
                                    afterList: [
                                        'Unlimited users on every plan—BI for all.',
                                        'Go live fast with 130+ integrations and 200+ templates.',
                                        'Self-serve dashboards give you answers instantly.',
                                        'Unified datasets end debates for good.'
                                    ]
                                }
                            },
                            {
                                type: 'METRICS',
                                order: 4,
                                content: {
                                    title: '20,000+ scaling teams & agencies',
                                    subtitle: 'drive results that matter',
                                    items: [
                                        { stat: '↑ 55%', desc: 'increase in sales YoY', linkText: 'Read case study →' },
                                        { stat: '↓ 50%', desc: 'decrease in overall reporting costs', linkText: 'Read case study →' },
                                        { stat: '↓ 60%', desc: 'reduction in time spent creating reports', linkText: 'Read case study →' }
                                    ]
                                }
                            },
                            {
                                type: 'GRID',
                                order: 5,
                                content: {
                                    title: 'Unlock data. Empower decisions.',
                                    subtitle: 'Your data is useless unless your team can quickly put it to work to make better decisions.',
                                    cols: 3,
                                    bg: '#fcfcfd',
                                    items: [
                                        { title: 'Make better decisions, together', desc: 'Send the right data to the right people.', icon: '📊' },
                                        { title: 'Measure what matters most', desc: 'Focus on what matters most to your growth.', icon: '🎯' },
                                        { title: 'Draw better conclusions', desc: 'Know the why behind the number.', icon: '🔎' },
                                        { title: 'Enable “DIY BI”', desc: 'Empower your entire team to self-serve data.', icon: '⚡' },
                                        { title: 'Provide clarity at a glance', desc: 'Understand your performance instantly.', icon: '✨' },
                                        { title: 'Share versions and visions', desc: 'Move faster without second-guessing.', icon: '🤝' }
                                    ]
                                }
                            },
                            {
                                type: 'EXPLORE',
                                order: 6,
                                content: {
                                    items: [
                                        {
                                            title: 'Analyze',
                                            desc: 'Understand how your business is performing.',
                                            list: ['Drill-down to row-level data', 'Compare periods', 'Filter by dimension']
                                        },
                                        {
                                            title: 'Report & Automate',
                                            desc: 'Automatically share data with your team.',
                                            list: ['Page and Slide reports', 'Slack, email, or mobile', 'Shareable links']
                                        },
                                        {
                                            title: 'Plan',
                                            desc: 'Use your data to set better targets.',
                                            list: ['Set and track goals', 'Benchmark performance', 'Forecast future results']
                                        }
                                    ]
                                }
                            },
                            {
                                type: 'CTA',
                                order: 7,
                                content: {
                                    title: 'Make better decisions, together, faster',
                                    primaryBtnText: 'Try It Free',
                                    secondaryBtnText: 'Book a Demo'
                                }
                            }
                        ]
                    }
                },
                include: { sections: { orderBy: { order: 'asc' } } }
            });
            pages = [defaultPage];
        }

        return NextResponse.json({ settings, pages, menus });
    } catch (error) {
        console.error('CMS GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch CMS data' }, { status: 500 });
    }
}

// Update General Settings
export async function POST(req: Request) {
    const session: any = await getSession();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const existing = await (prisma as any).cmsGeneralSettings.findFirst();

        let settings;
        if (existing) {
            settings = await (prisma as any).cmsGeneralSettings.update({
                where: { id: existing.id },
                data: body
            });
        } else {
            settings = await (prisma as any).cmsGeneralSettings.create({
                data: body
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('CMS POST Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
