import { SquarePen, Trash2 } from 'lucide-react';
import { useTaskNavigation } from '../../hooks/useTaskNavigation';
import Checkbox from './Checkbox';
import TaskMeta from './TaskMeta';
import { IconButton } from '../Layout';

/** One task row, as in the Figma: checkbox, title, delete and edit icons. Tap the title to view. */
export default function TaskItem({ task, onToggle, onDelete, showDate }) {
  const { openTask, editTask } = useTaskNavigation();
  const done = task.status === 'completed';

  return (
    <div className="flex items-start gap-4">
      <div className="pt-[17px]">
        <Checkbox
          checked={done}
          onChange={() => onToggle(task)}
          label={done ? `Mark "${task.title}" as not completed` : `Mark "${task.title}" as completed`}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1 border-b border-line py-3">
        <button type="button" onClick={() => openTask(task)} className="min-w-0 flex-1 py-0.5 text-left">
          <p className={`truncate text-[14px] font-medium ${done ? 'line-through' : ''}`}>{task.title}</p>
          <TaskMeta task={task} showDate={showDate} />
        </button>
        <IconButton label={`Delete "${task.title}"`} onClick={() => onDelete(task)} className="text-muted hover:text-danger">
          <Trash2 className="size-5" strokeWidth={1.5} />
        </IconButton>
        <IconButton label={`Edit "${task.title}"`} onClick={() => editTask(task)} className="-mr-2 text-muted hover:text-primary">
          <SquarePen className="size-5" strokeWidth={1.5} />
        </IconButton>
      </div>
    </div>
  );
}
