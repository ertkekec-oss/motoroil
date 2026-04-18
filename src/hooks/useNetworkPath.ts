import { usePathname } from "next/navigation"

export function useNetworkPath() {
    const pathname = usePathname()
    // Check if we are accessed via the main domain with the /network prefix
    const isNetworkPrefix = pathname.startsWith("/network")
    const isB2BPrefix = pathname.startsWith("/b2b")

    return (path: string) => {
        if (isNetworkPrefix) {
             return path; // Keep as /network/...
        } else if (isB2BPrefix) {
             return path.replace("/network", "/b2b"); // Swap /network to /b2b
        } else {
             return path.replace("/network", ""); // Strip /network (for b2b.periodya.com root)
        }
    }
}
