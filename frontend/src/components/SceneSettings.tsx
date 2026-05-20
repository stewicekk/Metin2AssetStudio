import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

export function SceneSettings() {
  const { t, locale, setLocale } = useT();
  const settings = useAppStore(s => s.settings);
  const setSettings = useAppStore(s => s.setSettings);
  const sceneBg = useAppStore(s => s.sceneBg);
  const setSceneBg = useAppStore(s => s.setSceneBg);
  const showGrid = useAppStore(s => s.showGrid);
  const setShowGrid = useAppStore(s => s.setShowGrid);
  const showAxis = useAppStore(s => s.showAxis);
  const setShowAxis = useAppStore(s => s.setShowAxis);
  const showChar = useAppStore(s => s.showChar);
  const setShowChar = useAppStore(s => s.setShowChar);
  const charSpin = useAppStore(s => s.charSpin);
  const setCharSpin = useAppStore(s => s.setCharSpin);
  const envBone = useAppStore(s => s.envBone);
  const setEnvBone = useAppStore(s => s.setEnvBone);
  const envFog = useAppStore(s => s.envFog);
  const setEnvFog = useAppStore(s => s.setEnvFog);
  const envFogDensity = useAppStore(s => s.envFogDensity);
  const setEnvFogDensity = useAppStore(s => s.setEnvFogDensity);
  const envAmbient = useAppStore(s => s.envAmbient);
  const setEnvAmbient = useAppStore(s => s.setEnvAmbient);
  const envFov = useAppStore(s => s.envFov);
  const setEnvFov = useAppStore(s => s.setEnvFov);
  const envBloom = useAppStore(s => s.envBloom);
  const setEnvBloom = useAppStore(s => s.setEnvBloom);
  const envFloor = useAppStore(s => s.envFloor);
  const setEnvFloor = useAppStore(s => s.setEnvFloor);

  const applyTheme = (theme: string) => {
    setSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const themeNames: Record<string, string> = {
    dark: t('set_dark'),
    neon: t('set_neon'),
    crimson: t('set_crimson'),
    emerald: t('set_emerald'),
    light: t('set_light'),
  };

  if (settings.theme == null) return null;

  return (
    <div className="scene-settings">
      <div className="section">
        <div className="sec-hdr open" data-sec="sc"><span>🌍 {t('tab_scene')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div className="row">
            <label className="lbl w80">{t('scene_bg')}</label>
            <input type="color" value={sceneBg} onChange={e => setSceneBg(e.target.value)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_grid')}</label>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            <label className="lbl" style={{ marginLeft: 5 }}>{t('scene_axis')}</label>
            <input type="checkbox" checked={showAxis} onChange={e => setShowAxis(e.target.checked)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_char')}</label>
            <input type="checkbox" checked={showChar} onChange={e => setShowChar(e.target.checked)} />
            <label className="lbl" style={{ marginLeft: 5 }}>{t('scene_spin')}</label>
            <input type="checkbox" checked={charSpin} onChange={e => setCharSpin(e.target.checked)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_bone')}</label>
            <select value={envBone} onChange={e => setEnvBone(e.target.value)} style={{ flex: 1 }}>
              <option value="root">{t('scene_bone_root')}</option>
              <option value="spine">{t('scene_bone_spine')}</option>
              <option value="rhand">{t('scene_bone_rhand')}</option>
              <option value="lhand">{t('scene_bone_lhand')}</option>
              <option value="head">{t('scene_bone_head')}</option>
              <option value="chest">{t('scene_bone_chest')}</option>
              <option value="rfoot">{t('scene_bone_rfoot')}</option>
              <option value="lfoot">{t('scene_bone_lfoot')}</option>
            </select>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_fog')}</label>
            <input type="checkbox" checked={envFog} onChange={e => setEnvFog(e.target.checked)} />
            <input type="range" min={0.001} max={0.15} step={0.001} value={envFogDensity}
              onChange={e => setEnvFogDensity(parseFloat(e.target.value))}
              className="flex1" style={{ marginLeft: 4 }} />
            <span style={{ fontSize: 9, color: 'var(--text3)', minWidth: 22 }}>
              {envFog ? envFogDensity.toFixed(3) : t('none')}
            </span>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_ambient')}</label>
            <input type="color" value={envAmbient} onChange={e => setEnvAmbient(e.target.value)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_fov')}</label>
            <input type="range" min={20} max={100} value={envFov}
              onChange={e => setEnvFov(parseInt(e.target.value))} className="flex1" />
            <span style={{ fontSize: 9, color: 'var(--text3)', minWidth: 24 }}>{envFov}°</span>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_bloom')}</label>
            <input type="checkbox" checked={envBloom} onChange={e => setEnvBloom(e.target.checked)} />
            <label className="lbl" style={{ marginLeft: 4, fontSize: 9, color: 'var(--text3)' }}>{t('scene_bloom_label')}</label>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_floor')}</label>
            <input type="checkbox" checked={envFloor} onChange={e => setEnvFloor(e.target.checked)} />
            <label className="lbl" style={{ marginLeft: 4, fontSize: 9, color: 'var(--text3)' }}>{t('scene_floor_label')}</label>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr open" data-sec="th"><span>🎨 {t('set_theme')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            {(['dark', 'neon', 'crimson', 'emerald', 'light'] as const).map(tm => (
              <div key={tm}
                className={'theme-tile' + (settings.theme === tm ? ' active' : '')}
                onClick={() => applyTheme(tm)}
                style={{
                  background: `linear-gradient(135deg, ${tm === 'dark' ? '#07090d 40%,#c89b3c' : tm === 'neon' ? '#020408 40%,#00d4ff' : tm === 'crimson' ? '#08020a 40%,#e03040' : tm === 'emerald' ? '#020a05 40%,#30c060' : '#f0f4f8 40%,#8060a0'} 100%)`,
                }}
                title={themeNames[tm]}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr open" data-sec="lng"><span>🌐 {t('set_language')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div style={{ display: 'flex', gap: 4 }}>
            <div className={'cqbtn' + (locale === 'en' ? ' active' : '')}
              onClick={() => { setLocale('en'); setSettings({ language: 'en' }); }}>{t('scene_lang_en')}</div>
            <div className={'cqbtn' + (locale === 'cs' ? ' active' : '')}
              onClick={() => { setLocale('cs'); setSettings({ language: 'cs' }); }}>{t('scene_lang_cs')}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr open" data-sec="ex"><span>⚙ {t('set_debug')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div className="toggle">
            <span className="toggle-lbl">{t('set_perf')}</span>
            <div className={'tsw' + (settings.showPerf ? ' on' : '')}
              onClick={() => setSettings({ showPerf: !settings.showPerf })} />
          </div>
          <div className="toggle">
            <span className="toggle-lbl">{t('set_debug')}</span>
            <div className={'tsw' + (settings.showDebug ? ' on' : '')}
              onClick={() => setSettings({ showDebug: !settings.showDebug })} />
          </div>
          <div className="toggle">
            <span className="toggle-lbl">{t('scene_particle_debug')}</span>
            <div className={'tsw' + (settings.particleDebug ? ' on' : '')}
              onClick={() => setSettings({ particleDebug: !settings.particleDebug })} />
          </div>
          <div className="toggle">
            <span className="toggle-lbl">{t('scene_auto_play')}</span>
            <div className={'tsw' + (settings.autoPlay ? ' on' : '')}
              onClick={() => setSettings({ autoPlay: !settings.autoPlay })} />
          </div>
          <div className="toggle">
            <span className="toggle-lbl">{t('scene_hi_prec')}</span>
            <div className={'tsw' + (settings.hiPrec ? ' on' : '')}
              onClick={() => setSettings({ hiPrec: !settings.hiPrec })} />
          </div>
          <div className="sep" />
          <div className="row">
            <label className="lbl w80">{t('set_precision')}</label>
            <select value={settings.exportPrec} onChange={e => setSettings({ exportPrec: parseInt(e.target.value) || 4 })}>
              <option value={4}>{t('scene_prec_4')}</option>
              <option value={6}>{t('scene_prec_6')}</option>
              <option value={2}>{t('scene_prec_2')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr" data-sec="sk"><span>{t('scene_shortcuts')}</span><span className="arr">▶</span></div>
        <div className="sec-body">
          <div style={{ fontSize: 9, color: 'var(--text3)', lineHeight: 1.8 }}>
            <b style={{ color: 'var(--text2)' }}>Space</b> {t('scene_shortcut_play')}<br />
            <b style={{ color: 'var(--text2)' }}>A</b> {t('scene_shortcut_autocycle')}<br />
            <b style={{ color: 'var(--text2)' }}>W</b> {t('scene_shortcut_fill')}<br />
            <b style={{ color: 'var(--text2)' }}>R</b> {t('scene_shortcut_reset')}<br />
            <b style={{ color: 'var(--text2)' }}>F1/F2/F3</b> {t('scene_shortcut_view')}<br />
            <b style={{ color: 'var(--text2)' }}>Ctrl+Z</b> {t('scene_shortcut_undo')}<br />
            <b style={{ color: 'var(--text2)' }}>Ctrl+Y/Shift+Z</b> {t('scene_shortcut_redo')}<br />
            <b style={{ color: 'var(--text2)' }}>Ctrl+D</b> {t('scene_shortcut_dup')}<br />
            <b style={{ color: 'var(--text2)' }}>Ctrl+S</b> {t('scene_shortcut_save')}<br />
            <b style={{ color: 'var(--text2)' }}>Ctrl+C</b> {t('scene_shortcut_copy')}<br />
            <b style={{ color: 'var(--text2)' }}>Ctrl+V</b> {t('scene_shortcut_paste')}<br />
            <b style={{ color: 'var(--text2)' }}>Delete</b> {t('scene_shortcut_delete')}<br />
            <b style={{ color: 'var(--text2)' }}>RMB drag</b> {t('scene_shortcut_orbit')}<br />
            <b style={{ color: 'var(--text2)' }}>MMB drag</b> {t('scene_shortcut_pan')}<br />
            <b style={{ color: 'var(--text2)' }}>Scroll</b> {t('scene_shortcut_zoom')}
          </div>
        </div>
      </div>
    </div>
  );
}
