import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function fileExists(path) {
    return fs.stat(path).then(s => s.isFile(), () => false);
}

async function dirExists(path) {
    return fs.stat(path).then(s => s.isDirectory(), () => false);
}

export async function findClosest(startDir, filename, mode = 'file') {
    let currentDir = startDir;
    const checker = mode === 'file' ? fileExists : dirExists;
    while (true) {
        // Check if the file exists in the current directory
        const filePath = path.join(currentDir, filename);
        if (await checker(filePath)) return filePath;
        
        // Move up to the parent directory
        const parentDir = path.dirname(currentDir);
        // If we've reached the filesystem root, stop searching
        if (parentDir === currentDir) break;
        currentDir = parentDir;
    }
    throw new Error(`"${filename}" not found in any parent directory starting from "${startDir}"`);
}
