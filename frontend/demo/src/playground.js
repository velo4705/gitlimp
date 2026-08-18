import './style.css';
import '../../src/hljs-theme.css';
import 'github-markdown-css';
import 'katex/dist/katex.min.css';
import 'markdown-it-github-alerts/styles/github-base.css';
import 'markdown-it-github-alerts/styles/github-colors-light.css';
import 'markdown-it-github-alerts/styles/github-colors-dark-media.css';

import {md, renderMermaid} from '../../src/markdown';
import {installMock, mockApp, downloadAssetURL, detectOSName} from './mock';

import playgroundMd from '../samples/playground.md?raw';
import cheatsheetMd from '../samples/cheatsheet.md?raw';

installMock();

const SAMPLES = {
    playground: {name: 'Playground', content: playgroundMd},
    cheatsheet: {name: 'Cheat Sheet', content: cheatsheetMd},
};

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const statusText = document.getElementById('status-text');
const versionText = document.getElementById('version-text');
const sampleDropdown = document.getElementById('sample-dropdown');
const openBtn = document.getElementById('open-btn');
const fileInput = document.getElementById('file-input');
const starBtn = document.getElementById('star-btn');
const downloadBtn = document.getElementById('download-btn');

let debounceTimer = null;
let currentSample = 'playground';

async function render() {
    const article = preview.querySelector('.markdown-body');
    const atBottom = preview.scrollTop + preview.clientHeight >= preview.scrollHeight - 50;
    const raw = md.render(editor.value);
    article.innerHTML = raw;
    article.querySelectorAll('a[href]').forEach(a => {
        if (!a.title) a.title = a.getAttribute('href');
    });
    await renderMermaid();
    if (atBottom) preview.scrollTop = preview.scrollHeight;
}

function scheduleRender() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 150);
}

function loadSample(key) {
    const sample = SAMPLES[key];
    if (!sample) return;
    currentSample = key;
    editor.value = sample.content;
    statusText.textContent = 'Loaded sample: ' + sample.name;
    render();
}

async function loadLocalFile(file) {
    if (!file) return;
    const text = await file.text();
    editor.value = text;
    currentSample = null;
    statusText.textContent = 'Opened ' + file.name + ' — edit to preview live';
    render();
}

function setStatus(message) {
    statusText.textContent = message;
}

editor.addEventListener('input', scheduleRender);
editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.slice(0, start) + '  ' + editor.value.slice(end);
        editor.selectionStart = editor.selectionEnd = start + 2;
    }
});

sampleDropdown.addEventListener('change', () => loadSample(sampleDropdown.value));

openBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    loadLocalFile(fileInput.files[0]);
    fileInput.value = '';
});

starBtn.addEventListener('click', () => {
    window.open('https://github.com/velo4705/gitlimp', '_blank', 'noopener');
    setStatus('Thanks for the star!');
});

downloadBtn.addEventListener('click', () => {
    window.open(downloadAssetURL(), '_blank', 'noopener');
    setStatus('Opening download for ' + detectOSName() + '...');
});

// External links in the preview open in a new tab.
preview.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && /^https?:\/\//i.test(href)) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener');
    }
});

(async () => {
    const version = await mockApp.GetVersion();
    versionText.textContent = 'GitLiMP v' + version;
    setStatus('Ready — edit markdown to preview live');
    loadSample(currentSample);
})();