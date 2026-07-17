import mongoose from 'mongoose'
import { createError } from 'h3'
import { getMongoUri } from './runtime-secrets'

// Ensure models are registered in every serverless bundle (needed for populate).
import '../models/User'
import '../models/WordSet'

const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  maxPoolSize: 5,
}

const getCachedConnection = () => {
  if (!globalThis.__flashmemMongoose) {
    globalThis.__flashmemMongoose = {
      conn: null,
      promise: null,
    }
  }

  return globalThis.__flashmemMongoose
}

export const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database is not configured. Set MONGODB_URI in environment variables.',
    })
  }

  const cached = getCachedConnection()

  if (cached.conn?.readyState === 1) {
    return cached.conn
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true)

    cached.promise = mongoose.connect(mongoUri, CONNECTION_OPTIONS).then((connection) => {
      cached.conn = connection
      return connection
    }).catch((error) => {
      cached.promise = null
      cached.conn = null
      throw createError({
        statusCode: 503,
        statusMessage: `Database connection failed: ${error.message}`,
      })
    })
  }

  return cached.promise
}

export const connectDBFromEvent = async (event) => {
  return connectDB(getMongoUri(event))
}
