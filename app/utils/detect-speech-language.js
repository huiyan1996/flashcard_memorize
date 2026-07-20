const SCRIPT_PATTERNS = {
  thai: /[\u0E00-\u0E7F]/g,
  cjk: /[\u3400-\u9FFF\uF900-\uFAFF]/g,
  hiragana: /[\u3040-\u309F]/g,
  katakana: /[\u30A0-\u30FF]/g,
  hangul: /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g,
  latin: /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/g,
}

const countMatches = (text, pattern) => {
  const matches = text.match(pattern)
  return matches ? matches.length : 0
}

const getLetterCounts = (text) => {
  const thai = countMatches(text, SCRIPT_PATTERNS.thai)
  const cjk = countMatches(text, SCRIPT_PATTERNS.cjk)
  const hiragana = countMatches(text, SCRIPT_PATTERNS.hiragana)
  const katakana = countMatches(text, SCRIPT_PATTERNS.katakana)
  const hangul = countMatches(text, SCRIPT_PATTERNS.hangul)
  const latin = countMatches(text, SCRIPT_PATTERNS.latin)
  const japaneseKana = hiragana + katakana
  const total = thai + cjk + japaneseKana + hangul + latin

  return {
    thai,
    cjk,
    japaneseKana,
    hangul,
    latin,
    total,
  }
}

const hasEnoughShare = (count, total, minimumCount = 1, minimumShare = 0.3) => {
  if (count < minimumCount || total <= 0) {
    return false
  }

  return count / total >= minimumShare
}

/**
 * Heuristic check: does `text` look like the configured speech language?
 * Uses script detection (Thai, CJK, kana, Hangul, Latin) — not a full language ID.
 */
export const isTextMatchingSpeechLanguage = (text, speechLanguage = '') => {
  const normalizedText = String(text || '').trim()
  const langCode = String(speechLanguage || '').trim()

  if (!normalizedText || !langCode) {
    return false
  }

  const languagePrefix = langCode.split('-')[0].toLowerCase()
  const counts = getLetterCounts(normalizedText)

  if (counts.total === 0) {
    return false
  }

  if (languagePrefix === 'th') {
    return hasEnoughShare(counts.thai, counts.total)
  }

  if (languagePrefix === 'ko') {
    return hasEnoughShare(counts.hangul, counts.total)
  }

  if (languagePrefix === 'ja') {
    if (counts.japaneseKana > 0) {
      return hasEnoughShare(counts.japaneseKana + counts.cjk, counts.total)
    }

    return hasEnoughShare(counts.cjk, counts.total, 2, 0.5)
  }

  if (languagePrefix === 'zh') {
    if (counts.japaneseKana > 0 || counts.hangul > 0 || counts.thai > 0) {
      return false
    }

    return hasEnoughShare(counts.cjk, counts.total)
  }

  // Latin-script languages (en, es, fr, de, vi, id, ms, ...)
  if (counts.thai > 0 || counts.hangul > 0 || counts.japaneseKana > 0) {
    return false
  }

  if (counts.cjk > 0 && counts.cjk >= counts.latin) {
    return false
  }

  return hasEnoughShare(counts.latin, counts.total)
}
