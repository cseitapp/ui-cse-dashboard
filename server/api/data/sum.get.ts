import { energy } from "../utils/energy";

export default defineCachedEventHandler(async (event) => {
     const query = getQuery(event);
    const dateParam = String(query.dateselect || '').trim();
    const date = dateParam && dateParam !== 'undefined' ? dateParam : new Date().toISOString().slice(0, 10);
    const dam = String(query.dam || '').trim();
    try {
        const res = await energy.get("api/data/sum/dam", {
            params: {
                date,
                dam,
            },
        });
        return res.data;
    } catch (error: any) {
        const errorCode = error?.code || error?.cause?.code || 'UNKNOWN_ERROR';
        console.error("Energy API Error:", errorCode, error?.message || 'Request failed');

        throw createError({
            statusCode: 502,
            statusMessage: 'Energy API unavailable',
            data: { code: errorCode },
        });
    }
}, {
    name: 'dashboard-summary',
    maxAge: 120,
    staleMaxAge: 3600,
    swr: true,
    getKey: (event) => {
        const query = getQuery(event);
        return `${String(query.dateselect || '')}:${String(query.dam || '')}`;
    },
});
