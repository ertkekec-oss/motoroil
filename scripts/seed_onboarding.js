const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding onboarding steps...");

    // Remove old steps
    await prisma.onboardingStep.deleteMany({});

    // Add new steps
    const steps = [
        {
            title: "İlk Cariyi Ekle",
            description: "Cari kart oluşturun.",
            href: "/customers/new",
            actionKey: "firstCustomer",
            order: 0,
            isActive: true
        },
        {
            title: "İlk Ürünü Ekle",
            description: "Kataloga yeni bir ürün ekleyin.",
            href: "/products/new",
            actionKey: "firstProduct",
            order: 1,
            isActive: true
        },
        {
            title: "İlk Siparişi Gir",
            description: "Müşteriden sipariş alın.",
            href: "/sales/orders/new",
            actionKey: "firstOrder",
            order: 2,
            isActive: true
        }
    ];

    for (const step of steps) {
        await prisma.onboardingStep.create({ data: step });
        console.log(`Added step: ${step.title}`);
    }

    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
