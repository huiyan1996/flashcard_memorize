const isIOSDevice = () => {
  if (!import.meta.client) {
    return false
  }

  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

const isLikelyBrokenOemBrowser = () => {
  if (!import.meta.client) {
    return false
  }

  const ua = navigator.userAgent || ''

  // Vivo / iQOO / some OEM browsers advertise speechSynthesis but never play audio.
  return /VivoBrowser|IQOOBrowser|HeyTapBrowser|OPPOBrowser|HuaweiBrowser|MiuiBrowser/i.test(ua)
}

export const useSpeechSynthesis = () => {
  const isSupported = computed(() => {
    if (!import.meta.client) {
      return false
    }

    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
  })

  const isSpeaking = ref(false)
  const speechIssue = ref('')
  let speakRequestId = 0
  let voicesChangedHandler = null
  let isUnlocked = false
  let hasSpokenSuccessfully = false
  let cachedVoices = []
  let startWatchTimer = null

  const clearStartWatch = () => {
    if (startWatchTimer) {
      window.clearTimeout(startWatchTimer)
      startWatchTimer = null
    }
  }

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

      if (cachedVoices.length && speechIssue.value === 'no-voices') {
        speechIssue.value = ''
      }
    }

    window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler)
    refreshVoices()
  }

  const markSpeechIssue = (code) => {
    speechIssue.value = code
  }

  /**
   * Touch the speech engine on the first user gesture (voices + resume).
   * iOS warm-up (empty speak + cancel) happens inside speak() so it stays
   * in the same synchronous tap as the real word.
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
    clearStartWatch()

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
      markSpeechIssue('unsupported')
      return false
    }

    const nextText = String(text || '').trim()

    if (!nextText) {
      return false
    }

    const ios = isIOSDevice()

    // Must stay synchronous with the tap — no setTimeout before the first speak.
    unlockSpeech()
    ensureVoicesListener()
    refreshVoices()

    // OEM browsers (e.g. Vivo) often expose the API with zero usable voices.
    if (!cachedVoices.length && isLikelyBrokenOemBrowser()) {
      markSpeechIssue('oem-browser')
    }

    speakRequestId += 1
    const requestId = speakRequestId
    let hasStarted = false
    clearStartWatch()

    const buildUtterance = () => {
      const utterance = new SpeechSynthesisUtterance(nextText)

      if (lang) {
        utterance.lang = lang

        // Setting .voice on iOS before voices settle often kills the first speak.
        // On broken OEM browsers, also prefer lang-only.
        if (!ios && !isLikelyBrokenOemBrowser()) {
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
        speechIssue.value = ''
        clearStartWatch()
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
          markSpeechIssue(isLikelyBrokenOemBrowser() ? 'oem-browser' : 'failed')
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
        markSpeechIssue('failed')
      }
    }

    const wasBusy = window.speechSynthesis.speaking || window.speechSynthesis.pending

    // iOS: empty speak + cancel + real speak must run in the same user-gesture turn.
    // Do not schedule a delayed cancel/retry — that loses the gesture and kills audio.
    if (ios && !hasSpokenSuccessfully) {
      try {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
      } catch {
        // Continue; the real utterance may still work.
      }

      window.speechSynthesis.cancel()
      runSpeak()
    } else if (wasBusy) {
      window.speechSynthesis.cancel()
      runSpeak()
    } else {
      runSpeak()
    }

    // If nothing starts, the browser likely has a stub/broken TTS implementation.
    startWatchTimer = window.setTimeout(() => {
      if (requestId !== speakRequestId || hasStarted || hasSpokenSuccessfully) {
        return
      }

      isSpeaking.value = false
      markSpeechIssue(
        isLikelyBrokenOemBrowser() || !cachedVoices.length
          ? 'oem-browser'
          : 'failed',
      )
    }, 1200)

    return true
  }

  onMounted(() => {
    if (!import.meta.client || !isSupported.value) {
      if (import.meta.client) {
        markSpeechIssue('unsupported')
      }
      return
    }

    ensureVoicesListener()

    if (isLikelyBrokenOemBrowser() && !refreshVoices().length) {
      markSpeechIssue('oem-browser')
    }
  })

  onBeforeUnmount(() => {
    stopSpeaking()
    clearVoicesHandler()
    clearStartWatch()
  })

  return {
    isSupported,
    isSpeaking,
    speechIssue,
    speak,
    stopSpeaking,
    unlockSpeech,
  }
}
