import { MeiliSearch } from 'meilisearch';

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || 'masterKey';

export const meiliClient = new MeiliSearch({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_API_KEY,
});

export const INDEX_CANONICAL_PRODUCTS = 'canonical_products';
export const INDEX_SUPPLIER_PRODUCTS = 'supplier_products';
