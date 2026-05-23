#include "ProjectManager.h"
#include <nlohmann/json.hpp>
#include <string>
#include <fstream>
#include <chrono>
#include <cstdlib>

using json = nlohmann::json;

#ifdef _WIN32
#include <windows.h>
#include <shlobj.h>
static std::string getAppDataPath() {
    char path[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(nullptr, CSIDL_LOCAL_APPDATA, nullptr, 0, path))) {
        return std::string(path) + "\\Metin2AssetStudioCpp";
    }
    return "";
}
#else
static std::string getAppDataPath() {
    auto home = std::getenv("HOME");
    if (!home) return "";
    return std::string(home) + "/.config/Metin2AssetStudioCpp";
}
#endif

static std::string autoSavePath() {
    return getAppDataPath() + "/autosave.json";
}

static json emitterToJson(const Emitter& e) {
    json j;
    j["uid"] = e.uid;
    j["name"] = e.name;
    j["visible"] = e.visible;
    j["color"] = e.color;

    switch (e.blend) {
        case BlendType::Alpha: j["blend"] = "alpha"; break;
        case BlendType::Add: j["blend"] = "add"; break;
        case BlendType::Modulate: j["blend"] = "modulate"; break;
    }
    switch (e.shape) {
        case ShapeType::Point: j["shape"] = "point"; break;
        case ShapeType::Cone: j["shape"] = "cone"; break;
        case ShapeType::Box: j["shape"] = "box"; break;
        case ShapeType::Sphere: j["shape"] = "sphere"; break;
        case ShapeType::SphereVol: j["shape"] = "spherevol"; break;
        case ShapeType::Ring: j["shape"] = "ring"; break;
        case ShapeType::Disc: j["shape"] = "disc"; break;
    }

    j["rate"] = e.rate;
    j["burst"] = e.burst;
    j["life"] = e.life;
    j["lifeRnd"] = e.lifeRnd;
    j["maxP"] = e.maxP;
    j["loop"] = e.loop;
    j["cycle"] = e.cycle;
    j["delay"] = e.delay;
    j["speed"] = e.speed;
    j["speedRnd"] = e.speedRnd;
    j["spread"] = e.spread;
    j["dirYaw"] = e.dirYaw;
    j["dirPitch"] = e.dirPitch;
    j["gravity"] = e.gravity;
    j["windX"] = e.windX;
    j["windZ"] = e.windZ;
    j["drag"] = e.drag;
    j["turb"] = e.turb;
    j["turbFreq"] = e.turbFreq;
    j["sizeX"] = e.sizeX;
    j["sizeRnd"] = e.sizeRnd;
    j["sizeY"] = e.sizeY;
    j["sizeNonUniform"] = e.sizeNonUniform;
    j["spin"] = e.spin;
    j["spinRnd"] = e.spinRnd;
    j["initRot"] = e.initRot;
    j["initRotRnd"] = e.initRotRnd;
    j["velStretch"] = e.velStretch;
    j["builtinTex"] = e.builtinTex;
    if (e.texFile) j["texFile"] = *e.texFile;
    if (e.texDataUrl) j["texDataUrl"] = *e.texDataUrl;
    j["texPath"] = e.texPath;
    j["sheetCols"] = e.sheetCols;
    j["sheetRows"] = e.sheetRows;
    switch (e.uvAnim) {
        case UVAnimType::Loop: j["uvAnim"] = "loop"; break;
        case UVAnimType::Once: j["uvAnim"] = "once"; break;
        case UVAnimType::Rand: j["uvAnim"] = "rand"; break;
        case UVAnimType::Life: j["uvAnim"] = "life"; break;
    }
    j["animFPS"] = e.animFPS;
    switch (e.coordType) {
        case CoordType::World: j["coordType"] = "WORLD"; break;
        case CoordType::Local: j["coordType"] = "LOCAL"; break;
    }
    switch (e.rotType) {
        case RotType::None: j["rotType"] = "NONE"; break;
        case RotType::Random: j["rotType"] = "RANDOM"; break;
        case RotType::Spin: j["rotType"] = "SPIN"; break;
    }
    j["uvScrollX"] = e.uvScrollX;
    j["uvScrollY"] = e.uvScrollY;
    j["shapeRadius"] = e.shapeRadius;
    j["groundBounce"] = e.groundBounce;
    j["bounceFac"] = e.bounceFac;
    j["attractorStr"] = e.attractorStr;
    j["attractorY"] = e.attractorY;
    switch (e.emitSurface) {
        case EmitterSurfaceType::None: j["emitSurface"] = "none"; break;
        case EmitterSurfaceType::Surface: j["emitSurface"] = "surface"; break;
        case EmitterSurfaceType::Edge: j["emitSurface"] = "edge"; break;
    }
    switch (e.colorMod) {
        case ColorModType::Multiply: j["colorMod"] = "multiply"; break;
        case ColorModType::Add: j["colorMod"] = "add"; break;
    }

    auto curveToJson = [](const std::vector<CurvePoint>& pts) -> json {
        json arr = json::array();
        for (const auto& pt : pts) {
            arr.push_back({{"t", pt.t}, {"v", pt.v}});
        }
        return arr;
    };
    j["sizeCurve"] = curveToJson(e.sizeCurve);
    j["alphaCurve"] = curveToJson(e.alphaCurve);
    j["speedCurve"] = curveToJson(e.speedCurve);
    j["spinCurve"] = curveToJson(e.spinCurve);

    auto colorKeyToJson = [](const std::vector<ColorKey>& keys) -> json {
        json arr = json::array();
        for (const auto& k : keys) {
            arr.push_back({{"t", k.t}, {"r", k.r}, {"g", k.g}, {"b", k.b}, {"a", k.a}});
        }
        return arr;
    };
    j["colorKeys"] = colorKeyToJson(e.colorKeys);

    return j;
}

static Emitter emitterFromJson(const json& j) {
    Emitter e;
    e.uid = j.value("uid", (std::uint64_t)0);
    e.name = j.value("name", "");
    e.visible = j.value("visible", true);
    e.color = j.value("color", "#4fc3f7");

    auto blendS = j.value("blend", "alpha");
    if (blendS == "add") e.blend = BlendType::Add;
    else if (blendS == "modulate") e.blend = BlendType::Modulate;
    else e.blend = BlendType::Alpha;

    auto shapeS = j.value("shape", "point");
    if (shapeS == "cone") e.shape = ShapeType::Cone;
    else if (shapeS == "box") e.shape = ShapeType::Box;
    else if (shapeS == "sphere") e.shape = ShapeType::Sphere;
    else if (shapeS == "spherevol") e.shape = ShapeType::SphereVol;
    else if (shapeS == "ring") e.shape = ShapeType::Ring;
    else if (shapeS == "disc") e.shape = ShapeType::Disc;
    else e.shape = ShapeType::Point;

    e.rate = j.value("rate", 10.0);
    e.burst = j.value("burst", 0);
    e.life = j.value("life", 1.5);
    e.lifeRnd = j.value("lifeRnd", 0.3);
    e.maxP = j.value("maxP", 50);
    e.loop = j.value("loop", true);
    e.cycle = j.value("cycle", 0.0);
    e.delay = j.value("delay", 0.0);
    e.speed = j.value("speed", 150.0);
    e.speedRnd = j.value("speedRnd", 50.0);
    e.spread = j.value("spread", 0.0);
    e.dirYaw = j.value("dirYaw", 0.0);
    e.dirPitch = j.value("dirPitch", 0.0);
    e.gravity = j.value("gravity", 0.0);
    e.windX = j.value("windX", 0.0);
    e.windZ = j.value("windZ", 0.0);
    e.drag = j.value("drag", 0.0);
    e.turb = j.value("turb", 0.0);
    e.turbFreq = j.value("turbFreq", 0.0);
    e.sizeX = j.value("sizeX", 8.0);
    e.sizeRnd = j.value("sizeRnd", 0.0);
    e.sizeY = j.value("sizeY", 8.0);
    e.sizeNonUniform = j.value("sizeNonUniform", false);
    e.spin = j.value("spin", 0.0);
    e.spinRnd = j.value("spinRnd", 0.0);
    e.initRot = j.value("initRot", 0.0);
    e.initRotRnd = j.value("initRotRnd", 0.0);
    e.velStretch = j.value("velStretch", 0.0);
    e.builtinTex = j.value("builtinTex", "");
    if (j.contains("texFile") && !j["texFile"].is_null()) e.texFile = j["texFile"];
    if (j.contains("texDataUrl") && !j["texDataUrl"].is_null()) e.texDataUrl = j["texDataUrl"];
    e.texPath = j.value("texPath", "");
    e.sheetCols = j.value("sheetCols", 1);
    e.sheetRows = j.value("sheetRows", 1);

    auto uvS = j.value("uvAnim", "loop");
    if (uvS == "once") e.uvAnim = UVAnimType::Once;
    else if (uvS == "rand") e.uvAnim = UVAnimType::Rand;
    else if (uvS == "life") e.uvAnim = UVAnimType::Life;
    else e.uvAnim = UVAnimType::Loop;

    e.animFPS = j.value("animFPS", 30.0);

    auto coordS = j.value("coordType", "WORLD");
    e.coordType = (coordS == "LOCAL") ? CoordType::Local : CoordType::World;

    auto rotS = j.value("rotType", "RANDOM");
    if (rotS == "NONE") e.rotType = RotType::None;
    else if (rotS == "SPIN") e.rotType = RotType::Spin;
    else e.rotType = RotType::Random;

    e.uvScrollX = j.value("uvScrollX", 0.0);
    e.uvScrollY = j.value("uvScrollY", 0.0);
    e.shapeRadius = j.value("shapeRadius", 0.35);
    e.groundBounce = j.value("groundBounce", false);
    e.bounceFac = j.value("bounceFac", 0.4);
    e.attractorStr = j.value("attractorStr", 0.0);
    e.attractorY = j.value("attractorY", 0.5);

    auto surfaceS = j.value("emitSurface", "none");
    if (surfaceS == "surface") e.emitSurface = EmitterSurfaceType::Surface;
    else if (surfaceS == "edge") e.emitSurface = EmitterSurfaceType::Edge;
    else e.emitSurface = EmitterSurfaceType::None;

    auto colorModS = j.value("colorMod", "multiply");
    e.colorMod = (colorModS == "add") ? ColorModType::Add : ColorModType::Multiply;

    auto curveFromJson = [](const json& arr) -> std::vector<CurvePoint> {
        std::vector<CurvePoint> result;
        if (!arr.is_array()) return result;
        for (const auto& item : arr) {
            result.push_back({item.value("t", 0.0), item.value("v", 0.0)});
        }
        return result;
    };
    e.sizeCurve = curveFromJson(j.value("sizeCurve", json::array()));
    e.alphaCurve = curveFromJson(j.value("alphaCurve", json::array()));
    e.speedCurve = curveFromJson(j.value("speedCurve", json::array()));
    e.spinCurve = curveFromJson(j.value("spinCurve", json::array()));

    if (j.contains("colorKeys") && j["colorKeys"].is_array()) {
        for (const auto& item : j["colorKeys"]) {
            ColorKey ck;
            ck.t = item.value("t", 0.0);
            ck.r = item.value("r", 1.0);
            ck.g = item.value("g", 1.0);
            ck.b = item.value("b", 1.0);
            ck.a = item.value("a", 1.0);
            e.colorKeys.push_back(ck);
        }
    }

    return e;
}

std::string ProjectManager::exportToJson(const std::vector<Emitter>& emitters, const AppSettings& settings, const std::string& name) {
    json doc;
    doc["version"] = "2.0.0";
    doc["name"] = name;
    doc["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();

    json s;
    s["theme"] = settings.theme;
    s["showPerf"] = settings.showPerf;
    s["showDebug"] = settings.showDebug;
    s["particleDebug"] = settings.particleDebug;
    s["autoPlay"] = settings.autoPlay;
    s["hiPrec"] = settings.hiPrec;
    s["exportPrec"] = settings.exportPrec;
    s["language"] = settings.language;
    doc["settings"] = s;

    json emittersArr = json::array();
    for (const auto& e : emitters) {
        emittersArr.push_back(emitterToJson(e));
    }
    doc["emitters"] = emittersArr;
    doc["dependencies"] = json::array();

    return doc.dump(2);
}

bool ProjectManager::importFromJson(const std::string& jsonStr, std::vector<Emitter>& emitters, AppSettings& settings, std::string& name) {
    try {
        auto j = json::parse(jsonStr);

        auto ver = j.value("version", "");
        if (ver.empty()) return false;
        if (!j.contains("emitters") || !j["emitters"].is_array()) return false;

        name = j.value("name", "Untitled");

        auto s = j.value("settings", json::object());
        settings.theme = s.value("theme", "dark");
        settings.showPerf = s.value("showPerf", false);
        settings.showDebug = s.value("showDebug", false);
        settings.particleDebug = s.value("particleDebug", false);
        settings.autoPlay = s.value("autoPlay", true);
        settings.hiPrec = s.value("hiPrec", false);
        settings.exportPrec = s.value("exportPrec", 4);
        settings.language = s.value("language", "en");

        emitters.clear();
        for (const auto& item : j["emitters"]) {
            emitters.push_back(emitterFromJson(item));
        }

        return true;
    } catch (...) {
        return false;
    }
}

bool ProjectManager::autoSave(const std::vector<Emitter>& emitters, const AppSettings& settings, const std::string& name) {
    try {
        auto path = getAppDataPath();
        if (path.empty()) return false;

        auto dir = path;
        std::string cmd = "if not exist \"" + dir + "\" mkdir \"" + dir + "\"";
        system(cmd.c_str());

        auto content = exportToJson(emitters, settings, name);
        std::ofstream out(autoSavePath());
        if (!out.is_open()) return false;
        out << content;
        out.close();
        return true;
    } catch (...) {
        return false;
    }
}

bool ProjectManager::loadAutoSave(std::vector<Emitter>& emitters, AppSettings& settings, std::string& name) {
    try {
        std::ifstream in(autoSavePath());
        if (!in.is_open()) return false;
        std::string content((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
        in.close();
        return importFromJson(content, emitters, settings, name);
    } catch (...) {
        return false;
    }
}
