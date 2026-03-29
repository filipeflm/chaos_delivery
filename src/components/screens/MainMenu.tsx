import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import type { TrophyData } from '../../game/skins';

interface MainMenuProps {
  onStart: () => void;
  onShop: () => void;
  trophyData: TrophyData;
}

export default function MainMenu({ onStart, onShop, trophyData }: MainMenuProps) {
  const { t, lang, setLang } = useLanguage();
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="menu-screen">
      <div className="menu-bg" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="bg-building" style={{
            left: `${(i * 7.3) % 100}%`,
            height: `${55 + (i * 23) % 90}px`,
            width: `${28 + (i * 17) % 44}px`,
            animationDelay: `${(i * 0.4) % 2.5}s`,
            background: ['#1e3a5f','#2a4a6f','#1a3355','#243b5a','#2d4f70','#162440'][i % 6],
          }} />
        ))}
        <div className="bg-road horizontal" style={{ bottom: '22%' }} />
        <div className="bg-road vertical" style={{ left: '28%' }} />
        <div className="bg-road vertical" style={{ left: '70%' }} />
      </div>

      <div className="menu-content">
        <div className="menu-header">
          <div className="title-emoji">📦</div>
          <h1 className="game-title">{t.title}</h1>
          <p className="game-tagline">{t.tagline}</p>
        </div>

        {/* Language + trophy bar */}
        <div className="menu-top-bar">
          <div className="lang-selector">
            <span className="lang-label">{t.language}:</span>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
              🇺🇸 EN
            </button>
            <button className={`lang-btn ${lang === 'pt' ? 'active' : ''}`} onClick={() => setLang('pt')}>
              🇧🇷 PT
            </button>
          </div>
          <div className="menu-trophies">
            <span>🏅</span>
            <span className="mt-value">{trophyData.trophies}</span>
          </div>
        </div>

        {/* Stats row */}
        {trophyData.gamesPlayed > 0 && (
          <div className="menu-stats-row">
            <span>🏆 {t.highScore}: <b>{Math.floor(trophyData.highScore).toLocaleString()}</b></span>
            <span>⏱ {t.bestTime}: <b>{Math.floor(trophyData.bestTime)}s</b></span>
            <span>🎮 {trophyData.gamesPlayed}</span>
          </div>
        )}

        <button className="btn-start" onClick={onStart}>
          <span className="btn-start-icon">🚀</span>
          {t.startGame}
        </button>

        <div className="menu-secondary-btns">
          <button className="btn-shop" onClick={onShop}>
            🛒 {t.shop}
          </button>
          <button className="btn-secondary btn-how" onClick={() => setShowInstructions(v => !v)}>
            {showInstructions ? '▲' : '▼'} {t.howToPlay}
          </button>
        </div>

        {showInstructions && (
          <div className="instructions-panel">
            <ul className="instructions-list">
              {t.instructions.map((line, i) => (
                <li key={i}>
                  <span className="instr-icon">{['📦', '🎯', '🚗', '⚡'][i]}</span>
                  {line}
                </li>
              ))}
            </ul>
            <div className="controls-section">
              <h3>{t.controls}</h3>
              <p>🖥️ {t.controlsDesktop}</p>
              <p>📱 {t.controlsMobile}</p>
            </div>
          </div>
        )}

        <div className="menu-cars" aria-hidden="true">
          <div className="menu-car car-red">🚗</div>
          <div className="menu-car car-blue">🚙</div>
        </div>
      </div>
    </div>
  );
}
