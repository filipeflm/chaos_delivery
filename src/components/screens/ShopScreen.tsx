import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import type { TrophyData } from '../../game/skins';
import { SKINS, buySkin, setActiveSkin, saveTrophyData } from '../../game/skins';

interface ShopProps {
  trophyData: TrophyData;
  onUpdate: (data: TrophyData) => void;
  onClose: () => void;
}

export default function ShopScreen({ trophyData, onUpdate, onClose }: ShopProps) {
  const { t, lang } = useLanguage();
  const [confirmSkin, setConfirmSkin] = useState<string | null>(null);

  function handleBuy(skinId: string) {
    if (confirmSkin !== skinId) { setConfirmSkin(skinId); return; }
    const updated = buySkin(trophyData, skinId);
    if (updated) {
      saveTrophyData(updated);
      onUpdate(updated);
    }
    setConfirmSkin(null);
  }

  function handleEquip(skinId: string) {
    const updated = setActiveSkin(trophyData, skinId);
    saveTrophyData(updated);
    onUpdate(updated);
  }

  return (
    <div className="shop-screen">
      <div className="shop-card">
        {/* Header */}
        <div className="shop-header">
          <button className="shop-back-btn" onClick={onClose}>← {t.back}</button>
          <h2 className="shop-title">🛒 {t.shop}</h2>
          <div className="trophy-balance">
            <span className="tb-icon">🏅</span>
            <span className="tb-value">{trophyData.trophies}</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="shop-stats">
          <div className="ss-item">
            <span>🏆</span>
            <span>{t.totalEarned}: <b>{trophyData.totalEarned}</b></span>
          </div>
          <div className="ss-item">
            <span>⏱</span>
            <span>{t.bestTime}: <b>{Math.floor(trophyData.bestTime)}s</b></span>
          </div>
          <div className="ss-item">
            <span>🎮</span>
            <span>{t.gamesPlayed}: <b>{trophyData.gamesPlayed}</b></span>
          </div>
        </div>

        {/* Skin grid */}
        <div className="skin-grid">
          {SKINS.map(skin => {
            const owned = trophyData.unlockedSkins.includes(skin.id);
            const active = trophyData.activeSkin === skin.id;
            const canAfford = trophyData.trophies >= skin.cost;
            const isConfirming = confirmSkin === skin.id;

            return (
              <div
                key={skin.id}
                className={`skin-card ${active ? 'skin-active' : ''} ${owned ? 'skin-owned' : ''}`}
                style={{ '--skin-color': skin.bodyColor, '--skin-glow': skin.glowColor } as React.CSSProperties}
              >
                {/* Mini character preview */}
                <div className="skin-preview">
                  <div className="sp-body" style={{ background: skin.bodyColor }}>
                    <div className="sp-head" style={{ background: skin.headColor }}>
                      <div className="sp-cap" style={{ background: skin.capColor }} />
                    </div>
                  </div>
                  <div className="sp-emoji">{skin.emoji}</div>
                </div>

                <div className="skin-info">
                  <span className="skin-name">{lang === 'pt' ? skin.namePt : skin.nameEn}</span>
                  <span className="skin-desc">{lang === 'pt' ? skin.descPt : skin.descEn}</span>
                </div>

                {active ? (
                  <div className="skin-equipped-badge">✅ {t.equipped}</div>
                ) : owned ? (
                  <button className="skin-btn skin-btn-equip" onClick={() => handleEquip(skin.id)}>
                    {t.equip}
                  </button>
                ) : (
                  <button
                    className={`skin-btn ${isConfirming ? 'skin-btn-confirm' : canAfford ? 'skin-btn-buy' : 'skin-btn-locked'}`}
                    onClick={() => canAfford && handleBuy(skin.id)}
                    disabled={!canAfford}
                    onBlur={() => setConfirmSkin(null)}
                  >
                    {isConfirming
                      ? `✓ ${t.confirm}?`
                      : <>🏅 {skin.cost}</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="shop-hint">{t.shopHint}</p>
      </div>
    </div>
  );
}
