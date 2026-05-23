#include "PresetsPanel.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QJsonObject>
#include <QJsonDocument>

static Emitter makeFirePreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Fire"; e.color = "#ff4400";
    e.blend = BlendType::Alpha; e.shape = ShapeType::Cone;
    e.rate = 60; e.burst = 0; e.life = 1.2; e.lifeRnd = 0.4;
    e.maxP = 100; e.loop = true; e.cycle = 0; e.delay = 0;
    e.speed = 120; e.speedRnd = 40; e.spread = 15;
    e.dirYaw = 0; e.dirPitch = 90;
    e.gravity = -5; e.windX = 0; e.windZ = 0; e.drag = 0.1;
    e.turb = 0; e.turbFreq = 0;
    e.sizeX = 12; e.sizeRnd = 0.3; e.sizeY = 20; e.sizeNonUniform = true;
    e.spin = 0; e.spinRnd = 0; e.initRot = 0; e.initRotRnd = 360;
    e.velStretch = 0;
    e.builtinTex = "flame"; e.sheetCols = 1; e.sheetRows = 1;
    e.uvAnim = UVAnimType::Loop; e.animFPS = 30;
    e.coordType = CoordType::Local; e.rotType = RotType::Random;
    e.uvScrollY = 1.0; e.shapeRadius = 0.2;
    e.groundBounce = false; e.bounceFac = 0;
    e.attractorStr = 0; e.attractorY = 0;
    e.emitSurface = EmitterSurfaceType::None;
    e.colorMod = ColorModType::Multiply;
    e.sizeCurve = {{0,1},{1,0.3}};
    e.alphaCurve = {{0,1},{0.5,1},{1,0}};
    e.colorKeys = {{0,1,0.27,0,1},{0.5,1,0.6,0,1},{1,0.5,0.1,0,0}};
    return e;
}

static Emitter makeIcePreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Ice"; e.color = "#88ccff";
    e.blend = BlendType::Alpha; e.shape = ShapeType::Sphere;
    e.rate = 25; e.burst = 0; e.life = 2.0; e.lifeRnd = 0.5;
    e.maxP = 80; e.loop = true; e.cycle = 0; e.delay = 0;
    e.speed = 80; e.speedRnd = 30; e.spread = 10;
    e.dirYaw = 0; e.dirPitch = -90;
    e.gravity = -8; e.windX = 0; e.windZ = 0; e.drag = 0.2;
    e.turb = 0.5; e.turbFreq = 1.0;
    e.sizeX = 6; e.sizeRnd = 0.4; e.sizeY = 6; e.sizeNonUniform = false;
    e.spin = 30; e.spinRnd = 60; e.initRot = 0; e.initRotRnd = 360;
    e.velStretch = 0;
    e.builtinTex = "diamond"; e.sheetCols = 1; e.sheetRows = 1;
    e.uvAnim = UVAnimType::Loop; e.animFPS = 30;
    e.coordType = CoordType::World; e.rotType = RotType::Spin;
    e.shapeRadius = 0.5; e.groundBounce = false;
    e.emitSurface = EmitterSurfaceType::Surface;
    e.colorMod = ColorModType::Multiply;
    e.sizeCurve = {{0,0.5},{0.5,1},{1,0.2}};
    e.alphaCurve = {{0,0.8},{1,0}};
    e.colorKeys = {{0,0.5,0.8,1,0.8},{1,0.2,0.5,0.8,0}};
    return e;
}

static Emitter makeLightningPreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Lightning"; e.color = "#ffff44";
    e.blend = BlendType::Add; e.shape = ShapeType::Cone;
    e.rate = 100; e.burst = 0; e.life = 0.5; e.lifeRnd = 0.2;
    e.maxP = 200; e.loop = true; e.cycle = 0; e.delay = 0;
    e.speed = 300; e.speedRnd = 100; e.spread = 5;
    e.dirYaw = 0; e.dirPitch = 90;
    e.gravity = 0; e.windX = 0; e.windZ = 0; e.drag = 0;
    e.turb = 5; e.turbFreq = 10;
    e.sizeX = 4; e.sizeRnd = 0.5; e.sizeY = 4; e.sizeNonUniform = false;
    e.builtinTex = "spark"; e.uvAnim = UVAnimType::Loop;
    e.coordType = CoordType::Local; e.rotType = RotType::Random;
    e.colorMod = ColorModType::Add;
    e.alphaCurve = {{0,1},{0.2,1},{1,0}};
    e.colorKeys = {{0,1,1,0.27,1},{0.5,1,1,0.6,1},{1,0.5,0.5,0.1,0}};
    return e;
}

static Emitter makeSmokePreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Smoke"; e.color = "#666666";
    e.blend = BlendType::Alpha; e.shape = ShapeType::Sphere;
    e.rate = 15; e.burst = 0; e.life = 3.0; e.lifeRnd = 1.0;
    e.maxP = 60; e.loop = true;
    e.speed = 40; e.speedRnd = 20; e.spread = 20;
    e.gravity = 5; e.drag = 0.3;
    e.sizeX = 20; e.sizeRnd = 0.5; e.sizeY = 20;
    e.builtinTex = "smoke";
    e.alphaCurve = {{0,0.5},{0.3,0.8},{1,0}};
    e.sizeCurve = {{0,0.5},{1,2}};
    e.colorKeys = {{0,0.4,0.4,0.4,0.5},{1,0.2,0.2,0.2,0}};
    return e;
}

static Emitter makeSparklePreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Sparkle"; e.color = "#ffdd88";
    e.blend = BlendType::Add; e.shape = ShapeType::Point;
    e.rate = 5; e.burst = 20; e.life = 1.0; e.lifeRnd = 0.3;
    e.maxP = 100; e.loop = true;
    e.speed = 200; e.speedRnd = 100; e.spread = 360;
    e.gravity = -10; e.drag = 0.1;
    e.sizeX = 3; e.sizeRnd = 0.3; e.sizeY = 3;
    e.builtinTex = "star"; e.uvAnim = UVAnimType::Life;
    e.initRotRnd = 360; e.spinRnd = 360;
    e.alphaCurve = {{0,1},{0.5,1},{1,0}};
    e.colorKeys = {{0,1,0.87,0.53,1},{1,1,0.6,0,0}};
    return e;
}

static Emitter makeExplosionPreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Explosion"; e.color = "#ff6600";
    e.blend = BlendType::Add; e.shape = ShapeType::Sphere;
    e.rate = 0; e.burst = 200; e.life = 1.5; e.lifeRnd = 0.5;
    e.maxP = 300; e.loop = false; e.cycle = 0; e.delay = 0;
    e.speed = 400; e.speedRnd = 200; e.spread = 360;
    e.gravity = 0; e.drag = 0.2;
    e.sizeX = 8; e.sizeRnd = 0.5; e.sizeY = 8;
    e.builtinTex = "flare";
    e.alphaCurve = {{0,1},{0.3,1},{1,0}};
    e.sizeCurve = {{0,0.3},{0.5,1},{1,0.1}};
    e.colorKeys = {{0,1,0.5,0,1},{0.5,1,1,0,1},{1,0.5,0,0,0}};
    return e;
}

static Emitter makeHealPreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Heal"; e.color = "#44ff88";
    e.blend = BlendType::Alpha; e.shape = ShapeType::SphereVol;
    e.rate = 30; e.life = 1.0; e.lifeRnd = 0.3;
    e.maxP = 60; e.loop = true;
    e.speed = 50; e.speedRnd = 20; e.spread = 360;
    e.gravity = 15; e.drag = 0.1;
    e.sizeX = 5; e.sizeY = 10; e.sizeNonUniform = true;
    e.builtinTex = "softGlow"; e.uvAnim = UVAnimType::Loop;
    e.emitSurface = EmitterSurfaceType::Surface;
    e.sizeCurve = {{0,0.5},{1,1.5}};
    e.alphaCurve = {{0,0.6},{0.5,1},{1,0}};
    e.colorKeys = {{0,0.27,1,0.53,0.6},{0.5,0.5,1,0.8,1},{1,0.2,0.8,0.4,0}};
    return e;
}

static Emitter makePoisonPreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Poison"; e.color = "#88ff00";
    e.blend = BlendType::Alpha; e.shape = ShapeType::Sphere;
    e.rate = 20; e.life = 2.0; e.lifeRnd = 0.5;
    e.maxP = 80; e.loop = true;
    e.speed = 30; e.speedRnd = 15; e.spread = 30;
    e.gravity = -3; e.drag = 0.2; e.turb = 2; e.turbFreq = 1;
    e.sizeX = 10; e.sizeRnd = 0.4; e.sizeY = 10;
    e.builtinTex = "circle";
    e.alphaCurve = {{0,0.7},{0.5,0.9},{1,0}};
    e.colorKeys = {{0,0.53,1,0,0.7},{0.5,0.3,0.8,0.2,0.9},{1,0.1,0.4,0,0}};
    return e;
}

static Emitter makeBuffPreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Buff"; e.color = "#ffaa00";
    e.blend = BlendType::Add; e.shape = ShapeType::Ring;
    e.rate = 10; e.life = 2.0; e.lifeRnd = 0;
    e.maxP = 40; e.loop = true;
    e.speed = 0; e.spread = 0;
    e.gravity = 0; e.drag = 0;
    e.sizeX = 15; e.sizeRnd = 0; e.sizeY = 15;
    e.spin = 60; e.spinRnd = 0;
    e.builtinTex = "ring"; e.uvAnim = UVAnimType::Loop;
    e.rotType = RotType::Spin;
    e.shapeRadius = 2.0;
    e.alphaCurve = {{0,0},{0.2,1},{0.8,1},{1,0}};
    e.colorKeys = {{0,1,0.67,0,0},{1,1,0.67,0,0}};
    return e;
}

static Emitter makeAuraPreset(uint64_t uid)
{
    Emitter e;
    e.uid = uid; e.name = "Aura"; e.color = "#aa88ff";
    e.blend = BlendType::Alpha; e.shape = ShapeType::Box;
    e.rate = 5; e.burst = 0; e.life = 3.0; e.lifeRnd = 1.0;
    e.maxP = 30; e.loop = true;
    e.speed = 20; e.speedRnd = 10; e.spread = 90;
    e.dirYaw = 0; e.dirPitch = 90;
    e.gravity = 5; e.drag = 0.3;
    e.sizeX = 4; e.sizeRnd = 0.5; e.sizeY = 8; e.sizeNonUniform = true;
    e.builtinTex = "hexagon";
    e.alphaCurve = {{0,0},{0.3,0.6},{0.7,0.6},{1,0}};
    e.colorKeys = {{0,0.67,0.53,1,0},{0.5,0.67,0.53,1,0.6},{1,0.33,0.2,0.8,0}};
    return e;
}

PresetsPanel::PresetsPanel(QWidget* parent)
    : QWidget(parent)
{
    setupUI();

    // Load built-in presets
    uint64_t presetUid = 10000;
    auto addPreset = [this, &presetUid](const std::string& category, Emitter e) {
        PresetEntry entry;
        entry.name = e.name;
        entry.category = category;
        entry.emitter = std::move(e);
        presets.push_back(std::move(entry));
    };

    addPreset("Elemental", makeFirePreset(presetUid++));
    addPreset("Elemental", makeIcePreset(presetUid++));
    addPreset("Elemental", makeLightningPreset(presetUid++));
    addPreset("Elemental", makeSmokePreset(presetUid++));
    addPreset("Effects", makeSparklePreset(presetUid++));
    addPreset("Effects", makeExplosionPreset(presetUid++));
    addPreset("Magic", makeHealPreset(presetUid++));
    addPreset("Magic", makePoisonPreset(presetUid++));
    addPreset("Magic", makeBuffPreset(presetUid++));
    addPreset("Magic", makeAuraPreset(presetUid++));

    // Populate the list
    std::string currentCategory;
    for (const auto& p : presets) {
        if (p.category != currentCategory) {
            currentCategory = p.category;
            auto* catItem = new QListWidgetItem(
                QString::fromStdString(currentCategory), presetList);
            catItem->setFlags(catItem->flags() & ~Qt::ItemIsSelectable);
            QFont f = catItem->font();
            f.setBold(true);
            catItem->setFont(f);
        }
        auto* item = new QListWidgetItem(QString::fromStdString(p.name), presetList);
        item->setData(Qt::UserRole, QString::fromStdString(p.name));
    }
}

void PresetsPanel::setupUI()
{
    auto* layout = new QVBoxLayout(this);
    layout->setContentsMargins(4, 4, 4, 4);
    layout->setSpacing(4);

    searchInput = new QLineEdit(this);
    searchInput->setPlaceholderText(tr("Search presets..."));
    searchInput->setClearButtonEnabled(true);
    layout->addWidget(searchInput);

    presetList = new QListWidget(this);
    presetList->setAlternatingRowColors(true);
    layout->addWidget(presetList, 1);

    btnApply = new QPushButton(tr("Apply Preset"), this);
    layout->addWidget(btnApply);

    connect(searchInput, &QLineEdit::textChanged,
        this, &PresetsPanel::onSearchChanged);
    connect(btnApply, &QPushButton::clicked,
        this, &PresetsPanel::onApplyClicked);
    connect(presetList, &QListWidget::itemDoubleClicked,
        this, &PresetsPanel::onApplyClicked);
}

void PresetsPanel::loadPresets(const QJsonArray& jsonPresets)
{
    presets.clear();
    presetList->clear();

    uint64_t presetUid = 20000;
    for (const auto& val : jsonPresets) {
        QJsonObject obj = val.toObject();
        PresetEntry entry;
        entry.name = obj["name"].toString().toStdString();
        entry.category = obj["category"].toString().toStdString();

        Emitter e;
        e.uid = presetUid++;
        e.name = entry.name;
        e.color = obj["color"].toString("#ffffff").toStdString();
        e.rate = obj["rate"].toDouble(10);
        e.life = obj["life"].toDouble(1.5);
        e.speed = obj["speed"].toDouble(150);
        e.sizeX = obj["sizeX"].toDouble(8);
        e.sizeY = obj["sizeY"].toDouble(8);
        entry.emitter = e;
        presets.push_back(std::move(entry));
    }

    // Rebuild list
    std::string currentCategory;
    for (const auto& p : presets) {
        if (p.category != currentCategory) {
            currentCategory = p.category;
            auto* catItem = new QListWidgetItem(
                QString::fromStdString(currentCategory), presetList);
            catItem->setFlags(catItem->flags() & ~Qt::ItemIsSelectable);
            QFont f = catItem->font();
            f.setBold(true);
            catItem->setFont(f);
        }
        auto* item = new QListWidgetItem(QString::fromStdString(p.name), presetList);
        item->setData(Qt::UserRole, QString::fromStdString(p.name));
    }
}

void PresetsPanel::onSearchChanged(const QString& text)
{
    for (int i = 0; i < presetList->count(); ++i) {
        auto* item = presetList->item(i);
        bool match = text.isEmpty() ||
            item->text().contains(text, Qt::CaseInsensitive);
        item->setHidden(!match && (item->flags() & Qt::ItemIsSelectable));
    }
}

void PresetsPanel::onApplyClicked()
{
    auto* item = presetList->currentItem();
    if (!item) return;
    if (!(item->flags() & Qt::ItemIsSelectable)) return;

    QString name = item->data(Qt::UserRole).toString();
    for (const auto& p : presets) {
        if (p.name == name.toStdString()) {
            Emitter copy = p.emitter;
            copy.uid = 0; // Will be reassigned by caller
            emit presetApplied(copy);
            break;
        }
    }
}
