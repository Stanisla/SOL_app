// https://capacitorjs.com/docs/apis/device
import { Device } from '@capacitor/device';
//https://capacitorjs.com/docs/apis/filesystem
import { Filesystem, Directory } from '@capacitor/filesystem';
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
