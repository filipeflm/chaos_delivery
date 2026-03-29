import { useLanguage } from '../../i18n/useLanguage';
import type { ReactiveGameState } from '../../game/types';
import { DIFFICULTY_STAGES } from '../../game/constants';
import { audioManager } from '../../game/audio';
import { useState, useEffect, useRef } from 'react';

interface HUDProps {
  state: ReactiveGameState;
  onPause: () => void;
  isMobile: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

// Stage durations used to proportionally size each segment of the progress bar.
// Last stage is open-ended; assign 30s as a visual placeholder.
const STAGE_DURATIONS = DIFFICULTY_STAGES.map((s, i) => {
  const next = DIFFICULTY_STAGES[i + 1];
  return next ? next.timeThreshold - s.timeThreshold : 30;
});

export default function HUD({ state, onPause, isMobile }: HUDProps) {
  const { t, lang } = useLanguage();
  const {
    score, lives, deliveries, deliveryTimer,
    combo, timeElapsed, currentStageIdx, nearPickup, nearDelivery,
  } = state;

  const [muted, setMuted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);
  const prevStageRef = useRef(currentStageIdx);

  function handleMute() {
    const newMuted = audioManager.toggle();
    setMuted(newMuted);
  }

  // Show level-up banner whenever currentStageIdx advances
  useEffect(() => {
    if (currentStageIdx > prevStageRef.current) {
      setBannerKey(k => k + 1);
      setBannerVisible(true);
      const tid = setTimeout(() => setBannerVisible(false), 2800);
      prevStageRef.current = currentStageIdx;
      return () => clearTimeout(tid);
    }
    prevStageRef.current = currentStageIdx;
  }, [currentStageIdx]);

  const stage = DIFFICULTY_STAGES[currentStageIdx];
  const nextStage = DIFFICULTY_STAGES[currentStageIdx + 1];
  const stageLabel = lang === 'pt' ? stage.labelPt : stage.label;
  const nextLabel = nextStage ? (lang === 'pt' ? nextStage.labelPt : nextStage.label) : null;

  const deliveryRatio = Math.max(0, deliveryTimer / stage.deliveryTimeLimit);
  const timerColor = deliveryRatio > 0.5 ? '#4ade80' : deliveryRatio > 0.25 ? '#fbbf24' : '#ef4444';
  const timerPulse = deliveryRatio < 0.25;

  const hearts = Array.from({ length: 3 }, (_, i) => i < lives ? '❤️' : '🖤');

  const timeToNextStage = nextStage ? nextStage.timeThreshold - timeElapsed : null;
  const stagePct = nextStage
    ? 1 - Math.max(0, timeToNextStage!) / (nextStage.timeThreshold - stage.timeThreshold)
    : 1;

  return (
    <div className="hud">

      {/* ── Level-up banner (animated, above everything) ─────────────────── */}
      {bannerVisible && (
        <div key={bannerKey} className="levelup-banner">
          <div className="levelup-bg" style={{ background: stage.color }} />
          <div className="levelup-inner">
            <span className="levelup-eyebrow">
              {lang === 'pt' ? '⚡ DIFICULDADE AUMENTOU!' : '⚡ DIFFICULTY INCREASED!'}
            </span>
            <span
              className="levelup-stage-name"
              style={{ color: stage.color, textShadow: `0 0 40px ${stage.color}, 0 0 80px ${stage.color}` }}
            >
              {stageLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="hud-bar hud-top">
        <div className="hud-section hud-lives">
          {hearts.map((h, i) => <span key={i} className="heart">{h}</span>)}
        </div>

        <div className="hud-section hud-score">
          <span className="hud-label">{t.score}</span>
          <span className="hud-value score-display">{Math.floor(score).toLocaleString()}</span>
        </div>

        {combo > 1 && (
          <div className="hud-section hud-combo">
            <span className="combo-badge">x{combo}</span>
          </div>
        )}

        <div className="hud-section hud-time-alive">
          <span className="hud-label">⏱</span>
          <span className="hud-value time-value">{formatTime(timeElapsed)}</span>
        </div>

        <button className="hud-pause-btn" onClick={onPause} aria-label="Pause">⏸</button>
        <button className="hud-mute-btn" onClick={handleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* ── Delivery timer bar ────────────────────────────────────────────── */}
      <div className="hud-timer-row">
        <div className="timer-bar-bg">
          <div
            className={`timer-bar-fill${timerPulse ? ' pulse' : ''}`}
            style={{ width: `${deliveryRatio * 100}%`, background: timerColor }}
          />
        </div>
        <span className={`timer-text${timerPulse ? ' pulse' : ''}`} style={{ color: timerColor }}>
          {Math.max(0, Math.ceil(deliveryTimer))}s
        </span>
      </div>

      {/* ── Segmented stage progress bar ──────────────────────────────────── */}
      <div className="stage-track-section">
        {/* Five colored segments — proportional to each stage's duration */}
        <div className="stage-track-bar">
          {DIFFICULTY_STAGES.map((s, i) => {
            let fillPct = 0;
            if (i < currentStageIdx) fillPct = 100;
            else if (i === currentStageIdx) fillPct = Math.min(stagePct * 100, 100);

            return (
              <div
                key={i}
                className={`stage-seg${
                  i < currentStageIdx ? ' seg-done'
                  : i === currentStageIdx ? ' seg-active'
                  : ' seg-future'
                }`}
                style={{ flex: STAGE_DURATIONS[i], '--c': s.color } as React.CSSProperties}
              >
                <div className="stage-seg-fill" style={{ width: `${fillPct}%` }} />
                {/* Pulsing glow edge on active segment */}
                {i === currentStageIdx && <div className="stage-seg-edge" />}
              </div>
            );
          })}
        </div>

        {/* Info line: current stage | level counter | deliveries | next stage */}
        <div className="stage-info-line">
          <span className="stage-name-now" style={{ color: stage.color }}>{stageLabel}</span>
          <span className="stage-level-pip">{currentStageIdx + 1} / {DIFFICULTY_STAGES.length}</span>
          <span className="stage-deliveries-count">📦 {deliveries}</span>
          {nextStage ? (
            <span className="stage-next-v2" style={{ color: nextStage.color }}>
              → {nextLabel} <strong>{Math.max(0, Math.ceil(timeToNextStage!))}s</strong>
            </span>
          ) : (
            <span className="stage-next-v2" style={{ color: stage.color }}>
              ⚠️ {lang === 'pt' ? 'MÁXIMO' : 'MAX'}
            </span>
          )}
        </div>
      </div>

      {/* ── Action prompt ─────────────────────────────────────────────────── */}
      {(nearPickup || nearDelivery) && (
        <div className="action-prompt">
          {nearPickup && <span>✅ {isMobile ? t.tapToPickup : t.pressToPickup}</span>}
          {nearDelivery && <span>🎯 {isMobile ? t.tapToDeliver : t.pressToDeliver}</span>}
        </div>
      )}
    </div>
  );
}
