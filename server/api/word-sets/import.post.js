import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { requireAuthUser } from '../../utils/auth'
import {
  decodeBase64FileContent,
  getTitleFromFileName,
  isSupportedImportFile,
  parseWordRowsFromBuffer,
  resolveImportFileName,
} from '../../utils/parse-word-file'
import { serializeWordSet, toObjectId } from '../../utils/word-set'

const MAX_IMPORT_BYTES = 4 * 1024 * 1024

export default defineEventHandler(async (event) => {
  try {
    const user = requireAuthUser(event)
    await connectDBFromEvent(event)

    const userId = toObjectId(user.id)

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    const body = await readBody(event).catch(() => null)

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please upload a CSV or Excel file.',
      })
    }

    const originalFileName = String(body.fileName || '').trim()
    const mimeType = String(body.mimeType || '').trim()
    const customTitle = String(body.title || '').trim()
    const fileBuffer = decodeBase64FileContent(body.contentBase64)

    if (!fileBuffer.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please upload a CSV or Excel file.',
      })
    }

    if (fileBuffer.length > MAX_IMPORT_BYTES) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File is too large. Please upload a file under 4MB.',
      })
    }

    const importedFileName = resolveImportFileName(originalFileName, mimeType, fileBuffer)

    if (!isSupportedImportFile(originalFileName, mimeType, fileBuffer)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported.',
      })
    }

    const words = await parseWordRowsFromBuffer(fileBuffer, importedFileName, mimeType)
    const title = (customTitle || getTitleFromFileName(importedFileName)).slice(0, 200)

    const wordSet = await WordSet.create({
      userId,
      title,
      words,
      wordCount: words.length,
    })

    return {
      wordSet: serializeWordSet(wordSet, {
        currentUserId: user.id,
      }),
    }
  } catch (error) {
    if (error?.statusCode) {
      throw error
    }

    console.error('[word-sets/import] unexpected error', error)

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to import the uploaded file.',
      data: {
        cause: error?.stack || error?.message || 'unknown',
      },
    })
  }
})
