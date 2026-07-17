import mongoose from 'mongoose'

const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    flashcardStatus: {
      type: String,
      enum: ['none', 'forgot', 'hard', 'yes'],
      default: 'none',
    },
  },
  { _id: false },
)

const wordSetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    words: {
      type: [wordSchema],
      default: [],
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
      index: true,
    },
    flashcardOrder: {
      type: String,
      enum: ['sequence', 'random'],
      default: 'sequence',
    },
    speechLanguage: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

export const WordSet = mongoose.models.WordSet || mongoose.model('WordSet', wordSetSchema)
