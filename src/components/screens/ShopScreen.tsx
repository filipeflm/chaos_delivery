import { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import type { TrophyData } from '../../game/skins';
import { SKINS, getSkin, buySkin, setActiveSkin, saveTrophyData } from '../../game/skins';
import { SkinPreviewCanvas } from '../ui/SkinPreviewCanvas';

interface ShopProps {
  trophyData: TrophyData;
  onUpdate: (data: TrophyData) => void;
  onClose: () => void;
}

export default function ShopScreen({ trophyData, onUpdate, onClose }: ShopProps) {
  const { t, lang } = useLanguage();
  const [selectedId, setSelectedId]     = useState(trophyData.activeSkin);
  const [confirmSkin, setConfirmSkin]   = useState<string | null>(null);
  const [flashKey, setFlashKey]         = useState(0);   // bumped to replay CSS anim
  const [flashMsg, setFlashMsg]         = useState('');  // '' = hidden

  const featured  = getSkin(selectedId);
  const owned     = trophyData.unlockedSkins.includes(selectedId);
  const active    = trophyData.activeSkin === selectedId;
  const canAfford = trophyData.trophies >= featured.cost;
  const isConfirm = confirmSkin === selectedId;

  function handleSelect(id: string) {
    setSelectedId(id);
    setConfirmSkin(null);
  }

  function handleBuy() {
    if (!isConfirm) { setConfirmSkin(selectedId); return; }
    const updated = buySkin(trophyData, selectedId);
    if (updated) {
      saveTrophyData(updated);
      onUpdate(updated);
      triggerEquipFlash(lang === 'pt' ? '🎉 DESBLOQUEADO!' : '🎉 UNLOCKED!');
    }
    setConfirmSkin(null);
  }

  function handleEquip() {
    const updated = setActiveSkin(trophyData, selectedId);
    saveTrophyData(updated);
    onUpdate(updated);
    triggerEquipFlash(lang === 'pt' ? '✅ EQUIPADO!' : '✅ EQUIPPED!');
  }

  function triggerEquipFlash(msg: string) {
    setFlashMsg(msg);
    setFlashKey(k => k + 1);
    setTimeout(() => setFlashMsg(''), 1300);
  }

  return (
    <div className="shop-screen">
      <div className="shop-card">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="shop-header">
          <button className="shop-back-btn" onClick={onClose}>← {t.back}</button>
          <h2 className="shop-title">🛒 {t.shop}</h2>
          <div className="trophy-balance">
            <span className="tb-icon">🏅</span>
            <span className="tb-value">{trophyData.trophies}</span>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
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

        {/* ── Featured preview ───────────────────────────────────────── */}
        <div
          className={`shop-featured${active ? ' shop-featured-active' : ''}`}
          style={{ '--featured-color': featured.glowColor } as React.CSSProperties}
        >
          {/* Animated canvas preview */}
          <div className="shop-featured-canvas">
            <SkinPreviewCanvas skin={featured} size={120} />
            {/* Equip flash overlay */}
            {flashMsg && (
              <div key={flashKey} className="shop-equip-flash">
                {flashMsg}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="shop-featured-info">
            <div className="shop-featured-emoji">{featured.emoji}</div>
            <div
              className="shop-featured-name"
              style={{ color: featured.glowColor }}
            >
              {lang === 'pt' ? featured.namePt : featured.nameEn}
            </div>
            <div className="shop-featured-desc">
              "{lang === 'pt' ? featured.descPt : featured.descEn}"
            </div>

            {/* Action button */}
            <div className="shop-featured-action">
              {active ? (
                <div className="shop-badge-equipped">✅ {t.equipped}</div>
              ) : owned ? (
                <button className="shop-action-btn shop-btn-equip" onClick={handleEquip}>
                  👕 {t.equip}
                </button>
              ) : (
                <button
                  className={`shop-action-btn ${
                    isConfirm ? 'shop-btn-confirm'
                    : canAfford ? 'shop-btn-buy'
                    : 'shop-btn-locked'
                  }`}
                  onClick={canAfford ? handleBuy : undefined}
                  disabled={!canAfford}
                  onBlur={() => setConfirmSkin(null)}
                >
                  {isConfirm
                    ? `✓ ${t.confirm}?`
                    : <><span>🏅 {featured.cost}</span> <span>{lang === 'pt' ? 'Comprar' : 'Buy'}</span></>
                  }
                </button>
              )}
              {!canAfford && !owned && (
                <div className="shop-afford-hint">
                  🏅 {featured.cost - trophyData.trophies} {lang === 'pt' ? 'ainda faltam' : 'more needed'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Skin selector grid ─────────────────────────────────────── */}
        <div className="shop-skin-grid">
          {SKINS.map(skin => {
            const isOwned  = trophyData.unlockedSkins.includes(skin.id);
            const isActive = trophyData.activeSkin === skin.id;
            const isSelected = selectedId === skin.id;
            const affordable = trophyData.trophies >= skin.cost;

            return (
              <button
                key={skin.id}
                className={`shop-skin-thumb${isSelected ? ' thumb-selected' : ''}${isActive ? ' thumb-active' : ''}${!isOwned ? ' thumb-locked' : ''}`}
                style={{ '--thumb-color': skin.glowColor } as React.CSSProperties}
                onClick={() => handleSelect(skin.id)}
                title={lang === 'pt' ? skin.namePt : skin.nameEn}
              >
                <SkinPreviewCanvas skin={skin} size={60} />
                <span className="thumb-emoji">{skin.emoji}</span>
                {isActive && <span className="thumb-badge-active">✅</span>}
                {!isOwned && (
                  <span className={`thumb-cost${affordable ? ' thumb-affordable' : ''}`}>
                    🏅{skin.cost}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="shop-hint">{t.shopHint}</p>
      </div>
    </div>
  );
}
