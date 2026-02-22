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
                <button onClick={() => openCatModal()} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all">
                    + Kategori Ekle
                </button>
                <button onClick={() => openTopicModal()} disabled={categories.length === 0} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                    + Konu Ekle (Makale)
                </button>
            </div>

            <div className="space-y-6">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-[#0f111a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                📚 {cat.name}
                            </h2>
                            <div className="flex gap-2 text-xs">
                                <button onClick={() => openTopicModal(null, cat.id)} className="text-orange-400 hover:text-white transition-colors mr-4">+ Makale</button>
                                <span className="text-gray-600 text-[10px]">Kategori Düzenleme MVP'de kapalı</span>
                            </div>
                        </div>
                        <div className="p-0">
                            {cat.topics?.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-500">Bu kategoride henüz makale oluşturmamışsınız.</div>
                            ) : (
                                <ul className="divide-y divide-white/5">
                                    {cat.topics?.map((topic: any) => (
                                        <li key={topic.id} className="px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                            <div>
                                                <div className="font-bold text-gray-300 mb-1">{topic.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xl">{topic.excerpt || 'Özet girilmedi.'}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${topic.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                    {topic.status}
                                                </span>
                                                <div className="flex gap-3 text-sm ml-4 border-l border-white/10 pl-4">
                                                    <a href={`/help/${topic.slug}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">İzle</a>
                                                    <button onClick={() => openTopicModal(topic)} className="text-orange-400 hover:text-orange-300 transition-colors">Düzenle</button>
                                                    <button onClick={() => deleteTopic(topic.id)} className="text-red-400 hover:text-red-300 transition-colors">Sil</button>
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

            {/* Category Modal */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
                    <form onSubmit={saveCategory} className="bg-[#1a1d2d] border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Yeni Kategori Ekle</h3>
                        {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400">Kategori Adı</label>
                                <input type="text" required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Bağlantı URL (Slug - Örn: fatura-islemleri)</label>
                                <input type="text" required value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Açıklama</label>
                                <input type="text" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">İptal</button>
                            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded font-bold disabled:opacity-50">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Topic Modal */}
            {showTopicModal && (
                <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
                    <form onSubmit={saveTopic} className="bg-[#1a1d2d] border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-4">{topicForm.id ? 'Makale Düzenle' : 'Yeni Makale Ekle'}</h3>
                        {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400">Makale Başlığı</label>
                                    <input type="text" required value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Bağlantı URL (Slug - Örn: e-fatura-iptali)</label>
                                    <input type="text" required value={topicForm.slug} onChange={e => setTopicForm({ ...topicForm, slug: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Özet (SEO ve Arama için)</label>
                                    <input type="text" value={topicForm.excerpt} onChange={e => setTopicForm({ ...topicForm, excerpt: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-400">Kategori</label>
                                        <select value={topicForm.categoryId} onChange={e => setTopicForm({ ...topicForm, categoryId: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1">
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Durum</label>
                                        <select value={topicForm.status} onChange={e => setTopicForm({ ...topicForm, status: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white rounded mt-1">
                                            <option value="DRAFT">Taslak</option>
                                            <option value="PUBLISHED">Yayında</option>
                                            <option value="ARCHIVED">Arşivli</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Editor Area */}
                            <div>
                                <label className="text-xs text-orange-400 flex justify-between">
                                    <span>İçerik (Markdown Destekler)</span>
                                    <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" className="underline hover:text-white">Rehber</a>
                                </label>
                                <textarea
                                    required
                                    rows={15}
                                    value={topicForm.body}
                                    onChange={e => setTopicForm({ ...topicForm, body: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-4 text-gray-300 font-mono text-sm rounded mt-1 h-[calc(100%-20px)] custom-scrollbar"
                                    placeholder="# Başlık 1&#10;## Alt Başlık&#10;**Kalın Metin**&#10;> Blockquote&#10;* Liste Elemanı"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/5">
                            <button type="button" onClick={() => setShowTopicModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">İptal</button>
                            <button type="submit" disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded font-bold disabled:opacity-50">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
