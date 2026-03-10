import { usePathname } from "next/navigation"

export function useNetworkPath() {
    const pathname = usePathname()
    // Check if we are accessed via the main domain with the /network prefix
    const isNetworkPrefix = pathname.startsWith("/network")

    return (path: string) => {
        // Only strip '/network' if we are not on the prefix path
        if (isNetworkPrefix) {
            return path
        } else {
            return path.replace("/network", "")
        }
    }
}
