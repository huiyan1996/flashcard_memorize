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

  const speak = (text, lang = '') => {
    if (!import.meta.client || !isSupported.value) {
      return false
    }

    const nextText = String(text || '').trim()

    if (!nextText) {
      return false
    }

    stopSpeaking()
    const requestId = speakRequestId

    const runSpeak = () => {
      if (requestId !== speakRequestId) {
        return
      }

      clearVoicesHandler()

      const utterance = new SpeechSynthesisUtterance(nextText)

      if (lang) {
        utterance.lang = lang
        const voice = pickVoice(lang)

        if (voice) {
          utterance.voice = voice
        }
      }

      utterance.onend = () => {
        if (requestId === speakRequestId) {
          isSpeaking.value = false
        }
      }

      utterance.onerror = () => {
        if (requestId === speakRequestId) {
          isSpeaking.value = false
        }
      }

      isSpeaking.value = true
      window.speechSynthesis.speak(utterance)
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

  onBeforeUnmount(() => {
    stopSpeaking()
  })

  return {
    isSupported,
    isSpeaking,
    speak,
    stopSpeaking,
  }
}
