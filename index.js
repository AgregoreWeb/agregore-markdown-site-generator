import { lexer, parser } from 'marked'
import glob from 'it-glob'
import { join, dirname } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'

export const DEFAULT_THEME = {
  'font-family': 'system-ui',
  background: 'var(--ag-color-black)',
  text: 'var(--ag-color-white)',
  primary: 'var(--ag-color-purple)',
  secondary: 'var(--ag-color-green)',
  indent: '16px',
  'max-width': '666px'
}

export async function renderFolder (folder, output = folder, theme = DEFAULT_THEME) {
  let finalTheme = theme
  try {
    const themeContent = await readFile(join(folder, 'theme.json'), 'utf8')
    const themeJSON = JSON.parse(themeContent)
    finalTheme = { ...theme, ...themeJSON }
  } catch {
    console.warn('No valid `theme.css` found, using defaults')
  }

  for await (const path of glob(folder, '**/*.md')) {
    const fileName = path.slice(0, -3)
    console.log('Rendering', path, fileName)

    const markdown = await readFile(join(folder, path), 'utf8')
    const html = renderMarkdown(markdown, fileName, finalTheme)

    const htmlPath = join(output, fileName + '.html')

    console.log('Saving to', htmlPath)
    await mkdir(dirname(htmlPath), { recursive: true })
    await writeFile(htmlPath, html)
  }
}

export function renderMarkdown (markdown, fileName, theme = DEFAULT_THEME) {
  const tokens = lexer(markdown)
  const rendered = parser(tokens)

  const firstHeading = tokens.find((token) => token.type === 'heading')
  const title = firstHeading?.text || fileName

  const firstParagraph = tokens.find(({ type }) => type === 'paragraph')
  const description = firstParagraph?.text ?? ''

  return `<!DOCTYPE html>
<title>${title}</title>
<meta charset="utf-8"/>
<meta http-equiv="Content-Type" content="text/html charset=utf-8"/>
<link rel="icon" type="image/svg+xml" href="./icon.svg"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="description" content="${description}">
<style>
/* Hardcode the theme, should be overriden by Agregore theme vars*/
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
</style>
<style>
@charset "utf-8";
@import url("agregore://theme/vars.css");

* {
  box-sizing: border-box;
}

html {
  background: var(--ag-theme-background);
  color: var(--ag-theme-text);
  font-family: var(--ag-theme-font-family);
  font-size: inherit;
}

body {
  padding: 1em;
}

body > p,
body > a,
body > pre,
body > li,
body > ul,
body > table,
body > img,
body > form,
body > iframe,
body > video,
body > audio,
body > h1,
body > h2,
body > h3,
body > h4,
body > h5,
body > h6 {
  max-width: var(--ag-theme-max-width);
  margin-left: auto;
  margin-right: auto;
  display: block;
}

input, button, textarea, select, select *, option  {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  background: none;
  padding:0.5em;
  border-radius: 0.25em;
}

textarea {
 width : 100%;
 resize: vertical;
 margin: 1em auto;
}

select option {
  background: var(--ag-theme-background);
  color: var(--ag-theme-text);
}

input, button, textarea, select, select *, video, dialog {
  border: 1px solid var(--ag-theme-primary);
}

fieldset {
  border: 1px solid var(--ag-theme-secondary);
}

dialog {
  background: var(--ag-theme-background);
  color: var(--ag-theme-text);
  width: 80vw;
  height: 80vh;
}

*::selection, option:hover {
    background: var(--ag-theme-primary);
    color: var(--ag-theme-text);
}

a {
  color: var(--ag-theme-secondary);
  text-decoration: underline;
  text-decoration-color: var(--ag-theme-primary);
}

a:hover {
    color: var(--ag-theme-background);
    background-color: var(--ag-theme-secondary);
    text-decoration: none;
}

a:visited {
	color: var(--ag-theme-primary);
}

img, video, svg, object, audio {
  width: 80%;
  display: block;
  margin: 1em auto;
}

iframe {
  display: block;
  margin: 1em auto;
  width: 100%;
  border: none;
}

pre {
  background: var(--ag-theme-primary);
}

code {
  background: var(--ag-theme-primary);
  font-weight: bold;
  padding: 0.25em;
}

blockquote {
  border-left: 1px solid var(--ag-theme-primary);
  margin: 1em;
  padding-left: 1em;
}

blockquote > *::before {
  content: "> ";
  color: var(--ag-theme-secondary);
}

pre > code {
  display: block;
  padding: 0.5em;
}

br {
  display: none;
}

li {
  list-style-type: " ⟐ ";
}

hr {
  border-color: var(--ag-theme-primary);
}

*:focus {
  outline: 2px solid var(--ag-theme-secondary);
}

h1 {
  text-align: center;
}

/* Reset style for anchors added to headers */
h2 a, h3 a, h4 a {
  color: var(--ag-theme-text);
  text-decoration: none;
}

h1 a {
  color: var(--ag-theme-primary);
  text-decoration: none;
}

h1:hover::after, h2:hover::after, h3:hover::after, h4:hover::after {
  text-decoration: none !important;
}
h2::before {
  content: "## ";
  color: var(--ag-theme-secondary)
}
h3::before {
  content: "### ";
  color: var(--ag-theme-secondary)
}
h4::before {
  content: "#### ";
  color: var(--ag-theme-secondary)
}

*::-webkit-scrollbar {
    width: 1em;
}

*::-webkit-scrollbar-corner {
    background: rgba(0,0,0,0);
}

*::-webkit-scrollbar-thumb {
    background-color: var(--ag-theme-primary);
    border: 2px solid transparent;
    background-clip: content-box;
}
*::-webkit-scrollbar-track {
    background-color: rgba(0,0,0,0);
}


audio::-webkit-media-controls-mute-button,
audio::-webkit-media-controls-play-button,
audio::-webkit-media-controls-timeline-container,
audio::-webkit-media-controls-current-time-display,
audio::-webkit-media-controls-time-remaining-display,
audio::-webkit-media-controls-timeline,
audio::-webkit-media-controls-volume-slider-container,
audio::-webkit-media-controls-volume-slider,
audio::-webkit-media-controls-seek-back-button,
audio::-webkit-media-controls-seek-forward-button,
audio::-webkit-media-controls-fullscreen-button,
audio::-webkit-media-controls-rewind-button,
audio::-webkit-media-controls-return-to-realtime-button,
audio::-webkit-media-controls-toggle-closed-captions-button
{
border: none;
border-radius: none;
}

audio::-webkit-media-controls-timeline
{
  background: var(--ag-theme-primary);
  margin: 0px 1em;
  border-radius: none;
}

audio::-webkit-media-controls-panel {
  background: var(--ag-theme-background);
  color: var(--ag-theme-text);
  font-family: var(--ag-theme-font-family);
  font-size: inherit;
  border-radius: none;
}
</style>
${rendered}
<script>
  const toAnchor = document.querySelectorAll('h1[id],h2[id],h3[id],h4[id]')

  for(let element of toAnchor) {
    const anchor = document.createElement('a')
    anchor.setAttribute('href', '#' + element.id)
    anchor.setAttribute('class', 'agregore-header-anchor')
    anchor.innerHTML = element.innerHTML
    element.innerHTML = anchor.outerHTML
  }
</script>`
}
