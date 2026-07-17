import { getJwtSecret, getMongoUri } from '../utils/runtime-secrets'

export default defineEventHandler((event) => {
  const mongoUri = getMongoUri(event)
  const jwtSecret = getJwtSecret(event)

  return {
    ok: true,
    databaseConfigured: Boolean(mongoUri),
    authConfigured: Boolean(jwtSecret),
  }
})
