import { useEffect, useRef, useState, useCallback } from 'react';
import type { InputState, ReactiveGameState } from '../game/types';
import { GameEngine } from '../game/engine';
import { renderGame } from '../game/renderer';
import { VIRTUAL_W, VIRTUAL_H, DIFFICULTY_STAGES } from '../game/constants';

const DEFAULT_REACTIVE: ReactiveGameState = {
  phase: 'playing',
  score: 0,
  lives: 3,
  combo: 0,
  bestCombo: 0,
  deliveries: 0,
  deliveryTimer: DIFFICULTY_STAGES[0].deliveryTimeLimit,
  timeElapsed: 0,
  currentStageIdx: 0,
  isCarrying: false,
  nearPickup: false,
  nearDelivery: false,
  countdownTimer: 0,
  activeChaosEvent: null,
};

export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  lang: string,
  activeSkinRef: React.RefObject<string>,
) {
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false,
    action: false, actionJustPressed: false,
    touchDx: 0, touchDy: 0,
  });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [reactive, setReactive] = useState<ReactiveGameState>(DEFAULT_REACTIVE);

  const lastNotifyRef = useRef<number>(0);
  const pendingNotifyRef = useRef<ReactiveGameState | null>(null);

  const handleStateChange = useCallback((s: ReactiveGameState) => {
    pendingNotifyRef.current = s;
  }, []);

  useEffect(() => {
    engineRef.current = new GameEngine(handleStateChange);
    return () => { engineRef.current = null; };
  }, [handleStateChange]);

  // Keep engine lang in sync with React lang state
  useEffect(() => {
    engineRef.current?.setLang(lang);
  }, [lang]);

  // Game loop — runs from mount; checks canvas each frame so it works
  // even when the canvas element mounts after the initial effect.
  useEffect(() => {
    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);

      const canvas = canvasRef.current;
      if (!engineRef.current || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const input = inputRef.current;
      engineRef.current.update(dt, input);
      input.actionJustPressed = false;

      const scale = Math.min(canvas.width / VIRTUAL_W, canvas.height / VIRTUAL_H);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderGame(ctx, engineRef.current.getState(), scale, activeSkinRef.current ?? 'classic');

      // Throttle React re-renders to ~20fps
      const now2 = Date.now();
      if (pendingNotifyRef.current && now2 - lastNotifyRef.current > 50) {
        setReactive({ ...pendingNotifyRef.current });
        lastNotifyRef.current = now2;
        pendingNotifyRef.current = null;
      }
    }

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restart = useCallback(() => {
    engineRef.current?.restart();
    setReactive(DEFAULT_REACTIVE);
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setReactive(prev => ({ ...prev, phase: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
    setReactive(prev => ({ ...prev, phase: 'playing' }));
  }, []);

  return { reactive, inputRef, restart, pause, resume };
}
