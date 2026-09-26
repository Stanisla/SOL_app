
import { makePmtilesSource } from './capacitorPmTiles.js';
import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.10.0/dist/maplibre-gl.mjs';
import { beforeStart, parseStyle } from './beforeMap.js'
// At start up application, copy data, styles...
beforeStart()
// Registering pmtiles
const pmtilesFolder = 'osm'
const pmtilesFile = 'mapExample.pmtiles'
const pmtilesProtocol = 'vector'
// Native uses PmtilesReader plugin (random access) See capacitorPmTiles.js
const source = await makePmtilesSource(pmtilesFolder, pmtilesFile); 
// string URL on web, Source object on native
const p = new pmtiles.PMTiles(source);
const protocolVector = new pmtiles.Protocol();
// protocol.tile only understand URLs start with pmtile:// . It's hardcoded
// Add a handler to convert vector:// to pmtiles://
maplibregl.addProtocol(pmtilesProtocol, function (params, callback) {
    const modifiedParams = Object.assign({}, params, {
        url: params.url.replace(new RegExp('^' + pmtilesProtocol + '://'), 'pmtiles://')
    });
    return protocolVector.tile(modifiedParams, callback);
});
// this is so we share one instance across the JS code and the map renderer
protocolVector.add(p);
const styleEukadi = await parseStyle('./styles/euskadi.json', {
    fileName: pmtilesFile,
    protocol: pmtilesProtocol
})

const map = new maplibregl.Map({
    container: 'map', // container id
    style: styleEukadi, // style URL
    maxZoom: 24,
    maxPitch: 85,
    center: [-2.676, 42.84],
    zoom: 11,
    maplibreLogo: false,
    hash: true
})
window.map = map