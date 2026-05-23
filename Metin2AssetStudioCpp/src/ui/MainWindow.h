#pragma once
#include <QMainWindow>
#include <QSplitter>
#include <QTabWidget>
#include <QToolBar>
#include <QStatusBar>
#include <QTimer>
#include <vector>
#include "core/Types.h"
#include "EmitterListPanel.h"
#include "PropsPanel.h"
#include "ViewportWidget.h"
#include "TimelinePanel.h"
#include "PresetsPanel.h"
#include "SceneSettingsPanel.h"

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget* parent = nullptr);
    ~MainWindow();
    void addEmitter(const std::string& name = "");
    void deleteEmitter(uint64_t id);
    void duplicateEmitter(uint64_t id);
protected:
    void closeEvent(QCloseEvent* event) override;
private:
    void setupMenuBar();
    void setupToolBar();
    void setupCentralWidget();
    void setupStatusBar();
    void setupShortcuts();
    void setupTimer();
    void onUpdateEmitter(uint64_t id, const std::string& field, double value);
    void onEmitterChanged(const Emitter& emitter);
    void onSelectEmitter(uint64_t id);
    void onPlayPause();
    void onExportMse();
    void onExportEff();
    void onExportMde();
    void onImport();
    void onUndo();
    void onRedo();
    void onResetProject();
    void pushHistory();
    void autoSave();
    bool loadAutoSave();
    uint64_t nextUid() { return uidCounter++; }
    Emitter createDefaultEmitter(const std::string& name = "");

    std::vector<Emitter> emitters;
    std::vector<std::vector<Emitter>> undoStack;
    std::vector<std::vector<Emitter>> redoStack;
    uint64_t uidCounter = 1;
    uint64_t activeEmitterId = 0;
    bool playing = false;
    double globalTime = 0;
    AppSettings settings;

    QSplitter* mainSplitter = nullptr;
    QSplitter* leftSplitter = nullptr;
    QTabWidget* leftTabs = nullptr;
    QTabWidget* rightTabs = nullptr;
    EmitterListPanel* emitterList = nullptr;
    PropsPanel* propsPanel = nullptr;
    ViewportWidget* viewport = nullptr;
    TimelinePanel* timeline = nullptr;
    PresetsPanel* presetsPanel = nullptr;
    SceneSettingsPanel* sceneSettings = nullptr;
    QTimer* animTimer = nullptr;
    QToolBar* mainToolBar = nullptr;
};
