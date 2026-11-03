import { useCallback } from 'react';
import { useTaskActions } from '../lib/store';
import { insertAt, removeFromList, replaceInList } from '../lib/tasks';

/**
 * Optimistic toggle/delete for a list held in local state:
 * the UI updates immediately, and is rolled back if the API call fails.
 */
export function useTaskListActions(setList) {
  const { setStatus, removeTask } = useTaskActions();

  const toggle = useCallback(
    (task, status = task.status === 'completed' ? 'todo' : 'completed') => {
      setList((list) => replaceInList(list, { ...task, status }));
      return setStatus(task, status, { rollback: () => setList((list) => replaceInList(list, task)) });
    },
    [setList, setStatus]
  );

  const remove = useCallback(
    (task) => {
      let index = -1;
      setList((list) => {
        index = list ? list.findIndex((t) => t.id === task.id) : -1;
        return removeFromList(list, task.id);
      });
      return removeTask(task, { rollback: () => setList((list) => insertAt(list, index, task)) });
    },
    [setList, removeTask]
  );

  return { toggle, remove };
}
