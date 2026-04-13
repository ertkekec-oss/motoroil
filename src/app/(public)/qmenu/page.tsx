import QCommerceMenuWorkspace from '@/components/qcommerce/QCommerceMenuWorkspace';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dijital Menü & Sipariş | MotorOil Cafe',
    description: 'MotorOil Cafe için Periodya Q-Commerce Online Menü Altyapısı',
};

export default function QMenuPage() {
    return (
        <div className="w-full min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1220]">
            <QCommerceMenuWorkspace />
        </div>
    );
}
