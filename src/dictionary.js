const MARKER = '#!promptskeeper'

function splitTextIntoWords(text) {
  const wordRegex = /[\p{L}\p{N}]+(?:[''-][\p{L}\p{N}]+)*/gu

  return text.match(wordRegex) || []
}

function isExceptionWord(word) {
  const MIN_WORD_LENGTH = 3
  const EXCEPTION_WORDS = [
    'the',
    'and',
    'for',
    'but',
    'not',
    'was',
    'are',
    'has',
    'had',
    'can',
    'with',
    'who',
    'how',
    'why',
    'its',
    'per',
    'via',
    'did',
    'does',
    'yet',
    'nor',
    'etc',
    'from',
    'this',
    'that',
    'these',
    'those',
    'been',
    'just',
    'also',
    'than',
    'then',
    'over',
    'about',
    'into',
    'off',
    'even',
    'still',
    'some',
    'may'
  ]

  // Skip very short words, numbers, punctuation, and exception words
  if (
    word.length < MIN_WORD_LENGTH ||
    /^[^a-zA-Z]+$/.test(word) ||
    EXCEPTION_WORDS.includes(word.toLowerCase())
  ) {
    return true
  }

  return false
}

module.exports = {
  MARKER,
  blockRegex: new RegExp(`(['"\`]|'{3}|"{3}|\`)\\s*${MARKER}[\\s\\S]*?\\1`, 'gi'),
  splitTextIntoWords,
  isExceptionWord,
  classSuffixes: {
    subjects: /(or|ian|eer|ster|ist|ite|ee)$/i,
    actions: /(ing|ize|ify|ate|ish|ect)$/i,
    objects: /(tion|sion|ment|ity|ism|ness|hood|age|ance|ence|ery|dom|ship)$/i,
    descriptors: /(ful|ous|ible|able|less|ive|ward|wise|ways|fold|most)$/i
  }
}
