# ui/widgets.py
# Metin2 World Editor — Custom Reusable Widgets
# ============================================================================

import os
from typing import Optional, List, Callable

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QSlider, QDoubleSpinBox, QSpinBox, QLineEdit, QFrame,
    QGroupBox, QTreeWidget, QTreeWidgetItem, QListWidget,
    QListWidgetItem, QScrollArea, QSizePolicy, QToolButton,
    QColorDialog, QFileDialog, QProgressBar, QSplitter,
    QComboBox, QCheckBox
)
from PyQt6.QtCore import Qt, pyqtSignal, QSize, QTimer
from PyQt6.QtGui import QColor, QPainter, QPixmap, QIcon, QFont, QPen, QBrush

from ui.theme import (
    DARK_ACCENT, DARK_SURFACE, DARK_PANEL, DARK_BORDER,
    DARK_TEXT, DARK_TEXT_DIM, DARK_ERROR, DARK_SUCCESS,
    DARK_BACKGROUND, DARK_SELECTED
)


# ── Color Button ─────────────────────────────────────────────────────────────
class ColorButton(QPushButton):
    color_changed = pyqtSignal(QColor)

    def __init__(self, color: QColor = QColor("#C89B3C"), parent=None):
        super().__init__(parent)
        self._color = color
        self.setFixedSize(40, 22)
        self._update_style()
        self.clicked.connect(self._pick_color)

    def color(self) -> QColor:
        return self._color

    def set_color(self, color: QColor):
        self._color = color
        self._update_style()

    def _pick_color(self):
        col = QColorDialog.getColor(self._color, self, "Choose Color")
        if col.isValid():
            self._color = col
            self._update_style()
            self.color_changed.emit(col)

    def _update_style(self):
        self.setStyleSheet(
            f"QPushButton {{ background-color: {self._color.name()}; "
            f"border: 1px solid {DARK_BORDER}; border-radius: 3px; }}"
        )


# ── Labeled Slider ───────────────────────────────────────────────────────────
class LabeledSlider(QWidget):
    value_changed = pyqtSignal(float)

    def __init__(
        self,
        label: str,
        minimum: float = 0.0,
        maximum: float = 1.0,
        value: float = 0.5,
        decimals: int = 2,
        parent=None,
    ):
        super().__init__(parent)
        self._min = minimum
        self._max = maximum
        self._decimals = decimals
        self._factor = 10 ** decimals

        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(6)

        lbl = QLabel(label)
        lbl.setFixedWidth(90)
        lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        layout.addWidget(lbl)

        self._slider = QSlider(Qt.Orientation.Horizontal)
        self._slider.setRange(int(minimum * self._factor), int(maximum * self._factor))
        self._slider.setValue(int(value * self._factor))
        layout.addWidget(self._slider, 1)

        self._spin = QDoubleSpinBox()
        self._spin.setRange(minimum, maximum)
        self._spin.setDecimals(decimals)
        self._spin.setValue(value)
        self._spin.setFixedWidth(64)
        self._spin.setSingleStep(0.01)
        layout.addWidget(self._spin)

        self._slider.valueChanged.connect(self._on_slider)
        self._spin.valueChanged.connect(self._on_spin)

    def _on_slider(self, v: int):
        real = v / self._factor
        self._spin.blockSignals(True)
        self._spin.setValue(real)
        self._spin.blockSignals(False)
        self.value_changed.emit(real)

    def _on_spin(self, v: float):
        self._slider.blockSignals(True)
        self._slider.setValue(int(v * self._factor))
        self._slider.blockSignals(False)
        self.value_changed.emit(v)

    def value(self) -> float:
        return self._spin.value()

    def set_value(self, v: float):
        self._spin.setValue(v)


# ── File Path Input ───────────────────────────────────────────────────────────
class FilePathInput(QWidget):
    path_changed = pyqtSignal(str)

    def __init__(
        self,
        label: str = "Path:",
        placeholder: str = "",
        filter_str: str = "All Files (*)",
        mode: str = "open",
        parent=None,
    ):
        super().__init__(parent)
        self._filter = filter_str
        self._mode = mode
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(4)

        if label:
            lbl = QLabel(label)
            lbl.setFixedWidth(80)
            lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            layout.addWidget(lbl)

        self._edit = QLineEdit()
        self._edit.setPlaceholderText(placeholder)
        layout.addWidget(self._edit, 1)

        btn = QPushButton("...")
        btn.setFixedWidth(28)
        btn.setToolTip("Browse")
        btn.clicked.connect(self._browse)
        layout.addWidget(btn)

        self._edit.textChanged.connect(self.path_changed)

    def path(self) -> str:
        return self._edit.text()

    def set_path(self, path: str):
        self._edit.setText(path)

    def _browse(self):
        if self._mode == "open":
            path, _ = QFileDialog.getOpenFileName(self, "Open File", self._edit.text(), self._filter)
        elif self._mode == "save":
            path, _ = QFileDialog.getSaveFileName(self, "Save File", self._edit.text(), self._filter)
        else:
            path = QFileDialog.getExistingDirectory(self, "Select Folder", self._edit.text())
        if path:
            self._edit.setText(path)


# ── Section Header ────────────────────────────────────────────────────────────
class SectionHeader(QLabel):
    def __init__(self, text: str, parent=None):
        super().__init__(text, parent)
        self.setStyleSheet(
            f"QLabel {{ color: {DARK_ACCENT}; font-weight: bold; font-size: 12px; "
            f"border-bottom: 1px solid {DARK_ACCENT}; padding-bottom: 4px; margin-top: 6px; }}"
        )


# ── Separator ────────────────────────────────────────────────────────────────
class HSeparator(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFrameShape(QFrame.Shape.HLine)
        self.setFrameShadow(QFrame.Shadow.Sunken)
        self.setStyleSheet(f"color: {DARK_BORDER};")


# ── Log Panel ────────────────────────────────────────────────────────────────
class LogPanel(QWidget):
    """Scrollable log panel with color-coded severity levels."""

    COLORS = {
        "INFO":    DARK_TEXT,
        "WARNING": "#CE9178",
        "ERROR":   DARK_ERROR,
        "SUCCESS": DARK_SUCCESS,
        "DEBUG":   DARK_TEXT_DIM,
    }

    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        from PyQt6.QtWidgets import QPlainTextEdit
        self._text = QPlainTextEdit()
        self._text.setReadOnly(True)
        self._text.setMaximumBlockCount(2000)
        self._text.setFont(QFont("Consolas", 10))
        layout.addWidget(self._text)

        btn_layout = QHBoxLayout()
        btn_layout.setContentsMargins(4, 2, 4, 2)
        clear_btn = QPushButton("Clear")
        clear_btn.setFixedHeight(20)
        clear_btn.clicked.connect(self._text.clear)
        btn_layout.addStretch()
        btn_layout.addWidget(clear_btn)
        layout.addLayout(btn_layout)

    def log(self, message: str, level: str = "INFO"):
        color = self.COLORS.get(level.upper(), DARK_TEXT)
        prefix = f"[{level.upper():<7}]"
        from PyQt6.QtWidgets import QPlainTextEdit
        self._text.appendHtml(
            f'<span style="color:{color};">{prefix} {message}</span>'
        )
        self._text.verticalScrollBar().setValue(
            self._text.verticalScrollBar().maximum()
        )

    def info(self, msg: str):    self.log(msg, "INFO")
    def warning(self, msg: str): self.log(msg, "WARNING")
    def error(self, msg: str):   self.log(msg, "ERROR")
    def success(self, msg: str): self.log(msg, "SUCCESS")
    def debug(self, msg: str):   self.log(msg, "DEBUG")


# ── Weight Bar ────────────────────────────────────────────────────────────────
class WeightBar(QWidget):
    """Visual bar showing bone weight distribution for a vertex."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._weights: List[tuple] = []   # [(name, weight, color), ...]
        self.setFixedHeight(18)
        self.setMinimumWidth(120)

    def set_weights(self, weights: List[tuple]):
        self._weights = weights
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        w = self.width()
        h = self.height()

        if not self._weights:
            painter.fillRect(0, 0, w, h, QColor(DARK_BORDER))
            return

        BONE_COLORS = [
            "#C89B3C", "#4EC9B0", "#9CDCFE", "#CE9178",
            "#6A9955", "#C586C0", "#DCDCAA", "#F44747",
        ]

        x = 0
        for i, (name, weight, _) in enumerate(self._weights):
            bw = int(w * weight)
            color = QColor(BONE_COLORS[i % len(BONE_COLORS)])
            painter.fillRect(x, 0, bw, h, color)
            x += bw

        painter.setPen(QPen(QColor(DARK_BORDER)))
        painter.drawRect(0, 0, w - 1, h - 1)


# ── Mini Viewport Label ───────────────────────────────────────────────────────
class ViewportPlaceholder(QWidget):
    """Placeholder shown when OpenGL context is not available."""

    def __init__(self, text: str = "3D Viewport", parent=None):
        super().__init__(parent)
        self._text = text
        self.setMinimumSize(400, 300)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.fillRect(self.rect(), QColor("#141414"))

        # Grid
        p.setPen(QPen(QColor("#2A2A2A"), 1))
        step = 40
        for x in range(0, self.width(), step):
            p.drawLine(x, 0, x, self.height())
        for y in range(0, self.height(), step):
            p.drawLine(0, y, self.width(), y)

        # Center cross
        cx, cy = self.width() // 2, self.height() // 2
        p.setPen(QPen(QColor(DARK_BORDER), 1))
        p.drawLine(cx - 20, cy, cx + 20, cy)
        p.drawLine(cx, cy - 20, cx, cy + 20)

        # Label
        p.setPen(QPen(QColor(DARK_TEXT_DIM)))
        p.setFont(QFont("Segoe UI", 14))
        p.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter, self._text)


# ── Object Browser Item ───────────────────────────────────────────────────────
class AssetBrowserWidget(QWidget):
    """File-system asset browser rooted at the ymir work directory."""
    asset_selected = pyqtSignal(str)

    def __init__(self, root_path: str = "D:/ymir work", parent=None):
        super().__init__(parent)
        self._root = root_path
        layout = QVBoxLayout(self)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(4)

        # Search bar
        search_row = QHBoxLayout()
        self._search = QLineEdit()
        self._search.setPlaceholderText("Search assets…")
        search_row.addWidget(self._search)
        layout.addLayout(search_row)

        # Tree
        self._tree = QTreeWidget()
        self._tree.setHeaderLabel("Assets")
        self._tree.setRootIsDecorated(True)
        self._tree.itemDoubleClicked.connect(self._on_double_click)
        layout.addWidget(self._tree, 1)

        # Refresh button
        btn = QPushButton("Refresh")
        btn.clicked.connect(self.refresh)
        layout.addWidget(btn)

        self._search.textChanged.connect(self._filter)
        self.refresh()

    def refresh(self):
        self._tree.clear()
        self._populate(self._root, self._tree.invisibleRootItem(), depth=0)

    def _populate(self, path: str, parent_item, depth: int):
        if depth > 4 or not os.path.isdir(path):
            return
        try:
            entries = sorted(os.listdir(path))
        except PermissionError:
            return

        for name in entries:
            full = os.path.join(path, name)
            item = QTreeWidgetItem([name])
            item.setData(0, Qt.ItemDataRole.UserRole, full)
            if os.path.isdir(full):
                item.setIcon(0, self._folder_icon())
                parent_item.addChild(item)
                self._populate(full, item, depth + 1)
            else:
                ext = os.path.splitext(name)[1].lower()
                if ext in (".gr2", ".dds", ".tga", ".msh", ".mtl", ".mdatr"):
                    item.setIcon(0, self._file_icon(ext))
                    parent_item.addChild(item)

    def _on_double_click(self, item: QTreeWidgetItem, col: int):
        path = item.data(0, Qt.ItemDataRole.UserRole)
        if path and os.path.isfile(path):
            self.asset_selected.emit(path)

    def _filter(self, text: str):
        def set_visible(item, visible):
            item.setHidden(not visible)
            for i in range(item.childCount()):
                set_visible(item.child(i), visible)

        text = text.lower()
        root = self._tree.invisibleRootItem()
        for i in range(root.childCount()):
            child = root.child(i)
            self._filter_item(child, text)

    def _filter_item(self, item: QTreeWidgetItem, text: str) -> bool:
        match = text in item.text(0).lower()
        child_match = False
        for i in range(item.childCount()):
            if self._filter_item(item.child(i), text):
                child_match = True
        visible = match or child_match
        item.setHidden(not visible)
        return visible

    @staticmethod
    def _folder_icon() -> QIcon:
        px = QPixmap(16, 16)
        px.fill(QColor(DARK_ACCENT))
        return QIcon(px)

    @staticmethod
    def _file_icon(ext: str) -> QIcon:
        colors = {".gr2": "#4EC9B0", ".dds": "#9CDCFE", ".tga": "#9CDCFE"}
        px = QPixmap(16, 16)
        px.fill(QColor(colors.get(ext, DARK_TEXT_DIM)))
        return QIcon(px)

    def set_root(self, path: str):
        self._root = path
        self.refresh()


# ── Bone Weight Table Row ─────────────────────────────────────────────────────
class BoneWeightRow(QWidget):
    weight_changed = pyqtSignal(int, float)   # bone_index, new_weight

    def __init__(self, bone_index: int, bone_name: str, weight: float = 0.0, parent=None):
        super().__init__(parent)
        self._idx = bone_index
        layout = QHBoxLayout(self)
        layout.setContentsMargins(2, 1, 2, 1)
        layout.setSpacing(6)

        lbl = QLabel(bone_name)
        lbl.setFixedWidth(180)
        lbl.setStyleSheet(f"color: {DARK_TEXT};")
        layout.addWidget(lbl)

        self._bar = WeightBar()
        layout.addWidget(self._bar, 1)

        self._spin = QDoubleSpinBox()
        self._spin.setRange(0.0, 1.0)
        self._spin.setDecimals(4)
        self._spin.setValue(weight)
        self._spin.setFixedWidth(72)
        self._spin.setSingleStep(0.01)
        layout.addWidget(self._spin)

        self._spin.valueChanged.connect(self._on_changed)
        self._bar.set_weights([(bone_name, weight, DARK_ACCENT)])

    def _on_changed(self, v: float):
        self.weight_changed.emit(self._idx, v)
        self._bar.set_weights([("", v, DARK_ACCENT)])

    def set_weight(self, w: float):
        self._spin.blockSignals(True)
        self._spin.setValue(w)
        self._spin.blockSignals(False)
        self._bar.set_weights([("", w, DARK_ACCENT)])


# ── Status Bar Helper ─────────────────────────────────────────────────────────
class StatusBarCoords(QWidget):
    """Shows X/Y/Z coordinates in the status bar."""

    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        self._x = QLabel("X: 0.000")
        self._y = QLabel("Y: 0.000")
        self._z = QLabel("Z: 0.000")
        for w in (self._x, self._y, self._z):
            w.setStyleSheet(f"color: {DARK_TEXT_DIM}; font-size: 11px; font-family: Consolas;")
            layout.addWidget(w)

    def set_coords(self, x: float, y: float, z: float):
        self._x.setText(f"X: {x:.3f}")
        self._y.setText(f"Y: {y:.3f}")
        self._z.setText(f"Z: {z:.3f}")


# ── Animated Spinner ──────────────────────────────────────────────────────────
class Spinner(QWidget):
    """Simple animated loading spinner."""

    def __init__(self, size: int = 24, parent=None):
        super().__init__(parent)
        self._angle = 0
        self._size = size
        self.setFixedSize(size, size)
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._tick)

    def start(self):
        self._timer.start(50)
        self.show()

    def stop(self):
        self._timer.stop()
        self.hide()

    def _tick(self):
        self._angle = (self._angle + 30) % 360
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.translate(self._size / 2, self._size / 2)
        p.rotate(self._angle)
        n = 8
        for i in range(n):
            alpha = int(255 * (i + 1) / n)
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(QColor(200, 155, 60, alpha)))
            r = self._size / 2 - 3
            p.drawEllipse(-r * 0.25, -r + 2, r * 0.5, r * 0.5)
            p.rotate(360 / n)
