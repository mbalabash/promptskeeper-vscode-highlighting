const vscode = {
  window: {
    withProgress: jest.fn(),
    showErrorMessage: jest.fn()
  },
  ProgressLocation: {
    Notification: jest.fn()
  },
  Range: jest.fn(),
  Position: jest.fn(),
  SemanticTokensBuilder: jest.fn()
}

module.exports = vscode
