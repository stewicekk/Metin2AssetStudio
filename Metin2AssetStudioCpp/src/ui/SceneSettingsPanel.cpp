#include "SceneSettingsPanel.h"
#include <QVBoxLayout>
#include <QGridLayout>
#include <QGroupBox>
#include <QLabel>

SceneSettingsPanel::SceneSettingsPanel(QWidget* parent)
    : QWidget(parent)
{
    setupUI();
}

void SceneSettingsPanel::setupUI()
{
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(4, 4, 4, 4);
    layout->setSpacing(4);

    // Viewport section
    {
        auto* grid = new QGridLayout();
        grid->setSpacing(2);
        int r = 0;

        grid->addWidget(new QLabel(tr("VP Scale")), r, 0);
        vpScaleSpin = new QDoubleSpinBox();
        vpScaleSpin->setRange(0.1, 3.0);
        vpScaleSpin->setSingleStep(0.1);
        vpScaleSpin->setValue(1.0);
        grid->addWidget(vpScaleSpin, r++, 1);

        gridCheck = new QCheckBox(tr("Show Grid"));
        gridCheck->setChecked(true);
        grid->addWidget(gridCheck, r++, 0, 1, 2);

        axisCheck = new QCheckBox(tr("Show Axis"));
        axisCheck->setChecked(true);
        grid->addWidget(axisCheck, r++, 0, 1, 2);

        grid->addWidget(new QLabel(tr("FOV")), r, 0);
        fovSpin = new QDoubleSpinBox();
        fovSpin->setRange(10, 120);
        fovSpin->setSingleStep(1);
        fovSpin->setValue(60);
        grid->addWidget(fovSpin, r++, 1);

        auto* viewportGroup = new QGroupBox(tr("Viewport"));
        viewportGroup->setLayout(grid);
        layout->addWidget(viewportGroup);
    }

    // Environment section
    {
        auto* envGroup = new QGroupBox(tr("Environment"));

        auto* envLayout = new QVBoxLayout(envGroup);

        bloomCheck = new QCheckBox(tr("Bloom"));
        bloomCheck->setChecked(false);
        envLayout->addWidget(bloomCheck);

        fogCheck = new QCheckBox(tr("Fog"));
        fogCheck->setChecked(false);
        envLayout->addWidget(fogCheck);

        floorCheck = new QCheckBox(tr("Floor"));
        floorCheck->setChecked(true);
        envLayout->addWidget(floorCheck);

        layout->addWidget(envGroup);
    }

    // Theme section
    {
        auto* themeGroup = new QGroupBox(tr("Theme"));
        auto* themeLayout = new QVBoxLayout(themeGroup);

        themeCombo = new QComboBox();
        themeCombo->addItems({
            tr("Dark"),
            tr("Light"),
            tr("Midnight"),
            tr("Forest"),
            tr("Ocean")
        });
        themeCombo->setCurrentIndex(0);
        themeLayout->addWidget(themeCombo);

        layout->addWidget(themeGroup);
    }

    // Actions section
    {
        auto* actionsGroup = new QGroupBox(tr("Actions"));
        auto* actionsLayout = new QVBoxLayout(actionsGroup);

        btnResetCam = new QPushButton(tr("Reset Camera"));
        actionsLayout->addWidget(btnResetCam);

        btnResetProj = new QPushButton(tr("Reset Project"));
        actionsLayout->addWidget(btnResetProj);

        layout->addWidget(actionsGroup);
    }

    layout->addStretch();

    // Connect signals
    connect(vpScaleSpin, QOverload<double>::of(&QDoubleSpinBox::valueChanged),
        this, &SceneSettingsPanel::vpScaleChanged);
    connect(gridCheck, &QCheckBox::toggled,
        this, &SceneSettingsPanel::showGridChanged);
    connect(axisCheck, &QCheckBox::toggled,
        this, &SceneSettingsPanel::showAxisChanged);
    connect(fovSpin, QOverload<double>::of(&QDoubleSpinBox::valueChanged),
        this, &SceneSettingsPanel::envFovChanged);
    connect(bloomCheck, &QCheckBox::toggled,
        this, &SceneSettingsPanel::bloomChanged);
    connect(fogCheck, &QCheckBox::toggled,
        this, &SceneSettingsPanel::fogChanged);
    connect(floorCheck, &QCheckBox::toggled,
        this, &SceneSettingsPanel::floorChanged);
    connect(btnResetCam, &QPushButton::clicked,
        this, &SceneSettingsPanel::resetCameraRequested);
}
