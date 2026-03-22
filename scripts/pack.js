import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const dist = 'dist'

// Sync version from package.json into plugin.json
const pkg    = JSON.parse(readFileSync('package.json', 'utf8'))
const plugin = JSON.parse(readFileSync('plugin.json', 'utf8'))
if (plugin.version !== pkg.version) {
    plugin.version = pkg.version
    writeFileSync('plugin.json', JSON.stringify(plugin, null, 2) + '\n')
    console.log(`✓ plugin.json version synced to ${pkg.version}`)
}

// Inline CSS into the IIFE
const cssFiles = readdirSync(dist).filter(f => f.endsWith('.css'))
const css = cssFiles.map(f => readFileSync(join(dist, f), 'utf8')).join('\n')
const js  = readFileSync(join(dist, 'index.js'), 'utf8')

const cssInjection = css
    ? `;(function(){var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);})();\n`
    : ''

writeFileSync(join(dist, 'index.js'), cssInjection + js)
console.log('✓ CSS inlined into dist/index.js')
