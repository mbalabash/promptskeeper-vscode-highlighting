const vscode = require('vscode')
const { MARKER, blockRegex } = require('./dictionary')
const { generateSemanticTokens } = require('./highlighter')
const { initializeTransformers, extractClassifiedWords } = require('./classification')

async function activate(context) {
  // We define that we want to provide semantic tokens for JavaScript, TypeScript, Python, and Go files
  const selector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
    { language: 'python', scheme: 'file' },
    { language: 'golang', scheme: 'file' }
  ]
  // We define the types of semantic tokens that we will provide
  const legend = new vscode.SemanticTokensLegend(
    ['operator', 'keyword', 'namespace', 'variable', 'number'],
    ['declaration']
  )
  // Initialize the model
  const classifier = await initializeTransformers()

  const provider = {
    _eventEmitter: new vscode.EventEmitter(),

    get onDidChangeSemanticTokens() {
      return this._eventEmitter.event
    },

    async provideDocumentSemanticTokens(document) {
      const tokensBuilder = new vscode.SemanticTokensBuilder(legend)

      const text = document.getText()
      const blocks = text.matchAll(blockRegex) // Finds all strings that have the marker (#!promptskeeper)

      for (let block of blocks) {
        const classifiedWords = await extractClassifiedWords(block[0], classifier)
        generateSemanticTokens(classifiedWords, block, document, tokensBuilder)
      }

      return tokensBuilder.build()
    }
  }

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend)
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      // Check if tokens should be recalculated after changing the file
      if (
        selector.some(
          s =>
            vscode.languages.match(s, event.document) && event.document.getText().includes(MARKER)
        )
      ) {
        // Signal that tokens need to be recalculated
        // This will cause VS Code to request new tokens
        provider._eventEmitter.fire()
      }
    })
  )
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
