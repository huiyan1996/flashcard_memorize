<template>
  <section
    class="flex min-h-[calc(100vh-8rem)] flex-col"
    @pointerdown.capture="handleUnlockSpeech"
  >
    <div class="mb-4 flex items-center justify-between gap-4">
      <NuxtLink
        to="/listing"
        class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
        aria-label="Back to my word sets"
        tabindex="0"
      >
        ← Back
      </NuxtLink>

      <p
        v-if="wordSet && queue.length"
        class="text-sm font-medium text-slate-600"
      >
        {{ currentPosition }} / {{ queue.length }}
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
          Flashcard study
        </p>
      </div>

      <p
        v-if="sessionMessage"
        class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700"
        role="status"
      >
        {{ sessionMessage }}
      </p>

      <div
        v-if="queue.length === 0"
        class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600"
      >
        <p>No words available for flashcards in this set.</p>
        <NuxtLink
          :to="`/word-sets/${wordSet.id}`"
          class="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          tabindex="0"
        >
          Back to word set
        </NuxtLink>
      </div>

      <template v-else-if="currentCard">
        <div class="flex flex-1 flex-col">
          <div class="flex flex-1 items-center justify-center px-2 py-6 sm:px-4">
            <button
              :key="`card-${currentCard.index}`"
              type="button"
              class="flashcard w-full max-w-3xl"
              :class="{ 'pointer-events-none': isFlipped }"
              :aria-label="isFlipped ? 'Card answer shown' : 'Flip card to see word'"
              :tabindex="isFlipped ? -1 : 0"
              :disabled="isFlipped"
              @click="handleFlipCard"
              @keydown.enter="handleFlipCard"
            >
              <div
                class="flashcard-inner"
                :class="{ 'is-flipped': isFlipped, 'flashcard-enter': cardEntering }"
              >
                <div class="front border border-slate-200 bg-white shadow-lg">
                  <h2 class="px-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
                    {{ currentCard.meaning }}
                  </h2>
                </div>

                <div class="back border border-indigo-200 bg-indigo-50 shadow-lg">
                  <div class="px-6">
                    <p class="text-3xl font-semibold text-slate-900 sm:text-4xl">
                      {{ currentCard.word }}
                    </p>
                    <p class="mt-4 text-2xl text-indigo-700 sm:text-3xl">
                      {{ currentCard.meaning }}
                    </p>
                    <p
                      v-if="currentCard.description"
                      class="mt-4 text-sm text-slate-500 sm:text-base"
                    >
                      {{ currentCard.description }}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <p
            v-if="!isFlipped"
            class="mb-6 text-center text-sm text-slate-500"
          >
            Click the card to reveal the answer
          </p>

          <template v-else>
            <div class="mb-6 flex justify-center">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
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
              class="mb-4 text-center text-sm text-amber-700"
              role="status"
            >
              Set a speech language on this word set to enable reading aloud.
            </p>

            <div class="mt-auto grid gap-3 pb-2 sm:grid-cols-3">
              <button
                type="button"
                class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSaving"
                aria-label="Mark as forgot"
                tabindex="0"
                @click="handleAnswer('forgot')"
                @keydown.enter="handleAnswer('forgot')"
              >
                Forgot
              </button>
              <button
                type="button"
                class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSaving"
                aria-label="Mark as hard"
                tabindex="0"
                @click="handleAnswer('hard')"
                @keydown.enter="handleAnswer('hard')"
              >
                Hard
              </button>
              <button
                type="button"
                class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSaving"
                aria-label="Mark as yes"
                tabindex="0"
                @click="handleAnswer('yes')"
                @keydown.enter="handleAnswer('yes')"
              >
                Yes
              </button>
            </div>
          </template>
        </div>
      </template>

      <div
        v-else
        class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center"
      >
        <p class="text-lg font-semibold text-emerald-800">
          Session complete!
        </p>
        <p class="mt-2 text-emerald-700">
          {{ wordSet.isCompleted ? 'This set is completed. You can review all words again.' : 'Great work. Keep going!' }}
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            aria-label="Study again"
            tabindex="0"
            @click="handleRestart"
            @keydown.enter="handleRestart"
          >
            Study again
          </button>
          <NuxtLink
            to="/listing"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            tabindex="0"
          >
            Back to listing
          </NuxtLink>
        </div>
      </div>
    </template>

    <div
      v-if="isCompletionModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        class="absolute inset-0 bg-slate-900/50"
        aria-hidden="true"
      />

      <div
        class="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="completionModalTitleId"
      >
        <h2
          :id="completionModalTitleId"
          class="text-lg font-semibold text-slate-900"
        >
          Set completed!
        </h2>
        <p class="mt-2 text-sm text-slate-600">
          You marked every word as Yes. Would you like to keep studying this set, or go back to My word sets?
        </p>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Back to my word sets"
            tabindex="0"
            @click="handleBackToListing"
            @keydown.enter="handleBackToListing"
          >
            Back to My sets
          </button>
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Continue studying flashcards"
            tabindex="0"
            @click="handleContinueStudying"
            @keydown.enter="handleContinueStudying"
          >
            Continue studying
          </button>
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

const route = useRoute()
const router = useRouter()
const { isSupported, isSpeaking, speak, stopSpeaking, unlockSpeech } = useSpeechSynthesis()
const wordSet = ref(null)
const queue = ref([])
const currentQueueIndex = ref(0)
const isFlipped = ref(false)
const cardEntering = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const sessionMessage = ref('')
const wasCompletedOnEntry = ref(false)
const isCompletionModalOpen = ref(false)
const hasShownCompletionModal = ref(false)
const completionModalTitleId = 'flashcard-completion-modal-title'

const handleUnlockSpeech = () => {
  unlockSpeech()
}

const currentCard = computed(() => queue.value[currentQueueIndex.value] || null)
const canSpeak = computed(() => (
  isSupported.value
  && Boolean(wordSet.value?.speechLanguage)
  && Boolean(currentCard.value?.word)
))
const currentPosition = computed(() => {
  if (!queue.value.length) {
    return 0
  }

  return Math.min(currentQueueIndex.value + 1, queue.value.length)
})

const speakCurrentWord = () => {
  if (!canSpeak.value || !currentCard.value) {
    return
  }

  speak(currentCard.value.word, wordSet.value.speechLanguage)
}

const shuffleItems = (items) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

const buildQueue = ({ reshuffle = false } = {}) => {
  if (!wordSet.value?.words?.length) {
    queue.value = []
    return
  }

  const items = wordSet.value.words.map((item, index) => ({
    ...item,
    index,
  }))

  const nextQueue = wordSet.value.isCompleted
    ? items
    : items.filter((item) => item.flashcardStatus !== 'yes')

  if (wordSet.value.flashcardOrder === 'random' && (reshuffle || queue.value.length === 0)) {
    queue.value = shuffleItems(nextQueue)
    return
  }

  queue.value = nextQueue
}

const playCardEnterAnimation = () => {
  cardEntering.value = true

  setTimeout(() => {
    cardEntering.value = false
  }, 500)
}

const loadWordSet = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${route.params.id}`)
    wordSet.value = response.wordSet
    wasCompletedOnEntry.value = Boolean(wordSet.value.isCompleted)
    hasShownCompletionModal.value = false
    isCompletionModalOpen.value = false

    if (!wordSet.value.isOwner) {
      errorMessage.value = 'Only the owner can study this word set with flashcards.'
      return
    }

    buildQueue({ reshuffle: true })
    currentQueueIndex.value = 0
    isFlipped.value = false
    playCardEnterAnimation()
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to load word set.'
  } finally {
    isLoading.value = false
  }
}

const handleContinueStudying = () => {
  stopSpeaking()
  isCompletionModalOpen.value = false
  sessionMessage.value = 'All words marked Yes. Set completed!'
  buildQueue({ reshuffle: true })
  currentQueueIndex.value = 0
  isFlipped.value = false
  playCardEnterAnimation()
}

const handleBackToListing = () => {
  stopSpeaking()
  isCompletionModalOpen.value = false
  router.push('/listing')
}

const handleFlipCard = () => {
  if (!currentCard.value || isSaving.value || isFlipped.value) {
    return
  }

  unlockSpeech()
  isFlipped.value = true
  speakCurrentWord()
}

const handleReadAloud = () => {
  if (!canSpeak.value || isSaving.value) {
    return
  }

  unlockSpeech()
  speakCurrentWord()
}

const handleAnswer = async (status) => {
  if (!currentCard.value || !wordSet.value || isSaving.value || !isFlipped.value) {
    return
  }

  stopSpeaking()
  isSaving.value = true
  sessionMessage.value = ''

  try {
    const response = await $fetch(`/api/word-sets/${wordSet.value.id}/flashcard`, {
      method: 'POST',
      body: {
        wordIndex: currentCard.value.index,
        status,
      },
    })

    wordSet.value = response.wordSet
    isFlipped.value = false

    if (
      wordSet.value.isCompleted
      && !wasCompletedOnEntry.value
      && !hasShownCompletionModal.value
    ) {
      hasShownCompletionModal.value = true
      isCompletionModalOpen.value = true
      return
    }

    if (status === 'yes') {
      buildQueue({ reshuffle: wordSet.value.flashcardOrder === 'random' })
    }

    if (queue.value.length === 0) {
      currentQueueIndex.value = 0
      sessionMessage.value = 'Session complete for now.'
      return
    }

    if (status === 'yes') {
      if (currentQueueIndex.value >= queue.value.length) {
        currentQueueIndex.value = 0
      }
    } else {
      currentQueueIndex.value = (currentQueueIndex.value + 1) % queue.value.length
    }

    playCardEnterAnimation()
  } catch (error) {
    errorMessage.value = error?.data?.statusMessage || 'Failed to save flashcard progress.'
  } finally {
    isSaving.value = false
  }
}

const handleRestart = () => {
  stopSpeaking()
  buildQueue({ reshuffle: true })
  currentQueueIndex.value = 0
  isFlipped.value = false
  sessionMessage.value = ''
  playCardEnterAnimation()
}

onMounted(() => {
  loadWordSet()
})
</script>

<style scoped>
.flashcard {
  cursor: pointer;
  perspective: 1200px;
}

.flashcard:disabled {
  cursor: default;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  min-height: 320px;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.flashcard-inner.is-flipped {
  transform: rotateY(180deg);
}

.flashcard-inner.flashcard-enter {
  animation: flip-in-y 0.5s ease;
}

.front,
.back {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border-radius: 1rem;
  backface-visibility: hidden;
  text-align: center;
}

.back {
  transform: rotateY(180deg);
}

@keyframes flip-in-y {
  from {
    opacity: 0;
    transform: perspective(1200px) rotateY(-90deg);
  }

  to {
    opacity: 1;
    transform: perspective(1200px) rotateY(0);
  }
}

@media (min-width: 640px) {
  .flashcard-inner,
  .front,
  .back {
    min-height: 420px;
  }
}
</style>
