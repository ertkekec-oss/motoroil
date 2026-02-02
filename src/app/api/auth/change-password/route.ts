
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, getSession } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(request: Request) {
    try {
        const { username, oldPassword, newPassword } = await request.json();

        // 1. Session ve Yetki Kontrolü
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
        }

        // Kullanıcı sadece kendi şifresini değiştirebilir (veya admin başkasınınkini değiştirebilir ama bu endpoint self-service için tasarlandı)
        if (session.username !== username) {
            // Ancak Admin'ler başkalarının şifresini değiştirmek isteyebilir. 
            // Şu anki SettingsPage kullanımı: username: currentUser?.username gönderiyor. Yani kişi kendisi.
            // O yüzden bu kontrolü active edebiliriz.
            return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
        }

        if (!username || !oldPassword || !newPassword) {
            return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400 });
        }

        const staff = await prisma.staff.findFirst({
            where: { username }
        });

        if (!staff) {
            return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }

        const isMatch = await comparePassword(oldPassword, staff.password);

        if (!isMatch) {
            return NextResponse.json({ error: 'Mevcut şifreniz hatalı.' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.staff.update({
            where: { id: staff.id },
            data: { password: hashedPassword }
        });

        await logActivity({
            userId: staff.id,
            userName: staff.username,
            action: 'UPDATE',
            entity: 'User',
            entityId: staff.id,
            details: 'Şifre değiştirildi.',
            branch: staff.branch || 'Merkez'
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
