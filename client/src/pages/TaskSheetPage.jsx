import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { addHours, startOfHour } from 'date-fns';
import { api, isAbortError } from '../lib/api';
import { fromInputs, toInputDate, toInputTime } from '../lib/dates';
import { useApp } from '../lib/store';
import Sheet from '../components/Sheet';
import TaskInput from '../components/form/TaskInput';
import { Spinner, useGoBack } from '../components/Layout';

function emptyForm(dateParam) {
  const next = startOfHour(addHours(new Date(), 1));
  return {
    title: '',
    description: '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(dateParam || '') ? dateParam : toInputDate(next),
    start: toInputTime(next),
    end: '',
    priority: '',
    status: 'todo',
    tags: [],
  };
}

const toForm = (task) => {
  const due = new Date(task.dueAt);
  return {
    title: task.title,
    description: task.description || '',
    date: toInputDate(due),
    start: toInputTime(due),
    end: task.endAt ? toInputTime(new Date(task.endAt)) : '',
    priority: task.priority || '',
    status: task.status,
    tags: task.tags || [],
  };
};

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  dueAt: fromInputs(form.date, form.start).toISOString(),
  endAt: form.end ? fromInputs(form.date, form.end).toISOString() : null,
  priority: form.priority || null,
  status: form.status,
  tags: form.tags,
});

/** "Add New Task" / "Edit Task" bottom sheet: loads data and saves; the form itself is <TaskInput />. */
export default function TaskSheetPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const goBack = useGoBack();
  const { changed, showToast } = useApp();

  const [initial, setInitial] = useState(() => (isEdit ? null : emptyForm(searchParams.get('date'))));
  const [loadError, setLoadError] = useState(null);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    if (isEdit) {
      api
        .get(id, { signal: controller.signal })
        .then((task) => setInitial(toForm(task)))
        .catch((err) => !isAbortError(err) && setLoadError(err.message));
    }
    api
      .tags({ signal: controller.signal })
      .then((list) => setTags(list.map((t) => t.tag)))
      .catch(() => {});
    return () => controller.abort();
  }, [id, isEdit]);

  const save = async (form) => {
    try {
      if (isEdit) await api.update(id, toPayload(form));
      else await api.create(toPayload(form));
    } catch (err) {
      showToast(err.offline ? 'You’re offline — the task wasn’t saved' : err.message);
      throw err;
    }
    changed();
    showToast(isEdit ? 'Task updated' : 'Task created');
    goBack();
  };

  return (
    <Sheet title={isEdit ? 'Edit Task' : 'Add New Task'} onClose={goBack}>
      {loadError && <p className="py-10 text-center text-[13px] text-danger">{loadError}</p>}
      {!loadError && !initial && <Spinner className="mx-auto my-16" />}
      {initial && <TaskInput initialValues={initial} isEdit={isEdit} tagSuggestions={tags} onSubmit={save} />}
    </Sheet>
  );
}
