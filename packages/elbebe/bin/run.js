#!/usr/bin/env node

import minimist from 'minimist';


const args = minimist(process.argv.slice(2));
const command = args._[0];
if (command === 'dev') {
    await import('@elbebe/dev/run');
} else {
    console.error(`command ${command} not implemented`);
}