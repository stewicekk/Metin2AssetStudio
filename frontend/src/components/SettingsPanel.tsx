import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

export function SettingsPanel() {
  const { t, locale, setLocale } = useT();
  const settings = useAppStore(s => s.settings);
  const setSettings = useAppStore(s => s.setSettings);

  const applyTheme = (theme: string) => {
    setSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const themeNames: Record<string, string> = {
    dark: t('set_dark'), neon: t('set_neon'), crimson: t('set_crimson'),
    emerald: t('set_emerald'), light: t('set_light'),
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
