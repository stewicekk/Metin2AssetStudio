#include "EffExporter.h"
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cmath>
#include <ctime>
#include <map>
#include <regex>

static std::string fmt(double value, int precision) {
    if (!std::isfinite(value)) return "0.0000";
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << value;
    return oss.str();
}

static std::string toLower(const std::string& s) {
    std::string r = s;
    for (auto& c : r) c = (char)std::tolower((unsigned char)c);
    return r;
}

static std::string shapeCode(const std::string& shape) {
    static const std::map<std::string, std::string> map = {
        {"point", "POINT"}, {"cone", "CONE"}, {"box", "BOX"},
        {"sphere", "SPHERE"}, {"spherevol", "SPHERE"},
        {"ring", "DISC"}, {"disc", "DISC"},
    };
    auto it = map.find(shape);
    return it != map.end() ? it->second : "POINT";
}

static std::string coordTypeStr(CoordType ct) {
    switch (ct) {
        case CoordType::World: return "WORLD";
        case CoordType::Local: return "LOCAL";
    }
    return "WORLD";
}

static std::string rotTypeStr(RotType rt) {
    switch (rt) {
        case RotType::None: return "NONE";
        case RotType::Random: return "RANDOM";
        case RotType::Spin: return "SPIN";
    }
    return "RANDOM";
}

static int blendCode(BlendType bt) {
    switch (bt) {
        case BlendType::Add: return 1;
        case BlendType::Modulate: return 2;
        case BlendType::Alpha: return 0;
    }
    return 0;
}

static int animTypeCode(UVAnimType ut) {
    switch (ut) {
        case UVAnimType::Rand: return 3;
        case UVAnimType::Once: return 2;
        case UVAnimType::Life: return 1;
        case UVAnimType::Loop: return 1;
    }
    return 1;
}

template<typename T>
static std::vector<T> sortByTime(const std::vector<T>& arr) {
    auto copy = arr;
    std::sort(copy.begin(), copy.end(), [](const T& a, const T& b) {
        return a.t < b.t;
    });
    return copy;
}

std::string EffExporter::buildEff(const std::vector<Emitter>& emitters, const ExportOptions& opts) {
    auto precision = opts.precision;
    auto effectName = opts.effectName;
    auto effectPath = opts.effectPath;

    auto now = std::time(nullptr);
    char dateBuf[64];
    struct tm local;
    localtime_s(&local, &now);
    std::strftime(dateBuf, sizeof(dateBuf), "%m/%d/%Y", &local);

    std::string t;
    t += "// Metin2 Effect Studio PRO v3.3 \xe2\x80\x94 CEffectData Export\n";
    t += "// ";
    t += dateBuf;
    t += "\n\n";
    t += "CEffectData\n{\n";
    t += "\tEffectName\t\t\"" + effectName + "\"\n";
    t += "\tEffectPath\t\t\"" + effectPath + "\"\n\n";

    for (const auto& e : emitters) {
        t += "\tCParticleSystemData\n\t{\n";
        t += "\t\tName\t\t\t\"" + e.name + "\"\n";
        t += "\t\tCoordType\t\t" + coordTypeStr(e.coordType) + "\n";
        t += "\t\tRotationType\t\t" + rotTypeStr(e.rotType) + "\n";
        auto texPath = e.texPath.empty() ? toLower(effectName) + ".tga" : e.texPath;
        t += "\t\tTextureFileName\t\"" + texPath + "\"\n";
        t += "\t\tBlendType\t\t" + std::to_string(blendCode(e.blend)) + "\n";
        t += "\t\tMaxParticleCount\t" + std::to_string(std::min(std::max(0, e.maxP), 2048)) + "\n";
        t += "\t\tBirthRate\t\t" + fmt(e.rate, precision) + "\n";
        t += "\t\tBurstCount\t\t" + std::to_string(e.burst) + "\n";
        t += "\t\tLifeTime\t\t" + fmt(e.life, precision) + "\n";
        t += "\t\tLifeTimeRnd\t\t" + fmt(e.lifeRnd, precision) + "\n";
        t += "\t\tSpeed\t\t\t" + fmt(e.speed, precision) + "\n";
        t += "\t\tSpeedRnd\t\t" + fmt(e.speedRnd, precision) + "\n";
        t += "\t\tGravityVector\t\t0.0000\t" + fmt(e.gravity, precision) + "\t0.0000\n";
        t += "\t\tAirResistance\t" + fmt(e.drag, precision) + "\n";

        if (e.groundBounce) {
            t += "\t\tGroundBounce\t\t1\n";
            t += "\t\tBounceFactor\t\t" + fmt(e.bounceFac > 0 ? e.bounceFac : 0.4, precision) + "\n";
        }
        if (e.attractorStr != 0.0) {
            t += "\t\tAttractorStrength\t" + fmt(e.attractorStr, precision) + "\n";
            t += "\t\tAttractorY\t\t" + fmt(e.attractorY > 0 ? e.attractorY : 0.5, precision) + "\n";
        }

        t += "\t\tSpread\t\t\t" + fmt(e.spread, precision) + "\n";
        t += "\t\tDirectionYaw\t\t" + fmt(e.dirYaw, precision) + "\n";
        t += "\t\tDirectionPitch\t" + fmt(e.dirPitch, precision) + "\n";
        t += "\t\tSpawnShape\t\t" + ::shapeCode(shapeStr(e.shape)) + "\n";
        t += "\t\tSpawnRadius\t\t" + fmt(e.shapeRadius > 0 ? e.shapeRadius : 0.35, precision) + "\n";
        t += "\t\tSizeX\t\t\t" + fmt(e.sizeX, precision) + "\n";
        t += "\t\tSizeY\t\t\t" + fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision) + "\n";
        t += "\t\tSizeRnd\t\t\t" + fmt(e.sizeRnd, precision) + "\n";
        t += "\t\tRotationMin\t\t" + fmt(e.initRot, precision) + "\n";
        t += "\t\tRotationMax\t\t" + fmt(e.initRot + e.initRotRnd, precision) + "\n";
        t += "\t\tRotSpeedMin\t\t" + fmt(e.spin - std::abs(e.spinRnd), precision) + "\n";
        t += "\t\tRotSpeedMax\t\t" + fmt(e.spin + std::abs(e.spinRnd), precision) + "\n";
        t += "\t\tLoop\t\t\t" + std::to_string(e.loop ? 1 : 0) + "\n";
        t += "\t\tLifeCycle\t\t" + fmt(e.cycle, precision) + "\n";
        t += "\t\tStartDelay\t\t" + fmt(e.delay, precision) + "\n";
        t += "\t\tSpriteRows\t\t" + std::to_string(e.sheetRows) + "\n";
        t += "\t\tSpriteCols\t\t" + std::to_string(e.sheetCols) + "\n";
        t += "\t\tAnimType\t\t" + std::to_string(animTypeCode(e.uvAnim)) + "\n";
        t += "\t\tAnimFPS\t\t\t" + fmt(e.animFPS, precision) + "\n";

        auto colorKeys = e.colorKeys;
        if (colorKeys.empty()) {
            ColorKey ck0, ck1;
            ck0.t = 0; ck0.r = 1; ck0.g = 1; ck0.b = 1; ck0.a = 1;
            ck1.t = 1; ck1.r = 0.2; ck1.g = 0.1; ck1.b = 0.05; ck1.a = 0;
            colorKeys = {ck0, ck1};
        }
        t += "\t\tColorKeyframeCount\t" + std::to_string(colorKeys.size()) + "\n";
        for (const auto& k : sortByTime(colorKeys)) {
            t += "\t\t{\t" + fmt(k.t, precision + 2) + "\t" +
                 std::to_string((int)std::round(k.r * 255)) + "\t" +
                 std::to_string((int)std::round(k.g * 255)) + "\t" +
                 std::to_string((int)std::round(k.b * 255)) + "\t" +
                 std::to_string((int)std::round(k.a * 255)) + "\t}\n";
        }

        auto sizeCurve = e.sizeCurve;
        if (sizeCurve.empty()) sizeCurve = {{0, 1}, {0.5, 1}, {1, 0.2}};
        t += "\t\tSizeCurveCount\t\t" + std::to_string(sizeCurve.size()) + "\n";
        for (const auto& pt : sortByTime(sizeCurve)) {
            t += "\t\tSizeCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        auto alphaCurve = e.alphaCurve;
        if (alphaCurve.empty()) alphaCurve = {{0, 1}, {0.8, 0.9}, {1, 0}};
        t += "\t\tAlphaCurveCount\t" + std::to_string(alphaCurve.size()) + "\n";
        for (const auto& pt : sortByTime(alphaCurve)) {
            t += "\t\tAlphaCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        auto speedCurve = e.speedCurve;
        if (speedCurve.empty()) speedCurve = {{0, 1}, {1, 1}};
        t += "\t\tSpeedCurveCount\t\t" + std::to_string(speedCurve.size()) + "\n";
        for (const auto& pt : sortByTime(speedCurve)) {
            t += "\t\tSpeedCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        auto spinCurve = e.spinCurve;
        if (spinCurve.empty()) spinCurve = {{0, 1}, {1, 1}};
        t += "\t\tSpinCurveCount\t\t" + std::to_string(spinCurve.size()) + "\n";
        for (const auto& pt : sortByTime(spinCurve)) {
            t += "\t\tSpinCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        t += "\t}\n\n";
    }

    t += "}\n";
    return t;
}

static const std::map<std::string, std::string> BONE_MAP = {
    {"root", "Bip01"},
    {"pelvis", "Bip01_Pelvis"},
    {"spine", "Bip01_Spine"},
    {"chest", "Bip01_Spine1"},
    {"neck", "Bip01_Neck"},
    {"head", "Bip01_Head"},
    {"larm", "Bip01_L_UpperArm"},
    {"rarm", "Bip01_R_UpperArm"},
    {"lforearm", "Bip01_L_Forearm"},
    {"rforearm", "Bip01_R_Forearm"},
    {"lhand", "Bip01_L_Hand"},
    {"rhand", "Bip01_R_Hand"},
    {"lfoot", "Bip01_L_Foot"},
    {"rfoot", "Bip01_R_Foot"},
    {"lfinger", "Bip01_L_Finger0"},
    {"rfinger", "Bip01_R_Finger0"},
    {"ltoe", "Bip01_L_Toe0"},
    {"rtoe", "Bip01_R_Toe0"},
    {"weapon_l", "Bip01_Weapon_L"},
    {"weapon_r", "Bip01_Weapon_R"},
};

std::string EffExporter::buildMde(const std::vector<Emitter>& emitters, const ExportOptions& opts) {
    auto precision = opts.precision;
    auto effectName = opts.effectName;
    auto effectPath = opts.effectPath;

    auto boneIt = BONE_MAP.find(opts.attachBone);
    auto bone = boneIt != BONE_MAP.end() ? boneIt->second : "Bip01";

    auto now = std::time(nullptr);
    char dateBuf[64];
    struct tm local;
    localtime_s(&local, &now);
    std::strftime(dateBuf, sizeof(dateBuf), "%m/%d/%Y", &local);

    std::string t;
    t += "// Metin2 Effect Studio PRO v3.3 \xe2\x80\x94 CEffectMesh Export (.mde)\n";
    t += "// Workflow: FBX \xe2\x86\x92 GR2 (Granny SDK) \xe2\x86\x92 embed here\n";
    t += "// ";
    t += dateBuf;
    t += "\n\n";
    t += "CEffectMesh\n{\n";
    t += "\tEffectMeshName\t\"" + effectName + "\"\n\n";

    for (size_t idx = 0; idx < emitters.size(); ++idx) {
        const auto& e = emitters[idx];
        auto nameLower = toLower(e.name);
        std::regex ws("\\s+");
        nameLower = std::regex_replace(nameLower, ws, "_");
        auto gr2 = effectPath + "mesh/" + nameLower + ".gr2";

        t += "\t// --- Mesh group: " + e.name + " ---\n";
        t += "\tCMeshGroup\n\t{\n";
        t += "\t\tName\t\t\"" + e.name + "\"\n";
        t += "\t\tMeshFileName\t\"" + gr2 + "\"\n";
        auto texPath = e.texPath.empty() ? effectPath + toLower(effectName) + ".tga" : e.texPath;
        t += "\t\tTextureFileName\t\"" + texPath + "\"\n";
        t += "\t\tBlendType\t" + std::to_string(e.blend == BlendType::Add ? 1 : 0) + "\n";
        t += "\t\tPosition\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\n";
        t += "\t\tScale\t\t" + fmt(e.sizeX, precision) + "\t" +
             fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision) + "\t" +
             fmt(e.sizeX, precision) + "\n";
        t += "\t\tRotation\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\t" + fmt(0, precision) + "\n";
        t += "\t\tLoop\t\t" + std::to_string(e.loop ? 1 : 0) + "\n";
        t += "\t\tLifeCycle\t" + fmt(e.cycle, precision) + "\n";
        t += "\t\tVisible\t\t1\n";
        t += "\t\tParticleEffectFile\t\"" + effectPath + effectName + "_" + std::to_string(idx) + ".mse\"\n";
        t += "\t}\n\n";
    }

    t += "\tAttachBone\t\"" + bone + "\"\n";

    double maxSpeed = 1.0;
    double maxLife = 0.5;
    double maxSize = 0.5;
    for (const auto& e : emitters) {
        auto spd = std::abs(e.speed) + std::abs(e.speedRnd);
        auto lif = std::abs(e.life) + std::abs(e.lifeRnd);
        auto sz = std::max(e.sizeX, e.sizeNonUniform ? e.sizeY : e.sizeX);
        if (spd > maxSpeed) maxSpeed = spd;
        if (lif > maxLife) maxLife = lif;
        if (sz > maxSize) maxSize = sz;
    }
    auto bndR = std::max(1.5, maxSpeed * maxLife * 0.65 + maxSize * 0.5);
    t += "\tBoundingRadius\t" + fmt(bndR, precision) + "\n";
    t += "}\n";

    return t;
}
