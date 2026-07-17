import { createError } from 'h3'
import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { User } from '../../models/User'
import { requireAuthUser } from '../../utils/auth'
import { serializeWordSet, toObjectId } from '../../utils/word-set'

export default defineEventHandler(async (event) => {
  const user = requireAuthUser(event)
  await connectDBFromEvent(event)

  const userId = toObjectId(user.id)

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  try {
    const wordSets = await WordSet.find({
      visibility: 'public',
      userId: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'name',
        model: User,
      })
      .select('title wordCount visibility createdAt updatedAt userId words.flashcardStatus')

    return {
      wordSets: wordSets.map((wordSet) => {
        const owner = wordSet.userId && typeof wordSet.userId === 'object'
          ? wordSet.userId
          : null

        return serializeWordSet(wordSet, {
          currentUserId: user.id,
          owner,
        })
      }),
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to load community word sets.',
    })
  }
})
