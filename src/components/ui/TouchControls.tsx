import { useRef, useEffect, type MutableRefObject } from 'react';
import type { InputState } from '../../game/types';

interface TouchControlsProps {
  inputRef: MutableRefObject<InputState>;
}

export default function TouchControls({ inputRef }: TouchControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const joystick = joystickRef.current;
    const knob = knobRef.current;
    if (!joystick || !knob) return;

    let touchId: number | null = null;
    let originX = 0, originY = 0;
    const maxR = 38;
    const dead = 8;

    function onJoyStart(e: TouchEvent) {
      e.preventDefault();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      const rect = joystick!.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    function onJoyMove(e: TouchEvent) {
      e.preventDefault();
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== touchId) continue;

        const dx = t.clientX - originX;
        const dy = t.clientY - originY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const clampedD = Math.min(d, maxR);

        if (d > dead) {
          const nx = (dx / d) * (clampedD / maxR);
          const ny = (dy / d) * (clampedD / maxR);
          inputRef.current.touchDx = nx;
          inputRef.current.touchDy = ny;

          // Move knob visually
          if (knob) {
            knob.style.transform = `translate(calc(-50% + ${(dx / d) * clampedD}px), calc(-50% + ${(dy / d) * clampedD}px))`;
          }
        } else {
          inputRef.current.touchDx = 0;
          inputRef.current.touchDy = 0;
          if (knob) knob.style.transform = 'translate(-50%, -50%)';
        }
      }
    }

    function onJoyEnd(e: TouchEvent) {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          inputRef.current.touchDx = 0;
          inputRef.current.touchDy = 0;
          if (knob) knob.style.transform = 'translate(-50%, -50%)';
        }
      }
    }

    joystick.addEventListener('touchstart', onJoyStart, { passive: false });
    window.addEventListener('touchmove', onJoyMove, { passive: false });
    window.addEventListener('touchend', onJoyEnd, { passive: false });
    window.addEventListener('touchcancel', onJoyEnd, { passive: false });

    return () => {
      joystick.removeEventListener('touchstart', onJoyStart);
      window.removeEventListener('touchmove', onJoyMove);
      window.removeEventListener('touchend', onJoyEnd);
      window.removeEventListener('touchcancel', onJoyEnd);
    };
  }, [inputRef]);

  useEffect(() => {
    const btn = actionRef.current;
    if (!btn) return;

    function onDown(e: TouchEvent) {
      e.preventDefault();
      inputRef.current.action = true;
      inputRef.current.actionJustPressed = true;
      btn!.classList.add('pressed');
    }
    function onUp(e: TouchEvent) {
      e.preventDefault();
      inputRef.current.action = false;
      btn!.classList.remove('pressed');
    }

    btn.addEventListener('touchstart', onDown, { passive: false });
    btn.addEventListener('touchend', onUp, { passive: false });
    btn.addEventListener('touchcancel', onUp, { passive: false });

    return () => {
      btn.removeEventListener('touchstart', onDown);
      btn.removeEventListener('touchend', onUp);
      btn.removeEventListener('touchcancel', onUp);
    };
  }, [inputRef]);

  return (
    <div className="touch-controls" onContextMenu={e => e.preventDefault()}>
      {/* Joystick */}
      <div className="joystick-area" ref={joystickRef}>
        <div className="joystick-base" />
        <div className="joystick-knob" ref={knobRef} />
      </div>

      {/* Action button */}
      <button
        className="action-btn"
        ref={actionRef}
        onMouseDown={() => { inputRef.current.action = true; inputRef.current.actionJustPressed = true; }}
        onMouseUp={() => { inputRef.current.action = false; }}
      >
        E
      </button>
    </div>
  );
}
