import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.periodya.com';

    // Ana sayfalar
    const routes = [
        '',
        '/login',
        '/register',
        '/help',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Not: Eğer dinamik yardım konuları (knowledge base) varsa buraya fetch ile eklenebilir.

    return [...routes];
}
