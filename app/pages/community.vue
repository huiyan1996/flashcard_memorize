<template>
  <section>
    <div class="mb-6">
      <h1 class="text-3xl font-semibold text-slate-900">
        Community word sets
      </h1>
      <p class="mt-2 text-slate-600">
        Browse public word sets shared by other users and import them into your own list.
      </p>
    </div>

    <p
      v-if="errorMessage"
      class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <p
      v-if="successMessage"
      class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
      role="status"
    >
      {{ successMessage }}
    </p>

    <div
      v-if="isLoading"
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600"
    >
      Loading...
    </div>

    <div
      v-else-if="wordSets.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
    >
      <p class="text-slate-600">
        No public word sets from other users yet.
      </p>
    </div>

    <div
      v-else
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="hidden md:block">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Title
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Author
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Words
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Shared
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="wordSet in wordSets"
              :key="wordSet.id"
              class="hover:bg-slate-50"
            >
              <td class="px-4 py-4 font-medium text-slate-900">
                {{ wordSet.title }}
              </td>
              <td class="px-4 py-4 text-sm text-slate-600">
                {{ wordSet.createdBy?.name || 'Unknown' }}
              </td>
              <td class="px-4 py-4 text-sm text-slate-600">
                {{ wordSet.wordCount }}
              </td>
              <td class="px-4 py-4 text-sm text-slate-600">
                {{ formatDate(wordSet.createdAt) }}
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    :to="`/word-sets/${wordSet.id}`"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    :aria-label="`View ${wordSet.title}`"
                    tabindex="0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  </NuxtLink>

                  <button
                    type="button"
                    class="inline-flex h-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="importingId === wordSet.id"
                    :aria-label="`Import ${wordSet.title}`"
                    tabindex="0"
                    @click="handleImport(wordSet)"
                    @keydown.enter="handleImport(wordSet)"
                  >
                    {{ importingId === wordSet.id ? 'Importing...' : 'Import' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden">
        <div class="grid grid-cols-[auto_1fr_auto_auto] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span class="w-8" />
          <span>Title</span>
          <span class="text-center">Words</span>
          <span class="w-20 text-right">Actions</span>
        </div>

        <div
          v-for="(wordSet, rowIndex) in wordSets"
          :key="wordSet.id"
          class="border-b border-slate-200 last:border-b-0"
          :class="rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
        >
          <div class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 px-3 py-3">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :class="expandedRows[wordSet.id]
                ? 'bg-red-100 text-red-600'
                : 'bg-emerald-100 text-emerald-700'"
              :aria-expanded="Boolean(expandedRows[wordSet.id])"
              :aria-label="expandedRows[wordSet.id] ? `Collapse ${wordSet.title}` : `Expand ${wordSet.title}`"
              tabindex="0"
              @click="handleToggleRow(wordSet.id)"
              @keydown.enter="handleToggleRow(wordSet.id)"
            >
              {{ expandedRows[wordSet.id] ? '−' : '+' }}
            </button>

            <p class="min-w-0 truncate font-medium text-slate-900">
              {{ wordSet.title }}
            </p>

            <p class="px-1 text-center text-sm font-semibold text-slate-700">
              {{ wordSet.wordCount }}
            </p>

            <div class="flex items-center justify-end gap-1">
              <NuxtLink
                :to="`/word-sets/${wordSet.id}`"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                :aria-label="`View ${wordSet.title}`"
                tabindex="0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>

          <div
            v-if="expandedRows[wordSet.id]"
            class="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <div>
              <p class="font-semibold text-slate-700">
                Author:
              </p>
              <p class="mt-1 text-slate-600">
                {{ wordSet.createdBy?.name || 'Unknown' }}
              </p>
            </div>
            <div>
              <p class="font-semibold text-slate-700">
                Shared:
              </p>
              <p class="mt-1 text-slate-600">
                {{ formatDate(wordSet.createdAt) }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="importingId === wordSet.id"
              :aria-label="`Import ${wordSet.title}`"
              tabindex="0"
              @click="handleImport(wordSet)"
              @keydown.enter="handleImport(wordSet)"
            >
              {{ importingId === wordSet.id ? 'Importing...' : 'Import' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const router = useRouter()
const wordSets = ref([])
const isLoading = ref(true)
const importingId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const expandedRows = reactive({})

const handleToggleRow = (id) => {
  expandedRows[id] = !expandedRows[id]
}

const loadPublicWordSets = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/word-sets/public')
    wordSets.value = response.wordSets
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to load community word sets.'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

const handleImport = async (wordSet) => {
  if (importingId.value) {
    return
  }

  importingId.value = wordSet.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.id}/duplicate`, {
      method: 'POST',
    })

    await router.push(`/word-sets/${response.wordSet.id}`)
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to import word set.'
  } finally {
    importingId.value = ''
  }
}

onMounted(() => {
  loadPublicWordSets()
})
</script>
