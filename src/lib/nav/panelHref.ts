export function getPanelHref(pathname: string): string {
    if (pathname.startsWith("/admin")) return "/admin";
    if (pathname.startsWith("/staff")) return "/staff";
    if (pathname.startsWith("/b2b")) return "/b2b/dashboard";
    return "/";
}
