import { connectDBFromEvent } from '../../utils/db'
import { QuizAttempt } from '../../models/QuizAttempt'
import { WordSet } from '../../models/WordSet'
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

  const body = await readBody(event)
  const wordSetId = toObjectId(body?.wordSetId)
  const correctCount = Number(body?.correctCount)
  const totalCount = Number(body?.totalCount)

  if (!wordSetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Word set id is required.',
    })
  }

  if (!Number.isInteger(totalCount) || totalCount < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Total count must be a positive integer.',
    })
  }

  if (!Number.isInteger(correctCount) || correctCount < 0 || correctCount > totalCount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Correct count is invalid.',
    })
  }

  const wordSet = await WordSet.findOne({
    _id: wordSetId,
    userId,
  }).select('title')

  if (!wordSet) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Word set not found.',
    })
  }

  const score = Math.round((correctCount / totalCount) * 100)

  const attempt = await QuizAttempt.create({
    userId,
    wordSetId,
    wordSetTitle: wordSet.title,
    score,
    correctCount,
    totalCount,
  })

  return {
    attempt: serializeQuizAttempt(attempt),
  }
})
