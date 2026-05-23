#pragma once
#include <QWidget>
#include <QComboBox>
#include <QDoubleSpinBox>
#include <QCheckBox>
#include <QPushButton>

class SceneSettingsPanel : public QWidget {
    Q_OBJECT
public:
    explicit SceneSettingsPanel(QWidget* parent = nullptr);
signals:
    void vpScaleChanged(double);
    void showGridChanged(bool);
    void showAxisChanged(bool);
    void envFovChanged(double);
    void bloomChanged(bool);
    void fogChanged(bool);
    void floorChanged(bool);
    void resetCameraRequested();
private:
    void setupUI();
    QDoubleSpinBox *vpScaleSpin, *fovSpin;
    QCheckBox *gridCheck, *axisCheck, *bloomCheck, *fogCheck, *floorCheck;
    QPushButton *btnResetCam, *btnResetProj;
    QComboBox *themeCombo;
};
