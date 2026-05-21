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
  const gizmoEnabled = useAppStore(s => s.gizmoEnabled);
  const setGizmoEnabled = useAppStore(s => s.setGizmoEnabled);
  const gizmoMode = useAppStore(s => s.gizmoMode);
  const setGizmoMode = useAppStore(s => s.setGizmoMode);
  const gizmoTarget = useAppStore(s => s.gizmoTarget);
  const setGizmoTarget = useAppStore(s => s.setGizmoTarget);

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

  const themeGradients: Record<string, string> = {
    dark: 'linear-gradient(135deg, #07090d 40%, #c89b3c 100%)',
    neon: 'linear-gradient(135deg, #020408 40%, #00d4ff 100%)',
    crimson: 'linear-gradient(135deg, #08020a 40%, #e03040 100%)',
    emerald: 'linear-gradient(135deg, #020a05 40%, #30c060 100%)',
    light: 'linear-gradient(135deg, #f0f4f8 40%, #8060a0 100%)',
  };

  if (settings.theme == null) return null;

  return (
    <div className="scene-settings">
      <div className="section">
        <div className="sec-hdr open"><span>🌍 {t('tab_scene')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div className="row">
            <label className="lbl w80">{t('scene_bg')}</label>
            <input type="color" value={sceneBg} onChange={e => setSceneBg(e.target.value)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_grid')}</label>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            <label className="lbl">{t('scene_axis')}</label>
            <input type="checkbox" checked={showAxis} onChange={e => setShowAxis(e.target.checked)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_char')}</label>
            <input type="checkbox" checked={showChar} onChange={e => setShowChar(e.target.checked)} />
            <label className="lbl">{t('scene_spin')}</label>
            <input type="checkbox" checked={charSpin} onChange={e => setCharSpin(e.target.checked)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_bone')}</label>
            <select value={envBone} onChange={e => setEnvBone(e.target.value)}>
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
              onChange={e => setEnvFogDensity(parseFloat(e.target.value))} className="flex1" />
            <span className="n40 mono ta-r">{envFog ? envFogDensity.toFixed(3) : t('none')}</span>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_ambient')}</label>
            <input type="color" value={envAmbient} onChange={e => setEnvAmbient(e.target.value)} />
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_fov')}</label>
            <input type="range" min={20} max={100} value={envFov}
              onChange={e => setEnvFov(parseInt(e.target.value))} className="flex1" />
            <span className="n40 mono ta-r">{envFov}°</span>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_bloom')}</label>
            <input type="checkbox" checked={envBloom} onChange={e => setEnvBloom(e.target.checked)} />
            <span className="hint">{t('scene_bloom_label')}</span>
          </div>
          <div className="row">
            <label className="lbl w80">{t('scene_floor')}</label>
            <input type="checkbox" checked={envFloor} onChange={e => setEnvFloor(e.target.checked)} />
            <span className="hint">{t('scene_floor_label')}</span>
          </div>
          <div className="sep" />
          <div className="row">
            <label className="lbl w80">{t('scene_gizmo')}</label>
            <div className={'tsw' + (gizmoEnabled ? ' on' : '')}
              onClick={() => setGizmoEnabled(!gizmoEnabled)} />
          </div>
          {gizmoEnabled && (
            <>
              <div className="row">
                <label className="lbl w80">{t('scene_gizmo_mode')}</label>
                <select value={gizmoMode} onChange={e => setGizmoMode(e.target.value as any)}>
                  <option value="translate">{t('scene_gizmo_translate')}</option>
                  <option value="rotate">{t('scene_gizmo_rotate')}</option>
                  <option value="scale">{t('scene_gizmo_scale')}</option>
                </select>
              </div>
              <div className="row">
                <label className="lbl w80">{t('scene_gizmo_x')}</label>
                <input type="number" step={0.1} value={gizmoTarget.x}
                  onChange={e => setGizmoTarget({ ...gizmoTarget, x: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="row">
                <label className="lbl w80">{t('scene_gizmo_y')}</label>
                <input type="number" step={0.1} value={gizmoTarget.y}
                  onChange={e => setGizmoTarget({ ...gizmoTarget, y: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="row">
                <label className="lbl w80">{t('scene_gizmo_z')}</label>
                <input type="number" step={0.1} value={gizmoTarget.z}
                  onChange={e => setGizmoTarget({ ...gizmoTarget, z: parseFloat(e.target.value) || 0 })} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr open"><span>🎨 {t('set_theme')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div className="scene-themes">
            {(['dark', 'neon', 'crimson', 'emerald', 'light'] as const).map(tm => (
              <div key={tm}
                className={'scene-theme-btn' + (settings.theme === tm ? ' active' : '')}
                onClick={() => applyTheme(tm)}
              >
                <span className="swatch" style={{ background: themeGradients[tm] }} />
                {themeNames[tm]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr open"><span>🌐 {t('set_language')}</span><span className="arr">▶</span></div>
        <div className="sec-body open">
          <div className="scene-lang">
            <div className={'cqbtn' + (locale === 'en' ? ' active' : '')}
              onClick={() => { setLocale('en'); setSettings({ language: 'en' }); }}>{t('scene_lang_en')}</div>
            <div className={'cqbtn' + (locale === 'cs' ? ' active' : '')}
              onClick={() => { setLocale('cs'); setSettings({ language: 'cs' }); }}>{t('scene_lang_cs')}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-hdr open"><span>⚙ {t('set_debug')}</span><span className="arr">▶</span></div>
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
        <div className="sec-hdr"><span>{t('scene_shortcuts')}</span><span className="arr">▶</span></div>
        <div className="sec-body">
          <div className="scene-shortcuts">
            <b>Space</b> {t('scene_shortcut_play')}<br />
            <b>A</b> {t('scene_shortcut_autocycle')}<br />
            <b>W</b> {t('scene_shortcut_fill')}<br />
            <b>R</b> {t('scene_shortcut_reset')}<br />
            <b>F1/F2/F3</b> {t('scene_shortcut_view')}<br />
            <b>Ctrl+Z</b> {t('scene_shortcut_undo')}<br />
            <b>Ctrl+Y/Shift+Z</b> {t('scene_shortcut_redo')}<br />
            <b>Ctrl+D</b> {t('scene_shortcut_dup')}<br />
            <b>Ctrl+S</b> {t('scene_shortcut_save')}<br />
            <b>Ctrl+C</b> {t('scene_shortcut_copy')}<br />
            <b>Ctrl+V</b> {t('scene_shortcut_paste')}<br />
            <b>Delete</b> {t('scene_shortcut_delete')}<br />
            <b>RMB drag</b> {t('scene_shortcut_orbit')}<br />
            <b>MMB drag</b> {t('scene_shortcut_pan')}<br />
            <b>Scroll</b> {t('scene_shortcut_zoom')}
          </div>
        </div>
      </div>
    </div>
  );
}
