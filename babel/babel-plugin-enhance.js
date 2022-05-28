const { parse } = require('path')

const EXPECTED_EXPORTS = ['ENHANCER', 'THE_FUNCTION']

module.exports = function ({ types: t }) {
  let exportNames = []
  let hasDefaultExport = false
  let enhancer = ''

  return {
    visitor: {
      ExportDefaultDeclaration() {
        hasDefaultExport = true
        return
      },
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration

        if (!declaration) {
          return
        }

        let name
        if (declaration.type === 'VariableDeclaration') {
          const id = declaration.declarations[0].id
          name = id.name
          if (name === 'ENHANCER') {
            const init = declaration.declarations[0].init
            enhancer = init.value
          }
        }
        if (declaration.type === 'FunctionDeclaration') {
          name = declaration?.id?.name
        }

        if (name && EXPECTED_EXPORTS.includes(name)) {
          exportNames.push(name)
        }
      },
      Program: {
        exit(path) {
          if (
            hasDefaultExport ||
            !exportNames.includes('ENHANCER') ||
            !enhancer
          ) {
            return
          }

          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('enhancer'),
                  t.identifier('enhancer')
                ),
              ],
              t.stringLiteral(`../enhancers/${enhancer}`)
            )
          )

          // Insert at the bottom of the file:
          path.node.body.push(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('enhancer'), [
                t.objectExpression([
                  ...exportNames.map((name) =>
                    t.objectProperty(
                      t.identifier(name),
                      t.identifier(name),
                      false,
                      true
                    )
                  ),
                  /**
                   * Add the `displayName` property
                   * so we can name the Cell after the filename.
                   */
                  t.objectProperty(
                    t.identifier('displayName'),
                    t.stringLiteral(parse(this.file.opts.filename).name),
                    false,
                    true
                  ),
                ]),
              ])
            )
          )

          hasDefaultExport = false
          exportNames = []
        },
      },
    },
  }
}
