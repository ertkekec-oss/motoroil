
const { PrismaClient } = require('@prisma/client');
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

    const banSection = page.sections.find(s => s.type === 'BANNER');
    if (banSection) {
        await prisma.cmsSection.update({
            where: { id: banSection.id },
            data: {
                content: {
                    text: 'Use AI to <strong>talk to your data</strong> and move from insights to action faster. 👆',
                    linkText: 'Read the blog.',
                    linkUrl: '#'
                }
            }
        });
        console.log('Banner section updated');
    }

    const heroSection = page.sections.find(s => s.type === 'HERO');
    if (heroSection) {
        await prisma.cmsSection.update({
            where: { id: heroSection.id },
            data: {
                content: {
                    title: 'Modern BI software for agencies <br />that need answers now',
                    subtitle: 'Empower your entire team to easily see, share and act on data — without the cost or complexity of legacy BI software.',
                    badgeText: '⭐ 4.4 | G2; ✨ 4.6 | CAPTERRA',
                    reviewsText: 'based on 1,000+ reviews',
                    primaryBtnText: 'Try It Free',
                    primaryBtnUrl: '/register',
                    secondaryBtnText: 'Book a Demo',
                    secondaryBtnUrl: '#',
                    noteText: 'No card required',
                    visualUrl: 'https://databox.com/wp-content/uploads/2023/04/databox-dashboards.png'
                }
            }
        });
        console.log('Hero section updated');
    }

    const metSection = page.sections.find(s => s.type === 'METRICS');
    if (metSection) {
        await prisma.cmsSection.update({
            where: { id: metSection.id },
            data: {
                content: {
                    topTitle: '20,000+ scaling teams & agencies',
                    mainTitle: 'drive results that matter',
                    items: [
                        { stat: '↑ 55%', label: 'increase in sales YoY', logo: 'https://databox.com/wp-content/uploads/2023/04/first-response.png', linkText: 'Read case study →', linkUrl: '#' },
                        { stat: '↓ 50%', label: 'decrease in overall reporting costs', logo: 'https://databox.com/wp-content/uploads/2023/04/market-launcher.png', linkText: 'Read case study →', linkUrl: '#' },
                        { stat: '↓ 60%', label: 'reduction in time spent creating reports', logo: 'https://databox.com/wp-content/uploads/2023/04/hero-factory.png', linkText: 'Read case study →', linkUrl: '#' }
                    ]
                }
            }
        });
        console.log('METRICS section updated');
    }

    const compSection = page.sections.find(s => s.type === 'COMPARISON');
    if (compSection) {
        await prisma.cmsSection.update({
            where: { id: compSection.id },
            data: {
                content: {
                    topTitle: 'Business intelligence, ',
                    mainTitle: 'without the baggage',
                    desc: 'Databox removes the complicated setup, steep price, and long learning curve. Your data finally works at the speed of your business. With our <strong>self-service business intelligence, or DIY BI</strong>, anyone on your team can build dashboards and reports in minutes.',
                    beforeTitle: 'BEFORE DATABOX',
                    beforeList: [
                        'Per-seat licenses and consulting fees put BI out of reach.',
                        'ETL projects, custom code, SQL queries, and IT backlogs stall momentum.',
                        'You submit tickets and wait days for new metrics or ad-hoc reports.',
                        'Fragmented tools lead to silos, debates, and more questions.',
                        'Leaders miss opportunities because performance updates come too late.'
                    ],
                    afterTitle: 'AFTER DATABOX',
                    afterList: [
                        'Unlimited users on every plan—BI for all, no extra fees.',
                        'Go live fast with 130+ integrations, 200+ templates, and no-code metric builder.',
                        'Self-serve dashboards & AI summaries give you answers instantly.',
                        'Unified datasets end "which number is right?" debates for good.',
                        'Real-time dashboards and automated reports keep leaders informed when it matters.'
                    ]
                }
            }
        });
        console.log('COMPARISON section updated');
    }

    const expSection = page.sections.find(s => s.type === 'EXPLORE');
    if (expSection) {
        await prisma.cmsSection.update({
            where: { id: expSection.id },
            data: {
                content: {
                    topTitle: 'Unlock data. ',
                    mainTitle: 'Empower decisions.',
                    desc: "Your data is useless unless your team can quickly put it to work to make better decisions. And right now, they can't. It's siloed across teams and tools or gated behind software with steep prices and long learning curves.",
                    primaryBtnText: 'Why choose Databox',
                    primaryBtnUrl: '#',
                    items: [
                        { title: 'Make better decisions, together', desc: 'Send the right data to the right people, in the right format, at the right time.', icon: '👥' },
                        { title: 'Measure what matters most', desc: 'Focus on what matters most to your growth.', icon: '📈' },
                        { title: 'Draw better conclusions', desc: 'Know the why behind the number.', icon: '🎯' },
                        { title: 'Enable "DIY BI"', desc: 'Empower your entire team to self-serve data.', icon: '🛠️' },
                        { title: 'Provide clarity at a glance', desc: 'Understand your performance instantly.', icon: '🖥️' },
                        { title: 'Share versions and visions', desc: 'Move faster without second-guessing the source or meaning.', icon: '🚩' }
                    ]
                }
            }
        });
        console.log('EXPLORE section updated');
    }

    const ctaSection = page.sections.find(s => s.type === 'CTA');
    if (ctaSection) {
        await prisma.cmsSection.update({
            where: { id: ctaSection.id },
            data: {
                content: {
                    title: 'Make better decisions,<br />together, faster',
                    primaryBtnText: 'Try It Free',
                    primaryBtnUrl: '/register',
                    secondaryBtnText: 'Book a Demo',
                    secondaryBtnUrl: '#'
                }
            }
        });
        console.log('CTA section updated');
    }

    const navSection = page.sections.find(s => s.type === 'NAV');
    if (navSection) {
        await prisma.cmsSection.update({
            where: { id: navSection.id },
            data: {
                content: {
                    loginText: 'Login',
                    loginUrl: '/login',
                    primaryBtnText: 'Try It Free',
                    primaryBtnUrl: '/register',
                    secondaryBtnText: 'Book a Demo',
                    secondaryBtnUrl: '#',
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

    const footerSection = page.sections.find(s => s.type === 'FOOTER');
    const footerContent = {
        desc: 'Databox Inc.<br/>HQ: Boston, MA, USA',
        subtitle: 'Modern BI for teams that needs answers now',
        items: [
            { title: 'Product', list: ['Overview|#', 'Integrations|#', 'Datasets|#', 'Metrics & KPIs|#', 'Dashboards|#', 'Reports|#', 'Benchmarks|#', 'Goals|#', 'Performance Management|#'] },
            { title: 'Compare', list: ['vs. Tableau|#', 'vs. Power BI|#', 'vs. Looker Studio|#', 'vs. AgencyAnalytics|#', 'vs. Klipfolio|#', 'vs. Supermetrics|#', 'vs. Geckoboard|#', 'vs. Whatagraph|#', 'vs. Qlik|#', 'vs. DashThis|#'] },
            { title: 'Company', list: ['About us|#', 'Why Databox|#', 'Careers|#', 'Product & Engineering|#', 'Talent Resources|#', "We're Hiring!|#"] },
            { title: 'Support & Resources', list: ['Start Chat|#', 'Help Center|#', 'Databox Community|#', 'API Documentation|#', 'System Status|#', 'Blog|#', 'Become a Solutions Partner|#', 'Courses & Certifications|#', 'Product Updates|#', 'Affiliate Program|#'] }
        ]
    };

    if (footerSection) {
        await prisma.cmsSection.update({
            where: { id: footerSection.id },
            data: { content: footerContent }
        });
        console.log('Footer section updated');
    } else {
        await prisma.cmsSection.create({
            data: {
                type: 'FOOTER',
                pageId: page.id,
                order: 100,
                content: footerContent
            }
        });
        console.log('Footer section created');
    }

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
