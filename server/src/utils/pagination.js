const mongoose = require('mongoose');
const ApiError = require('./ApiError');

// Cursor = the sort values + _id of the last item returned. Unlike page offsets, it never skips
// or repeats items when tasks are added/removed between requests.

const serialize = (v) => (v instanceof Date ? { d: v.toISOString() } : v);
const deserialize = (v) => (v && typeof v === 'object' && 'd' in v ? new Date(v.d) : v);

/** @param fields sort fields (without _id), in sort order */
function encodeCursor(doc, fields) {
  const payload = { v: fields.map((f) => serialize(doc.get(f))), id: String(doc._id) };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(cursor, fieldCount) {
  try {
    const { v, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    if (!Array.isArray(v) || v.length !== fieldCount || !mongoose.isValidObjectId(id)) throw new Error();
    const values = v.map(deserialize);
    if (values.some((x) => x instanceof Date && Number.isNaN(x.getTime()))) throw new Error();
    return { values, id: new mongoose.Types.ObjectId(id) };
  } catch {
    throw ApiError.badRequest('Invalid cursor');
  }
}

/**
 * Filter for "items after the cursor" for a sort of `[[field, dir], ...]` followed by `_id: 1`.
 * Expands to: k0 > v0  OR  (k0 = v0 AND k1 > v1)  OR  ...  OR  (all equal AND _id > id).
 */
function afterCursor(sortKeys, { values, id }) {
  const keys = [...sortKeys.map(([field, dir], i) => [field, dir, values[i]]), ['_id', 1, id]];
  return {
    $or: keys.map(([field, dir, value], i) => {
      const cond = Object.fromEntries(keys.slice(0, i).map(([f, , v]) => [f, v]));
      cond[field] = { [dir === 1 ? '$gt' : '$lt']: value };
      return cond;
    }),
  };
}

module.exports = { encodeCursor, decodeCursor, afterCursor };
