import "@/app/landing.css";
import "@/app/mega-menu.css";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
