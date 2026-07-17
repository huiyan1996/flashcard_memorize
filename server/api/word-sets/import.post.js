import { connectDBFromEvent } from '../../utils/db'
import { WordSet } from '../../models/WordSet'
import { requireAuthUser } from '../../utils/auth'
import {
  getTitleFromFileName,
  isSupportedImportFile,
  parseWordRowsFromBuffer,
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

  const importedFileName = filePart.filename || 'import.csv'

  if (!isSupportedImportFile(importedFileName)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported.',
    })
  }

  const words = parseWordRowsFromBuffer(filePart.data, importedFileName)
  const customTitle = titlePart?.data ? Buffer.from(titlePart.data).toString('utf8').trim() : ''
  const title = customTitle || getTitleFromFileName(importedFileName)

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
})
