#!/usr/bin/env node
import { renderFolder } from './index.js'

const folder = process.argv[2] || process.cwd()
const output = process.argv[3] || folder

renderFolder(folder, output)
