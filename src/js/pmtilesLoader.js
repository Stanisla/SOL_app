import { makePmtilesSource } from './capacitorPmTiles.js';
import * as pmtiles from 'pmtiles';

export const config = await (await fetch('./config.json')).json();
window.config=config

// name -> Promise<{ archive, cfg }>
// We store the promise, not the result, so a second call that arrives
// while the first is still loading receives the same promise.
const archives = new Map();

export function registerSource(name) {
    if (!archives.has(name)) {
        const promise = doRegister(name).catch((err) => {
            archives.delete(name); // allow a retry if registration failed
            throw err;
        });
        archives.set(name, promise);
    }
    return archives.get(name);
}

async function doRegister(name) {
    const cfg = config.dataSources[name];
    if (!cfg) throw new Error(`Unknown pmtiles source: ${name}`);

    const source = await makePmtilesSource(cfg.folder, cfg.file);
    const archive = new pmtiles.PMTiles(source);
    const protocol = new pmtiles.Protocol();
    protocol.add(archive);

    const prefix = new RegExp(`^${cfg.protocol}://`);
    maplibregl.addProtocol(cfg.protocol, async (params, abortController) =>
        protocol.tile({ ...params, url: params.url.replace(prefix, 'pmtiles://') }, abortController)
    );

    return { archive, cfg };
}

export const getArchive = async (name) => (await registerSource(name)).archive;

export function tileUrl(name, ext = '') {
    const cfg = config.dataSources[name];
    const key = Capacitor.getPlatform() === 'web' ? `/data/${cfg.file}` : cfg.file;
    return `${cfg.protocol}://${key}/{z}/{x}/{y}${ext}`;
}