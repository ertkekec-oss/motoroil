import { redirect } from "next/navigation";

export default function DeprecatedB2BDashboard() {
    // Deprecated. Forwarding to Hub Seller Dashboard / Orders.
    redirect("/hub/seller/orders");
}
