import ServiceDetailClient from './ServiceDetailClient';

export default async function ServiceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <ServiceDetailClient id={id} />;
}
