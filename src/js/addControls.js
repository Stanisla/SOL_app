import { map } from './mapInstance.js';
import { GridControlPanel } from './GridControlPanel.js';
import { getLayers, addLayers } from './layers.js'
import { OpacityControl } from './opacity.js'
import { gpsControl } from './gpsControl.js';

let panel;
export async function addControls(){
    panel = new GridControlPanel({ rows: 2, cols: 3, collapsed: true });
    map.addControl(panel, 'top-right'); // panel itself sits in a normal corner
    // Maplibre controls
    const Navigation= new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: false,
        showCompass: true
    })
    panel.addControlAt(Navigation, 1, 1)
    const Geolocate = new maplibregl.GeolocateControl({
        positionOptions: {enableHighAccuracy: true},
        trackUserLocation: true
    });
    panel.addControlAt(Geolocate, 1, 2)
    await addOpacityControl()
    //Add scale
    map.addControl(new maplibregl.ScaleControl());
    // gpsControl Overrides gps arrow and shows gps data
    let gpsCon = new gpsControl({ geolocate : Geolocate });
    map._gpsCon = gpsCon
    map.addControl(gpsCon, 'bottom-right');
}


async function addOpacityControl() {
    const { mapBaseLayer, mapOverLayer } = getLayers();
    // OpacityControl
    let Opacity = new OpacityControl({
        baseLayers: mapBaseLayer,
        overLayers: mapOverLayer,
        opacityControl: true,
        collapsed: true,
    });
    await addLayers()
    //map.addControl(Opacity, 'top-right');
    panel.addControlAt(Opacity, 2, 1);

}
