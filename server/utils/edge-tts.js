import { EdgeTTS, VoicesManager } from 'edge-tts-universal'

const DEFAULT_VOICES = {
  'th-TH': 'th-TH-PremwadeeNeural',
  'en-US': 'en-US-EmmaMultilingualNeural',
  'en-GB': 'en-GB-SoniaNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-TW': 'zh-TW-HsiaoChenNeural',
  'ja-JP': 'ja-JP-NanamiNeural',
  'ko-KR': 'ko-KR-SunHiNeural',
  'es-ES': 'es-ES-ElviraNeural',
  'fr-FR': 'fr-FR-DeniseNeural',
  'de-DE': 'de-DE-KatjaNeural',
  'vi-VN': 'vi-VN-HoaiMyNeural',
  'id-ID': 'id-ID-GadisNeural',
  'ms-MY': 'ms-MY-YasminNeural',
}

let voicesManagerPromise = null

const getVoicesManager = () => {
  if (!voicesManagerPromise) {
    voicesManagerPromise = VoicesManager.create()
  }

  return voicesManagerPromise
}

const normalizeLang = (lang) => String(lang || '')
  .trim()
  .replace(/_/g, '-')

export const resolveVoiceForLang = async (lang) => {
  const normalized = normalizeLang(lang)

  if (DEFAULT_VOICES[normalized]) {
    return DEFAULT_VOICES[normalized]
  }

  const voicesManager = await getVoicesManager()
  const exactMatches = voicesManager.find({ Locale: normalized })

  if (exactMatches.length) {
    return exactMatches[0].ShortName
  }

  const languagePrefix = normalized.split('-')[0]
  const languageMatches = voicesManager.find({ Language: languagePrefix })

  if (languageMatches.length) {
    return languageMatches[0].ShortName
  }

  return DEFAULT_VOICES['en-US']
}

const synthesizePart = async (text, voice) => {
  const tts = new EdgeTTS(text, voice)
  const result = await tts.synthesize()

  return Buffer.from(await result.audio.arrayBuffer())
}

export const synthesizeSpeech = async (text, lang = 'en-US') => {
  const voice = await resolveVoiceForLang(lang)

  return synthesizePart(text, voice)
}

export const synthesizeSpeechParts = async (parts, lang = 'en-US') => {
  const texts = parts.filter(Boolean)

  if (!texts.length) {
    throw new Error('No text to synthesize.')
  }

  const voice = await resolveVoiceForLang(lang)

  if (texts.length === 1) {
    return synthesizePart(texts[0], voice)
  }

  const buffers = await Promise.all(
    texts.map((text) => synthesizePart(text, voice)),
  )

  return Buffer.concat(buffers)
}
