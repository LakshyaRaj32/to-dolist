const mongoose = require('mongoose');
const { Task } = require('../models/Task');
const ApiError = require('../utils/ApiError');
const { encodeCursor, decodeCursor, afterCursor } = require('../utils/pagination');
const { SORT_FIELDS } = require('../validators/taskSchemas');

const UNPAGED_LIMIT = 500;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const userObjectId = (req) => new mongoose.Types.ObjectId(req.user.id);

/** Finds one of the current user's tasks. Other users' tasks are reported as "not found". */
async function findOwnTask(req) {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) throw ApiError.notFound('Task not found');
  return task;
}

/**
 * GET /tasks — filter, sort and (optionally) paginate.
 * Without `limit` → array (e.g. one week). With `limit` → `{ items, nextCursor }`.
 */
async function listTasks(req, res) {
  const { q, status, priority, tag, from, to, sortBy, order, limit, cursor } = req.valid.query;
  const and = [{ userId: req.user.id }];

  if (q) {
    // Every keyword must appear in the title or description.
    for (const word of q.split(/\s+/)) {
      const re = new RegExp(escapeRegex(word), 'i');
      and.push({ $or: [{ title: re }, { description: re }, { tags: re }] });
    }
  }
  if (status === 'open') and.push({ status: { $ne: 'completed' } });
  else if (status) and.push({ status });
  if (priority) and.push({ priority: priority === 'none' ? null : priority });
  if (tag) and.push({ tags: tag });
  if (from) and.push({ dueAt: { $gte: from } });
  if (to) and.push({ dueAt: { $lt: to } });

  // Priority defaults to high → low; everything else to ascending.
  const direction = (order ?? (sortBy === 'priority' ? 'desc' : 'asc')) === 'asc' ? 1 : -1;
  const sortKeys = [[SORT_FIELDS[sortBy], direction]];
  // Within the same priority, show the soonest task first.
  if (sortBy === 'priority') sortKeys.push(['dueAt', 1]);
  const sort = Object.fromEntries([...sortKeys, ['_id', 1]]); // _id makes the order total (stable)

  const paged = limit !== undefined;
  if (paged && cursor) and.push(afterCursor(sortKeys, decodeCursor(cursor, sortKeys.length)));

  const tasks = await Task.find({ $and: and })
    .sort(sort)
    .limit(paged ? limit + 1 : UNPAGED_LIMIT);
  if (!paged) return res.json(tasks);

  // One extra row was fetched to know whether another page exists.
  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, limit) : tasks;
  const fields = sortKeys.map(([field]) => field);
  res.json({ items, nextCursor: hasMore ? encodeCursor(items[items.length - 1], fields) : null });
}

/** GET /tasks/weeks?tz= — open/completed counts per Monday–Sunday week in the user's time zone. */
async function getWeeklySummary(req, res) {
  const { tz } = req.valid.query;
  const weeks = await Task.aggregate([
    { $match: { userId: userObjectId(req) } },
    {
      $group: {
        _id: { $dateTrunc: { date: '$dueAt', unit: 'week', startOfWeek: 'monday', timezone: tz } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json(
    weeks.map((w) => ({ weekStart: w._id, total: w.total, completed: w.completed, open: w.total - w.completed }))
  );
}

/** GET /tasks/tags — the user's tags, most used first. */
async function listTags(req, res) {
  const tags = await Task.aggregate([
    { $match: { userId: userObjectId(req) } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 50 },
  ]);
  res.json(tags.map((t) => ({ tag: t._id, count: t.count })));
}

async function getTask(req, res) {
  res.json(await findOwnTask(req));
}

async function createTask(req, res) {
  const data = { ...req.valid.body, userId: req.user.id };
  if (data.status === 'completed') data.completedAt = new Date();
  res.status(201).json(await Task.create(data));
}

async function updateTask(req, res) {
  const task = await findOwnTask(req);
  const updates = { ...req.valid.body };
  if (updates.status && updates.status !== task.status) {
    updates.completedAt = updates.status === 'completed' ? new Date() : null;
  }
  task.set(updates);
  await task.save();
  res.json(task);
}

async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!task) throw ApiError.notFound('Task not found');
  res.status(204).end();
}

/** PUT /tasks/reorder { ids } — saves a drag-and-drop order (position = index). */
async function reorderTasks(req, res) {
  const ids = [...new Set(req.valid.body.ids)];
  const owned = await Task.countDocuments({ _id: { $in: ids }, userId: req.user.id });
  if (owned !== ids.length) throw ApiError.notFound('One or more tasks were not found');
  await Task.bulkWrite(
    ids.map((id, position) => ({
      updateOne: { filter: { _id: id, userId: req.user.id }, update: { $set: { position } } },
    }))
  );
  res.json({ ids });
}

module.exports = {
  listTasks,
  getWeeklySummary,
  listTags,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
};
