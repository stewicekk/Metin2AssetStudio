# C++ Qt UI Skill

## Component Tree
```
MainWindow (QMainWindow)
├── menuBar (File/Edit/View/Help)
├── mainToolBar (Add/Duplicate/Delete/Play/Export/Import)
├── centralWidget (QSplitter horizontal)
│   ├── leftSplitter (vertical)
│   │   ├── EmitterListPanel (QTreeWidget + search)
│   │   └── leftTabs (PropsPanel | Validation)
│   ├── ViewportWidget (QOpenGLWidget)
│   └── rightTabs (SceneSettingsPanel | PresetsPanel | TimelinePanel)
└── statusBar
```

## Patterns
- Signals/slots for all inter-component communication
- MainWindow owns state (emitters vector, undo stacks)
- PropsPanel uses QGridLayout for 2-column property grids
- EmitterList uses QTreeWidget with custom UserRole data
- All text goes through Translation::tr(key) — never raw strings
- Animation: QTimer(16ms) → viewport->tick(dt) → update()

## Layout Rules
- Search: QLineEdit with placeholder from i18n
- Groups: collapsible QTreeWidget top-level items
- Curve editors: placeholder buttons (full implementation in Phase 2)
