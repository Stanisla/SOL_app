import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.10.0/dist/maplibre-gl.mjs';
import { beforeStart, parseStyle, getPmtilesUrl } from './beforeMap.js'
beforeStart()
const PmtilesReader = registerPlugin('PmtilesReader');
// add the PMTiles plugin to the maplibregl global.
const protocolVector = new pmtiles.Protocol();
// protocol.tile only understand URLs start with pmtile:// . It's hardcoded
// Add a handler to convert vector:// to pmtiles://
maplibregl.addProtocol('vector', (params, ...rest) =>
    protocolVector.tile(
        { ...params, url: params.url.replace(/^vector:\/\//, 'pmtiles://') },
        ...rest
    )
);
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
// --- helper: read the file and build a Source ---
async function makeCapacitorSource(folder, fileName) {
    const { data: base64 } = await Filesystem.readFile({
        path: `${folder}/${fileName}`,
        directory: Directory.External,
    });
    const buf = base64ToArrayBuffer(base64); // your existing base64 decode helper

    return {
        _buf: buf,
        getKey() { return fileName; }, // must match what goes in the style's tile URL
        async getBytes(offset, length) {
            return { data: this._buf.slice(offset, offset + length) };
        },
    };
}
// otra prueba
async function makePmtilesSource(folder, fileName) {
    if (Capacitor.getPlatform() === 'web') {
        // Browser: plain URL, let pmtiles use its built-in FetchSource
        return await getPmtilesUrl(folder, fileName); // returns `/data/${fileName}`
    }

    // Native: read via Filesystem and keep in memory
    const { data: base64 } = await Filesystem.readFile({
        path: `${folder}/${fileName}`,
        directory: Directory.External,
    });
    const buf = base64ToArrayBuffer(base64);

    return {
        getKey() { return fileName; },
        async getBytes(offset, length) {
            return { data: buf.slice(offset, offset + length) };
        },
    };
}
// Before: const PMTILES_URL = './data/mapExample.pmtiles';
//const PMTILES_URL = await getPmtilesUrl('osm', 'mapExample.pmtiles');
//console.log(PMTILES_URL)
//const p = new pmtiles.PMTiles(PMTILES_URL);
//const source = await makeCapacitorSource('osm', 'mapExample.pmtiles');
const source = await makePmtilesSource('osm', 'mapExample.pmtiles');
const p = new pmtiles.PMTiles(source); // string URL on web, Source object on native
// this is so we share one instance across the JS code and the map renderer
protocolVector.add(p);
const styleEukadi = await parseStyle('./styles/euskadi.json')

const map = new maplibregl.Map({
    container: 'map', // container id
    //style: './styles/euskadi.json', // style URL
    style: styleEukadi, // style URL
    maxZoom: 24,
    maxPitch: 85,    
    center: [-2.676, 42.84],
    zoom: 11,
    maplibreLogo: false,
    hash: true
})
window.map=map