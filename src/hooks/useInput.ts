import { useEffect, type MutableRefObject } from 'react';
import type { InputState } from '../game/types';

export function useKeyboard(inputRef: MutableRefObject<InputState>): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const inp = inputRef.current;
      switch (e.code) {
        case 'ArrowLeft':  case 'KeyA': inp.left  = true; break;
        case 'ArrowRight': case 'KeyD': inp.right = true; break;
        case 'ArrowUp':    case 'KeyW': inp.up    = true; break;
        case 'ArrowDown':  case 'KeyS': inp.down  = true; break;
        case 'KeyE': case 'Space':
          inp.action = true;
          inp.actionJustPressed = true;
          break;
      }
      // Prevent page scroll on arrow/space
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const inp = inputRef.current;
      switch (e.code) {
        case 'ArrowLeft':  case 'KeyA': inp.left  = false; break;
        case 'ArrowRight': case 'KeyD': inp.right = false; break;
        case 'ArrowUp':    case 'KeyW': inp.up    = false; break;
        case 'ArrowDown':  case 'KeyS': inp.down  = false; break;
        case 'KeyE': case 'Space':      inp.action = false; break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [inputRef]);
}

/** Joystick touch controls – call with the joystick element ref */
export function useTouchJoystick(
  inputRef: MutableRefObject<InputState>,
  joystickRef: MutableRefObject<HTMLElement | null>,
  actionRef: MutableRefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const joystick = joystickRef.current;
    const action = actionRef.current;
    if (!joystick) return;

    let touchId: number | null = null;
    let originX = 0, originY = 0;
    const deadzone = 10;
    const maxRadius = 40;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const rect = joystick!.getBoundingClientRect();
        if (t.clientX >= rect.left && t.clientX <= rect.right &&
            t.clientY >= rect.top  && t.clientY <= rect.bottom) {
          touchId = t.identifier;
          originX = rect.left + rect.width / 2;
          originY = rect.top + rect.height / 2;
        }
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId) {
          const dx = t.clientX - originX;
          const dy = t.clientY - originY;
          const d = Math.sqrt(dx * dx + dy * dy);
          const clamped = Math.min(d, maxRadius);
          if (d > deadzone) {
            inputRef.current.touchDx = (dx / d) * (clamped / maxRadius);
            inputRef.current.touchDy = (dy / d) * (clamped / maxRadius);
          } else {
            inputRef.current.touchDx = 0;
            inputRef.current.touchDy = 0;
          }
        }
      }
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          inputRef.current.touchDx = 0;
          inputRef.current.touchDy = 0;
        }
      }
    }

    joystick.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });

    // Action button
    function onActionDown(e: TouchEvent) {
      e.preventDefault();
      inputRef.current.action = true;
      inputRef.current.actionJustPressed = true;
    }
    function onActionUp(e: TouchEvent) {
      e.preventDefault();
      inputRef.current.action = false;
    }

    if (action) {
      action.addEventListener('touchstart', onActionDown, { passive: false });
      action.addEventListener('touchend', onActionUp, { passive: false });
    }

    return () => {
      joystick.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      action?.removeEventListener('touchstart', onActionDown);
      action?.removeEventListener('touchend', onActionUp);
    };
  }, [inputRef, joystickRef, actionRef]);
}
