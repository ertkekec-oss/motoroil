import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

export default function CustomDomainPanel() {
    const { showSuccess, showError, showConfirm } = useModal();
    const [domain, setDomain] = useState('');
    const [activeDomain, setActiveDomain] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        fetchCurrentDomain();
    }, []);

    const fetchCurrentDomain = async () => {
        setIsFetching(true);
        try {
            const res = await fetch('/api/admin/tenant/domain/my-domain');
            const data = await res.json();
            if (res.ok && data.domain) {
                setActiveDomain(data.domain);
            }
        } catch (error) {
            console.error('Failed to fetch existing domain:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleAddDomain = async () => {
        if (!domain) {
            showError('Hata', 'Lütfen bir alan adı girin (Örn: siparis.firmam.com)');
            return;
        }

        // Basic domain validation
        const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainPattern.test(domain)) {
             showError('Hata', 'Geçersiz alan adı formatı. Sadece harf, rakam ve tire kullanabilirsiniz.');
             return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/tenant/domain/my-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customDomain: domain.toLowerCase() })
            });

            const data = await res.json();
            
            if (res.ok) {
                showSuccess('Başarılı', 'Özel alan adınız başarıyla kaydedildi. Lütfen DNS ayarlarından CNAME yönlendirmenizi (cname.vercel-dns.com) yapmayı unutmayın.');
                setActiveDomain(domain.toLowerCase());
                setDomain('');
            } else {
                showError('Hata', data.error || 'Alan adı eklenemedi.');
            }
        } catch (error) {
            showError('Hata', 'Sunucuya bağlanılamadı.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveDomain = async () => {
        showConfirm('Alan Adını Kaldır', 'Özel B2B alan adınızı kaldırmak istediğinize emin misiniz? Bayileriniz sadece standart adresten erişebilecek.', async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/admin/tenant/domain/my-domain', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customDomain: activeDomain })
                });

                if (res.ok) {
                    showSuccess('Silindi', 'Alan adınız başarıyla kaldırıldı.');
                    setActiveDomain(null);
                } else {
                    const data = await res.json();
                    showError('Hata', data.error || 'Alan adı kaldırılamadı.');
                }
            } catch (error) {
                showError('Hata', 'Sunucuya bağlanılamadı.');
            } finally {
                setIsLoading(false);
            }
        });
    };

    if (isFetching) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3 relative z-10">
                    <Globe className="w-8 h-8 text-indigo-500" />
                    Özel B2B Alan Adı Yönetimi (White-Label)
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl relative z-10">
                    Müşterilerinizin ve bayilerinizin kendi kurumsal kimliğinizle satış sayfanıza ulaşmasını sağlayın. 
                    Satış panelinizi kendi <strong className="text-indigo-500">siparis.firmam.com</strong> tarzı alan adınıza bağlayın.
                </p>

                {activeDomain ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-1">
                                    Aktif Bağlantı
                                </h3>
                                <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    {activeDomain}
                                </div>
                            </div>
                            
                            <button
                                onClick={handleRemoveDomain}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                Bağlantıyı Kes
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-indigo-200/50 dark:border-indigo-800/30">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                Kurulum Tamamlanmadıysa:
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Alan adınızın çalışabilmesi için domain sağlayıcınızın paneline (Örn: GoDaddy, Cloudflare) gidip aşağıdaki <strong>DNS (CNAME)</strong> ayarını eklemeniz gerekmektedir:
                            </p>
                            <div className="flex flex-col gap-2 mt-4">
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm">
                                    <span className="w-24 font-bold text-slate-500 uppercase">TÜR:</span>
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">CNAME</span>
                                </div>
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm">
                                    <span className="w-24 font-bold text-slate-500 uppercase">AD / HOST:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">{activeDomain.split('.')[0]}</span>
                                    <span className="ml-2 text-xs text-slate-400">(veya alt alan adı kullanıyorsanız sadece o kısmı)</span>
                                </div>
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm">
                                    <span className="w-24 font-bold text-slate-500 uppercase">DEĞER:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold select-all">cname.vercel-dns.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Yeni B2B Alan Adınız
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Globe className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="ornek: bayi.sirketim.com"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:font-normal placeholder:text-slate-400"
                                    />
                                </div>
                                <button
                                    onClick={handleAddDomain}
                                    disabled={isLoading || !domain}
                                    className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl whitespace-nowrap transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0 flex items-center justify-center min-w-[160px]"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <Plus className="w-5 h-5 mr-2" /> Bağla
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5 flex gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-amber-900 dark:text-amber-500 mb-1">Önemli Not</h4>
                                <p className="text-sm text-amber-800 dark:text-amber-400/80 leading-relaxed">
                                    Alan adını buraya ekledikten sonra, mutlaka alan adını aldığınız firmanın (GoDaddy, Cloudflare vb.) paneline giderek CNAME kaydı yapmalısınız. Hedef adres daima <strong>cname.vercel-dns.com</strong> olacaktır.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
