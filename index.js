import { fileURLToPath } from 'node:url'
import { join, dirname, resolve, relative } from 'node:path'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { lexer, parser } from 'marked'
import glob from 'it-glob'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

export const DEFAULT_THEME = {
  'font-family': 'system-ui',
  background: '#111111',
  text: '#F2F2F2',
  primary: '#6e2de5',
  secondary: '#2de56e',
  indent: '16px',
  'max-width': '666px'
}

export async function renderFolder (folder, output = folder, theme = DEFAULT_THEME) {
  let finalTheme = theme
  try {
    const themeContent = await readFile(join(folder, 'theme.json'), 'utf8')
    const themeJSON = JSON.parse(themeContent)
    finalTheme = { ...theme, ...themeJSON }
    console.log("Pulled custom theme.json out")
  } catch {
    console.warn('No valid `theme.json` found, using defaults')
  }

  const cssFilePath = resolve(folder, 'style.css')
  const cssFileExists = await stat(cssFilePath)
    .then(() => true, () => false)

  if (!cssFileExists) {
    console.log('Write style path', cssFilePath)
    const defaultStylePath = join(__dirname, 'style.css')
    const defaultStyle = await readFile(defaultStylePath, 'utf8')
    await writeFile(cssFilePath, defaultStyle)
  }

  for await (const path of glob(folder, '**/*.md')) {
    const fileName = path.slice(0, -3)
    const filePath = join(folder, path)
    const cssRelative = relative(filePath, cssFilePath)
    console.log('Rendering', path)

    const markdown = await readFile(filePath, 'utf8')
    const html = renderMarkdown(markdown, fileName, cssRelative, finalTheme)

    const htmlPath = join(output, fileName + '.html')

    console.log('Saving to', htmlPath)
    await mkdir(dirname(htmlPath), { recursive: true })
    await writeFile(htmlPath, html)
  }
}

export function renderMarkdown (markdown, fileName, cssLocation, theme = DEFAULT_THEME) {
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
@charset "utf-8";
@import url("agregore://theme/vars.css");
@import url("${cssLocation}");

/* Hardcode the theme, should be overriden by Agregore theme vars*/
:root {
  --theme-font-family: var(--ag-theme-font-family, ${theme['font-family']});
  --theme-background: var(--ag-theme-background, ${theme.background});
  --theme-text: var(--ag-theme-text, ${theme.text});
  --theme-primary: var(--ag-theme-primary, ${theme.primary});
  --theme-secondary: var(--ag-theme-secondary, ${theme.secondary});
  --theme-indent: var(--ag-theme-indent, ${theme.indent});
  --theme-max-width: var(--ag-theme-max-width, ${theme['max-width']});
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
