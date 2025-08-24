# elbebe

Enough server components, concurrent mumbo-jumbo, bundler here, metaframework there. I want to write JS like back when it was fun. But I also want to

1. bundle
2. minify
3. add asset hashes
4. livereload

But also! Generating HTML

## Packages

The package is organised as a monorepo for more precise dependency control.

- `elbebe` — public CLI
- `@elbebe/dev` — dev server with snappy livereload
- `@elbebe/build` — generate performance-oriented static website
- `@elbebe/core` — shared utilities for build and dev.

## Roadmap

- dev
    -[x] serve local assets
    -[ ] live reload
        -[x] basic reload on change
        -[ ] CSS HMR
        -[ ] JS HMR (?)
    -[ ] npm packages
        -[ ] use JS from packages
            -[x] basic bare specifier support
            -[x] transitive imports
            -[ ] transitive imports of conflicting versions
            -[x] internal package imports
            -[x] resolve package.json exports
            -[ ] handle resolve / request errors
            -[ ] performance
                -[ ] fully resolve importmap on startup vs runtime resolve via `/__packages`
                -[ ] cache dependency package.json for lookups
                -[ ] bypass `/__packages` for deep imports from packages without `exports`
            -[ ] module format compatibility (??)
                -[ ] UMD
                -[ ] CJS
        -[ ] use CSS from packages
        -[ ] use static assets from packages
        -[ ] yarn / pnpm / ?? support
        -[ ] project structure
            -[x] package-lock in parent directory
            -[x] node_modules in parent directory
            -[ ] multiple node_modules
    -[ ] prerender HTML
        -[x] render HTML via JS
        -[x] re-render on JS change
        -[ ] mjs / ts / mts support
        -[ ] display rendering errors
        -[ ] warn on conflicting `x.html` / `x.html.js` files
    -[ ] https support
    -[ ] package.json `imports` resolution
    -[ ] windows / linux support
    -[ ] restart on package.json changes
- build
    -[ ] prerender html
    -[ ] add asset hashes
        -[ ] rewrite HTML references
        -[ ] rewrite CSS imports
        -[ ] generate JS importmap
        -[ ] importing asset URLs from JS
    -[ ] minify JS & CSS
    -[ ] embed dependencies
        -[ ] with package granularity
        -[ ] with module granularity
        -[ ] remove unused exports
        -[ ] externalize to public CDNs
    -[ ] static asset optimization
    -[ ] support hosting assets on a separate domain
    -[ ] support deploying to non-root route
    -[ ] preview mode
- code quality
    -[ ] set up linters & formatters
    -[ ] set up typescript
    -[ ] publint / arethetypeswrong
    -[ ] CI / CD publish
- CLI
    - add help / version