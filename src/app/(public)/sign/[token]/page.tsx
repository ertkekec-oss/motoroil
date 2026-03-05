import crypto from 'crypto';
import { fetchSession, verifyOtp, submitSignature } from '@/actions/contracts/publicSigning';
import { EnterpriseCard, EnterpriseButton } from '@/components/ui/enterprise';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function PublicSigningPage({ params }: { params: { token: string } }) {
    const rawToken = params.token;
    const publicTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = await fetchSession(publicTokenHash);

    if (!session) {
        return <div className="p-8 text-center text-red-500 font-bold">Geçersiz veya iptal edilmiş bir bağlantı.</div>;
    }

    if (session.expired) {
        return <div className="p-8 text-center text-red-500 font-bold">Bu bağlantının geçerlilik süresi dolmuş. Lütfen sözleşmeyi gönderen taraf ile iletişime geçin.</div>;
    }

    const recipient = session.recipient;
    const document = recipient.envelope.document;

    // Actions
    const handleVerifyOtp = async (formData: FormData) => {
        "use server";
        const code = formData.get('otpCode') as string;
        await verifyOtp(publicTokenHash, code);
        revalidatePath(`/sign/${params.token}`);
    };

    const handleSign = async () => {
        "use server";
        await submitSignature(publicTokenHash);
        revalidatePath(`/sign/${params.token}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
                <EnterpriseCard className="shadow-2xl border-0 ring-1 ring-slate-200 dark:ring-slate-800">
                    <h2 className="text-xl font-bold mb-6 text-center">Sözleşme İmzası: {document.subject}</h2>
                    <div className="mb-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Alıcı Bilgileri</h4>
                                <p className="text-base font-medium">{recipient.name} ({recipient.email})</p>
                                <p className="text-sm text-slate-500">Durum: <span className="ml-2 inline-flex px-2 py-1 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 rounded-full font-mono text-xs">{recipient.status}</span></p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Son Geçerlilik</h4>
                                <p className="text-sm">{new Date(session.expiresAt).toLocaleString('tr-TR')}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-black p-6 rounded-lg min-h-[300px] border">
                            {/* Döküman gövdesi (MVP: Sadece snapshot uyarısı) */}
                            <h2 className="text-lg font-bold mb-4">{document.subject}</h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Sözleşme içeriği burada görüntülenecektir (PDF Viewer veya HTML Renderer).
                            </p>
                            {/* TODO PROMPT 02: render_pdf endpointinden pdf göster */}
                        </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl space-y-4">
                        {recipient.status === 'SIGNED' ? (
                            <div className="text-center p-4">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">✓</div>
                                <h3 className="text-lg font-bold text-green-700">Başarıyla İmzalandı</h3>
                                <p className="text-sm text-slate-600 mt-2">Bu belgeyi başarıyla onayladınız. Tüm taraflar imzaladığında size bir kopya iletilecektir.</p>
                            </div>
                        ) : recipient.authMethod !== 'NONE' && recipient.status !== 'OTP_VERIFIED' ? (
                            <form action={handleVerifyOtp} className="flex flex-col gap-4 max-w-sm mx-auto">
                                <div className="text-center text-sm font-medium">Lütfen cihazınıza gönderilen onay kodunu girin.</div>
                                <input type="text" name="otpCode" className="block w-full rounded-md border-0 py-2.5 text-center text-lg shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-base sm:leading-6 dark:bg-slate-900 dark:text-white" placeholder="000000" required />
                                <EnterpriseButton type="submit" variant="primary" className="w-full justify-center">Kodu Doğrula</EnterpriseButton>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-4 text-center">
                                <p className="text-sm text-slate-600">Bu sözleşmenin tüm şartlarını okuduğumu ve yasal olarak onayladığımı kabul ediyorum.</p>
                                <form action={handleSign}>
                                    <EnterpriseButton type="submit" variant="primary" className="w-full justify-center text-lg py-4">Bu Belgeyi İmzala / Onayla</EnterpriseButton>
                                </form>
                            </div>
                        )}
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
}
