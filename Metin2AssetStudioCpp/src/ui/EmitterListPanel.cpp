#include "EmitterListPanel.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QHeaderView>
#include <QMenu>
#include <QAction>
#include <QApplication>
#include <QClipboard>
#include <QSet>
#include <algorithm>
#include <cctype>

EmitterListPanel::EmitterListPanel(QWidget* parent)
    : QWidget(parent)
{
    setupUI();
}

void EmitterListPanel::setupUI()
{
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->setSpacing(2);

    searchInput = new QLineEdit(this);
    searchInput->setPlaceholderText(tr("Search emitters..."));
    searchInput->setClearButtonEnabled(true);
    layout->addWidget(searchInput);

    tree = new QTreeWidget(this);
    tree->setAlternatingRowColors(true);
    tree->setRootIsDecorated(true);
    tree->setContextMenuPolicy(Qt::CustomContextMenu);
    tree->setSelectionMode(QAbstractItemView::ExtendedSelection);
    tree->setHeaderLabels({QString(), tr("Name"), tr("Group")});
    tree->setColumnWidth(0, 34);
    tree->header()->setStretchLastSection(true);
    layout->addWidget(tree);

    auto* btnLayout = new QHBoxLayout();
    btnLayout->setSpacing(2);

    btnDuplicate = new QPushButton(QString::fromUtf8("\xF0\x9F\x93\x8B"), this);
    btnDuplicate->setToolTip(tr("Duplicate"));
    btnDuplicate->setFixedWidth(30);
    btnLayout->addWidget(btnDuplicate);

    btnDelete = new QPushButton(QString::fromUtf8("\xE2\x9C\x95"), this);
    btnDelete->setToolTip(tr("Delete"));
    btnDelete->setFixedWidth(30);
    btnLayout->addWidget(btnDelete);

    btnMoveUp = new QPushButton(QString::fromUtf8("\xE2\xAC\x86"), this);
    btnMoveUp->setToolTip(tr("Move Up"));
    btnMoveUp->setFixedWidth(30);
    btnLayout->addWidget(btnMoveUp);

    btnMoveDown = new QPushButton(QString::fromUtf8("\xE2\xAC\x87"), this);
    btnMoveDown->setToolTip(tr("Move Down"));
    btnMoveDown->setFixedWidth(30);
    btnLayout->addWidget(btnMoveDown);

    btnLayout->addStretch();
    layout->addLayout(btnLayout);

    connect(searchInput, &QLineEdit::textChanged,
        this, &EmitterListPanel::onSearchChanged);
    connect(tree, &QTreeWidget::itemClicked,
        this, &EmitterListPanel::onItemClicked);
    connect(tree, &QTreeWidget::customContextMenuRequested,
        this, &EmitterListPanel::onContextMenu);

    connect(btnDuplicate, &QPushButton::clicked, this, [this]() {
        if (activeId_) emit emitterDuplicateRequested(activeId_);
    });
    connect(btnDelete, &QPushButton::clicked, this, [this]() {
        if (activeId_) emit emitterDeleteRequested(activeId_);
    });
    connect(btnMoveUp, &QPushButton::clicked, this, [this]() {
        if (activeId_) emit emitterMoveUpRequested(activeId_);
    });
    connect(btnMoveDown, &QPushButton::clicked, this, [this]() {
        if (activeId_) emit emitterMoveDownRequested(activeId_);
    });
}

void EmitterListPanel::setEmitters(const std::vector<Emitter>* emitters)
{
    currentEmitters = emitters;
}

void EmitterListPanel::setActiveId(uint64_t id)
{
    activeId_ = id;
}

void EmitterListPanel::refresh()
{
    if (!currentEmitters) return;
    tree->clear();

    std::map<std::string, std::vector<const Emitter*>> groups;
    for (const auto& e : *currentEmitters) {
        std::string group = e.group;
        if (group.empty()) group = "Ungrouped";
        groups[group].push_back(&e);
    }

    bool hasFilter = !searchText.empty();
    std::string filterLower = searchText;
    std::transform(filterLower.begin(), filterLower.end(), filterLower.begin(),
        [](unsigned char c) { return std::tolower(c); });

    for (auto& [groupName, groupEmitters] : groups) {
        if (hasFilter) {
            bool groupMatches = true;
            std::string gLower = groupName;
            std::transform(gLower.begin(), gLower.end(), gLower.begin(),
                [](unsigned char c) { return std::tolower(c); });
            if (gLower.find(filterLower) == std::string::npos) {
                bool anyMatch = false;
                for (const auto* e : groupEmitters) {
                    std::string nLower = e->name;
                    std::transform(nLower.begin(), nLower.end(), nLower.begin(),
                        [](unsigned char c) { return std::tolower(c); });
                    if (nLower.find(filterLower) != std::string::npos) {
                        anyMatch = true;
                        break;
                    }
                }
                if (!anyMatch) continue;
            }
        }

        auto* groupItem = new QTreeWidgetItem();
        QFont groupFont = groupItem->font(0);
        groupFont.setBold(true);
        groupItem->setFont(0, groupFont);
        groupItem->setText(1, QString::fromStdString(groupName));
        groupItem->setFlags(groupItem->flags() & ~Qt::ItemIsSelectable);
        groupItem->setChildIndicatorPolicy(QTreeWidgetItem::ShowIndicator);

        for (const auto* e : groupEmitters) {
            if (hasFilter) {
                std::string nLower = e->name;
                std::transform(nLower.begin(), nLower.end(), nLower.begin(),
                    [](unsigned char c) { return std::tolower(c); });
                if (nLower.find(filterLower) == std::string::npos &&
                    groupName.find(filterLower) == std::string::npos) {
                    continue;
                }
            }

            auto* item = new QTreeWidgetItem();
            item->setCheckState(0, e->visible ? Qt::Checked : Qt::Unchecked);
            item->setText(1, QString::fromStdString(e->name));
            item->setText(2, QString::fromStdString(e->group));
            item->setData(0, Qt::UserRole, static_cast<qulonglong>(e->uid));
            item->setData(1, Qt::UserRole, static_cast<qulonglong>(e->uid));

            if (e->uid == activeId_) {
                item->setSelected(true);
            }

            groupItem->addChild(item);
        }

        tree->addTopLevelItem(groupItem);
        if (groupItem->childCount() > 0) {
            groupItem->setExpanded(true);
        }
    }
}

void EmitterListPanel::onSearchChanged(const QString& text)
{
    searchText = text.toStdString();
    refresh();
}

void EmitterListPanel::onItemClicked(QTreeWidgetItem* item, int col)
{
    if (!item) return;

    if (col == 0) {
        uint64_t uid = static_cast<uint64_t>(item->data(0, Qt::UserRole).toULongLong());
        if (uid == 0) return;
        bool visible = (item->checkState(0) == Qt::Checked);
        emit emitterVisibilityChanged(uid, visible);
    } else {
        uint64_t uid = static_cast<uint64_t>(item->data(1, Qt::UserRole).toULongLong());
        if (uid == 0) return;
        activeId_ = uid;
        emit emitterSelected(uid);
    }
}

void EmitterListPanel::onContextMenu(const QPoint& pos)
{
    auto* item = tree->itemAt(pos);
    if (!item) return;

    uint64_t uid = static_cast<uint64_t>(item->data(1, Qt::UserRole).toULongLong());
    if (uid == 0) return;

    QMenu menu(this);

    auto* dupAction = menu.addAction(tr("Duplicate"));
    connect(dupAction, &QAction::triggered, this, [this, uid]() {
        emit emitterDuplicateRequested(uid);
    });

    auto* delAction = menu.addAction(tr("Delete"));
    connect(delAction, &QAction::triggered, this, [this, uid]() {
        emit emitterDeleteRequested(uid);
    });

    menu.addSeparator();

    auto* upAction = menu.addAction(tr("Move Up"));
    connect(upAction, &QAction::triggered, this, [this, uid]() {
        emit emitterMoveUpRequested(uid);
    });

    auto* downAction = menu.addAction(tr("Move Down"));
    connect(downAction, &QAction::triggered, this, [this, uid]() {
        emit emitterMoveDownRequested(uid);
    });

    menu.addSeparator();

    auto* copyAction = menu.addAction(tr("Copy Name"));
    connect(copyAction, &QAction::triggered, this, [item]() {
        QApplication::clipboard()->setText(item->text(1));
    });

    menu.exec(tree->viewport()->mapToGlobal(pos));
}

QTreeWidgetItem* EmitterListPanel::findEmitterItem(uint64_t id)
{
    for (int i = 0; i < tree->topLevelItemCount(); ++i) {
        auto* group = tree->topLevelItem(i);
        for (int j = 0; j < group->childCount(); ++j) {
            auto* child = group->child(j);
            uint64_t uid = static_cast<uint64_t>(child->data(1, Qt::UserRole).toULongLong());
            if (uid == id) return child;
        }
    }
    return nullptr;
}
