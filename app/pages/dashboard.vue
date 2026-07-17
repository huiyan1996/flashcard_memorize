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

const displayName = computed(() => {
  const name = String(user.value?.name || '').trim()
  return name || t('common.there')
})
</script>
