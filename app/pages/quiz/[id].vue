<template>
  <section class="flex min-h-[calc(100vh-8rem)] flex-col">
    <div class="mb-4 flex items-center justify-between gap-4">
      <NuxtLink
        :to="wordSet ? `/word-sets/${wordSet.id}` : '/listing'"
        class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
        aria-label="Back to word set"
        tabindex="0"
      >
        ← Back to word set
      </NuxtLink>

      <p
        v-if="questions.length && !isReviewing"
        class="text-sm font-medium text-slate-600"
      >
        {{ currentPosition }} / {{ questions.length }}
      </p>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600"
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
      <div class="mb-4 text-center">
        <h1 class="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {{ wordSet.title }}
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          Vocabulary test
        </p>
      </div>

      <div
        v-if="questions.length === 0"
        class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600"
      >
        <p>Need at least {{ QUIZ_MIN_WORDS }} words with unique meanings to start a test.</p>
        <NuxtLink
          :to="`/word-sets/${wordSet.id}`"
          class="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          tabindex="0"
        >
          Back to word set
        </NuxtLink>
      </div>

      <template v-else-if="isReviewing">
        <div class="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p class="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
            Your score
          </p>
          <p class="mt-2 text-center text-5xl font-semibold text-indigo-600">
            {{ scorePercent }}%
          </p>
          <p class="mt-3 text-center text-slate-600">
            {{ correctCount }} / {{ questions.length }} correct
          </p>

          <p
            v-if="saveMessage"
            class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700"
            role="status"
          >
            {{ saveMessage }}
          </p>
          <p
            v-if="saveError"
            class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700"
            role="alert"
          >
            {{ saveError }}
          </p>

          <ul class="mt-8 space-y-3">
            <li
              v-for="(question, index) in questions"
              :key="`review-${question.wordIndex}-${index}`"
              class="rounded-xl border px-4 py-3"
              :class="isAnswerCorrect(question)
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'"
            >
              <p class="text-sm font-semibold text-slate-900">
                {{ index + 1 }}. {{ question.word }}
              </p>
              <p class="mt-1 text-sm text-slate-700">
                Your answer:
                <span :class="isAnswerCorrect(question) ? 'text-emerald-700' : 'text-red-700'">
                  {{ question.selectedMeaning || '—' }}
                </span>
              </p>
              <p
                v-if="!isAnswerCorrect(question)"
                class="mt-1 text-sm text-emerald-800"
              >
                Correct: {{ question.correctMeaning }}
              </p>
            </li>
          </ul>

          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Retake test"
              tabindex="0"
              @click="handleRetake"
              @keydown.enter="handleRetake"
            >
              Retake test
            </button>
            <NuxtLink
              :to="`/word-sets/${wordSet.id}`"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              tabindex="0"
            >
              Back to word set
            </NuxtLink>
            <NuxtLink
              to="/dashboard"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              tabindex="0"
            >
              Dashboard
            </NuxtLink>
          </div>
        </div>
      </template>

      <template v-else-if="currentQuestion">
        <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p class="text-sm font-medium text-slate-500">
              What is the meaning of
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <h2 class="text-3xl font-semibold text-slate-900 sm:text-4xl">
                {{ currentQuestion.word }}
              </h2>
              <button
                type="button"
                class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canSpeak || isSaving"
                aria-label="Read word aloud"
                tabindex="0"
                @click="handleReadAloud"
                @keydown.enter="handleReadAloud"
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
                    d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A17.7 17.7 0 0 1 2.25 12c0-.993.074-1.97.217-2.926.234-.847 1.058-1.354 1.938-1.354H6.75Z"
                  />
                </svg>
                {{ isSpeaking ? 'Reading...' : 'Read' }}
              </button>
            </div>
            <p
              v-if="!wordSet.speechLanguage"
              class="mt-3 text-sm text-amber-700"
              role="status"
            >
              Set a speech language on the word set to enable text to speech.
            </p>

            <div
              class="mt-8 grid gap-3"
              role="radiogroup"
              :aria-label="`Options for ${currentQuestion.word}`"
            >
              <button
                v-for="(option, optionIndex) in currentQuestion.options"
                :key="`option-${currentQuestion.wordIndex}-${optionIndex}`"
                type="button"
                class="rounded-xl border px-4 py-3 text-left text-base font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                :class="currentQuestion.selectedMeaning === option
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:bg-slate-50'"
                :aria-label="`Option ${optionIndex + 1}: ${option}`"
                :aria-checked="currentQuestion.selectedMeaning === option"
                role="radio"
                tabindex="0"
                @click="handleSelectOption(option)"
                @keydown.enter="handleSelectOption(option)"
              >
                {{ option }}
              </button>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentIndex === 0"
              aria-label="Previous question"
              tabindex="0"
              @click="handlePrevious"
              @keydown.enter="handlePrevious"
            >
              Previous
            </button>

            <button
              v-if="!isLastQuestion"
              type="button"
              class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!currentQuestion.selectedMeaning"
              aria-label="Next question"
              tabindex="0"
              @click="handleNext"
              @keydown.enter="handleNext"
            >
              Next
            </button>

            <button
              v-else
              type="button"
              class="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!allAnswered || isSaving"
              aria-label="Check answers"
              tabindex="0"
              @click="handleCheckAnswers"
              @keydown.enter="handleCheckAnswers"
            >
              {{ isSaving ? 'Saving...' : 'Check answers' }}
            </button>
          </div>

          <p
            v-if="isLastQuestion && !allAnswered"
            class="mt-4 text-center text-sm text-amber-700"
            role="status"
          >
            Answer every question before checking.
          </p>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup>
import {
  QUIZ_MIN_WORDS,
  QUIZ_QUESTION_LIMIT,
  buildQuizQuestions,
} from '~/utils/quiz'

definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const route = useRoute()
const { isSupported, isSpeaking, speak, stopSpeaking } = useSpeechSynthesis()
const wordSet = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const isLoading = ref(true)
const isReviewing = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const saveMessage = ref('')
const saveError = ref('')

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const canSpeak = computed(() => (
  isSupported.value
  && Boolean(wordSet.value?.speechLanguage)
  && Boolean(currentQuestion.value?.word)
))
const currentPosition = computed(() => {
  if (!questions.value.length) {
    return 0
  }

  return Math.min(currentIndex.value + 1, questions.value.length)
})
const isLastQuestion = computed(() => (
  questions.value.length > 0
  && currentIndex.value === questions.value.length - 1
))
const allAnswered = computed(() => (
  questions.value.length > 0
  && questions.value.every((item) => Boolean(item.selectedMeaning))
))
const correctCount = computed(() => (
  questions.value.filter((item) => isAnswerCorrect(item)).length
))
const scorePercent = computed(() => {
  if (!questions.value.length) {
    return 0
  }

  return Math.round((correctCount.value / questions.value.length) * 100)
})

const isAnswerCorrect = (question) => (
  Boolean(question?.selectedMeaning)
  && question.selectedMeaning === question.correctMeaning
)

const handleReadAloud = () => {
  if (!canSpeak.value || isSaving.value || !currentQuestion.value) {
    return
  }

  speak(currentQuestion.value.word, wordSet.value.speechLanguage)
}

const startQuiz = () => {
  if (!wordSet.value?.words?.length) {
    questions.value = []
    return
  }

  stopSpeaking()
  questions.value = buildQuizQuestions(wordSet.value.words, {
    limit: QUIZ_QUESTION_LIMIT,
  })
  currentIndex.value = 0
  isReviewing.value = false
  saveMessage.value = ''
  saveError.value = ''
}

const loadWordSet = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${route.params.id}`)
    wordSet.value = response.wordSet

    if (!wordSet.value.isOwner) {
      errorMessage.value = 'Only the owner can take a test for this word set.'
      return
    }

    startQuiz()
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to load word set.'
  } finally {
    isLoading.value = false
  }
}

const handleSelectOption = (option) => {
  if (!currentQuestion.value || isReviewing.value) {
    return
  }

  questions.value[currentIndex.value] = {
    ...questions.value[currentIndex.value],
    selectedMeaning: option,
  }
}

const handlePrevious = () => {
  if (currentIndex.value <= 0) {
    return
  }

  stopSpeaking()
  currentIndex.value -= 1
}

const handleNext = () => {
  if (!currentQuestion.value?.selectedMeaning || isLastQuestion.value) {
    return
  }

  stopSpeaking()
  currentIndex.value += 1
}

const handleCheckAnswers = async () => {
  if (!allAnswered.value || isSaving.value || !wordSet.value) {
    return
  }

  stopSpeaking()
  isReviewing.value = true
  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    await $fetch('/api/quiz-attempts', {
      method: 'POST',
      body: {
        wordSetId: wordSet.value.id,
        correctCount: correctCount.value,
        totalCount: questions.value.length,
      },
    })

    saveMessage.value = 'Score saved to your dashboard.'
  } catch (error) {
    saveError.value = error?.data?.statusMessage || 'Failed to save score.'
  } finally {
    isSaving.value = false
  }
}

const handleRetake = () => {
  startQuiz()
}

onMounted(() => {
  loadWordSet()
})
</script>
