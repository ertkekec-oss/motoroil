"use client";

import { useState, useEffect, useMemo } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useSettings } from '@/contexts/SettingsContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import CampaignPointsPanel from '@/app/(app)/settings/_components/forms/CampaignPointsPanel';

export default function LoyaltyAndCouponsPage() {
    const { showSuccess, showError, showConfirm } = useModal();
    const {
        products
    } = useInventory();

    const {
        custClasses,
    } = useCRM();

    const {
        campaigns: allCampaigns, refreshCampaigns,
        coupons, refreshCoupons,
        referralSettings: contextReferralSettings, updateReferralSettings,
        allBrands, allCats
    } = useSettings();

    // Sadece legacy / loyalty tipi kampanyaları filtrele
    const campaigns = allCampaigns?.filter((c: any) =>
        ['loyalty_points', 'payment_method_discount', 'buy_x_get_discount', 'buy_x_get_free'].includes(c.type)
    ) || [];

    const [campaignSubTab, setCampaignSubTab] = useState('loyalty');
    const [referralSettings, setReferralSettings] = useState(contextReferralSettings || {});
    useEffect(() => { setReferralSettings(contextReferralSettings || {}); }, [contextReferralSettings]);

    const saveReferralSettings = async () => {
        await updateReferralSettings(referralSettings);
        showSuccess('Başarılı', 'Referans ayarları kaydedildi.');
    };

    const [newCampaign, setNewCampaign] = useState<any>({
        name: '',
        type: 'payment_method_discount',
        discountRate: 0,
        pointsRate: 0,
        conditions: {
            brands: [],
            categories: [],
            paymentMethod: '',
            buyQuantity: 1,
            rewardProductId: '',
            rewardQuantity: 1,
            rewardValue: 0,
            rewardType: 'percentage_discount'
        },
        targetCustomerCategoryIds: []
    });
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

    const [newCoupon, setNewCoupon] = useState<any>({
        code: '',
        campaignName: '',
        count: 1,
        type: 'percent',
        value: 10,
        minPurchaseAmount: 0,
        customerCategoryId: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        conditions: { brands: [], categories: [] },
        usageLimit: 1
    });

    const [showCouponModal, setShowCouponModal] = useState(false);

    const exportCouponsExcel = () => {
        const data = coupons.map((c: any) => ({
            'KOD': c.code,
            'KAMPANYA': c.campaignName || '-',
            'TİP': c.type === 'amount' ? 'Tutar' : 'Oran',
            'DEĞER': c.value,
            'MİN. TUTAR': c.minPurchaseAmount,
            'LİMİT': c.usageLimit === 0 ? 'Sürekli' : c.usageLimit,
            'KULLANIM': c.usedCount,
            'DURUM': c.isUsed ? 'Kullanıldı' : (c.usageLimit > 0 && c.usedCount >= c.usageLimit ? 'Limit Dolu' : 'Aktif'),
            'SON TARİH': c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Süresiz'
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Kuponlar");
        XLSX.writeFile(workbook, `Kupon_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportCouponsPDF = () => {
        const doc = new jsPDF() as any;
        doc.text("Hediye Çeki Listesi", 14, 15);
        const tableData = coupons.map((c: any) => [
            c.code,
            c.campaignName || '-',
            c.type === 'amount' ? `₺${c.value}` : `%${c.value}`,
            c.usageLimit === 0 ? 'Sürekli' : c.usageLimit,
            c.usedCount,
            c.isUsed ? 'Kullanıldı' : 'Aktif'
        ]);
        autoTable(doc, {
            head: [['Kod', 'Kampanya', 'İndirim', 'Limit', 'Adet', 'Durum']],
            body: tableData,
            startY: 20
        });
        doc.save(`Kupon_Listesi_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const addCampaign = async () => {
        if (!newCampaign.name) return showError('Hata', 'Kampanya adı zorunludur.');
        try {
            const isEditing = !!editingCampaignId;
            const res = await fetch('/api/campaigns', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isEditing ? { ...newCampaign, id: editingCampaignId } : newCampaign)
            });
            if (res.ok) {
                showSuccess('Başarılı', isEditing ? 'Kampanya güncellendi.' : 'Kampanya eklendi.');
                refreshCampaigns();
                setNewCampaign({
                    name: '',
                    type: 'payment_method_discount',
                    discountRate: 0,
                    pointsRate: 0,
                    conditions: {
                        brands: [],
                        categories: [],
                        paymentMethod: '',
                        buyQuantity: 1,
                        rewardProductId: '',
                        rewardQuantity: 1,
                        rewardValue: 0,
                        rewardType: 'percentage_discount'
                    },
                    targetCustomerCategoryIds: []
                });
                setEditingCampaignId(null);
            }
        } catch (e) { showError('Hata', 'Kaydedilemedi.'); }
    };

    const startEditingCampaign = (camp: any) => {
        setNewCampaign({
            name: camp.name,
            type: camp.type,
            discountRate: camp.discountRate,
            pointsRate: camp.pointsRate,
            conditions: camp.conditions || {
                brands: [],
                categories: [],
                paymentMethod: '',
                buyQuantity: 1,
                rewardProductId: '',
                rewardQuantity: 1,
                rewardValue: 0,
                rewardType: 'percentage_discount'
            },
            targetCustomerCategoryIds: camp.targetCustomerCategoryIds || []
        });
        setEditingCampaignId(camp.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteCampaign = async (id: string) => {
        showConfirm('Emin misiniz?', 'Kampanyayı silmek istiyor musunuz?', async () => {
            try {
                const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showSuccess('Başarılı', 'Kampanya silindi.');
                    refreshCampaigns();
                }
            } catch (e) { showError('Hata', 'Silinemedi.'); }
        });
    };

    const addCoupon = async () => {
        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoupon)
            });
            const data = await res.json();
            if (res.ok) {
                showSuccess('Başarılı', data.count ? `${data.count} adet kupon üretildi.` : 'Hediye çeki oluşturuldu.');
                refreshCoupons();
                setNewCoupon({
                    code: '',
                    campaignName: '',
                    count: 1,
                    type: 'percent',
                    value: 10,
                    minPurchaseAmount: 0,
                    customerCategoryId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    expiryDate: '',
                    conditions: { brands: [], categories: [] },
                    usageLimit: 1
                });
            } else {
                showError('Hata', data.error || 'İşlem başarısız oldu.');
            }
        } catch (e) {
            console.error('Kupon ekleme hatası:', e);
            showError('Hata', 'Sunucuya bağlanılamadı.');
        }
    };

    const sharedProps = {
        products,
        allBrands,
        allCats,
        campaigns,
        addCoupon,
        coupons: coupons || [],
        setShowCouponModal,
        referralSettings, setReferralSettings, saveReferralSettings,
        newCampaign, setNewCampaign,
        editingCampaignId, setEditingCampaignId,
        addCampaign, startEditingCampaign, deleteCampaign,
        newCoupon, setNewCoupon,
        custClasses,
        campaignSubTab, setCampaignSubTab,
        exportCouponsExcel, exportCouponsPDF
    };

    return (
        <CampaignPointsPanel {...sharedProps} />
    );
}
