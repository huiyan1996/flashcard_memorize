const isIOSDevice = () => {
  if (!import.meta.client) {
    return false
  }

  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

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
  let hasSpokenSuccessfully = false
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
   * Prime speech on the first user gesture. iOS Safari often swallows the first
   * real utterance unless the engine has already been touched in-gesture.
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

      if (isIOSDevice()) {
        const prime = new SpeechSynthesisUtterance('\u200B')
        prime.rate = 2
        prime.pitch = 1
        prime.volume = 0.01
        window.speechSynthesis.speak(prime)
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

    const ios = isIOSDevice()
    const needsIOSRetry = ios && !hasSpokenSuccessfully

    unlockSpeech()
    ensureVoicesListener()
    refreshVoices()

    speakRequestId += 1
    const requestId = speakRequestId
    let hasStarted = false

    const buildUtterance = () => {
      const utterance = new SpeechSynthesisUtterance(nextText)

      if (lang) {
        utterance.lang = lang

        // Setting .voice on iOS before voices settle often kills the first speak.
        if (!ios) {
          const voice = pickVoice(lang)

          if (voice) {
            utterance.voice = voice
          }
        }
      }

      utterance.onstart = () => {
        if (requestId !== speakRequestId) {
          return
        }

        hasStarted = true
        hasSpokenSuccessfully = true
        isSpeaking.value = true
      }

      utterance.onend = () => {
        if (requestId === speakRequestId) {
          isSpeaking.value = false
        }
      }

      utterance.onerror = () => {
        if (requestId === speakRequestId && !hasStarted) {
          isSpeaking.value = false
        }
      }

      return utterance
    }

    const runSpeak = () => {
      if (requestId !== speakRequestId) {
        return
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance = buildUtterance()
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

    if (wasBusy && !needsIOSRetry) {
      window.speechSynthesis.cancel()
      window.setTimeout(runSpeak, 80)
      return true
    }

    // On iOS first speak: queue the word in the same gesture, then retry once
    // if WebKit swallowed the first utterance (very common on first flip).
    if (needsIOSRetry) {
      // Clear any near-silent unlock prime without waiting a full tick when possible.
      if (window.speechSynthesis.pending || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }

      runSpeak()

      window.setTimeout(() => {
        if (requestId !== speakRequestId || hasStarted) {
          return
        }

        window.speechSynthesis.cancel()
        runSpeak()
      }, 180)

      return true
    }

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
