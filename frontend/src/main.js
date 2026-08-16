import './style.css';
import './hljs-theme.css';
import 'github-markdown-css';
import 'katex/dist/katex.min.css';
import 'markdown-it-github-alerts/styles/github-base.css';
import 'markdown-it-github-alerts/styles/github-colors-light.css';
import 'markdown-it-github-alerts/styles/github-colors-dark-media.css';
import {md, renderMermaid} from './markdown';

import {OpenFile, LoadFile, CloseTab, ResolveImagePaths, GetRecentFiles, ClearRecentFiles, GetVersion, CheckForUpdates, DownloadUpdate} from '../wailsjs/go/main/App';
import {EventsOn, BrowserOpenURL} from '../wailsjs/runtime/runtime';

// --- DOM refs ---
const openBtn = document.getElementById('open-btn');
const emptyOpenBtn = document.getElementById('empty-open-btn');
const reloadBtn = document.getElementById('reload-btn');
const splitBtn = document.getElementById('split-btn');
const recentBtn = document.getElementById('recent-btn');
const recentDropdown = document.getElementById('recent-dropdown');
const recentList = document.getElementById('recent-list');
const clearRecentBtn = document.getElementById('clear-recent-btn');
const emptyState = document.getElementById('empty-state');
const panes = document.getElementById('panes');
const paneLeft = document.getElementById('pane-left');
const paneRight = document.getElementById('pane-right');
const errorBanner = document.getElementById('error-banner');
const errorText = document.getElementById('error-text');
const errorCloseBtn = document.getElementById('error-close');
const statusText = document.getElementById('status-text');
const updateBanner = document.getElementById('update-banner');
const updateText = document.getElementById('update-text');
const updateBtn = document.getElementById('update-btn');

// --- State ---
// Each pane owns its own tab list + active tab.
const PANES = ['left', 'right'];
const paneState = {
    left: {tabs: [], activeId: null},
    right: {tabs: [], activeId: null},
};
let splitMode = null;   // null | 'h' | 'v'
let focusedPane = 'left';
let nextId = 1;
let appVersion = null;

function setStatus(text) { statusText.textContent = text; statusText.title = text; }

// --- Open links in default browser + tooltip ---
function getActiveFileDir() {
    const tab = getActiveTab(focusedPane);
    if (!tab || !tab.path) return '';
    const sep = tab.path.includes('\\') ? '\\' : '/';
    return tab.path.substring(0, tab.path.lastIndexOf(sep));
}

function resolveRelativePath(baseDir, href) {
    if (!baseDir || !href) return href;
    const sep = baseDir.includes('\\') ? '\\' : '/';
    const parts = baseDir.split(sep);
    const segs = href.replace(/\\/g, '/').split('/');
    for (const seg of segs) {
        if (seg === '.' || seg === '') continue;
        if (seg === '..') { parts.pop(); continue; }
        parts.push(seg);
    }
    return parts.join(sep);
}

document.addEventListener('click', (e) => {
    const a = e.target.closest('.markdown-body a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;                       // in-page anchor
    if (/^https?:\/\//i.test(href)) {                       // external URL
        e.preventDefault();
        BrowserOpenURL(href);
        return;
    }
    if (/\.md$/i.test(href)) {                              // cross-file markdown link
        e.preventDefault();
        const absPath = resolveRelativePath(getActiveFileDir(), href);
        LoadFile(absPath).then(file => openTab(focusedPane, file));
        return;
    }
    e.preventDefault();
    BrowserOpenURL(href);
});

function setLinkTooltips(root) {
    root.querySelectorAll('a[href]').forEach(a => {
        if (!a.title) a.title = a.getAttribute('href');
    });
}
function errMessage(err) {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') return err.message || JSON.stringify(err);
    return String(err);
}

function paneEl(pane) { return pane === 'left' ? paneLeft : paneRight; }
function tabsOf(pane) { return paneState[pane].tabs; }

function findTabGlobal(tabID) {
    for (const p of PANES) {
        const t = tabsOf(p).find(t => t.tabID === tabID);
        if (t) return {pane: p, tab: t};
    }
    return null;
}

function getActiveTab(pane) {
    return tabsOf(pane).find(t => t.id === paneState[pane].activeId) || null;
}

// --- Scroll preservation ---
function saveScrollPosition(pane) {
    const tab = getActiveTab(pane);
    if (!tab) return;
    const scroller = paneEl(pane).querySelector('.pane-content');
    if (scroller) tab.scrollTop = scroller.scrollTop;
}

// --- Rendering ---
function createPaneContent() {
    const div = document.createElement('div');
    div.className = 'pane-content';
    const article = document.createElement('article');
    article.className = 'markdown-body';
    div.appendChild(article);
    return {container: div, article};
}

function renderPane(pane) {
    const el = paneEl(pane);
    const tab = getActiveTab(pane);
    const body = el.querySelector('.pane-body');
    body.innerHTML = '';
    if (!tab) {
        body.innerHTML = '<div class="pane-empty">Select a tab</div>';
        return;
    }
    if (tab.error) {
        const errDiv = document.createElement('div');
        errDiv.className = 'pane-error';
        errDiv.textContent = tab.error;
        body.appendChild(errDiv);
        return;
    }
    const {container, article} = createPaneContent();
    body.appendChild(container);
    container.addEventListener('scroll', () => {
        tab.scrollTop = container.scrollTop;
        tab.atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
    });
    (async () => {
        const raw = md.render(tab.content);
        const html = tab.path ? await ResolveImagePaths(tab.path, raw) : raw;
        article.innerHTML = html;
        setLinkTooltips(article);
        await renderMermaid();
        container.scrollTop = tab.atBottom ? container.scrollHeight : (tab.scrollTop || 0);
    })();
}

let dragInfo = null;   // {tabId, fromPane} during a drag

function computeDropIndex(tabbar, clientX) {
    const items = [...tabbar.querySelectorAll('.tab')];
    let index = items.length;
    for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        if (clientX < r.left + r.width / 2) { index = i; break; }
    }
    return index;
}

function clearDropIndicator() {
    document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
        el.classList.remove('drop-before', 'drop-after');
    });
}

function renderTabs(pane) {
    const el = paneEl(pane);
    const tabbar = el.querySelector('.pane-tabbar');
    tabbar.innerHTML = '';
    const tabs = tabsOf(pane);
    if (tabs.length === 0) return;
    for (const tab of tabs) {
        const item = document.createElement('div');
        item.className = 'tab' + (tab.id === paneState[pane].activeId ? ' active' : '');
        item.draggable = true;
        const name = document.createElement('span');
        name.className = 'tab-name';
        name.textContent = tab.name;
        item.appendChild(name);
        if (tab.modified) {
            const dot = document.createElement('span');
            dot.className = 'tab-modified';
            item.appendChild(dot);
        }
        const close = document.createElement('button');
        close.className = 'tab-close';
        close.textContent = '×';
        close.addEventListener('click', (e) => { e.stopPropagation(); closeTab(pane, tab.id); });
        item.appendChild(close);
        item.addEventListener('click', () => { focusPane(pane); activateTab(pane, tab.id); });
        item.addEventListener('dragstart', (e) => {
            dragInfo = {tabId: tab.id, fromPane: pane};
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tab.id);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            dragInfo = null;
            item.classList.remove('dragging');
            clearDropIndicator();
        });
        item.addEventListener('dragover', (e) => { e.preventDefault(); });
        tabbar.appendChild(item);
    }
}

function focusPane(pane) {
    focusedPane = pane;
}

function moveTab(tabId, fromPane, toPane, toIndex) {
    const srcTabs = tabsOf(fromPane);
    const srcIdx = srcTabs.findIndex(t => t.id === tabId);
    if (srcIdx === -1) return;
    const tab = srcTabs[srcIdx];

    if (fromPane === toPane) {
        // Reorder within the same pane.
        srcTabs.splice(srcIdx, 1);
        let idx = toIndex;
        if (srcIdx < toIndex) idx = toIndex - 1;  // account for removal before the target
        srcTabs.splice(idx, 0, tab);
        renderTabs(fromPane);
        renderPane(fromPane);
        return;
    }

    // Cross-pane move.
    const wasActive = paneState[fromPane].activeId === tabId;
    srcTabs.splice(srcIdx, 1);
    if (wasActive) {
        paneState[fromPane].activeId = srcTabs.length > 0
            ? srcTabs[Math.min(srcIdx, srcTabs.length - 1)].id
            : null;
    }
    const destTabs = tabsOf(toPane);
    destTabs.splice(Math.min(toIndex, destTabs.length), 0, tab);
    paneState[toPane].activeId = tabId;
    renderTabs(fromPane);
    renderTabs(toPane);
    renderPane(fromPane);
    renderPane(toPane);
    focusPane(toPane);
    setStatus('Opened ' + tab.name + ' — ' + tab.path);
}

function activateTab(pane, id) {
    saveScrollPosition(pane);
    paneState[pane].activeId = id;
    renderTabs(pane);
    renderPane(pane);
    const tab = getActiveTab(pane);
    if (tab) setStatus('Opened ' + tab.name + ' — ' + tab.path);
}

// --- Tab lifecycle ---
function openTab(pane, file) {
    if (!file || typeof file !== 'object' || file.Error) {
        if (file && file.Error) showError(file.Error);
        return;
    }
    const existing = tabsOf(pane).find(t => t.path === file.Path);
    if (existing) {
        focusPane(pane);
        activateTab(pane, existing.id);
        return;
    }
    const tab = {
        id: 'tab-' + (nextId++),
        path: file.Path,
        name: file.Name,
        content: file.Content,
        error: null,
        scrollTop: 0,
        modified: false,
        tabID: file.TabID,
    };
    tabsOf(pane).push(tab);
    hideEmpty();
    focusPane(pane);
    activateTab(pane, tab.id);
    setStatus('Opened ' + file.Name + ' — ' + file.Path);
}

function closeTab(pane, id) {
    const tabs = tabsOf(pane);
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    const tab = tabs[idx];
    if (tab.tabID) CloseTab(tab.tabID);
    tabs.splice(idx, 1);
    if (paneState[pane].activeId === id) {
        paneState[pane].activeId = tabs.length > 0 ? tabs[Math.min(idx, tabs.length - 1)].id : null;
    }
    const anyTabs = PANES.some(p => tabsOf(p).length > 0);
    if (!anyTabs) {
        showEmpty();
        return;
    }
    renderTabs(pane);
    renderPane(pane);
}

function hideEmpty() {
    emptyState.classList.add('hidden');
    panes.classList.remove('hidden');
    paneLeft.classList.remove('hidden');
}

function showEmpty() {
    emptyState.classList.remove('hidden');
    panes.classList.add('hidden');
    paneLeft.classList.add('hidden');
    paneRight.classList.add('hidden');
    errorBanner.classList.add('hidden');
    for (const p of PANES) {
        paneState[p].tabs = [];
        paneState[p].activeId = null;
    }
    splitMode = null;
    focusedPane = 'left';
    panes.classList.remove('split-h', 'split-v');
    if (appVersion) setStatus(appVersion);
}

function showError(message) {
    errorText.textContent = message;
    errorBanner.classList.remove('hidden');
    emptyState.classList.add('hidden');
    panes.classList.remove('hidden');
}

// --- Split view ---
function toggleSplit() {
    if (splitMode) {
        splitMode = null;
        splitTabIdsRightReset();
        paneRight.classList.add('hidden');
        panes.classList.remove('split-h', 'split-v');
        // Focus left pane after unsplit
        focusPane('left');
        renderPane('left');
    } else {
        splitMode = 'h';
        paneRight.classList.remove('hidden');
        panes.classList.add('split-h');
        renderPane('right');
        renderTabs('right');
    }
    renderPane(focusedPane);
    renderTabs(focusedPane);
}

function splitTabIdsRightReset() {
    paneState.right.tabs = [];
    paneState.right.activeId = null;
    renderTabs('right');
}

// --- Actions ---
async function openFileAction() {
    try {
        const file = await OpenFile();
        if (file) openTab(focusedPane, file);
    } catch (err) {
        console.error(err);
        showError('Unexpected error: ' + errMessage(err));
    }
}

async function reloadAction() {
    const tab = getActiveTab(focusedPane);
    if (!tab) return;
    try {
        const file = await LoadFile(tab.path);
        if (file && typeof file === 'object' && !file.Error) {
            tab.content = file.Content;
            tab.error = null;
            renderPane(focusedPane);
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Recent files ---
async function showRecent() {
    const files = await GetRecentFiles();
    recentList.innerHTML = '';
    if (!files || files.length === 0) {
        recentList.innerHTML = '<div class="recent-empty">No recent files</div>';
    } else {
        for (const f of files) {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.innerHTML = `<span class="recent-item-name">${f.name || ''}</span><span class="recent-item-path">${f.path || ''}</span>`;
            item.addEventListener('click', async () => {
                recentDropdown.classList.add('hidden');
                try {
                    const file = await LoadFile(f.path);
                    if (file) openTab(focusedPane, file);
                } catch (err) {
                    showError(errMessage(err));
                }
            });
            recentList.appendChild(item);
        }
    }
    recentDropdown.classList.remove('hidden');
}

// --- Events ---
EventsOn('file:changed', (args) => {
    let data = Array.isArray(args) ? args[0] : args;
    if (typeof data === 'string') {
        const tab = getActiveTab(focusedPane);
        if (tab) {
            tab.content = data;
            renderPane(focusedPane);
        }
        return;
    }
    if (data && typeof data === 'object' && data.TabID) {
        const found = findTabGlobal(data.TabID);
        if (found) {
            found.tab.content = data.Content;
            found.tab.error = null;
            renderPane(found.pane);
            setStatus('Updated ' + found.tab.name + ' — ' + found.tab.path);
        }
    }
});

EventsOn('file:gone', (args) => {
    let data = Array.isArray(args) ? args[0] : args;
    let tabID = '';
    if (typeof data === 'string') tabID = data;
    else if (data && typeof data === 'object') tabID = data.TabID || '';
    const found = findTabGlobal(tabID);
    if (found) {
        found.tab.error = 'File unavailable — it was deleted or renamed.';
        found.tab.content = '';
        renderPane(found.pane);
    }
});

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); openFileAction(); }
    if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const tab = getActiveTab(focusedPane);
        if (tab) closeTab(focusedPane, tab.id);
    }
    if (e.ctrlKey && e.key === '\\') { e.preventDefault(); toggleSplit(); }
    if (e.ctrlKey && e.key === 'r') { e.preventDefault(); reloadAction(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'O') { e.preventDefault(); showRecent(); }
});

// --- Init ---
openBtn.addEventListener('click', openFileAction);
emptyOpenBtn.addEventListener('click', openFileAction);
reloadBtn.addEventListener('click', reloadAction);
splitBtn.addEventListener('click', toggleSplit);
errorCloseBtn.addEventListener('click', () => errorBanner.classList.add('hidden'));
recentBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (recentDropdown.classList.contains('hidden')) showRecent();
    else recentDropdown.classList.add('hidden');
});
clearRecentBtn.addEventListener('click', async () => {
    await ClearRecentFiles();
    recentDropdown.classList.add('hidden');
});
document.addEventListener('click', (e) => {
    if (!recentDropdown.contains(e.target) && e.target !== recentBtn) {
        recentDropdown.classList.add('hidden');
    }
});
// Focus a pane when clicking inside it
paneLeft.addEventListener('click', () => focusPane('left'));
paneRight.addEventListener('click', () => focusPane('right'));

// Pane-level drag & drop: dropping a tab anywhere in a pane (tab bar or body)
// moves it there. For the left pane in single view this is a no-op reorder.
for (const p of PANES) {
    const el = paneEl(p);
    el.addEventListener('dragover', (e) => {
        if (!dragInfo) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        clearDropIndicator();
        const tabbar = el.querySelector('.pane-tabbar');
        const index = computeDropIndex(tabbar, e.clientX);
        const items = [...tabbar.querySelectorAll('.tab')];
        if (index < items.length) items[index].classList.add('drop-before');
        else if (items.length > 0) items[items.length - 1].classList.add('drop-after');
    });
    el.addEventListener('dragleave', (e) => {
        if (!el.contains(e.relatedTarget)) clearDropIndicator();
    });
    el.addEventListener('drop', (e) => {
        e.preventDefault();
        clearDropIndicator();
        if (!dragInfo) return;
        const tabbar = el.querySelector('.pane-tabbar');
        const index = computeDropIndex(tabbar, e.clientX);
        moveTab(dragInfo.tabId, dragInfo.fromPane, p, index);
        dragInfo = null;
    });
}

// --- Version + Update Check ---
let updateURL = null;
let updating = false;

updateBtn.addEventListener('click', async () => {
    if (updating || !updateURL) return;
    updating = true;
    updateText.textContent = 'Downloading update...';
    updateBtn.disabled = true;
    try {
        await DownloadUpdate(updateURL);
    } catch (err) {
        updating = false;
        updateBtn.disabled = false;
        updateText.textContent = 'Update failed: ' + errMessage(err);
        console.error(err);
    }
});

(async () => {
    appVersion = await GetVersion();
    setStatus(appVersion || 'dev');
    const info = await CheckForUpdates();
    if (info.available && info.latest) {
        updateURL = info.download_url;
        updateText.textContent = `Update available: GitLiMP v${info.latest} → v${appVersion}. Download and restart to update.`;
        updateBtn.disabled = !updateURL;
        updateBanner.classList.remove('hidden');
    }
})();

showEmpty();
