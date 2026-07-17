import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { requireAuthUser } from '../../utils/auth'
import {
  normalizeTitle,
  normalizeVisibility,
  normalizeFlashcardOrder,
  normalizeShowWordOnFront,
  normalizeSpeechLanguage,
  normalizeWords,
  serializeWordSet,
  toObjectId,
} from '../../utils/word-set'

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
  const updates = {}

  if (body?.title !== undefined) {
    updates.title = normalizeTitle(body.title)
  }

  if (body?.words !== undefined) {
    const existingWordSet = await WordSet.findOne({
      _id: wordSetId,
      userId,
    }).select('words')

    updates.words = normalizeWords(body.words, {
      existingWords: existingWordSet?.words || [],
    })
    updates.wordCount = updates.words.length
  }

  if (body?.visibility !== undefined) {
    updates.visibility = normalizeVisibility(body.visibility)
  }

  if (body?.flashcardOrder !== undefined) {
    updates.flashcardOrder = normalizeFlashcardOrder(body.flashcardOrder)
  }

  if (body?.showWordOnFront !== undefined) {
    updates.showWordOnFront = normalizeShowWordOnFront(body.showWordOnFront)
  }

  if (body?.speechLanguage !== undefined) {
    updates.speechLanguage = normalizeSpeechLanguage(body.speechLanguage)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nothing to update.',
    })
  }

  const wordSet = await WordSet.findOneAndUpdate(
    {
      _id: wordSetId,
      userId,
    },
    updates,
    { new: true },
  )

  if (!wordSet) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Word set not found.',
    })
  }

  return {
    wordSet: serializeWordSet(wordSet, {
      includeWords: true,
      currentUserId: user.id,
    }),
  }
})
