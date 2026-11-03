process.env.NODE_ENV = 'test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const { connectDB } = require('../src/config/db');
const { Task } = require('../src/models/Task');
const { User } = require('../src/models/User');

let mongo;
const app = createApp();
let alice; // { token, user }
let bob;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri('todolist-test'));
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const register = async (name) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email: `${name.toLowerCase()}@example.com`, password: 'password123' });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

beforeEach(async () => {
  await Promise.all([Task.deleteMany({}), User.deleteMany({})]);
  alice = await register('Alice');
  bob = await register('Bob');
});

const as = (who) => ({
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${who.token}`),
  post: (url) => request(app).post(url).set('Authorization', `Bearer ${who.token}`),
  put: (url) => request(app).put(url).set('Authorization', `Bearer ${who.token}`),
  patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${who.token}`),
  delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${who.token}`),
});
const create = (body, who = alice) => as(who).post('/api/tasks').send(body);
const titles = (res) => res.body.map((t) => t.title);

// ---------- Auth ----------

test('register returns a token and never exposes the password hash', async () => {
  assert.ok(alice.token);
  assert.equal(alice.user.email, 'alice@example.com');
  assert.equal(alice.user.passwordHash, undefined);
});

test('register validates input and rejects duplicate emails', async () => {
  let res = await request(app).post('/api/auth/register').send({ name: '', email: 'nope', password: 'short' });
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(res.body.errors).sort(), ['email', 'name', 'password']);

  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice 2', email: 'ALICE@example.com', password: 'password123' });
  assert.equal(res.status, 409);
});

test('login works with the right password only', async () => {
  let res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'password123' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);

  res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrong-password' });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Invalid email or password');

  res = await as(alice).get('/api/auth/me');
  assert.equal(res.body.user.name, 'Alice');
});

test('task routes require a valid token', async () => {
  assert.equal((await request(app).get('/api/tasks')).status, 401);
  const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer not-a-jwt');
  assert.equal(res.status, 401);
  assert.equal(res.body.stack, undefined);
});

test("users only see and change their own tasks", async () => {
  const { body: task } = await create({ title: 'Alice only', dueAt: '2026-11-03T10:00:00Z' });
  await create({ title: 'Bob only', dueAt: '2026-11-03T10:00:00Z' }, bob);

  assert.deepEqual(titles(await as(bob).get('/api/tasks')), ['Bob only']);
  assert.equal((await as(bob).get(`/api/tasks/${task.id}`)).status, 404);
  assert.equal((await as(bob).patch(`/api/tasks/${task.id}`).send({ title: 'hacked' })).status, 404);
  assert.equal((await as(bob).delete(`/api/tasks/${task.id}`)).status, 404);
  assert.equal((await as(bob).put('/api/tasks/reorder').send({ ids: [task.id] })).status, 404);
  assert.equal((await as(alice).get(`/api/tasks/${task.id}`)).body.title, 'Alice only');
});

// ---------- Guest accounts ----------

const createGuest = async () => {
  const res = await request(app).post('/api/auth/guest');
  assert.equal(res.status, 201);
  return res.body;
};

test('"Get Started" creates a private guest account', async () => {
  const guest = await createGuest();
  const other = await createGuest();
  assert.equal(guest.user.isGuest, true);
  assert.equal(guest.user.email, undefined);

  await create({ title: 'Guest task', dueAt: '2026-11-03T10:00:00Z' }, guest);
  assert.deepEqual(titles(await as(guest).get('/api/tasks')), ['Guest task']);
  assert.deepEqual(titles(await as(other).get('/api/tasks')), []);
});

test('a guest can save their account and keep their tasks', async () => {
  const guest = await createGuest();
  await create({ title: 'Keep me', dueAt: '2026-11-03T10:00:00Z' }, guest);

  // Email already used by another account.
  let res = await as(guest).post('/api/auth/upgrade').send({ name: 'G', email: 'alice@example.com', password: 'password123' });
  assert.equal(res.status, 409);

  res = await as(guest).post('/api/auth/upgrade').send({ name: 'Gina', email: 'gina@example.com', password: 'password123' });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.isGuest, false);
  assert.equal(res.body.user.id, guest.user.id);

  // Can now log in from anywhere and still sees the tasks made as a guest.
  const login = await request(app).post('/api/auth/login').send({ email: 'gina@example.com', password: 'password123' });
  assert.equal(login.status, 200);
  assert.deepEqual(titles(await as(login.body).get('/api/tasks')), ['Keep me']);

  // Saving twice is rejected.
  res = await as(login.body).post('/api/auth/upgrade').send({ name: 'Gina', email: 'g2@example.com', password: 'password123' });
  assert.equal(res.status, 409);
});

test('abandoned guest accounts are removed with their tasks', async () => {
  const { removeStaleGuests } = require('../src/services/guestCleanup');
  const stale = await createGuest();
  const fresh = await createGuest();
  await create({ title: 'Old', dueAt: '2026-11-03T10:00:00Z' }, stale);
  await create({ title: 'New', dueAt: '2026-11-03T10:00:00Z' }, fresh);
  await User.updateOne({ _id: stale.user.id }, { lastActiveAt: new Date(Date.now() - 31 * 864e5) });

  assert.equal(await removeStaleGuests(), 1);
  assert.equal(await User.countDocuments({ _id: stale.user.id }), 0);
  assert.equal(await Task.countDocuments({ title: 'Old' }), 0);
  assert.equal(await Task.countDocuments({ title: 'New' }), 1);
  assert.equal((await as(stale).get('/api/auth/me')).status, 401);
});

// ---------- CRUD + validation ----------

test('creates a task with defaults and sanitized fields', async () => {
  const res = await create({
    title: '  Buy milk ',
    dueAt: '2026-11-03T10:00:00Z',
    tags: [' Home ', 'home', 'Errands'],
    userId: new mongoose.Types.ObjectId().toString(), // ignored: owner comes from the token
    hacker: true,
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Buy milk');
  assert.equal(res.body.status, 'todo');
  assert.equal(res.body.priority, null);
  assert.deepEqual(res.body.tags, ['home', 'errands']);
  assert.equal(res.body.userId, alice.user.id);
  assert.equal(res.body.hacker, undefined);
  assert.equal(res.body.priorityRank, undefined);
});

test('rejects invalid tasks with field errors', async () => {
  let res = await create({ description: 'nope' });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.title);
  assert.ok(res.body.errors.dueAt);

  res = await create({ title: 'x', dueAt: 'not a date', priority: 'urgent' });
  assert.equal(res.body.errors.dueAt, 'Must be a valid date');
  assert.ok(res.body.errors.priority);

  res = await create({ title: 'Bad', dueAt: '2026-11-03T10:00:00Z', endAt: '2026-11-03T09:00:00Z' });
  assert.equal(res.body.errors.endAt, 'End time must be after the start time');

  res = await as(alice).post('/api/tasks').set('Content-Type', 'application/json').send('{bad json');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Malformed JSON body');
});

test('PUT and PATCH update fields and track completion time', async () => {
  const { body: task } = await create({ title: 'Write report', dueAt: '2026-11-03T10:00:00Z' });

  let res = await as(alice).put(`/api/tasks/${task.id}`).send({ status: 'completed', priority: 'high' });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'completed');
  assert.equal(res.body.priority, 'high');
  assert.ok(res.body.completedAt);

  res = await as(alice).patch(`/api/tasks/${task.id}`).send({ status: 'in_progress' });
  assert.equal(res.body.completedAt, null);

  res = await as(alice).patch(`/api/tasks/${task.id}`).send({});
  assert.equal(res.status, 400);
});

test('deletes a task; unknown and malformed ids are 404', async () => {
  const { body: task } = await create({ title: 'Temp', dueAt: '2026-11-03T10:00:00Z' });
  assert.equal((await as(alice).delete(`/api/tasks/${task.id}`)).status, 204);
  assert.equal((await as(alice).get(`/api/tasks/${task.id}`)).status, 404);
  assert.equal((await as(alice).get('/api/tasks/not-an-id')).status, 404);
});

test('unknown routes return JSON 404', async () => {
  const res = await request(app).get('/api/nope');
  assert.equal(res.status, 404);
  assert.match(res.body.error, /Route not found/);
});

// ---------- Search, filters, sorting, pagination ----------

test('searches title, description and tags by all keywords', async () => {
  await create({ title: 'Team meeting', description: 'Discuss Q4 roadmap', dueAt: '2026-11-03T10:00:00Z' });
  await create({ title: 'Gym', description: 'Leg day', dueAt: '2026-11-04T10:00:00Z', tags: ['health'] });
  await create({ title: 'Roadmap (draft)', dueAt: '2026-11-05T10:00:00Z' });

  assert.deepEqual(titles(await as(alice).get('/api/tasks?q=ROADMAP')), ['Team meeting', 'Roadmap (draft)']);
  assert.deepEqual(titles(await as(alice).get('/api/tasks?q=meeting%20roadmap')), ['Team meeting']);
  assert.deepEqual(titles(await as(alice).get('/api/tasks?q=(draft')), ['Roadmap (draft)']);
  assert.deepEqual(titles(await as(alice).get('/api/tasks?q=health')), ['Gym']);
});

test('filters by status, priority, tag and date range', async () => {
  await create({ title: 'A', dueAt: '2026-11-02T10:00:00Z', status: 'completed', priority: 'high', tags: ['work'] });
  await create({ title: 'B', dueAt: '2026-11-03T10:00:00Z', status: 'in_progress', tags: ['work', 'urgent'] });
  await create({ title: 'C', dueAt: '2026-11-09T10:00:00Z', priority: 'low' });

  const q = (qs) => as(alice).get(`/api/tasks?${qs}`).then(titles);
  assert.deepEqual(await q('status=completed'), ['A']);
  assert.deepEqual(await q('status=open'), ['B', 'C']);
  assert.deepEqual(await q('priority=none'), ['B']);
  assert.deepEqual(await q('tag=WORK'), ['A', 'B']);
  assert.deepEqual(await q('from=2026-11-02T00:00:00Z&to=2026-11-09T00:00:00Z'), ['A', 'B']);

  const bad = await as(alice).get('/api/tasks?status=done&sortBy=color');
  assert.equal(bad.status, 400);
  assert.ok(bad.body.errors.status && bad.body.errors.sortBy);
});

test('sorts by due date, priority and title', async () => {
  await create({ title: 'banana', dueAt: '2026-11-03T10:00:00Z', priority: 'low' });
  await create({ title: 'Apple', dueAt: '2026-11-04T10:00:00Z', priority: 'high' });
  await create({ title: 'cherry', dueAt: '2026-11-02T10:00:00Z' });
  await create({ title: 'date', dueAt: '2026-11-01T10:00:00Z', priority: 'high' });

  const q = (qs) => as(alice).get(`/api/tasks?${qs}`).then(titles);
  assert.deepEqual(await q(''), ['date', 'cherry', 'banana', 'Apple']);
  assert.deepEqual(await q('sortBy=dueDate&order=desc'), ['Apple', 'banana', 'cherry', 'date']);
  // high → low, soonest first within the same priority, no priority last
  assert.deepEqual(await q('sortBy=priority'), ['date', 'Apple', 'banana', 'cherry']);
  assert.deepEqual(await q('sortBy=priority&order=asc'), ['cherry', 'banana', 'date', 'Apple']);
});

test('cursor pagination has no gaps or duplicates for every sort', async () => {
  const priorities = ['high', null, 'low', 'high', 'medium', null, 'low'];
  const times = ['10', '11', '11', '12', '13', '13', '14'];
  for (const [i, t] of times.entries()) {
    await create({ title: `Report ${i}`, dueAt: `2026-11-03T${t}:00:00Z`, priority: priorities[i] });
  }
  await create({ title: 'Unrelated', dueAt: '2026-11-03T09:00:00Z' });

  for (const sort of ['sortBy=dueDate', 'sortBy=dueDate&order=desc', 'sortBy=priority', 'sortBy=title']) {
    const expected = titles(await as(alice).get(`/api/tasks?q=report&${sort}`));
    const seen = [];
    let cursor = '';
    do {
      const res = await as(alice).get(`/api/tasks?q=report&${sort}&limit=2${cursor && `&cursor=${cursor}`}`);
      assert.equal(res.status, 200);
      seen.push(...res.body.items.map((t) => t.title));
      cursor = res.body.nextCursor;
    } while (cursor);
    assert.deepEqual(seen, expected, sort);
    assert.equal(seen.length, 7);
  }

  assert.equal((await as(alice).get('/api/tasks?limit=0')).status, 400);
  assert.equal((await as(alice).get('/api/tasks?limit=5&cursor=garbage')).status, 400);
});

// ---------- Weeks, tags, reorder ----------

test('groups weeks Monday–Sunday in the requested time zone, per user', async () => {
  // Sunday 1 Nov 20:00 UTC is Monday 2 Nov 01:30 in India.
  await create({ title: 'Edge', dueAt: '2026-11-01T20:00:00Z' });
  await create({ title: 'Mon', dueAt: '2026-11-02T09:00:00Z', status: 'completed' });
  await create({ title: 'Next', dueAt: '2026-11-09T09:00:00Z' });
  await create({ title: 'Bob', dueAt: '2026-11-02T09:00:00Z' }, bob);

  let res = await as(alice).get('/api/tasks/weeks?tz=UTC');
  assert.deepEqual(res.body, [
    { weekStart: '2026-10-26T00:00:00.000Z', total: 1, completed: 0, open: 1 },
    { weekStart: '2026-11-02T00:00:00.000Z', total: 1, completed: 1, open: 0 },
    { weekStart: '2026-11-09T00:00:00.000Z', total: 1, completed: 0, open: 1 },
  ]);

  res = await as(alice).get('/api/tasks/weeks?tz=Asia/Kolkata');
  assert.deepEqual(res.body, [
    { weekStart: '2026-11-01T18:30:00.000Z', total: 2, completed: 1, open: 1 },
    { weekStart: '2026-11-08T18:30:00.000Z', total: 1, completed: 0, open: 1 },
  ]);

  assert.equal((await as(alice).get('/api/tasks/weeks?tz=Not/AZone')).status, 400);
});

test('lists tags by usage', async () => {
  await create({ title: 'A', dueAt: '2026-11-02T10:00:00Z', tags: ['work', 'urgent'] });
  await create({ title: 'B', dueAt: '2026-11-03T10:00:00Z', tags: ['work'] });
  await create({ title: 'C', dueAt: '2026-11-03T10:00:00Z', tags: ['secret'] }, bob);
  const res = await as(alice).get('/api/tasks/tags');
  assert.deepEqual(res.body, [{ tag: 'work', count: 2 }, { tag: 'urgent', count: 1 }]);
});

test('reorder saves drag-and-drop positions', async () => {
  const ids = [];
  for (const title of ['First', 'Second', 'Third']) {
    ids.push((await create({ title, dueAt: '2026-11-03T10:00:00Z' })).body.id);
  }
  const res = await as(alice).put('/api/tasks/reorder').send({ ids: [ids[2], ids[0], ids[1]] });
  assert.equal(res.status, 200);
  const tasks = (await as(alice).get('/api/tasks')).body;
  const pos = Object.fromEntries(tasks.map((t) => [t.title, t.position]));
  assert.deepEqual(pos, { Third: 0, First: 1, Second: 2 });

  assert.equal((await as(alice).put('/api/tasks/reorder').send({ ids: ['x'] })).status, 400);
});
