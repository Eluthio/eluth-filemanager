<template>
    <div class="fm-wrap">
        <!-- Toolbar -->
        <div class="fm-toolbar">
            <input
                v-model="query"
                class="fm-search"
                placeholder="Search files…"
                @input="onSearch"
            />
        </div>

        <!-- Loading state -->
        <div v-if="loading && files.length === 0" class="fm-status">Loading…</div>

        <!-- Empty state -->
        <div v-else-if="!loading && files.length === 0" class="fm-status">
            No files found{{ query ? ' matching "' + query + '"' : ' in this channel' }}.
        </div>

        <!-- File grid -->
        <div v-else class="fm-grid">
            <button
                v-for="f in files"
                :key="f.url"
                class="fm-item"
                @click="selected = f"
            >
                <div class="fm-thumb">
                    <img v-if="f.type === 'image'" :src="f.url" loading="lazy" class="fm-thumb-img" />
                    <span v-else class="fm-thumb-icon">{{ iconFor(f.type) }}</span>
                </div>
                <div class="fm-name" :title="f.filename">{{ f.filename }}</div>
                <div class="fm-meta">{{ f.posted_by }}</div>
            </button>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="fm-load-more">
            <button class="fm-more-btn" :disabled="loading" @click="loadMore">
                {{ loading ? 'Loading…' : 'Load more' }}
            </button>
        </div>

        <!-- File detail overlay -->
        <Teleport to="body">
            <div v-if="selected" class="fm-overlay" @click.self="selected = null">
                <div class="fm-detail">
                    <button class="fm-detail-close" @click="selected = null">✕</button>

                    <div class="fm-detail-preview">
                        <img v-if="selected.type === 'image'" :src="selected.url" class="fm-detail-img" />
                        <div v-else class="fm-detail-icon-wrap">
                            <span class="fm-detail-icon">{{ iconFor(selected.type) }}</span>
                        </div>
                    </div>

                    <div class="fm-detail-info">
                        <div class="fm-detail-name">{{ selected.filename }}</div>
                        <div class="fm-detail-by">Posted by {{ selected.posted_by }}</div>
                    </div>

                    <div class="fm-detail-actions">
                        <button class="fm-action-btn fm-action-repost" @click="repost">
                            ↩ Re-post
                        </button>
                        <a
                            :href="selected.url"
                            :download="selected.filename"
                            class="fm-action-btn fm-action-dl"
                            @click="selected = null"
                        >↓ Download</a>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
    settings:      { type: Object, default: () => ({}) },
    apiBase:       { type: String, default: '' },
    authToken:     { type: String, default: '' },
    channelId:     { type: String, default: '' },
    currentMember: { type: Object, default: null },
})
const emit = defineEmits(['insert'])

const files    = ref([])
const loading  = ref(false)
const query    = ref('')
const page     = ref(1)
const hasMore  = ref(false)
const selected = ref(null)
let   searchTimer = null

function iconFor(type) {
    if (type === 'model') return '📦'
    if (type === 'video') return '🎬'
    return '📄'
}

async function fetchFiles(reset = false) {
    if (reset) { page.value = 1; files.value = [] }
    loading.value = true
    try {
        const token = props.authToken || localStorage.getItem('eluth_token') || ''
        const url = props.apiBase + '/plugins/file-manager/files'
            + '?channel_id=' + encodeURIComponent(props.channelId)
            + '&q=' + encodeURIComponent(query.value)
            + '&page=' + page.value
        const res  = await fetch(url, {
            headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        })
        const data = await res.json()
        files.value   = reset ? (data.files || []) : files.value.concat(data.files || [])
        hasMore.value = data.has_more || false
    } catch { /* ignore */ } finally {
        loading.value = false
    }
}

function onSearch() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => fetchFiles(true), 350)
}

function loadMore() {
    page.value++
    fetchFiles(false)
}

function repost() {
    if (!selected.value) return
    emit('insert', selected.value.url)
    selected.value = null
}

watch(() => props.channelId, () => fetchFiles(true))
onMounted(() => fetchFiles(true))
</script>

<style scoped>
.fm-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: transparent;
}
.fm-toolbar {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    flex-shrink: 0;
}
.fm-search {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 13px;
    padding: 6px 10px;
    outline: none;
    box-sizing: border-box;
}
.fm-search::placeholder { color: rgba(255,255,255,0.3); }
.fm-search:focus { border-color: var(--accent, #a78bfa); }

.fm-status {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.35);
    font-size: 13px;
}

.fm-grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    padding: 12px;
    align-content: start;
}
.fm-item {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-align: left;
    padding: 0;
}
.fm-item:hover {
    border-color: var(--accent, #a78bfa);
    background: rgba(167,139,250,0.07);
}
.fm-thumb {
    width: 100%;
    aspect-ratio: 1;
    background: rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.fm-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.fm-thumb-icon { font-size: 32px; }
.fm-name {
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    padding: 5px 7px 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.fm-meta {
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    padding: 0 7px 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.fm-load-more {
    flex-shrink: 0;
    text-align: center;
    padding: 8px;
}
.fm-more-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    padding: 5px 16px;
    cursor: pointer;
}
.fm-more-btn:hover { background: rgba(255,255,255,0.1); }
.fm-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Detail overlay */
.fm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}
.fm-detail {
    background: var(--bg-secondary, #2b2d31);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 20px;
    width: 340px;
    max-width: 90vw;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.fm-detail-close {
    position: absolute;
    top: 12px;
    right: 14px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 16px;
    cursor: pointer;
    line-height: 1;
}
.fm-detail-close:hover { color: rgba(255,255,255,0.75); }
.fm-detail-preview {
    width: 100%;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
}
.fm-detail-img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;
}
.fm-detail-icon-wrap { padding: 30px; }
.fm-detail-icon { font-size: 52px; }
.fm-detail-info { display: flex; flex-direction: column; gap: 4px; }
.fm-detail-name {
    font-size: 14px;
    font-weight: 600;
    color: #e2e8f0;
    word-break: break-all;
}
.fm-detail-by { font-size: 12px; color: rgba(255,255,255,0.4); }
.fm-detail-actions {
    display: flex;
    gap: 8px;
}
.fm-action-btn {
    flex: 1;
    padding: 8px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid transparent;
    transition: opacity 0.15s;
}
.fm-action-btn:hover { opacity: 0.85; }
.fm-action-repost {
    background: var(--accent, #a78bfa);
    color: #fff;
    border-color: transparent;
}
.fm-action-dl {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.8);
    border-color: rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
