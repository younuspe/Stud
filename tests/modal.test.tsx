// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { ModalShell } from '../src/components/ui/Modal';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLElement }> = [];

function mount(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  roots.push({ root, container });
  return container;
}

afterEach(() => {
  act(() => {
    for (const { root, container } of roots.splice(0)) {
      root.unmount();
      container.remove();
    }
  });
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('ModalShell', () => {
  it('exposes dialog semantics and locks body scroll while open', () => {
    mount(
      <ModalShell isOpen onClose={() => {}} ariaLabel="Test dialog">
        <button>First</button>
        <button>Last</button>
      </ModalShell>,
    );

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBe('Test dialog');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes on Escape', () => {
    let closed = false;
    mount(
      <ModalShell isOpen onClose={() => { closed = true; }} ariaLabel="Esc test">
        <button>Only</button>
      </ModalShell>,
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(true);
  });

  it('traps Tab focus within the panel', () => {
    mount(
      <ModalShell isOpen onClose={() => {}} ariaLabel="Trap test">
        <button id="a">A</button>
        <button id="b">B</button>
      </ModalShell>,
    );
    const a = document.querySelector('#a') as HTMLButtonElement;
    const b = document.querySelector('#b') as HTMLButtonElement;

    b.focus();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    });
    expect(document.activeElement).toBe(a);
  });

  it('does not render when closed', () => {
    const container = mount(
      <ModalShell isOpen={false} onClose={() => {}} ariaLabel="Closed">
        <button>Hidden</button>
      </ModalShell>,
    );
    expect(container.textContent).toBe('');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('restores focus to the trigger after closing', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Trigger';
    document.body.appendChild(trigger);
    trigger.focus();

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push({ root, container });

    act(() => {
      root.render(
        <ModalShell isOpen onClose={() => {}} ariaLabel="Restore">
          <button>Inside</button>
        </ModalShell>,
      );
    });
    act(() => {
      root.render(
        <ModalShell isOpen={false} onClose={() => {}} ariaLabel="Restore">
          <button>Inside</button>
        </ModalShell>,
      );
    });

    expect(document.activeElement).toBe(trigger);
  });
});
