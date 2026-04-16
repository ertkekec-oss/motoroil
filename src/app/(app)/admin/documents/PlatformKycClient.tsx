'use client';

import { useState, useEffect } from 'react';
import { FileText, ShieldCheck, FileSignature, CheckCircle, XCircle, Clock, Link as LinkIcon, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useModal } from '@/contexts/ModalContext';

export default function PlatformKycClient() {
    const { showPrompt } = useModal();
    const [activeTab, setActiveTab] = useState<'rules' | 'submissions' | 'signatures'>('rules');

    const [requirements, setRequirements] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [signatures, setSignatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, conRes, subRes] = await Promise.all([
                fetch('/api/admin/kyc/requirements'),
                fetch('/api/admin/kyc/contracts'),
                fetch('/api/admin/kyc/submissions')
            ]);
            
            const reqData = await reqRes.json();
            if (reqData.success) setRequirements(reqData.requirements);

            const conData = await conRes.json();
            if (conData.success) setContracts(conData.contracts);

            const subData = await subRes.json();
            if (subData.success) {
                setSubmissions(subData.submissions);
                setSignatures(subData.signatures);
            }
        } catch (error) {
            console.error('Fetch data failed', error);
            toast.error('Veriler yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [showRuleModal, setShowRuleModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    const [ruleForm, setRuleForm] = useState({
        moduleId: 'EFATURA',
        name: '',
        description: '',
        type: 'DOCUMENT',
        contractId: '',
        validityMonths: '12',
    });

    const [contractForm, setContractForm] = useState({
        title: '',
        slug: '',
        content: ''
    });

    const saveRule = async () => {
        try {
            const res = await fetch('/api/admin/kyc/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleForm)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Kural başarıyla eklendi.');
                setShowRuleModal(false);
                fetchData();
            } else throw new Error(data.error);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const saveContract = async () => {
        try {
            const res = await fetch('/api/admin/kyc/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contractForm)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Sözleşme başarıyla kaydedildi.');
                setShowContractModal(false);
                fetchData();
            } else throw new Error(data.error);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const reviewSubmission = async (id: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'REJECT') {
            showPrompt('Başvuruyu Reddet', 'Reddetme sebebini yazınız (Kullanıcıya gösterilecek):', async (reason) => {
                if (!reason) return;
                try {
                    const res = await fetch(`/api/admin/kyc/submissions/${id}/review`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action, reason })
                    });
                    const data = await res.json();
                    if (data.success) {
                        toast.success(`Başvuru reddedildi.`);
                        fetchData();
                    } else throw new Error(data.error);
                } catch (e: any) {
                    toast.error(e.message);
                }
            });
            return;
        }

        try {
            const res = await fetch(`/api/admin/kyc/submissions/${id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason: '' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Başvuru onaylandı.`);
                fetchData();
            } else throw new Error(data.error);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-white">
            <header className="py-2 border-b border-white/10 flex items-center justify-between shrink-0 mb-4">
                <div>
                    <h2 className="text-xl font-bold">Risk, KYC ve Modül Başvuruları</h2>
                    <p className="text-sm text-slate-400 mt-1">Özel yetki veya evrak gerektiren modüller (Ödeal, E-Fatura vb.) için kullanıcı evrak onayları.</p>
                </div>
                <button onClick={fetchData} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition">
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit mb-6">
                <button onClick={() => setActiveTab('rules')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'rules' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    📚 Modül Kuralları
                </button>
                <button onClick={() => setActiveTab('submissions')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'submissions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    📋 Başvuru / Evrak Havuzu
                </button>
                <button onClick={() => setActiveTab('signatures')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'signatures' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                    ✒️ Sistem Sözleşme Havuzu
                </button>
            </div>

            <div className="flex-1 pb-6">
                {activeTab === 'rules' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Kurallar Tablosu */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center xl"><ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" /> Aktif Onay Kuralları (Gatekeeper)</h3>
                                <button onClick={() => setShowRuleModal(true)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-bold transition">Yeni Kural</button>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-800/50 text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Modül</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">İstenen Doküman</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Tip</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Geçerlilik</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {requirements.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-800/30 transition">
                                                <td className="px-5 py-3 font-bold text-white">{req.moduleId}</td>
                                                <td className="px-5 py-3">
                                                    <div className="font-semibold">{req.name}</div>
                                                    <div className="text-slate-400 text-xs mt-0.5">{req.description}</div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    {req.type === 'DOCUMENT' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                                                            <FileText className="w-3.5 h-3.5" /> PDF/Dosya
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">
                                                            <FileSignature className="w-3.5 h-3.5" /> E-İmza ({req.contract?.title || req.contract?.slug})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-slate-300">
                                                    {req.validityMonths ? `${req.validityMonths} Ay` : 'Süresiz'}
                                                </td>
                                            </tr>
                                        ))}
                                        {requirements.length === 0 && (
                                            <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500">Kayıtlı kural yok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Dinamik Sözleşmeler */}
                        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mt-6">
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center xl"><FileSignature className="w-5 h-5 mr-2 text-blue-400" /> Dinamik Sözleşme Metinleri</h3>
                                <button onClick={() => setShowContractModal(true)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm font-bold transition">Metin Ekle</button>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-800/50 text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Sözleşme Adı</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Slug</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Versiyon</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {contracts.map((con) => (
                                            <tr key={con.id} className="hover:bg-slate-800/30 transition">
                                                <td className="px-5 py-3 font-bold text-white">{con.title}</td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">{con.slug}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white font-bold text-xs">v{con.version}</span>
                                                </td>
                                                <td className="px-5 py-3 text-slate-400 font-medium">
                                                    {new Date(con.createdAt).toLocaleDateString('tr-TR')}
                                                </td>
                                            </tr>
                                        ))}
                                        {contracts.length === 0 && (
                                            <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500">Kayıtlı metin yok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'submissions' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {submissions.map(sub => (
                            <div key={sub.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sub.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                                        sub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                            sub.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {sub.status === 'PENDING' ? <Clock className="w-5 h-5" /> :
                                            sub.status === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> :
                                                sub.status === 'REJECTED' ? <XCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub.requirement?.moduleId}</p>
                                        <h4 className="text-base font-bold mt-0.5 text-white">{sub.requirement?.name}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                                            <span>Firma: <strong className="text-white">{sub.tenant?.name || sub.tenantId}</strong></span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            <span>Kullanıcı: <strong className="text-white">{sub.user?.name || sub.user?.email || sub.userId}</strong></span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            <span>{new Date(sub.createdAt).toLocaleString('tr-TR')}</span>
                                        </div>
                                        {sub.status === 'REJECTED' && sub.rejectionReason && (
                                            <p className="mt-2 text-xs text-rose-400 font-medium bg-rose-500/10 px-2 py-1 rounded inline-block">Red Sebebi: {sub.rejectionReason}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end gap-2 shrink-0">
                                    {sub.documentUrl && (
                                        <a href={sub.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300">
                                            <LinkIcon className="w-3.5 h-3.5" /> Görüntüle / İndir
                                        </a>
                                    )}

                                    {sub.status === 'PENDING' && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <button onClick={() => reviewSubmission(sub.id, 'REJECT')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 font-bold text-xs transition">
                                                Reddet (Eksik)
                                            </button>
                                            <button onClick={() => reviewSubmission(sub.id, 'APPROVE')} className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-bold text-xs transition">
                                                Onayla
                                            </button>
                                        </div>
                                    )}
                                    {sub.status === 'APPROVED' && (
                                        <span className="text-emerald-400 font-bold text-xs">✅ Geçerli Sürüm</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {submissions.length === 0 && (
                            <div className="text-center py-12 bg-slate-900 border border-white/5 rounded-2xl text-slate-500">
                                Kayıt yok.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'signatures' && (
                    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden animate-in fade-in duration-300">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800/50 text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Kimlik</th>
                                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Kullanıcı (IP)</th>
                                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Sözleşme</th>
                                    <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {signatures.map(sig => (
                                    <tr key={sig.id} className="hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-white text-xs">{sig.tenant?.name || sig.tenantId}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sig.tenantId}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-white text-xs">{sig.user?.name || sig.user?.email || sig.userId}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sig.ipAddress}</div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-semibold text-blue-400 text-xs">{sig.contract?.title}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">Versiyon: {sig.version}</div>
                                        </td>
                                        <td className="px-5 py-3 font-medium text-emerald-400 text-xs">
                                            {new Date(sig.signedAt).toLocaleString('tr-TR')}
                                        </td>
                                    </tr>
                                ))}
                                {signatures.length === 0 && (
                                    <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500">İmza yok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Rule */}
            {showRuleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Kural / Evrak Gereksinimi</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Bağlı Modül</label>
                                <select 
                                    value={ruleForm.moduleId} 
                                    onChange={e => setRuleForm({ ...ruleForm, moduleId: e.target.value })} 
                                    className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="" disabled>Modül Seçiniz...</option>
                                    <option value="GENERAL">Platform Genel (Kayıt Sonrası Göster)</option>
                                    <option value="CRM">Müşteri & CRM</option>
                                    <option value="INVENTORY">Stok & Envanter (WMS)</option>
                                    <option value="SALES">Satış & Sipariş Yönetimi</option>
                                    <option value="PURCHASING">Satınalma & Tedarikçi</option>
                                    <option value="ACCOUNTING">Genel Muhasebe & E-Defter</option>
                                    <option value="TREASURY">Finans & Kasa / Banka</option>
                                    <option value="EFATURA">E-Fatura & E-İrsaliye Merkezi</option>
                                    <option value="REPORTS">Raporlar & Analizler</option>
                                    <option value="B2B">B2B Pazaryeri (Alıcı/Satıcı)</option>
                                    <option value="FIELD_SALES">Saha Satış Modülü</option>
                                    <option value="HR">Personel / İK (HR)</option>
                                    <option value="POS">Mağaza POS Terminali</option>
                                    <option value="KDS">Mutfak/Restoran Ekranı</option>
                                    <option value="FINTECH">Fintech & Ödeme Sistemleri</option>
                                    <option value="ASSETS">Demirbaş & Varlık Yönetimi</option>
                                    <option value="ADVISOR">AI Danışman & Periodya Advisor</option>
                                    <option value="MARKETPLACE">Pazaryeri Entegrasyonları</option>
                                    <option value="ODEAL">Ödeal Sanal/Fiziksel Pos</option>
                                    <option value="PAYTR">PayTR Sanal Pos</option>
                                    <option value="IYZICO">İyzico Sanal Pos</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Gereksinim Adı</label>
                                <input value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="Örn: Vergi Levhası" className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Kısa Açıklama</label>
                                <input value={ruleForm.description} onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipi</label>
                                    <select value={ruleForm.type} onChange={e => setRuleForm({ ...ruleForm, type: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500">
                                        <option value="DOCUMENT">PDF Belge Yükleme</option>
                                        <option value="CONTRACT">Sistemden İmzalanacak Sözleşme</option>
                                    </select>
                                </div>
                                {ruleForm.type === 'DOCUMENT' ? (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Geçerlilik (Ay)</label>
                                        <input type="number" value={ruleForm.validityMonths} onChange={e => setRuleForm({ ...ruleForm, validityMonths: e.target.value })} placeholder="Süresiz ise boş bırak" className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Sözleşme Bağla</label>
                                        <select value={ruleForm.contractId} onChange={e => setRuleForm({ ...ruleForm, contractId: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500">
                                            <option value="">Seçiniz</option>
                                            {contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowRuleModal(false)} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition text-sm">İptal</button>
                                <button onClick={saveRule} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition text-sm">Kaydet</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Contract */}
            {showContractModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 h-[80vh] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 shrink-0">Dinamik Sözleşme Oluştur</h2>
                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="grid grid-cols-2 gap-4 shrink-0">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Başlık</label>
                                    <input value={contractForm.title} onChange={e => setContractForm({ ...contractForm, title: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Slug (sistem_kodu)</label>
                                    <input value={contractForm.slug} onChange={e => setContractForm({ ...contractForm, slug: e.target.value })} className="w-full bg-slate-800 border-none rounded-xl h-10 px-3 text-white focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-xs font-medium text-slate-400 mb-1">İçerik (HTML destekli)</label>
                                <textarea
                                    value={contractForm.content}
                                    onChange={e => setContractForm({ ...contractForm, content: e.target.value })}
                                    className="w-full flex-1 bg-slate-800 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 shrink-0 pt-4 mt-2">
                            <button onClick={() => setShowContractModal(false)} className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition text-sm">İptal</button>
                            <button onClick={saveContract} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white transition text-sm">Oluştur / Versiyonla</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
