import { fileURLToPath } from 'node:url'
import { join, dirname, resolve, relative } from 'node:path'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { lexer, parser } from 'marked'
import { fromMarkdown as toGemtext } from 'markdown-to-gemtext'
import glob from 'it-glob'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

export const DEFAULT_THEME = {
  'font-family': 'system-ui',
  background: '#111111',
  text: '#F2F2F2',
  primary: '#6e2de5',
  secondary: '#2de56e',
  indent: '16px',
  'max-width': '666px',
  borderRadius: '0.25em'
}

/**
 * Build all mardown files in a folder into HTML files
 * @param {string} folder Folder to read markdown from
 * @param {string} output Folder to write output HTML and GMI to
 * @param {typeof DEFAULT_THEME} theme Custom theme vars
 */
export async function renderFolder (folder, output = folder, theme = DEFAULT_THEME) {
  let finalTheme = theme
  try {
    const themeContent = await readFile(join(folder, 'theme.json'), 'utf8')
    const themeJSON = JSON.parse(themeContent)
    finalTheme = { ...theme, ...themeJSON }
    console.log('Pulled custom theme.json out')
  } catch {
    console.warn('No valid `theme.json` found, using defaults')
  }

  const cssFilePath = resolve(output, 'style.css')
  const cssFileExists = await stat(cssFilePath)
    .then(() => true, () => false)

  if (!cssFileExists) {
    console.log('Write style path', cssFilePath)
    const defaultStylePath = join(__dirname, 'style.css')
    const defaultStyle = await readFile(defaultStylePath, 'utf8')
    await mkdir(output, { recursive: true })
    await writeFile(cssFilePath, defaultStyle)
  }

  for await (const path of glob(folder, '**/*.md')) {
    const fileName = path.slice(0, -3)
    const filePath = join(folder, path)
    const cssRelative = relative(filePath, cssFilePath)
    console.log('Rendering', path)

    const markdown = await readFile(filePath, 'utf8')
    const tokens = lexer(markdown)
    const html = renderHTML(tokens, fileName, cssRelative, finalTheme)

    const htmlPath = join(output, fileName + '.html')

    console.log('Saving to', htmlPath)
    await mkdir(dirname(htmlPath), { recursive: true })
    await writeFile(htmlPath, html)

    console.log('Rendering .gmi')

    try {
      const gemtext = toGemtext(markdown)
      const geminiPath = join(output, fileName + '.gmi')
      await writeFile(geminiPath, gemtext)
    } catch (e) {
      // @ts-ignore
      console.log('Failed to render gemtext', e.stack)
    }
  }
}

export function renderHTML (tokens, fileName, cssLocation, theme = DEFAULT_THEME) {
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
@import url("browser://theme/vars.css");
@import url("agregore://theme/vars.css");
@import url("${cssLocation}");

/* Hardcode the theme, should be overriden by Agregore theme vars*/
:root {
  --theme-font-family: var(--browser-theme-font-family, ${theme['font-family']});
  --theme-background: var(--browser-theme-background, ${theme.background});
  --theme-page-background: var(--browser-theme-page-background, ${theme.background});
  --theme-text-color: var(--browser-theme-text-color, ${theme.text});
  --theme-primary-highlight: var(--browser-theme-primary-highlight, ${theme.primary});
  --theme-secondary-highlight: var(--browser-theme-secondary-highlight, ${theme.secondary});
  --theme-indent: var(--browser-theme-indent, ${theme.indent});
  --theme-border-radius: var(--browser-theme-border-radius, ${theme.borderRadius});
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
