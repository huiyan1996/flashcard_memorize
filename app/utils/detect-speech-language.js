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

const getLanguagePrefix = (speechLanguage = '') => (
  String(speechLanguage || '').trim().split('-')[0].toLowerCase()
)

/**
 * Keep only script segments that belong to the configured speech language.
 * Mixed Chinese/Thai notes are common; speaking the whole string causes
 * mobile TTS engines to language-switch mid utterance (中泰混读).
 */
export const extractSpeechTextForLanguage = (text, speechLanguage = '') => {
  const normalizedText = String(text || '').trim()
  const languagePrefix = getLanguagePrefix(speechLanguage)

  if (!normalizedText || !languagePrefix) {
    return ''
  }

  let keepPattern = null

  if (languagePrefix === 'th') {
    keepPattern = /[\u0E00-\u0E7F0-9\s]+/g
  } else if (languagePrefix === 'zh') {
    keepPattern = /[\u3400-\u9FFF\uF900-\uFAFF0-9\s]+/g
  } else if (languagePrefix === 'ja') {
    keepPattern = /[\u3040-\u309F\u30A0-\u30FF\u3400-\u9FFF\uF900-\uFAFF0-9\s]+/g
  } else if (languagePrefix === 'ko') {
    keepPattern = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF0-9\s]+/g
  } else {
    // Latin-script languages: drop Thai / CJK / Hangul / kana runs
    keepPattern = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF0-9\s'-]+/g
  }

  const parts = normalizedText.match(keepPattern) || []

  return parts
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .trim()
}

/**
 * Heuristic check: does `text` contain enough of the configured speech language
 * to be worth speaking? Mixed-script text can still match if target script is present;
 * callers should speak `extractSpeechTextForLanguage(...)` rather than the raw string.
 */
export const isTextMatchingSpeechLanguage = (text, speechLanguage = '') => {
  const normalizedText = String(text || '').trim()
  const langCode = String(speechLanguage || '').trim()

  if (!normalizedText || !langCode) {
    return false
  }

  const languagePrefix = getLanguagePrefix(langCode)
  const extracted = extractSpeechTextForLanguage(normalizedText, langCode)
  const counts = getLetterCounts(extracted)

  if (!extracted || counts.total === 0) {
    return false
  }

  // Require a real amount of target-language letters in the extracted text
  if (languagePrefix === 'th') {
    return hasEnoughShare(counts.thai, counts.total, 2, 0.6)
  }

  if (languagePrefix === 'ko') {
    return hasEnoughShare(counts.hangul, counts.total, 2, 0.6)
  }

  if (languagePrefix === 'ja') {
    return hasEnoughShare(counts.japaneseKana + counts.cjk, counts.total, 2, 0.6)
  }

  if (languagePrefix === 'zh') {
    return hasEnoughShare(counts.cjk, counts.total, 1, 0.6)
  }

  return hasEnoughShare(counts.latin, counts.total, 2, 0.6)
}
