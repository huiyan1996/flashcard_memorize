import { connectDBFromEvent } from '../../../utils/db'
import { WordSet } from '../../../models/WordSet'
import { requireAuthUser } from '../../../utils/auth'
import {
  normalizeFlashcardStatus,
  serializeWordSet,
  toObjectId,
} from '../../../utils/word-set'

export default defineEventHandler(async (event) => {
  const user = requireAuthUser(event)
  await connectDBFromEvent(event)

  const userId = toObjectId(user.id)
  const wordSetId = toObjectId(getRouterParam(event, 'id'))

  if (!userId || !wordSetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid word set id.',
    })
  }

  const body = await readBody(event)
  const wordIndex = Number(body?.wordIndex)
  const status = normalizeFlashcardStatus(body?.status)

  if (!Number.isInteger(wordIndex) || wordIndex < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid word index is required.',
    })
  }

  const wordSet = await WordSet.findOne({
    _id: wordSetId,
    userId,
  })

  if (!wordSet) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Word set not found.',
    })
  }

  if (!wordSet.words?.[wordIndex]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Word index is out of range.',
    })
  }

  wordSet.words[wordIndex].flashcardStatus = status
  wordSet.markModified('words')
  await wordSet.save()

  return {
    wordSet: serializeWordSet(wordSet, {
      includeWords: true,
      currentUserId: user.id,
    }),
  }
})
