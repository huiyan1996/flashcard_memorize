export default defineNuxtPlugin(() => {
  const { loadPreference, activeLocale } = useLocale()

  if (!import.meta.client) {
    return
  }

  loadPreference()
  document.documentElement.lang = activeLocale.value
})
