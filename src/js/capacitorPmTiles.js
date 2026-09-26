import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
const PmtilesReader = registerPlugin('PmtilesReader');


function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

//  native source using the PmtilesReader plugin (random-access reads, no full-file load) ---
async function makeNativePluginSource(folder, fileName) {
    const { uri } = await Filesystem.getUri({
        path: `${folder}/${fileName}`,
        directory: Directory.External,
    });
    const absolutePath = uri.replace(/^file:\/\//, '');

    return {
        getKey() { return fileName; },
        async getBytes(offset, length) {
            const { data } = await PmtilesReader.readRange({ path: absolutePath, offset, length });
            return { data: base64ToArrayBuffer(data) };
        },
    };
}

// pick the source: uses the plugin (random-access, not whole-file) ---
export async function makePmtilesSource(folder, fileName) {
    if (Capacitor.getPlatform() === 'web') {        
        return `/data/${fileName}`
    }
    return await makeNativePluginSource(folder, fileName);
}
