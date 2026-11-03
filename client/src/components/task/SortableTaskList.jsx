import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import TaskMeta from './TaskMeta';

function SortableRow({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative bg-page ${isDragging ? 'z-10 shadow-[0_8px_24px_rgba(27,27,27,0.12)]' : ''}`}
    >
      <div className="flex items-center gap-3 border-b border-line py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder "${task.title}"`}
          className="-ml-1 grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded text-muted hover:bg-black/5 active:cursor-grabbing"
        >
          <GripVertical className="size-5" strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[14px] font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
            {task.title}
          </p>
          <TaskMeta task={task} />
        </div>
      </div>
    </li>
  );
}

/**
 * Drag-and-drop list. The grip handle has `touch-action: none`, so the pointer sensor covers both
 * mouse and touch; keyboard users press Space to pick up and the arrow keys to move.
 */
export default function SortableTaskList({ tasks, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = tasks.findIndex((t) => t.id === active.id);
    const to = tasks.findIndex((t) => t.id === over.id);
    onReorder(arrayMove(tasks, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {tasks.map((task) => (
            <SortableRow key={task.id} task={task} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
