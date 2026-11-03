const { z } = require('zod');
const { PRIORITIES, STATUSES } = require('../models/Task');
const { requiredDate, optionalDate, objectId, isBlank } = require('./common');

const priority = z.preprocess((v) => (v === '' ? null : v), z.enum(PRIORITIES).nullable());

const tags = z
  .array(z.string().trim().toLowerCase().min(1, 'Tags cannot be empty').max(24, 'Tags can be at most 24 characters'))
  .max(10, 'At most 10 tags')
  .transform((list) => [...new Set(list)]);

const fields = {
  title: z
    .string({ required_error: 'Title is required', invalid_type_error: 'Title must be text' })
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title can be at most 120 characters'),
  description: z.string().trim().max(2000, 'Description can be at most 2000 characters'),
  dueAt: requiredDate('Date & time is required'),
  endAt: optionalDate(),
  priority,
  status: z.enum(STATUSES),
  tags,
};

const endAfterStart = (task, ctx) => {
  if (task.endAt && task.dueAt && task.endAt <= task.dueAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'End time must be after the start time' });
  }
};

const createTask = z
  .object({
    ...fields,
    description: fields.description.default(''),
    endAt: fields.endAt.optional(),
    priority: fields.priority.optional(),
    status: fields.status.optional(),
    tags: fields.tags.optional(),
  })
  .superRefine(endAfterStart);

// PUT and PATCH both accept a partial update; at least one field is required.
const updateTask = z
  .object(fields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update')
  .superRefine(endAfterStart);

const SORT_FIELDS = { dueDate: 'dueAt', priority: 'priorityRank', title: 'title', createdAt: 'createdAt' };

const listQuery = z.object({
  q: z.string().trim().max(200).optional(),
  // "open" = anything not completed
  status: z.enum([...STATUSES, 'open']).optional(),
  priority: z.enum([...PRIORITIES, 'none']).optional(),
  tag: z.string().trim().toLowerCase().max(24).optional(),
  from: optionalDate(),
  to: optionalDate(),
  sortBy: z.enum(Object.keys(SORT_FIELDS)).default('dueDate'),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce
    .number({ invalid_type_error: '"limit" must be a number' })
    .int()
    .min(1, '"limit" must be between 1 and 100')
    .max(100, '"limit" must be between 1 and 100')
    .optional(),
  cursor: z.string().max(500).optional(),
});

const weeksQuery = z.object({
  tz: z
    .string()
    .default('UTC')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid time zone'),
});

const reorderBody = z.object({
  ids: z.array(objectId).min(1, 'Provide the task ids in their new order').max(200),
});

module.exports = { createTask, updateTask, listQuery, weeksQuery, reorderBody, SORT_FIELDS, isBlank };
