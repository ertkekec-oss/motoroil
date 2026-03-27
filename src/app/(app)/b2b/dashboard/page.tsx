import { redirect } from 'next/navigation';

export default function B2bDashboardRedirect() {
    redirect('/hub/seller/orders');
}
