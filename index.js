import { lexer, parser } from 'marked'
import glob from 'it-glob'
import { join, dirname } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'

export async function renderFolder(folder, output = folder, { linkStylesheet = false }) {
  const defaultcss = await readCssFile(folder, 'default')
  const theme = await readCssFile(folder, 'theme')

  for await (const path of glob(folder, '**/*.md')) {
    const fileName = path.slice(0, -3)
    console.log('Rendering', path, fileName)

    const markdown = await readFile(join(folder, path), 'utf8')
    const html = renderMarkdown(markdown, fileName, { theme, defaultcss, linkStylesheet })

    const htmlPath = join(output, fileName + '.html')

    console.log('Saving to', htmlPath)
    await mkdir(dirname(htmlPath), { recursive: true })
    await writeFile(htmlPath, html)
  }
}

export function renderMarkdown(markdown, fileName, { theme = undefined, defaultcss = undefined, linkStylesheet = false }) {
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
${linkStylesheet && defaultcss ? '<link rel="stylesheet" href="/default.css"> </link>' : ''}
<link rel="icon" type="image/svg+xml" href="./icon.svg"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="description" content="${description}">
${!linkStylesheet && defaultcss ? `<style>
/* Hardcode the theme, will be overriden by Agregore theme vars in agregore browser */
/* inlined from default.css */
${defaultcss}
</style>` : ''}
${!linkStylesheet && theme ? `<style>
/* inlined from theme.css */
${theme}
</style>` : ''}
${!theme ? `<style>
/* agregore theme loads only in agregore browser */
@import url("agregore://theme/vars.css");
</style>` : ''}

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

async function readCssFile(folder, filename) {
  try {
    const css = await readFile(join(folder, `${filename}.css`), 'utf8')
    return css
  } catch {
    console.warn(`No valid ${filename}.css found in ${folder}/${filename}.css`)
    return undefined
  }
}
