import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
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

  const wordSets = await WordSet.find({
    visibility: 'public',
    userId: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'name')
    .select('title wordCount visibility createdAt updatedAt userId')

  return {
    wordSets: wordSets.map((wordSet) => serializeWordSet(wordSet, {
      currentUserId: user.id,
      owner: wordSet.userId,
    })),
  }
})
