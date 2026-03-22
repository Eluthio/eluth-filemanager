import FileManager from './FileManager.vue'

if (!window.__EluthPlugins) window.__EluthPlugins = {}
window.__EluthPlugins['file-manager'] = {
    zones:    ['topmenu'],
    tabLabel: 'Files',
    component: FileManager,
}
