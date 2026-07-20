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

    if (!voices.length) {
      return null
    }

    const normalizeLang = (value) => String(value || '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')

    const target = normalizeLang(lang)
    const targetPrefix = target.split('-')[0]

    const scored = voices
      .map((voice) => {
        const voiceLang = normalizeLang(voice.lang)
        const voicePrefix = voiceLang.split('-')[0]
        let score = 0

        if (voiceLang === target) {
          score += 100
        } else if (voiceLang.startsWith(`${targetPrefix}-`) || voicePrefix === targetPrefix) {
          score += 60
        } else {
          return null
        }

        // Prefer on-device voices; remote/network voices are flakier on mobile
        if (voice.localService) {
          score += 20
        }

        if (voice.default) {
          score += 5
        }

        return { voice, score }
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)

    return scored[0]?.voice || null
  }

  const sanitizeSpeechText = (text) => String(text || '')
    .replace(/\p{P}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const createUtterance = (text, lang) => {
    const utterance = new SpeechSynthesisUtterance(text)

    if (lang) {
      // Normalize th_TH → th-TH style tags some Android voices use
      const normalizedLang = String(lang).replace(/_/g, '-')
      utterance.lang = normalizedLang
      const voice = pickVoice(normalizedLang)

      if (voice) {
        utterance.voice = voice
        // Keep lang aligned with the chosen voice to reduce mid-utterance switching
        if (voice.lang) {
          utterance.lang = voice.lang
        }
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
