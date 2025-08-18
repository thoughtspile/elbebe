import { parentPort, workerData } from 'node:worker_threads';

const { default: renderer } = await import(workerData.rendererPath);
const page = typeof renderer === 'string' ? renderer : renderer();
parentPort.postMessage({ page });
