"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HelpManager({ initialCategories, tenantId }: { initialCategories: any[], tenantId: string }) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);

    // Category Modal State
    const [showCatModal, setShowCatModal] = useState(false);
    const [catForm, setCatForm] = useState({ id: '', name: '', slug: '', description: '', order: 0 });

    // Topic Modal State
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [topicForm, setTopicForm] = useState({ id: '', title: '', slug: '', excerpt: '', body: '', categoryId: '', status: 'DRAFT', order: 0 });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const openCatModal = (cat?: any) => {
        setError('');
        if (cat) {
            setCatForm(cat);
        } else {
            setCatForm({ id: '', name: '', slug: '', description: '', order: categories.length });
        }
        setShowCatModal(true);
    };

    const openTopicModal = (topic?: any, categoryId?: string) => {
        setError('');
        if (topic) {
            setTopicForm(topic);
        } else {
            setTopicForm({ id: '', title: '', slug: '', excerpt: '', body: '', categoryId: categoryId || (categories[0]?.id || ''), status: 'PUBLISHED', order: 0 });
        }
        setShowTopicModal(true);
    };

    const saveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Note: For MVP we only implement POST (Create)
            // Ideally PUT should also be implemented for updates
            const res = await fetch('/api/admin/help/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catForm)
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setShowCatModal(false);
            router.refresh(); // Fetch new data from server
            window.location.reload(); // Simple refresh for MVP state sync
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const url = topicForm.id ? `/api/admin/help/topics/${topicForm.id}` : '/api/admin/help/topics';
            const method = topicForm.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...topicForm, tenantId })
            });

            if (!res.ok) throw new Error((await res.json()).error);
            setShowTopicModal(false);
            router.refresh();
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteTopic = async (id: string) => {
        if (!confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/admin/help/topics/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            router.refresh();
            window.location.reload();
        } catch {
            alert('Silme işlemi başarısız.');
        }
    };

    return (
        <div>
            <div className="flex justify-end gap-4 mb-6">
                <button onClick={() => openCatModal()} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm transition-all">
                    + Kategori Ekle
                </button>
                <button
                    onClick={() => openTopicModal()}
                    disabled={categories.length === 0}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                    title={categories.length === 0 ? "Önce bir kategori eklemelisiniz" : ""}
                >
                    + Konu Ekle (Makale)
                </button>
            </div>

            {categories.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 p-8 rounded-2xl text-center mb-6">
                    <div className="text-4xl mb-3">📂</div>
                    <h3 className="text-orange-900 font-bold">Henüz Kategori Yok</h3>
                    <p className="text-orange-700 text-sm mt-1 max-w-md mx-auto">Yardım makaleleri ekleyebilmek için önce bir kategori oluşturmanız gerekmektedir. Yukarıdaki "+ Kategori Ekle" butonunu kullanabilirsiniz.</p>
                </div>
            )}

            <div className="space-y-6">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                📚 {cat.name}
                            </h2>
                            <div className="flex gap-2 text-xs">
                                <button onClick={() => openTopicModal(null, cat.id)} className="text-orange-600 font-bold hover:text-orange-500 transition-colors mr-4">+ Makale</button>
                                <span className="text-slate-400 text-[10px]">Kategori Düzenleme MVP'de kapalı</span>
                            </div>
                        </div>
                        <div className="p-0">
                            {cat.topics?.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500">Bu kategoride henüz makale oluşturmamışsınız.</div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {cat.topics?.map((topic: any) => (
                                        <li key={topic.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                            <div>
                                                <div className="font-bold text-slate-800 mb-1">{topic.title}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-xl">{topic.excerpt || 'Özet girilmedi.'}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${topic.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {topic.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
                                                </span>
                                                <div className="flex gap-3 text-sm ml-4 border-l border-slate-200 pl-4 font-medium">
                                                    <a href={`/help/${topic.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500 transition-colors">İzle</a>
                                                    <button onClick={() => openTopicModal(topic)} className="text-orange-600 hover:text-orange-500 transition-colors">Düzenle</button>
                                                    <button onClick={() => deleteTopic(topic.id)} className="text-rose-600 hover:text-rose-500 transition-colors">Sil</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showCatModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[3000] p-4">
                    <form onSubmit={saveCategory} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Yeni Kategori Ekle</h3>
                        {error && <div className="mb-4 text-rose-600 text-sm bg-rose-50 border border-rose-100 p-3 rounded-xl">{error}</div>}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kategori Adı</label>
                                <input type="text" required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bağlantı URL (Slug - Örn: fatura-islemleri)</label>
                                <input type="text" required value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Açıklama</label>
                                <input type="text" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setShowCatModal(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700">İptal</button>
                            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

            {showTopicModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[3000] p-4">
                    <form onSubmit={saveTopic} className="bg-white border border-slate-200 p-8 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-black text-slate-900 mb-6">{topicForm.id ? 'Makale Düzenle' : 'Yeni Makale Ekle'}</h3>
                        {error && <div className="mb-6 text-rose-600 text-sm bg-rose-50 border border-rose-100 p-4 rounded-xl font-medium">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Makale Başlığı</label>
                                    <input type="text" required value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bağlantı URL (Slug - Örn: e-fatura-iptali)</label>
                                    <input type="text" required value={topicForm.slug} onChange={e => setTopicForm({ ...topicForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Özet (SEO ve Arama için)</label>
                                    <input type="text" value={topicForm.excerpt} onChange={e => setTopicForm({ ...topicForm, excerpt: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kategori</label>
                                        <select value={topicForm.categoryId} onChange={e => setTopicForm({ ...topicForm, categoryId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors">
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Durum</label>
                                        <select value={topicForm.status} onChange={e => setTopicForm({ ...topicForm, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 text-slate-900 rounded-xl mt-1 outline-none focus:border-orange-500/50 transition-colors">
                                            <option value="DRAFT">Taslak</option>
                                            <option value="PUBLISHED">Yayında</option>
                                            <option value="ARCHIVED">Arşivli</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Editor Area */}
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between mb-1">
                                    <span>İçerik (Markdown)</span>
                                    <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" className="text-orange-600 hover:underline">Yardım ↗</a>
                                </label>
                                <textarea
                                    required
                                    rows={15}
                                    value={topicForm.body}
                                    onChange={e => setTopicForm({ ...topicForm, body: e.target.value })}
                                    className="flex-1 w-full bg-slate-50 border border-slate-200 p-6 text-slate-800 font-mono text-sm rounded-2xl outline-none focus:border-orange-500/50 transition-colors min-h-[400px]"
                                    placeholder="# Başlık 1&#10;## Alt Başlık&#10;**Kalın Metin**&#10;> Blockquote&#10;* Liste Elemanı"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                            <button type="button" onClick={() => setShowTopicModal(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700">İptal</button>
                            <button type="submit" disabled={loading} className="px-10 py-2.5 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50">Değişiklikleri Kaydet</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
