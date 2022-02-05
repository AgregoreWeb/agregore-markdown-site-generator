# agregore-markdown-site-generator

Generate static HTML websites from markdown using the same style as Agregore's markdown extension


## Features

- Renders Github Flavored Markdown
- The first `heading` is used as the HTML document title
- The first `paragraph` is used as the HTML document `description` meta tag
- Headings get IDs added to them
- JavaScript attaches anchros to headings so you can click them to add the link to the URL
- Agregore's CSS theme variables get loaded at runtime (if applicable) so users themes get automatically applied.

## Usage

You can render out all `.md` files a directory using the CLI tool and npx.

`npx agregore-markdown-site-generator ./`

You can optionally specify a second parameter for the output directory.

`npx agregore-markdown-site-generator ./input ./output`

You can also optionally specify a `theme.json` file to customizing the them for the generated HTML files.

```json
{
  "font-family": "system-ui",
  "background": "var(--ag-color-black)",
  "text": "var(--ag-color-white)",
  "primary": "var(--ag-color-purple)",
  "secondary": "var(--ag-color-green)",
  "indent": "16px",
  "max-width": "666px"
}
```
