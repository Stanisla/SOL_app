//import { config } from './pmtilesRegistry.js';
const config = await (await fetch('./config.json')).json();

export async function loadStyle(name) {
    const styleCfg = config.styles[name];
    const cfg = config.dataSources[name];
    if (!styleCfg) throw new Error(`Unknown style: ${name}`);    
    const parsed = await parseStyle(styleCfg.path, { fileName: cfg.file, protocol: cfg.protocol });
    console.log(`Parsed style: ${name}`);console.log(parsed)
    return parseStyle(styleCfg.path, { fileName: cfg.file, protocol: cfg.protocol });
}

// parse style localhost, in browser it's http://localhost:8100/ , in android http://localhost/
export async function parseStyle(styleUrl, { fileName, protocol } = {}) {
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
