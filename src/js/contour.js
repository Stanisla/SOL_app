//import * as maplibregl from 'maplibre-gl';
import mlcontour from "maplibre-contour";
import { getArchive, tileUrl } from './pmtilesLoader.js';

// Make fetch() understand relief:// URLs by reading from the PMTiles archive
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith('relief://')) return originalFetch(input, init);

    const m = url.match(/\/(\d+)\/(\d+)\/(\d+)\.\w+$/); // z/x/y at the end
    const archive = await getArchive('dem');
    const tile = await archive.getZxy(+m[1], +m[2], +m[3], init?.signal);
    if (!tile) return new Response(null, { status: 404 });
    return new Response(tile.data, { headers: { 'Content-Type': 'image/webp' } });
};

export const demSource = new mlcontour.DemSource({
    url: tileUrl('dem', '.webp'),
    encoding: 'terrarium',
    maxzoom: 11,
    worker: false,
    cacheSize: 100,
    timeoutMs: 10_000,
});
export function setupContour() {
    const demSource = new mlcontour.DemSource({
        url: tileUrl('dem', '.webp'),
        encoding: 'terrarium',
        maxzoom: 11,
        worker: false,
        cacheSize: 100,
        timeoutMs: 10_000,
    });
    demSource.setupMaplibre(maplibregl);
    return demSource;
}

// Handler for map.on('error', ...): hides 404s of missing DEM tiles
export function ignoreMissingDemTiles(e) {
    const msg = e.error?.message ?? '';
    if (msg.includes('Bad response: 404') && msg.includes('relief://')) return;
    console.error(e.error ?? e);
}