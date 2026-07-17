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
  let resumeKeepAliveTimer = null

  const clearStartWatch = () => {
    if (startWatchTimer) {
      window.clearTimeout(startWatchTimer)
      startWatchTimer = null
    }
  }

  const clearResumeKeepAlive = () => {
    if (resumeKeepAliveTimer) {
      window.clearInterval(resumeKeepAliveTimer)
      resumeKeepAliveTimer = null
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
   * Warm voices on first user gesture. Do not speak/cancel here — on WebKit,
   * cancel() clears the queue asynchronously and will wipe a following speak().
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
    clearResumeKeepAlive()

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
    return voices.find((voice) => voice.lang.startsWith(`${languagePrefix}-`) || voice.lang === languagePrefix) || null
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

    unlockSpeech()
    ensureVoicesListener()
    refreshVoices()

    if (!cachedVoices.length && isLikelyBrokenOemBrowser()) {
      markSpeechIssue('oem-browser')
    }

    speakRequestId += 1
    const requestId = speakRequestId
    let hasStarted = false
    clearStartWatch()
    clearResumeKeepAlive()

    const buildUtterance = () => {
      const utterance = new SpeechSynthesisUtterance(nextText)
      utterance.volume = 1
      utterance.rate = 1
      utterance.pitch = 1

      if (lang) {
        utterance.lang = lang

        // Prefer lang-only until voices exist. Setting a missing voice breaks WebKit.
        if (!isLikelyBrokenOemBrowser() && cachedVoices.length) {
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

        // iOS can pause mid-utterance; keep it alive for short words too.
        if (ios) {
          clearResumeKeepAlive()
          resumeKeepAliveTimer = window.setInterval(() => {
            if (requestId !== speakRequestId || !window.speechSynthesis.speaking) {
              clearResumeKeepAlive()
              return
            }

            try {
              window.speechSynthesis.pause()
              window.speechSynthesis.resume()
            } catch {
              clearResumeKeepAlive()
            }
          }, 5000)
        }
      }

      utterance.onend = () => {
        if (requestId !== speakRequestId) {
          return
        }

        clearResumeKeepAlive()
        isSpeaking.value = false
      }

      utterance.onerror = (event) => {
        if (requestId !== speakRequestId) {
          return
        }

        clearResumeKeepAlive()

        const errorType = event?.error || ''

        // cancel()/new speak() commonly fires these; not a real failure.
        if (errorType === 'interrupted' || errorType === 'canceled') {
          if (!hasStarted) {
            isSpeaking.value = false
          }
          return
        }

        if (!hasStarted) {
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

    // WebKit bug: speak() immediately after cancel() is often discarded.
    // Only cancel when replacing an active utterance, then delay the next speak.
    // First unlock speak must stay synchronous with the user tap — never cancel first.
    if (wasBusy) {
      window.speechSynthesis.cancel()
      window.setTimeout(runSpeak, 60)
    } else {
      runSpeak()
    }

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
    }, 1500)

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
    clearResumeKeepAlive()
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
