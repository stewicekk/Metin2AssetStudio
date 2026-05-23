#include "MainWindow.h"
#include "core/MseExporter.h"
#include "core/MseParser.h"
#include "core/EffExporter.h"
#include "core/MdeExporter.h"
#include "core/ProjectManager.h"
#include "i18n/Translation.h"
#include <QMenuBar>
#include <QMenu>
#include <QAction>
#include <QFileDialog>
#include <QMessageBox>
#include <QInputDialog>
#include <QCloseEvent>
#include <QApplication>
#include <QClipboard>
#include <set>

MainWindow::MainWindow(QWidget* parent)
    : QMainWindow(parent)
{
    setWindowTitle("Metin2 Asset Studio C++ v2.0.0");
    resize(1600, 1000);

    setupMenuBar();
    setupToolBar();
    setupCentralWidget();
    setupStatusBar();
    setupShortcuts();
    setupTimer();

    addEmitter("Emitter_1");

    if (!loadAutoSave()) {
        pushHistory();
    }
}

MainWindow::~MainWindow() {}

Emitter MainWindow::createDefaultEmitter(const std::string& name)
{
    Emitter e;
    e.uid = nextUid();
    e.name = name.empty() ? "Emitter_" + std::to_string(e.uid) : name;
    e.visible = true;
    e.color = "#4fc3f7";
    e.blend = BlendType::Alpha;
    e.shape = ShapeType::Point;
    e.rate = 10.0;
    e.burst = 0;
    e.life = 1.5;
    e.lifeRnd = 0.3;
    e.maxP = 50;
    e.loop = true;
    e.cycle = 0.0;
    e.delay = 0.0;
    e.speed = 150.0;
    e.speedRnd = 50.0;
    e.spread = 0.0;
    e.dirYaw = 0.0;
    e.dirPitch = 0.0;
    e.gravity = 0.0;
    e.windX = 0.0;
    e.windZ = 0.0;
    e.drag = 0.0;
    e.turb = 0.0;
    e.turbFreq = 0.0;
    e.sizeX = 8.0;
    e.sizeRnd = 0.0;
    e.sizeY = 8.0;
    e.sizeNonUniform = false;
    e.spin = 0.0;
    e.spinRnd = 0.0;
    e.initRot = 0.0;
    e.initRotRnd = 0.0;
    e.velStretch = 0.0;
    e.builtinTex = "circle";
    e.texPath = "";
    e.sheetCols = 1;
    e.sheetRows = 1;
    e.uvAnim = UVAnimType::Loop;
    e.animFPS = 30.0;
    e.coordType = CoordType::World;
    e.rotType = RotType::Random;
    e.uvScrollX = 0.0;
    e.uvScrollY = 0.0;
    e.shapeRadius = 0.35;
    e.groundBounce = false;
    e.bounceFac = 0.4;
    e.attractorStr = 0.0;
    e.attractorY = 0.5;
    e.emitSurface = EmitterSurfaceType::None;
    e.colorMod = ColorModType::Multiply;
    return e;
}

void MainWindow::addEmitter(const std::string& name)
{
    pushHistory();
    emitters.push_back(createDefaultEmitter(name));
    activeEmitterId = emitters.back().uid;
    emitterList->setEmitters(&emitters);
    emitterList->setActiveId(activeEmitterId);
    emitterList->refresh();
    propsPanel->setEmitter(&emitters.back());
    update();
    statusBar()->showMessage(
        Translation::tr("emitter_added") + " " + emitters.back().name.c_str());
}

void MainWindow::deleteEmitter(uint64_t id)
{
    pushHistory();
    for (auto it = emitters.begin(); it != emitters.end(); ++it) {
        if (it->uid == id) {
            emitters.erase(it);
            break;
        }
    }
    if (activeEmitterId == id) {
        activeEmitterId = emitters.empty() ? 0 : emitters.front().uid;
    }
    emitterList->setEmitters(&emitters);
    emitterList->setActiveId(activeEmitterId);
    emitterList->refresh();
    if (!emitters.empty()) {
        auto* active = std::find_if(emitters.begin(), emitters.end(),
            [this](const Emitter& e) { return e.uid == activeEmitterId; });
        propsPanel->setEmitter(active != emitters.end() ? &*active : &emitters.front());
    } else {
        propsPanel->setEmitter(nullptr);
    }
    statusBar()->showMessage(Translation::tr("emitter_deleted"));
}

void MainWindow::duplicateEmitter(uint64_t id)
{
    pushHistory();
    for (const auto& e : emitters) {
        if (e.uid == id) {
            Emitter copy = e;
            copy.uid = nextUid();
            copy.name = e.name + "_copy";
            emitters.push_back(copy);
            activeEmitterId = copy.uid;
            break;
        }
    }
    emitterList->setEmitters(&emitters);
    emitterList->setActiveId(activeEmitterId);
    emitterList->refresh();
    auto* active = std::find_if(emitters.begin(), emitters.end(),
        [this](const Emitter& e) { return e.uid == activeEmitterId; });
    if (active != emitters.end()) {
        propsPanel->setEmitter(&*active);
    }
}

void MainWindow::setupMenuBar()
{
    auto* fileMenu = menuBar()->addMenu(Translation::tr("menu_file"));

    auto* newAction = fileMenu->addAction(Translation::tr("action_new"));
    connect(newAction, &QAction::triggered, this, [this]() {
        emitters.clear();
        undoStack.clear();
        redoStack.clear();
        activeEmitterId = 0;
        playing = false;
        globalTime = 0;
        addEmitter("Emitter_1");
    });

    auto* openAction = fileMenu->addAction(Translation::tr("action_open"));
    connect(openAction, &QAction::triggered, this, [this]() {
        QString path = QFileDialog::getOpenFileName(this,
            Translation::tr("open_project"), "", "JSON (*.json)");
        if (path.isEmpty()) return;
        // TODO: project load
    });

    auto* saveAction = fileMenu->addAction(Translation::tr("action_save"));
    connect(saveAction, &QAction::triggered, this, [this]() {
        QString path = QFileDialog::getSaveFileName(this,
            Translation::tr("save_project"), "", "JSON (*.json)");
        if (path.isEmpty()) return;
        // TODO: project save
    });

    auto* saveAsAction = fileMenu->addAction(Translation::tr("action_save_as"));
    connect(saveAsAction, &QAction::triggered, this, [this]() {
        QString path = QFileDialog::getSaveFileName(this,
            Translation::tr("save_project_as"), "", "JSON (*.json)");
        if (path.isEmpty()) return;
    });

    fileMenu->addSeparator();

    auto* importAction = fileMenu->addAction(Translation::tr("action_import_mse"));
    connect(importAction, &QAction::triggered, this, &MainWindow::onImport);

    auto* exportMseAction = fileMenu->addAction(Translation::tr("action_export_mse"));
    connect(exportMseAction, &QAction::triggered, this, &MainWindow::onExportMse);

    auto* exportEffAction = fileMenu->addAction(Translation::tr("action_export_eff"));
    connect(exportEffAction, &QAction::triggered, this, &MainWindow::onExportEff);

    auto* exportMdeAction = fileMenu->addAction(Translation::tr("action_export_mde"));
    connect(exportMdeAction, &QAction::triggered, this, &MainWindow::onExportMde);

    fileMenu->addSeparator();

    auto* exitAction = fileMenu->addAction(Translation::tr("action_exit"));
    connect(exitAction, &QAction::triggered, this, &QWidget::close);

    auto* editMenu = menuBar()->addMenu(Translation::tr("menu_edit"));

    auto* undoAction = editMenu->addAction(Translation::tr("action_undo"));
    connect(undoAction, &QAction::triggered, this, &MainWindow::onUndo);

    auto* redoAction = editMenu->addAction(Translation::tr("action_redo"));
    connect(redoAction, &QAction::triggered, this, &MainWindow::onRedo);

    editMenu->addSeparator();

    auto* resetAction = editMenu->addAction(Translation::tr("action_reset_project"));
    connect(resetAction, &QAction::triggered, this, &MainWindow::onResetProject);

    auto* viewMenu = menuBar()->addMenu(Translation::tr("menu_view"));

    auto* toggleToolbarAction = viewMenu->addAction(Translation::tr("action_toggle_toolbar"));
    toggleToolbarAction->setCheckable(true);
    toggleToolbarAction->setChecked(true);
    connect(toggleToolbarAction, &QAction::toggled, this, [this](bool checked) {
        mainToolBar->setVisible(checked);
    });

    auto* toggleStatusbarAction = viewMenu->addAction(Translation::tr("action_toggle_statusbar"));
    toggleStatusbarAction->setCheckable(true);
    toggleStatusbarAction->setChecked(true);
    connect(toggleStatusbarAction, &QAction::toggled, this, [this](bool checked) {
        statusBar()->setVisible(checked);
    });

    auto* helpMenu = menuBar()->addMenu(Translation::tr("menu_help"));

    auto* aboutAction = helpMenu->addAction(Translation::tr("action_about"));
    connect(aboutAction, &QAction::triggered, this, [this]() {
        QMessageBox::about(this, Translation::tr("about_title"),
            Translation::tr("about_text"));
    });
}

void MainWindow::setupToolBar()
{
    mainToolBar = addToolBar(Translation::tr("toolbar_main"));
    mainToolBar->setToolButtonStyle(Qt::ToolButtonTextOnly);

    auto* addAction = mainToolBar->addAction(Translation::tr("add_emitter"));
    connect(addAction, &QAction::triggered, this, [this]() { addEmitter(); });

    auto* dupAction = mainToolBar->addAction(Translation::tr("duplicate"));
    connect(dupAction, &QAction::triggered, this, [this]() {
        if (activeEmitterId) duplicateEmitter(activeEmitterId);
    });

    auto* delAction = mainToolBar->addAction(Translation::tr("delete"));
    connect(delAction, &QAction::triggered, this, [this]() {
        if (activeEmitterId) deleteEmitter(activeEmitterId);
    });

    mainToolBar->addSeparator();

    auto* playAction = mainToolBar->addAction(Translation::tr("play"));
    connect(playAction, &QAction::triggered, this, &MainWindow::onPlayPause);

    auto* stopAction = mainToolBar->addAction(Translation::tr("stop"));
    connect(stopAction, &QAction::triggered, this, [this]() {
        playing = false;
        globalTime = 0;
        timeline->setPlaying(false);
        timeline->setTime(0);
        for (auto& e : emitters) {
            (void)e;
        }
    });

    mainToolBar->addSeparator();

    auto* expAction = mainToolBar->addAction(Translation::tr("export_mse"));
    connect(expAction, &QAction::triggered, this, &MainWindow::onExportMse);

    auto* impAction = mainToolBar->addAction(Translation::tr("import"));
    connect(impAction, &QAction::triggered, this, &MainWindow::onImport);
}

void MainWindow::setupCentralWidget()
{
    mainSplitter = new QSplitter(Qt::Horizontal, this);

    leftSplitter = new QSplitter(Qt::Vertical);

    emitterList = new EmitterListPanel(this);
    leftSplitter->addWidget(emitterList);

    leftTabs = new QTabWidget();
    propsPanel = new PropsPanel(this);
    leftTabs->addTab(propsPanel, Translation::tr("tab_properties"));
    leftSplitter->addWidget(leftTabs);

    mainSplitter->addWidget(leftSplitter);

    viewport = new ViewportWidget(this);
    mainSplitter->addWidget(viewport);

    rightTabs = new QTabWidget();
    sceneSettings = new SceneSettingsPanel(this);
    rightTabs->addTab(sceneSettings, Translation::tr("tab_scene"));

    presetsPanel = new PresetsPanel(this);
    rightTabs->addTab(presetsPanel, Translation::tr("tab_presets"));

    timeline = new TimelinePanel(this);
    rightTabs->addTab(timeline, Translation::tr("tab_timeline"));

    mainSplitter->addWidget(rightTabs);

    mainSplitter->setStretchFactor(0, 1);
    mainSplitter->setStretchFactor(1, 3);
    mainSplitter->setStretchFactor(2, 1);

    setCentralWidget(mainSplitter);

    connect(emitterList, &EmitterListPanel::emitterSelected,
        this, &MainWindow::onSelectEmitter);
    connect(emitterList, &EmitterListPanel::emitterVisibilityChanged,
        this, [this](uint64_t id, bool visible) {
            for (auto& e : emitters) {
                if (e.uid == id) { e.visible = visible; break; }
            }
        });
    connect(emitterList, &EmitterListPanel::emitterDuplicateRequested,
        this, &MainWindow::duplicateEmitter);
    connect(emitterList, &EmitterListPanel::emitterDeleteRequested,
        this, &MainWindow::deleteEmitter);

    connect(propsPanel, &PropsPanel::emitterChanged,
        this, &MainWindow::onUpdateEmitter);

    connect(viewport, &ViewportWidget::fpsUpdated,
        this, [this](double fps) {
            statusBar()->showMessage(
                QString("FPS: %1 | ").arg(fps, 0, 'f', 1) +
                Translation::tr("emitters") + ": " + QString::number(emitters.size()));
        });

    connect(timeline, &TimelinePanel::playPauseToggled,
        this, [this](bool p) { playing = p; viewport->setPlaying(p); });
    connect(timeline, &TimelinePanel::exportMseRequested,
        this, &MainWindow::onExportMse);
    connect(timeline, &TimelinePanel::exportEffRequested,
        this, &MainWindow::onExportEff);
    connect(timeline, &TimelinePanel::exportMdeRequested,
        this, &MainWindow::onExportMde);
    connect(timeline, &TimelinePanel::importRequested,
        this, &MainWindow::onImport);
}

void MainWindow::setupStatusBar()
{
    statusBar()->showMessage(Translation::tr("ready") + " | " +
        Translation::tr("emitters") + ": 0");
}

void MainWindow::setupShortcuts()
{
    auto* addShortcut = new QShortcut(QKeySequence("Ctrl+N"), this);
    connect(addShortcut, &QShortcut::activated, this, [this]() { addEmitter(); });

    auto* undoShortcut = new QShortcut(QKeySequence("Ctrl+Z"), this);
    connect(undoShortcut, &QShortcut::activated, this, &MainWindow::onUndo);

    auto* redoShortcut = new QShortcut(QKeySequence("Ctrl+Y"), this);
    connect(redoShortcut, &QShortcut::activated, this, &MainWindow::onRedo);

    auto* dupShortcut = new QShortcut(QKeySequence("Ctrl+D"), this);
    connect(dupShortcut, &QShortcut::activated, this, [this]() {
        if (activeEmitterId) duplicateEmitter(activeEmitterId);
    });

    auto* delShortcut = new QShortcut(QKeySequence(Qt::Key_Delete), this);
    connect(delShortcut, &QShortcut::activated, this, [this]() {
        if (activeEmitterId) deleteEmitter(activeEmitterId);
    });

    auto* playShortcut = new QShortcut(QKeySequence(Qt::Key_Space), this);
    connect(playShortcut, &QShortcut::activated, this, &MainWindow::onPlayPause);

    auto* exportShortcut = new QShortcut(QKeySequence("Ctrl+Shift+E"), this);
    connect(exportShortcut, &QShortcut::activated, this, &MainWindow::onExportMse);

    auto* importShortcut = new QShortcut(QKeySequence("Ctrl+O"), this);
    connect(importShortcut, &QShortcut::activated, this, &MainWindow::onImport);
}

void MainWindow::setupTimer()
{
    animTimer = new QTimer(this);
    animTimer->setInterval(16);
    connect(animTimer, &QTimer::timeout, this, [this]() {
        double dt = 0.016;
        if (playing) {
            globalTime += dt;
        }
        viewport->setEmitters(&emitters);
        viewport->tick(dt);
    });
    animTimer->start();
}

void MainWindow::onUpdateEmitter(uint64_t id, const std::string& field, double value)
{
    pushHistory();
    for (auto& e : emitters) {
        if (e.uid == id) {
            if (field == "rate") e.rate = value;
            else if (field == "burst") e.burst = static_cast<int>(value);
            else if (field == "life") e.life = value;
            else if (field == "lifeRnd") e.lifeRnd = value;
            else if (field == "speed") e.speed = value;
            else if (field == "speedRnd") e.speedRnd = value;
            else if (field == "spread") e.spread = value;
            else if (field == "dirYaw") e.dirYaw = value;
            else if (field == "dirPitch") e.dirPitch = value;
            else if (field == "gravity") e.gravity = value;
            else if (field == "windX") e.windX = value;
            else if (field == "windZ") e.windZ = value;
            else if (field == "drag") e.drag = value;
            else if (field == "turb") e.turb = value;
            else if (field == "turbFreq") e.turbFreq = value;
            else if (field == "sizeX") e.sizeX = value;
            else if (field == "sizeRnd") e.sizeRnd = value;
            else if (field == "sizeY") e.sizeY = value;
            else if (field == "spin") e.spin = value;
            else if (field == "spinRnd") e.spinRnd = value;
            else if (field == "initRot") e.initRot = value;
            else if (field == "initRotRnd") e.initRotRnd = value;
            else if (field == "velStretch") e.velStretch = value;
            else if (field == "maxP") e.maxP = static_cast<int>(value);
            else if (field == "cycle") e.cycle = value;
            else if (field == "delay") e.delay = value;
            else if (field == "shapeRadius") e.shapeRadius = value;
            else if (field == "bounceFac") e.bounceFac = value;
            else if (field == "attractorStr") e.attractorStr = value;
            else if (field == "attractorY") e.attractorY = value;
            else if (field == "uvScrollX") e.uvScrollX = value;
            else if (field == "uvScrollY") e.uvScrollY = value;
            else if (field == "animFPS") e.animFPS = value;
            else if (field == "sheetCols") e.sheetCols = static_cast<int>(value);
            else if (field == "sheetRows") e.sheetRows = static_cast<int>(value);
            break;
        }
    }
    viewport->update();
}

void MainWindow::onEmitterChanged(const Emitter& emitter)
{
    pushHistory();
    for (auto& e : emitters) {
        if (e.uid == emitter.uid) {
            e = emitter;
            break;
        }
    }
    emitterList->refresh();
    viewport->update();
}

void MainWindow::onSelectEmitter(uint64_t id)
{
    activeEmitterId = id;
    for (auto& e : emitters) {
        if (e.uid == id) {
            propsPanel->setEmitter(&e);
            break;
        }
    }
}

void MainWindow::onPlayPause()
{
    playing = !playing;
    viewport->setPlaying(playing);
    timeline->setPlaying(playing);
}

void MainWindow::onExportMse()
{
    if (emitters.empty()) return;
    QString path = QFileDialog::getSaveFileName(this,
        Translation::tr("export_mse"), "", "MSE (*.mse)");
    if (path.isEmpty()) return;

    MseExportOptions opts;
    opts.precision = settings.exportPrec;
    std::string result = MseExporter::buildMse(emitters, opts);
    // TODO: write to file
    statusBar()->showMessage(Translation::tr("exported_mse"));
}

void MainWindow::onExportEff()
{
    if (emitters.empty()) return;
    QString path = QFileDialog::getSaveFileName(this,
        Translation::tr("export_eff"), "", "EFF (*.eff)");
    if (path.isEmpty()) return;

    ExportOptions opts;
    opts.precision = settings.exportPrec;
    std::string result = EffExporter::buildEff(emitters, opts);
    statusBar()->showMessage(Translation::tr("exported_eff"));
}

void MainWindow::onExportMde()
{
    if (emitters.empty()) return;
    QString path = QFileDialog::getSaveFileName(this,
        Translation::tr("export_mde"), "", "MDE (*.mde)");
    if (path.isEmpty()) return;

    ExportOptions opts;
    opts.precision = settings.exportPrec;
    std::string result = EffExporter::buildMde(emitters, opts);
    statusBar()->showMessage(Translation::tr("exported_mde"));
}

void MainWindow::onImport()
{
    QString path = QFileDialog::getOpenFileName(this,
        Translation::tr("import_mse"), "", "MSE (*.mse)");
    if (path.isEmpty()) return;

    // TODO: read file, parse, convert to emitters
    pushHistory();
    statusBar()->showMessage(Translation::tr("imported"));
}

void MainWindow::onUndo()
{
    if (undoStack.empty()) return;
    redoStack.push_back(emitters);
    emitters = undoStack.back();
    undoStack.pop_back();
    emitterList->setEmitters(&emitters);
    emitterList->refresh();
    if (!emitters.empty()) {
        activeEmitterId = emitters.front().uid;
        propsPanel->setEmitter(&emitters.front());
    }
    viewport->update();
}

void MainWindow::onRedo()
{
    if (redoStack.empty()) return;
    undoStack.push_back(emitters);
    emitters = redoStack.back();
    redoStack.pop_back();
    emitterList->setEmitters(&emitters);
    emitterList->refresh();
    if (!emitters.empty()) {
        activeEmitterId = emitters.front().uid;
        propsPanel->setEmitter(&emitters.front());
    }
    viewport->update();
}

void MainWindow::onResetProject()
{
    if (QMessageBox::question(this,
        Translation::tr("confirm_reset"),
        Translation::tr("reset_project_warning"),
        QMessageBox::Yes | QMessageBox::No) != QMessageBox::Yes) return;

    pushHistory();
    emitters.clear();
    undoStack.clear();
    redoStack.clear();
    activeEmitterId = 0;
    playing = false;
    globalTime = 0;
    addEmitter("Emitter_1");
    statusBar()->showMessage(Translation::tr("project_reset"));
}

void MainWindow::pushHistory()
{
    undoStack.push_back(emitters);
    if (undoStack.size() > 50) {
        undoStack.erase(undoStack.begin());
    }
    redoStack.clear();
}

void MainWindow::autoSave()
{
    ProjectManager::autoSave(emitters, settings, "autosave");
}

bool MainWindow::loadAutoSave()
{
    std::string name;
    std::vector<Emitter> loaded;
    AppSettings loadedSettings;
    if (ProjectManager::loadAutoSave(loaded, loadedSettings, name)) {
        emitters = loaded;
        settings = loadedSettings;
        if (!emitters.empty()) {
            activeEmitterId = emitters.front().uid;
            emitterList->setEmitters(&emitters);
            emitterList->setActiveId(activeEmitterId);
            emitterList->refresh();
            propsPanel->setEmitter(&emitters.front());
        }
        return true;
    }
    return false;
}

void MainWindow::closeEvent(QCloseEvent* event)
{
    autoSave();
    event->accept();
}
