import { createError } from 'h3'
import * as XLSX from 'xlsx'

const HEADER_WORDS = new Set([
  'word',
  'words',
  'term',
  'vocabulary',
  '单词',
  '詞',
  '词',
  '單字',
  '单字',
])

const HEADER_MEANINGS = new Set([
  'meaning',
  'meanings',
  'translation',
  'translations',
  'definition',
  '释义',
  '意思',
  '翻譯',
  '翻译',
  '含義',
  '含义',
])

const cellToString = (value) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

const isHeaderRow = (word, meaning) => {
  const normalizedWord = word.toLowerCase()
  const normalizedMeaning = meaning.toLowerCase()

  return HEADER_WORDS.has(normalizedWord) || HEADER_MEANINGS.has(normalizedMeaning)
}

const toUint8Array = (input) => {
  if (input instanceof Uint8Array) {
    return input
  }

  if (Buffer.isBuffer(input)) {
    return new Uint8Array(input)
  }

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }

  return new Uint8Array(Buffer.from(input))
}

export const parseWordRowsFromBuffer = (buffer, fileName = '') => {
  let workbook

  try {
    const data = toUint8Array(buffer)
    const isCsv = /\.csv$/i.test(fileName)

    workbook = XLSX.read(data, {
      type: 'array',
      raw: false,
      cellDates: true,
      codepage: isCsv ? 65001 : undefined,
    })
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: `Could not read ${fileName || 'the uploaded file'}. Make sure it is a valid CSV or Excel file.`,
      data: {
        cause: error?.message || 'Unknown parse error',
      },
    })
  }

  const firstSheetName = workbook.SheetNames?.[0]

  if (!firstSheetName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'The file has no sheets to import.',
    })
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  })

  const words = []

  for (const row of rows) {
    if (!Array.isArray(row) || row.length === 0) {
      continue
    }

    const word = cellToString(row[0])
    const meaning = cellToString(row[1])
    const description = cellToString(row[2])

    if (!word && !meaning) {
      continue
    }

    if (words.length === 0 && isHeaderRow(word, meaning)) {
      continue
    }

    if (!word || !meaning) {
      continue
    }

    words.push({
      word,
      meaning,
      description,
    })
  }

  if (words.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `No valid words found in ${fileName || 'the uploaded file'}. Column A needs a word and column B needs a meaning.`,
    })
  }

  return words
}

export const getTitleFromFileName = (fileName = '') => {
  const baseName = String(fileName).split(/[/\\]/).pop() || 'Untitled word set'
  const withoutExtension = baseName.replace(/\.(csv|xlsx|xls)$/i, '').trim()
  const title = withoutExtension || 'Untitled word set'

  return title.slice(0, 200)
}

export const isSupportedImportFile = (fileName = '') => {
  return /\.(csv|xlsx|xls)$/i.test(fileName)
}
