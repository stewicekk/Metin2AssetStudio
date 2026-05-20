# ui/dialogs.py
# Metin2 World Editor — Dialog Windows
# ============================================================================

import os
import json
from pathlib import Path
from typing import Dict, List

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTabWidget, QWidget, QGroupBox, QCheckBox, QComboBox,
    QListWidget, QListWidgetItem, QTextBrowser, QDialogButtonBox,
    QFormLayout, QSpinBox, QDoubleSpinBox, QFileDialog, QMessageBox,
    QProgressDialog, QPlainTextEdit, QFrame
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QSize
from PyQt6.QtGui import QFont, QIcon

from ui.widgets import FilePathInput, LabeledSlider, SectionHeader, HSeparator
from ui.theme import DARK_ACCENT, DARK_TEXT, DARK_PANEL, DARK_BORDER, DARK_ERROR


# ── Preferences Dialog ────────────────────────────────────────────────────────
class PreferencesDialog(QDialog):
    """Global application preferences with Metin2-specific settings."""

    preferences_saved = pyqtSignal(dict)

    def __init__(self, current_prefs: dict, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Preferences")
        self.setMinimumSize(580, 480)
        self._prefs = dict(current_prefs)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(8)

        tabs = QTabWidget()

        # ── Paths Tab ────────────────────────────────────────────────────────
        paths_tab = QWidget()
        pl = QVBoxLayout(paths_tab)
        pl.setSpacing(10)

        pl.addWidget(SectionHeader("Asset Directories"))

        self._asset_root = FilePathInput(
            "Asset Root:", "D:/ymir work",
            mode="dir"
        )
        self._asset_root.set_path(self._prefs.get("asset_root", "D:/ymir work"))
        pl.addWidget(self._asset_root)

        self._map_root = FilePathInput(
            "Map Root:", "D:/ymir work/map",
            mode="dir"
        )
        self._map_root.set_path(self._prefs.get("map_root", "D:/ymir work/map"))
        pl.addWidget(self._map_root)

        self._mob_root = FilePathInput(
            "Monster Root:", "D:/ymir work/monster",
            mode="dir"
        )
        self._mob_root.set_path(self._prefs.get("mob_root", "D:/ymir work/monster"))
        pl.addWidget(self._mob_root)

        self._pc_root = FilePathInput(
            "PC Root:", "D:/ymir work/pc",
            mode="dir"
        )
        self._pc_root.set_path(self._prefs.get("pc_root", "D:/ymir work/pc"))
        pl.addWidget(self._pc_root)

        pl.addWidget(SectionHeader("Export"))

        self._export_path = FilePathInput(
            "Export Dir:", "D:/export",
            mode="dir"
        )
        self._export_path.set_path(self._prefs.get("export_path", "D:/export"))
        pl.addWidget(self._export_path)

        pl.addStretch()
        tabs.addTab(paths_tab, "Paths")

        # ── Viewport Tab ─────────────────────────────────────────────────────
        vp_tab = QWidget()
        vl = QVBoxLayout(vp_tab)
        vl.setSpacing(10)

        vl.addWidget(SectionHeader("Viewport"))

        self._show_grid = QCheckBox("Show Grid")
        self._show_grid.setChecked(self._prefs.get("show_grid", True))
        vl.addWidget(self._show_grid)

        self._show_wireframe = QCheckBox("Wireframe Overlay")
        self._show_wireframe.setChecked(self._prefs.get("show_wireframe", False))
        vl.addWidget(self._show_wireframe)

        self._show_normals = QCheckBox("Show Normals")
        self._show_normals.setChecked(self._prefs.get("show_normals", False))
        vl.addWidget(self._show_normals)

        self._show_bone_labels = QCheckBox("Show Bone Labels")
        self._show_bone_labels.setChecked(self._prefs.get("show_bone_labels", True))
        vl.addWidget(self._show_bone_labels)

        self._fov_slider = LabeledSlider("FOV:", 30.0, 120.0, self._prefs.get("fov", 60.0), 1)
        vl.addWidget(self._fov_slider)

        self._near_clip = LabeledSlider("Near Clip:", 0.01, 1.0, self._prefs.get("near_clip", 0.1), 3)
        vl.addWidget(self._near_clip)

        self._far_clip = LabeledSlider("Far Clip:", 100.0, 100000.0, self._prefs.get("far_clip", 10000.0), 0)
        vl.addWidget(self._far_clip)

        vl.addWidget(SectionHeader("Performance"))

        self._chunk_size = QSpinBox()
        self._chunk_size.setRange(16, 512)
        self._chunk_size.setValue(self._prefs.get("chunk_size", 64))
        row = QHBoxLayout()
        row.addWidget(QLabel("Terrain Chunk Size:"))
        row.addWidget(self._chunk_size)
        row.addStretch()
        vl.addLayout(row)

        vl.addStretch()
        tabs.addTab(vp_tab, "Viewport")

        # ── Granny Tab ───────────────────────────────────────────────────────
        gr2_tab = QWidget()
        gl = QVBoxLayout(gr2_tab)
        gl.setSpacing(10)

        gl.addWidget(SectionHeader("GR2 / Granny2 Settings"))

        self._gr2_version = QComboBox()
        self._gr2_version.addItems(["6 (Legacy)", "7 (Metin2 2020+)"])
        idx = 0 if self._prefs.get("gr2_version", 7) == 6 else 1
        self._gr2_version.setCurrentIndex(idx)
        row2 = QHBoxLayout()
        row2.addWidget(QLabel("Output GR2 Version:"))
        row2.addWidget(self._gr2_version)
        row2.addStretch()
        gl.addLayout(row2)

        self._auto_fix_paths = QCheckBox("Auto-Fix Texture Paths on Export")
        self._auto_fix_paths.setChecked(self._prefs.get("auto_fix_paths", True))
        gl.addWidget(self._auto_fix_paths)

        self._validate_on_export = QCheckBox("Validate GR2 Before Export")
        self._validate_on_export.setChecked(self._prefs.get("validate_on_export", True))
        gl.addWidget(self._validate_on_export)

        self._max_bones = QSpinBox()
        self._max_bones.setRange(1, 256)
        self._max_bones.setValue(self._prefs.get("max_bones", 32))
        row3 = QHBoxLayout()
        row3.addWidget(QLabel("Max Bones per Mesh:"))
        row3.addWidget(self._max_bones)
        row3.addStretch()
        gl.addLayout(row3)

        self._max_weights = QSpinBox()
        self._max_weights.setRange(1, 4)
        self._max_weights.setValue(self._prefs.get("max_weights", 4))
        row4 = QHBoxLayout()
        row4.addWidget(QLabel("Max Weights per Vertex:"))
        row4.addWidget(self._max_weights)
        row4.addStretch()
        gl.addLayout(row4)

        info = QLabel(
            "<b>Metin2 Engine Limits:</b><br>"
            "• Max 65535 vertices per mesh<br>"
            "• Max 4 bone influences per vertex<br>"
            "• Bone names must match Bip01 hierarchy<br>"
            "• Textures must be power-of-2 DDS"
        )
        info.setStyleSheet(f"color: {DARK_ACCENT}; padding: 8px; "
                           f"border: 1px solid {DARK_BORDER}; border-radius: 4px;")
        info.setTextFormat(Qt.TextFormat.RichText)
        gl.addWidget(info)
        gl.addStretch()
        tabs.addTab(gr2_tab, "GR2 / Granny")

        layout.addWidget(tabs, 1)

        # Buttons
        layout.addWidget(HSeparator())
        btns = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok |
            QDialogButtonBox.StandardButton.Cancel |
            QDialogButtonBox.StandardButton.Apply
        )
        btns.accepted.connect(self._save)
        btns.rejected.connect(self.reject)
        btns.button(QDialogButtonBox.StandardButton.Apply).clicked.connect(self._apply)
        layout.addWidget(btns)

    def _collect(self) -> dict:
        return {
            "asset_root":       self._asset_root.path(),
            "map_root":         self._map_root.path(),
            "mob_root":         self._mob_root.path(),
            "pc_root":          self._pc_root.path(),
            "export_path":      self._export_path.path(),
            "show_grid":        self._show_grid.isChecked(),
            "show_wireframe":   self._show_wireframe.isChecked(),
            "show_normals":     self._show_normals.isChecked(),
            "show_bone_labels": self._show_bone_labels.isChecked(),
            "fov":              self._fov_slider.value(),
            "near_clip":        self._near_clip.value(),
            "far_clip":         self._far_clip.value(),
            "chunk_size":       self._chunk_size.value(),
            "gr2_version":      6 if self._gr2_version.currentIndex() == 0 else 7,
            "auto_fix_paths":   self._auto_fix_paths.isChecked(),
            "validate_on_export": self._validate_on_export.isChecked(),
            "max_bones":        self._max_bones.value(),
            "max_weights":      self._max_weights.value(),
        }

    def _apply(self):
        self._prefs = self._collect()
        self.preferences_saved.emit(self._prefs)

    def _save(self):
        self._apply()
        self.accept()

    def get_preferences(self) -> dict:
        return self._prefs


# ── About Dialog ──────────────────────────────────────────────────────────────
class AboutDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("About Metin2 World Editor ReMIX")
        self.setFixedSize(440, 320)
        layout = QVBoxLayout(self)
        layout.setSpacing(12)
        layout.setContentsMargins(24, 20, 24, 20)

        title = QLabel("Metin2 World Editor ReMIX")
        title.setStyleSheet(f"font-size: 18px; font-weight: bold; color: {DARK_ACCENT};")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        version = QLabel("Version 1.0.0  |  Engine: Metin2 2023–2026")
        version.setAlignment(Qt.AlignmentFlag.AlignCenter)
        version.setStyleSheet("color: #9D9D9D;")
        layout.addWidget(version)

        layout.addWidget(HSeparator())

        desc = QTextBrowser()
        desc.setHtml("""
        <p>Complete Metin2 map and armor editing suite.</p>
        <b>Modules:</b>
        <ul>
            <li>World Editor — Terrain, Objects, NPCs, Lighting</li>
            <li>Armor Skinning &amp; Weight Editor — GR2 rigging</li>
            <li>Batch Processor — Path fixing, conversion</li>
            <li>Python Console — Custom scripting</li>
        </ul>
        <b>Supported Formats:</b> .gr2, .dds, .tga, .msh, .mtl, .mdatr, map/
        <p>Default asset root: <code>D:/ymir work/</code></p>
        """)
        desc.setStyleSheet(f"background: transparent; border: none; color: #DCDCDC;")
        layout.addWidget(desc, 1)

        btn = QPushButton("Close")
        btn.clicked.connect(self.accept)
        layout.addWidget(btn)


# ── Python Console Dialog ─────────────────────────────────────────────────────
class PythonConsoleDialog(QDialog):
    """Integrated Python console for custom scripting."""

    def __init__(self, context: dict = None, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Python Console")
        self.setMinimumSize(700, 500)
        self._context = context or {}
        self._history: List[str] = []
        self._hist_idx = 0
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(4)

        # Output area
        self._output = QPlainTextEdit()
        self._output.setReadOnly(True)
        self._output.setFont(QFont("Consolas", 11))
        self._output.appendPlainText(
            "Metin2 World Editor Python Console\n"
            ">>> Available: gr2, world_editor, armor_editor, parser\n"
            ">>> Type Python code and press Enter or Ctrl+Enter\n"
            "──────────────────────────────────────────────────────\n"
        )
        layout.addWidget(self._output, 1)

        # Input area
        input_layout = QHBoxLayout()
        prompt = QLabel(">>>")
        prompt.setStyleSheet(f"color: {DARK_ACCENT}; font-family: Consolas; font-size: 12px;")
        prompt.setFixedWidth(32)
        input_layout.addWidget(prompt)

        self._input = QPlainTextEdit()
        self._input.setFont(QFont("Consolas", 11))
        self._input.setMaximumHeight(80)
        self._input.setPlaceholderText("Enter Python code here…")
        input_layout.addWidget(self._input)

        layout.addLayout(input_layout)

        btns = QHBoxLayout()
        run_btn = QPushButton("Run  (Ctrl+Enter)")
        run_btn.setObjectName("accent")
        run_btn.clicked.connect(self._run)
        btns.addStretch()
        btns.addWidget(run_btn)
        clear_btn = QPushButton("Clear Output")
        clear_btn.clicked.connect(self._output.clear)
        btns.addWidget(clear_btn)
        layout.addLayout(btns)

        from PyQt6.QtGui import QKeySequence, QShortcut
        sc = QShortcut(QKeySequence("Ctrl+Return"), self)
        sc.activated.connect(self._run)

    def _run(self):
        code = self._input.toPlainText().strip()
        if not code:
            return
        self._history.append(code)
        self._hist_idx = len(self._history)
        self._output.appendPlainText(f">>> {code}")
        import sys
        from io import StringIO
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        sys.stdout = StringIO()
        sys.stderr = StringIO()
        try:
            exec(compile(code, "<console>", "exec"), self._context)
            result = sys.stdout.getvalue()
            err = sys.stderr.getvalue()
            if result:
                self._output.appendPlainText(result.rstrip())
            if err:
                self._output.appendHtml(f'<span style="color: #F44747;">{err.rstrip()}</span>')
        except Exception as e:
            self._output.appendHtml(
                f'<span style="color: #F44747;">Error: {e}</span>'
            )
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr
        self._input.clear()

    def add_context(self, key: str, value):
        self._context[key] = value


# ── Batch Processor Dialog ────────────────────────────────────────────────────
class BatchProcessorDialog(QDialog):
    """Batch process multiple GR2 files."""

    def __init__(self, asset_root: str = "D:/ymir work", parent=None):
        super().__init__(parent)
        self.setWindowTitle("Batch Processor")
        self.setMinimumSize(620, 500)
        self._asset_root = asset_root
        self._files: List[str] = []
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(8)

        layout.addWidget(SectionHeader("Input Files"))

        # File list
        self._file_list = QListWidget()
        self._file_list.setSelectionMode(QListWidget.SelectionMode.ExtendedSelection)
        layout.addWidget(self._file_list, 1)

        add_row = QHBoxLayout()
        add_btn = QPushButton("Add Files…")
        add_btn.clicked.connect(self._add_files)
        add_folder_btn = QPushButton("Add Folder…")
        add_folder_btn.clicked.connect(self._add_folder)
        clear_btn = QPushButton("Clear")
        clear_btn.clicked.connect(self._file_list.clear)
        add_row.addWidget(add_btn)
        add_row.addWidget(add_folder_btn)
        add_row.addStretch()
        add_row.addWidget(clear_btn)
        layout.addLayout(add_row)

        layout.addWidget(SectionHeader("Operations"))

        ops_group = QGroupBox("Select Operations")
        ops_layout = QVBoxLayout(ops_group)
        self._op_fix_paths   = QCheckBox("Fix texture paths (normalize to Metin2 format)")
        self._op_fix_paths.setChecked(True)
        self._op_fix_vcount  = QCheckBox("Split meshes exceeding 65535 vertices")
        self._op_fix_weights = QCheckBox("Normalize bone weights (sum to 1.0)")
        self._op_fix_weights.setChecked(True)
        self._op_auto_weight = QCheckBox("Re-compute auto-weights from skeleton")
        self._op_smooth      = QCheckBox("Smooth weights (Laplacian, 2 iterations)")
        for cb in [self._op_fix_paths, self._op_fix_vcount,
                   self._op_fix_weights, self._op_auto_weight, self._op_smooth]:
            ops_layout.addWidget(cb)
        layout.addWidget(ops_group)

        self._output_dir = FilePathInput("Output Dir:", asset_root=self._asset_root, mode="dir")
        self._output_dir.set_path(self._asset_root)
        layout.addWidget(self._output_dir)

        layout.addWidget(HSeparator())

        self._progress = QProgressBar()
        self._progress.setVisible(False)
        layout.addWidget(self._progress)

        btns = QHBoxLayout()
        run_btn = QPushButton("Run Batch")
        run_btn.setObjectName("accent")
        run_btn.clicked.connect(self._run_batch)
        cancel_btn = QPushButton("Close")
        cancel_btn.clicked.connect(self.reject)
        btns.addStretch()
        btns.addWidget(run_btn)
        btns.addWidget(cancel_btn)
        layout.addLayout(btns)

    def _add_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self, "Add GR2 Files", self._asset_root,
            "Granny3D (*.gr2);;All Files (*)"
        )
        for f in files:
            if f not in self._files:
                self._files.append(f)
                self._file_list.addItem(f)

    def _add_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Add Folder", self._asset_root)
        if folder:
            for root, _, fnames in os.walk(folder):
                for fn in fnames:
                    if fn.lower().endswith(".gr2"):
                        fp = os.path.join(root, fn)
                        if fp not in self._files:
                            self._files.append(fp)
                            self._file_list.addItem(fp)

    def _run_batch(self):
        from gr2_parser import GR2Parser, PathFixer, AutoWeightCalculator
        if not self._files:
            QMessageBox.warning(self, "No Files", "Please add GR2 files first.")
            return

        self._progress.setVisible(True)
        self._progress.setMaximum(len(self._files))

        parser = GR2Parser(self._asset_root)
        fixer  = PathFixer(self._asset_root)
        awc    = AutoWeightCalculator()
        out_dir = self._output_dir.path()
        os.makedirs(out_dir, exist_ok=True)

        for i, fp in enumerate(self._files):
            self._progress.setValue(i)
            try:
                gr2 = parser.parse(fp)
                if not gr2.is_valid:
                    continue
                if self._op_fix_paths.isChecked():
                    for mat in gr2.materials:
                        mat.texture_path = fixer.fix_texture_path(mat.texture_path)
                if self._op_fix_vcount.isChecked():
                    gr2 = fixer.fix_vertex_count(gr2)
                if self._op_fix_weights.isChecked():
                    for mesh in gr2.meshes:
                        for v in mesh.vertices:
                            total = sum(v.bone_weights)
                            if total > 1e-6:
                                v.bone_weights = [w / total for w in v.bone_weights]
                if self._op_smooth.isChecked():
                    for mesh in gr2.meshes:
                        mesh.vertices = awc.smooth_weights(mesh.vertices, mesh.indices)
                # Write output
                out_fp = os.path.join(out_dir, os.path.basename(fp))
                parser.write(gr2, out_fp)
            except Exception as e:
                pass

        self._progress.setValue(len(self._files))
        QMessageBox.information(self, "Batch Complete",
                                f"Processed {len(self._files)} files.\nOutput: {out_dir}")


# ── Import GR2 Dialog ─────────────────────────────────────────────────────────
class ImportGR2Dialog(QDialog):
    def __init__(self, asset_root: str = "D:/ymir work", parent=None):
        super().__init__(parent)
        self.setWindowTitle("Import GR2 Model")
        self.setMinimumWidth(480)
        self._path = ""
        layout = QVBoxLayout(self)
        layout.setSpacing(8)

        layout.addWidget(SectionHeader("Import Granny3D Model"))

        self._file_input = FilePathInput(
            "GR2 File:", "D:/ymir work/pc/warrior_m/body/armor.gr2",
            filter_str="Granny3D (*.gr2);;All Files (*)"
        )
        layout.addWidget(self._file_input)

        options_group = QGroupBox("Import Options")
        opt_layout = QVBoxLayout(options_group)
        self._import_skeleton = QCheckBox("Import Skeleton")
        self._import_skeleton.setChecked(True)
        self._import_mesh = QCheckBox("Import Meshes")
        self._import_mesh.setChecked(True)
        self._import_animations = QCheckBox("Import Animations")
        self._import_animations.setChecked(False)
        self._import_materials = QCheckBox("Import Materials")
        self._import_materials.setChecked(True)
        self._auto_weight = QCheckBox("Auto-compute Weights")
        self._auto_weight.setChecked(True)
        for cb in [self._import_skeleton, self._import_mesh,
                   self._import_animations, self._import_materials, self._auto_weight]:
            opt_layout.addWidget(cb)
        layout.addWidget(options_group)

        btns = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        btns.accepted.connect(self._accept)
        btns.rejected.connect(self.reject)
        layout.addWidget(btns)

    def _accept(self):
        p = self._file_input.path()
        if not p:
            QMessageBox.warning(self, "No File", "Please select a GR2 file.")
            return
        self._path = p
        self.accept()

    def get_options(self) -> dict:
        return {
            "path": self._path,
            "import_skeleton":   self._import_skeleton.isChecked(),
            "import_mesh":       self._import_mesh.isChecked(),
            "import_animations": self._import_animations.isChecked(),
            "import_materials":  self._import_materials.isChecked(),
            "auto_weight":       self._auto_weight.isChecked(),
        }


# ── Help Dialog ───────────────────────────────────────────────────────────────
class HelpDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Help & Keyboard Shortcuts")
        self.setMinimumSize(600, 500)
        layout = QVBoxLayout(self)

        browser = QTextBrowser()
        browser.setHtml(_HELP_HTML)
        browser.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(browser, 1)

        btn = QPushButton("Close")
        btn.clicked.connect(self.accept)
        layout.addWidget(btn)


_HELP_HTML = """
<style>
  body { color: #DCDCDC; font-family: 'Segoe UI', sans-serif; font-size: 13px; }
  h2 { color: #C89B3C; border-bottom: 1px solid #C89B3C; }
  h3 { color: #4EC9B0; }
  code { color: #9CDCFE; background: #2D2D30; padding: 2px 5px; border-radius: 3px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 4px 10px; border-bottom: 1px solid #3F3F46; }
  th { color: #C89B3C; text-align: left; }
  .warn { color: #CE9178; }
  .err { color: #F44747; }
  .ok { color: #4EC9B0; }
</style>

<h2>Metin2 World Editor ReMIX — Help</h2>

<h3>Keyboard Shortcuts — World Editor</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td><code>W A S D</code></td><td>Move camera (fly mode)</td></tr>
  <tr><td><code>Q / E</code></td><td>Camera up / down</td></tr>
  <tr><td><code>F</code></td><td>Focus on selected object</td></tr>
  <tr><td><code>F6</code></td><td>Insert object at cursor</td></tr>
  <tr><td><code>Delete</code></td><td>Delete selected object</td></tr>
  <tr><td><code>G</code></td><td>Move gizmo (Grab)</td></tr>
  <tr><td><code>R</code></td><td>Rotate gizmo</td></tr>
  <tr><td><code>S</code></td><td>Scale gizmo</td></tr>
  <tr><td><code>Ctrl+Z</code></td><td>Undo</td></tr>
  <tr><td><code>Ctrl+Y</code></td><td>Redo</td></tr>
  <tr><td><code>Ctrl+S</code></td><td>Save map</td></tr>
  <tr><td><code>Middle Mouse</code></td><td>Pan</td></tr>
  <tr><td><code>Right Mouse + Drag</code></td><td>Look around</td></tr>
  <tr><td><code>Scroll</code></td><td>Zoom</td></tr>
</table>

<h3>Keyboard Shortcuts — Armor / Weight Editor</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td><code>B</code></td><td>Toggle brush mode</td></tr>
  <tr><td><code>[ / ]</code></td><td>Decrease / Increase brush size</td></tr>
  <tr><td><code>Ctrl+A</code></td><td>Select all vertices</td></tr>
  <tr><td><code>Alt+Click</code></td><td>Sample bone weights</td></tr>
  <tr><td><code>Ctrl+Z</code></td><td>Undo weight paint</td></tr>
  <tr><td><code>M</code></td><td>Mirror weights (L→R)</td></tr>
  <tr><td><code>Ctrl+E</code></td><td>Export GR2</td></tr>
</table>

<h3>Common Metin2 Bugs & Fixes</h3>
<table>
  <tr><th>Symptom</th><th>Cause</th><th>Fix</th></tr>
  <tr>
    <td class="err">White / invisible model</td>
    <td>Wrong texture path</td>
    <td>Use Batch Processor → Fix Paths. Ensure paths use backslash and lowercase.</td>
  </tr>
  <tr>
    <td class="err">Model not visible in-game</td>
    <td>Missing <code>Bip01</code> root bone</td>
    <td>Ensure skeleton starts with <code>Bip01</code>.</td>
  </tr>
  <tr>
    <td class="err">Stretching at knees/elbows</td>
    <td>Bad vertex weights</td>
    <td>Use Smooth Weights tool + manual fix on problem vertices.</td>
  </tr>
  <tr>
    <td class="err">Helmet not attached</td>
    <td>Wrong bone: use <code>Bip01 Head</code></td>
    <td>Re-assign vertices to <code>Bip01 Head</code> with weight 1.0.</td>
  </tr>
  <tr>
    <td class="warn">Crash on map load</td>
    <td>Vertex count &gt; 65535</td>
    <td>Batch Processor → Split meshes.</td>
  </tr>
  <tr>
    <td class="warn">Wrong texture colors</td>
    <td>Texture not in DXT1/DXT3/DXT5 format</td>
    <td>Convert DDS to DXT5 using Pillow or TexConv.</td>
  </tr>
</table>

<h3>Asset Directory Structure</h3>
<pre>
D:/ymir work/
├── pc/            ← Player characters
│   ├── warrior_m/body/
│   ├── assassin_w/body/
│   └── ...
├── monster/       ← Monster GR2 models
├── item/          ← Item models
├── environment/   ← Map objects
│   ├── tree/
│   ├── building/
│   └── ...
└── map/           ← Map data files
</pre>
"""
