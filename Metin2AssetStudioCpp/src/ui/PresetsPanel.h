#pragma once
#include <QWidget>
#include <QListWidget>
#include <QLineEdit>
#include <QPushButton>
#include <QJsonArray>
#include <vector>
#include "core/Types.h"

class PresetsPanel : public QWidget {
    Q_OBJECT
public:
    explicit PresetsPanel(QWidget* parent = nullptr);
    void loadPresets(const QJsonArray& presets);
signals:
    void presetApplied(const Emitter& preset);
private:
    void setupUI();
    void onSearchChanged(const QString& text);
    void onApplyClicked();
    struct PresetEntry { std::string name; std::string category; Emitter emitter; };
    QLineEdit* searchInput;
    QListWidget* presetList;
    QPushButton* btnApply;
    std::vector<PresetEntry> presets;
};
