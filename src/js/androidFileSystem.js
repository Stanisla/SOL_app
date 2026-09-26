import { Filesystem, Directory } from '@capacitor/filesystem';

// check if path (folder or file exists)
async function exists(path, directory = Directory.External) {
    try {
        await Filesystem.stat({ path, directory });
        return true;
    } catch {
        return false;
    }
}
// delete files/folder
async function deleteIfExists(path, directory = Directory.External) {
    let info;
    try {
        info = await Filesystem.stat({ path, directory });
    } catch {
        return; // does not exist
    }
    if (info.type === 'directory') {
        await Filesystem.rmdir({ path, directory, recursive: true });
    } else {
        await Filesystem.deleteFile({ path, directory });
    }
}
window.deleteIfExists= deleteIfExists

//List files. Filter with e.type === 'file' if you only want files.
export async function listRecursive(path = '', directory = Directory.External) {
    const entries = [];
    const { files } = await Filesystem.readdir({ path, directory });

    for (const file of files) {
        const filePath = path ? `${path}/${file.name}` : file.name;
        entries.push({ ...file, path: filePath });

        if (file.type === 'directory') {
            entries.push(...(await listRecursive(filePath, directory)));
        }
    }
    return entries;
}
window.listRecursive = listRecursive;

// if folder doesn't exist, create it
export async function createFolder(path, directory = Directory.External) {
    if (!(await exists(path, directory))) {
        await Filesystem.mkdir({ path, directory, recursive: true });
    }
}

function toBase64(bytes) {
    let binary = '';
    const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    }
    return btoa(binary);
}


function concat(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

async function copyAssetToFile(url, path, directory, onProgress) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const total = Number(response.headers.get('content-length')) || 0;

    const CHUNK = 3 * 1024 * 1024; // must be a multiple of 3 (see notes)
    let pending = new Uint8Array(0);
    let written = 0;
    let first = true;

    const flush = async (bytes) => {
        const data = toBase64(bytes);
        if (first) {
            await Filesystem.writeFile({ path, directory, data }); // creates/overwrites
            first = false;
        } else {
            await Filesystem.appendFile({ path, directory, data });
        }
        written += bytes.length;
        onProgress?.(written, total);
    };

    const reader = response.body.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pending = concat(pending, value);
        if (pending.length >= CHUNK) {
            const cut = Math.floor(pending.length / CHUNK) * CHUNK;
            await flush(pending.subarray(0, cut));
            pending = pending.slice(cut);
        }
    }
    if (pending.length) await flush(pending);
}

export async function copyFile(url, path, directory = Directory.External, onProgress) {
    if (await exists(path, directory)) return;
    const parent = path.split('/').slice(0, -1).join('/');
    if (parent) await createFolder(parent, directory);

    // write to a temporary name first, so a half-copied file is never used
    const tmp = path + '.tmp';
    await copyAssetToFile(url, tmp, directory, onProgress);
    await Filesystem.rename({ from: tmp, to: path, directory, toDirectory: directory });
}