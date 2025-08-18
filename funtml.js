import http from 'node:http'
import esbuild from 'esbuild';
import { readFile, stat, watch } from 'node:fs/promises';
import path from 'node:path';
import EventEmitter from 'node:events';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import sirv from 'sirv';

const assets = sirv('./src', { dev: true });

async function tryGet404() {
    try {
        return String(await readFile('./src/404.html'));
    } catch {
        return null
    }
}

async function generateNodeImportmap() {
    const imports = {};
    const lockfile = await import('./package-lock.json', { with: { type: 'json' } });
    for (const [path, pkg] of Object.entries(lockfile.default.packages)) {
        const name = path.split('node_modules/').at(-1);
        const { dev } = pkg;
        if (!name || dev || (name in imports)) continue;
        imports[name] = `/${path}`;
    }
    return { imports };
}

const importmap = await generateNodeImportmap();

const reloaderRuntime = await readFile('./livereload.js');
const importmapScript = `<script type="importmap">${JSON.stringify(importmap, null, 2)}</script>`;
const reloader = `<script>${reloaderRuntime}</script>`;

function injectRuntime(html) {
    return importmapScript + html + reloader;
}

const fileExists = path => stat(path).then(s => s.isFile(), () => false);

async function resolvePageGenerator(url) {
    const lookup = url.endsWith('.html')
        ? `${url}.js`
        : path.join(url, 'index.html.js');
    const rendererPath = `./${path.join('src', lookup)}`;
    const hasGenerator = await fileExists(rendererPath);
    if (!hasGenerator) return null;

    const worker = new Worker('./ssrWorker.js', { workerData: { rendererPath } });
    const waitForWorker = new Promise((ok, fail) => {
        worker.on('message', ({ page }) => ok(page));
        worker.on('error', fail);
        worker.on('exit', (code) => {
            if (code !== 0) fail(new Error(`Worker stopped with exit code ${code}`));
        });
    });
    return await waitForWorker;
}

async function resolvePageHtml(url) {
    const lookup = url.endsWith('.html')
        ? url
        : path.join(url, 'index.html');
    const htmlPath = `./${path.join('src', lookup)}`;
    const hasHtml = await fileExists(htmlPath);
    if (!hasHtml) return null;
    
    return readFile(htmlPath);
}

const events = new EventEmitter();
async function startWatcher() {
    const watcher = watch('./src', { persistent: false, recursive: true });
    for await (const event of watcher) {
        events.emit('change');
    }
}
startWatcher();

function createSubscription(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    res.write(':ok\n\n');
    const onChange = () => res.write(`event: change\ndata: {}\n\n`);
    const onImportMap = (map) => res.write(`event: importmap\ndata: ${JSON.stringify(map)}\n\n`);
    events.addListener('change', onChange);
    events.addListener('importmap', onImportMap);

    req.on('close', () => {
        events.removeListener('change', onChange);
        events.removeListener('importmap', onImportMap);
        res.end();
    });
}


// Then start a proxy server on port 3000
http.createServer(async (req, res) => {
    if (req.url === '/events') {
        return createSubscription(req, res);
    }

    if (req.url.startsWith('/node_modules/')) {
        const libName = req.url.replace('/node_modules/', '');
        const target = fileURLToPath(import.meta.resolve(libName));
        const prebuilt = await esbuild.build({
            entryPoints: [target],
            bundle: true,
            format: 'esm',
            write: false,
            packages: 'external'
        });
        res.writeHead(200, { "content-type": 'text/javascript' });
        res.end(prebuilt.outputFiles[0].contents);
        return;
    }

    const dynamicPage = await resolvePageGenerator(req.url);
    if (dynamicPage) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(injectRuntime(dynamicPage));
        return;
    }

    const rawHtml = await resolvePageHtml(req.url);
    if (rawHtml) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(injectRuntime(rawHtml));
        return;
    }

    assets(req, res, async () => {
        const fallbackPage = await tryGet404();
        if (fallbackPage) {
            res.writeHead(404, { 'Content-Type': 'text/html' })
            res.end(injectRuntime(dynamicPage))
            return
        }
        res.statusCode = 404;
        res.end('Not found');
    });
}).listen(3000)
