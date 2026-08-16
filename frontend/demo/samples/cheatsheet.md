# Markdown Cheat Sheet

A quick reference to the markdown features GitLiMP previews. Everything below renders exactly as it would on GitHub.

---

## Headings

Create headings with 1–6 `#` symbols.

```
# H1
## H2
### H3
```

## Emphasis

| Markup | Result |
|:-------|:-------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `**bold and _nested_**` | **bold and _nested_** |
| `` `inline code` `` | `inline code` |

## Lists

Unordered:

- Item one
- Item two
  - Nested item
- Item three

Ordered:

1. First
2. Second
3. Third

## Links

[GitLiMP on GitHub](https://github.com/velo4705/gitlimp) · bare URLs autolink: https://github.com/velo4705/gitlimp

## Images

![Octocat](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

## Code blocks

Use fenced blocks with a language tag for syntax highlighting:

```javascript
const greeting = (name) => `Hello, ${name}!`;
console.log(greeting('GitLiMP'));
```

## Tables

| Syntax | Description |
|:-------|:------------|
| Header | Title |
| Paragraph | Text |

## Blockquotes

> This is a blockquote. GitLiMP renders it exactly like GitHub does.
>
> Second paragraph of the quote.

## Task lists

- [x] Write the cheat sheet
- [x] Verify rendering
- [ ] Commit changes

## Horizontal rules

Three dashes create a divider:

---

## GitHub alerts

> [!TIP]
> Hover any heading to reveal a `#` anchor link, just like on GitHub.

> [!WARNING]
> Alert syntax requires `markdown-it-github-alerts` — bundled in GitLiMP.