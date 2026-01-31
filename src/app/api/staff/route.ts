import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
import { getSession, hasPermission, hashPassword } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        const staff = await prisma.staff.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(staff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'staff_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const data = await request.json();

        // 1. Generate Credentials
        const generatedPassword = Math.random().toString(36).slice(-8); // Random 8 chars
        const baseUsername = data.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const username = data.username || `${baseUsername}_${Math.floor(Math.random() * 1000)}`;

        // 2. Real Email Sending
        if (data.email) {
            const htmlPoints = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">MotorOil Sistemine Hoşgeldiniz! 👋</h2>
                    <p>Sayın <b>${data.name}</b>,</p>
                    <p>Sizin için bir personel hesabı oluşturuldu. Aşağıdaki bilgilerle sisteme giriş yapabilirsiniz:</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;">👤 <b>Kullanıcı Adı:</b> ${username}</p>
                        <p style="margin: 5px 0;">🔑 <b>Şifre:</b> ${generatedPassword}</p>
                        <p style="margin: 5px 0;">🏢 <b>Şube:</b> ${data.branch}</p>
                    </div>
                    <p style="font-size: 12px; color: #666;">Şifrenizi giriş yaptıktan sonra değiştirebilirsiniz.</p>
                </div>
            `;

            // Send asynchronously
            sendMail({
                to: data.email,
                subject: 'MotorOil - Giriş Bilgileriniz',
                html: htmlPoints,
                text: `Kullanıcı Adı: ${username} | Şifre: ${generatedPassword} | Şube: ${data.branch}`
            }).catch(e => console.error("Mail gönderilemedi:", e));
        }

        const hashedPassword = await hashPassword(generatedPassword);

        const staff = await prisma.staff.create({
            data: {
                username: username,
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role,
                branch: data.branch,
                type: data.type || 'office',
                status: data.status || 'Boşta',
                permissions: data.permissions || [],
                // Additional Fields
                age: data.age ? parseInt(data.age) : null,
                address: data.address || null,
                salary: data.salary ? parseFloat(data.salary) : 17002,
            }
        });
        return NextResponse.json(staff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'staff_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const data = await request.json();
        const { id, ...updateData } = data;

        // Parse types if necessary
        if (updateData.age) updateData.age = parseInt(updateData.age);
        if (updateData.salary) updateData.salary = parseFloat(updateData.salary);

        // If password is being updated, hash it
        if (updateData.password && !updateData.password.startsWith('$2')) {
            updateData.password = await hashPassword(updateData.password);
        }

        const staff = await prisma.staff.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(staff);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });

        if (!hasPermission(session, 'staff_manage')) {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.staff.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
