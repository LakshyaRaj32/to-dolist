import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const REVEAL = 84; // width of the Delete button in px

/**
 * Swipe the row left to reveal a "Delete" button (works with touch and mouse).
 * Vertical scrolling still works because the row only captures horizontal drags.
 */
export default function SwipeToDelete({ children, onDelete, surface = 'bg-page' }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    gesture.current = { x: e.clientX, y: e.clientY, base: offset, axis: null };
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (g.axis === 'x') {
      setOffset(Math.max(-REVEAL * 1.4, Math.min(0, g.base + dx)));
    }
  };

  const endGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== 'x') return;
    suppressClick.current = true;
    setDragging(false);
    setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0));
  };

  const onClickCapture = (e) => {
    // Swallow the click that ends a drag, and use a tap on an open row to close it.
    if (suppressClick.current || offset !== 0) {
      e.preventDefault();
      e.stopPropagation();
      if (!suppressClick.current) setOffset(0);
      suppressClick.current = false;
    }
  };

  return (
    <div className={`relative overflow-hidden ${offset !== 0 ? 'bg-danger' : ''}`}>
      <button
        type="button"
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 text-[12px] font-medium text-white"
        style={{ width: REVEAL }}
      >
        <Trash2 className="size-5" strokeWidth={1.75} />
        Delete
      </button>
      <div
        className={`relative touch-pan-y select-none ${surface} ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
