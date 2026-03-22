import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry:    'src/index.js',
            formats:  ['iife'],
            name:     'EluthFileManager',
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: { vue: 'Vue' },
                inlineDynamicImports: true,
            },
        },
        outDir:   'dist',
        minify:   true,
        cssCodeSplit: false,
    },
})
