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
    //if (!tile) return new Response(null, { status: 404 });
    if (!tile) {
        const blob = await tileFromParent(archive, +m[1], +m[2], +m[3], init?.signal);
        if (!blob) return new Response(null, { status: 404 });
        return new Response(blob, { headers: { 'Content-Type': 'image/png' } });
    }
    return new Response(tile.data, { headers: { 'Content-Type': 'image/webp' } });
};
// If a tile doesn't have the 8 surrounding tiles, it will fail. Get the parent file, it will render, with less detail
async function tileFromParent(archive, z, x, y, signal) {
    if (z === 0) return null;
    const parent = await archive.getZxy(z - 1, x >> 1, y >> 1, signal);
    if (!parent) return null;
    const bmp = await createImageBitmap(
        new Blob([parent.data], { type: 'image/webp' }),
        { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }
    );
    const half = bmp.width / 2;
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // keep the Terrarium values unblended
    ctx.drawImage(bmp, (x & 1) * half, (y & 1) * half, half, half, 0, 0, bmp.width, bmp.height);
    return canvas.convertToBlob({ type: 'image/png' });
}

export function setupContour() {
    const demSource = new mlcontour.DemSource({
        url: tileUrl('dem', '.webp'),
        encoding: 'terrarium',
        maxzoom: 11,
        worker: false,
        //cacheSize: 100,
        //timeoutMs: 10_000,
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