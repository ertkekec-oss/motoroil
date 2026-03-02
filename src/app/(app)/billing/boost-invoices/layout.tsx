// Server Component layout — forces this route segment to be dynamic
// so Vercel generates a lambda instead of treating it as a static page.
export const dynamic = "force-dynamic";

export default function BoostInvoicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
