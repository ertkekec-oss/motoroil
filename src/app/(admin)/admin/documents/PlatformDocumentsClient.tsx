"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DocumentData {
    id: string;
    documentNo: string;
    title: string;
    category: string;
    targetModule: string;
    approvalMethod: string;
    fileKey: string | null;
    textContent: string | null;
    contentType: 'PDF' | 'TEXT';
    version: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    revisedAt: string;
    _count: { approvals: number };
}

export default function PlatformDocumentsClient() {
    const [docs, setDocs] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDoc, setEditingDoc] = useState<DocumentData | null>(null);

    // Form inputs
    const [documentNo, setDocumentNo] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("CONTRACT");
    const [targetModule, setTargetModule] = useState("GENERAL");
    const [approvalMethod, setApprovalMethod] = useState("CHECKBOX");
    const [file, setFile] = useState<File | null>(null);
    const [textContent, setTextContent] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDocs();
    }, []);

    const loadDocs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/documents");
            const data = await res.json();
            if (res.ok) {
                setDocs(data);
            } else {
                toast.error(data.error || "Dökümanlar yüklenemedi.");
            }
        } catch (e: any) {
            toast.error("İletişim hatası yaşandı.");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("documentNo", documentNo);
            formData.append("title", title);
            formData.append("category", category);
            formData.append("targetModule", targetModule);
            formData.append("approvalMethod", approvalMethod);
            formData.append("isActive", String(isActive));
            formData.append("textContent", textContent);

            if (file) {
                formData.append("file", file);
            }

            const url = editingDoc
                ? `/api/admin/documents/${editingDoc.id}`
                : "/api/admin/documents";
            const method = editingDoc ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(
                    editingDoc ? "Döküman revize edildi." : "Yeni döküman başarıyla oluşturuldu."
                );
                setShowForm(false);
                setEditingDoc(null);
                setFile(null);
                loadDocs();
            } else {
                toast.error(data.error || "Hata oluştu.");
            }
        } catch (e: any) {
            toast.error("Bağlantı hatası yaşandı.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (d: DocumentData) => {
        setEditingDoc(d);
        setDocumentNo(d.documentNo);
        setTitle(d.title);
        setCategory(d.category);
        setTargetModule(d.targetModule);
        setApprovalMethod(d.approvalMethod);
        setIsActive(d.isActive);
        setTextContent(d.textContent || "");
        setFile(null);
        setShowForm(true);
    };

    const resetForm = () => {
        setDocumentNo("");
        setTitle("");
        setCategory("CONTRACT");
        setTargetModule("GENERAL");
        setApprovalMethod("CHECKBOX");
        setIsActive(true);
        setTextContent("");
        setFile(null);
        setEditingDoc(null);
        setShowForm(false);
    };

    return (
        <div className="space-y-6">
            {!showForm && (
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                    >
                        + Yeni Döküman Ekle
                    </button>
                </div>
            )}

            {showForm && (
                <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">
                        {editingDoc ? `Döküman Revize Et (v${editingDoc.version})` : "Yeni Sistem Dökümanı Ekle"}
                    </h2>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Döküman No / Kodu</label>
                                <input
                                    type="text"
                                    value={documentNo}
                                    onChange={(e) => setDocumentNo(e.target.value)}
                                    placeholder="Opsiyonel (Boş bırakılırsa otomatik üretilir)"
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Döküman Başlığı</label>
                                <input
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Örn: Banka Entegrasyon Başvuru Formu"
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none placeholder-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nitelik (Kategori)</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="CONTRACT">Sözleşme</option>
                                    <option value="FORM">Form</option>
                                    <option value="POLICY">Politika / Yönerge</option>
                                    <option value="GUIDE">Kılavuz</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Bağlı Olduğu Modül</label>
                                <select
                                    value={targetModule}
                                    onChange={(e) => setTargetModule(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="GENERAL">Genel Sistem / Kayıt Aşaması</option>
                                    <option value="SIGNUP">Yeni Üyelik (Signup) Formu</option>
                                    <option value="BANK_INTEGRATION">Banka Entegrasyon Geçidi</option>
                                    <option value="B2B_MARKETPLACE">B2B Pazaryeri (Ticaret Formu)</option>
                                    <option value="FIELD_SALES">Saha Satış Modülü</option>
                                    <option value="E_INVOICE">E-Fatura / E-Defter</option>
                                    <option value="E_ARCHIVE">E-Arşiv</option>
                                    <option value="HUMAN_RESOURCES">İnsan Kaynakları / Özlük</option>
                                    <option value="INVENTORY_MANAGEMENT">Envanter Yönetimi</option>
                                    <option value="POS_TERMINAL">POS Terminal / Kasa</option>
                                    <option value="CRM">CRM / Müşteri Yönetimi</option>
                                    <option value="ERP_INTEGRATION">ERP Entegrasyonu</option>
                                    <option value="PAYMENTS">Ödemeler ve Tahsilat</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">İmza / Onay Yöntemi</label>
                                <select
                                    value={approvalMethod}
                                    onChange={(e) => setApprovalMethod(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="CHECKBOX">Tıkla ve Onayla (Kutu)</option>
                                    <option value="OTP">SMS OTP (Yüksek Güvenlik)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Mevcut Durum</label>
                                <select
                                    value={isActive ? "true" : "false"}
                                    onChange={(e) => setIsActive(e.target.value === "true")}
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="true">Yayında (Aktif)</option>
                                    <option value="false">Taslak / Devre Dışı</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                                    {editingDoc ? 'Yeni Versiyon PDF Yükle (İsteğe Bağlı)' : 'PDF Dosyası Yükle (Veya Alttaki Metin Editörünü Kullan)'}
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2 text-sm text-slate-400 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 cursor-pointer mb-2"
                                />
                                <div className="text-center text-xs text-slate-500 my-2">— VEYA —</div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Sözleşme / Form Metni (PDF yüklenmezse bu kullanılır)</label>
                                <textarea
                                    className="w-full h-32 bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none placeholder-slate-600"
                                    placeholder="Eğer PDF yüklüyorsanız burayı boş bırakabilirsiniz..."
                                    value={textContent}
                                    onChange={e => setTextContent(e.target.value)}
                                ></textarea>
                                {editingDoc && file && (
                                    <p className="mt-2 text-xs text-amber-500 font-semibold">
                                        ⚠️ Yeni bir PDF yüklemeniz halinde, bu dökümanın versiyonu (v{editingDoc.version + 1}) olarak güncellenecek ve tüm firmaların yeniden imzalaması gerekecektir.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium rounded-lg text-sm transition-colors border border-slate-600"
                            >
                                İptal Et
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50"
                            >
                                {submitting ? "İşleniyor..." : (editingDoc ? "Revize Et ve Kaydet" : "Dökümanı Yayınla")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-[#0f172a] text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Döküman & ID</th>
                                    <th className="px-6 py-4">Modül / Kategori</th>
                                    <th className="px-6 py-4 text-center">İmza Tipi</th>
                                    <th className="px-6 py-4 text-center">Sürüm</th>
                                    <th className="px-6 py-4">Tarihler</th>
                                    <th className="px-6 py-4 text-center">Durum</th>
                                    <th className="px-6 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400">Yükleniyor...</td>
                                    </tr>
                                ) : docs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-medium">Sistemde ekli sözleşme veya döküman bulunamadı.</td>
                                    </tr>
                                ) : (
                                    docs.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-100">{d.documentNo}</div>
                                                <div className="text-slate-400 text-xs mt-1 truncate max-w-[200px]" title={d.title}>{d.title}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1 block w-fit">
                                                    {d.targetModule}
                                                </span>
                                                <div className="text-slate-500 text-[11px] font-bold">{d.category}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {d.approvalMethod === 'OTP' ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> SMS OTP</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Kutucuk</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="w-8 h-8 mx-auto rounded-full bg-slate-700/50 flex flex-col items-center justify-center border border-slate-600 text-slate-200 font-bold text-xs shadow-inner">
                                                    v{d.version}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-1 font-semibold">{d._count?.approvals || 0} Onay</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-slate-300"><span className="text-slate-500">Oluşturma:</span> {format(new Date(d.createdAt), 'dd.MM.yyyy')}</div>
                                                <div className="text-xs text-amber-400/80 mt-1 font-medium"><span className="text-slate-500">Son Revize:</span> {format(new Date(d.revisedAt), 'dd.MM.yyyy')}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {d.isActive ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                                        Yayında
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase">
                                                        Taslak
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        const link = document.createElement("a");
                                                        if (d.contentType === 'PDF' && d.fileKey) {
                                                            link.href = `/api/admin/documents/${d.id}/download`;
                                                        } else {
                                                            toast.info("Bu belge metin tabanlı (PDF değil). İndirme işlevi yakında eklenecek.");
                                                            return;
                                                        }
                                                        link.target = "_blank";
                                                        link.rel = "noopener noreferrer";
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                                                    title="İndir / Görüntüle"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(d)}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                                                    title="Revize Et"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
