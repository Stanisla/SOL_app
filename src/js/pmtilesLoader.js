import { makePmtilesSource } from './capacitorPmTiles.js';
import * as pmtiles from 'pmtiles';
const config = await (await fetch('./config.json')).json();
console.log(config)

// name -> { archive, cfg }, so each pmtiles is registered once
const archives = new Map(); 

// name -> Promise<{ archive, cfg }>
// We store the promise, not the result, so a second call that arrives
// while the first is still loading receives the same promise.

function registerSource(name) {
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

export async function loadStyle(name) {
    const styleCfg = config.styles[name];
    if (!styleCfg) throw new Error(`Unknown style: ${name}`);

    const { cfg } = await registerSource(styleCfg.source);
    return parseStyle(styleCfg.path, { fileName: cfg.file, protocol: cfg.protocol });
}
// parse style localhost, in browser it's http://localhost:8100/ , in android http://localhost/
export async function parseStyle(styleUrl, { fileName, protocol }) {
    const response = await fetch(styleUrl);
    const style = await response.json();

    style.sprite = changeOrigin(style.sprite);
    style.glyphs = changeOrigin(style.glyphs);
    // if fileName and protocol are not undefined. For parsing geojson and stuffs like this
    if (fileName && protocol) {
        changeSourceUrl(style, { fileName, protocol });
    }
    return style;
}
// If not 
function changeOrigin(url) {
    // "http://localhost:8200/img/sprite" -> ["http:", "", "localhost:8200", "img", "sprite"]
    if (!url) return url; // guard: style without sprite or glyphs
    const path = url.split('/').slice(3).join('/');
    return `${window.location.origin}/${path}`;
}
// Points every vector source of the style to the given pmtiles file.
// Caution: all vector sources get the same file and protocol.
function changeSourceUrl(style, { fileName, protocol }) {
    // must match whatever key makePmtilesSource used for `new pmtiles.PMTiles(...)`
    const key = Capacitor.getPlatform() === 'web'
        ? `/data/${fileName}` // '/data/mapExample.pmtiles'
        : fileName;           // native: matches getKey() in the in-memory Source

    for (const source of Object.values(style.sources ?? {})) {
        if (source.type === 'vector') {
            source.tiles = [`${protocol}://${key}/{z}/{x}/{y}`];
        }
    }
}

export const getArchive = async (name) => (await registerSource(name)).archive;