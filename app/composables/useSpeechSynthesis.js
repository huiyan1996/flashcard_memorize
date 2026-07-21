export const useSpeechSynthesis = () => {
  const isSupported = computed(() => {
    if (!import.meta.client) {
      return false
    }

    return typeof Audio !== 'undefined'
  })

  const isSpeaking = ref(false)
  let speakRequestId = 0
  let audio = null
  let objectUrl = null

  const sanitizeSpeechText = (text) => String(text || '')
    .replace(/\p{P}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const cleanupAudio = () => {
    if (audio) {
      audio.pause()
      audio.onended = null
      audio.onerror = null
      audio = null
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = null
    }
  }

  const stopSpeaking = () => {
    speakRequestId += 1
    cleanupAudio()
    isSpeaking.value = false
  }

  const fetchSpeechAudio = async (texts, lang) => {
    const body = texts.length === 1
      ? { text: texts[0], lang }
      : { parts: texts, lang }

    return await $fetch('/api/tts/speak', {
      method: 'POST',
      body,
      responseType: 'blob',
    })
  }

  const playAudioBlob = (blob, requestId) => {
    return new Promise((resolve, reject) => {
      if (requestId !== speakRequestId) {
        resolve()
        return
      }

      cleanupAudio()
      objectUrl = URL.createObjectURL(blob)
      audio = new Audio(objectUrl)

      audio.onended = () => {
        if (requestId === speakRequestId) {
          cleanupAudio()
        }

        resolve()
      }

      audio.onerror = () => {
        if (requestId === speakRequestId) {
          cleanupAudio()
        }

        reject(new Error('Speech playback failed.'))
      }

      audio.play().catch(reject)
    })
  }

  const speakParts = async (parts, lang = '') => {
    if (!import.meta.client || !isSupported.value) {
      return false
    }

    const texts = (Array.isArray(parts) ? parts : [parts])
      .map((item) => sanitizeSpeechText(item))
      .filter(Boolean)

    if (!texts.length) {
      return false
    }

    stopSpeaking()
    const requestId = speakRequestId
    isSpeaking.value = true

    try {
      const audioBlob = await fetchSpeechAudio(texts, lang)

      if (requestId !== speakRequestId) {
        return false
      }

      await playAudioBlob(audioBlob, requestId)

      if (requestId === speakRequestId) {
        isSpeaking.value = false
      }

      return true
    } catch {
      if (requestId === speakRequestId) {
        isSpeaking.value = false
      }

      return false
    }
  }

  const speak = (text, lang = '') => speakParts([text], lang)

  onBeforeUnmount(() => {
    stopSpeaking()
  })

  return {
    isSupported,
    isSpeaking,
    speak,
    speakParts,
    stopSpeaking,
  }
}
