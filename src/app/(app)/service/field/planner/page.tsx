import FieldPlannerClient from './FieldPlannerClient';
import { FeatureGuard } from '@/components/gate/FeatureGuard';

export const metadata = {
    title: 'Saha Planlama Panosu | Periodya Enterprise',
    description: 'Saha servis teknisyenleri için günlük kapasite, rota ve iş emri planlama arayüzü',
};

export default function PlannerPage() {
    return (
        <FeatureGuard featureKey="field_service">
            <FieldPlannerClient />
        </FeatureGuard>
    );
}
