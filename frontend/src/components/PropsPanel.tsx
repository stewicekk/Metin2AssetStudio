import { useState, useCallback, useRef, useEffect } from 'react';
import type { Emitter } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n';

function Section({ title, icon, defaultOpen = false, children }: { title: string; icon: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className={`sec-hdr ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span>{icon} {title}</span>
        <span className="arr">▶</span>
      </div>
      <div className={`sec-body ${isOpen ? 'open' : ''}`}>{children}</div>
    </div>
  );
}

function PropRow({ label, children, wide, slim }: { label: string; children: React.ReactNode; wide?: boolean; slim?: boolean }) {
  return (
    <div className={`row ${wide ? 'prop-wide' : ''} ${slim ? 'prop-slim' : ''}`}>
      <label className="lbl">{label}</label>
      {children}
    </div>
  );
}

export function PropsPanel() {
  const { t } = useT();
  const emitters = useAppStore(s => s.emitters);
  const activeEmitterId = useAppStore(s => s.activeEmitterId);
  const updateEmitter = useAppStore(s => s.updateEmitter);
  const emitter = emitters.find(e => e.uid === activeEmitterId);

  const handleChange = useCallback((field: keyof Emitter, value: unknown) => {
    if (emitter) updateEmitter(emitter.uid, { [field]: value });
  }, [emitter, updateEmitter]);

  const handleNumber = useCallback((field: keyof Emitter, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && emitter) updateEmitter(emitter.uid, { [field]: num });
  }, [emitter, updateEmitter]);

  if (!emitter) {
    return (
      <div className="props-panel">
        <div className="empty-state">
          <p>{t('pp_no_selected')}</p>
          <p className="muted">{t('pp_no_hint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="props-panel">
      <div className="panel-header">
        <span className="panel-title">{emitter.name}</span>
        <span className="uid-badge">uid:{emitter.uid}</span>
      </div>

      <Section title={t('pp_section_emitter')} icon="⚡" defaultOpen>
        <PropRow label={t('ee_name')}><input type="text" value={emitter.name} onChange={(e) => handleChange('name', e.target.value)} className="flex1" /></PropRow>
        <PropRow label={t('ee_blend')}>
          <select value={emitter.blend} onChange={(e) => handleChange('blend', e.target.value)}>
            <option value="add">{t('pp_blend_add')}</option><option value="alpha">{t('pp_blend_alpha')}</option><option value="modulate">{t('pp_blend_modulate')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_shape')}>
          <select value={emitter.shape} onChange={(e) => handleChange('shape', e.target.value)}>
            <option value="point">{t('pp_shape_point')}</option><option value="cone">{t('pp_shape_cone')}</option><option value="box">{t('pp_shape_box')}</option>
            <option value="sphere">{t('pp_shape_sphere')}</option><option value="spherevol">{t('pp_shape_spherevol')}</option>
            <option value="ring">{t('pp_shape_ring')}</option><option value="disc">{t('pp_shape_disc')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_rate')}>
          <input type="number" value={emitter.rate} min={0} max={10000} step={1} onChange={(e) => handleNumber('rate', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_burst')}>
          <input type="number" value={emitter.burst} min={0} step={1} onChange={(e) => handleNumber('burst', e.target.value)} className="n60" />
          <span className="hint">{t('pp_hint_burst')}</span>
        </PropRow>
        <PropRow label={t('ee_life')}>
          <input type="number" value={emitter.life} min={0.01} step={0.05} onChange={(e) => handleNumber('life', e.target.value)} className="n60" />
          <span className="lbl">{t('pp_hint_plusminus')}</span>
          <input type="number" value={emitter.lifeRnd} min={0} step={0.05} onChange={(e) => handleNumber('lifeRnd', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_max_p')}>
          <input type="number" value={emitter.maxP} min={1} max={2048} step={1} onChange={(e) => handleNumber('maxP', e.target.value)} className="flex1" />
        </PropRow>
        <PropRow label={t('ee_loop')}>
          <select value={emitter.loop} onChange={(e) => handleChange('loop', parseInt(e.target.value))}>
            <option value={1}>{t('pp_loop_yes')}</option><option value={0}>{t('pp_loop_no')}</option>
          </select>
          <span className="lbl" style={{marginLeft: 5}}>{t('ee_cycle')}</span>
          <input type="number" value={emitter.cycle} min={0.1} step={0.1} onChange={(e) => handleNumber('cycle', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_delay')}>
          <input type="number" value={emitter.delay} min={0} step={0.05} onChange={(e) => handleNumber('delay', e.target.value)} className="n60" />
        </PropRow>
      </Section>

      <Section title={t('pp_section_physics')} icon="🌀" defaultOpen>
        <PropRow label={t('ee_speed')}>
          <input type="number" value={emitter.speed} step={0.1} onChange={(e) => handleNumber('speed', e.target.value)} className="n60" />
          <span className="lbl">{t('pp_hint_plusminus')}</span>
          <input type="number" value={emitter.speedRnd} min={0} step={0.1} onChange={(e) => handleNumber('speedRnd', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_spread')}>
          <input type="number" value={emitter.spread} min={0} max={360} step={1} onChange={(e) => handleNumber('spread', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_dir_yaw')}>
          <input type="number" value={emitter.dirYaw} min={-360} max={360} step={1} onChange={(e) => handleNumber('dirYaw', e.target.value)} className="n60" />
          <span className="lbl">{t('ee_dir_pitch')}</span>
          <input type="number" value={emitter.dirPitch} min={-90} max={90} step={1} onChange={(e) => handleNumber('dirPitch', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_gravity')}>
          <input type="number" value={emitter.gravity} step={0.5} onChange={(e) => handleNumber('gravity', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_wind_x')}>
          <input type="number" value={emitter.windX} step={0.1} onChange={(e) => handleNumber('windX', e.target.value)} className="n60" />
          <span className="lbl">{t('ee_wind_z')}</span>
          <input type="number" value={emitter.windZ} step={0.1} onChange={(e) => handleNumber('windZ', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_drag')}>
          <input type="number" value={emitter.drag} min={0} max={20} step={0.1} onChange={(e) => handleNumber('drag', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_spin')}>
          <input type="number" value={emitter.spin} step={5} onChange={(e) => handleNumber('spin', e.target.value)} className="n60" />
          <span className="lbl">{t('pp_hint_plusminus')}</span>
          <input type="number" value={emitter.spinRnd} min={0} step={5} onChange={(e) => handleNumber('spinRnd', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_init_rot')}>
          <input type="number" value={emitter.initRot} step={5} onChange={(e) => handleNumber('initRot', e.target.value)} className="n60" />
          <span className="lbl">{t('pp_hint_plusminus')}</span>
          <input type="number" value={emitter.initRotRnd} min={0} step={5} onChange={(e) => handleNumber('initRotRnd', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_vel_stretch')}>
          <input type="number" value={emitter.velStretch} min={0} max={5} step={0.1} onChange={(e) => handleNumber('velStretch', e.target.value)} className="n60" />
        </PropRow>
      </Section>

      <Section title={t('pp_section_size')} icon="📐">
        <PropRow label={t('ee_size_x')}>
          <input type="number" value={emitter.sizeX} min={0} step={0.05} onChange={(e) => handleNumber('sizeX', e.target.value)} className="n60" />
          <span className="lbl">{t('pp_hint_plusminus')}</span>
          <input type="number" value={emitter.sizeRnd} min={0} step={0.05} onChange={(e) => handleNumber('sizeRnd', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_size_nonuniform')}>
          <input type="checkbox" checked={emitter.sizeNonUniform} onChange={(e) => handleChange('sizeNonUniform', e.target.checked)} />
          <span className="lbl">{t('ee_size_y')}</span>
          <input type="number" value={emitter.sizeY} min={0} step={0.05} onChange={(e) => handleNumber('sizeY', e.target.value)} className="n60" disabled={!emitter.sizeNonUniform} />
        </PropRow>
      </Section>

      <Section title={t('pp_section_advanced')} icon="🔬">
        <PropRow label={t('ee_coord_type')}>
          <select value={emitter.coordType} onChange={(e) => handleChange('coordType', e.target.value)} className="flex1">
            <option value="WORLD">{t('pp_coord_world')}</option><option value="LOCAL">{t('pp_coord_local')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_rot_type')}>
          <select value={emitter.rotType} onChange={(e) => handleChange('rotType', e.target.value)} className="flex1">
            <option value="NONE">{t('pp_rot_none')}</option><option value="RANDOM">{t('pp_rot_random')}</option><option value="SPIN">{t('pp_rot_spin')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_uv_scroll_x')}>
          <input type="number" value={emitter.uvScrollX} step={0.05} onChange={(e) => handleNumber('uvScrollX', e.target.value)} className="n60" />
          <span className="lbl">{t('ee_uv_scroll_y')}</span>
          <input type="number" value={emitter.uvScrollY} step={0.05} onChange={(e) => handleNumber('uvScrollY', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_shape_radius')}>
          <input type="number" value={emitter.shapeRadius} min={0.01} step={0.05} onChange={(e) => handleNumber('shapeRadius', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_ground_bounce')}>
          <input type="checkbox" checked={emitter.groundBounce} onChange={(e) => handleChange('groundBounce', e.target.checked)} />
          <span className="lbl">{t('ee_bounce_fac')}</span>
          <input type="number" value={emitter.bounceFac} min={0} max={1} step={0.05} onChange={(e) => handleNumber('bounceFac', e.target.value)} className="n60" disabled={!emitter.groundBounce} />
        </PropRow>
        <PropRow label={t('ee_attractor_str')}>
          <input type="number" value={emitter.attractorStr} step={0.1} onChange={(e) => handleNumber('attractorStr', e.target.value)} className="n60" />
          <span className="lbl">{t('ee_attractor_y')}</span>
          <input type="number" value={emitter.attractorY} step={0.1} onChange={(e) => handleNumber('attractorY', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_emit_surface')}>
          <select value={emitter.emitSurface} onChange={(e) => handleChange('emitSurface', e.target.value)} className="flex1">
            <option value="none">{t('none')}</option><option value="surface">{t('ee_emit_surface_surface')}</option><option value="edge">{t('ee_emit_surface_edge')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_color_mod')}>
          <select value={emitter.colorMod} onChange={(e) => handleChange('colorMod', e.target.value)} className="flex1">
            <option value="multiply">{t('pp_color_multiply')}</option><option value="add">{t('pp_color_add')}</option>
          </select>
        </PropRow>
      </Section>

      <Section title={t('pp_section_texture')} icon="🖼">
        <PropRow label={t('ee_texture')}>
          <select value={emitter.builtinTex} onChange={(e) => handleChange('builtinTex', e.target.value)}>
            <option value="circle">{t('pp_tex_circle')}</option><option value="star">{t('pp_tex_star')}</option><option value="ring">{t('pp_tex_ring')}</option>
            <option value="spark">{t('pp_tex_spark')}</option><option value="cross">{t('pp_tex_cross')}</option><option value="flare">{t('pp_tex_lensflare')}</option>
            <option value="smoke">{t('pp_tex_smoke')}</option><option value="diamond">{t('pp_tex_diamond')}</option><option value="softglow">{t('pp_tex_glow')}</option>
            <option value="hexagon">{t('pp_tex_hexagon')}</option><option value="flame">{t('pp_tex_flame')}</option><option value="arrow">{t('pp_tex_arrow')}</option>
            <option value="debris">{t('pp_tex_debris')}</option><option value="custom">{t('pp_tex_custom')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_sheet_cols')}>
          <input type="number" value={emitter.sheetCols} min={1} max={16} step={1} onChange={(e) => handleNumber('sheetCols', e.target.value)} className="n60" />
          <span className="lbl">{t('ee_sheet_rows')}</span>
          <input type="number" value={emitter.sheetRows} min={1} max={16} step={1} onChange={(e) => handleNumber('sheetRows', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_uv_anim')}>
          <select value={emitter.uvAnim} onChange={(e) => handleChange('uvAnim', e.target.value)} className="flex1">
            <option value="loop">{t('pp_uv_loop')}</option><option value="once">{t('pp_uv_once')}</option><option value="rand">{t('pp_uv_rand')}</option><option value="life">{t('pp_uv_life')}</option>
          </select>
        </PropRow>
        <PropRow label={t('ee_anim_fps')}>
          <input type="number" value={emitter.animFPS} min={1} max={60} step={1} onChange={(e) => handleNumber('animFPS', e.target.value)} className="n60" />
        </PropRow>
        <PropRow label={t('ee_texture')}>
          <input type="text" value={emitter.texPath} placeholder="effect/skill/fire.tga" onChange={(e) => handleChange('texPath', e.target.value)} className="flex1" />
        </PropRow>
      </Section>

      <Section title={t('pp_section_curves')} icon="📈">
        <CurveEditor type="sizeCurve" label={t('ee_size_x')} emitter={emitter} updateEmitter={updateEmitter} />
        <CurveEditor type="alphaCurve" label={t('ee_alpha_curve')} emitter={emitter} updateEmitter={updateEmitter} />
        <CurveEditor type="speedCurve" label={t('ee_speed')} emitter={emitter} updateEmitter={updateEmitter} />
        <CurveEditor type="spinCurve" label={t('ee_spin')} emitter={emitter} updateEmitter={updateEmitter} />
      </Section>

      <Section title={t('pp_section_colors')} icon="🎨">
        <ColorKeyEditor emitter={emitter} updateEmitter={updateEmitter} />
      </Section>
    </div>
  );
}

function CurveEditor({ type, label, emitter, updateEmitter }: {
  type: 'sizeCurve' | 'alphaCurve' | 'speedCurve' | 'spinCurve';
  label: string;
  emitter: Emitter;
  updateEmitter: (id: number, updates: Partial<Emitter>) => void;
}) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curve = emitter[type] as { t: number; v: number }[] | undefined;
  if (!curve) return null;

  const handlePointChange = (idx: number, field: 't' | 'v', value: string) => {
    const newCurve = [...curve];
    newCurve[idx] = { ...newCurve[idx], [field]: parseFloat(value) };
    updateEmitter(emitter.uid, { [type]: newCurve });
  };

  const handleReset = () => {
    const defaults: Record<string, { t: number; v: number }[]> = {
      sizeCurve: [{ t: 0, v: 1 }, { t: 0.5, v: 1 }, { t: 1, v: 0.2 }],
      alphaCurve: [{ t: 0, v: 1 }, { t: 0.8, v: 0.9 }, { t: 1, v: 0 }],
      speedCurve: [{ t: 0, v: 1 }, { t: 1, v: 1 }],
      spinCurve: [{ t: 0, v: 1 }, { t: 1, v: 1 }],
    };
    updateEmitter(emitter.uid, { [type]: defaults[type] });
  };

  const handleFlat = () => {
    updateEmitter(emitter.uid, { [type]: [{ t: 0, v: 1 }, { t: 1, v: 1 }] });
  };

  const handleAddPoint = () => {
    const newCurve = [...curve];
    const avgT = newCurve.reduce((a, p) => a + p.t, 0) / newCurve.length;
    newCurve.push({ t: Math.min(1, Math.max(0, avgT)), v: 1 });
    newCurve.sort((a, b) => a.t - b.t);
    updateEmitter(emitter.uid, { [type]: newCurve });
  };

  const handleRemovePoint = (idx: number) => {
    if (curve.length <= 2) return;
    const newCurve = curve.filter((_, i) => i !== idx);
    updateEmitter(emitter.uid, { [type]: newCurve });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || curve.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const pad = 4;
    const drawW = w - pad * 2;
    const drawH = h - pad * 2;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const x = pad + (drawW * i) / 4;
      const y = pad + (drawH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, pad);
      ctx.lineTo(x, pad + drawH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(pad + drawW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, pad + drawH);
    ctx.lineTo(pad + drawW, pad + drawH);
    ctx.stroke();

    if (curve.length >= 2) {
      const color = type === 'alphaCurve' ? '#88ccff' : type === 'sizeCurve' ? '#ffcc44' : type === 'speedCurve' ? '#44ff88' : '#ff8844';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < curve.length; i++) {
        const x = pad + curve[i].t * drawW;
        const y = pad + drawH - Math.min(2, Math.max(0, curve[i].v)) * drawH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    curve.forEach(pt => {
      const x = pad + pt.t * drawW;
      const y = pad + drawH - Math.min(2, Math.max(0, pt.v)) * drawH;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [curve, type]);

  return (
    <div className="curve-editor">
      <div className="curve-tabs">
        <span className="curve-lbl">{label}</span>
      </div>
      <div className="curve-canvas-container">
        <canvas ref={canvasRef} className="curve-canvas" width={260} height={60} />
      </div>
      <div className="curve-points">
        {curve.map((pt, idx) => (
          <div key={idx} className="curve-point-row">
            <input type="number" value={pt.t} step={0.01} min={0} max={1} onChange={(e) => handlePointChange(idx, 't', e.target.value)} className="n40" />
            <input type="number" value={pt.v} step={0.01} onChange={(e) => handlePointChange(idx, 'v', e.target.value)} className="n40" />
            <button className="btn sm curve-btn-rm" onClick={() => handleRemovePoint(idx)} disabled={curve.length <= 2}>✕</button>
          </div>
        ))}
      </div>
      <div className="curve-actions">
        <button className="btn sm" onClick={handleAddPoint}>{t('pp_curve_add')}</button>
        <button className="btn sm" onClick={handleReset}>{t('pp_curve_reset')}</button>
        <button className="btn sm" onClick={handleFlat}>{t('pp_curve_flat')}</button>
      </div>
    </div>
  );
}

function ColorKeyEditor({ emitter, updateEmitter }: {
  emitter: Emitter;
  updateEmitter: (id: number, updates: Partial<Emitter>) => void;
}) {
  const { t } = useT();
  const colorKeys = emitter.colorKeys;
  if (!colorKeys) return null;

  const colorPresets: Record<string, { keys: { t: number; r: number; g: number; b: number; a: number }[] }> = {
    fire: { keys: [{ t: 0, r: 1, g: 0.9, b: 0.3, a: 1 }, { t: 0.3, r: 1, g: 0.5, b: 0.1, a: 0.8 }, { t: 0.7, r: 0.8, g: 0.2, b: 0.05, a: 0.4 }, { t: 1, r: 0.2, g: 0.05, b: 0.02, a: 0 }] },
    ice: { keys: [{ t: 0, r: 0.8, g: 0.9, b: 1, a: 1 }, { t: 0.5, r: 0.6, g: 0.8, b: 1, a: 0.7 }, { t: 1, r: 0.3, g: 0.5, b: 0.8, a: 0 }] },
    lightning: { keys: [{ t: 0, r: 0.9, g: 0.9, b: 1, a: 1 }, { t: 0.2, r: 0.8, g: 0.8, b: 1, a: 0.9 }, { t: 0.5, r: 0.7, g: 0.7, b: 0.9, a: 0.6 }, { t: 1, r: 0.5, g: 0.5, b: 0.7, a: 0 }] },
    blood: { keys: [{ t: 0, r: 0.8, g: 0.1, b: 0.1, a: 1 }, { t: 0.5, r: 0.6, g: 0.05, b: 0.05, a: 0.6 }, { t: 1, r: 0.2, g: 0.02, b: 0.02, a: 0 }] },
  };

  const handlePreset = (id: string) => updateEmitter(emitter.uid, { colorKeys: colorPresets[id].keys });

  const handleKeyChange = (idx: number, field: string, value: string) => {
    const newKeys = [...colorKeys];
    const parsed = field === 'r' || field === 'g' || field === 'b' ? Math.round(parseFloat(value)) : parseFloat(value);
    if (isNaN(parsed)) return;
    if (field === 't') newKeys[idx] = { ...newKeys[idx], t: Math.min(1, Math.max(0, parsed)) };
    else if (field === 'a') newKeys[idx] = { ...newKeys[idx], a: Math.min(1, Math.max(0, parsed)) };
    else newKeys[idx] = { ...newKeys[idx], [field]: parsed };
    updateEmitter(emitter.uid, { colorKeys: newKeys });
  };

  const handleColorChange = (idx: number, hex: string) => {
    const newKeys = [...colorKeys];
    newKeys[idx] = { ...newKeys[idx], r: parseInt(hex.slice(1,3), 16) / 255, g: parseInt(hex.slice(3,5), 16) / 255, b: parseInt(hex.slice(5,7), 16) / 255 };
    updateEmitter(emitter.uid, { colorKeys: newKeys });
  };

  const handleAddKey = () => {
    const newKeys = [...colorKeys];
    newKeys.push({ t: Math.min(1, newKeys[newKeys.length - 1].t + 0.1), r: 1, g: 1, b: 1, a: 1 });
    newKeys.sort((a, b) => a.t - b.t);
    updateEmitter(emitter.uid, { colorKeys: newKeys });
  };

  const handleRemoveKey = (idx: number) => {
    if (colorKeys.length <= 1) return;
    const newKeys = colorKeys.filter((_, i) => i !== idx);
    updateEmitter(emitter.uid, { colorKeys: newKeys });
  };

  const presetNames: Record<string, string> = {
    fire: t('pp_color_fire'),
    ice: t('pp_color_ice'),
    lightning: t('pp_color_lightning'),
    blood: t('pp_color_blood'),
  };

  return (
    <div className="color-key-editor">
      <div className="gradient-preview" style={{
        background: `linear-gradient(to right, ${colorKeys.map(k => `rgba(${Math.round(k.r*255)},${Math.round(k.g*255)},${Math.round(k.b*255)},${k.a}) ${k.t*100}%`).join(', ')})`
      }} />
      <div className="color-presets">
        {Object.keys(colorPresets).map(id => (
          <button key={id} className="btn sm" onClick={() => handlePreset(id)}>{presetNames[id]}</button>
        ))}
      </div>
      <div className="color-keys-list">
        {colorKeys.map((key, idx) => (
          <div key={idx} className="color-key-row">
            <input type="number" value={key.t} step={0.01} min={0} max={1} className="n40" onChange={(e) => handleKeyChange(idx, 't', e.target.value)} />
            <input type="color" value={`#${Math.round(key.r*255).toString(16).padStart(2,'0')}${Math.round(key.g*255).toString(16).padStart(2,'0')}${Math.round(key.b*255).toString(16).padStart(2,'0')}`} onChange={(e) => handleColorChange(idx, e.target.value)} className="color-picker" />
            <input type="number" value={key.a} step={0.01} min={0} max={1} className="n40" onChange={(e) => handleKeyChange(idx, 'a', e.target.value)} />
            <button className="btn sm color-key-btn" onClick={() => handleRemoveKey(idx)} disabled={colorKeys.length <= 1}>✕</button>
          </div>
        ))}
      </div>
      <button className="btn sm color-add-key" onClick={handleAddKey}>{t('pp_color_add_key')}</button>
    </div>
  );
}