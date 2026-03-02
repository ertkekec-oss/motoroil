// Server Component — dynamic export causes Vercel to generate a proper lambda
export const dynamic = "force-dynamic";

import { BoostInvoicesClient } from "./BoostInvoicesClient";

export default function BoostInvoicesPage() {
    return <BoostInvoicesClient />;
}
