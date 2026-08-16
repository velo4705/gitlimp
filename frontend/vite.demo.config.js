import {defineConfig} from 'vite';
import {resolve} from 'path';

// Builds the GitLiMP web playground for GitHub Pages (project page).
// Source lives in frontend/demo/, output goes to docs/ for Pages to serve.
export default defineConfig({
    root: resolve(__dirname, 'demo'),
    base: '/gitlimp/',
    build: {
        outDir: resolve(__dirname, '../docs'),
        emptyOutDir: true,
        assetsDir: 'assets',
    },
    server: {
        port: 5180,
    },
    publicDir: resolve(__dirname, 'demo/public'),
});