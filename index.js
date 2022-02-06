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

export const DEFAULT_THEME_STYLES = {
  ':root': {
    '--ag-color-purple': '#6e2de5',
    '--ag-color-black': '#111',
    '--ag-color-white': '#F2F2F2',
    '--ag-color-green': '#2de56e',
    '--ag-theme-font-family': 'system-ui',
    '--ag-theme-background': 'var(--ag-color-black)',
    '--ag-theme-text': 'var(--ag-color-white)',
    '--ag-theme-primary': 'var(--ag-color-purple)',
    '--ag-theme-secondary': 'var(--ag-color-green)',
    '--ag-theme-indent': '16px',
    '--ag-theme-max-width': '666px',
    'font-family': 'system-ui'
  },
  'html,body,input,button': {
    background: 'var(--ag-theme-background)',
    color: 'var(--ag-theme-text)',
    fontFamily: 'var(--ag-theme-font-family)'
  },

  body: {
    padding: '1em',
    maxWidth: 'var(--ag-theme-max-width)',
    margin: '0 auto'
  },

  a: {
    color: 'var(--ag-theme-secondary)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--ag-theme-primary)'
  },

  'a:visited': {
    color: 'var(--ag-theme-primary)'
  },

  img: {
    width: '80%',
    display: 'block',
    margin: '1em auto'
  },

  iframe: {
    display: 'block',
    margin: '1em auto'
  },

  code: {
    background: 'var(--ag-theme-primary)',
    fontWeight: 'bold',
    padding: '0.25em'
  },

  br: {
    display: 'none'
  },

  li: {
    listStyleType: '" ⟐ "'
  },

  hr: {
    borderColor: 'var(--ag-theme-primary)'
  },

  '*:focus': {
    outline: '2px solid var(--ag-theme-secondary)'
  },

  h1: {
    textAlign: 'center'
  },

  /* Reset style for anchors added to headers */
  'h2 a, h3 a, h4 a': {
    color: 'var(--ag-theme-text)',
    textDecoration: 'none'
  },

  'h1 a': {
    color: 'var(--ag-theme-primary)',
    textDecoration: 'none'
  },

  'h1:hover::after, h2:hover::after, h3:hover::after, h4:hover::after': {
    textDecoration: 'none !important'
  },
  'h2::before': {
    content: '"## "',
    color: 'var(--ag-theme-secondary)'
  },
  'h3::before': {
    content: '"### "',
    color: 'var(--ag-theme-secondary)'
  },
  'h4::before': {
    content: '"#### "',
    color: 'var(--ag-theme-secondary)'
  }
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
    /** skip node_modules */
    if (path.startsWith('node_modules')) continue
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
  ${themeToStyle(DEFAULT_THEME_STYLES)}
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

function mapToCSS (obj = {}, newline = true) {
  return Object.entries(obj).map(([key, value]) => `${newline ? '  ' : ''}${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}:${value}`).join(`${newline ? ';\n' : ';'}`)
}

export function themeToStyle (theme = {}, newline = true) {
  return Object.entries(theme).reduce((css, [selector, styles]) => {
    css += `${selector} ${newline ? '{\n' : '{'}${mapToCSS(styles, newline)}${newline ? '\n}' : '}'}${newline ? '\n\n' : ''}`
    return css
  }, '')
}
