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
  let isUnlocked = false
  let cachedVoices = []

  const clearVoicesHandler = () => {
    if (!import.meta.client || !voicesChangedHandler) {
      return
    }

    window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler)
    voicesChangedHandler = null
  }

  const refreshVoices = () => {
    if (!import.meta.client || !isSupported.value) {
      return []
    }

    cachedVoices = window.speechSynthesis.getVoices() || []
    return cachedVoices
  }

  const ensureVoicesListener = () => {
    if (!import.meta.client || !isSupported.value || voicesChangedHandler) {
      return
    }

    voicesChangedHandler = () => {
      refreshVoices()
    }

    window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler)
    refreshVoices()
  }

  /**
   * Mobile browsers (especially iOS Safari) need speech synthesis primed
   * after a user gesture. Keep this lightweight — avoid cancel() here so a
   * following speak() in the same tap is not dropped.
   */
  const unlockSpeech = () => {
    if (!import.meta.client || !isSupported.value || isUnlocked) {
      return
    }

    isUnlocked = true
    ensureVoicesListener()
    refreshVoices()

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch {
      // Ignore unlock failures; later speak() may still work.
    }
  }

  const stopSpeaking = () => {
    speakRequestId += 1

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

    const voices = cachedVoices.length ? cachedVoices : refreshVoices()
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

    unlockSpeech()
    ensureVoicesListener()
    refreshVoices()

    speakRequestId += 1
    const requestId = speakRequestId

    const runSpeak = () => {
      if (requestId !== speakRequestId) {
        return
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = new SpeechSynthesisUtterance(nextText)

      if (lang) {
        utterance.lang = lang
        const voice = pickVoice(lang)

        if (voice) {
          utterance.voice = voice
        }
      }

      utterance.onstart = () => {
        if (requestId === speakRequestId) {
          isSpeaking.value = true
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

      try {
        window.speechSynthesis.speak(utterance)

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }
      } catch {
        isSpeaking.value = false
      }
    }

    const wasBusy = window.speechSynthesis.speaking || window.speechSynthesis.pending

    if (wasBusy) {
      window.speechSynthesis.cancel()
      // cancel() + speak() in the same tick drops the first utterance on many phones.
      window.setTimeout(runSpeak, 80)
      return true
    }

    // Speak in the same user-gesture turn so iOS allows audio.
    runSpeak()
    return true
  }

  onMounted(() => {
    if (!import.meta.client || !isSupported.value) {
      return
    }

    ensureVoicesListener()
  })

  onBeforeUnmount(() => {
    stopSpeaking()
    clearVoicesHandler()
  })

  return {
    isSupported,
    isSpeaking,
    speak,
    stopSpeaking,
    unlockSpeech,
  }
}
