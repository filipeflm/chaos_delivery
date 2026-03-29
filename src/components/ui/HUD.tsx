import { useLanguage } from '../../i18n/useLanguage';
import type { ReactiveGameState } from '../../game/types';
import { DIFFICULTY_STAGES } from '../../game/constants';

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

export default function HUD({ state, onPause, isMobile }: HUDProps) {
  const { t, lang } = useLanguage();
  const { score, lives, deliveries, deliveryTimer, combo, timeElapsed, currentStageIdx, nearPickup, nearDelivery } = state;

  const stage = DIFFICULTY_STAGES[currentStageIdx];
  const nextStage = DIFFICULTY_STAGES[currentStageIdx + 1];
  const stageLabel = lang === 'pt' ? stage.labelPt : stage.label;

  const deliveryRatio = Math.max(0, deliveryTimer / stage.deliveryTimeLimit);
  const timerColor = deliveryRatio > 0.5 ? '#4ade80' : deliveryRatio > 0.25 ? '#fbbf24' : '#ef4444';
  const timerPulse = deliveryRatio < 0.25;

  const hearts = Array.from({ length: 3 }, (_, i) => i < lives ? '❤️' : '🖤');

  // Time until next stage
  const timeToNextStage = nextStage ? nextStage.timeThreshold - timeElapsed : null;
  const stagePct = nextStage
    ? 1 - Math.max(0, timeToNextStage!) / (nextStage.timeThreshold - stage.timeThreshold)
    : 1;

  return (
    <div className="hud">
      {/* Top bar */}
      <div className="hud-bar hud-top">
        {/* Lives */}
        <div className="hud-section hud-lives">
          {hearts.map((h, i) => <span key={i} className="heart">{h}</span>)}
        </div>

        {/* Score */}
        <div className="hud-section hud-score">
          <span className="hud-label">{t.score}</span>
          <span className="hud-value score-display">{Math.floor(score).toLocaleString()}</span>
        </div>

        {/* Combo */}
        {combo > 1 && (
          <div className="hud-section hud-combo">
            <span className="combo-badge">x{combo}</span>
          </div>
        )}

        {/* Time alive — main metric */}
        <div className="hud-section hud-time-alive">
          <span className="hud-label">⏱</span>
          <span className="hud-value time-value">{formatTime(timeElapsed)}</span>
        </div>

        <button className="hud-pause-btn" onClick={onPause} aria-label="Pause">⏸</button>
      </div>

      {/* Delivery timer bar */}
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

      {/* Stage / difficulty indicator with progress to next stage */}
      <div className="hud-stage-row">
        <span className="stage-badge" style={{ color: stage.color, borderColor: stage.color }}>
          {stageLabel}
        </span>
        {nextStage && (
          <div className="stage-progress">
            <div className="stage-prog-fill" style={{ width: `${stagePct * 100}%`, background: stage.color }} />
          </div>
        )}
        {nextStage && (
          <span className="stage-next-hint" style={{ color: stage.color }}>
            {Math.max(0, Math.ceil(timeToNextStage!))}{lang === 'pt' ? 's' : 's'}
          </span>
        )}
      </div>

      {/* Deliveries counter */}
      <div className="hud-deliveries">
        <span>📦 {t.deliveries}: {deliveries}</span>
      </div>

      {/* Action prompt */}
      {(nearPickup || nearDelivery) && (
        <div className="action-prompt">
          {nearPickup && <span>✅ {isMobile ? t.tapToPickup : t.pressToPickup}</span>}
          {nearDelivery && <span>🎯 {isMobile ? t.tapToDeliver : t.pressToDeliver}</span>}
        </div>
      )}
    </div>
  );
}
