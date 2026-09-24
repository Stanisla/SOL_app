import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.10.0/dist/maplibre-gl.mjs';
console.log("hola")
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
const PMTILES_URL = './data/mapExample.pmtiles';
const p = new pmtiles.PMTiles(PMTILES_URL);
// this is so we share one instance across the JS code and the map renderer
protocolVector.add(p);

const map = new maplibregl.Map({
    container: 'map', // container id
    style: './styles/euskadi.json', // style URL
    maxZoom: 24,
    maxPitch: 85,    
    center: [-2.676, 42.84],
    zoom: 11,
    maplibreLogo: false,
    hash: true
})
window.map=map