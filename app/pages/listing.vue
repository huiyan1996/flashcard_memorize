<template>
  <section>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold text-slate-900">
          My word sets
        </h1>
        <p class="mt-2 text-slate-600">
          Import CSV or Excel files and manage your own word sets. Set visibility to public to share with others.
        </p>
      </div>

      <div>
        <button
          type="button"
          class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isImporting"
          aria-label="Import CSV or Excel file"
          tabindex="0"
          @click="handleOpenImportModal"
          @keydown.enter="handleOpenImportModal"
        >
          Import
        </button>
      </div>
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
        No word sets yet. Import a CSV or Excel file to get started.
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
                Words
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Visibility
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Imported
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
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-slate-900">
                    {{ wordSet.title }}
                  </p>
                  <span
                    v-if="wordSet.isCompleted"
                    class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    Completed
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-slate-600">
                {{ wordSet.wordCount }}
              </td>
              <td class="px-4 py-4">
                <select
                  :value="wordSet.visibility"
                  class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="updatingVisibilityId === wordSet.id"
                  :aria-label="`Visibility for ${wordSet.title}`"
                  @change="handleVisibilityChange(wordSet, $event)"
                >
                  <option value="private">
                    Private
                  </option>
                  <option value="public">
                    Public
                  </option>
                </select>
              </td>
              <td class="px-4 py-4 text-sm text-slate-600">
                {{ formatDate(wordSet.createdAt) }}
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    v-if="wordSet.wordCount > 0"
                    :to="`/flashcard/${wordSet.id}`"
                    class="inline-flex h-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    :aria-label="`Study ${wordSet.title} with flashcards`"
                    tabindex="0"
                  >
                    Flashcard
                  </NuxtLink>

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
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    :aria-label="`Delete ${wordSet.title}`"
                    tabindex="0"
                    @click="handleDelete(wordSet)"
                    @keydown.enter="handleDelete(wordSet)"
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
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

            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">
                {{ wordSet.title }}
              </p>
              <span
                v-if="wordSet.isCompleted"
                class="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
              >
                Completed
              </span>
            </div>

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
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                :aria-label="`Delete ${wordSet.title}`"
                tabindex="0"
                @click="handleDelete(wordSet)"
                @keydown.enter="handleDelete(wordSet)"
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
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            v-if="expandedRows[wordSet.id]"
            class="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <div>
              <p class="font-semibold text-slate-700">
                Visibility:
              </p>
              <select
                :value="wordSet.visibility"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="updatingVisibilityId === wordSet.id"
                :aria-label="`Visibility for ${wordSet.title}`"
                @change="handleVisibilityChange(wordSet, $event)"
              >
                <option value="private">
                  Private
                </option>
                <option value="public">
                  Public
                </option>
              </select>
            </div>
            <div>
              <p class="font-semibold text-slate-700">
                Imported:
              </p>
              <p class="mt-1 text-slate-600">
                {{ formatDate(wordSet.createdAt) }}
              </p>
            </div>
            <div v-if="wordSet.wordCount > 0">
              <NuxtLink
                :to="`/flashcard/${wordSet.id}`"
                class="inline-flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                :aria-label="`Study ${wordSet.title} with flashcards`"
                tabindex="0"
              >
                Flashcard
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isImportModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      @click.self="handleCloseImportModal"
      @keydown.escape="handleCloseImportModal"
    >
      <div
        class="absolute inset-0 bg-slate-900/50"
        aria-hidden="true"
      />

      <div
        class="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="importModalTitleId"
      >
        <h2
          :id="importModalTitleId"
          class="text-lg font-semibold text-slate-900"
        >
          Import word set
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Upload a CSV or Excel file. You can optionally set a title for the new word set.
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleImportSubmit"
        >
          <div>
            <label
              for="import-title"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Title (optional)
            </label>
            <input
              id="import-title"
              v-model="importForm.title"
              type="text"
              maxlength="200"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Leave blank to use the file name"
              aria-label="Word set title"
            >
          </div>

          <div>
            <label
              for="import-file"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              File
            </label>
            <input
              id="import-file"
              ref="fileInputRef"
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              aria-label="Import word set file"
              @change="handleImportFileChange"
            >
            <p
              v-if="importForm.fileName"
              class="mt-2 text-sm text-slate-600"
            >
              Selected: {{ importForm.fileName }}
            </p>
          </div>

          <p
            v-if="importModalErrorMessage"
            class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {{ importModalErrorMessage }}
          </p>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isImporting"
              aria-label="Cancel import"
              tabindex="0"
              @click="handleCloseImportModal"
              @keydown.enter="handleCloseImportModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isImporting || !importForm.file"
              aria-label="Upload and import file"
              tabindex="0"
            >
              {{ isImporting ? 'Importing...' : 'Import file' }}
            </button>
          </div>
        </form>

        <div class="mt-8 border-t border-slate-200 pt-6">
          <h3 class="text-sm font-semibold text-slate-900">
            Sample file format
          </h3>
          <p class="mt-1 text-sm text-slate-600">
            Use CSV or Excel (.xlsx / .xls) with these columns. Row 1 can be a header.
          </p>
          <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Column A: Word</li>
            <li>Column B: Meaning / Translation</li>
            <li>Column C: Description (optional)</li>
          </ul>

          <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-semibold text-slate-600"
                  >
                    Word
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-semibold text-slate-600"
                  >
                    Meaning / Translation
                  </th>
                  <th
                    scope="col"
                    class="px-3 py-2 text-left font-semibold text-slate-600"
                  >
                    Description
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr
                  v-for="(row, index) in sampleImportRows"
                  :key="`${row.word}-${index}`"
                >
                  <td class="px-3 py-2 text-slate-900">
                    {{ row.word }}
                  </td>
                  <td class="px-3 py-2 text-slate-700">
                    {{ row.meaning }}
                  </td>
                  <td class="px-3 py-2 text-slate-500">
                    {{ row.description || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sample CSV
            </p>
            <pre class="overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-100">{{ sampleCsvText }}</pre>
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
const isImporting = ref(false)
const isImportModalOpen = ref(false)
const updatingVisibilityId = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const importModalErrorMessage = ref('')
const fileInputRef = ref(null)
const importModalTitleId = 'import-word-set-modal-title'
const expandedRows = reactive({})

const handleToggleRow = (id) => {
  expandedRows[id] = !expandedRows[id]
}

const importForm = reactive({
  title: '',
  file: null,
  fileName: '',
})

const sampleImportRows = [
  {
    word: 'สวัสดี',
    meaning: 'Hello',
    description: 'Common greeting',
  },
  {
    word: 'ขอบคุณ',
    meaning: 'Thank you',
    description: 'Polite expression',
  },
  {
    word: 'ใช่',
    meaning: 'Yes',
    description: '',
  },
]

const sampleCsvText = [
  'Word,Meaning / Translation,Description',
  'สวัสดี,Hello,Common greeting',
  'ขอบคุณ,Thank you,Polite expression',
  'ใช่,Yes,',
].join('\n')

const resetImportForm = () => {
  importForm.title = ''
  importForm.file = null
  importForm.fileName = ''
  importModalErrorMessage.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleOpenImportModal = () => {
  if (isImporting.value) {
    return
  }

  resetImportForm()
  isImportModalOpen.value = true
}

const handleCloseImportModal = () => {
  if (isImporting.value) {
    return
  }

  isImportModalOpen.value = false
  resetImportForm()
}

const handleImportFileChange = (event) => {
  const file = event.target.files?.[0] || null
  importForm.file = file
  importForm.fileName = file?.name || ''
  importModalErrorMessage.value = ''
}

const loadWordSets = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/word-sets')
    wordSets.value = response.wordSets
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to load word sets.'
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

const handleImportSubmit = async () => {
  if (isImporting.value || !importForm.file) {
    importModalErrorMessage.value = 'Please choose a CSV or Excel file.'
    return
  }

  isImporting.value = true
  importModalErrorMessage.value = ''
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('file', importForm.file)

    const nextTitle = importForm.title.trim()

    if (nextTitle) {
      formData.append('title', nextTitle)
    }

    const response = await $fetch('/api/word-sets/import', {
      method: 'POST',
      body: formData,
    })

    isImportModalOpen.value = false
    resetImportForm()
    await router.push(`/word-sets/${response.wordSet.id}`)
  } catch (error) {
    importModalErrorMessage.value = error?.data?.statusMessage || 'Failed to import file.'
  } finally {
    isImporting.value = false
  }
}

const handleDelete = async (wordSet) => {
  if (!confirm(`Delete "${wordSet.title}"? This cannot be undone.`)) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    await $fetch(`/api/word-sets/${wordSet.id}`, {
      method: 'DELETE',
    })

    wordSets.value = wordSets.value.filter((item) => item.id !== wordSet.id)
    successMessage.value = `Deleted "${wordSet.title}".`
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to delete word set.'
  }
}

const handleVisibilityChange = async (wordSet, event) => {
  const nextVisibility = event.target.value

  if (nextVisibility === wordSet.visibility || updatingVisibilityId.value) {
    return
  }

  updatingVisibilityId.value = wordSet.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.id}`, {
      method: 'PATCH',
      body: {
        visibility: nextVisibility,
      },
    })

    wordSets.value = wordSets.value.map((item) => {
      if (item.id !== wordSet.id) {
        return item
      }

      return {
        ...item,
        visibility: response.wordSet.visibility,
      }
    })

    successMessage.value = `"${wordSet.title}" is now ${nextVisibility}.`
  } catch (error) {
    event.target.value = wordSet.visibility
    errorMessage.value = error?.data?.statusMessage || 'Failed to update visibility.'
  } finally {
    updatingVisibilityId.value = ''
  }
}

onMounted(() => {
  loadWordSets()
})
</script>
