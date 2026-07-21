<template>
  <section>
    <div class="mb-6">
      <NuxtLink
        :to="wordSet?.isOwner ? '/listing' : '/community'"
        class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
        :aria-label="wordSet?.isOwner ? 'Back to my word sets' : 'Back to community'"
        tabindex="0"
      >
        ← {{ wordSet?.isOwner ? 'Back to my word sets' : 'Back to community' }}
      </NuxtLink>
    </div>

    <div
      v-if="isLoading"
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600"
    >
      Loading...
    </div>

    <p
      v-else-if="errorMessage"
      class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <template v-else-if="wordSet">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-3xl font-semibold text-slate-900">
              {{ wordSet.title }}
            </h1>
            <span
              v-if="wordSet.isCompleted"
              class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
            >
              Completed
            </span>
          </div>
          <p class="mt-2 text-slate-600">
            {{ wordSet.wordCount }} words
            <span v-if="!wordSet.isOwner && wordSet.createdBy?.name">
              · by {{ wordSet.createdBy.name }}
            </span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="!wordSet.isOwner"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isImporting"
            aria-label="Import to my word sets"
            tabindex="0"
            @click="handleImportToMyList"
            @keydown.enter="handleImportToMyList"
          >
            {{ isImporting ? 'Importing...' : 'Import to my list' }}
          </button>

          <NuxtLink
            v-if="wordSet.isOwner && wordSet.wordCount > 0"
            :to="`/flashcard/${wordSet.id}`"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Study with flashcards"
            tabindex="0"
          >
            Flashcard
          </NuxtLink>

          <NuxtLink
            v-if="wordSet.isOwner && wordSet.wordCount >= 4"
            :to="`/quiz/${wordSet.id}`"
            class="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Take vocabulary test"
            tabindex="0"
          >
            Test
          </NuxtLink>

          <button
            v-if="wordSet.wordCount > 0"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isExporting"
            aria-label="Export word set as CSV"
            tabindex="0"
            @click="handleExportCsv"
            @keydown.enter="handleExportCsv"
          >
            {{ isExporting ? 'Exporting...' : 'Export CSV' }}
          </button>

          <button
            v-if="wordSet.isOwner"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSaving || isModalOpen || isTitleModalOpen"
            aria-label="Add new vocabulary"
            tabindex="0"
            @click="handleOpenAdd"
            @keydown.enter="handleOpenAdd"
          >
            + New Vocabulary
          </button>

          <button
            v-if="wordSet.isOwner"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSaving || isTitleModalOpen || isModalOpen"
            aria-label="Rename word set"
            tabindex="0"
            @click="handleOpenRename"
            @keydown.enter="handleOpenRename"
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
              d="M16.862 4.487 19.5 7.125m-2.638-2.638a2.25 2.25 0 0 0-3.182 0L7 10.076a2.25 2.25 0 0 0-.596.925l-1.02 3.406a.75.75 0 0 0 .933.933l3.406-1.02c.343-.103.654-.284.925-.555l6.8-6.8a2.25 2.25 0 0 0 0-3.182Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 8.25 15.75 15.75"
            />
          </svg>
          Rename
          </button>
        </div>
      </div>

      <div
        v-if="wordSet.isOwner"
        class="mb-6 flex flex-wrap items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <label
            for="visibility"
            class="text-sm font-medium text-slate-700"
          >
            Visibility
          </label>
          <select
            id="visibility"
            :value="wordSet.visibility"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isUpdatingVisibility"
            aria-label="Word set visibility"
            @change="handleVisibilityChange"
          >
            <option value="private">
              Private
            </option>
            <option value="public">
              Public
            </option>
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label
            for="flashcard-order"
            class="text-sm font-medium text-slate-700"
          >
            Flashcard order
          </label>
          <select
            id="flashcard-order"
            :value="wordSet.flashcardOrder || 'sequence'"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isUpdatingFlashcardOrder"
            aria-label="Flashcard order"
            @change="handleFlashcardOrderChange"
          >
            <option value="sequence">
              Follow sequence
            </option>
            <option value="random">
              Random
            </option>
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label
            for="speech-language"
            class="text-sm font-medium text-slate-700"
          >
            Speech language
          </label>
          <select
            id="speech-language"
            :value="wordSet.speechLanguage || ''"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isUpdatingSpeechLanguage"
            aria-label="Speech language for text to speech"
            @change="handleSpeechLanguageChange"
          >
            <option value="">
              Not set
            </option>
            <option
              v-for="language in speechLanguages"
              :key="language.code"
              :value="language.code"
            >
              {{ language.label }}
            </option>
          </select>
        </div>

        <label
          for="show-word-on-front"
          class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700"
        >
          <input
            id="show-word-on-front"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            :checked="Boolean(wordSet.showWordOnFront)"
            :disabled="isUpdatingShowWordOnFront"
            aria-label="Show word on flashcard front"
            @change="handleShowWordOnFrontChange"
          >
          Show word on front
        </label>
      </div>

      <p
        v-if="wordSet.isOwner && !wordSet.speechLanguage"
        class="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
        role="status"
      >
        Set a speech language so flashcards can read words aloud.
      </p>

      <p
        v-if="successMessage"
        class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        role="status"
      >
        {{ successMessage }}
      </p>

      <div
        v-if="wordSet.words.length === 0"
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600"
      >
        <p>This word set has no words.</p>
        <button
          v-if="wordSet.isOwner"
          type="button"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSaving || isModalOpen || isTitleModalOpen"
          aria-label="Add new vocabulary"
          tabindex="0"
          @click="handleOpenAdd"
          @keydown.enter="handleOpenAdd"
        >
          + New Vocabulary
        </button>
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
                  class="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  #
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Word
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Meaning / Translation
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Description
                </th>
                <th
                  v-if="wordSet.isOwner"
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Flashcard
                </th>
                <th
                  v-if="wordSet.isOwner"
                  scope="col"
                  class="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Edit / Delete
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="(item, index) in wordSet.words"
                :key="`${item.word}-${index}`"
                class="hover:bg-slate-50"
              >
                <td class="px-4 py-3 text-sm text-slate-400">
                  {{ index + 1 }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-slate-900">
                  {{ item.word }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">
                  {{ item.meaning }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-500">
                  {{ item.description || '—' }}
                </td>
                <td
                  v-if="wordSet.isOwner"
                  class="px-4 py-3"
                >
                  <select
                    :value="item.flashcardStatus || 'none'"
                    class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="updatingFlashcardIndex === index"
                    :aria-label="`Flashcard status for ${item.word}`"
                    @change="handleFlashcardStatusChange(index, $event)"
                  >
                    <option value="none">
                      None
                    </option>
                    <option value="forgot">
                      Forgot
                    </option>
                    <option value="hard">
                      Hard
                    </option>
                    <option value="yes">
                      Yes
                    </option>
                  </select>
                </td>
                <td
                  v-if="wordSet.isOwner"
                  class="px-4 py-3 text-right whitespace-nowrap"
                >
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    :aria-label="`Edit ${item.word}`"
                    tabindex="0"
                    @click="handleOpenEdit(index)"
                    @keydown.enter="handleOpenEdit(index)"
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
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="inline-flex ml-2 h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    :aria-label="`Delete ${item.word}`"
                    tabindex="0"
                    :disabled="isSaving || isModalOpen"
                    @click="handleDeleteWord(index)"
                    @keydown.enter="handleDeleteWord(index)"
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="md:hidden">
          <div class="grid grid-cols-[auto_1fr_1fr_auto] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span class="w-8" />
            <span>Word</span>
            <span>Meaning</span>
            <span
              v-if="wordSet.isOwner"
              class="w-16 text-right"
            >
              Edit
            </span>
            <span
              v-else
              class="w-4"
            />
          </div>

          <div
            v-for="(item, index) in wordSet.words"
            :key="`${item.word}-${index}`"
            class="border-b border-slate-200 last:border-b-0"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
          >
            <div class="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 px-3 py-3">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :class="expandedRows[index]
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-700'"
                :aria-expanded="Boolean(expandedRows[index])"
                :aria-label="expandedRows[index] ? `Collapse ${item.word}` : `Expand ${item.word}`"
                tabindex="0"
                @click="handleToggleRow(index)"
                @keydown.enter="handleToggleRow(index)"
              >
                {{ expandedRows[index] ? '−' : '+' }}
              </button>

              <p class="min-w-0 truncate text-sm font-medium text-slate-900">
                {{ item.word }}
              </p>
              <p class="min-w-0 truncate text-sm text-slate-700">
                {{ item.meaning }}
              </p>

              <div
                v-if="wordSet.isOwner"
                class="flex items-center justify-end gap-1"
              >
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
                  :aria-label="`Edit ${item.word}`"
                  tabindex="0"
                  @click="handleOpenEdit(index)"
                  @keydown.enter="handleOpenEdit(index)"
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
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                  :aria-label="`Delete ${item.word}`"
                  tabindex="0"
                  :disabled="isSaving || isModalOpen"
                  @click="handleDeleteWord(index)"
                  @keydown.enter="handleDeleteWord(index)"
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
              <span
                v-else
                class="w-4"
              />
            </div>

            <div
              v-if="expandedRows[index]"
              class="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <div>
                <p class="font-semibold text-slate-700">
                  #:
                </p>
                <p class="mt-1 text-slate-600">
                  {{ index + 1 }}
                </p>
              </div>
              <div>
                <p class="font-semibold text-slate-700">
                  Description:
                </p>
                <p class="mt-1 text-slate-600">
                  {{ item.description || '—' }}
                </p>
              </div>
              <div v-if="wordSet.isOwner">
                <p class="font-semibold text-slate-700">
                  Flashcard:
                </p>
                <select
                  :value="item.flashcardStatus || 'none'"
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="updatingFlashcardIndex === index"
                  :aria-label="`Flashcard status for ${item.word}`"
                  @change="handleFlashcardStatusChange(index, $event)"
                >
                  <option value="none">
                    None
                  </option>
                  <option value="forgot">
                    Forgot
                  </option>
                  <option value="hard">
                    Hard
                  </option>
                  <option value="yes">
                    Yes
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      @click.self="handleCloseModal"
      @keydown.escape="handleCloseModal"
    >
      <div
        class="absolute inset-0 bg-slate-900/50"
        aria-hidden="true"
      />

      <div
        class="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="modalTitleId"
      >
        <h2
          :id="modalTitleId"
          class="text-lg font-semibold text-slate-900"
        >
          {{ isAddMode ? 'New vocabulary' : 'Edit word' }}
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          {{ isAddMode ? 'Add a new word entry to this set.' : 'Update this word entry in the set.' }}
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleSaveWord"
        >
          <div>
            <label
              for="edit-word"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Word
            </label>
            <input
              id="edit-word"
              v-model="editForm.word"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              aria-label="Word"
            >
          </div>

          <div>
            <label
              for="edit-meaning"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Meaning / Translation
            </label>
            <input
              id="edit-meaning"
              v-model="editForm.meaning"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              aria-label="Meaning"
            >
          </div>

          <div>
            <label
              for="edit-description"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <input
              id="edit-description"
              v-model="editForm.description"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              aria-label="Description"
            >
          </div>

          <p
            v-if="modalErrorMessage"
            class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {{ modalErrorMessage }}
          </p>

          <div class="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              :aria-label="isAddMode ? 'Cancel add vocabulary' : 'Cancel edit'"
              tabindex="0"
              @click="handleCloseModal"
              @keydown.enter="handleCloseModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving"
              :aria-label="isAddMode ? 'Add vocabulary' : 'Save changes'"
            >
              {{ isSaving ? 'Saving...' : (isAddMode ? 'Add' : 'Save') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="isTitleModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      @click.self="handleCloseRenameModal"
      @keydown.escape="handleCloseRenameModal"
    >
      <div
        class="absolute inset-0 bg-slate-900/50"
        aria-hidden="true"
      />

      <div
        class="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="renameModalTitleId"
      >
        <h2
          :id="renameModalTitleId"
          class="text-lg font-semibold text-slate-900"
        >
          Rename word set
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          Update the title for this word set.
        </p>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleSaveRename"
        >
          <div>
            <label
              for="rename-title"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Title
            </label>
            <input
              id="rename-title"
              v-model="renameForm.title"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Word set title"
              aria-label="Rename word set title"
            >
          </div>

          <p
            v-if="renameModalErrorMessage"
            class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {{ renameModalErrorMessage }}
          </p>

          <div class="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Cancel rename"
              tabindex="0"
              @click="handleCloseRenameModal"
              @keydown.enter="handleCloseRenameModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving || isTitleSaving"
              aria-label="Save renamed title"
            >
              {{ isTitleSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { SPEECH_LANGUAGES } from '~/utils/speech-languages'
import {
  buildWordsCsv,
  downloadCsvFile,
  sanitizeFileName,
} from '~/utils/export-csv'

definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const wordSet = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const isUpdatingVisibility = ref(false)
const isUpdatingFlashcardOrder = ref(false)
const isUpdatingSpeechLanguage = ref(false)
const isUpdatingShowWordOnFront = ref(false)
const updatingFlashcardIndex = ref(-1)
const isModalOpen = ref(false)
const isAddMode = ref(false)
const editingIndex = ref(-1)
const errorMessage = ref('')
const modalErrorMessage = ref('')
const successMessage = ref('')
const modalTitleId = 'word-modal-title'
const speechLanguages = SPEECH_LANGUAGES
const expandedRows = reactive({})

const handleToggleRow = (index) => {
  expandedRows[index] = !expandedRows[index]
}

const isTitleModalOpen = ref(false)
const isTitleSaving = ref(false)
const renameModalErrorMessage = ref('')
const renameModalTitleId = 'rename-word-set-modal-title'

const renameForm = reactive({
  title: '',
})

const editForm = reactive({
  word: '',
  meaning: '',
  description: '',
})

const loadWordSet = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${route.params.id}`)
    wordSet.value = response.wordSet
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to load word set.'
  } finally {
    isLoading.value = false
  }
}

const handleExportCsv = () => {
  if (!wordSet.value?.words?.length || isExporting.value) {
    return
  }

  isExporting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const csvContent = buildWordsCsv(wordSet.value.words)
    const fileName = `${sanitizeFileName(wordSet.value.title)}.csv`
    downloadCsvFile(fileName, csvContent)
    successMessage.value = `Exported "${wordSet.value.title}" as CSV.`
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to export CSV.'
  } finally {
    isExporting.value = false
  }
}

const resetWordForm = () => {
  editForm.word = ''
  editForm.meaning = ''
  editForm.description = ''
  modalErrorMessage.value = ''
}

const handleOpenAdd = () => {
  if (!wordSet.value?.isOwner || isSaving.value || isModalOpen.value || isTitleModalOpen.value) {
    return
  }

  isAddMode.value = true
  editingIndex.value = -1
  resetWordForm()
  successMessage.value = ''
  isModalOpen.value = true
}

const handleOpenEdit = (index) => {
  if (!wordSet.value?.isOwner || isSaving.value || isModalOpen.value || isTitleModalOpen.value) {
    return
  }

  const item = wordSet.value?.words?.[index]

  if (!item) {
    return
  }

  isAddMode.value = false
  editingIndex.value = index
  editForm.word = item.word
  editForm.meaning = item.meaning
  editForm.description = item.description || ''
  modalErrorMessage.value = ''
  successMessage.value = ''
  isModalOpen.value = true
}

const handleCloseModal = () => {
  if (isSaving.value) {
    return
  }

  isModalOpen.value = false
  isAddMode.value = false
  editingIndex.value = -1
  modalErrorMessage.value = ''
}

const serializeWords = (words) => words.map((item) => ({
  word: item.word,
  meaning: item.meaning,
  description: item.description || '',
  flashcardStatus: item.flashcardStatus || 'none',
}))

const handleSaveWord = async () => {
  if (isSaving.value || !wordSet.value) {
    return
  }

  if (!isAddMode.value && editingIndex.value < 0) {
    return
  }

  const nextWord = {
    word: editForm.word.trim(),
    meaning: editForm.meaning.trim(),
    description: editForm.description.trim(),
    flashcardStatus: isAddMode.value
      ? 'none'
      : (wordSet.value.words[editingIndex.value]?.flashcardStatus || 'none'),
  }

  if (!nextWord.word || !nextWord.meaning) {
    modalErrorMessage.value = 'Word and meaning are required.'
    return
  }

  isSaving.value = true
  modalErrorMessage.value = ''

  const updatedWords = isAddMode.value
    ? [...serializeWords(wordSet.value.words), nextWord]
    : wordSet.value.words.map((item, index) => (
      index === editingIndex.value
        ? nextWord
        : {
            word: item.word,
            meaning: item.meaning,
            description: item.description || '',
            flashcardStatus: item.flashcardStatus || 'none',
          }
    ))

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        words: updatedWords,
      },
    })

    wordSet.value = response.wordSet
    successMessage.value = isAddMode.value
      ? 'Vocabulary added successfully.'
      : 'Word updated successfully.'
    handleCloseModal()
  } catch (error) {
    modalErrorMessage.value = error?.data?.statusMessage || (
      isAddMode.value ? 'Failed to add vocabulary.' : 'Failed to save word.'
    )
  } finally {
    isSaving.value = false
  }
}

const handleDeleteWord = async (index) => {
  if (!wordSet.value?.isOwner || isSaving.value || isModalOpen.value || !wordSet.value) {
    return
  }

  const item = wordSet.value.words?.[index]

  if (!item) {
    return
  }

  const ok = confirm(`Delete "${item.word}" from this word set? This cannot be undone.`)
  if (!ok) {
    return
  }

  isSaving.value = true
  modalErrorMessage.value = ''
  successMessage.value = ''

  try {
    const updatedWords = wordSet.value.words
      .filter((_, currentIndex) => currentIndex !== index)
      .map((existing) => ({
        word: existing.word,
        meaning: existing.meaning,
        description: existing.description || '',
        flashcardStatus: existing.flashcardStatus || 'none',
      }))

    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        words: updatedWords,
      },
    })

    wordSet.value = response.wordSet
    successMessage.value = `Deleted "${item.word}".`
  } catch (error) {
    modalErrorMessage.value = error?.data?.statusMessage || 'Failed to delete word.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadWordSet()
})

const handleOpenRename = () => {
  if (!wordSet.value?.isOwner || isSaving.value || isModalOpen.value || isTitleModalOpen.value || !wordSet.value) {
    return
  }

  renameForm.title = wordSet.value.title
  renameModalErrorMessage.value = ''
  isTitleSaving.value = false
  isTitleModalOpen.value = true
}

const handleCloseRenameModal = () => {
  if (isSaving.value) {
    return
  }

  isTitleModalOpen.value = false
  renameModalErrorMessage.value = ''
}

const handleSaveRename = async () => {
  if (isSaving.value || isTitleSaving.value || !wordSet.value) {
    return
  }

  const nextTitle = String(renameForm.title || '').trim()
  if (!nextTitle) {
    renameModalErrorMessage.value = 'Title is required.'
    return
  }

  isTitleSaving.value = true
  renameModalErrorMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        title: nextTitle,
      },
    })

    wordSet.value = response.wordSet
    successMessage.value = 'Word set renamed successfully.'
    handleCloseRenameModal()
  } catch (error) {
    renameModalErrorMessage.value = error?.data?.statusMessage || 'Failed to rename word set.'
  } finally {
    isTitleSaving.value = false
  }
}

const handleVisibilityChange = async (event) => {
  if (!wordSet.value?.isOwner || isUpdatingVisibility.value) {
    return
  }

  const nextVisibility = event.target.value

  if (nextVisibility === wordSet.value.visibility) {
    return
  }

  isUpdatingVisibility.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        visibility: nextVisibility,
      },
    })

    wordSet.value = {
      ...wordSet.value,
      visibility: response.wordSet.visibility,
    }
    successMessage.value = `Word set is now ${nextVisibility}.`
  } catch (error) {
    event.target.value = wordSet.value.visibility
    errorMessage.value = error?.data?.statusMessage || 'Failed to update visibility.'
  } finally {
    isUpdatingVisibility.value = false
  }
}

const handleFlashcardOrderChange = async (event) => {
  if (!wordSet.value?.isOwner || isUpdatingFlashcardOrder.value) {
    return
  }

  const nextOrder = event.target.value

  if (nextOrder === (wordSet.value.flashcardOrder || 'sequence')) {
    return
  }

  isUpdatingFlashcardOrder.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        flashcardOrder: nextOrder,
      },
    })

    wordSet.value = {
      ...wordSet.value,
      flashcardOrder: response.wordSet.flashcardOrder,
    }
    successMessage.value = nextOrder === 'random'
      ? 'Flashcards will appear in random order.'
      : 'Flashcards will follow the word list sequence.'
  } catch (error) {
    event.target.value = wordSet.value.flashcardOrder || 'sequence'
    errorMessage.value = error?.data?.statusMessage || 'Failed to update flashcard order.'
  } finally {
    isUpdatingFlashcardOrder.value = false
  }
}

const handleSpeechLanguageChange = async (event) => {
  if (!wordSet.value?.isOwner || isUpdatingSpeechLanguage.value) {
    return
  }

  const nextLanguage = event.target.value

  if (nextLanguage === (wordSet.value.speechLanguage || '')) {
    return
  }

  isUpdatingSpeechLanguage.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        speechLanguage: nextLanguage,
      },
    })

    wordSet.value = {
      ...wordSet.value,
      speechLanguage: response.wordSet.speechLanguage || '',
    }
    successMessage.value = nextLanguage
      ? 'Speech language updated for text-to-speech.'
      : 'Speech language cleared.'
  } catch (error) {
    event.target.value = wordSet.value.speechLanguage || ''
    errorMessage.value = error?.data?.statusMessage || 'Failed to update speech language.'
  } finally {
    isUpdatingSpeechLanguage.value = false
  }
}

const handleShowWordOnFrontChange = async (event) => {
  if (!wordSet.value?.isOwner || isUpdatingShowWordOnFront.value) {
    return
  }

  const nextValue = Boolean(event.target.checked)

  if (nextValue === Boolean(wordSet.value.showWordOnFront)) {
    return
  }

  isUpdatingShowWordOnFront.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}`, {
      method: 'PATCH',
      body: {
        showWordOnFront: nextValue,
      },
    })

    wordSet.value = {
      ...wordSet.value,
      showWordOnFront: Boolean(response.wordSet.showWordOnFront),
    }
    successMessage.value = nextValue
      ? 'Flashcard front will show the word.'
      : 'Flashcard front will show the meaning.'
  } catch (error) {
    event.target.checked = Boolean(wordSet.value.showWordOnFront)
    errorMessage.value = error?.data?.statusMessage || 'Failed to update flashcard front setting.'
  } finally {
    isUpdatingShowWordOnFront.value = false
  }
}

const handleImportToMyList = async () => {
  if (wordSet.value?.isOwner || isImporting.value || !wordSet.value) {
    return
  }

  isImporting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}/duplicate`, {
      method: 'POST',
    })

    await router.push(`/word-sets/${response.wordSet.id}`)
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to import word set.'
  } finally {
    isImporting.value = false
  }
}

const handleFlashcardStatusChange = async (index, event) => {
  if (!wordSet.value?.isOwner || updatingFlashcardIndex.value >= 0) {
    return
  }

  const nextStatus = event.target.value
  const currentStatus = wordSet.value.words[index]?.flashcardStatus || 'none'

  if (nextStatus === currentStatus) {
    return
  }

  updatingFlashcardIndex.value = index
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}/flashcard`, {
      method: 'POST',
      body: {
        wordIndex: index,
        status: nextStatus,
      },
    })

    wordSet.value = response.wordSet
    successMessage.value = 'Flashcard status updated.'
  } catch (error) {
    event.target.value = currentStatus
    errorMessage.value = error?.data?.statusMessage || 'Failed to update flashcard status.'
  } finally {
    updatingFlashcardIndex.value = -1
  }
}
</script>
