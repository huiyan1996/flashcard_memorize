export const QUIZ_QUESTION_LIMIT = 20
export const QUIZ_OPTION_COUNT = 4
export const QUIZ_MIN_WORDS = 4

export const shuffleItems = (items = []) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

export const pickRandomItems = (items = [], count) => {
  if (count >= items.length) {
    return shuffleItems(items)
  }

  return shuffleItems(items).slice(0, count)
}

/**
 * Build a multiple-choice quiz from a word list.
 * Question prompt = word; options = meanings (1 correct + distractors from same list).
 */
export const buildQuizQuestions = (words = [], {
  limit = QUIZ_QUESTION_LIMIT,
  optionCount = QUIZ_OPTION_COUNT,
} = {}) => {
  const safeWords = (Array.isArray(words) ? words : [])
    .map((item, index) => ({
      word: String(item?.word || '').trim(),
      meaning: String(item?.meaning || '').trim(),
      index,
    }))
    .filter((item) => item.word && item.meaning)

  if (safeWords.length < optionCount) {
    return []
  }

  const questionCount = Math.min(limit, safeWords.length)
  const selected = pickRandomItems(safeWords, questionCount)

  return selected.map((item) => {
    const distractors = pickRandomItems(
      safeWords.filter((candidate) => (
        candidate.index !== item.index
        && candidate.meaning !== item.meaning
      )),
      optionCount - 1,
    ).map((candidate) => candidate.meaning)

    // If not enough unique meanings, fill from any other word meanings
    while (distractors.length < optionCount - 1) {
      const filler = safeWords.find((candidate) => (
        candidate.index !== item.index
        && !distractors.includes(candidate.meaning)
        && candidate.meaning !== item.meaning
      ))

      if (!filler) {
        break
      }

      distractors.push(filler.meaning)
    }

    const options = shuffleItems([item.meaning, ...distractors].slice(0, optionCount))

    return {
      wordIndex: item.index,
      word: item.word,
      correctMeaning: item.meaning,
      options,
      selectedMeaning: null,
    }
  }).filter((question) => question.options.length === optionCount)
}
