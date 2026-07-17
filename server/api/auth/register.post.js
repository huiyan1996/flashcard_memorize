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

  if (!body?.name || !body?.email || !body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name, email, and password are required.',
    })
  }

  const name = String(body.name).trim()
  const email = String(body.email).trim().toLowerCase()
  const password = String(body.password)

  if (name.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name must be at least 2 characters.',
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please enter a valid email address.',
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 6 characters.',
    })
  }

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An account with this email already exists.',
    })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  })

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
