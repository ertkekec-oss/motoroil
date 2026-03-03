import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching first company to attach demo data...')

    const company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' }
    })

    if (!company) {
        console.error('No company found in the database. Please create a user/company first.')
        process.exit(1)
    }

    const companyId = company.id
    console.log(`Using company: ${company.name} (${companyId})`)

    // 1. Create Demo Customer
    console.log('Creating demo customer...')
    const customer = await prisma.customer.create({
        data: {
            name: 'Örnek Müşteri A.Ş.',
            email: 'iletisim@ornek-musteri.com',
            phone: '05551234567',
            address: 'Maslak Mah. Eski Büyükdere Cad. No: 1, Sarıyer / İstanbul',
            taxNumber: '1112223334',
            taxOffice: 'Maslak',
            companyId: companyId,
            balance: 15000,
        }
    })
    console.log(`Created customer: ${customer.name}`)

    // 2. Create Demo Supplier
    console.log('Creating demo supplier...')
    const supplier = await prisma.supplier.create({
        data: {
            name: 'Mega Yedek Parça Ltd. Şti.',
            email: 'satis@mega-yedek.com',
            phone: '02129876543',
            address: 'İkitelli OSB, Başakşehir / İstanbul',
            taxNumber: '9998887776',
            taxOffice: 'İkitelli',
            companyId: companyId,
            balance: -5000,
        }
    })
    console.log(`Created supplier: ${supplier.name}`)

    // 3. Create Demo Products
    console.log('Creating demo products...')
    const product1 = await prisma.product.create({
        data: {
            name: 'Tam Sentetik Motor Yağı 5W-30',
            code: 'MY-5W30',
            price: 1250.00,
            buyPrice: 900.00,
            stock: 150,
            salesVat: 20,
            purchaseVat: 20,
            companyId: companyId,
        }
    })

    const product2 = await prisma.product.create({
        data: {
            name: 'Yüksek Performans Fren Balatası',
            code: 'FB-PRO-X',
            price: 850.00,
            buyPrice: 600.00,
            stock: 45,
            salesVat: 20,
            purchaseVat: 20,
            companyId: companyId,
        }
    })
    console.log(`Created products: ${product1.name}, ${product2.name}`)

    // 4. Create Purchase Invoice
    console.log('Creating demo purchase invoice (Alış Faturası)...')
    const purchaseInvoice = await prisma.purchaseInvoice.create({
        data: {
            invoiceNo: `ALIS-${Date.now()}`,
            invoiceDate: new Date(),
            amount: 15000.00,
            taxAmount: 3000.00,
            totalAmount: 18000.00,
            supplierId: supplier.id,
            companyId: companyId,
            status: 'Tamamlandı',
            items: [
                {
                    productId: product1.id,
                    name: product1.name,
                    quantity: 10,
                    unitPrice: product1.buyPrice,
                    totalPrice: Number(product1.buyPrice) * 10,
                    vatRate: product1.purchaseVat
                },
                {
                    productId: product2.id,
                    name: product2.name,
                    quantity: 10,
                    unitPrice: product2.buyPrice,
                    totalPrice: Number(product2.buyPrice) * 10,
                    vatRate: product2.purchaseVat
                }
            ]
        }
    })
    console.log(`Created purchase invoice: ${purchaseInvoice.invoiceNo}`)

    // 5. Create Sales Invoice
    console.log('Creating demo sales invoice (Satış Faturası)...')
    const salesInvoice = await prisma.salesInvoice.create({
        data: {
            invoiceNo: `SATIS-${Date.now()}`,
            invoiceDate: new Date(),
            amount: 4200.00,
            taxAmount: 840.00,
            totalAmount: 5040.00,
            customerId: customer.id,
            companyId: companyId,
            status: 'Ödendi',
            items: [
                {
                    productId: product1.id,
                    name: product1.name,
                    quantity: 2,
                    unitPrice: product1.price,
                    totalPrice: Number(product1.price) * 2,
                    vatRate: product1.salesVat
                },
                {
                    productId: product2.id,
                    name: product2.name,
                    quantity: 2,
                    unitPrice: product2.price,
                    totalPrice: Number(product2.price) * 2,
                    vatRate: product2.salesVat
                }
            ]
        }
    })
    console.log(`Created sales invoice: ${salesInvoice.invoiceNo}`)

    console.log('✨ Demo data seeded successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
