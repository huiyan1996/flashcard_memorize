import mongoose from 'mongoose'
import { createError } from 'h3'
import { SPEECH_LANGUAGE_CODES } from './speech-languages'

export const FLASHCARD_ORDERS = ['sequence', 'random']

export const toObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  return new mongoose.Types.ObjectId(id)
}

export const normalizeFlashcardOrder = (order) => {
  const normalized = String(order || 'sequence').trim().toLowerCase()

  if (!FLASHCARD_ORDERS.includes(normalized)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Flashcard order must be sequence or random.',
    })
  }

  return normalized
}

export const normalizeSpeechLanguage = (language) => {
  const normalized = String(language || '').trim()

  if (!normalized) {
    return ''
  }

  if (!SPEECH_LANGUAGE_CODES.includes(normalized)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Speech language is not supported.',
    })
  }

  return normalized
}

export const shuffleItems = (items = []) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}
export const FLASHCARD_STATUSES = ['none', 'forgot', 'hard', 'yes']

export const normalizeFlashcardStatus = (status, { required = true } = {}) => {
  const normalized = String(status || 'none').trim().toLowerCase()

  if (!FLASHCARD_STATUSES.includes(normalized)) {
    if (!required) {
      return 'none'
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Flashcard status must be none, forgot, hard, or yes.',
    })
  }

  return normalized
}

export const getFlashcardStats = (words = []) => {
  const safeWords = Array.isArray(words) ? words : []
  const yesCount = safeWords.filter((item) => item.flashcardStatus === 'yes').length

  return {
    flashcardYesCount: yesCount,
    isCompleted: safeWords.length > 0 && yesCount === safeWords.length,
  }
}

export const serializeWord = (item) => ({
  word: item.word,
  meaning: item.meaning,
  description: item.description || '',
  flashcardStatus: item.flashcardStatus || 'none',
})

export const serializeWordSet = (wordSet, {
  includeWords = false,
  currentUserId = null,
  owner = null,
} = {}) => {
  const ownerId = wordSet.userId?._id?.toString() || wordSet.userId?.toString() || null
  const flashcardStats = getFlashcardStats(wordSet.words)

  const result = {
    id: wordSet._id.toString(),
    title: wordSet.title,
    wordCount: wordSet.wordCount ?? wordSet.words?.length ?? 0,
    visibility: wordSet.visibility || 'private',
    flashcardOrder: wordSet.flashcardOrder || 'sequence',
    speechLanguage: wordSet.speechLanguage || '',
    createdAt: wordSet.createdAt,
    updatedAt: wordSet.updatedAt,
    flashcardYesCount: flashcardStats.flashcardYesCount,
    isCompleted: flashcardStats.isCompleted,
  }

  if (currentUserId) {
    result.isOwner = ownerId === currentUserId
  }

  if (owner) {
    result.createdBy = {
      id: owner._id?.toString() || owner.id,
      name: owner.name,
    }
  }

  if (includeWords) {
    result.words = (wordSet.words || []).map((item) => serializeWord(item))
  }

  return result
}

export const normalizeWords = (words, { existingWords = [] } = {}) => {
  if (!Array.isArray(words)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Words must be an array.',
    })
  }

  const inputLength = words.length

  const normalized = words
    .map((item, index) => ({
      word: String(item?.word || '').trim(),
      meaning: String(item?.meaning || '').trim(),
      description: String(item?.description || '').trim(),
      flashcardStatus: normalizeFlashcardStatus(
        item?.flashcardStatus ?? existingWords[index]?.flashcardStatus ?? 'none',
      ),
    }))
    .filter((item) => item.word || item.meaning || item.description)

  if (normalized.length === 0) {
    if (inputLength === 0) {
      return []
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'At least one word with a meaning is required.',
    })
  }

  for (const item of normalized) {
    if (!item.word || !item.meaning) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Each word must have both a word and a meaning.',
      })
    }
  }

  return normalized
}

export const normalizeTitle = (title) => {
  const normalized = String(title || '').trim()

  if (!normalized) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required.',
    })
  }

  if (normalized.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title must be 200 characters or less.',
    })
  }

  return normalized
}

export const normalizeVisibility = (visibility) => {
  const normalized = String(visibility || '').trim().toLowerCase()

  if (normalized !== 'public' && normalized !== 'private') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Visibility must be public or private.',
    })
  }

  return normalized
}

export const getFlashcardQueue = (words = [], { isCompleted = false, flashcardOrder = 'sequence' } = {}) => {
  const safeWords = (words || []).map((item, index) => ({
    ...serializeWord(item),
    index,
  }))

  if (safeWords.length === 0) {
    return []
  }

  const queue = isCompleted
    ? safeWords
    : safeWords.filter((item) => item.flashcardStatus !== 'yes')

  if (flashcardOrder === 'random') {
    return shuffleItems(queue)
  }

  return queue
}
