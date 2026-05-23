#include "MseExporter.h"
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cmath>
#include <ctime>
#include <map>

static std::string fmt(double value, int precision) {
    if (!std::isfinite(value)) return "0.0000";
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << value;
    return oss.str();
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

static std::string toUpper(const std::string& s) {
    auto r = s;
    for (auto& c : r) c = (char)std::toupper((unsigned char)c);
    return r;
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

static std::string blendTypeStr(BlendType bt) {
    switch (bt) {
        case BlendType::Add: return "ADD";
        case BlendType::Modulate: return "MODULATE";
        case BlendType::Alpha: return "NORMAL";
    }
    return "NORMAL";
}

static int uvAnimCode(UVAnimType ut) {
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

std::string MseExporter::buildMse(const std::vector<Emitter>& emitters, const MseExportOptions& opts) {
    auto precision = opts.precision;
    auto effectName = opts.effectName;

    auto now = std::time(nullptr);
    char dateBuf[64];
    struct tm local;
    localtime_s(&local, &now);
    std::strftime(dateBuf, sizeof(dateBuf), "%m/%d/%Y", &local);

    std::string t;
    t += "# Metin2 Effect Studio PRO v3.3 \xe2\x80\x94 MSE Export\n";
    t += "# ";
    t += dateBuf;
    t += "\n\n";
    t += "EffectName\t\"" + effectName + "\"\n";
    t += "ParticleSystemCount\t" + std::to_string(emitters.size()) + "\n\n";

    for (size_t idx = 0; idx < emitters.size(); ++idx) {
        const auto& e = emitters[idx];
        t += "# --- Particle System " + std::to_string(idx + 1) + ": " + e.name + " ---\n";
        t += "StartParticleSystem\n";
        t += "\tSystemName\t\"" + e.name + "\"\n";
        t += "\tBirthRate\t" + fmt(e.rate, precision) + "\n";
        t += "\tMaxParticleCount\t" + std::to_string(std::min(e.maxP, 2048)) + "\n";
        t += "\tLifeTime\t" + fmt(e.life, precision) + "\n";
        t += "\tLifeTimeRnd\t" + fmt(e.lifeRnd, precision) + "\n";
        t += "\tBurstCount\t" + std::to_string(e.burst) + "\n";
        t += "\tStartDelay\t" + fmt(e.delay, precision) + "\n";
        t += "\tLoop\t" + std::string(e.loop ? "TRUE" : "FALSE") + "\n";
        t += "\tLifeCycle\t" + fmt(e.cycle, precision) + "\n";
        t += "\tCoordType\t" + coordTypeStr(e.coordType) + "\n";
        t += "\tRotationType\t" + rotTypeStr(e.rotType) + "\n";
        t += "\tSpawnShape\t" + shapeCode(shapeStr(e.shape)) + "\n";
        t += "\tSpawnRadius\t" + fmt(e.shapeRadius > 0 ? e.shapeRadius : 0.35, precision) + "\n";
        t += "\tSpeed\t" + fmt(e.speed, precision) + "\n";
        t += "\tSpeedRnd\t" + fmt(e.speedRnd, precision) + "\n";
        t += "\tSpread\t" + fmt(e.spread, precision) + "\n";
        t += "\tDirectionYaw\t" + fmt(e.dirYaw, precision) + "\n";
        t += "\tDirectionPitch\t" + fmt(e.dirPitch, precision) + "\n";
        t += "\tGravityVector\t0.0000\t" + fmt(e.gravity, precision) + "\t0.0000\n";
        t += "\tAirResistance\t" + fmt(e.drag, precision) + "\n";

        if (e.groundBounce) {
            t += "\tGroundBounce\tTRUE\n";
            t += "\tBounceFactor\t" + fmt(e.bounceFac > 0 ? e.bounceFac : 0.4, precision) + "\n";
        }
        if (e.attractorStr != 0.0) {
            t += "\tAttractorStrength\t" + fmt(e.attractorStr, precision) + "\n";
            t += "\tAttractorY\t" + fmt(e.attractorY > 0 ? e.attractorY : 0.5, precision) + "\n";
        }

        t += "\tSizeX\t" + fmt(e.sizeX, precision) + "\n";
        t += "\tSizeY\t" + fmt(e.sizeNonUniform ? e.sizeY : e.sizeX, precision) + "\n";
        t += "\tSizeRnd\t" + fmt(e.sizeRnd, precision) + "\n";
        t += "\tRotMin\t" + fmt(e.initRot, precision) + "\n";
        t += "\tRotMax\t" + fmt(e.initRot + e.initRotRnd, precision) + "\n";
        t += "\tRotSpeedMin\t" + fmt(e.spin - std::abs(e.spinRnd), precision) + "\n";
        t += "\tRotSpeedMax\t" + fmt(e.spin + std::abs(e.spinRnd), precision) + "\n";

        t += "\tBlendType\t" + blendTypeStr(e.blend) + "\n";

        auto texPath = e.texPath.empty() ? toLower(effectName) + "_" + toLower(e.name) + ".tga" : e.texPath;
        t += "\tTextureFileName\t\"" + texPath + "\"\n";
        t += "\tTextureAnimType\t" + std::to_string(uvAnimCode(e.uvAnim)) + "\n";
        t += "\tTextureAnimFrame\t" + std::to_string(e.sheetCols) + "\t" + std::to_string(e.sheetRows) + "\n";
        t += "\tTextureAnimFPS\t" + fmt(e.animFPS, precision) + "\n";

        if (e.uvScrollX != 0.0 || e.uvScrollY != 0.0) {
            t += "\t# UVScrollX\t" + fmt(e.uvScrollX, precision) + "\n";
            t += "\t# UVScrollY\t" + fmt(e.uvScrollY, precision) + "\n";
        }

        auto colorKeys = e.colorKeys;
        if (colorKeys.empty()) {
            ColorKey ck0, ck1;
            ck0.t = 0; ck0.r = 1; ck0.g = 1; ck0.b = 1; ck0.a = 1;
            ck1.t = 1; ck1.r = 0.2; ck1.g = 0.1; ck1.b = 0.05; ck1.a = 0;
            colorKeys = {ck0, ck1};
        }
        t += "\tColorKeyframeCount\t" + std::to_string(colorKeys.size()) + "\n";
        auto sortedCK = sortByTime(colorKeys);
        for (const auto& k : sortedCK) {
            t += "\tColorKeyframe\t" + fmt(k.t, precision) + "\t" +
                 std::to_string((int)std::round(k.r * 255)) + "\t" +
                 std::to_string((int)std::round(k.g * 255)) + "\t" +
                 std::to_string((int)std::round(k.b * 255)) + "\t" +
                 std::to_string((int)std::round(k.a * 255)) + "\n";
        }

        auto sizeCurve = e.sizeCurve;
        if (sizeCurve.empty()) {
            sizeCurve = {{0, 1}, {0.5, 1}, {1, 0.2}};
        }
        t += "\tSizeCurveCount\t" + std::to_string(sizeCurve.size()) + "\n";
        auto sortedSC = sortByTime(sizeCurve);
        for (const auto& pt : sortedSC) {
            t += "\tSizeCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        auto alphaCurve = e.alphaCurve;
        if (alphaCurve.empty()) {
            alphaCurve = {{0, 1}, {0.8, 0.9}, {1, 0}};
        }
        t += "\tAlphaCurveCount\t" + std::to_string(alphaCurve.size()) + "\n";
        auto sortedAC = sortByTime(alphaCurve);
        for (const auto& pt : sortedAC) {
            t += "\tAlphaCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        auto speedCurve = e.speedCurve;
        if (speedCurve.empty()) {
            speedCurve = {{0, 1}, {1, 1}};
        }
        t += "\tSpeedCurveCount\t" + std::to_string(speedCurve.size()) + "\n";
        auto sortedSpC = sortByTime(speedCurve);
        for (const auto& pt : sortedSpC) {
            t += "\tSpeedCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        auto spinCurve = e.spinCurve;
        if (spinCurve.empty()) {
            spinCurve = {{0, 1}, {1, 1}};
        }
        t += "\tSpinCurveCount\t" + std::to_string(spinCurve.size()) + "\n";
        auto sortedSpnC = sortByTime(spinCurve);
        for (const auto& pt : sortedSpnC) {
            t += "\tSpinCurve\t" + fmt(pt.t, precision) + "\t" + fmt(pt.v, precision) + "\n";
        }

        t += "EndParticleSystem\n\n";
    }

    return t;
}

std::string MseExporter::shapeCode(const std::string& shape) {
    return ::shapeCode(shape);
}
