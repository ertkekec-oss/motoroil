import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';


import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');

    // Strict Tenant Isolation for GET
    const user = auth.user;
    const isPlatformAdmin = user.tenantId === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN';
    const effectiveTenantId = user.impersonateTenantId || user.tenantId;

    const where: any = {
        deletedAt: null
    };

    // If not platform admin, or if platform admin is impersonating, filter by tenant
    if (!isPlatformAdmin || user.impersonateTenantId) {
        where.tenantId = effectiveTenantId;
    }

    if (branch && branch !== 'all') {
        where.branch = branch;
    }

    try {
        const staff = await prisma.staff.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        // Ensure salary is number
        const formattedStaff = staff.map(s => ({
            ...s,
            salary: s.salary ? Number(s.salary) : 0
        }));

        return NextResponse.json({ success: true, staff: formattedStaff });
    } catch (error: any) {
        console.error('[Staff API GET Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            name, role, salary, branch, phone, email, type, username, companyId,
            password, birthDate, maritalStatus, bloodType, militaryStatus, reference,
            hasDriverLicense, educationLevel, city, district, relativeName,
            relativePhone, healthReport, certificate, notes, address
        } = body;

        // Basic validation
        if (!name) return NextResponse.json({ success: false, error: 'İsim zorunludur' }, { status: 400 });

        const user = auth.user;
        const effectiveTenantId = user.impersonateTenantId || user.tenantId || 'PLATFORM_ADMIN';

        // Username generation logic
        let finalUsername = username;
        if (!finalUsername) {
            // If email is provided, check if it's already taken as a username
            if (email) {
                const existing = await prisma.staff.findUnique({ where: { username: email } });
                finalUsername = existing ? `user_${Date.now()}` : email;
            } else {
                finalUsername = `user_${Date.now()}`;
            }
        }

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const newStaff = await prisma.staff.create({
            data: {
                username: finalUsername,
                password: hashedPassword,
                name,
                phone,
                role: role || 'Personel',
                salary: salary ? Number(salary) : 17002,
                branch: branch || 'Merkez',
                email,
                type: type || 'service',
                tenantId: effectiveTenantId,
                companyId: companyId || user.companyId,
                address,
                city,
                district,
                birthDate: birthDate ? new Date(birthDate) : null,
                maritalStatus,
                bloodType,
                militaryStatus,
                educationLevel,
                hasDriverLicense: !!hasDriverLicense,
                reference,
                relativeName,
                relativePhone,
                healthReport,
                certificate,
                notes
            }
        });

        // Send welcome email with login details if email exists
        if (email) {
            try {
                await sendMail({
                    to: email,
                    subject: 'Periodya - Giriş Bilgileriniz',
                    companyId: user.companyId!,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #6366f1;">Periodya Sistemine Hoş Geldiniz!</h2>
                            <p>Merhaba <strong>${name}</strong>,</p>
                            <p>Personel kaydınız başarıyla oluşturulmuştur. Sisteme giriş yapmak için aşağıdaki bilgileri kullanabilirsiniz:</p>
                            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Giriş Linki:</strong> <a href="https://periodya.com/login">periodya.com/login</a></p>
                                <p style="margin: 5px 0;"><strong>Kullanıcı Adı:</strong> ${finalUsername}</p>
                                ${password ? `<p style="margin: 5px 0;"><strong>Şifre:</strong> ${password}</p>` : '<p style="margin: 5px 0; color: #666;"><em>Şifreniz önceden belirlenmiştir.</em></p>'}
                            </div>
                            <p>Güvenliğiniz için sisteme giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 12px; color: #9ca3af;">Bu e-posta otomodik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
                        </div>
                    `
                });
                console.log(`[Staff API] Welcome email sent to ${email}`);
            } catch (mailError) {
                console.error('[Staff API Mail Error]:', mailError);
                // We don't fail the whole request if mail fails
            }
        }

        return NextResponse.json({ success: true, staff: newStaff });
    } catch (error: any) {
        console.error('[Staff API POST Error]:', error);

        // Handle Unique Constraint (already exists)
        if (error.code === 'P2002') {
            return NextResponse.json({
                success: false,
                error: 'Bu kullanıcı adı veya e-posta adresi zaten kullanımda.'
            }, { status: 400 });
        }

        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'ID zorunludur' }, { status: 400 });

        const user = auth.user;
        const isPlatformAdmin = user.tenantId === 'PLATFORM_ADMIN' || user.role === 'SUPER_ADMIN';

        // Soft delete
        await prisma.staff.update({
            where: {
                id,
                // Security: Ensure user belongs to same tenant unless platform admin
                tenantId: isPlatformAdmin ? undefined : user.tenantId
            },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Staff API DELETE Error]:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            id, name, email, phone, role, salary, branch, type,
            birthDate, maritalStatus, bloodType, militaryStatus, reference,
            hasDriverLicense, educationLevel, city, district, relativeName,
            relativePhone, healthReport, certificate, notes, address
        } = body;

        if (!id) return NextResponse.json({ success: false, error: 'ID zorunludur' }, { status: 400 });

        const updateData: any = {
            name, email, phone, role, branch, type,
            maritalStatus, bloodType, militaryStatus, reference,
            educationLevel, city, district, relativeName,
            relativePhone, healthReport, certificate, notes, address,
            hasDriverLicense: hasDriverLicense !== undefined ? !!hasDriverLicense : undefined
        };

        if (salary !== undefined) updateData.salary = parseFloat(salary);
        if (birthDate) updateData.birthDate = new Date(birthDate);

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, staff: updatedStaff });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
