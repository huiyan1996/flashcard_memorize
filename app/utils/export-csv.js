const escapeCsvCell = (value) => {
  const text = String(value ?? '')

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

export const buildWordsCsv = (words = []) => {
  const rows = [
    ['word', 'meaning', 'description'],
    ...(Array.isArray(words) ? words : []).map((item) => [
      item?.word || '',
      item?.meaning || '',
      item?.description || '',
    ]),
  ]

  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`
}

export const sanitizeFileName = (title = '') => {
  const cleaned = String(title || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)

  return cleaned || 'word-set'
}

export const downloadCsvFile = (fileName, csvContent) => {
  if (!import.meta.client) {
    return
  }

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
