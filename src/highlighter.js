const vscode = require('vscode')
const { MARKER } = require('./dictionary')

const HIGHLIGHTING_GROUPS = {
  marker: {
    tokenType: 'operator',
    tokenModifiers: ['declaration']
  },
  subject: {
    tokenType: 'variable',
    tokenModifiers: ['declaration']
  },
  action: {
    tokenType: 'keyword',
    tokenModifiers: ['declaration']
  },
  object: {
    tokenType: 'namespace',
    tokenModifiers: ['declaration']
  },
  descriptor: {
    tokenType: 'number',
    tokenModifiers: ['declaration']
  }
}

function generateSemanticTokens(classifiedWords, block, document, tokensBuilder) {
  const prompt = block[0]
  const categories = Object.entries(classifiedWords)

  for (const [category, words] of categories) {
    const matches = prompt.matchAll(getRegexForCategoryWords(category, words))

    for (const match of matches) {
      // Get the exact word from the match
      const keyword =
        typeof match[0] === 'string' && match[0].length > (match[1] || '').length
          ? match[0]
          : match[1]

      // Get index of word in matched string
      const appendix = (match[0] || '').indexOf(keyword)

      // Get the index of word in the prompt (source string)
      const matchStart =
        appendix !== -1 ? block.index + match.index + appendix : block.index + match.index

      // Get the exact positions in the document
      const startPos = document.positionAt(matchStart)
      const endPos = document.positionAt(matchStart + keyword.length)

      // Generate semantic token
      tokensBuilder.push(
        new vscode.Range(
          new vscode.Position(startPos.c, startPos.e),
          new vscode.Position(endPos.c, endPos.e)
        ),
        // Makes words from the corresponding classes look like their tokenType and tokenModifier
        HIGHLIGHTING_GROUPS[category].tokenType,
        HIGHLIGHTING_GROUPS[category].tokenModifiers
      )
    }
  }
}

function getRegexForCategoryWords(category, words) {
  return category === 'marker'
    ? new RegExp(`${MARKER}.*?`, 'gi')
    : new RegExp(`\\b(${words.join('|')})(s|\'s)?\\b`, 'gi')
}

module.exports = { generateSemanticTokens, getRegexForCategoryWords, HIGHLIGHTING_GROUPS }
