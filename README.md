# elbebe

elbebe (The Baby in Spanish) is a very lightweight frontend toolset — think vite or webpack, but with a twist:

1. Builds on latest browser & node features: ES Modules, importmaps, preload.
2. _Never_ rewrites source code — it it works in the browser, it works. Stay close to the metal, stay in control.
3. Snappy DX: framework-agnostic, fast zero-build dev mode, livereload & CSS HMR, npm package support.
4. Optimized build: top-tier asset caching, preload generation.
5. Low-overhead support for advanced patterns like SSG or islands.

Enough server components, concurrent mumbo-jumbo, compile-to-JS here, metaframework there. I want to write JS like back when it was fun.

> elbebe is _not_ production-ready — it's more a proof-of-concept, or a playground to explore the limitations of the current ecosystem.

## Design principles

Heavy source code transformations (transpilation, bundling, custom import resolution) have long been crucial for front-end engineering workflows. _elbebe_ takes a different approach to see what's possible now with navite browser and NodeJS features.

Here are our design principles, starting with the most important:

1. We do not support anything that doesn't natively work in modern browsers, including:
    1. TypeScript. You can write types and typecheck your app in jsdoc syntax. You can write SSG code in TS, an node can run TS.
    2. JSX. You can use htm or hyperscript.
    3. Compile-to-JS languages (Vue SFC, Svelte).
    4. CommonJS modules.
    5. Asset imports.
1. We generate optimized builds for great UX:
    1. Output static HTML that can be served from S3 / CDN.
    2. Append hashes to filenames so they can be cached agressively.
    3. Avoid bundling, because bundling is likely to invalidate cache.
    4. Generate preload maps for every HTML file to avoid request chains.
1. We don't transform source code unless absolutely necessary for optimization.
3. We aim for the best DX as long as we write standard JS:
    1. Fast dev server.
    2. Fast builds.
    2. Minimal build artifact size.
    3. Simple and easy to understand.
4. We use minimal dependencies to keep `node_modules` small, and CI / CD fast.
5. We employ a modular architecture to let our users install only what's needed or try out different approaches.

## Packages

The package is organised as a monorepo for more precise dependency control.

- `elbebe` — public CLI.
- `@elbebe/dev` — dev server with snappy livereload.
- `@elbebe/build` — generate performance-oriented static website.
- `@elbebe/core` — shared utilities for build and dev.

## Roadmap

- dev
    -[x] serve local static assets
    -[ ] live reload
        -[x] basic reload on static change
        -[ ] CSS HMR
        -[ ] Media HMR
        -[ ] JS HMR (?)
        -[ ] dev server restart
    -[ ] npm packages
        -[ ] use JS from packages
            -[x] basic bare specifier support
            -[x] transitive imports
            -[ ] transitive imports of conflicting versions
            -[x] internal package imports
            -[x] resolve package.json exports
            -[x] handle resolve / request errors
            -[ ] performance
                -[ ] fully resolve importmap on startup vs runtime resolve via `/__packages`
                -[ ] cache dependency package.json for lookups
                -[ ] bypass `/__packages` for deep imports from packages without `exports`
        -[x] CSS from npm packages
        -[ ] Alternate node package managers support
            -[ ] yarn
            -[ ] pnpm
        -[ ] project structure
            -[x] package-lock in parent directory
            -[x] node_modules in parent directory
            -[ ] multiple node_modules
    -[ ] prerender HTML
        -[x] render HTML via JS
        -[x] re-render on JS change
        -[ ] mjs / ts / mts support
        -[x] display rendering errors
    -[ ] Generic server
        -[ ] https support
        -[ ] proxy routes
    -[ ] package.json `imports` resolution
    -[ ] Alternate platform support
        -[ ] deno
        -[ ] bun
        -[ ] linux
        -[ ] windows
    -[ ] restart on package.json changes
- build
    -[ ] prerender html
    -[ ] add asset hashes
        -[ ] rewrite HTML references
        -[ ] flatten CSS imports
        -[ ] generate JS importmap
        -[ ] importing asset URLs from JS
    -[ ] embed dependencies
        -[ ] with package granularity
        -[ ] with module granularity
        -[ ] externalize to public CDNs
    -[ ] support hosting assets on a separate domain
    -[ ] support deploying to non-root route
    -[ ] preview mode
- code quality
    -[ ] set up linters & formatters
    -[x] set up typescript
    -[ ] publint / arethetypeswrong
    -[x] CI / CD publish
- CLI
    - add help / version

## License

[MIT](./LICENSE)
