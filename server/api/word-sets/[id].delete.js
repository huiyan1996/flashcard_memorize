import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { requireAuthUser } from '../../utils/auth'
import { toObjectId } from '../../utils/word-set'

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

  const deleted = await WordSet.findOneAndDelete({
    _id: wordSetId,
    userId,
  })

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Word set not found.',
    })
  }

  return {
    success: true,
  }
})
