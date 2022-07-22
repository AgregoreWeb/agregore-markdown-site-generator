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

You can optionally add a flag to link `default.css` in the head tag of each file instead of inlining css.

`npx agregore-markdown-site-generator --link-stylesheets ./input ./output`

You can also optionally specify a `theme.css` file to customize the theme for the generated HTML files.
This file has the following css variables defined and is inlined into each html file. 
As it's loaded after the other css it overrides the default variables.

```css
:root {
  --ag-color-purple: #6e2de5;
  --ag-color-black: #111;
  --ag-color-white: #F2F2F2;
  --ag-color-green: #2de56e;
}

:root {
  --ag-theme-font-family: system-ui;
  --ag-theme-background: var(--ag-color-black);
  --ag-theme-text: var(--ag-color-white);
  --ag-theme-primary: var(--ag-color-purple);
  --ag-theme-secondary: var(--ag-color-green);
  --ag-theme-indent: 16px;
  --ag-theme-max-width: 666px;
}
```
