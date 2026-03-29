import { useLanguage } from '../../i18n/useLanguage';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function PauseMenu({ onResume, onRestart, onMainMenu }: PauseMenuProps) {
  const { t } = useLanguage();

  return (
    <div className="overlay-screen pause-screen">
      <div className="overlay-card pause-card">
        <div className="pause-icon">⏸️</div>
        <h2 className="overlay-title">{t.paused}</h2>
        <div className="overlay-buttons">
          <button className="btn-start" onClick={onResume}>
            ▶️ {t.resume}
          </button>
          <button className="btn-secondary" onClick={onRestart}>
            🔄 {t.restart}
          </button>
          <button className="btn-secondary" onClick={onMainMenu}>
            🏠 {t.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
