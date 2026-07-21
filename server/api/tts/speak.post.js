import { requireAuthUser } from '../../utils/auth'
import { synthesizeSpeechParts } from '../../utils/edge-tts'
import { SPEECH_LANGUAGE_CODES } from '../../utils/speech-languages'

const MAX_TEXT_LENGTH = 500
const MAX_PARTS = 8

const sanitizeSpeechText = (text) => String(text || '')
  .replace(/\p{P}+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const collectSpeechTexts = (body) => {
  const rawParts = Array.isArray(body?.parts) ? body.parts : [body?.text]

  return rawParts
    .map((item) => sanitizeSpeechText(item))
    .filter(Boolean)
}

export default defineEventHandler(async (event) => {
  requireAuthUser(event)

  const body = await readBody(event)
  const texts = collectSpeechTexts(body)
  const lang = String(body?.lang || 'en-US').trim().replace(/_/g, '-')

  if (!texts.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Text is required.',
    })
  }

  if (texts.length > MAX_PARTS) {
    throw createError({
      statusCode: 400,
      statusMessage: `At most ${MAX_PARTS} speech parts are allowed.`,
    })
  }

  const totalLength = texts.reduce((sum, text) => sum + text.length, 0)

  if (totalLength > MAX_TEXT_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
    })
  }

  if (!SPEECH_LANGUAGE_CODES.includes(lang)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported speech language.',
    })
  }

  try {
    const audioBuffer = await synthesizeSpeechParts(texts, lang)

    setHeader(event, 'Content-Type', 'audio/mpeg')
    setHeader(event, 'Cache-Control', 'private, max-age=3600')

    return audioBuffer
  } catch (error) {
    console.error('TTS synthesis failed:', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Speech synthesis failed.',
    })
  }
})
