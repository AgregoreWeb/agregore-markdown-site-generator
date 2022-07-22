#!/usr/bin/env node
import { renderFolder } from './index.js'
import { createInterface } from 'readline'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const flags = process.argv.filter(arg => arg.startsWith('--'))
const args = process.argv.filter(arg => !arg.startsWith('--'))

const folder = args[2] && args[2] !== '.' ? args[2] : process.cwd()
const output = args[3] && args[3] !== '.' ? args[3] : folder

const linkStylesheet = flags.filter(arg => arg === '--link-stylesheets').length > 0 ? true : false
console.warn(`--link-stylesheets=${linkStylesheet}`)

if (!(args[2] && args[3])) {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  const prompt = question => new Promise((resolve) => readline.question(question, resolve))
  const questions = [
    `./default.css ./theme.css --link-stylesheets=${linkStylesheet} okay?  y/n? `,
    `input  directory okay? ${folder}  y/n? `,
    `output directory okay? ${output}  y/n? `
  ]
  for (const question of questions) {
    const answer = await prompt(question)
    if (answer.toLowerCase() !== 'y') abort()
  }
  readline.close()

  function abort() {
    console.log('aborted.')
    readline.close()
    process.exit(1)
  }
}

console.log(`converting markdown from ${folder} ...`)
await renderFolder(folder, output, { linkStylesheet })

if (linkStylesheet) await writeCssFile(folder, output, 'default')

console.log(`html written to ${output}`)
process.exit(0)

async function writeCssFile(folder, output, filename) {
  try {
    const css = await readFile(join(folder, `${filename}.css`), 'utf8')
    const filepath = join(output, `${filename}.css`)
    await writeFile(filepath, css)
    console.log()
    console.log(`Saved css file to ${filepath}`)
  } catch {
    console.warn(`Error writing ${filename}.css to ${output}`)
  }
}
