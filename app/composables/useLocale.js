import {
  DEFAULT_LOCALE,
  DEVICE_LOCALE,
  LOCALE_OPTIONS,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  messages,
  resolveDeviceLocale,
} from '~/utils/locales'

const localePreference = ref(DEVICE_LOCALE)
const deviceLocale = ref(DEFAULT_LOCALE)
let hasLoadedPreference = false

const getNestedValue = (source, path) => {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key]
    }

    return undefined
  }, source)
}

const interpolate = (template, params = {}) => {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    if (params[key] === undefined || params[key] === null) {
      return `{${key}}`
    }

    return String(params[key])
  })
}

export const useLocale = () => {
  const activeLocale = computed(() => {
    if (localePreference.value === DEVICE_LOCALE) {
      return deviceLocale.value
    }

    return localePreference.value
  })

  const t = (key, params = {}) => {
    const localeMessages = messages[activeLocale.value] || messages[DEFAULT_LOCALE]
    const fallbackMessages = messages[DEFAULT_LOCALE]
    const value = getNestedValue(localeMessages, key) ?? getNestedValue(fallbackMessages, key)

    if (typeof value !== 'string') {
      return key
    }

    return interpolate(value, params)
  }

  const refreshDeviceLocale = () => {
    deviceLocale.value = resolveDeviceLocale()
  }

  const loadPreference = () => {
    refreshDeviceLocale()

    if (!import.meta.client) {
      return
    }

    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)

    if (stored === DEVICE_LOCALE || SUPPORTED_LOCALES.some((item) => item.code === stored)) {
      localePreference.value = stored
    } else {
      localePreference.value = DEVICE_LOCALE
    }

    document.documentElement.lang = activeLocale.value
    hasLoadedPreference = true
  }

  const setLocalePreference = (nextPreference) => {
    const isValid = nextPreference === DEVICE_LOCALE
      || SUPPORTED_LOCALES.some((item) => item.code === nextPreference)

    if (!isValid) {
      return
    }

    localePreference.value = nextPreference
    refreshDeviceLocale()

    if (import.meta.client) {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextPreference)
      document.documentElement.lang = activeLocale.value
    }
  }

  const handleLocaleChange = (event) => {
    setLocalePreference(event?.target?.value)
  }

  if (import.meta.client && !hasLoadedPreference) {
    loadPreference()
  }

  return {
    localePreference,
    activeLocale,
    deviceLocale,
    localeOptions: LOCALE_OPTIONS,
    supportedLocales: SUPPORTED_LOCALES,
    t,
    setLocalePreference,
    handleLocaleChange,
    refreshDeviceLocale,
    loadPreference,
  }
}
