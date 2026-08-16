import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import footnote from 'markdown-it-footnote';
import {full as emoji} from 'markdown-it-emoji';
import githubAlerts from 'markdown-it-github-alerts';
import anchor from 'markdown-it-anchor';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import mermaid from 'mermaid';

const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    highlight: function(str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' + hljs.highlight(str, {language: lang, ignoreIllegals: true}).value + '</code></pre>';
            } catch (e) { /* fall through */ }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    },
});
md.use(taskLists);
md.use(footnote);
md.use(emoji);
md.use(githubAlerts);
md.use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({symbol: '#'}),
});
md.use(texmath, {engine: katex, delimiters: 'dollars'});

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    htmlLabels: false,
    flowchart: {htmlLabels: false},
    themeVariables: {
        primaryColor: '#1f2937',
        primaryTextColor: '#f0f6fc',
        primaryBorderColor: '#6e7681',
        lineColor: '#8b949e',
        secondaryColor: '#161b22',
        tertiaryColor: '#21262d',
        edgeLabelBackground: '#1c2128',
        labelBackground: '#1c2128',
    },
});

// --- Mermaid ---
// Intercept ```mermaid fences and emit placeholder divs; render diagrams async
// after the article is inserted into the DOM.
let mermaidSeq = 0;
const pendingMermaid = [];
const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};
md.renderer.rules.fence = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
    if (info === 'mermaid') {
        const id = 'mermaid-' + (mermaidSeq++);
        pendingMermaid.push({id, code: token.content});
        return `<div class="mermaid" id="${id}"></div>\n`;
    }
    return defaultFence(tokens, idx, options, env, self);
};

async function renderMermaid() {
    while (pendingMermaid.length) {
        const {id, code} = pendingMermaid.shift();
        const el = document.getElementById(id);
        if (!el) continue;
        try {
            const renderId = 'mermaid-render-' + id;
            const {svg} = await mermaid.render(renderId, code);
            el.innerHTML = svg;
            const leftovers = document.getElementById('d' + renderId);
            if (leftovers) leftovers.remove();
        } catch (err) {
            el.innerHTML = '<div class="mermaid-error">Mermaid render failed: ' + md.utils.escapeHtml(String(err && err.message || err)) + '</div>';
        }
    }
}

export {md, renderMermaid};