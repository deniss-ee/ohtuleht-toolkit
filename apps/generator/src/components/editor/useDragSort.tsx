import { useState, type DragEvent } from "react";
import { GripVertical } from "lucide-react";
import { ui } from "@/content";

// The list with the item at `from` moved to `to`.
export function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

// Drag and drop to put the items of a list in order (articles, slides, pictures). One way for every list, no library.
// A drag starts only from the grip, so text can still be selected and typed in the fields of an item.
// The up and down buttons stay next to it for the keyboard.
export function useDragSort(onMove: (from: number, to: number) => void) {
  const [armed, setArmed] = useState<number | null>(null); // the item whose grip is held
  const [from, setFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const end = () => {
    setArmed(null);
    setFrom(null);
    setOver(null);
  };
  return {
    // Spread on each item of the list.
    item: (i: number) => ({
      draggable: armed === i,
      onDragStart: (e: DragEvent) => {
        setFrom(i);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(i)); // Firefox starts a drag only with some data
      },
      onDragOver: (e: DragEvent) => {
        if (from === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (over !== i) setOver(i);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        if (from !== null && from !== i) onMove(from, i);
        end();
      },
      onDragEnd: end,
      "data-drag": from === i ? "from" : over === i && from !== null ? "over" : undefined,
    }),
    // The grip to hold.
    grip: (index: number) => (
      <span
        className="flex cursor-grab touch-none items-center self-stretch px-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        title={ui.dragToMove}
        aria-hidden
        onPointerDown={() => setArmed(index)}
        onPointerUp={() => setArmed(null)}
      >
        <GripVertical className="size-4" />
      </span>
    ),
  };
}

// Classes that show where an item is dropped: the dragged item fades, the target's own border turns red (inside the item, so nothing is cut off at the edge of a scrolling list).
export const DRAG_CLASSES = "data-[drag=from]:opacity-40 data-[drag=over]:border-primary data-[drag=over]:bg-primary/5";
