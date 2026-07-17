export const getJwtSecret = (event) => {
  const config = useRuntimeConfig(event)

  return config.jwtSecret
    || process.env.NUXT_JWT_SECRET
    || process.env.JWT_SECRET
    || ''
}

export const getMongoUri = (event) => {
  const config = useRuntimeConfig(event)

  return config.mongoUri
    || process.env.NUXT_MONGO_URI
    || process.env.MONGODB_URI
    || ''
}
