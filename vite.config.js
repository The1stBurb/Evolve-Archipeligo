// Vite 8 requires Node.js >= 20, you'll have to update the "node": "^16.1.0", `dependencies` block in package.json
// and then run `npm install` to update your local Node.js version if you want to use Vite
// run `node --version` to check if unsure

import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { readFileSync } from 'fs';

export default defineConfig(({ mode }) => {
    // load all .env/.env.local vars regardless of VITE_ prefix
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: '/Evolve/',
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                    wiki: resolve(__dirname, 'wiki.html'),
                },
                output: {
                    // match current output paths so wiki.html references still work
                    entryFileNames: (chunk) => {
                        if (chunk.name === 'main') return 'evolve/main.js';
                        if (chunk.name === 'wiki') return 'wiki/wiki.js';
                        return 'assets/[name]-[hash].js';
                    },
                },
            },
        },
        server: {
            // host: env.VITE_DEV_HOST || 'localhost', // default to localhost, override in .env.local with VITE_DEV_HOST=
            // port: parseInt(env.VITE_DEV_PORT) || 4400, // default to existing 'serve' port, or override in .env.local with VITE_DEV_PORT=
            /* example of my .env.local file (in the project root):
            VITE_DEV_HOST=127.0.0.1
            VITE_DEV_PORT=5500
            */
           proxy: {
                '/dat': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/dat/, '')
                },
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                }
           },
        },
        resolve: {
            alias: {
                // vue: resolve(__dirname, 'src/vue-cdn-shim.js'),
            },
        },
        plugins: [
            // vue(),

            // serve the web worker from its source location (evolve/evolve.js) during dev
            {
                name: 'serve-evolve-worker',
                configureServer(server) {
                    server.middlewares.use((req, res, next) => {
                        const workerUrl = server.config.base + 'evolve/evolve.js';
                        if (req.url === workerUrl) {
                            res.setHeader('Content-Type', 'application/javascript');
                            res.end(readFileSync(resolve(__dirname, 'evolve/evolve.js')));
                        } else {
                            next();
                        }
                    });
                },
            },

            // copy over static assets that Vite doesn't bundle
            viteStaticCopy({
                targets: [
                    { src: 'evolve/evolve.js', dest: '.' }, // copy over the web worker for production builds
                    { src: 'lib', dest: '.' },
                    { src: 'font', dest: '.' },
                    { src: 'strings', dest: '.' },
                    { src: '*.ico', dest: '.' },
                    { src: 'LICENSE', dest: '.' },
                ],
            }),
        ],
    };
});