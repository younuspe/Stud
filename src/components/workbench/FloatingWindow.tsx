import React, { useState, useRef, useEffect } from 'react';
import { AppWindow, X, Maximize2, Minimize2, Move } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface FloatingWindowProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onDock: () => void;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  icon,
  children,
  onDock,
  onClose,
  initialX = 80,
  initialY = 60,
  initialWidth = 640,
  initialHeight = 480,
  minWidth = 320,
  minHeight = 220,
  zIndex = 50,
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxState, setPreMaxState] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, startWidth: 0, startHeight: 0 });

  // Dragging logic
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    // Only drag on left click and not on action buttons
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    if (isMaximized) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, dragStartRef.current.posX + dx)),
        y: Math.max(40, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy)),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch Dragging
  const handleTouchStartHeader = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || isMaximized) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      posX: position.x,
      posY: position.y,
    };

    const handleTouchMove = (ev: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const t = ev.touches[0];
      const dx = t.clientX - dragStartRef.current.mouseX;
      const dy = t.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, dragStartRef.current.posX + dx)),
        y: Math.max(40, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy)),
      });
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Resizing logic (Bottom-Right corner)
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isMaximized) return;

    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = ev.clientX - resizeStartRef.current.mouseX;
      const dy = ev.clientY - resizeStartRef.current.mouseY;
      setSize({
        width: Math.max(minWidth, Math.min(window.innerWidth - position.x - 20, resizeStartRef.current.startWidth + dx)),
        height: Math.max(minHeight, Math.min(window.innerHeight - position.y - 20, resizeStartRef.current.startHeight + dy)),
      });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Maximize / Restore
  const toggleMaximize = () => {
    soundFx.playClick();
    if (isMaximized) {
      if (preMaxState) {
        setPosition({ x: preMaxState.x, y: preMaxState.y });
        setSize({ width: preMaxState.width, height: preMaxState.height });
      }
      setIsMaximized(false);
    } else {
      setPreMaxState({ x: position.x, y: position.y, width: size.width, height: size.height });
      setPosition({ x: 10, y: 50 });
      setSize({ width: window.innerWidth - 20, height: window.innerHeight - 60 });
      setIsMaximized(true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex,
      }}
      className="flex flex-col rounded-2xl border border-amber-500/40 bg-[#0a0a12]/98 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-2xl overflow-hidden animate-fadeIn select-none"
    >
      {/* Window Titlebar (Draggable Handle) */}
      <div
        onMouseDown={handleMouseDownHeader}
        onTouchStart={handleTouchStartHeader}
        onDoubleClick={toggleMaximize}
        className="flex h-9 w-full items-center justify-between border-b border-white/[0.08] bg-[#12121e]/95 px-3 text-xs font-sans text-gray-200 cursor-move shrink-0"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-white text-[12px]">{title}</span>
          <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9.5px] font-mono text-sky-300 border border-sky-500/30">
            Floating Window
          </span>
        </div>

        {/* Window Actions */}
        <div className="flex items-center gap-1">
          {/* Dock back button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onDock();
            }}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            title="Dock back to grid workspace"
          >
            <AppWindow size={12} />
            <span>Dock</span>
          </button>

          {/* Maximize / Restore */}
          <button
            onClick={toggleMaximize}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title={isMaximized ? 'Restore Window' : 'Maximize Window'}
          >
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          {/* Close Window */}
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="rounded p-1 text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            title="Close Window (Can reopen from Windows menu)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="relative flex-1 overflow-hidden select-text">
        {children}
      </div>

      {/* Resize Handle (Bottom-Right Corner) */}
      {!isMaximized && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize z-50 flex items-end justify-end p-0.5 group"
          title="Drag to resize window"
        >
          <div className="h-2 w-2 border-r-2 border-b-2 border-gray-500 group-hover:border-amber-400 transition-colors" />
        </div>
      )}
    </div>
  );
};
