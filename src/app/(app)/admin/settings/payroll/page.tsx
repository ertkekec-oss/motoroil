'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Settings } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import {
  EnterprisePageShell,
  EnterpriseCard,
  EnterpriseSectionHeader,
  EnterpriseInput,
  EnterpriseButton,
  EnterpriseField
} from '@/components/ui/enterprise';

type TaxTier = {
  limit: number | null;
  rate: number;
};

type PayrollParams = {
  periodYear: number;
  sgkFloor: number;
  sgkCeiling: number;
  stampTaxRate: number;
  incomeTaxBrackets: TaxTier[];
};

export default function PayrollSettingsPage() {
  const [params, setParams] = useState<PayrollParams>({
    periodYear: new Date().getFullYear(),
    sgkFloor: 0,
    sgkCeiling: 0,
    stampTaxRate: 0.00759,
    incomeTaxBrackets: [
      { limit: 110000, rate: 0.15 },
      { limit: 230000, rate: 0.20 },
      { limit: 870000, rate: 0.27 },
      { limit: 3000000, rate: 0.35 },
      { limit: null, rate: 0.40 },
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { showAlert } = useModal();

  useEffect(() => {
    fetchParams(params.periodYear);
  }, []);

  const fetchParams = async (year: number) => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/admin/settings/payroll?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.periodYear) {
          setParams({
            periodYear: data.periodYear,
            sgkFloor: Number(data.sgkFloor),
            sgkCeiling: Number(data.sgkCeiling),
            stampTaxRate: Number(data.stampTaxRate),
            incomeTaxBrackets: Array.isArray(data.incomeTaxBrackets) ? data.incomeTaxBrackets : params.incomeTaxBrackets
          });
        }
      }
    } catch (error) {
      console.error('Error fetching payroll params:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        showAlert("Başarılı", "Bordro parametreleri başarıyla güncellendi.");
      } else {
        const err = await res.json();
        showAlert("Hata", err.error || "Parametreler güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      showAlert("Hata", "Sistemsel bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const addTier = () => {
    setParams(prev => ({
      ...prev,
      incomeTaxBrackets: [...prev.incomeTaxBrackets, { limit: 0, rate: 0 }]
    }));
  };

  const removeTier = (index: number) => {
    setParams(prev => ({
      ...prev,
      incomeTaxBrackets: prev.incomeTaxBrackets.filter((_, i) => i !== index)
    }));
  };

  const updateTier = (index: number, field: keyof TaxTier, value: number | null) => {
    setParams(prev => ({
      ...prev,
      incomeTaxBrackets: prev.incomeTaxBrackets.map((tier, i) => i === index ? { ...tier, [field]: value } : tier)
    }));
  };

  return (
    <EnterprisePageShell
      title="Bordro Parametreleri"
      description="Sistem genelinde kullanılacak resmi SGK ve vergi oranlarını yönetin."
      actions={
        <EnterpriseButton onClick={handleSave} disabled={isLoading || isFetching}>
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Ayarları Kaydet
        </EnterpriseButton>
      }
    >
      {isFetching ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnterpriseCard>
            <EnterpriseSectionHeader 
              title="SGK Tavan & Taban" 
              subtitle="Yıllık belirlenen yasal parametreler"
              icon={<Settings />}
            />
            
            <div className="space-y-4">
              <div className="flex gap-2 isolate">
                <EnterpriseInput
                  label="Yıl"
                  type="number"
                  value={params.periodYear}
                  onChange={e => setParams({...params, periodYear: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="flex-1"
                />
                <div className="flex items-end pb-0.5">
                  <EnterpriseButton variant="secondary" onClick={() => fetchParams(params.periodYear)}>
                    Getir
                  </EnterpriseButton>
                </div>
              </div>

              <EnterpriseInput
                label="Brüt Asgari Ücret (Taban) (₺)"
                type="number"
                value={params.sgkFloor}
                onChange={e => setParams({...params, sgkFloor: parseFloat(e.target.value) || 0})}
              />

              <EnterpriseInput
                label="SGK Tavan Ücreti (₺)"
                type="number"
                value={params.sgkCeiling}
                onChange={e => setParams({...params, sgkCeiling: parseFloat(e.target.value) || 0})}
              />

              <EnterpriseInput
                label="Damga Vergisi Oranı"
                type="number"
                step="0.00001"
                value={params.stampTaxRate}
                onChange={e => setParams({...params, stampTaxRate: parseFloat(e.target.value) || 0})}
              />
            </div>
          </EnterpriseCard>

          <EnterpriseCard>
            <EnterpriseSectionHeader 
              title="Gelir Vergisi Dilimleri" 
              subtitle="Kümülatif vergi matrahına göre uygulanacak dilimler"
              icon={<Settings />}
              rightElement={
                <EnterpriseButton variant="secondary" onClick={addTier}>
                  <Plus className="w-4 h-4 mr-1.5" /> Ekle
                </EnterpriseButton>
              }
            />

            <div className="space-y-3">
              {params.incomeTaxBrackets.map((tier, index) => (
                <div key={index} className="flex gap-3 items-end p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex-1">
                    <EnterpriseInput
                      label="Limit (₺) (Sınırsız için boş)"
                      type="number"
                      value={tier.limit === null ? '' : tier.limit}
                      onChange={e => updateTier(index, 'limit', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Sınırsız"
                    />
                  </div>
                  <div className="flex-1">
                    <EnterpriseInput
                      label="Vergi Oranı (örn: 0.15)"
                      type="number"
                      step="0.01"
                      value={tier.rate}
                      onChange={e => updateTier(index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <EnterpriseButton variant="danger" onClick={() => removeTier(index)} className="px-3 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </EnterpriseButton>
                </div>
              ))}
            </div>
          </EnterpriseCard>
        </div>
      )}
    </EnterprisePageShell>
  );
}
