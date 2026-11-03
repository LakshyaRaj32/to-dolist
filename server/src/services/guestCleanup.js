const { User } = require('../models/User');
const { Task } = require('../models/Task');

const GUEST_TTL_DAYS = 30;

/** Deletes guest accounts (and their tasks) that haven't been used for `days` days. */
async function removeStaleGuests({ days = GUEST_TTL_DAYS, limit = 200 } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const stale = await User.find({ isGuest: true, lastActiveAt: { $lt: cutoff } })
    .select('_id')
    .limit(limit)
    .lean();
  if (stale.length === 0) return 0;
  const ids = stale.map((u) => u._id);
  await Task.deleteMany({ userId: { $in: ids } });
  await User.deleteMany({ _id: { $in: ids } });
  return ids.length;
}

module.exports = { removeStaleGuests, GUEST_TTL_DAYS };
