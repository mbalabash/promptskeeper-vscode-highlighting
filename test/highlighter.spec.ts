const {
  generateSemanticTokens,
  getRegexForCategoryWords,
  HIGHLIGHTING_GROUPS
} = require('../src/highlighter')

const vscodeMock = require('vscode')

describe('Semantic Tokens Generator', () => {
  describe('HIGHLIGHTING_GROUPS', () => {
    it('should define the correct structure for highlighting groups', () => {
      expect(HIGHLIGHTING_GROUPS).toMatchSnapshot()
    })
  })

  describe('getRegexForCategoryWords', () => {
    it('should generate regex for marker category', () => {
      const regex = getRegexForCategoryWords('marker', [])

      expect(regex).toBeInstanceOf(RegExp)
      expect(regex.source).toBe('#!promptskeeper.*?')
      expect(regex.flags).toBe('gi')
    })

    it('should generate regex for non-marker categories', () => {
      const words = ['test', 'example', 'sample']
      const regex = getRegexForCategoryWords('subject', words)

      expect(regex).toBeInstanceOf(RegExp)
      expect(regex.source).toBe("\\b(test|example|sample)(s|'s)?\\b")
      expect(regex.flags).toBe('gi')
    })

    it('should handle empty word arrays for non-marker categories', () => {
      const regex = getRegexForCategoryWords('subject', [])

      expect(regex.source).toBe("\\b()(s|'s)?\\b")
    })

    it('should escape special regex characters in words', () => {
      const words = ['test.', 'example*', 'sample+']
      const regex = getRegexForCategoryWords('subject', words)

      expect(regex.source).toBe("\\b(test.|example*|sample+)(s|'s)?\\b")
    })

    it('should generate consistent regex patterns (snapshot)', () => {
      const testCases = [
        { category: 'marker', words: [] },
        { category: 'subject', words: ['developer', 'user', 'client'] },
        { category: 'action', words: ['create', 'update', 'delete'] },
        { category: 'object', words: ['application', 'database', 'interface'] },
        { category: 'descriptor', words: ['powerful', 'efficient', 'reliable'] }
      ]

      const results = testCases.map(({ category, words }) => ({
        category,
        regex: getRegexForCategoryWords(category, words).toString()
      }))

      expect(results).toMatchSnapshot()
    })
  })

  describe('generateSemanticTokens', () => {
    let mockTokensBuilder
    let mockDocument

    beforeEach(() => {
      vscodeMock.Range.mockClear()
      vscodeMock.Position.mockClear()

      mockTokensBuilder = {
        push: jest.fn()
      }
      mockDocument = {
        positionAt: jest.fn(offset => {
          // This is a simplified version - in real VSCode it would depend on document content
          const line = Math.floor(offset / 20) // Just for testing - every 20 chars is a new line
          const character = offset % 20

          return { c: line, e: character }
        })
      }
    })

    it('should not call tokensBuilder.push when no matches are found', () => {
      const categorizedWords = {
        subject: ['user'],
        action: ['create'],
        object: ['application'],
        descriptor: ['awesome']
      }
      const block = {
        0: 'This contains no matching words',
        index: 10
      }
      generateSemanticTokens(categorizedWords, block, mockDocument, mockTokensBuilder)

      expect(mockTokensBuilder.push).not.toHaveBeenCalled()
    })

    it('should push tokens for matching words in each category', () => {
      const categorizedWords = {
        marker: ['#!promptskeeper'],
        subject: ['user'],
        action: ['create'],
        object: ['app'],
        descriptor: ['awesome']
      }
      const block = {
        0: '#!promptskeeper The user will create an awesome app',
        index: 0
      }
      generateSemanticTokens(categorizedWords, block, mockDocument, mockTokensBuilder)
      const firstCallArgs = mockTokensBuilder.push.mock.calls[0]

      expect(mockTokensBuilder.push).toHaveBeenCalledTimes(5)
      expect(mockDocument.positionAt).toHaveBeenCalled()
      expect(firstCallArgs[1]).toBe(HIGHLIGHTING_GROUPS.marker.tokenType)
    })

    it('should calculate correct positions for matches', () => {
      const categorizedWords = {
        subject: ['user']
      }
      const block = {
        0: 'Hello user!',
        index: 10 // The block starts at offset 10
      }
      generateSemanticTokens(categorizedWords, block, mockDocument, mockTokensBuilder)

      expect(mockDocument.positionAt).toHaveBeenCalledWith(16) // 10 (block index) + 6 (match index)
      expect(mockDocument.positionAt).toHaveBeenCalledWith(20) // 16 + 4 (length of "user")
      expect(vscodeMock.Range).toHaveBeenCalledTimes(1)
    })
  })
})
