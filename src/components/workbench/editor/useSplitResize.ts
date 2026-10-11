import { useRef } from 'react';

const MIN_H = 15;
const MAX_H = 85;
const MIN_DRAWER = 80;
const MAX_DRAWER = 550;

/**
 * Drag-to-resize behaviour for the editor layout: a horizontal splitter between
 * the editor and the live preview, and a vertical splitter above the bottom
 * drawer. Returns the container ref and the two drag-start handlers.
 */
export function useSplitResize(
  setSplitRatio: (value: number) => void,
  setDrawerHeight: (value: number) => void,
  drawerHeight: number
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingHorizontalRef = useRef(false);
  const isDraggingVerticalRef = useRef(false);

  const bindDrag = (
    dragging: { current: boolean },
    onMove: (ev: MouseEvent | TouchEvent) => void
  ) => {
    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      onMove(ev);
    };
    const handleStop = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleStop);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleStop);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleStop);
  };

  const handleStartHorizontalResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingHorizontalRef.current = true;
    bindDrag(isDraggingHorizontalRef, (ev) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const newRatio = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(MIN_H, Math.min(MAX_H, newRatio)));
    });
  };

  const handleStartVerticalResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingVerticalRef.current = true;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startH = drawerHeight;
    bindDrag(isDraggingVerticalRef, (ev) => {
      const currentY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      setDrawerHeight(Math.max(MIN_DRAWER, Math.min(MAX_DRAWER, startH + (startY - currentY))));
    });
  };

  return { containerRef, handleStartHorizontalResize, handleStartVerticalResize };
}
