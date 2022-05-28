const fg = require('fast-glob')
const fs = require('fs')
const path = require('path')
const { writeTemplate } = require('./templates')

async function generate() {
  const files = findFiles()

  const filesToGenerate = files.map((p) => {
    const mirrorDir = path.join(
      getPathMirror(),
      path.relative(getPathRoot(), path.dirname(p))
    )

    fs.mkdirSync(mirrorDir, { recursive: true })
    return [p, mirrorDir, 'index.d.ts']
  })

  filesToGenerate.map(([source, mirrorDir, typeDefFile]) => {
    generateMirrorCell(source, mirrorDir, typeDefFile)
  })
}

function generateMirrorCell(source, mirrorDir, typeDefFile) {
  const typeDefPath = path.join(mirrorDir, typeDefFile)
  const { name } = path.parse(source)

  writeTemplate('templates/mirror-cell.d.ts.template', typeDefPath, {
    name,
    queryResultType: 'any',
    queryVariablesType: 'any',
  })
}

function findFiles(cwd = getPathRoot()) {
  const modules = fg.sync('**/*-celllike.{js,jsx,ts,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules', 'dist'],
  })

  return modules // .filter(isCellFile)
}

function getPathRoot() {
  return process.cwd()
}

function getPathMirror() {
  return path.join(getPathRoot(), `.gen/types/mirror`)
}

module.exports = generate
generate()
