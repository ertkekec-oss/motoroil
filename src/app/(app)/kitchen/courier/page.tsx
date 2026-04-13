import CourierDispatchWorkspace from '@/components/terminal/CourierDispatchWorkspace';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Kurye Operasyonu | Periodya Enterprise',
    description: 'Canlı harita kurye takibi ve teslimat zimmet panosu',
};

export default function CourierDispatchPage() {
    return <CourierDispatchWorkspace />;
}
