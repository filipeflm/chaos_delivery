import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { DIFFICULTY_STAGES } from '../../game/constants';

interface GameOverProps {
  score: number;
  deliveries: number;
  bestCombo: number;
  timeElapsed: number;
  bestStageIdx: number;
  trophiesEarned: number;
  isNewRecord: boolean;
  onRestart: () => void;
  onMenu: () => void;
  onShop: () => void;
}

export default function GameOverScreen({
  score, deliveries, bestCombo, timeElapsed, bestStageIdx,
  trophiesEarned, isNewRecord,
  onRestart, onMenu, onShop,
}: GameOverProps) {
  const { t, lang } = useLanguage();
  const stage = DIFFICULTY_STAGES[Math.min(bestStageIdx, DIFFICULTY_STAGES.length - 1)];
  const mins = Math.floor(timeElapsed / 60);
  const secs = Math.floor(timeElapsed % 60);
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const [trophyAnim, setTrophyAnim] = useState(0);
  useEffect(() => {
    let frame = 0;
    const max = trophiesEarned;
    const id = setInterval(() => {
      frame += Math.max(1, Math.floor(max / 40));
      setTrophyAnim(Math.min(frame, max));
      if (frame >= max) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [trophiesEarned]);

  return (
    <div className="gameover-screen">
      <div className="gameover-card">
        <div className="go-bang">💥</div>
        <h2 className="go-title">{t.gameOver}</h2>
        {isNewRecord && <div className="go-record">{t.newRecord}</div>}

        {/* Time (primary) */}
        <div className="go-primary">
          <div className="go-time-block">
            <span className="go-time-value">{timeStr}</span>
            <span className="go-time-label">{t.timeSurvived}</span>
          </div>
        </div>

        {/* Stage badge */}
        <div className="go-stage-badge" style={{ borderColor: stage.color, color: stage.color }}>
          {lang === 'pt' ? stage.labelPt : stage.label}
          <span className="go-stage-sub">{t.bestStage}</span>
        </div>

        {/* Stats grid */}
        <div className="go-stats-grid">
          <div className="go-stat">
            <span className="go-stat-value">{Math.floor(score).toLocaleString()}</span>
            <span className="go-stat-label">{t.score}</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-value">{deliveries}</span>
            <span className="go-stat-label">{t.deliveries}</span>
          </div>
          <div className="go-stat">
            <span className="go-stat-value">x{bestCombo}</span>
            <span className="go-stat-label">{t.bestCombo}</span>
          </div>
        </div>

        {/* Trophy reward */}
        <div className="go-trophy-reward">
          <span className="go-trophy-icon">🏅</span>
          <span className="go-trophy-count">+{trophyAnim}</span>
          <span className="go-trophy-label">{t.trophiesEarned}</span>
        </div>

        <div className="go-actions">
          <button className="btn-go-restart" onClick={onRestart}>
            🔄 {t.playAgain}
          </button>
          <button className="btn-go-shop" onClick={onShop}>
            🛒 {t.shop}
          </button>
          <button className="btn-go-menu" onClick={onMenu}>
            🏠 {t.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
