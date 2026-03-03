import { permanentRedirect } from 'next/navigation';

export default function RedirectPage() {
    permanentRedirect('/dealer-network/settings');
}
