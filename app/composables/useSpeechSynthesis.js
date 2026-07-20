export const useSpeechSynthesis = () => {
  const isSupported = computed(() => {
    if (!import.meta.client) {
      return false
    }

    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
  })

  const isSpeaking = ref(false)
  let speakRequestId = 0
  let voicesChangedHandler = null

  const clearVoicesHandler = () => {
    if (!import.meta.client || !voicesChangedHandler) {
      return
    }

    window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler)
    voicesChangedHandler = null
  }

  const stopSpeaking = () => {
    speakRequestId += 1
    clearVoicesHandler()

    if (!import.meta.client || !isSupported.value) {
      isSpeaking.value = false
      return
    }

    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }

  const pickVoice = (lang) => {
    if (!import.meta.client || !lang) {
      return null
    }

    const voices = window.speechSynthesis.getVoices()
    const exactMatch = voices.find((voice) => voice.lang === lang)

    if (exactMatch) {
      return exactMatch
    }

    const languagePrefix = lang.split('-')[0]
    return voices.find((voice) => voice.lang.startsWith(languagePrefix)) || null
  }

  const sanitizeSpeechText = (text) => String(text || '')
    .replace(/\p{P}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const createUtterance = (text, lang) => {
    const utterance = new SpeechSynthesisUtterance(text)

    if (lang) {
      utterance.lang = lang
      const voice = pickVoice(lang)

      if (voice) {
        utterance.voice = voice
      }
    }

    return utterance
  }

  const speakParts = (parts, lang = '') => {
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

    const runSpeak = () => {
      if (requestId !== speakRequestId) {
        return
      }

      clearVoicesHandler()

      const queueNext = (index) => {
        if (requestId !== speakRequestId) {
          return
        }

        if (index >= texts.length) {
          isSpeaking.value = false
          return
        }

        const utterance = createUtterance(texts[index], lang)

        utterance.onend = () => {
          queueNext(index + 1)
        }

        utterance.onerror = () => {
          if (requestId === speakRequestId) {
            isSpeaking.value = false
          }
        }

        isSpeaking.value = true
        window.speechSynthesis.speak(utterance)
      }

      queueNext(0)
    }

    const voices = window.speechSynthesis.getVoices()

    if (!voices.length) {
      voicesChangedHandler = runSpeak
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler)
      window.speechSynthesis.getVoices()
      return true
    }

    runSpeak()
    return true
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
