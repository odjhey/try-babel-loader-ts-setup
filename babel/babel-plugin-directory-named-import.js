const path = require('path')
const fs = require('fs')

/**
 * Use this to resolve files when the path to the file is known,
 * but the extension is not.
 */
const resolveFile = (filePath, extensions = ['.js', '.tsx', '.ts', '.jsx']) => {
  for (const extension of extensions) {
    const p = `${filePath}${extension}`
    if (fs.existsSync(p)) {
      return p
    }
  }
  return null
}

const getNewPath = (value, filename) => {
  const dirname = path.dirname(value)
  const basename = path.basename(value)

  // We try to resolve `index.[js*|ts*]` modules first,
  // since that's the desired default behaviour
  const indexImportPath = [dirname, basename, 'index'].join('/')
  if (resolveFile(path.resolve(path.dirname(filename), indexImportPath))) {
    return indexImportPath
  } else {
    // No index file found, so try to import the directory-named-module instead
    const dirnameImportPath = [dirname, basename, basename].join('/')
    if (resolveFile(path.resolve(path.dirname(filename), dirnameImportPath))) {
      return dirnameImportPath
    }
  }
  return null
}

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(p, state) {
        const { value } = p.node.source // import xyz from <value>
        const { filename } = state.file.opts // the file where this import statement resides

        // We only operate in "userland," skip node_modules.
        if (filename?.includes('/node_modules/')) {
          return
        }
        // We only need this plugin in the module could not be found.
        try {
          require.resolve(value)
          return // ABORT
        } catch {
          // CONTINUE...
        }

        const newPath = getNewPath(value, filename)
        if (!newPath) {
          return
        }
        const newSource = t.stringLiteral(newPath)
        p.node.source = newSource
      },

      ExportDeclaration(p, state) {
        // @ts-expect-error - TypeDef must be outdated.
        if (!p?.node?.source) {
          return
        }

        // @ts-expect-error - TypeDef must be outdated.
        const { value } = p.node.source
        const { filename } = state.file.opts

        // We only operate in "userland," skip node_modules.
        if (filename?.includes('/node_modules/')) {
          return
        }
        // We only need this plugin in the module could not be found.
        try {
          require.resolve(value)
          return // ABORT, since the file was resolved
        } catch {
          // CONTINUE...
        }

        const newPath = getNewPath(value, filename)
        if (!newPath) {
          return
        }
        const newSource = t.stringLiteral(newPath)
        p.node.source = newSource
      },
    },
  }
}
