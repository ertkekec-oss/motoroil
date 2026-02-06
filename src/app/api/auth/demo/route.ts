
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST() {
    try {
        // 1. Check if demo user exists
        let demoStaff = await (prisma as any).staff.findUnique({
            where: { username: 'demo_user' }
        });

        if (!demoStaff) {
            const hashedPassword = await bcrypt.hash('demo1234', 10);

            // Create Demo Staff
            demoStaff = await (prisma as any).staff.create({
                data: {
                    username: 'demo_user',
                    password: hashedPassword,
                    name: 'Demo Kullanıcı',
                    role: 'Admin',
                    branch: 'Merkez',
                    permissions: ['*'],
                    status: 'Aktif'
                }
            });

            // Create Demo Branch if not exists
            const branch = await (prisma as any).branch.findFirst({
                where: { name: 'Merkez' }
            });
            if (!branch) {
                await (prisma as any).branch.create({
                    data: { name: 'Merkez', status: 'Active', type: 'Merkez' }
                });
            }

            // Seed sample data
            await seedDemoData();
        }

        // 2. Create session
        await createSession(demoStaff);

        return NextResponse.json({
            id: demoStaff.id,
            username: demoStaff.username,
            role: demoStaff.role,
            branch: demoStaff.branch,
            name: demoStaff.name,
            permissions: demoStaff.permissions
        });

    } catch (error: any) {
        console.error('Demo Auth Error:', error);
        return NextResponse.json({ error: 'Demo girişi başarısız: ' + error.message }, { status: 500 });
    }
}

async function seedDemoData() {
    // Seed some products
    const products = [
        { name: 'Motor Yağı 5W-30', code: 'MY001', barcode: '869001', price: 1250, stock: 45, category: 'Yağlar', buyPrice: 850 },
        { name: 'Hava Filtresi Focus', code: 'HF001', barcode: '869002', price: 450, stock: 12, category: 'Filtreler', buyPrice: 200 },
        { name: 'Fren Balatası Takım', code: 'FB001', barcode: '869003', price: 2100, stock: 8, category: 'Fren Grubu', buyPrice: 1300 }
    ];

    for (const p of products) {
        await (prisma as any).product.create({
            data: {
                ...p,
                branch: 'Merkez'
            }
        }).catch(() => { });
    }

    // Seed some customers
    await (prisma as any).customer.create({
        data: {
            name: 'Örnek Müşteri Ltd.',
            balance: 5000,
            branch: 'Merkez'
        }
    }).catch(() => { });

    // Create a Kasa
    await (prisma as any).kasa.create({
        data: {
            name: 'Merkez Nakit Kasa',
            type: 'Nakit',
            balance: 25000,
            branch: 'Merkez'
        }
    }).catch(() => { });
}
