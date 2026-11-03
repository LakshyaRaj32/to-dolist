import SwipeToDelete from '../SwipeToDelete';
import TaskItem from './TaskItem';

/** A list of tasks; each row can be swiped left to delete. */
export default function TaskList({ tasks, onToggle, onDelete, showDate = false, surface }) {
  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <SwipeToDelete onDelete={() => onDelete(task)} surface={surface}>
            <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} showDate={showDate} />
          </SwipeToDelete>
        </li>
      ))}
    </ul>
  );
}
