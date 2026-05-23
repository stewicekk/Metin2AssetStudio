#include "PropsPanel.h"
#include <QGroupBox>
#include <QTimer>
#include <QPainter>
#include <QLinearGradient>
#include <QColorDialog>
#include <set>

static QStringList blendItems() {
    return { "Alpha", "Add", "Modulate" };
}

static QStringList shapeItems() {
    return { "Point", "Cone", "Box", "Sphere", "SphereVol", "Ring", "Disc" };
}

static QStringList uvAnimItems() {
    return { "Loop", "Once", "Rand", "Life" };
}

static QStringList coordItems() {
    return { "World", "Local" };
}

static QStringList rotTypeItems() {
    return { "None", "Random", "Spin" };
}

static QStringList surfaceItems() {
    return { "None", "Surface", "Edge" };
}

static QStringList colorModItems() {
    return { "Multiply", "Add" };
}

static QStringList builtinTexItems() {
    return {
        "circle", "star", "ring", "spark", "smoke", "flare",
        "hexagon", "flame", "diamond", "softGlow", "cross",
        "arrow", "debris"
    };
}

PropsPanel::PropsPanel(QWidget* parent)
    : QWidget(parent)
{
    setupUI();
}

void PropsPanel::setupUI()
{
    auto* outerLayout = new QVBoxLayout(this);
    outerLayout->setContentsMargins(0, 0, 0, 0);

    scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);

    scrollContent = new QWidget();
    mainLayout = new QVBoxLayout(scrollContent);
    mainLayout->setSpacing(4);

    // Section 1: Emitter
    {
        auto* grid = new QGridLayout();
        grid->setSpacing(2);
        int r = 0;
        addText(grid, r++, "name", "name", "");
        addCombo(grid, r++, "blend", "blend", blendItems(), 0);
        addCombo(grid, r++, "shape", "shape", shapeItems(), 0);
        addField(grid, r++, "rate", "rate", 10, 0, 500, 0.1);
        addField(grid, r++, "burst", "burst", 0, 0, 1000, 1, 0);
        addField(grid, r++, "life", "life", 1.5, 0.01, 60, 0.1);
        addField(grid, r++, "lifeRnd", "lifeRnd", 0.3, 0, 10, 0.1);
        addField(grid, r++, "maxP", "maxP", 50, 1, 10000, 1, 0);
        addCheck(grid, r++, "loop", "loop", true);
        addField(grid, r++, "cycle", "cycle", 0, 0, 120, 0.1);
        addField(grid, r++, "delay", "delay", 0, 0, 30, 0.1);
        mainLayout->addWidget(createSection("emitter_section", [grid](){
            auto* w = new QWidget(); w->setLayout(grid); return w;
        }()));
    }

    // Section 2: Physics
    {
        auto* grid = new QGridLayout();
        grid->setSpacing(2);
        int r = 0;
        addField(grid, r++, "speed", "speed", 150, 0, 100, 0.1);
        addField(grid, r++, "speedRnd", "speedRnd", 50, 0, 100, 0.1);
        addField(grid, r++, "spread", "spread", 0, 0, 360, 0.1);
        addField(grid, r++, "dirYaw", "dirYaw", 0, -180, 180, 0.1);
        addField(grid, r++, "dirPitch", "dirPitch", 0, -90, 90, 0.1);
        addField(grid, r++, "gravity", "gravity", 0, -50, 50, 0.1);
        addField(grid, r++, "windX", "windX", 0, -20, 20, 0.1);
        addField(grid, r++, "windZ", "windZ", 0, -20, 20, 0.1);
        addField(grid, r++, "drag", "drag", 0, 0, 1, 0.01);
        addField(grid, r++, "turb", "turb", 0, 0, 20, 0.1);
        addField(grid, r++, "turbFreq", "turbFreq", 0, 0, 20, 0.1);
        mainLayout->addWidget(createSection("physics_section", [grid](){
            auto* w = new QWidget(); w->setLayout(grid); return w;
        }()));
    }

    // Section 3: Size
    {
        auto* grid = new QGridLayout();
        grid->setSpacing(2);
        int r = 0;
        addField(grid, r++, "sizeX", "sizeX", 8, 0.01, 20, 0.1);
        addField(grid, r++, "sizeRnd", "sizeRnd", 0, 0, 10, 0.1);
        addField(grid, r++, "sizeY", "sizeY", 8, 0.01, 20, 0.1);
        addCheck(grid, r++, "sizeNonUniform", "sizeNonUniform", false);
        mainLayout->addWidget(createSection("size_section", [grid](){
            auto* w = new QWidget(); w->setLayout(grid); return w;
        }()));
    }

    // Section 4: Advanced
    {
        auto* grid = new QGridLayout();
        grid->setSpacing(2);
        int r = 0;
        addCombo(grid, r++, "coordType", "coordType", coordItems(), 0);
        addCombo(grid, r++, "rotType", "rotType", rotTypeItems(), 1);
        addField(grid, r++, "uvScrollX", "uvScrollX", 0, -5, 5, 0.1);
        addField(grid, r++, "uvScrollY", "uvScrollY", 0, -5, 5, 0.1);
        addField(grid, r++, "shapeRadius", "shapeRadius", 0.35, 0, 10, 0.01);
        addCheck(grid, r++, "groundBounce", "groundBounce", false);
        addField(grid, r++, "bounceFac", "bounceFac", 0.4, 0, 1, 0.01);
        addField(grid, r++, "attractorStr", "attractorStr", 0, -20, 20, 0.1);
        addField(grid, r++, "attractorY", "attractorY", 0, -10, 10, 0.1);
        addCombo(grid, r++, "emitSurface", "emitSurface", surfaceItems(), 0);
        addCombo(grid, r++, "colorMod", "colorMod", colorModItems(), 0);
        addField(grid, r++, "spin", "spin", 0, -720, 720, 0.1);
        addField(grid, r++, "spinRnd", "spinRnd", 0, 0, 720, 0.1);
        addField(grid, r++, "initRot", "initRot", 0, -360, 360, 0.1);
        addField(grid, r++, "initRotRnd", "initRotRnd", 0, 0, 360, 0.1);
        addField(grid, r++, "velStretch", "velStretch", 0, 0, 5, 0.1);
        mainLayout->addWidget(createSection("advanced_section", [grid](){
            auto* w = new QWidget(); w->setLayout(grid); return w;
        }()));
    }

    // Section 5: Texture
    {
        auto* grid = new QGridLayout();
        grid->setSpacing(2);
        int r = 0;
        addCombo(grid, r++, "builtinTex", "builtinTex", builtinTexItems(), 0);
        addField(grid, r++, "sheetCols", "sheetCols", 1, 1, 16, 1, 0);
        addField(grid, r++, "sheetRows", "sheetRows", 1, 1, 16, 1, 0);
        addCombo(grid, r++, "uvAnim", "uvAnim", uvAnimItems(), 0);
        addField(grid, r++, "animFPS", "animFPS", 30, 0, 60, 1, 0);
        addText(grid, r++, "texPath", "texPath", "");
        mainLayout->addWidget(createSection("texture_section", [grid](){
            auto* w = new QWidget(); w->setLayout(grid); return w;
        }()));
    }

    // Section 6: Curves
    {
        auto* curveGrid = new QGridLayout();
        curveGrid->setSpacing(2);
        int r = 0;

        auto makeCurveRow = [&](const std::string& label) {
            auto* labelW = new QLabel(QString::fromStdString(label));
            curveGrid->addWidget(labelW, r, 0);
            auto* resetBtn = new QPushButton(tr("Reset"));
            auto* flatBtn = new QPushButton(tr("Flat"));
            auto* countLabel = new QLabel("0 pts");
            countLabel->setObjectName(QString::fromStdString(label + "_count"));
            auto* btnLayout = new QHBoxLayout();
            btnLayout->addWidget(resetBtn);
            btnLayout->addWidget(flatBtn);
            btnLayout->addWidget(countLabel);
            btnLayout->addStretch();
            auto* container = new QWidget();
            container->setLayout(btnLayout);
            curveGrid->addWidget(container, r, 1);
            r++;
        };

        makeCurveRow("Size");
        makeCurveRow("Alpha");
        makeCurveRow("Speed");
        makeCurveRow("Spin");

        mainLayout->addWidget(createSection("curves_section", [curveGrid](){
            auto* w = new QWidget(); w->setLayout(curveGrid); return w;
        }()));
    }

    // Section 7: Color Keys
    {
        auto* colorGrid = new QGridLayout();
        colorGrid->setSpacing(2);
        int r = 0;

        auto* gradLabel = new QLabel();
        gradLabel->setMinimumHeight(24);
        gradLabel->setObjectName("gradientPreview");
        colorGrid->addWidget(gradLabel, r++, 0, 1, 2);

        auto makePresetBtn = [&](const QString& name) {
            auto* btn = new QPushButton(name);
            colorGrid->addWidget(btn, r, 0, 1, 2);
            r++;
            return btn;
        };

        makePresetBtn("Fire");
        makePresetBtn("Ice");
        makePresetBtn("Lightning");
        makePresetBtn("Blood");

        mainLayout->addWidget(createSection("colorKeys_section", [colorGrid](){
            auto* w = new QWidget(); w->setLayout(colorGrid); return w;
        }()));
    }

    mainLayout->addStretch();

    scrollArea->setWidget(scrollContent);
    outerLayout->addWidget(scrollArea);
}

QWidget* PropsPanel::createSection(const std::string& titleKey, QWidget* content)
{
    auto* group = new QGroupBox(QString::fromStdString(titleKey));
    auto* layout = new QVBoxLayout(group);
    layout->setContentsMargins(4, 8, 4, 4);
    layout->addWidget(content);
    return group;
}

QDoubleSpinBox* PropsPanel::addField(QGridLayout* grid, int row,
    const std::string& labelKey, const std::string& field,
    double value, double min, double max, double step, int decimals)
{
    auto* label = new QLabel(QString::fromStdString(labelKey));
    auto* spin = new QDoubleSpinBox();
    spin->setRange(min, max);
    spin->setSingleStep(step);
    spin->setDecimals(decimals);
    spin->setValue(value);
    spin->setProperty("field", QString::fromStdString(field));
    spin->setProperty("uid", static_cast<qulonglong>(currentEmitter ? currentEmitter->uid : 0));

    grid->addWidget(label, row, 0);
    grid->addWidget(spin, row, 1);

    fieldWidgets.append(spin);

    if (currentEmitter) {
        connect(spin, QOverload<double>::of(&QDoubleSpinBox::valueChanged),
            this, [this, spin](double val) {
                uint64_t uid = static_cast<uint64_t>(spin->property("uid").toULongLong());
                QString f = spin->property("field").toString();
                emit emitterChanged(uid, f.toStdString(), val);
            });
    }

    return spin;
}

QComboBox* PropsPanel::addCombo(QGridLayout* grid, int row,
    const std::string& labelKey, const std::string& field,
    const QStringList& items, int current)
{
    auto* label = new QLabel(QString::fromStdString(labelKey));
    auto* combo = new QComboBox();
    combo->addItems(items);
    combo->setCurrentIndex(current);
    combo->setProperty("field", QString::fromStdString(field));
    combo->setProperty("uid", static_cast<qulonglong>(currentEmitter ? currentEmitter->uid : 0));

    grid->addWidget(label, row, 0);
    grid->addWidget(combo, row, 1);

    fieldWidgets.append(combo);

    if (currentEmitter) {
        connect(combo, QOverload<int>::of(&QComboBox::currentIndexChanged),
            this, [this, combo](int idx) {
                uint64_t uid = static_cast<uint64_t>(combo->property("uid").toULongLong());
                emit emitterChanged(uid, combo->property("field").toString().toStdString(),
                    static_cast<double>(idx));
            });
    }

    return combo;
}

QCheckBox* PropsPanel::addCheck(QGridLayout* grid, int row,
    const std::string& labelKey, const std::string& field, bool checked)
{
    auto* check = new QCheckBox(QString::fromStdString(labelKey));
    check->setChecked(checked);
    check->setProperty("field", QString::fromStdString(field));
    check->setProperty("uid", static_cast<qulonglong>(currentEmitter ? currentEmitter->uid : 0));

    grid->addWidget(check, row, 0, 1, 2);

    fieldWidgets.append(check);

    if (currentEmitter) {
        connect(check, &QCheckBox::toggled, this, [this, check](bool val) {
            uint64_t uid = static_cast<uint64_t>(check->property("uid").toULongLong());
            emit emitterChanged(uid, check->property("field").toString().toStdString(),
                val ? 1.0 : 0.0);
        });
    }

    return check;
}

QLineEdit* PropsPanel::addText(QGridLayout* grid, int row,
    const std::string& labelKey, const std::string& field, const std::string& value)
{
    auto* label = new QLabel(QString::fromStdString(labelKey));
    auto* edit = new QLineEdit();
    edit->setText(QString::fromStdString(value));
    edit->setProperty("field", QString::fromStdString(field));
    edit->setProperty("uid", static_cast<qulonglong>(currentEmitter ? currentEmitter->uid : 0));

    grid->addWidget(label, row, 0);
    grid->addWidget(edit, row, 1);

    fieldWidgets.append(edit);

    if (currentEmitter) {
        auto* timer = new QTimer(this);
        timer->setSingleShot(true);
        timer->setInterval(300);
        connect(edit, &QLineEdit::textChanged, this, [this, edit, timer]() {
            timer->start();
        });
        connect(timer, &QTimer::timeout, this, [this, edit]() {
            uint64_t uid = static_cast<uint64_t>(edit->property("uid").toULongLong());
            QString f = edit->property("field").toString();
            // text fields emit through emitterObjectChanged
        });
    }

    return edit;
}

void PropsPanel::setEmitter(const Emitter* emitter)
{
    currentEmitter = emitter;

    for (auto* w : fieldWidgets) {
        w->disconnect();
    }
    fieldWidgets.clear();

    // Rebuild UI by clearing and re-adding sections would be expensive;
    // instead we update values in place. For simplicity, we clear the
    // mainLayout and rebuild from setupUI each time the emitter changes.
    if (mainLayout) {
        QLayoutItem* item;
        while ((item = mainLayout->takeAt(0)) != nullptr) {
            if (item->widget()) {
                item->widget()->deleteLater();
            }
            delete item;
        }
    }

    setupUI();

    if (!emitter) return;

    // Now find all widgets and set their values
    auto spins = scrollContent->findChildren<QDoubleSpinBox*>();
    for (auto* spin : spins) {
        QString f = spin->property("field").toString();
        double val = 0;
        if (f == "rate") val = emitter->rate;
        else if (f == "burst") val = static_cast<double>(emitter->burst);
        else if (f == "life") val = emitter->life;
        else if (f == "lifeRnd") val = emitter->lifeRnd;
        else if (f == "speed") val = emitter->speed;
        else if (f == "speedRnd") val = emitter->speedRnd;
        else if (f == "spread") val = emitter->spread;
        else if (f == "dirYaw") val = emitter->dirYaw;
        else if (f == "dirPitch") val = emitter->dirPitch;
        else if (f == "gravity") val = emitter->gravity;
        else if (f == "windX") val = emitter->windX;
        else if (f == "windZ") val = emitter->windZ;
        else if (f == "drag") val = emitter->drag;
        else if (f == "turb") val = emitter->turb;
        else if (f == "turbFreq") val = emitter->turbFreq;
        else if (f == "sizeX") val = emitter->sizeX;
        else if (f == "sizeRnd") val = emitter->sizeRnd;
        else if (f == "sizeY") val = emitter->sizeY;
        else if (f == "spin") val = emitter->spin;
        else if (f == "spinRnd") val = emitter->spinRnd;
        else if (f == "initRot") val = emitter->initRot;
        else if (f == "initRotRnd") val = emitter->initRotRnd;
        else if (f == "velStretch") val = emitter->velStretch;
        else if (f == "maxP") val = static_cast<double>(emitter->maxP);
        else if (f == "cycle") val = emitter->cycle;
        else if (f == "delay") val = emitter->delay;
        else if (f == "shapeRadius") val = emitter->shapeRadius;
        else if (f == "bounceFac") val = emitter->bounceFac;
        else if (f == "attractorStr") val = emitter->attractorStr;
        else if (f == "attractorY") val = emitter->attractorY;
        else if (f == "uvScrollX") val = emitter->uvScrollX;
        else if (f == "uvScrollY") val = emitter->uvScrollY;
        else if (f == "animFPS") val = emitter->animFPS;
        else if (f == "sheetCols") val = static_cast<double>(emitter->sheetCols);
        else if (f == "sheetRows") val = static_cast<double>(emitter->sheetRows);
        spin->blockSignals(true);
        spin->setValue(val);
        spin->setProperty("uid", static_cast<qulonglong>(emitter->uid));
        spin->blockSignals(false);
    }

    auto combos = scrollContent->findChildren<QComboBox*>();
    for (auto* combo : combos) {
        QString f = combo->property("field").toString();
        int idx = 0;
        if (f == "blend") idx = static_cast<int>(emitter->blend);
        else if (f == "shape") idx = static_cast<int>(emitter->shape);
        else if (f == "coordType") idx = static_cast<int>(emitter->coordType);
        else if (f == "rotType") {
            switch (emitter->rotType) {
                case RotType::None: idx = 0; break;
                case RotType::Random: idx = 1; break;
                case RotType::Spin: idx = 2; break;
            }
        }
        else if (f == "emitSurface") idx = static_cast<int>(emitter->emitSurface);
        else if (f == "colorMod") idx = static_cast<int>(emitter->colorMod);
        else if (f == "uvAnim") idx = static_cast<int>(emitter->uvAnim);
        else if (f == "builtinTex") {
            auto items = builtinTexItems();
            idx = items.indexOf(QString::fromStdString(emitter->builtinTex));
            if (idx < 0) idx = 0;
        }
        combo->blockSignals(true);
        combo->setCurrentIndex(idx);
        combo->setProperty("uid", static_cast<qulonglong>(emitter->uid));
        combo->blockSignals(false);
    }

    auto checks = scrollContent->findChildren<QCheckBox*>();
    for (auto* check : checks) {
        QString f = check->property("field").toString();
        bool val = false;
        if (f == "loop") val = emitter->loop;
        else if (f == "sizeNonUniform") val = emitter->sizeNonUniform;
        else if (f == "groundBounce") val = emitter->groundBounce;
        check->blockSignals(true);
        check->setChecked(val);
        check->setProperty("uid", static_cast<qulonglong>(emitter->uid));
        check->blockSignals(false);
    }

    auto edits = scrollContent->findChildren<QLineEdit*>();
    for (auto* edit : edits) {
        QString f = edit->property("field").toString();
        if (f == "name") {
            edit->setText(QString::fromStdString(emitter->name));
        } else if (f == "texPath") {
            edit->setText(QString::fromStdString(emitter->texPath));
        }
        edit->setProperty("uid", static_cast<qulonglong>(emitter->uid));
    }
}

void PropsPanel::refresh()
{
    if (currentEmitter) {
        setEmitter(currentEmitter);
    }
}
