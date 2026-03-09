import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';

export default async function VerifyDocumentPage({ params }: { params: Promise<{ envelopeId: string }> }) {
    const { envelopeId } = await params;

    const envelope = await prisma.signatureEnvelope.findUnique({
        where: { id: envelopeId },
        include: {
            recipients: {
                orderBy: { orderIndex: 'asc' }
            }
        }
    });

    if (!envelope) {
        return notFound();
    }

    const company = envelope.companyId ? await prisma.company.findUnique({
        where: { id: envelope.companyId }
    }) : null;


    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl w-full space-y-8 bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-emerald-500/10">
                        <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white">
                        Periodya Güvenli Doküman Doğrulama
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Bu sayfa, taranan dokümanın güncel imza / onay durumunu Periodya blokzinciri üzerinden doğrulamaktadır.
                    </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 mt-8 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                        <span className="text-sm font-medium text-slate-400">Doküman Başlığı</span>
                        <span className="text-base font-semibold text-white">{envelope.title}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                        <span className="text-sm font-medium text-slate-400">Oluşturan Şirket</span>
                        <span className="text-base font-medium text-white">{company?.name || 'Periodya Network'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                        <span className="text-sm font-medium text-slate-400">Oluşturulma Tarihi</span>
                        <span className="text-base font-medium text-white">
                            {format(new Date(envelope.createdAt), 'dd MMM yyyy HH:mm')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-400">Doküman Durumu</span>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${envelope.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                envelope.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {envelope.status === 'COMPLETED' ? 'İMZALANDI (TAMAMLANDI)' :
                                envelope.status === 'REJECTED' ? 'REDDEDİLDİ' :
                                    'BEKLİYOR (SÜREÇ DEVAM EDİYOR)'}
                        </span>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-medium text-white mb-4">Onay / İmza Zinciri</h3>
                    <div className="space-y-4">
                        {envelope.recipients.map((recipient: any) => (
                            <div key={recipient.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`h-3 w-3 rounded-full 
                                        ${recipient.status === 'SIGNED' ? 'bg-emerald-400' :
                                            recipient.status === 'REJECTED' ? 'bg-red-400' :
                                                'bg-amber-400 animate-pulse'}`}>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">{recipient.name}</p>
                                        <p className="text-xs text-slate-400">{recipient.email} {recipient.phone ? `• ${recipient.phone}` : ''}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md
                                        ${recipient.status === 'SIGNED' ? 'text-emerald-400 bg-emerald-500/10' :
                                            recipient.status === 'REJECTED' ? 'text-red-400 bg-red-500/10' :
                                                'text-amber-400 bg-amber-500/10'}`}>
                                        {recipient.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 mt-8 border-t border-slate-700 text-center">
                    <p className="text-xs text-slate-500">
                        Belge Orijinalliği Periodya Enterprise Security tarafından güvence altındadır.<br />
                        ID: {envelope.id}
                    </p>
                </div>
            </div>
        </div>
    );
}
