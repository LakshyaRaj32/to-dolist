const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { validate, validateObjectId } = require('../middleware/validate');
const tasks = require('../controllers/taskController');
const schemas = require('../validators/taskSchemas');

const router = express.Router();
const validId = validateObjectId('id', 'Task');

router
  .route('/')
  .get(validate({ query: schemas.listQuery }), asyncHandler(tasks.listTasks))
  .post(validate({ body: schemas.createTask }), asyncHandler(tasks.createTask));

// Static paths must come before "/:id".
router.get('/weeks', validate({ query: schemas.weeksQuery }), asyncHandler(tasks.getWeeklySummary));
router.get('/tags', asyncHandler(tasks.listTags));
router.put('/reorder', validate({ body: schemas.reorderBody }), asyncHandler(tasks.reorderTasks));

router
  .route('/:id')
  .all(validId)
  .get(asyncHandler(tasks.getTask))
  .put(validate({ body: schemas.updateTask }), asyncHandler(tasks.updateTask))
  .patch(validate({ body: schemas.updateTask }), asyncHandler(tasks.updateTask))
  .delete(asyncHandler(tasks.deleteTask));

module.exports = router;
