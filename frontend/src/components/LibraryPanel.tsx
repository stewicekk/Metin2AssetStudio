import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

const LIBRARY_PACKS = [
  { name: 'Fireball (FX)', desc: 'Classic fire projectile', emitters: [{ name: 'FireBall_Main', blend: 'add', shape: 'sphere', rate: 80, life: 0.8, speed: 6, spread: 15, sizeX: 1.2, builtinTex: 'flame', gravity: 0, colorKeys: [{ t: 0, r: 1, g: 0.6, b: 0.1, a: 1 }, { t: 0.6, r: 1, g: 0.3, b: 0.05, a: 0.8 }, { t: 1, r: 0.2, g: 0.05, b: 0, a: 0 }] }] },
  { name: 'Explosion', desc: 'Burst explosion effect', emitters: [{ name: 'Explosion', blend: 'add', shape: 'sphere', rate: 0, burst: 60, life: 0.7, speed: 8, spread: 180, sizeX: 0.8, builtinTex: 'spark', gravity: -3, sizeCurve: [{ t: 0, v: 0.2 }, { t: 0.3, v: 1.5 }, { t: 1, v: 0.1 }], colorKeys: [{ t: 0, r: 1, g: 0.9, b: 0.6, a: 1 }, { t: 0.5, r: 1, g: 0.3, b: 0, a: 0.7 }, { t: 1, r: 0.3, g: 0.1, b: 0, a: 0 }] }] },
  { name: 'Heal (Holy)', desc: 'Golden holy heal glow', emitters: [{ name: 'Heal', blend: 'add', shape: 'sphere', rate: 40, life: 1.0, speed: 2, spread: 60, sizeX: 0.6, builtinTex: 'softglow', gravity: -2, dirPitch: 90, colorKeys: [{ t: 0, r: 1, g: 0.9, b: 0.4, a: 1 }, { t: 0.5, r: 1, g: 0.8, b: 0.2, a: 0.6 }, { t: 1, r: 0.8, g: 0.6, b: 0, a: 0 }] }] },
  { name: 'Ice Shards', desc: 'Frozen ice projectile', emitters: [{ name: 'Ice', blend: 'alpha', shape: 'cone', rate: 30, life: 1.5, speed: 5, spread: 10, sizeX: 0.7, builtinTex: 'diamond', gravity: -2, colorKeys: [{ t: 0, r: 0.5, g: 0.7, b: 1, a: 1 }, { t: 0.5, r: 0.3, g: 0.6, b: 1, a: 0.7 }, { t: 1, r: 0.1, g: 0.2, b: 0.5, a: 0 }] }] },
  { name: 'Poison Cloud', desc: 'Green poison gas cloud', emitters: [{ name: 'Poison', blend: 'alpha', shape: 'spherevol', rate: 20, life: 2.0, speed: 1, spread: 360, sizeX: 1.5, builtinTex: 'smoke', gravity: 1, dirPitch: 0, sizeCurve: [{ t: 0, v: 0.3 }, { t: 1, v: 1.5 }], colorKeys: [{ t: 0, r: 0.1, g: 0.8, b: 0.2, a: 0.6 }, { t: 0.5, r: 0.2, g: 0.5, b: 0.1, a: 0.3 }, { t: 1, r: 0, g: 0.2, b: 0, a: 0 }] }] },
  { name: 'Lightning Arc', desc: 'Electric arc discharge', emitters: [{ name: 'Arc', blend: 'add', shape: 'point', rate: 100, life: 0.3, speed: 0, spread: 0, sizeX: 0.4, builtinTex: 'spark', gravity: 0, dirPitch: 0, colorKeys: [{ t: 0, r: 0.6, g: 0.8, b: 1, a: 1 }, { t: 0.5, r: 0.3, g: 0.5, b: 1, a: 0.8 }, { t: 1, r: 0.1, g: 0.1, b: 0.3, a: 0 }] }] },
  { name: 'Magic Shield', desc: 'Defensive bubble shield', emitters: [{ name: 'Shield', blend: 'add', shape: 'sphere', rate: 120, life: 0.6, speed: 0.5, spread: 180, sizeX: 0.5, builtinTex: 'hexagon', gravity: 0, dirPitch: 0, colorKeys: [{ t: 0, r: 0.3, g: 0.5, b: 1, a: 0.5 }, { t: 0.5, r: 0.5, g: 0.8, b: 1, a: 0.3 }, { t: 1, r: 0.1, g: 0.2, b: 0.5, a: 0 }] }] },
  { name: 'Blood Splash', desc: 'Crimson blood spray', emitters: [{ name: 'Blood', blend: 'alpha', shape: 'disc', rate: 50, life: 0.8, speed: 4, spread: 90, sizeX: 0.3, builtinTex: 'debris', gravity: -8, sizeRnd: 0.3, colorKeys: [{ t: 0, r: 0.8, g: 0.05, b: 0.05, a: 1 }, { t: 0.5, r: 0.5, g: 0.02, b: 0.02, a: 0.5 }, { t: 1, r: 0.2, g: 0, b: 0, a: 0 }] }] },
  { name: 'Dark Aura', desc: 'Shadow dark aura', emitters: [{ name: 'Aura', blend: 'alpha', shape: 'ring', rate: 30, life: 1.5, speed: 0.3, spread: 0, sizeX: 0.8, builtinTex: 'ring', gravity: 0, dirPitch: 90, colorKeys: [{ t: 0, r: 0.3, g: 0.05, b: 0.3, a: 0.4 }, { t: 0.5, r: 0.2, g: 0.02, b: 0.2, a: 0.2 }, { t: 1, r: 0.1, g: 0, b: 0.1, a: 0 }] }] },
  { name: 'Spark Trail', desc: 'Trailing sparkles', emitters: [{ name: 'Trail', blend: 'add', shape: 'point', rate: 200, life: 0.4, speed: 0, spread: 5, sizeX: 0.2, builtinTex: 'star', gravity: 0, dirPitch: 0, colorKeys: [{ t: 0, r: 1, g: 0.8, b: 0.2, a: 0.8 }, { t: 0.5, r: 0.8, g: 0.4, b: 0, a: 0.4 }, { t: 1, r: 0.3, g: 0.1, b: 0, a: 0 }] }] },
];

export function LibraryPanel() {
  const { t } = useT();
  const addEmitterFromTemplate = useAppStore(s => s.addEmitterFromTemplate);

  return (
    <div className="presets-panel">
      <div className="hint" style={{ marginBottom: 5 }}>{t('lib_hint')}</div>
      <div className="preset-grid">
        {LIBRARY_PACKS.map((pack, idx) => (
          <button key={idx} className="pbtn"
            onClick={() => {
              pack.emitters.forEach((em, ei) => {
                const name = em.name ? `${pack.name}_${em.name}` : `${pack.name}_${ei}`;
                addEmitterFromTemplate(name, em as any);
              });
            }}
          >
            <span className="picon">📦</span>
            <span className="pname">{pack.name}</span>
            <span className="pdesc">{pack.desc}</span>
            <span className="ptip">
              <div className="ptip-row"><span>{t('lib_emitter')}</span><span>{pack.emitters.length}</span></div>
              <div className="ptip-row"><span>{t('lib_blend')}</span><span>{pack.emitters[0].blend}</span></div>
              <div className="ptip-row"><span>{t('lib_shape')}</span><span>{pack.emitters[0].shape}</span></div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
