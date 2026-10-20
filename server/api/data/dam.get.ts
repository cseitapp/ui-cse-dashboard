import { energy } from "../utils/energy";

export default defineCachedEventHandler(async (event) => {
     const query = getQuery(event);
    const start = query.start;
    const end = query.end;
    const code = query.code;
    try {
        const res = await energy.get("api/data/dam", {
            params: {
                start,
                end,
                code
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
    name: 'dashboard-sites',
    maxAge: 120,
    staleMaxAge: 3600,
    swr: true,
    getKey: (event) => {
        const query = getQuery(event);
        return `${String(query.start || '')}:${String(query.end || '')}:${String(query.code || '')}`;
    },
});
