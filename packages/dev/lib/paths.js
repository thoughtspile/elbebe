import { fileURLToPath } from 'node:url';
import { findClosest } from './fs.js';
import path from 'node:path';

export async function getPaths() {
    const projectRoot = process.cwd();
    const srcDir = path.join(projectRoot, 'src');
    return {
        projectRoot,
        srcDir,
        page404: path.join(srcDir, '404.html'),
        packageLock: await findClosest(projectRoot, 'package-lock.json', 'file'),
        nodeModules: await findClosest(projectRoot, 'node_modules', 'dir'),

        livereloadRuntime: fileURLToPath(import.meta.resolve('../runtime/livereload.js')),
        ssrWorker: fileURLToPath(import.meta.resolve('./ssrWorker.js')),
    };
}
