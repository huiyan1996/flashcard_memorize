import { createError } from 'h3'
import * as XLSXNamespace from 'xlsx'

const XLSX = XLSXNamespace.default || XLSXNamespace

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

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/haansoftxlsx',
])

const CSV_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
  'text/plain',
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

const looksLikeXlsx = (data) => {
  return data.length >= 2 && data[0] === 0x50 && data[1] === 0x4b
}

const looksLikeXls = (data) => {
  return (
    data.length >= 8
    && data[0] === 0xd0
    && data[1] === 0xcf
    && data[2] === 0x11
    && data[3] === 0xe0
  )
}

const hasUtf8Bom = (data) => {
  return data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf
}

const decodeCsvText = (data) => {
  const bytes = hasUtf8Bom(data) ? data.subarray(3) : data
  return Buffer.from(bytes).toString('utf8')
}

export const detectImportExtension = (fileName = '', mimeType = '', buffer) => {
  const matchedExtension = String(fileName).match(/\.(csv|xlsx|xls)$/i)?.[1]

  if (matchedExtension) {
    return matchedExtension.toLowerCase()
  }

  const normalizedMime = String(mimeType || '').toLowerCase()

  if (normalizedMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'xlsx'
  }

  if (normalizedMime === 'application/vnd.ms-excel' || normalizedMime === 'application/haansoftxlsx') {
    return 'xls'
  }

  if (CSV_MIME_TYPES.has(normalizedMime)) {
    return 'csv'
  }

  if (buffer) {
    const data = toUint8Array(buffer)

    if (looksLikeXlsx(data)) {
      return 'xlsx'
    }

    if (looksLikeXls(data)) {
      return 'xls'
    }
  }

  return ''
}

export const resolveImportFileName = (fileName = '', mimeType = '', buffer) => {
  const baseName = String(fileName).split(/[/\\]/).pop()?.trim() || ''

  if (/\.(csv|xlsx|xls)$/i.test(baseName)) {
    return baseName
  }

  const extension = detectImportExtension(baseName, mimeType, buffer) || 'csv'
  const safeBase = baseName || 'import'

  return `${safeBase}.${extension}`
}

const readWorkbook = (buffer, fileName = '') => {
  const data = toUint8Array(buffer)
  const isCsv = /\.csv$/i.test(fileName)

  if (isCsv) {
    const csvText = decodeCsvText(data)

    return XLSX.read(csvText, {
      type: 'string',
      raw: false,
      cellDates: true,
    })
  }

  return XLSX.read(data, {
    type: 'array',
    raw: false,
    cellDates: true,
  })
}

export const parseWordRowsFromBuffer = (buffer, fileName = '') => {
  let workbook

  try {
    workbook = readWorkbook(buffer, fileName)
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

export const isSupportedImportFile = (fileName = '', mimeType = '', buffer) => {
  if (/\.(csv|xlsx|xls)$/i.test(fileName)) {
    return true
  }

  const normalizedMime = String(mimeType || '').toLowerCase()

  if (EXCEL_MIME_TYPES.has(normalizedMime) || CSV_MIME_TYPES.has(normalizedMime)) {
    return true
  }

  if (!buffer) {
    return false
  }

  const data = toUint8Array(buffer)

  return looksLikeXlsx(data) || looksLikeXls(data)
}
