const { parse } = require('path')

const EXPECTED_EXPORTS_FROM_CELL = ['MESSAGE']

module.exports = function ({ types: t }) {
  let exportNames = []
  let hasDefaultExport = false

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
        }
        if (declaration.type === 'FunctionDeclaration') {
          name = declaration?.id?.name
        }

        if (name && EXPECTED_EXPORTS_FROM_CELL.includes(name)) {
          exportNames.push(name)
        }
      },
      Program: {
        exit(path) {
          if (hasDefaultExport || !exportNames.includes('MESSAGE')) {
            return
          }

          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('createCellLike'),
                  t.identifier('createCellLike')
                ),
              ],
              t.stringLiteral('../createCellLike')
            )
          )

          // Insert at the bottom of the file:
          // + export default createCell({ QUERY?, Loading?, Succes?, Failure?, Empty?, beforeQuery?, isEmpty, afterQuery?, displayName? })
          path.node.body.push(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('createCellLike'), [
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
