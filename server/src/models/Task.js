const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'completed'];
// Numeric rank so tasks can be sorted by priority (none < low < medium < high).
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    dueAt: { type: Date, required: [true, 'Date & time is required'] },
    endAt: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return !value || !this.dueAt || value > this.dueAt;
        },
        message: 'End time must be after the start time',
      },
    },
    priority: { type: String, enum: [...PRIORITIES, null], default: null },
    priorityRank: { type: Number, default: 0 },
    // "todo" | "in_progress" | "completed" — richer than an isCompleted boolean (the brief needs "In progress").
    status: { type: String, enum: STATUSES, default: 'todo' },
    completedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
    // Manual order within a day, set by drag-and-drop. null = not reordered (falls back to time).
    position: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.priorityRank;
        return ret;
      },
    },
  }
);

taskSchema.pre('validate', function setPriorityRank(next) {
  this.priorityRank = PRIORITY_RANK[this.priority] ?? 0;
  next();
});

// Every query is scoped to a user; these serve the default sort, week ranges, cursors and tag filters.
taskSchema.index({ userId: 1, dueAt: 1, _id: 1 });
taskSchema.index({ userId: 1, priorityRank: 1, _id: 1 });
taskSchema.index({ userId: 1, tags: 1 });

module.exports = {
  Task: mongoose.models.Task || mongoose.model('Task', taskSchema),
  PRIORITIES,
  STATUSES,
};
