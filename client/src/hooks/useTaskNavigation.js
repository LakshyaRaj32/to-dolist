import { useLocation, useNavigate } from 'react-router-dom';

/** Opens the task sheet / detail page on top of the current screen. */
export function useTaskNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = { state: { background: location } };
  return {
    openTask: (task) => navigate(`/tasks/${task.id}`),
    editTask: (task) => navigate(`/tasks/${task.id}/edit`, background),
    newTask: (date) => navigate(`/tasks/new${date ? `?date=${date}` : ''}`, background),
  };
}
