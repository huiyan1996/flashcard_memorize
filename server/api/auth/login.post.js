import bcrypt from 'bcryptjs'
import { connectDBFromEvent } from '../../utils/db'
import { User } from '../../models/User'
import {
  sanitizeUser,
  setAuthCookie,
  signAuthToken,
} from '../../utils/auth'
import { getJwtSecret } from '../../utils/runtime-secrets'

export default defineEventHandler(async (event) => {
  await connectDBFromEvent(event)

  const body = await readBody(event)

  if (!body?.email || !body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.',
    })
  }

  const email = String(body.email).trim().toLowerCase()
  const password = String(body.password)

  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password.',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password.',
    })
  }

  const token = signAuthToken(
    {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    getJwtSecret(event),
  )

  setAuthCookie(event, token)

  return {
    user: sanitizeUser(user),
  }
})
