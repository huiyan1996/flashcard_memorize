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

export const parseWordRowsFromBuffer = (buffer, fileName = '') => {
  const isCsv = /\.csv$/i.test(fileName)
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    raw: false,
    codepage: isCsv ? 65001 : undefined,
  })

  const firstSheetName = workbook.SheetNames[0]

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

  return withoutExtension || 'Untitled word set'
}

export const isSupportedImportFile = (fileName = '') => {
  return /\.(csv|xlsx|xls)$/i.test(fileName)
}
