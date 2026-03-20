"use client";
import Link from "next/link";

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F7F9] text-slate-800 font-sans p-6 text-center">
            <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200/60 max-w-lg w-full">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center border-4 border-white shadow-sm mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-[#1F3A5F] mb-3">Erişim Reddedildi</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Bu sayfayı görüntülemek veya bu işlemi yapmak için yetkiniz bulunmuyor. Şirket yöneticinize başvurarak {`'Network'`} veya ilgili yetki rollerini talep edebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/" className="px-6 py-3 bg-[#1F3A5F] hover:bg-[#152a45] text-white font-bold rounded-lg transition-colors shadow-md">
                        Ana Sayfaya Dön
                    </Link>
                    <button onClick={() => window.history.back()} className="px-6 py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-bold rounded-lg transition-colors">
                        Geri Git
                    </button>
                </div>
            </div>
            <p className="mt-8 text-sm text-slate-400 font-medium tracking-wide">
                HTTP 403 • PERIODY∆ ENTERPRISE
            </p>
        </div>
    );
}
