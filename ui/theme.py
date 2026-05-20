# ui/theme.py
# Metin2 World Editor — Dark Theme (Metin2 / WorldEditor ReMIX style)
# ============================================================================

from PyQt6.QtGui import QPalette, QColor, QFont
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import QApplication


DARK_BACKGROUND   = "#1E1E1E"
DARK_SURFACE      = "#252526"
DARK_PANEL        = "#2D2D30"
DARK_BORDER       = "#3F3F46"
DARK_HOVER        = "#3E3E42"
DARK_SELECTED     = "#094771"
DARK_ACCENT       = "#C89B3C"      # Metin2 gold
DARK_ACCENT2      = "#D4A851"
DARK_TEXT         = "#DCDCDC"
DARK_TEXT_DIM     = "#9D9D9D"
DARK_TEXT_BRIGHT  = "#FFFFFF"
DARK_ERROR        = "#F44747"
DARK_WARNING      = "#CE9178"
DARK_SUCCESS      = "#4EC9B0"
DARK_SCROLLBAR    = "#424242"


def apply_dark_theme(app: QApplication) -> None:
    """Apply the Metin2 dark theme to the entire application."""
    app.setStyle("Fusion")

    palette = QPalette()
    bg   = QColor(DARK_BACKGROUND)
    surf = QColor(DARK_SURFACE)
    pnl  = QColor(DARK_PANEL)
    bdr  = QColor(DARK_BORDER)
    txt  = QColor(DARK_TEXT)
    dim  = QColor(DARK_TEXT_DIM)
    acc  = QColor(DARK_ACCENT)
    sel  = QColor(DARK_SELECTED)
    err  = QColor(DARK_ERROR)

    palette.setColor(QPalette.ColorRole.Window,          bg)
    palette.setColor(QPalette.ColorRole.WindowText,      txt)
    palette.setColor(QPalette.ColorRole.Base,            surf)
    palette.setColor(QPalette.ColorRole.AlternateBase,   pnl)
    palette.setColor(QPalette.ColorRole.ToolTipBase,     pnl)
    palette.setColor(QPalette.ColorRole.ToolTipText,     txt)
    palette.setColor(QPalette.ColorRole.Text,            txt)
    palette.setColor(QPalette.ColorRole.Button,          pnl)
    palette.setColor(QPalette.ColorRole.ButtonText,      txt)
    palette.setColor(QPalette.ColorRole.BrightText,      err)
    palette.setColor(QPalette.ColorRole.Link,            acc)
    palette.setColor(QPalette.ColorRole.Highlight,       sel)
    palette.setColor(QPalette.ColorRole.HighlightedText, QColor(DARK_TEXT_BRIGHT))

    # Disabled
    palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.WindowText, dim)
    palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.Text,       dim)
    palette.setColor(QPalette.ColorGroup.Disabled, QPalette.ColorRole.ButtonText, dim)

    app.setPalette(palette)
    app.setStyleSheet(_STYLESHEET)


_STYLESHEET = f"""
/* ── Main Window ─────────────────────────────────────────────────────────── */
QMainWindow {{
    background-color: {DARK_BACKGROUND};
}}

/* ── Menu Bar ────────────────────────────────────────────────────────────── */
QMenuBar {{
    background-color: {DARK_SURFACE};
    color: {DARK_TEXT};
    border-bottom: 1px solid {DARK_BORDER};
    font-size: 13px;
    padding: 2px 0px;
}}
QMenuBar::item {{
    background: transparent;
    padding: 4px 10px;
}}
QMenuBar::item:selected {{
    background-color: {DARK_HOVER};
    border-radius: 3px;
}}
QMenuBar::item:pressed {{
    background-color: {DARK_SELECTED};
}}

/* ── Menus ───────────────────────────────────────────────────────────────── */
QMenu {{
    background-color: {DARK_PANEL};
    color: {DARK_TEXT};
    border: 1px solid {DARK_BORDER};
    padding: 4px 0px;
    border-radius: 4px;
}}
QMenu::item {{
    padding: 5px 28px 5px 16px;
}}
QMenu::item:selected {{
    background-color: {DARK_SELECTED};
    color: {DARK_TEXT_BRIGHT};
}}
QMenu::separator {{
    height: 1px;
    background: {DARK_BORDER};
    margin: 4px 8px;
}}

/* ── Toolbars ────────────────────────────────────────────────────────────── */
QToolBar {{
    background-color: {DARK_SURFACE};
    border-bottom: 1px solid {DARK_BORDER};
    spacing: 3px;
    padding: 3px;
}}
QToolBar::separator {{
    background: {DARK_BORDER};
    width: 1px;
    margin: 4px 6px;
}}
QToolButton {{
    background-color: transparent;
    color: {DARK_TEXT};
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 12px;
    min-width: 28px;
    min-height: 24px;
}}
QToolButton:hover {{
    background-color: {DARK_HOVER};
    border-color: {DARK_BORDER};
}}
QToolButton:pressed, QToolButton:checked {{
    background-color: {DARK_SELECTED};
    border-color: {DARK_ACCENT};
}}

/* ── Status Bar ──────────────────────────────────────────────────────────── */
QStatusBar {{
    background-color: {DARK_SURFACE};
    color: {DARK_TEXT};
    border-top: 1px solid {DARK_BORDER};
    font-size: 12px;
    padding: 2px 8px;
}}
QStatusBar::item {{ border: none; }}

/* ── Dock Widgets ────────────────────────────────────────────────────────── */
QDockWidget {{
    color: {DARK_TEXT};
    font-size: 12px;
    titlebar-close-icon: none;
}}
QDockWidget::title {{
    background-color: {DARK_PANEL};
    padding: 5px 8px;
    border-bottom: 1px solid {DARK_BORDER};
    text-align: left;
}}
QDockWidget::close-button, QDockWidget::float-button {{
    background: transparent;
    border: none;
    icon-size: 14px;
}}

/* ── Tab Widget ──────────────────────────────────────────────────────────── */
QTabWidget::pane {{
    border: 1px solid {DARK_BORDER};
    background-color: {DARK_SURFACE};
    border-radius: 2px;
}}
QTabBar::tab {{
    background-color: {DARK_PANEL};
    color: {DARK_TEXT_DIM};
    border: 1px solid {DARK_BORDER};
    border-bottom: none;
    padding: 6px 14px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    font-size: 12px;
    min-width: 80px;
}}
QTabBar::tab:selected {{
    background-color: {DARK_SURFACE};
    color: {DARK_ACCENT};
    border-bottom: 2px solid {DARK_ACCENT};
}}
QTabBar::tab:hover:!selected {{
    background-color: {DARK_HOVER};
    color: {DARK_TEXT};
}}

/* ── Tree / List Views ───────────────────────────────────────────────────── */
QTreeView, QListView, QTableView {{
    background-color: {DARK_SURFACE};
    color: {DARK_TEXT};
    border: 1px solid {DARK_BORDER};
    alternate-background-color: {DARK_PANEL};
    selection-background-color: {DARK_SELECTED};
    outline: none;
    gridline-color: {DARK_BORDER};
    font-size: 12px;
}}
QTreeView::item, QListView::item, QTableView::item {{
    padding: 3px 4px;
    border: none;
}}
QTreeView::item:hover, QListView::item:hover {{
    background-color: {DARK_HOVER};
}}
QTreeView::branch {{
    background: {DARK_SURFACE};
}}
QTreeView::branch:closed:has-children {{
    image: url(resources/arrow_right.svg);
}}
QTreeView::branch:open:has-children {{
    image: url(resources/arrow_down.svg);
}}
QHeaderView::section {{
    background-color: {DARK_PANEL};
    color: {DARK_TEXT_DIM};
    padding: 4px 8px;
    border: none;
    border-right: 1px solid {DARK_BORDER};
    border-bottom: 1px solid {DARK_BORDER};
    font-size: 11px;
    font-weight: bold;
}}

/* ── Push Buttons ────────────────────────────────────────────────────────── */
QPushButton {{
    background-color: {DARK_PANEL};
    color: {DARK_TEXT};
    border: 1px solid {DARK_BORDER};
    border-radius: 4px;
    padding: 5px 14px;
    font-size: 12px;
    min-height: 24px;
}}
QPushButton:hover {{
    background-color: {DARK_HOVER};
    border-color: {DARK_ACCENT};
    color: {DARK_TEXT_BRIGHT};
}}
QPushButton:pressed {{
    background-color: {DARK_SELECTED};
}}
QPushButton:disabled {{
    color: {DARK_TEXT_DIM};
    border-color: {DARK_BORDER};
}}
QPushButton#accent {{
    background-color: {DARK_ACCENT};
    color: #1E1E1E;
    border: none;
    font-weight: bold;
}}
QPushButton#accent:hover {{
    background-color: {DARK_ACCENT2};
}}

/* ── Line Edits / Spin Boxes ─────────────────────────────────────────────── */
QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox {{
    background-color: {DARK_BACKGROUND};
    color: {DARK_TEXT};
    border: 1px solid {DARK_BORDER};
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 12px;
    min-height: 22px;
    selection-background-color: {DARK_SELECTED};
}}
QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus {{
    border-color: {DARK_ACCENT};
}}
QComboBox::drop-down {{
    border: none;
    width: 20px;
}}
QComboBox QAbstractItemView {{
    background-color: {DARK_PANEL};
    color: {DARK_TEXT};
    border: 1px solid {DARK_BORDER};
    selection-background-color: {DARK_SELECTED};
}}
QSpinBox::up-button, QSpinBox::down-button,
QDoubleSpinBox::up-button, QDoubleSpinBox::down-button {{
    background-color: {DARK_HOVER};
    border: none;
    width: 16px;
}}

/* ── Sliders ─────────────────────────────────────────────────────────────── */
QSlider::groove:horizontal {{
    height: 4px;
    background: {DARK_BORDER};
    border-radius: 2px;
}}
QSlider::handle:horizontal {{
    background: {DARK_ACCENT};
    width: 14px;
    height: 14px;
    border-radius: 7px;
    margin: -5px 0;
}}
QSlider::sub-page:horizontal {{
    background: {DARK_ACCENT};
    border-radius: 2px;
}}
QSlider::groove:vertical {{
    width: 4px;
    background: {DARK_BORDER};
    border-radius: 2px;
}}
QSlider::handle:vertical {{
    background: {DARK_ACCENT};
    width: 14px;
    height: 14px;
    border-radius: 7px;
    margin: 0 -5px;
}}
QSlider::sub-page:vertical {{
    background: {DARK_ACCENT};
    border-radius: 2px;
}}

/* ── Scroll Bars ─────────────────────────────────────────────────────────── */
QScrollBar:vertical {{
    background: {DARK_SURFACE};
    width: 10px;
    border: none;
}}
QScrollBar::handle:vertical {{
    background: {DARK_SCROLLBAR};
    border-radius: 5px;
    min-height: 30px;
}}
QScrollBar::handle:vertical:hover {{ background: {DARK_ACCENT}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0px; }}
QScrollBar:horizontal {{
    background: {DARK_SURFACE};
    height: 10px;
    border: none;
}}
QScrollBar::handle:horizontal {{
    background: {DARK_SCROLLBAR};
    border-radius: 5px;
    min-width: 30px;
}}
QScrollBar::handle:horizontal:hover {{ background: {DARK_ACCENT}; }}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{ width: 0px; }}

/* ── Check / Radio Boxes ─────────────────────────────────────────────────── */
QCheckBox, QRadioButton {{
    color: {DARK_TEXT};
    font-size: 12px;
    spacing: 6px;
}}
QCheckBox::indicator, QRadioButton::indicator {{
    width: 14px;
    height: 14px;
    border: 1px solid {DARK_BORDER};
    border-radius: 3px;
    background: {DARK_BACKGROUND};
}}
QCheckBox::indicator:checked {{
    background: {DARK_ACCENT};
    border-color: {DARK_ACCENT};
}}
QRadioButton::indicator {{ border-radius: 7px; }}
QRadioButton::indicator:checked {{
    background: {DARK_ACCENT};
    border-color: {DARK_ACCENT};
}}

/* ── Group Box ───────────────────────────────────────────────────────────── */
QGroupBox {{
    border: 1px solid {DARK_BORDER};
    border-radius: 5px;
    margin-top: 14px;
    padding: 10px 6px 6px 6px;
    color: {DARK_ACCENT};
    font-size: 12px;
    font-weight: bold;
}}
QGroupBox::title {{
    subcontrol-origin: margin;
    subcontrol-position: top left;
    left: 10px;
    padding: 0 4px;
    color: {DARK_ACCENT};
}}

/* ── Progress Bar ────────────────────────────────────────────────────────── */
QProgressBar {{
    background-color: {DARK_BORDER};
    border-radius: 4px;
    color: {DARK_TEXT_BRIGHT};
    text-align: center;
    font-size: 11px;
    height: 16px;
}}
QProgressBar::chunk {{
    background-color: {DARK_ACCENT};
    border-radius: 4px;
}}

/* ── Splitter ────────────────────────────────────────────────────────────── */
QSplitter::handle {{
    background-color: {DARK_BORDER};
}}
QSplitter::handle:horizontal {{ width: 2px; }}
QSplitter::handle:vertical {{ height: 2px; }}

/* ── Plain Text Edit ─────────────────────────────────────────────────────── */
QPlainTextEdit, QTextEdit {{
    background-color: {DARK_BACKGROUND};
    color: {DARK_TEXT};
    border: 1px solid {DARK_BORDER};
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    selection-background-color: {DARK_SELECTED};
}}

/* ── Tooltip ─────────────────────────────────────────────────────────────── */
QToolTip {{
    background-color: {DARK_PANEL};
    color: {DARK_TEXT};
    border: 1px solid {DARK_ACCENT};
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
}}

/* ── Label ───────────────────────────────────────────────────────────────── */
QLabel {{
    color: {DARK_TEXT};
    font-size: 12px;
}}
QLabel#title {{
    color: {DARK_ACCENT};
    font-size: 14px;
    font-weight: bold;
}}
QLabel#dim {{
    color: {DARK_TEXT_DIM};
    font-size: 11px;
}}
QLabel#error {{
    color: {DARK_ERROR};
}}
QLabel#success {{
    color: {DARK_SUCCESS};
}}

/* ── Dialog ──────────────────────────────────────────────────────────────── */
QDialog {{
    background-color: {DARK_BACKGROUND};
    color: {DARK_TEXT};
}}

/* ── Frame ───────────────────────────────────────────────────────────────── */
QFrame[frameShape="4"] {{ /* HLine */
    color: {DARK_BORDER};
    max-height: 1px;
}}
QFrame[frameShape="5"] {{ /* VLine */
    color: {DARK_BORDER};
    max-width: 1px;
}}
"""


def get_mono_font(size: int = 11) -> QFont:
    font = QFont("Consolas")
    font.setPointSize(size)
    font.setStyleHint(QFont.StyleHint.Monospace)
    return font


def get_ui_font(size: int = 12) -> QFont:
    font = QFont("Segoe UI")
    font.setPointSize(size)
    return font
