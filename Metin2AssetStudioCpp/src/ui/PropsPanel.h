#pragma once
#include <QWidget>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QGridLayout>
#include <QComboBox>
#include <QDoubleSpinBox>
#include <QCheckBox>
#include <QLabel>
#include <QPushButton>
#include <QLineEdit>
#include "core/Types.h"

class PropsPanel : public QWidget {
    Q_OBJECT
public:
    explicit PropsPanel(QWidget* parent = nullptr);
    void setEmitter(const Emitter* emitter);
    void refresh();
signals:
    void emitterChanged(uint64_t uid, const std::string& field, double value);
    void emitterObjectChanged(const Emitter& emitter);
private:
    void setupUI();
    QWidget* createSection(const std::string& titleKey, QWidget* content);
    QDoubleSpinBox* addField(QGridLayout* grid, int row, const std::string& labelKey, const std::string& field, double value, double min, double max, double step, int decimals = 4);
    QComboBox* addCombo(QGridLayout* grid, int row, const std::string& labelKey, const std::string& field, const QStringList& items, int current);
    QCheckBox* addCheck(QGridLayout* grid, int row, const std::string& labelKey, const std::string& field, bool checked);
    QLineEdit* addText(QGridLayout* grid, int row, const std::string& labelKey, const std::string& field, const std::string& value);

    const Emitter* currentEmitter = nullptr;
    QScrollArea* scrollArea = nullptr;
    QWidget* scrollContent = nullptr;
    QVBoxLayout* mainLayout = nullptr;

    QList<QWidget*> fieldWidgets;
};
