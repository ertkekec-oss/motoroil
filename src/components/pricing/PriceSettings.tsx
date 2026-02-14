'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';

export function PriceSettings() {
    const [lists, setLists] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const resLists = await fetch('/api/pricing/lists');
            const dataLists = await resLists.json();
            if (dataLists.data) setLists(dataLists.data);

            const resCats = await fetch('/api/customers/categories');
            const dataCats = await resCats.json();
            if (dataCats.data) setCategories(dataCats.data);

        } catch (error) {
            toast.error("Veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Fiyatlandırma Ayarları</h2>
            </div>

            <Tabs defaultValue="lists" className="w-full">
                <TabsList>
                    <TabsTrigger value="lists">Fiyat Listeleri</TabsTrigger>
                    <TabsTrigger value="categories">Müşteri Kategorileri</TabsTrigger>
                    <TabsTrigger value="bulk">Toplu Güncelleme</TabsTrigger>
                </TabsList>

                <TabsContent value="lists">
                    <PriceListsManager lists={lists} onRefresh={fetchAll} />
                </TabsContent>

                <TabsContent value="categories">
                    <CustomerCategoriesManager categories={categories} lists={lists} onRefresh={fetchAll} />
                </TabsContent>

                <TabsContent value="bulk">
                    <BulkPriceUpdater lists={lists} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PriceListsManager({ lists, onRefresh }: { lists: any[], onRefresh: () => void }) {
    const [newName, setNewName] = useState("");

    const handleAdd = async () => {
        if (!newName) return;
        try {
            const res = await fetch('/api/pricing/lists', {
                method: "POST",
                body: JSON.stringify({ name: newName, isDefault: false })
            });
            const d = await res.json();
            if (d.ok) {
                toast.success("Liste eklendi.");
                setNewName("");
                onRefresh();
            } else {
                toast.error(d.error);
            }
        } catch { toast.error("Hata."); }
    };

    const handleDelete = async (id: string, isDefault: boolean) => {
        if (isDefault) return toast.error("Varsayılan liste silinemez.");
        if (!confirm("Emin misiniz?")) return;
        try {
            const res = await fetch(`/api/pricing/lists/${id}`, { method: "DELETE" });
            if (res.ok) { onRefresh(); toast.success("Silindi."); }
            else toast.error("Silinemedi.");
        } catch { toast.error("Hata."); }
    };

    const toggleDefault = async (id: string) => {
        try {
            await fetch(`/api/pricing/lists/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ isDefault: true })
            });
            onRefresh();
        } catch { toast.error("Hata."); }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="flex gap-2 max-w-sm">
                <Input placeholder="Yeni Liste Adı (örn: Kampanya)" value={newName} onChange={e => setNewName(e.target.value)} />
                <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> Ekle</Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Liste Adı</TableHead>
                        <TableHead>Para Birimi</TableHead>
                        <TableHead>Varsayılan</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lists.map(l => (
                        <TableRow key={l.id}>
                            <TableCell className="font-medium">{l.name}</TableCell>
                            <TableCell>{l.currency}</TableCell>
                            <TableCell>
                                <Checkbox checked={l.isDefault} onCheckedChange={() => !l.isDefault && toggleDefault(l.id)} disabled={l.isDefault} />
                            </TableCell>
                            <TableCell className="text-right">
                                {!l.isDefault && (
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id, l.isDefault)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function CustomerCategoriesManager({ categories, lists, onRefresh }: { categories: any[], lists: any[], onRefresh: () => void }) {
    const [newName, setNewName] = useState("");
    const [defList, setDefList] = useState("");

    const handleAdd = async () => {
        if (!newName) return;
        try {
            const res = await fetch('/api/customers/categories', {
                method: "POST",
                body: JSON.stringify({ name: newName, defaultPriceListId: defList || null })
            });
            const d = await res.json();
            if (d.ok) { onRefresh(); setNewName(""); setDefList(""); toast.success("Kategori eklendi."); }
            else toast.error(d.error);
        } catch { toast.error("Hata."); }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="flex gap-2 items-center max-w-lg">
                <Input placeholder="Kategori Adı (örn: VIP)" value={newName} onChange={e => setNewName(e.target.value)} />
                <select className="border rounded px-2 py-2 text-sm" value={defList} onChange={e => setDefList(e.target.value)}>
                    <option value="">Varsayılan Liste Seç</option>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <Button onClick={handleAdd}><Plus className="h-4 w-4" /></Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Varsayılan Liste</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map(c => (
                        <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell>{c.defaultPriceList?.name || '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function BulkPriceUpdater({ lists }: { lists: any[] }) {
    const [targetList, setTargetList] = useState("");
    const [opType, setOpType] = useState("FORMULA");
    const [val, setVal] = useState("0");
    const [sourceList, setSourceList] = useState("");
    const [loading, setLoading] = useState(false);
    const [overrideMode, setOverrideMode] = useState(true); // respect manual override?

    const handleUpdate = async () => {
        if (!targetList) return toast.error("Hedef liste seçin.");
        if (opType === 'FORMULA' && !sourceList) return toast.error("Kaynak liste seçin.");
        if (opType === 'FORMULA' && targetList === sourceList) return toast.error("Kaynak ve hedef aynı olamaz.");

        if (!confirm("Bu işlem seçili listedeki TÜM fiyatları güncelleyecektir. Onaylıyor musunuz?")) return;

        setLoading(true);
        try {
            const payload: any = {
                scope: { targetPriceListId: targetList, all: true },
                operation: { type: opType === 'FORMULA' ? 'PERCENT' : opType, value: parseFloat(val) } // Formula logic handled via applyFormula payload
            };

            if (opType === 'FORMULA') {
                payload.applyFormula = {
                    sourcePriceListId: sourceList,
                    markupBps: parseFloat(val) * 100, // % to BPS (e.g. 5% -> 500)
                    roundMode: 'NONE',
                    respectManualOverride: overrideMode
                };
            }

            const res = await fetch('/api/pricing/bulk-update', {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const d = await res.json();
            if (d.ok) toast.success(`${d.data.count} kayıt güncellendi.`);
            else toast.error(d.error);
        } catch { toast.error("Hata."); } finally { setLoading(false); }
    };

    return (
        <div className="space-y-6 py-4 max-w-xl">
            <div className="space-y-2">
                <label className="text-sm font-medium">Hedef Liste (Güncellenecek)</label>
                <select className="w-full border rounded p-2" value={targetList} onChange={e => setTargetList(e.target.value)}>
                    <option value="">Seçiniz...</option>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">İşlem Türü</label>
                    <select className="w-full border rounded p-2" value={opType} onChange={e => setOpType(e.target.value)}>
                        <option value="IDLE" disabled>--- Basit ---</option>
                        <option value="PERCENT">Yüzde (%) Artır/Azalt</option>
                        <option value="ABSOLUTE">Tutar (+) Ekle/Çıkar</option>
                        <option value="SET">Sabitle (=)</option>
                        <option value="FORMULA_OPTS" disabled>--- Gelişmiş ---</option>
                        <option value="FORMULA">Formül Uygula (Kaynak + %)</option>
                    </select>
                </div>

                {opType === 'FORMULA' ? (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Kaynak Liste</label>
                        <select className="w-full border rounded p-2" value={sourceList} onChange={e => setSourceList(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {lists.filter(l => l.id !== targetList).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Değer</label>
                        <Input type="number" value={val} onChange={e => setVal(e.target.value)} />
                    </div>
                )}
            </div>

            {opType === 'FORMULA' && (
                <div className="space-y-2 border-t pt-4">
                    <label className="text-sm font-medium">Markup Oranı (%)</label>
                    <Input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="Örn: 20 (%20 kar)" />
                    <div className="flex items-center space-x-2 mt-2">
                        <Checkbox checked={overrideMode} onCheckedChange={(c) => setOverrideMode(!!c)} id="ov" />
                        <label htmlFor="ov" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Manuel ayarlanmış fiyatları KORU (Ezme)
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Eğer işaretlenmezse, daha önce manuel ayarlanan fiyatlar da formüle göre yeniden hesaplanır.</p>
                </div>
            )}

            <Button onClick={handleUpdate} disabled={loading} className="w-full mt-4">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Uygula
            </Button>
        </div>
    );
}
