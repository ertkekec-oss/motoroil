"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { TURKISH_CITIES, TURKISH_DISTRICTS } from '@/lib/constants';
import { EnterpriseCard, EnterpriseInput, EnterpriseSelect, EnterpriseButton } from '@/components/ui/enterprise';
import { Building2, Store, Wallet, Users, LayoutDashboard, BrainCircuit, Rocket } from 'lucide-react';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showSuccess, showError } = useModal();
    const { updateUser } = useAuth();

    // Form States
    const [companyData, setCompanyData] = useState({
        name: '',
        slogan: '',
        vkn: '',
        taxOffice: '',
        address: '',
        city: 'İstanbul',
        district: '',
        email: '',
        website: '',
        phone: ''
    });

    const [branchData, setBranchData] = useState({
        branchName: 'Merkez Şube',
        warehouseName: 'Ana Depo'
    });

    const [financeData, setFinanceData] = useState({
        createDefaultKasa: true,
        createDefaultBank: true,
        kasaName: 'Merkez Nakit Kasası',
        bankName: 'Ana Banka Hesabı (TL)'
    });

    const [staffData, setStaffData] = useState({
        createStaff: false,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'Kasiyer'
    });

    const STEPS = [
        { id: 1, label: 'Firma Profili', icon: Building2 },
        { id: 2, label: 'Şube & Depo', icon: Store },
        { id: 3, label: 'Kasalar', icon: Wallet },
        { id: 4, label: 'Personel', icon: Users },
        { id: 5, label: 'Veri Aktarımı', icon: BrainCircuit },
    ];

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleComplete = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: companyData,
                    branch: branchData,
                    finance: financeData,
                    staff: staffData.createStaff ? staffData : null
                })
            });

            const result = await res.json();
            if (result.success) {
                updateUser({ setupState: 'COMPLETED' });
                showSuccess('Başarılı', 'Altyapı hazırlandı! Akıllı veri aktarıcısına yönlendiriliyorsunuz...');
                setTimeout(() => {
                    // Redirect to the new dat aimport page for the 5th step
                    router.push(result.redirect || '/data-import');
                }, 1500);
            } else {
                showError('Hata', result.error || 'Bir hata oluştu');
            }
        } catch (error) {
            showError('Hata', 'Sunucuya bağlanılamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-4 pb-32 relative overflow-x-hidden overflow-y-auto font-outfit">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-4xl mx-auto mt-6 md:mt-12 animate-in fade-in zoom-in-95 duration-500 relative z-10">

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 transform rotate-3">
                        <Rocket className="w-8 h-8 text-white -rotate-3" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Periodya&apos;ya Hoş Geldiniz
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">
                        İşletmenizin omurgasını kurmak için 5 hızlı adım.
                    </p>
                </div>

                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10 rounded-full" />
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500"
                        style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((s, i) => {
                        const isActive = step === s.id;
                        const isPassed = step > s.id;
                        const Icon = s.icon;

                        return (
                            <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-[#0f172a] px-2">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300 relative border-2
                                    ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-110' :
                                        isPassed ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider hidden md:block ${isActive ? 'text-blue-600' : isPassed ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <EnterpriseCard className="p-8 md:p-12 shadow-2xl border-0 ring-1 ring-slate-200 dark:ring-slate-800/50 bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-xl">

                    {/* STEP 1: FİRMA PROFİLİ */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                                    <Building2 className="text-blue-500" /> Firma Profili
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Resmi belgelerde ve e-Fatura süreçlerinde kullanılacak temel bilgileriniz.</p>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm border border-blue-100 dark:border-blue-900/50 flex gap-3">
                                    <span className="text-xl">💡</span> <strong>İpucu:</strong> Vergi numaranızı doğru girdiğinizden emin olun, e-Fatura paneli buna göre aktive edilecektir.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <EnterpriseInput label="Firma Ünvanı / Adı *" value={companyData.name} onChange={e => setCompanyData({ ...companyData, name: e.target.value })} placeholder="Örn: Periodya Teknoloji A.Ş." />
                                <EnterpriseInput label="Slogan (Fatura/Fiş Altı)" value={companyData.slogan} onChange={e => setCompanyData({ ...companyData, slogan: e.target.value })} placeholder="Müşterilerinize iletmek istediğiniz not..." />

                                <EnterpriseInput label="VKN / TCKN *" value={companyData.vkn} onChange={e => setCompanyData({ ...companyData, vkn: e.target.value.replace(/[^0-9]/g, '').slice(0, 11) })} placeholder="10 veya 11 Haneli Vergi No" />
                                <EnterpriseInput label="Vergi Dairesi" value={companyData.taxOffice} onChange={e => setCompanyData({ ...companyData, taxOffice: e.target.value })} placeholder="Örn: Zincirlikuyu VD" />

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">İl</label>
                                    <EnterpriseSelect value={companyData.city} onChange={e => setCompanyData({ ...companyData, city: e.target.value, district: '' })}>
                                        {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </EnterpriseSelect>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">İlçe</label>
                                    <EnterpriseSelect value={companyData.district} onChange={e => setCompanyData({ ...companyData, district: e.target.value })} disabled={!companyData.city}>
                                        <option value="">İlçe Seçin</option>
                                        {(TURKISH_DISTRICTS[companyData.city] || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
                                    </EnterpriseSelect>
                                </div>
                            </div>

                            <EnterpriseInput label="Açık Adres" value={companyData.address} onChange={e => setCompanyData({ ...companyData, address: e.target.value })} placeholder="Mahalle, sokak, kapı no..." />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <EnterpriseInput label="Şirket E-Posta" type="email" value={companyData.email} onChange={e => setCompanyData({ ...companyData, email: e.target.value })} placeholder="info@..." />
                                <EnterpriseInput label="Telefon" value={companyData.phone} onChange={e => setCompanyData({ ...companyData, phone: e.target.value })} placeholder="+90..." />
                                <EnterpriseInput label="Web Sitesi" value={companyData.website} onChange={e => setCompanyData({ ...companyData, website: e.target.value })} placeholder="www..." />
                            </div>

                            <div className="flex justify-end pt-6">
                                <EnterpriseButton onClick={handleNext} disabled={!companyData.name || !companyData.vkn || companyData.vkn.length < 10}>
                                    Devam Et
                                </EnterpriseButton>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ŞUBE & DEPO */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                                    <Store className="text-blue-500" /> Şube ve Depo Tanımları
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">İlk kayıtlarınızın otomatik olarak yapılacağı ana nokta.</p>
                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm border border-amber-100 dark:border-amber-900/50 flex gap-3">
                                    <span className="text-xl">⚠️</span> <strong>Dikkate Alın:</strong> İşiniz tek bir konumda olsa bile "Merkez Şube" ve "Ana Depo" olarak varsayılan bir yapıyı sistem otomatik olarak kullanır. Sonradan istediğiniz kadar şube ekleyebilirsiniz.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <Store className="w-8 h-8 text-slate-400 mb-4" />
                                    <EnterpriseInput label="Ana Şube Adı" value={branchData.branchName} onChange={e => setBranchData({ ...branchData, branchName: e.target.value })} />
                                    <p className="text-xs text-slate-500 mt-2">Satışlarınız, faturalarınız ve personelleriniz başlangıçta bu şubeye kaydedilecektir.</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <Package className="w-8 h-8 text-slate-400 mb-4" />
                                    <EnterpriseInput label="Ana Depo Adı" value={branchData.warehouseName} onChange={e => setBranchData({ ...branchData, warehouseName: e.target.value })} />
                                    <p className="text-xs text-slate-500 mt-2">İçeri aktarılacak tüm stoklar ilk olarak bu ana depo üzerinden işlem görecektir.</p>
                                </div>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                                <EnterpriseButton variant="secondary" onClick={handlePrev}>Geri</EnterpriseButton>
                                <EnterpriseButton onClick={handleNext} disabled={!branchData.branchName || !branchData.warehouseName}>Devam Et</EnterpriseButton>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: KASALAR */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                                    <Wallet className="text-blue-500" /> İlk Kasa ve Bankalar
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Satış tahsilatlarının akacağı hesapları şimdi hızlıca oluşturalım.</p>
                                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm border border-emerald-100 dark:border-emerald-900/50 flex gap-3">
                                    <span className="text-xl">💳</span> <strong>Küçük İpucu:</strong> Eğer online banka/pos entegrasyonu yapacaksanız, sanal pos paralarınızın birikeceği ayrı bir kasa da açabileceksiniz (Şu an sadece temel olanları seçin).
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 items-center ${financeData.createDefaultKasa ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800'}`} onClick={() => setFinanceData({ ...financeData, createDefaultKasa: !financeData.createDefaultKasa })}>
                                    <input type="checkbox" checked={financeData.createDefaultKasa} readOnly className="w-5 h-5 text-blue-600 rounded" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">Nakit Kasası Kur</h3>
                                        <p className="text-slate-500 text-sm mt-1">Nakit ve POS harici günlük satışlar buraya akar.</p>
                                    </div>
                                    <div className="w-1/3" onClick={e => e.stopPropagation()}>
                                        <EnterpriseInput label="" placeholder="Merkez Nakit Kasası" value={financeData.kasaName} onChange={e => setFinanceData({ ...financeData, kasaName: e.target.value })} disabled={!financeData.createDefaultKasa} />
                                    </div>
                                </div>

                                <div className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 items-center ${financeData.createDefaultBank ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800'}`} onClick={() => setFinanceData({ ...financeData, createDefaultBank: !financeData.createDefaultBank })}>
                                    <input type="checkbox" checked={financeData.createDefaultBank} readOnly className="w-5 h-5 text-blue-600 rounded" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">Banka Hesabı Kur</h3>
                                        <p className="text-slate-500 text-sm mt-1">Havale/EFT ve kredi kartı alacakları bu hesaptan izlenir.</p>
                                    </div>
                                    <div className="w-1/3" onClick={e => e.stopPropagation()}>
                                        <EnterpriseInput label="" placeholder="Ana Banka Hesabı" value={financeData.bankName} onChange={e => setFinanceData({ ...financeData, bankName: e.target.value })} disabled={!financeData.createDefaultBank} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                                <EnterpriseButton variant="secondary" onClick={handlePrev}>Geri</EnterpriseButton>
                                <EnterpriseButton onClick={handleNext}>Devam Et</EnterpriseButton>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: PERSONEL */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                                    <Users className="text-blue-500" /> Personel / Kasiyer
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Sisteme ve POS ekranına ilk girişi yapacak olan personelinizi belirleyin (Opsiyonel).</p>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm border border-blue-100 dark:border-blue-900/50 flex gap-3">
                                    <span className="text-xl">👩‍💼</span> <strong>Yönetici Hesabı:</strong> Kendi ana hesabınız her zaman "Yönetici" yetkisine sahiptir. Burada sadece Terminal'de çalışacak birini ekleyebilirsiniz. İstemezseniz direkt geçin.
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                                <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300" checked={staffData.createStaff} onChange={(e) => setStaffData({ ...staffData, createStaff: e.target.checked })} />
                                <span className="font-bold">Yeni bir personel hesabı oluşturmak istiyorum</span>
                            </label>

                            {staffData.createStaff && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-2 border-blue-100 dark:border-blue-900/40 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 animate-in slide-in-from-top-4">
                                    <EnterpriseInput label="Ad *" value={staffData.firstName} onChange={e => setStaffData({ ...staffData, firstName: e.target.value })} placeholder="Ali" />
                                    <EnterpriseInput label="Soyad" value={staffData.lastName} onChange={e => setStaffData({ ...staffData, lastName: e.target.value })} placeholder="Yılmaz" />
                                    <EnterpriseInput label="E-Posta (Şifre Yenileme İçin)" type="email" value={staffData.email} onChange={e => setStaffData({ ...staffData, email: e.target.value })} placeholder="ali@firma.com" />
                                    <EnterpriseInput label="Telefon" value={staffData.phone} onChange={e => setStaffData({ ...staffData, phone: e.target.value })} placeholder="05..." />
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Rol / Yetki</label>
                                        <EnterpriseSelect value={staffData.role} onChange={e => setStaffData({ ...staffData, role: e.target.value })}>
                                            <option value="Kasiyer">Sadece Kasa / Terminal Yetkisi (Kasiyer)</option>
                                            <option value="Mağaza Müdürü">Şube Yönetimi (Mağaza Müdürü)</option>
                                            <option value="Depo Uzmanı">Sadece Stok Yönetimi (Depo Sorumlusu)</option>
                                        </EnterpriseSelect>
                                        <p className="text-xs text-slate-400 mt-2">Not: İlk parola &quot;123456&quot; ve 4 haneli PIN rastgele olarak atanır, Settings &gt; Personel alanından izleyebilirsiniz.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                                <EnterpriseButton variant="secondary" onClick={handlePrev}>Geri</EnterpriseButton>
                                <EnterpriseButton onClick={handleNext} disabled={staffData.createStaff && !staffData.firstName}>Devam Et</EnterpriseButton>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: İÇE AKTARMA */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 text-center py-6">

                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/40">
                                <BrainCircuit className="w-12 h-12 text-white animate-pulse" />
                            </div>

                            <h2 className="text-3xl font-black mb-4">Her Şey Hazır. Şimdi Verilerinizi Alalım!</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
                                Sisteminizin altyapısı kuruldu. Excel tablolarınızdaki müşteri, tedarikçi ve ürün verilerinizi <strong className="text-indigo-500">Yapay Zeka Destekli</strong> içe aktarma motorumuzla tek tıklamayla sisteme dahil edeceğiz.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="text-2xl mb-2">🤖</div>
                                    <h4 className="font-bold text-sm">Akıllı Eşleştirme</h4>
                                    <p className="text-xs text-slate-500">Sütun başlıklarını otomatik tespit eder.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="text-2xl mb-2">⚖️</div>
                                    <h4 className="font-bold text-sm">Bakiye Koruma</h4>
                                    <p className="text-xs text-slate-500">Mevcut cari bakiyelerinizi açılış fişiyle kayıt altına alır.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="text-2xl mb-2">🛡️</div>
                                    <h4 className="font-bold text-sm">Güvenli Geçiş</h4>
                                    <p className="text-xs text-slate-500">Hata durumunda tüm işlemi anında iptal eder, veri kirliliğini önler.</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <EnterpriseButton variant="secondary" onClick={handlePrev} disabled={loading}>Geri Dön</EnterpriseButton>
                                <EnterpriseButton onClick={handleComplete} disabled={loading} className="px-8 flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    {loading ? 'Altyapı Kaydediliyor...' : 'Kaydet ve Verileri Aktarmaya Başla'} <Rocket className="w-5 h-5" />
                                </EnterpriseButton>
                            </div>
                        </div>
                    )}
                </EnterpriseCard>
            </div>
        </div>
    );
}

// Ignore unused icon warning
function Package(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
}
