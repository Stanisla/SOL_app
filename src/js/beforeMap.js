// https://capacitorjs.com/docs/apis/device
import { Device } from '@capacitor/device';
//https://capacitorjs.com/docs/apis/filesystem
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {copyFile} from './androidFileSystem'
export async function beforeStart(){
    const deviceInfo = await Device.getInfo()
    const platform = deviceInfo.platform
    //platform = browser or android
    console.log(platform)
    if (platform == "android"){
        await copyFile('./data/mapExample.pmtiles','osm/mapExample.pmtiles',Directory.External,
            (done, total) => console.log(`${(done / 1e6).toFixed(0)} MB${total ? ' / ' + (total / 1e6).toFixed(0) + ' MB' : ''}`)            
        )
    }
}
// parse style localhost, in browser it's http://localhost:8100/ , in android http://localhost/
export async function parseStyle(styleUrl, { fileName, protocol }) {
    const response = await fetch(styleUrl);
    const style = await response.json();

    style.sprite = changeOrigin(style.sprite);
    style.glyphs = changeOrigin(style.glyphs);

    changeSourceUrl(style, { fileName, protocol });

    return style;
}

function changeOrigin(url) {
    // "http://localhost:8200/img/sprite" -> ["http:", "", "localhost:8200", "img", "sprite"]
    const path = url.split('/').slice(3).join('/');
    return `${window.location.origin}/${path}`;
}

function changeSourceUrl(style, { fileName, protocol }) {
    const sourceId = Object.keys(style.sources)[0];
    const source = style.sources[sourceId];

    // must match whatever key makePmtilesSource used for `new pmtiles.PMTiles(...)`
    const key = Capacitor.getPlatform() === 'web'
        ? `/data/${fileName}` // '/data/mapExample.pmtiles'
        : fileName;           // native: matches getKey() in the in-memory Source

    source.tiles = [`${protocol}://${key}/{z}/{x}/{y}`];
}