import { readFile, watch } from 'node:fs/promises';
import path from 'node:path';
import EventEmitter from 'node:events';
import { Worker } from 'node:worker_threads';
import sirv from 'sirv';
import { moduleResolve } from 'import-meta-resolve';
import { fileExists } from './fs.js';
import { getPaths } from './paths.js';
import polka from 'polka';

const paths = await getPaths();

const assets = sirv(paths.srcDir, { dev: true });
const nodeModuleAssets = sirv(paths.nodeModules, { dev: true });

async function resolvePagePath(urlPath) {
    const fullHtmlUrl = urlPath.endsWith('.html') ? urlPath : path.join(urlPath, 'index.html');
    const htmlPath = path.join(paths.srcDir, fullHtmlUrl);
    
    const hasHtml = await fileExists(htmlPath);
    if (hasHtml) return { type: 'html', path: htmlPath };

    const extensions = ['js', 'mjs', 'ts', 'mts'];
    for (const ext of extensions) {
        const generatorPath = `${htmlPath}.${ext}`;
        const hasGenerator = await fileExists(generatorPath);
        if (hasGenerator) return { type: 'js', path: generatorPath }
    }

    return null;
}

async function renderJsPage(generatorPath) {
    const worker = new Worker(paths.ssrWorker, { workerData: { generatorPath } });
    return new Promise((ok, fail) => {
        worker.on('message', ({ page }) => ok(page));
        worker.on('error', fail);
        worker.on('exit', (code) => {
            if (code !== 0) fail(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

async function tryRenderPage(urlPath) {
    const source = await resolvePagePath(urlPath);
    if (!source) return null;
    const render = source.type === 'js' ? renderJsPage(source.path) : readFile(source.path);
    return injectRuntime(await render);
}

async function tryGet404() {
    return tryRenderPage('/404.html');
}

async function generateNodeImportmap() {
    const imports = {};
    const lockfile = JSON.parse(String(await readFile(paths.packageLock)));
    for (const [path, pkg] of Object.entries(lockfile.packages)) {
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

const reloaderRuntime = await readFile(paths.livereloadRuntime);
const scripts = `
    <script type="importmap">${JSON.stringify(importmap, null, 2)}</script>
    <script>${reloaderRuntime}</script>`;

/**
 * @param {string} html 
 * @returns 
 */
function injectRuntime(html) {
    const hasHead = html.includes('<head>');
    return (hasHead ? html.replace('<head>', `<head>${scripts}`) : scripts + html);
}

const events = new EventEmitter();
async function startWatcher() {
    const watcher = watch(paths.srcDir, { persistent: false, recursive: true });
    for await (const event of watcher) {
        events.emit('change');
    }
}
startWatcher();

function resolvePackage(specifier) {
    return moduleResolve(
        specifier, 
        new URL(import.meta.url), 
        new Set(['browser', 'import', 'development'])
    ).pathname;
}

// Then start a proxy server on port 3000
polka({
    onNoMatch: async (req, res, next) => {
        const fallbackPage = await tryGet404();
        if (!fallbackPage) next();
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(injectRuntime(fallbackPage));
    }
})
    .use(async (req, res, next) => {
        try {
            const html = await tryRenderPage(req.url);
            if (!html) return next();
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(html);
        } catch (err) {
            console.log('render err', err);
            res.writeHead(500);
            res.end(`Could not render page: ${err.stack}`);
        }
    })
    .use(assets)
    .use('/node_modules', nodeModuleAssets)
    .get('/events', async (req, res) => {
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
    })
    .get('/__packages/*', async (req, res) => {
        try {
            const libName = req.url.replace('/__packages/', '');
            const relPath = path.relative(paths.nodeModules, resolvePackage(libName));
            const targetUrl = `/node_modules/${relPath.split(path.delimiter).join('/')}`;
            res.writeHead(302, { "Location": targetUrl });
            res.end();
        } catch {
            res.writeHead(404);
            res.end();
        }
    })
    .listen(3000);
