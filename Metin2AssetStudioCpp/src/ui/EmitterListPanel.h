#pragma once
#include <QWidget>
#include <QTreeWidget>
#include <QLineEdit>
#include <QPushButton>
#include <vector>
#include <cstdint>
#include "core/Types.h"

class EmitterListPanel : public QWidget {
    Q_OBJECT
public:
    explicit EmitterListPanel(QWidget* parent = nullptr);
    void setEmitters(const std::vector<Emitter>* emitters);
    void setActiveId(uint64_t id);
    uint64_t activeId() const { return activeId_; }
    void refresh();
signals:
    void emitterSelected(uint64_t id);
    void emitterVisibilityChanged(uint64_t id, bool visible);
    void emitterDuplicateRequested(uint64_t id);
    void emitterDeleteRequested(uint64_t id);
    void emitterMoveUpRequested(uint64_t id);
    void emitterMoveDownRequested(uint64_t id);
private:
    void setupUI();
    void onSearchChanged(const QString& text);
    void onItemClicked(QTreeWidgetItem* item, int col);
    void onContextMenu(const QPoint& pos);
    QTreeWidgetItem* findEmitterItem(uint64_t id);

    QTreeWidget* tree = nullptr;
    QLineEdit* searchInput = nullptr;
    QPushButton *btnDuplicate, *btnDelete, *btnMoveUp, *btnMoveDown;
    const std::vector<Emitter>* currentEmitters = nullptr;
    uint64_t activeId_ = 0;
    std::string searchText;
};
