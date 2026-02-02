"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function StaffList() {
    const { showSuccess, showError } = useModal();
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        role: 'Usta',
        salary: '17002',
        branch: 'Merkez',
        phone: '',
        email: ''
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/staff');
            const data = await res.json();
            if (data.success) {
                setStaff(data.staff);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Kaydedildi', 'Personel başarıyla oluşturuldu.');
                setIsAddOpen(false);
                fetchStaff();
                setNewStaff({ name: '', role: 'Usta', salary: '17002', branch: 'Merkez', phone: '', email: '' });
            } else {
                showError('Hata', data.error);
            }
        } catch (error) {
            showError('Hata', 'İşlem başarısız');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Personel Listesi</h3>
                <button onClick={() => setIsAddOpen(true)} className="btn btn-primary btn-sm">+ Yeni Personel</button>
            </div>

            {isAddOpen && (
                <div className="card glass p-6 mb-6">
                    <h4 className="font-bold mb-4">Yeni Personel Ekle</h4>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">Ad Soyad</label>
                            <input type="text" className="input input-bordered" required
                                value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label">Pozisyon/Rol</label>
                            <select className="select select-bordered"
                                value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                <option>Usta</option>
                                <option>Kalfa</option>
                                <option>Çırak</option>
                                <option>Müdür</option>
                                <option>Muhasebe</option>
                                <option>Sekreter</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">Maaş (Net)</label>
                            <input type="number" className="input input-bordered" required
                                value={newStaff.salary} onChange={e => setNewStaff({ ...newStaff, salary: e.target.value })} />
                        </div>
                        <div className="form-control">
                            <label className="label">Şube</label>
                            <select className="select select-bordered"
                                value={newStaff.branch} onChange={e => setNewStaff({ ...newStaff, branch: e.target.value })}>
                                <option>Merkez</option>
                                <option>Şube 1</option>
                                <option>Kadıköy</option>
                            </select>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-ghost">İptal</button>
                            <button type="submit" className="btn btn-success">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead className="bg-white/10 text-white">
                        <tr>
                            <th>Ad Soyad</th>
                            <th>Pozisyon</th>
                            <th>Şube</th>
                            <th>Maaş</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((p: any) => (
                            <tr key={p.id} className="hover:bg-white/5">
                                <td className="font-bold">{p.name}</td>
                                <td>{p.role}</td>
                                <td>{p.branch}</td>
                                <td>{Number(p.salary).toLocaleString('tr-TR')} ₺</td>
                                <td>
                                    <span className="badge badge-success badge-sm">Aktif</span>
                                </td>
                            </tr>
                        ))}
                        {staff.length === 0 && !loading && (
                            <tr><td colSpan={5} className="text-center p-4">Kayıt bulunamadı.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
