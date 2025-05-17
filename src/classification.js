const vscode = require('vscode')
const { join } = require('path')
const { env: contextEnv } = require('process')
const { existsSync, mkdirSync } = require('fs')
const { MARKER, classSuffixes, splitTextIntoWords, isExceptionWord } = require('./dictionary')

const MODEL_ID = 'mbalabash/distilbert_subjects_actions_objects_descriptors'
const MODEL_CACHE_DIR = join(
  contextEnv.HOME || contextEnv.USERPROFILE || '.',
  '.cache',
  'promptskeeper-vscode-highlighting-extension',
  'models'
)
const PREDICTION_CACHE = new Map()

if (!existsSync(MODEL_CACHE_DIR)) {
  mkdirSync(MODEL_CACHE_DIR, { recursive: true })
}

async function getModel(pipeline, progress) {
  return await pipeline('text-classification', MODEL_ID, {
    cache_dir: MODEL_CACHE_DIR,
    local_files_only: false, // download the model if not found in cache
    progress_callback: chunk => {
      if (chunk.status) {
        progress.report({ message: chunk.status })
      }
      if (chunk.progress) {
        progress.report({
          message: `Downloading: ${Math.round(chunk.progress)}%`
        })
      }
    }
  })
}

async function initializeTransformers() {
  process.env.HF_HOME = MODEL_CACHE_DIR
  process.env.TRANSFORMERS_CACHE = MODEL_CACHE_DIR

  try {
    const { pipeline, env } = await import('@xenova/transformers')
    env.cacheDir = MODEL_CACHE_DIR
    env.allowLocalModels = true

    return await vscode.window.withProgress( // show beautiful message in VSCode
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Initializing model...',
        cancellable: false
      },
      async progress => {
        progress.report({ message: 'Downloading...' })

        return await getModel(pipeline, progress)
      }
    )
  } catch (error) {
    console.error('Model initialization error:', error)
    vscode.window.showErrorMessage('Failed to load model: ' + error.message)
    return null
  }
}

async function classifyWordUsingModel(word, classifier) {
  if (PREDICTION_CACHE.has(word)) {
    return PREDICTION_CACHE.get(word)
  }

  const result = { category: '', confidence: 0 }

  try {
    const prediction = await classifier(word)
    if (!Array.isArray(prediction) || !prediction[0]) {
      return result
    }

    result.category = prediction[0].label.toLowerCase()
    result.confidence = prediction[0].score

    PREDICTION_CACHE.set(word, result)
    return result
  } catch (error) {
    console.error('Prediction error:', error)
    return result
  }
}

function classifyWordUsingHeuristics(word) {
  if (PREDICTION_CACHE.has(word)) {
    return PREDICTION_CACHE.get(word)
  }

  const lowerWord = word.toLowerCase()
  const result = { category: '', confidence: 0 }

  if (classSuffixes.subjects.test(lowerWord)) {
    result.category = 'subject'
    result.confidence = 1
    PREDICTION_CACHE.set(word, result)
    return result
  } else if (classSuffixes.actions.test(lowerWord)) {
    result.category = 'action'
    result.confidence = 1
    PREDICTION_CACHE.set(word, result)
    return result
  } else if (classSuffixes.objects.test(lowerWord)) {
    result.category = 'object'
    result.confidence = 1
    PREDICTION_CACHE.set(word, result)
    return result
  } else if (classSuffixes.descriptors.test(lowerWord)) {
    result.category = 'descriptor'
    result.confidence = 1
    PREDICTION_CACHE.set(word, result)
    return result
  }

  return result
}

async function extractClassifiedWords(prompt, classifier) {
  if (!classifier) {
    vscode.window.showErrorMessage('Word categorization failed: model not initialized')
    return
  }

  const { text, categories } = preparePromptForClassification(prompt)

  try {
    const words = splitTextIntoWords(text)
    const ambiguousWords = []

    for (const word of words) {
      if (isExceptionWord(word)) {
        continue
      }

      // Try to classify the word using heuristics first
      const { confidence, category } = classifyWordUsingHeuristics(word)
      if (confidence === 0) {
        ambiguousWords.push(word)
      } else {
        categories[category].push(word)
      }
    }

    // Handle ambiguous words using our model
    const BATCH_SIZE = 6
    for (let i = 0; i < ambiguousWords.length; i += BATCH_SIZE) {
      const batch = ambiguousWords.slice(i, i + BATCH_SIZE)
      const predictions = await Promise.all(batch.map(word => classifyWordUsingModel(word, classifier)))

      predictions.forEach((prediction, index) => {
        const word = batch[index]
        if (typeof prediction.category === 'string' && prediction.category.length > 0) {
          categories[prediction.category].push(word)
        }
      })
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Word categorization failed: ${error.message}`)
    console.error('Word categorization error:', error)
  }

  return categories
}

function preparePromptForClassification(prompt) {
  return {
    text: prompt.replace(MARKER, '').trim(),
    categories: {
      marker: ['#!promptskeeper'],
      subject: [],
      action: [],
      object: [],
      descriptor: []
    }
  }
}

module.exports = {
  preparePromptForClassification,
  extractClassifiedWords,
  initializeTransformers,
  classifyWordUsingModel,
  classifyWordUsingHeuristics,
  PREDICTION_CACHE
}
