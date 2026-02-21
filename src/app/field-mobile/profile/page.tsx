
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MobileProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <div className="p-4 space-y-8 pb-20">
            <div className="text-center pt-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/20 mb-4">
                    👤
                </div>
                <h1 className="text-2xl font-black text-white">{user?.name}</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{user?.role || 'Saha Personeli'}</p>
            </div>

            <div className="space-y-3">
                <div className="bg-[#161b22] border border-white/5 p-4 rounded-2xl flex justify-between items-center transition-all active:bg-white/5">
                    <div className="text-sm font-bold text-gray-400">Şirket</div>
                    <div className="text-sm font-black text-white">Periodya ERP</div>
                </div>
                <div className="bg-[#161b22] border border-white/5 p-4 rounded-2xl flex justify-between items-center transition-all active:bg-white/5">
                    <div className="text-sm font-bold text-gray-400">E-Posta</div>
                    <div className="text-sm font-black text-white">{user?.email}</div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <button
                    onClick={() => router.push('/(app)')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                    🖥️ MASAÜSTÜ GÖRÜNÜMÜNE GEÇ
                </button>
                <button
                    onClick={logout}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                    🔚 GÜVENLİ ÇIKIŞ
                </button>
            </div>

            <div className="text-center text-[10px] text-gray-600 font-bold tracking-widest uppercase">
                PERIODYA FIELD v3.0
            </div>
        </div>
    );
}
