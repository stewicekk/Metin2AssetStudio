import { useEffect, useRef, useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';
import { DependencyPanel } from './components/DependencyPanel';
import { EmitterList } from './components/EmitterList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GraphPanel } from './components/GraphPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { PresetsPanel } from './components/PresetsPanel';
import { PropsPanel } from './components/PropsPanel';
import { SceneSettings } from './components/SceneSettings';
import { SettingsPanel } from './components/SettingsPanel';
import { PluginStatusPanel } from './components/PluginStatusPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { ValidationPanel } from './components/ValidationPanel';
import { Viewport } from './components/Viewport';
import { ProfilingPanel } from './components/ProfilingPanel';
import { t } from './i18n';
import { useAppStore } from './store/useAppStore';
import { AssetManager } from './utils/assetManager';
import { downloadText, copyToClipboard } from './utils/exporter';
import { toast } from './utils/toast';
import { ProjectDB, type StoredProject } from './utils/projectDB';
import { pluginManager } from './plugins';
import './App.css';

type TabId = 'props' | 'presets' | 'library' | 'scene' | 'settings' | 'plugins';

function App() {
  const settings = useAppStore(s => s.settings);
  const emitters = useAppStore(s => s.emitters);
  const addEmitter = useAppStore(s => s.addEmitter);
  const resetProject = useAppStore(s => s.resetProject);
  const setPlaying = useAppStore(s => s.setPlaying);
  const setGlobalTime = useAppStore(s => s.setGlobalTime);
  const exportEffectName = useAppStore(s => s.exportEffectName);
  const exportModal = useAppStore(s => s.exportModal);
  const setExportModal = useAppStore(s => s.setExportModal);
  const vpScale = useAppStore(s => s.vpScale);
  const setVpScale = useAppStore(s => s.setVpScale);
  const autoCycle = useAppStore(s => s.autoCycle);
  const setAutoCycle = useAppStore(s => s.setAutoCycle);
  const cameraControllerRef = useRef<{ reset: () => void; setView: (f: string) => void } | null>(null);

  const initialized = useRef(false);
  const mseInputRef = useRef<HTMLInputElement>(null);
  const meshInputRef = useRef<HTMLInputElement>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('props');
  const [projectList, setProjectList] = useState<StoredProject[]>([]);
  const [showProjects, setShowProjects] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    addEmitter('FireBall_Main');
    setPlaying(true);
  }, [addEmitter, setPlaying]);

  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().autoSaveProject();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const state = useAppStore.getState();
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          state.setPlaying(!state.playing);
          break;
        case 'KeyA':
          state.setAutoCycle(!state.autoCycle);
          break;
        case 'KeyW':
          state.emitters.forEach(em => { em._localTime = 0; em._spawnAcc = 0; });
          break;
        case 'KeyR':
          cameraControllerRef.current?.reset();
          break;
        case 'KeyD':
          if (e.ctrlKey && state.activeEmitterId) {
            e.preventDefault();
            state.duplicateEmitter(state.activeEmitterId);
          }
          break;
        case 'KeyS':
          if (e.ctrlKey) {
            e.preventDefault();
            const st = useAppStore.getState();
            const result = pluginManager.export(st.emitters, 'mse', { effectName: st.exportEffectName });
            if (result) downloadText(result.data, `${st.exportEffectName}.mse`);
          }
          break;
        case 'KeyC':
          if (e.ctrlKey && state.activeEmitterId) {
            e.preventDefault();
            const emitter = state.emitters.find(e2 => e2.uid === state.activeEmitterId);
            if (emitter) state.setCopiedEmitter(JSON.parse(JSON.stringify(emitter)));
          }
          break;
        case 'KeyV':
          if (e.ctrlKey && state.copiedEmitter) {
            e.preventDefault();
            useAppStore.getState().addEmitterFromTemplate(state.copiedEmitter.name + '_paste', { ...state.copiedEmitter });
          }
          break;
        case 'KeyZ':
          if (e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            state.undo();
            toast(t('toast_undo'), 'info');
          } else if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            state.redo();
            toast(t('toast_redo'), 'info');
          }
          break;
        case 'KeyY':
          if (e.ctrlKey) {
            e.preventDefault();
            state.redo();
            toast(t('toast_redo'), 'info');
          }
          break;
        case 'Delete':
          if (state.activeEmitterId) state.deleteEmitter(state.activeEmitterId);
          break;
        case 'F1':
          e.preventDefault();
          cameraControllerRef.current?.setView('front');
          break;
        case 'F2':
          e.preventDefault();
          cameraControllerRef.current?.setView('top');
          break;
        case 'F3':
          e.preventDefault();
          cameraControllerRef.current?.setView('persp');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith('.mse') || file.name.endsWith('.mde') || file.name.endsWith('.eff'))) {
        AssetManager.importMseFile(file);
        toast(`${t('toast_imported')}: ${file.name}`, 'success');
      }
    };
    const over = (e: DragEvent) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'copy'; };
    window.addEventListener('drop', handler);
    window.addEventListener('dragover', over);
    return () => { window.removeEventListener('drop', handler); window.removeEventListener('dragover', over); };
  }, []);

  const handleImportMse = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await AssetManager.importMseFile(file);
    event.target.value = '';
  };

  const handleNew = () => {
    resetProject();
    addEmitter('Emitter_1');
    toast(t('toast_new_project'), 'success');
  };

  const handleStop = () => {
    setPlaying(false);
    setGlobalTime(0);
    emitters.forEach(em => { em._localTime = 0; em._spawnAcc = 0; });
  };

  const handleWarmStart = () => {
    emitters.forEach(em => { em._localTime = 0; em._spawnAcc = em.maxP; });
  };

  const handleSaveProject = () => {
    const json = useAppStore.getState().exportProjectToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${useAppStore.getState().exportEffectName}_project.json`;
    a.click();
    toast(t('toast_saved'), 'success');
  };

  const handleLoadProject = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const success = useAppStore.getState().importProjectFromJSON(r.result as string);
      if (!success) {
        toast(t('toast_load_failed'), 'error');
      } else {
        toast(t('toast_loaded'), 'success');
      }
    };
    r.readAsText(file);
    event.target.value = '';
  };

  const handleExportZip = async () => {
    const state = useAppStore.getState();
    const mseResult = pluginManager.export(state.emitters, 'mse', { effectName: state.exportEffectName });
    const mseContent = mseResult ? mseResult.data : '/* export failed */';
    const projectJson = state.exportProjectToJSON();
    const issues = state.validateForExport();
    const warnings = issues.filter(i => i.type === 'warning').length;
    const errors = issues.filter(i => i.type === 'error').length;

    if (errors > 0) {
      setExportModal({ open: true, title: t('export_validation_title'), content: `${t('toast_cannot_export')}: ${errors} ${t('val_errors').toLowerCase()}`, ext: 'txt' });
      return;
    }

    const fullContent = [
      `--- ${t('export_title')} ---`,
      '',
      '--- MSE FILE ---',
      mseContent,
      '',
      '--- PROJECT JSON ---',
      projectJson,
      '',
      '--- VALIDATION ---',
      issues.length === 0 ? `✓ ${t('val_no_issues')}` : issues.map(i => `[${i.type.toUpperCase()}] ${i.emitter}: ${i.message}`).join('\n'),
      '',
      '--- INSTRUCTIONS ---',
      t('export_instructions').split('\n').join('\n'),
    ].join('\n\n');

    const blob = new Blob([fullContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.exportEffectName}_export.txt`;
    a.click();

    const toastMsg = warnings > 0 ? `${t('export_complete')} (${warnings} ${t('export_warnings')})` : t('export_complete');
    toast(toastMsg, warnings > 0 ? 'warn' : 'success');
  };

  const handleValidation = () => {
    const issues = useAppStore.getState().validateForExport();
    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');

    let msg = `${t('export_validation_title')}:\n`;
    if (errors.length === 0 && warnings.length === 0) {
      msg += `\n✓ ${t('val_no_issues')}`;
    } else {
      if (errors.length > 0) msg += `\n✗ ${errors.length} ${t('val_errors')}:\n${errors.map(e => `  • ${e.emitter}: ${e.message}`).join('\n')}`;
      if (warnings.length > 0) msg += `\n⚠ ${warnings.length} ${t('val_warnings')}:\n${warnings.map(w => `  • ${w.emitter}: ${w.message}`).join('\n')}`;
    }
    setExportModal({ open: true, title: t('export_validation_title'), content: msg, ext: 'txt' });
  };

  const handleExportMDE = () => {
    const state = useAppStore.getState();
    const result = pluginManager.export(state.emitters, 'mde', {
      effectName: state.exportEffectName,
      effectPath: state.exportEffectPath,
      attachBone: state.envBone,
      precision: state.settings.exportPrec,
    });
    if (result) {
      downloadText(result.data, `${state.exportEffectName}.mde`);
      toast(t('toast_mde_exported'), 'success');
    }
  };

  const handleExportEFF = () => {
    const state = useAppStore.getState();
    const result = pluginManager.export(state.emitters, 'eff', {
      effectName: state.exportEffectName,
      effectPath: state.exportEffectPath,
      precision: state.settings.exportPrec,
    });
    if (result) {
      downloadText(result.data, `${state.exportEffectName}.eff`);
      toast(t('toast_eff_exported'), 'success');
    }
  };

  const handleCopyExport = useCallback(() => {
    if (exportModal?.content) copyToClipboard(exportModal.content);
  }, [exportModal]);

  const handleDownloadExport = useCallback(() => {
    if (exportModal?.content) downloadText(exportModal.content, `${exportEffectName}.${exportModal.ext}`);
  }, [exportModal, exportEffectName]);

  const handleCloseModal = useCallback(() => setExportModal(null), [setExportModal]);

  const handleSaveToBrowser = async () => {
    const json = useAppStore.getState().exportProjectToJSON();
    const name = useAppStore.getState().exportEffectName || 'Untitled';
    await ProjectDB.save({ name, timestamp: new Date().toISOString(), data: json });
    toast(t('toast_saved_storage'), 'success');
  };

  const handleLoadProjectList = async () => {
    const list = await ProjectDB.list();
    setProjectList(list);
    setShowProjects(true);
  };

  const handleOpenProject = async (id: number) => {
    const project = await ProjectDB.load(id);
    if (project) {
      useAppStore.getState().importProjectFromJSON(project.data);
      toast(`${t('toast_loaded')}: ${project.name}`, 'success');
      setShowProjects(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    await ProjectDB.delete(id);
    const list = await ProjectDB.list();
    setProjectList(list);
    toast(t('toast_deleted'), 'info');
  };

  const cameraRefCallback = useCallback((ref: { reset: () => void; setView: (f: string) => void } | null) => {
    cameraControllerRef.current = ref;
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'props', label: t('tab_props') },
    { id: 'presets', label: t('tab_presets') },
    { id: 'library', label: t('tab_library') },
    { id: 'scene', label: t('tab_scene') },
    { id: 'settings', label: '⚙' },
    { id: 'plugins', label: t('tab_plugins') },
  ];

  return (
    <div className="studio-shell" id="app-shell">
      <aside id="left" className="studio-left">
        <div className="appbar">
          <div className="logo">{t('app_title')}<span>{t('app_pro')}</span></div>
          <div className="top-actions">
            <button className="btn sm" onClick={handleNew}>{t('btn_new')}</button>
            <button className="btn sm" onClick={() => loadInputRef.current?.click()}>{t('btn_load')}</button>
            <button className="btn sm primary" onClick={handleSaveProject}>{t('btn_save')}</button>
            <button className="btn sm" onClick={handleSaveToBrowser} title={t('app_saved_storage')}>Web</button>
            <button className="btn sm" onClick={handleLoadProjectList} title={t('app_project_browser')}>Proj</button>
            <button className="btn sm" onClick={() => mseInputRef.current?.click()}>{t('btn_import')}</button>
            <button className="btn sm accent" onClick={handleExportZip}>{t('btn_export')}</button>
            <button className="btn sm" onClick={handleValidation}>{t('btn_validate')}</button>
            <input type="file" ref={mseInputRef} onChange={handleImportMse} accept=".mse,.mde,.eff" hidden />
            <input type="file" ref={loadInputRef} onChange={handleLoadProject} accept=".json" hidden />
          </div>
        </div>
        <EmitterList />
        <div className="tabs">
          {tabs.map(tab => (
            <div key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </div>
          ))}
        </div>
        <div className="panel-scroll">
          {activeTab === 'props' && <ErrorBoundary fallback={t('err_props')}><PropsPanel /></ErrorBoundary>}
          {activeTab === 'presets' && <ErrorBoundary fallback={t('err_presets')}><PresetsPanel /></ErrorBoundary>}
          {activeTab === 'library' && <ErrorBoundary fallback={t('err_library')}><LibraryPanel /></ErrorBoundary>}
          {activeTab === 'scene' && <ErrorBoundary fallback={t('err_scene')}><SceneSettings /></ErrorBoundary>}
          {activeTab === 'settings' && <ErrorBoundary fallback={t('err_settings')}><SettingsPanel /></ErrorBoundary>}
          {activeTab === 'plugins' && <ErrorBoundary fallback={t('err_plugins')}><PluginStatusPanel /></ErrorBoundary>}
        </div>
      </aside>

      <main id="center" className="studio-center">
        <div className="viewport-bar">
          <button className="btn sm" onClick={() => setPlaying(true)} title={t('btn_play')}>{t('btn_play')}</button>
          <button className="btn sm" onClick={() => setPlaying(false)} title={t('btn_pause')}>{t('btn_pause')}</button>
          <button className="btn sm" onClick={handleStop} title={t('btn_stop')}>{t('btn_stop')}</button>
          <button className={`btn sm` + (autoCycle ? ' active' : '')} onClick={() => setAutoCycle(!autoCycle)} title={t('btn_autocycle')}>{autoCycle ? t('btn_cycle_on') : t('btn_cycle_off')}</button>
          <button className="btn sm" onClick={handleWarmStart} title={t('btn_fill')}>{t('btn_fill')}</button>
          <span className="sep-v" />
          <button className="btn sm" onClick={() => cameraControllerRef.current?.reset()} title={t('btn_reset_camera')}>{t('btn_reset_camera')}</button>
          <button className="btn sm" onClick={() => cameraControllerRef.current?.setView('front')} title={t('btn_front')}>{t('btn_front')}</button>
          <button className="btn sm" onClick={() => cameraControllerRef.current?.setView('top')} title={t('btn_top')}>{t('btn_top')}</button>
          <button className="btn sm" onClick={() => cameraControllerRef.current?.setView('persp')} title={t('btn_3d')}>{t('btn_3d')}</button>
          <span className="sep-v" />
          <button className="btn sm accent" onClick={handleExportMDE} title={t('btn_mde')}>{t('btn_mde')}</button>
          <button className="btn sm" onClick={handleExportEFF} title={t('btn_eff')}>{t('btn_eff')}</button>
          <span className="sep-v" />
          <label className="lbl">{t('scene_scale')}:</label>
          <input type="range" min={0.05} max={8} step={0.05} value={vpScale}
            onChange={e => setVpScale(parseFloat(e.target.value))} className="n60" />
          <label className="lbl mono">{vpScale.toFixed(1)}x</label>
          <span className="muted" style={{ marginLeft: 'auto', fontSize: 8 }}>
            {emitters.length} {t('vp_emitters')} · {t('vp_orbit')}
          </span>
        </div>
        <ErrorBoundary fallback={t('err_viewport')}>
          <Viewport cameraRef={cameraRefCallback} />
        </ErrorBoundary>
        <TimelinePanel />
      </main>

      <aside id="right" className="studio-right">
        <div className="appbar">
          <div className="logo">{t('app_subtitle')}<span>{t('graph_title')}</span></div>
        </div>
        <div className="panel-scroll right-stack">
          <ErrorBoundary fallback={t('err_validation')}><ValidationPanel /></ErrorBoundary>
          <ErrorBoundary fallback={t('err_dependencies')}><DependencyPanel /></ErrorBoundary>
          <ErrorBoundary fallback={t('err_graph')}><GraphPanel /></ErrorBoundary>
          <ErrorBoundary fallback={t('err_profiling')}><ProfilingPanel /></ErrorBoundary>
        </div>
      </aside>

      {exportModal?.open && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{exportModal.title}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <textarea className="modal-content" value={exportModal.content} readOnly />
            <div className="modal-actions">
              <button className="btn primary" onClick={handleCopyExport}>{t('btn_copy')}</button>
              <button className="btn" onClick={handleDownloadExport}>{t('btn_download')}</button>
              <button className="btn" onClick={handleCloseModal}>{t('btn_close')}</button>
            </div>
          </div>
        </div>
      )}
      {showProjects && (
        <div className="modal-overlay" onClick={() => setShowProjects(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('app_project_browser')}</h2>
              <button className="modal-close" onClick={() => setShowProjects(false)}>×</button>
            </div>
            <div className="modal-list">
              {projectList.length === 0 && (
                <div className="empty-state"><p className="muted">{t('app_no_projects')}</p></div>
              )}
              {projectList.map(p => (
                <div key={p.id} className="modal-list-item">
                  <span className="name">{p.name}</span>
                  <span className="date">{new Date(p.timestamp).toLocaleDateString()}</span>
                  <button className="btn sm primary" onClick={() => p.id && handleOpenProject(p.id)}>{t('app_open')}</button>
                  <button className="btn sm danger" onClick={() => p.id && handleDeleteProject(p.id)}>✕</button>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowProjects(false)}>{t('btn_close')}</button>
            </div>
          </div>
        </div>
      )}
      <input type="file" ref={meshInputRef} accept=".obj,.gltf,.glb,.fbx" hidden />
    </div>
  );
}

export default App;
