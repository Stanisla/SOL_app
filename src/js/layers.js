import { styleOsm } from './index.js'
import { parseStyle } from './styleParser.js';
import { tileUrl} from './pmtilesLoader.js';
import { getArchive } from './pmtilesLoader.js';

//const header = await (await getArchive('dem')).getHeader();
//window.header=header
//const testStyle = await parseStyle('./styles/test_style.json', {})

export async function addLayers(){

    // test_style (geojson group)
    /*const sourceId = Object.keys(testStyle.sources)[0];
    map.addSource(sourceId, testStyle.sources[sourceId]);
    testStyle.layers.forEach(layer => map.addLayer(layer));*/

    // OpenStreetMap
    map.addSource('o_std', {
        type: 'raster',
        tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        minzoom: 0,
        maxzoom: 19,
        tileSize: 256,
        attribution:  '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMaps</a>' ,
    });
    map.addLayer({
        id: 'o_std',
        type: 'raster',
        source: 'o_std'
    });
    //test dem RGB raster
    map.addSource('demRGBS', {
        type: 'raster',
        tiles: [tileUrl('dem')],
        minzoom: 0,
        maxzoom: 11,
        tileSize: 512,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMaps</a>',
    });
    
    map.addLayer({
        id: 'demRGBl',
        type: 'raster',
        source: 'demRGBS'
    });
    //hillshade
    map.addSource('demHillS', {
        type: 'raster-dem',
        tiles: [tileUrl('dem', '.webp')],
        tileSize: 512,
        encoding: 'terrarium', // or 'mapbox', depending on how you generated it
        maxzoom: 11 // use the real max zoom of your file
    });
    map.addLayer({
        id: 'dem_hillshade',
        type: 'hillshade',
        source: 'demHillS',
        paint: {
            'hillshade-method': 'combined',
            'hillshade-illumination-direction': 315,
            'hillshade-shadow-color': '#000000',
            'hillshade-highlight-color': '#FFFFFF',
            'hillshade-accent-color': '#000000',
            'hillshade-exaggeration': 0.5
        }
     });
    //Ortofotos PNOA
    map.addSource('ortoPNOAsource',{
        type: "raster",
        tiles: ['https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&request=GetTile&layer=OI.OrthoimageCoverage&styles=&format=image/png&transparent=false&version=1.3.0&continuousWorld=true&width=256&height=256&tileMatrixSet=GoogleMapsCompatible&tileMatrix={z}&tileRow={y}&tileCol={x}'],        
        tileSize: 256,   
        minzoom: 0,
        maxZoom: 21,
        attribution: '© <a href="http://www.ign.es/ign/main/index.do" target="_blank">ign.es</a>'     
    });
    map.addLayer({
        id:'ortoPNOA',
        type:'raster',
        source: 'ortoPNOAsource'
    });

    //sombreado wmts
    map.addSource('spainSOMsource',{
        type: "raster",
        tiles:['https://servicios.idee.es/wmts/mdt?SERVICE=WMTS&request=GetTile&layer=Relieve&styles=&format=image/png&transparent=false&version=1.3.0&continuousWorld=true&width=256&height=256&tileMatrixSet=GoogleMapsCompatible&tileMatrix={z}&tileRow={y}&tileCol={x}'],
        tileSize: 256,
        minzoom: 0,
        maxZoom: 19, 
        attribution: '© <a href="http://www.ign.es/ign/main/index.do" target="_blank">ign.es</a>'            
    });
    map.addLayer({
        id:'spainSOM',
        type:'raster',
        source: 'spainSOMsource'
    });

    //wmtsLidar    
    map.addSource('wmtsLidarSource',{
        type: "raster",
        tiles:['https://wmts-mapa-lidar.idee.es/lidar?SERVICE=WMTS&request=GetTile&layer=EL.GridCoverageDSM&styles=&format=image/png&transparent=false&version=1.3.0&continuousWorld=true&width=256&height=256&tileMatrixSet=GoogleMapsCompatible&tileMatrix={z}&tileRow={y}&tileCol={x}'],        
        minzoom: 0,
        maxZoom: 19,
        tileSize: 256,        
    });
    map.addLayer({
        id:'wmtsLidar',
        type:'raster',
        source: 'wmtsLidarSource',
        attribution: '© <a href="http://www.ign.es/ign/main/index.do" target="_blank">ign.es</a>'     
    });

//pendientes españa
    map.addSource('spainPENDsource',{
        type: "raster",
        tiles:['https://wms-pendientes.idee.es/pendientes?SERVICE=WMS&request=GetMap&layers=MDP05&styles=&format=image/png&transparent=false&version=1.1.1&continuousWorld=true&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}'],
        tileSize: 256,
        minzoom: 0,
        maxZoom: 17,
        attribution: '© <a href="http://www.ign.es/ign/main/index.do" target="_blank">ign.es</a>'             
    });
    map.addLayer({
        id:'spainPEND',
        type:'raster',
        source: 'spainPENDsource'
    });
    
    //IGN raster
    map.addSource('rasterIGNsource',{
        type: "raster",
        tiles:['https://www.ign.es/wms-inspire/mapa-raster?SERVICE=WMS&request=GetMap&layers=mtn_rasterizado&styles=&format=image/png&transparent=false&version=1.1.1&continuousWorld=true&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}'],
        tileSize: 256,
        minzoom: 0,
        maxZoom: 19, 
        attribution: '© <a href="http://www.ign.es/ign/main/index.do" target="_blank">ign.es</a>'            
    });
    map.addLayer({
        id:'rasterIGN',
        type:'raster',
        source: 'rasterIGNsource'
    });    
}

let mapBaseLayer;
let mapOverLayer;

export function getLayers() {
    mapBaseLayer = {};
    mapOverLayer = {
        vector_local: { label: 'LocalPBF', typeLayer: 'group', style: styleOsm, order: 1, typeUser: 'public' },        
        o_std: { label: 'OpenStreetMap *', typeLayer: 'raster', style: null, order: 10, typeUser: 'public' },        
        ortoPNOA: { label: 'OrtoPNOA *', typeLayer: 'raster', style: null, order: 20, typeUser: 'public' },
        spainSOM: { label: 'RelieveSom *', typeLayer: 'raster', style: null, order: 60, typeUser: 'public' },
        wmtsLidar: { label: 'LidarOnLine *', typeLayer: 'raster', style: null, order: 70, typeUser: 'public' },
        spainPEND: { label: 'spainPend *', typeLayer: 'raster', style: null, order: 80, typeUser: 'public' },
        rasterIGN: { label: 'rasterIGN *', typeLayer: 'raster', style: null, order: 90, typeUser: 'public' },
        demRGBl: { label: 'DEMRaster', typeLayer: 'raster', style: null, order: 91, typeUser: 'public' },
        dem_hillshade: { label: 'Hillshade', typeLayer: 'raster-dem', style: null, order: 92, typeUser: 'public' }
        //test: { label: 'Test', typeLayer: 'group', style: testStyle, order: 99, typeUser: 'public' }
    };
    return { mapBaseLayer, mapOverLayer };
}