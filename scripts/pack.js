import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const dist = 'dist'
const cssFiles = readdirSync(dist).filter(f => f.endsWith('.css'))
const css = cssFiles.map(f => readFileSync(join(dist, f), 'utf8')).join('\n')

const js = readFileSync(join(dist, 'index.js'), 'utf8')

// Prepend a CSS injection snippet to the IIFE
const cssInjection = css
    ? `;(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})();\n`
    : ''

writeFileSync(join(dist, 'index.js'), cssInjection + js)
console.log('✓ CSS inlined into dist/index.js')
