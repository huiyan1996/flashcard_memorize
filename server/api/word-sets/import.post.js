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

const readFormText = (part) => {
  if (!part?.data) {
    return ''
  }

  return Buffer.from(part.data).toString('utf8').trim()
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
      console.error('[word-sets/import] multipart failed', error)
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not read the uploaded file. Please try again.',
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

    const filePart = formData.find((part) => part.name === 'file' && part.data?.length)
    const titlePart = formData.find((part) => part.name === 'title')
    const fileNamePart = formData.find((part) => part.name === 'fileName')

    if (!filePart) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please upload a CSV or Excel file.',
      })
    }

    const mimeType = filePart.type || ''
    // Prefer the UTF-8 text field from the client. Multipart Content-Disposition
    // filenames are often corrupted for non-English characters.
    const originalFileName = readFormText(fileNamePart) || filePart.filename || ''
    const importedFileName = resolveImportFileName(originalFileName, mimeType, filePart.data)

    if (!isSupportedImportFile(originalFileName, mimeType, filePart.data)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported.',
      })
    }

    const words = parseWordRowsFromBuffer(filePart.data, importedFileName, mimeType)
    const customTitle = readFormText(titlePart)
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
