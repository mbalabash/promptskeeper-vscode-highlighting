import {
  blockRegex,
  classSuffixes,
  MARKER,
  splitTextIntoWords,
  isExceptionWord
} from '../src/dictionary'

describe('PromptsKeeper Utils', () => {
  describe('MARKER', () => {
    it('should export the correct marker value', () => {
      expect(MARKER).toBe('#!promptskeeper')
    })
  })

  describe('blockRegex', () => {
    it('should correctly match single quote blocks', () => {
      const text = "Some text '#!promptskeeper sample text' more text"
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe("'#!promptskeeper sample text'")
    })

    it('should correctly match double quote blocks', () => {
      const text = 'Some text "#!promptskeeper sample text" more text'
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe('"#!promptskeeper sample text"')
    })

    it('should correctly match backtick blocks', () => {
      const text = 'Some text `#!promptskeeper sample text` more text'
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe('`#!promptskeeper sample text`')
    })

    it('should correctly match triple single quote blocks', () => {
      const text = "Some text '''#!promptskeeper sample text''' more text"
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe("'''#!promptskeeper sample text'''")
    })

    it('should correctly match triple double quote blocks', () => {
      const text = 'Some text """#!promptskeeper sample text""" more text'
      const matches = text.match(blockRegex)
      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe('"""#!promptskeeper sample text"""')
    })

    it('should match multiple blocks', () => {
      const text = 'Text \'#!promptskeeper a\' more "#!promptskeeper b" end'
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(2)
    })

    it('should handle nested quotes properly', () => {
      const text = 'Text \'#!promptskeeper with "nested" quotes\' end'
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe('\'#!promptskeeper with "nested" quotes\'')
    })

    it('should match multiline blocks', () => {
      const text = "Text '#!promptskeeper line1\nline2\nline3' end"
      const matches = text.match(blockRegex)

      expect(matches).toHaveLength(1)
      expect(matches).not.toBeNull()
      expect(matches![0]).toBe("'#!promptskeeper line1\nline2\nline3'")
    })

    it('should match expected patterns (snapshot)', () => {
      const samples = [
        "Simple '#!promptskeeper test'",
        'Complex "#!promptskeeper with various\n  indentation and\n    structure"',
        '`#!promptskeeper backtick block`',
        "'''#!promptskeeper triple quotes'''",
        '"""#!promptskeeper more triple quotes"""'
      ]

      const results = samples.map(sample => {
        const matches = sample.match(blockRegex)
        return matches ? matches[0] : null
      })

      expect(results).toMatchSnapshot()
    })
  })

  describe('splitTextIntoWords', () => {
    it('should split simple text correctly', () => {
      const result = splitTextIntoWords('Hello world')

      expect(result).toEqual(['Hello', 'world'])
    })

    it('should handle empty string', () => {
      const result = splitTextIntoWords('')

      expect(result).toEqual([])
    })

    it('should handle string with no words', () => {
      const result = splitTextIntoWords('123 !@#')

      expect(result).toEqual(['123'])
    })

    it('should handle hyphenated words', () => {
      const result = splitTextIntoWords('state-of-the-art technology')

      expect(result).toEqual(['state-of-the-art', 'technology'])
    })

    it('should handle words with apostrophes', () => {
      const result = splitTextIntoWords("Don't worry, it's working")

      expect(result).toEqual(["Don't", 'worry', "it's", 'working'])
    })

    it('should handle mixed case', () => {
      const result = splitTextIntoWords('CamelCase snake_case normal')

      expect(result).toEqual(['CamelCase', 'snake', 'case', 'normal'])
    })

    it('should handle numbers within words', () => {
      const result = splitTextIntoWords('test123 456test 789')

      expect(result).toEqual(['test123', '456test', '789'])
    })

    it('should ignore punctuation', () => {
      const result = splitTextIntoWords('Hello, world! How are you?')

      expect(result).toEqual(['Hello', 'world', 'How', 'are', 'you'])
    })

    it('should handle multilingual text', () => {
      const result = splitTextIntoWords('English español Deutsch 日本語')

      expect(result).toEqual(['English', 'español', 'Deutsch', '日本語'])
    })

    it('should split text consistently (snapshot)', () => {
      const samples = [
        'Simple example text',
        "With-hyphens and apostrophe's",
        'Numbers123 and !@#$% symbols',
        'CamelCase and snake_case_text',
        'Mixed 123 and text-with-numbers456',
        'Multilingual: English, español, Deutsch, 日本語'
      ]
      const results = samples.map(sample => splitTextIntoWords(sample))

      expect(results).toMatchSnapshot()
    })
  })

  describe('classSuffixes', () => {
    it('should have the correct structure', () => {
      expect(Object.keys(classSuffixes)).toEqual(['subjects', 'actions', 'objects', 'descriptors'])
    })

    it('should contain valid regex patterns', () => {
      Object.values(classSuffixes).forEach(pattern => {
        expect(pattern).toBeInstanceOf(RegExp)
      })
    })

    it('subjects pattern should match expected words', () => {
      const { subjects } = classSuffixes
      const testCases = [
        { word: 'doctor', expected: true },
        { word: 'engineer', expected: true },
        { word: 'artist', expected: true },
        { word: 'employee', expected: true },
        { word: 'person', expected: false },
        { word: 'worker', expected: false }
      ]

      testCases.forEach(({ word, expected }) => {
        expect(subjects.test(word)).toBe(expected)
      })
    })

    it('actions pattern should match expected words', () => {
      const { actions } = classSuffixes
      const testCases = [
        { word: 'running', expected: true },
        { word: 'jumped', expected: false },
        { word: 'organize', expected: true },
        { word: 'modify', expected: true },
        { word: 'run', expected: false },
        { word: 'jump', expected: false }
      ]

      testCases.forEach(({ word, expected }) => {
        expect(actions.test(word)).toBe(expected)
      })
    })

    it('objects pattern should match expected words', () => {
      const { objects } = classSuffixes
      const testCases = [
        { word: 'solution', expected: true },
        { word: 'decision', expected: true },
        { word: 'happiness', expected: true },
        { word: 'friendship', expected: true },
        { word: 'table', expected: false },
        { word: 'book', expected: false }
      ]

      testCases.forEach(({ word, expected }) => {
        expect(objects.test(word)).toBe(expected)
      })
    })

    it('descriptors pattern should match expected words', () => {
      const { descriptors } = classSuffixes
      const testCases = [
        { word: 'beautiful', expected: true },
        { word: 'capable', expected: true },
        { word: 'endless', expected: true },
        { word: 'sideways', expected: true },
        { word: 'nice', expected: false },
        { word: 'good', expected: false }
      ]

      testCases.forEach(({ word, expected }) => {
        expect(descriptors.test(word)).toBe(expected)
      })
    })

    it('should match suffixes consistently (snapshot)', () => {
      const suffixTests = {
        subjects: ['doctor', 'engineer', 'artist', 'employee', 'visitor', 'programmer'],
        actions: ['running', 'jumped', 'organize', 'simplify', 'create', 'detect'],
        objects: ['solution', 'happiness', 'relationship', 'freedom', 'knowledge', 'performance'],
        descriptors: ['beautiful', 'capable', 'endless', 'backwards', 'threefold', 'innermost']
      }
      const results = {}
      Object.entries(suffixTests).forEach(([category, words]) => {
        results[category] = words.map(word => ({
          word,
          matches: classSuffixes[category].test(word)
        }))
      })

      expect(results).toMatchSnapshot()
    })
  })

  describe('isExceptionWord', () => {
    it('should return true for very short words', () => {
      expect(isExceptionWord('a')).toBe(true)
      expect(isExceptionWord('I')).toBe(true)
    })

    it('should return true for numbers and punctuation', () => {
      expect(isExceptionWord('123')).toBe(true)
      expect(isExceptionWord('!@#')).toBe(true)
    })

    it('should return true for exception words', () => {
      expect(isExceptionWord('the')).toBe(true)
      expect(isExceptionWord('and')).toBe(true)
    })

    it('should return false for non-exception words', () => {
      expect(isExceptionWord('important')).toBe(false)
      expect(isExceptionWord('keywords')).toBe(false)
    })
  })

  describe('integration tests', () => {
    it('should identify words not in exception list', () => {
      const text = 'This is a test sentence with some important keywords'
      const words = splitTextIntoWords(text)
      const nonExceptionWords = words.filter(word => !isExceptionWord(word))

      expect(nonExceptionWords).toEqual([
        'test',
        'sentence',
        'important',
        'keywords'
      ])
    })

    it('should categorize words by their suffixes', () => {
      const words = ['engineer', 'coding', 'application', 'powerful']
      const categorized = {
        subjects: words.filter(word => classSuffixes.subjects.test(word)),
        actions: words.filter(word => classSuffixes.actions.test(word)),
        objects: words.filter(word => classSuffixes.objects.test(word)),
        descriptors: words.filter(word => classSuffixes.descriptors.test(word))
      }

      expect(categorized).toEqual({
        subjects: ['engineer'],
        actions: ['coding'],
        objects: ['application'],
        descriptors: ['powerful']
      })
    })
  })
})
