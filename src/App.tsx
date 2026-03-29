import { useRef, useState, useEffect, useCallback } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useKeyboard } from './hooks/useInput';
import { useLanguage } from './i18n/useLanguage';
import MainMenu from './components/screens/MainMenu';
import GameOverScreen from './components/screens/GameOverScreen';
import ShopScreen from './components/screens/ShopScreen';
import PauseMenu from './components/screens/PauseMenu';
import HUD from './components/ui/HUD';
import TouchControls from './components/ui/TouchControls';
import { VIRTUAL_W, VIRTUAL_H } from './game/constants';
import {
  loadTrophyData, saveTrophyData, calcTrophiesEarned,
  type TrophyData,
} from './game/skins';

type AppScreen = 'menu' | 'game' | 'shop';

function detectMobile(): boolean {
  return /Mobi|Android|iPhone|iPad|Touch/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    window.matchMedia('(pointer: coarse)').matches;
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [isMobile] = useState(detectMobile);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const activeSkinRef = useRef<string>('classic');
  const prevScreenRef = useRef<AppScreen>('menu');

  const [trophyData, setTrophyData] = useState<TrophyData>(loadTrophyData);

  // Keep activeSkinRef synced
  activeSkinRef.current = trophyData.activeSkin;

  const { lang } = useLanguage();
  const { reactive, inputRef, restart, pause, resume } = useGameEngine(canvasRef, lang, activeSkinRef);

  useKeyboard(inputRef);

  // Canvas sizing
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = VIRTUAL_W;
      canvas.height = VIRTUAL_H;
      // Use visualViewport when available for accurate dimensions (hides/shows mobile chrome)
      const vw = window.visualViewport?.width ?? window.innerWidth;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const scale = Math.min(vw / VIRTUAL_W, vh / VIRTUAL_H);
      const cw = VIRTUAL_W * scale;
      const ch = VIRTUAL_H * scale;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      // Keep overlay in sync so HUD/controls align exactly with the canvas
      if (overlayRef.current) {
        overlayRef.current.style.width = `${cw}px`;
        overlayRef.current.style.height = `${ch}px`;
      }
    }
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, []);

  // Pause / resume on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Escape' && screen === 'game') {
        if (reactive.phase === 'playing') pause();
        else if (reactive.phase === 'paused') resume();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, reactive.phase, pause, resume]);

  // Award trophies on game over
  const [trophiesEarned, setTrophiesEarned] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [trophiesAwarded, setTrophiesAwarded] = useState(false);

  useEffect(() => {
    if (reactive.phase === 'gameover' && !trophiesAwarded) {
      const earned = calcTrophiesEarned(reactive.score, reactive.timeElapsed, reactive.currentStageIdx);
      setTrophiesEarned(earned);

      setTrophyData(prev => {
        const newRecord = reactive.score > prev.highScore || reactive.timeElapsed > prev.bestTime;
        setIsNewRecord(newRecord);
        const updated: TrophyData = {
          ...prev,
          trophies: prev.trophies + earned,
          totalEarned: prev.totalEarned + earned,
          highScore: Math.max(prev.highScore, reactive.score),
          bestTime: Math.max(prev.bestTime, reactive.timeElapsed),
          gamesPlayed: prev.gamesPlayed + 1,
        };
        saveTrophyData(updated);
        return updated;
      });
      setTrophiesAwarded(true);
    }
    if (reactive.phase === 'playing') setTrophiesAwarded(false);
  }, [reactive.phase, reactive.score, reactive.timeElapsed, reactive.currentStageIdx, trophiesAwarded]);

  const handleStart = useCallback(() => {
    restart();
    setScreen('game');
  }, [restart]);

  const handleRestart = useCallback(() => {
    restart();
  }, [restart]);

  const handleMainMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleShop = useCallback(() => {
    prevScreenRef.current = screen;
    setScreen('shop');
  }, [screen]);

  const handleShopClose = useCallback(() => {
    setScreen(prevScreenRef.current === 'game' ? 'game' : 'menu');
  }, []);

  const inGame = screen === 'game';

  return (
    <div className="app">
      {screen === 'menu' && (
        <MainMenu onStart={handleStart} onShop={handleShop} trophyData={trophyData} />
      )}

      {screen === 'shop' && (
        <ShopScreen trophyData={trophyData} onUpdate={setTrophyData} onClose={handleShopClose} />
      )}

      {/* Canvas always present, hidden when off */}
      <div className="game-container" style={{ display: inGame ? 'flex' : 'none' }}>
        <canvas ref={canvasRef} className="game-canvas" width={VIRTUAL_W} height={VIRTUAL_H} />

        {/* Overlay div sized to match the canvas — HUD/controls align with the game world */}
        <div ref={overlayRef} className="game-overlay">
          {inGame && reactive.phase !== 'gameover' && (
            <HUD state={reactive} onPause={pause} isMobile={isMobile} />
          )}

          {inGame && isMobile && reactive.phase === 'playing' && (
            <TouchControls inputRef={inputRef} />
          )}

          {inGame && reactive.phase === 'paused' && (
            <PauseMenu onResume={resume} onRestart={handleRestart} onMainMenu={handleMainMenu} />
          )}

          {inGame && reactive.phase === 'gameover' && (
            <GameOverScreen
              score={reactive.score}
              deliveries={reactive.deliveries}
              bestCombo={reactive.bestCombo}
              timeElapsed={reactive.timeElapsed}
              bestStageIdx={reactive.currentStageIdx}
              trophiesEarned={trophiesEarned}
              isNewRecord={isNewRecord}
              onRestart={handleRestart}
              onMenu={handleMainMenu}
              onShop={handleShop}
            />
          )}
        </div>
      </div>

      {/* Portrait-mode prompt (CSS shows/hides via media query) */}
      <div className="rotate-prompt">
        <span style={{ fontSize: 56 }}>🔄</span>
        <p style={{ fontSize: 18, fontWeight: 800 }}>Gire o dispositivo</p>
        <p style={{ fontSize: 13, opacity: 0.55 }}>Este jogo é melhor em modo paisagem</p>
      </div>
    </div>
  );
}
