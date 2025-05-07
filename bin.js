#!/usr/bin/env node
import { resolve } from 'node:path'
import { renderFolder } from './index.js'

const folder = process.argv[2] || process.cwd()
const output = process.argv[3] || folder

renderFolder(
  resolve(process.cwd(), folder),
  resolve(process.cwd(), output)
)
