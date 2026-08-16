import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import mermaid from 'mermaid';

const md = new MarkdownIt({html: true});
md.use(texmath, {engine: katex, delimiters: 'dollars'});

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

const src = '```mermaid\ngraph TD\nA-->B\n```';
const out = md.render(src);
console.log('HTML OUTPUT:\n' + out);
console.log('PENDING:', JSON.stringify(pendingMermaid));

mermaid.initialize({startOnLoad: false, theme: 'base', securityLevel: 'loose'});
const r = await mermaid.render('mermaid-test', pendingMermaid[0].code);
console.log('MERMAID RENDER OK, svg length:', r.svg.length);