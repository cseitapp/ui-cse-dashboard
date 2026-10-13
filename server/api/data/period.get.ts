import { energy } from "../utils/energy";

export default defineCachedEventHandler(async (event) => {
     const query = getQuery(event);
    const start = query.start;
    const end = query.end;
    const code = query.code;
    const type = query.type;
    try {
        const res = await energy.get("api/data/period", {
            params: {
                start,
                end,
                code,
                type,
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
    name: 'plant-period-data',
    maxAge: 120,
    staleMaxAge: 3600,
    swr: true,
    getKey: (event) => {
        const query = getQuery(event);
        return [
            query.start,
            query.end,
            query.code,
            query.type,
            query.yearweek_start,
            query.yearweek_end,
        ].map(value => String(value || '')).join(':');
    },
});
