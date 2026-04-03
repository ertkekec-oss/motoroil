import FieldPlannerClient from './FieldPlannerClient';

export const metadata = {
    title: 'Saha Planlama Panosu | Periodya Enterprise',
    description: 'Saha servis teknisyenleri için günlük kapasite, rota ve iş emri planlama arayüzü',
};

export default function PlannerPage() {
    return <FieldPlannerClient />;
}
