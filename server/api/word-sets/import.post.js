import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { requireAuthUser } from '../../utils/auth'
import {
  getTitleFromFileName,
  isSupportedImportFile,
  parseWordRowsFromBuffer,
  resolveImportFileName,
} from '../../utils/parse-word-file'
import { serializeWordSet, toObjectId } from '../../utils/word-set'

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

  const formData = await readMultipartFormData(event)

  if (!formData?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please upload a CSV or Excel file.',
    })
  }

  const filePart = formData.find((part) => part.name === 'file' && part.data)
  const titlePart = formData.find((part) => part.name === 'title')

  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please upload a CSV or Excel file.',
    })
  }

  const mimeType = filePart.type || ''
  const importedFileName = resolveImportFileName(filePart.filename || '', mimeType, filePart.data)

  if (!isSupportedImportFile(filePart.filename || '', mimeType, filePart.data)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported.',
    })
  }

  let words

  try {
    words = parseWordRowsFromBuffer(filePart.data, importedFileName)
  } catch (error) {
    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 400,
      statusMessage: error?.message || 'Failed to parse the uploaded file.',
    })
  }

  const customTitle = titlePart?.data ? Buffer.from(titlePart.data).toString('utf8').trim() : ''
  const title = (customTitle || getTitleFromFileName(importedFileName)).slice(0, 200)

  try {
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
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to save the imported word set.',
    })
  }
})
