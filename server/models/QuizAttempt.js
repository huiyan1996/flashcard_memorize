import mongoose from 'mongoose'

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wordSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WordSet',
      required: true,
      index: true,
    },
    wordSetTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
)

quizAttemptSchema.index({ userId: 1, createdAt: -1 })

export const QuizAttempt = mongoose.models.QuizAttempt
  || mongoose.model('QuizAttempt', quizAttemptSchema)
