import { getAuthUserFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = getAuthUserFromEvent(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return {
    user,
  }
})
