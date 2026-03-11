import IntegrationsContent from '@/components/IntegrationsContent';
import ModuleGatekeeper from '@/components/ModuleGatekeeper';

export default function IntegrationsPage() {
    return (
        <ModuleGatekeeper moduleId="INTEGRATION">
            <IntegrationsContent />
        </ModuleGatekeeper>
    );
}
