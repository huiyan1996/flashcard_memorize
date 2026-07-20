import { connectDBFromEvent } from '../../utils/db'
import { QuizAttempt } from '../../models/QuizAttempt'
import { requireAuthUser } from '../../utils/auth'
import { toObjectId } from '../../utils/word-set'

const serializeQuizAttempt = (attempt) => ({
  id: attempt._id.toString(),
  wordSetId: attempt.wordSetId?.toString() || null,
  wordSetTitle: attempt.wordSetTitle,
  score: attempt.score,
  correctCount: attempt.correctCount,
  totalCount: attempt.totalCount,
  createdAt: attempt.createdAt,
})

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

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)

  const attempts = await QuizAttempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)

  return {
    attempts: attempts.map(serializeQuizAttempt).reverse(),
  }
})
