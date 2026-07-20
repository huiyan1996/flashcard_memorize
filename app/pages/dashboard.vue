<template>
  <section class="space-y-6">
    <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      <div class="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div class="max-w-2xl">
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {{ t('dashboard.welcome', { name: displayName }) }}
          </h1>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {{ t('dashboard.intro') }}
          </p>
        </div>

        <div
          class="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-emerald-100 sm:h-36 sm:w-36"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-14 w-14 text-emerald-700 sm:h-16 sm:w-16"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">
            Test scores
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            Vocabulary quiz results by word set
          </p>
        </div>

        <div
          v-if="wordSetOptions.length"
          class="flex flex-col gap-2 sm:items-end"
        >
          <label
            for="score-word-set"
            class="text-sm font-medium text-slate-700"
          >
            Word set
          </label>
          <select
            id="score-word-set"
            v-model="selectedWordSetId"
            class="min-w-[14rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            aria-label="Select word set for score chart"
            @change="handleWordSetChange"
          >
            <option
              v-for="option in wordSetOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.title }}
            </option>
          </select>
          <p
            v-if="selectedLatestScore !== null"
            class="text-sm font-medium text-slate-700"
          >
            Latest: {{ selectedLatestScore }}%
          </p>
        </div>
      </div>

      <div
        v-if="isLoadingAttempts"
        class="mt-8 flex h-64 items-center justify-center text-sm text-slate-500"
      >
        Loading scores...
      </div>

      <p
        v-else-if="attemptsError"
        class="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        role="alert"
      >
        {{ attemptsError }}
      </p>

      <div
        v-else-if="attempts.length === 0"
        class="mt-8 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"
      >
        <p class="text-sm text-slate-600">
          No test scores yet. Take a vocabulary test from a word set to see your progress here.
        </p>
      </div>

      <div
        v-else-if="filteredAttempts.length === 0"
        class="mt-8 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"
      >
        <p class="text-sm text-slate-600">
          No scores for this word set yet.
        </p>
      </div>

      <div
        v-else
        class="mt-6"
      >
        <div class="relative h-72 w-full sm:h-80">
          <canvas
            ref="chartCanvas"
            aria-label="Quiz score chart by date and time for selected word set"
            role="img"
          />
        </div>

        <ul class="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          <li
            v-for="attempt in recentAttempts"
            :key="attempt.id"
            class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
          >
            <div>
              <p class="font-medium text-slate-900">
                {{ formatAttemptDate(attempt.createdAt) }}
              </p>
            </div>
            <p class="font-semibold text-indigo-600">
              {{ attempt.score }}%
              <span class="font-normal text-slate-500">
                ({{ attempt.correctCount }}/{{ attempt.totalCount }})
              </span>
            </p>
          </li>
        </ul>
      </div>
    </div>

    <div class="grid gap-6 sm:grid-cols-2">
      <NuxtLink
        to="/listing"
        class="group rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        :aria-label="t('dashboard.goMySets')"
        tabindex="0"
      >
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-7 w-7"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"
            />
          </svg>
        </div>
        <h2 class="mt-5 text-xl font-semibold text-slate-900">
          {{ t('dashboard.mySetsTitle') }}
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          {{ t('dashboard.mySetsDesc') }}
        </p>
        <div class="mt-6 flex justify-center text-indigo-600 transition group-hover:translate-x-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </div>
      </NuxtLink>

      <NuxtLink
        to="/community"
        class="group rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        :aria-label="t('dashboard.goCommunity')"
        tabindex="0"
      >
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-7 w-7"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
        </div>
        <h2 class="mt-5 text-xl font-semibold text-slate-900">
          {{ t('dashboard.communityTitle') }}
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          {{ t('dashboard.communityDesc') }}
        </p>
        <div class="mt-6 flex justify-center text-emerald-600 transition group-hover:translate-x-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const { user } = useAuth()
const { t } = useLocale()
const { $Chart } = useNuxtApp()

const attempts = ref([])
const selectedWordSetId = ref('')
const isLoadingAttempts = ref(true)
const attemptsError = ref('')
const chartCanvas = ref(null)
let chartInstance = null

const displayName = computed(() => {
  const name = String(user.value?.name || '').trim()
  return name || t('common.there')
})

const wordSetOptions = computed(() => {
  const byId = new Map()

  // Newest attempts last in `attempts`; walk newest-first for title freshness
  for (let index = attempts.value.length - 1; index >= 0; index -= 1) {
    const attempt = attempts.value[index]
    const id = attempt?.wordSetId

    if (!id || byId.has(id)) {
      continue
    }

    byId.set(id, {
      id,
      title: attempt.wordSetTitle || 'Untitled set',
      latestAt: attempt.createdAt,
    })
  }

  return [...byId.values()]
})

const filteredAttempts = computed(() => {
  if (!selectedWordSetId.value) {
    return []
  }

  return attempts.value.filter((item) => item.wordSetId === selectedWordSetId.value)
})

const selectedLatestScore = computed(() => {
  if (!filteredAttempts.value.length) {
    return null
  }

  return filteredAttempts.value[filteredAttempts.value.length - 1]?.score ?? null
})

const recentAttempts = computed(() => (
  [...filteredAttempts.value].reverse().slice(0, 8)
))

const formatAttemptDate = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

const renderChart = () => {
  if (!import.meta.client || !$Chart || !chartCanvas.value || !filteredAttempts.value.length) {
    destroyChart()
    return
  }

  destroyChart()

  const chartAttempts = filteredAttempts.value
  const labels = chartAttempts.map((item) => formatAttemptDate(item.createdAt))
  const scores = chartAttempts.map((item) => item.score)

  chartInstance = new $Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Score (%)',
          data: scores,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.12)',
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            afterLabel: (context) => {
              const attempt = chartAttempts[context.dataIndex]
              if (!attempt) {
                return ''
              }

              return `${attempt.correctCount}/${attempt.totalCount} correct`
            },
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
          title: {
            display: true,
            text: 'Score',
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
      },
    },
  })
}

const selectDefaultWordSet = () => {
  if (!attempts.value.length) {
    selectedWordSetId.value = ''
    return
  }

  const latestAttempt = attempts.value[attempts.value.length - 1]
  selectedWordSetId.value = latestAttempt?.wordSetId || ''
}

const handleWordSetChange = async () => {
  await nextTick()
  renderChart()
}

const loadAttempts = async () => {
  isLoadingAttempts.value = true
  attemptsError.value = ''

  try {
    const response = await $fetch('/api/quiz-attempts', {
      query: { limit: 100 },
    })
    attempts.value = response.attempts || []
    selectDefaultWordSet()
  } catch (error) {
    attemptsError.value = error?.data?.statusMessage || 'Failed to load test scores.'
    attempts.value = []
    selectedWordSetId.value = ''
  } finally {
    isLoadingAttempts.value = false
  }
}

watch(filteredAttempts, async () => {
  await nextTick()
  renderChart()
})

onMounted(async () => {
  await loadAttempts()
})

onBeforeUnmount(() => {
  destroyChart()
})
</script>
