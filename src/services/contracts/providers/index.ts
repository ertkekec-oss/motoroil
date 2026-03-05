import { NilveraProvider } from "./nilvera";
import { EGuvenProvider } from "./eguven";
import { ETugraProvider } from "./etugra";
import { SignatureProvider } from "./SignatureProvider";

export const providerRegistry: Record<string, SignatureProvider> = {
    nilvera: new NilveraProvider(),
    eguven: new EGuvenProvider(),
    etugra: new ETugraProvider()
};

export function getProvider(providerKey: string): SignatureProvider {
    const provider = providerRegistry[providerKey];
    if (!provider) {
        throw new Error(`Provider not found: ${providerKey}`);
    }
    return provider;
}
