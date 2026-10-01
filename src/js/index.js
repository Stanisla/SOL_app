import * as maplibregl from 'maplibre-gl';
maplibregl.setWorkerUrl('/mapLibre/maplibre-gl-worker.mjs');
//import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';
import { beforeStart } from './beforeMap.js'
import { setMap } from './mapInstance.js';
import { registerSource } from './pmtilesLoader.js';
import { loadStyle } from './styleParser.js';
import { addControls } from './addControls.js';


window.maplibregl = maplibregl
// At start up application, copy data, styles...
await beforeStart()
registerSource('osm')
registerSource('dem')
export const styleOsm = await loadStyle('osm');

const map = new maplibregl.Map({
    container: 'map', // container id
    style: styleOsm, // style URL
    maxZoom: 24,
    maxPitch: 85,
    center: [-2.676, 42.84],
    zoom: 11,    
    maplibreLogo: false,
    hash: true
})
window.map = map
setMap(map)
map.on('load', () => {
    addControls();
});
