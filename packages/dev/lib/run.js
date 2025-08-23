import http from 'node:http'
import { readFile, stat, watch } from 'node:fs/promises';
import path from 'node:path';
import EventEmitter from 'node:events';
import { Worker } from 'node:worker_threads';
import sirv from 'sirv';
import { moduleResolve } from 'import-meta-resolve';
import { cwd } from 'node:process';

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
        const httpPath = `/${path.replace('node_modules/', '__packages/')}`;
        imports[name] = httpPath;
        imports[`${name}/`] = `${httpPath}/`;
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
    events.addListener('change', onChange);

    req.on('close', () => {
        events.removeListener('change', onChange);
        res.end();
    });
}

function resolvePackage(specifier) {
    return moduleResolve(
        specifier, 
        import.meta.url, 
        new Set(['browser', 'import', 'development'])
    ).pathname;
}


// Then start a proxy server on port 3000
http.createServer(async (req, res) => {
    if (req.url === '/events') {
        return createSubscription(req, res);
    }

    if (req.url.startsWith('/__packages')) {
        const libName = req.url.replace('/__packages/', '');
        const target = `/${path.relative(cwd(), resolvePackage(libName))}`;
        res.writeHead(302, { "Location": target });
        res.end();
        return;
    }

    if (req.url.startsWith('/node_modules/')) {
        const source = await readFile('.' + req.url);
        res.writeHead(200, { "content-type": 'text/javascript' });
        res.end(source);
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
