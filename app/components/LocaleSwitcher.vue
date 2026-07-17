<template>
  <label class="inline-flex items-center gap-2">
    <span class="sr-only">{{ t('nav.language') }}</span>
    <select
      :value="localePreference"
      class="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
      :aria-label="t('nav.language')"
      @change="handleLocaleChange"
    >
      <option
        v-for="option in selectOptions"
        :key="option.code"
        :value="option.code"
      >
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<script setup>
const { t, localePreference, handleLocaleChange, activeLocale, deviceLocale } = useLocale()

const selectOptions = computed(() => {
  const deviceLabel = `${t('language.device')} (${deviceLocale.value.toUpperCase()})`

  return [
    { code: 'device', label: deviceLabel },
    { code: 'en', label: t('language.en') },
    { code: 'zh', label: t('language.zh') },
    { code: 'th', label: t('language.th') },
  ]
})

watch(activeLocale, (locale) => {
  if (!import.meta.client) {
    return
  }

  document.documentElement.lang = locale
})
</script>
