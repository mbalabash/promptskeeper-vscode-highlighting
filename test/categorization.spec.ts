const {
  preparePromptForClassification,
  extractClassifiedWords,
  initializeTransformers,
  classifyWordUsingModel,
  classifyWordUsingHeuristics,
  PREDICTION_CACHE
} = require('../src/classification')

describe('classification.js', () => {
  describe('preparePromptForClassification', () => {
    it('should remove the marker and trim the prompt', () => {
      const prompt = '  #!promptskeeper This is a test prompt.  '
      const result = preparePromptForClassification(prompt)

      expect(result.text).toBe('This is a test prompt.')
      expect(result.categories.marker).toContain('#!promptskeeper')
    })
  })

  describe('classifyWordUsingModel', () => {
    beforeAll(() => {
      PREDICTION_CACHE.clear()
    })

    it('should return cached result if word is already categorized', async () => {
      const word = 'qwe'
      const cachedResult = { category: 'object', confidence: 0.9 }
      PREDICTION_CACHE.set(word, cachedResult)
      const result = await classifyWordUsingModel(word, () => undefined)

      expect(result).toEqual(cachedResult)
    })

    it('should return empty result if classifier fails', async () => {
      const expectedError = new Error('Classifier error')
      const classifierMock = jest.fn().mockRejectedValueOnce(expectedError)
      const result = await classifyWordUsingModel('test', classifierMock)

      expect(classifierMock).toHaveBeenCalledWith('test')
      expect(result).toEqual({ category: '', confidence: 0 })
    })

    it('should categorize word correctly', async () => {
      const word = 'dog'
      const prediction = [{ label: 'subject', score: 0.95 }]
      const classifierMock = jest.fn()
      classifierMock.mockResolvedValueOnce(prediction)
      const result = await classifyWordUsingModel(word, classifierMock)

      expect(result).toEqual({ category: 'subject', confidence: 0.95 })
      expect(PREDICTION_CACHE.has(word)).toEqual(true)
    })
  })

  describe('classifyWordUsingHeuristics', () => {
    beforeAll(() => {
      PREDICTION_CACHE.clear()
    })

    it('should return cached result if word is already categorized', () => {
      const word = 'run'
      const cachedResult = { category: 'action', confidence: 1 }
      PREDICTION_CACHE.set(word, cachedResult)
      const result = classifyWordUsingHeuristics(word)

      expect(result).toEqual(cachedResult)
    })

    it('should categorize word as subject', () => {
      const word = 'engineer'
      const result = classifyWordUsingHeuristics(word)

      expect(result).toEqual({ category: 'subject', confidence: 1 })
    })

    it('should categorize word as action', () => {
      const word = 'identify'
      const result = classifyWordUsingHeuristics(word)

      expect(result).toEqual({ category: 'action', confidence: 1 })
    })

    it('should categorize word as object', () => {
      const word = 'spaceship'
      const result = classifyWordUsingHeuristics(word)

      expect(result).toEqual({ category: 'object', confidence: 1 })
    })

    it('should categorize word as descriptor', () => {
      const word = 'beautiful'
      const result = classifyWordUsingHeuristics(word)

      expect(result).toEqual({ category: 'descriptor', confidence: 1 })
    })

    it('should return empty result for unknown word', () => {
      const word = 'xyz'
      const result = classifyWordUsingHeuristics(word)

      expect(result).toEqual({ category: '', confidence: 0 })
    })
  })

  describe('extractClassifiedWords', () => {
    it('should categorize words using regex and model', async () => {
      const classifierMock = jest.fn()
      const prompt = 'The quick brown fox jumps over the lazy dog.'
      classifierMock.mockResolvedValue([{ label: 'subject', score: 0.95 }])
      const result = await extractClassifiedWords(prompt, classifierMock)

      expect(result.subject).toContain('fox')
      expect(result.subject).toContain('jumps')
    })

    it('should handle empty classifier', async () => {
      const prompt = 'The quick brown fox jumps over the lazy dog.'
      const result = await extractClassifiedWords(prompt, null)

      expect(result).toBeUndefined()
    })
  })
})
