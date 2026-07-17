import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { User } from '../../models/User'
import { requireAuthUser } from '../../utils/auth'
import { serializeWordSet, toObjectId } from '../../utils/word-set'

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

  const wordSet = await WordSet.findOne({
    _id: wordSetId,
    $or: [
      { userId },
      { visibility: 'public' },
    ],
  }).populate({
    path: 'userId',
    select: 'name',
    model: User,
  })

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
      owner: wordSet.userId,
    }),
  }
})
