import { connectDBFromEvent } from '../../../utils/db'
import { WordSet } from '../../../models/WordSet'
import { requireAuthUser } from '../../../utils/auth'
import { serializeWordSet, toObjectId } from '../../../utils/word-set'

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

  const sourceWordSet = await WordSet.findOne({
    _id: wordSetId,
    visibility: 'public',
    userId: { $ne: userId },
  })

  if (!sourceWordSet) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Public word set not found.',
    })
  }

  const copiedWords = (sourceWordSet.words || []).map((item) => ({
    word: item.word,
    meaning: item.meaning,
    description: item.description || '',
  }))

  const wordSet = await WordSet.create({
    userId,
    title: sourceWordSet.title,
    words: copiedWords,
    wordCount: copiedWords.length,
    visibility: 'private',
    flashcardOrder: sourceWordSet.flashcardOrder || 'sequence',
    showWordOnFront: Boolean(sourceWordSet.showWordOnFront),
    speechLanguage: sourceWordSet.speechLanguage || '',
  })

  return {
    wordSet: serializeWordSet(wordSet, {
      currentUserId: user.id,
    }),
  }
})
