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

const getUploadErrorMessage = (error) => {
  if (!error) {
    return 'Failed to import the uploaded file.'
  }

  if (error.statusMessage && error.statusMessage !== 'Server Error') {
    return error.statusMessage
  }

  if (error.message && error.message !== 'Server Error') {
    return error.message
  }

  return 'Failed to import the uploaded file.'
}

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

    let formData

    try {
      formData = await readMultipartFormData(event)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not read the uploaded file. Try again or rename the file to English characters.',
        data: {
          cause: error?.message || 'multipart parse failed',
        },
      })
    }

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

    const words = parseWordRowsFromBuffer(filePart.data, importedFileName)
    const customTitle = titlePart?.data ? Buffer.from(titlePart.data).toString('utf8').trim() : ''
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

    console.error('[word-sets/import]', error)

    throw createError({
      statusCode: 500,
      statusMessage: getUploadErrorMessage(error),
    })
  }
})
